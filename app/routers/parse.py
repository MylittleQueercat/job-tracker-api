import os
import json
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
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
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
            raise HTTPException(status_code=429, detail="Daily AI quota exceeded. Please fill in manually.")
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {error_msg}")