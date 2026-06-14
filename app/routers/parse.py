import os
import json
import asyncio
import time
from datetime import datetime, timezone
from google import genai
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.routers.jobs import get_current_user
from app.database import get_db
from sqlalchemy.orm import Session
import re

_langfuse = None
try:
    from langfuse import Langfuse
    _langfuse = Langfuse(
        public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
        secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
        host=os.getenv("LANGFUSE_HOST"),
    )
except Exception:
    pass

def extract_json(text: str) -> dict:
    """Robustly extract JSON from Gemini response"""
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Strip markdown fences
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    # Find first { } block
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise json.JSONDecodeError("No JSON found", text, 0)

async def call_gemini(prompt: str, api_key: str) -> dict:
    model_name = "gemini-2.5-flash-lite"
    client = genai.Client(api_key=api_key)
    start_time = datetime.now(timezone.utc)
    t0 = time.perf_counter()
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            break
        except Exception as e:
            if attempt == 0 and "503" in str(e):
                await asyncio.sleep(2)
            else:
                raise
    end_time = datetime.now(timezone.utc)
    latency_ms = (time.perf_counter() - t0) * 1000

    try:
        if _langfuse:
            trace = _langfuse.trace(name="call_gemini")
            trace.generation(
                name="gemini-generate",
                model=model_name,
                input=prompt,
                output=response.text,
                start_time=start_time,
                end_time=end_time,
                metadata={"latency_ms": round(latency_ms)},
            )
            _langfuse.flush()
    except Exception:
        pass

    return extract_json(response.text)

router = APIRouter()

# Request body schema


class ParseRequest(BaseModel):
    text: str
    user_api_key: Optional[str] = None

# Response schema


class ParsedJob(BaseModel):
    company: str | None = None
    title: str | None = None
    location: str | None = None
    job_type: str | None = None


