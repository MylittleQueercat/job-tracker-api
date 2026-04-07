import os
import json
import asyncio
from datetime import datetime
from google import genai
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.routers.jobs import get_current_user

router = APIRouter()

# Request body schema


class ParseRequest(BaseModel):
    text: str

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
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        # Retry once on 503 (Gemini temporary overload)
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                break
            except Exception as e:
                if attempt == 0 and "503" in str(e):
                    import time
                    await asyncio.sleep(2)
                else:
                    raise
        raw = response.text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        parsed = json.loads(raw)
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
    company: str
    position: str
    created_at: str
    language: str = "fr"  # "fr" or "en"

# Response schema
class FollowUpEmail(BaseModel):
    subject: str
    body: str

@router.post("/generate-followup", response_model=FollowUpEmail)
async def generate_followup_email(
    body: FollowUpRequest,
    current_user=Depends(get_current_user)
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
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                break
            except Exception as e:
                if attempt == 0 and "503" in str(e):
                    await asyncio.sleep(2)
                else:
                    raise
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
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
    current_user=Depends(get_current_user)
):
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

    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                break
            except Exception as e:
                if attempt == 0 and "503" in str(e):
                    await asyncio.sleep(2)
                else:
                    raise
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
        # Save brief to job in database
        from app.database import SessionLocal
        from app.models.job import Job
        import json as json_module
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == body.job_id, Job.user_id == current_user.id).first()
            if job:
                job.company_brief = json_module.dumps(parsed)
                db.commit()
        finally:
            db.close()
        return CompanyBrief(**parsed)

    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Could not parse Gemini response as JSON")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded.")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {error_msg}")