@router.post("/parse-jd", response_model=ParsedJob)
async def parse_job_description(
    body: ParseRequest,
    current_user=Depends(get_current_user)
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    prompt = f"""
Extract the following fields from the job description below.
Return ONLY a valid JSON object with these exact keys: company, title, location, job_type.
- job_type must be one of: "full-time", "part-time", "internship", "contract", or null
- If a field cannot be found, use null
- Do not include any explanation or markdown, only the JSON object

Job description:
{body.text[:3000]}
"""

    try:
        parsed = await call_gemini(prompt, body.user_api_key or os.getenv("GEMINI_API_KEY"))
        return ParsedJob(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response as JSON")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=429, detail=f"Rate limited: {error_msg}")
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {error_msg}")
    
    
# Request schema for follow-up email generation
class FollowUpRequest(BaseModel):
    job_id: Optional[int] = None
    company: str
    position: str
    created_at: str
    language: str = "fr"  # "fr" or "en"
    user_api_key: Optional[str] = None

# Response schema
class FollowUpEmail(BaseModel):
    subject: str
    body: str

@router.post("/generate-followup", response_model=FollowUpEmail)
async def generate_followup_email(
    body: FollowUpRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    days_since = int((datetime.utcnow() - datetime.fromisoformat(body.created_at.replace('Z', ''))).days)

    if body.language == "fr":
        prompt = f"""
Tu es un assistant de recherche d'emploi. Génère un email de relance professionnel et concis en français.

Contexte:
- Entreprise: {body.company}
- Poste: {body.position}
- Candidature envoyée il y a {days_since} jours

Retourne UNIQUEMENT un objet JSON valide avec ces clés exactes: "subject", "body".
- "subject": objet de l'email (court, professionnel)
- "body": corps de l'email (3-4 phrases max, ton professionnel mais chaleureux, pas de [placeholders])
Ne retourne rien d'autre, pas de markdown, juste le JSON.
"""
    else:
        prompt = f"""
You are a job search assistant. Generate a professional and concise follow-up email in English.

Context:
- Company: {body.company}
- Position: {body.position}
- Application sent {days_since} days ago

Return ONLY a valid JSON object with these exact keys: "subject", "body".
- "subject": email subject line (short, professional)
- "body": email body (3-4 sentences max, professional but warm tone, no [placeholders])
Return nothing else, no markdown, just the JSON.
"""

    try:
        parsed = await call_gemini(prompt, body.user_api_key or os.getenv("GEMINI_API_KEY"))
        if body.job_id is not None:
            from app.models.job import Job
            job = db.query(Job).filter(Job.id == body.job_id, Job.user_id == current_user.id).first()
            if job:
                job.followup_email = json.dumps(parsed)
                db.commit()
        return FollowUpEmail(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response as JSON")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Email generation failed: {error_msg}")
    
    

# Request schema for company brief generation
class CompanyBriefRequest(BaseModel):
    job_id: int
    company: str
    position: str
    language: str = "fr"
    user_api_key: Optional[str] = None

# Response schema
class CompanyBrief(BaseModel):
    what_they_do: str
    company_stage: str
    likely_technical_topics: str
    question_to_ask: str
    market_position: str

@router.post("/company-brief", response_model=CompanyBrief)
async def generate_company_brief(
    body: CompanyBriefRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if body.language == "zh":
        prompt = f"""
你是一位法国求职面试准备助手。请为以下职位生成简洁的公司简报。

公司：{body.company}
职位：{body.position}

只返回一个有效的JSON对象，包含以下键：「what_they_do」、「company_stage」、「likely_technical_topics」、「question_to_ask」、「market_position」。
- "what_they_do"：1-2句话介绍公司及其主要产品
- "company_stage"：初创/成长期/大公司/上市公司 + 1句背景说明
- "likely_technical_topics"：该职位可能考察的3-4个技术方向，用 " | " 分隔
- "question_to_ask"：一个可以问面试官的好问题，体现你做了充分准备
- "market_position"：在法国市场的定位及1-2个主要竞争对手
不要返回任何其他内容，不要markdown，只返回JSON。
"""
    elif body.language == "en":
        prompt = f"""
You are an interview preparation assistant for tech jobs in France. Generate a concise company brief.

Company: {body.company}
Position: {body.position}

Return ONLY a valid JSON object with these exact keys: "what_they_do", "company_stage", "likely_technical_topics", "question_to_ask", "market_position".
- "what_they_do": 1-2 sentences, what the company does and their main product
- "company_stage": one of "startup", "scale-up", "large company", "public company" + 1 sentence context
- "likely_technical_topics": 3-4 likely technical interview topics for this position, separated by " | "
- "question_to_ask": one smart question the candidate can ask the interviewer that shows preparation
- "market_position": their position in the French market and 1-2 main competitors
Return nothing else, no markdown, just the JSON.
"""
    else:  # fr
        prompt = f"""
Tu es un assistant de préparation aux entretiens tech en France. Génère un brief entreprise concis.

Entreprise : {body.company}
Poste : {body.position}

Retourne UNIQUEMENT un objet JSON valide avec ces clés exactes : "what_they_do", "company_stage", "likely_technical_topics", "question_to_ask", "market_position".
- "what_they_do" : 1-2 phrases sur ce que fait l'entreprise et son produit principal
- "company_stage" : startup / scale-up / grande entreprise / entreprise cotée + 1 phrase de contexte
- "likely_technical_topics" : 3-4 sujets techniques probables pour ce poste, séparés par " | "
- "question_to_ask" : une question pertinente à poser à l'intervieweur qui montre ta préparation
- "market_position" : leur position sur le marché français et 1-2 concurrents principaux
Ne retourne rien d'autre, pas de markdown, juste le JSON.
"""

    try:
        parsed = await call_gemini(prompt, body.user_api_key or os.getenv("GEMINI_API_KEY"))
        # Save brief to job in database
        from app.models.job import Job
        import json as json_module
        job = db.query(Job).filter(Job.id == body.job_id, Job.user_id == current_user.id).first()
        if job:
            job.company_brief = json_module.dumps(parsed)
            db.commit()
        return CompanyBrief(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response as JSON")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {error_msg}")


class MatchScoreRequest(BaseModel):
    job_id: int
    resume_id: Optional[int] = None
    language: str = "fr"
    user_api_key: Optional[str] = None


class MatchScoreResponse(BaseModel):
    score: int
    strengths: list[str]
    weaknesses: list[str]
    ats_keywords_missing: list[str]
    recommendation: str


@router.post("/match-score", response_model=MatchScoreResponse)
async def match_score(
    body: MatchScoreRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.job import Job
    from app.models.resume import Resume

    job = db.query(Job).filter(Job.id == body.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if body.resume_id is not None:
        resume = db.query(Resume).filter(Resume.id == body.resume_id, Resume.user_id == current_user.id).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    else:
        resume = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_default == True).first()
        if not resume:
            resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")

    if body.language == "en":
        prompt = f"""
You are an ATS and recruitment expert. Analyze how well the resume matches the job description.

Job: {job.position} at {job.company}
Job description / notes:
{(job.notes or "").strip() or "(no details available)"}

Resume ({resume.name}):
{resume.content[:4000]}

Return ONLY a valid JSON object with these exact keys:
- "score": integer 0-100 (overall match score)
- "strengths": list of exactly 3 short strings (what matches well)
- "weaknesses": list of exactly 2 short strings (main gaps)
- "ats_keywords_missing": list of strings (important keywords from the job not found in the resume)
- "recommendation": one sentence of actionable advice to improve the match

No markdown, no explanation, just the JSON.
"""
    else:
        prompt = f"""
Tu es un expert en ATS et recrutement. Analyse dans quelle mesure le CV correspond à l'offre d'emploi.

Poste : {job.position} chez {job.company}
Description / notes du poste :
{(job.notes or "").strip() or "(pas de détails disponibles)"}

CV ({resume.name}) :
{resume.content[:4000]}

Retourne UNIQUEMENT un objet JSON valide avec ces clés exactes :
- "score" : entier 0-100 (score global de correspondance)
- "strengths" : liste de exactement 3 courtes chaînes (ce qui correspond bien)
- "weaknesses" : liste de exactement 2 courtes chaînes (les principaux manques)
- "ats_keywords_missing" : liste de chaînes (mots-clés importants du poste absents du CV)
- "recommendation" : une phrase de conseil actionnable pour améliorer la correspondance

Pas de markdown, pas d'explication, juste le JSON.
"""

    try:
        parsed = await call_gemini(prompt, body.user_api_key or os.getenv("GEMINI_API_KEY"))
        job.match_score = json.dumps(parsed)
        db.commit()
        return MatchScoreResponse(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response as JSON")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Match score failed: {error_msg}")