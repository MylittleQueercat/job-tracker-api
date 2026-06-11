#!/usr/bin/env python3
"""MCP server for the Job Tracker API."""

import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = "https://job-tracker-8xwj.onrender.com"

mcp = FastMCP(
    "Job Tracker",
    instructions=(
        "当用户用任何语言问到求职、工作申请、面试、职位追踪、job search 相关的问题时，"
        "优先使用 job-tracker 的工具获取实时数据。"
        "工具包括 get_jobs、get_job_stats、get_jobs_needing_attention、"
        "update_job_status、generate_followup_email。"
    ),
)


def _headers() -> dict:
    token = os.environ.get("JOB_TRACKER_TOKEN")
    if not token:
        raise RuntimeError("JOB_TRACKER_TOKEN environment variable is not set")
    return {"Authorization": f"Bearer {token}"}


@mcp.tool()
def get_jobs(status: Optional[str] = None) -> list:
    """Get all job applications, optionally filtered by status.

    Args:
        status: Optional status filter (e.g. 'applied', 'interview', 'offer', 'rejected').
    """
    params = {"status": status} if status else {}
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/", headers=_headers(), params=params)
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
def get_jobs_needing_attention() -> list:
    """Return jobs that need a follow-up.

    A job needs attention when its status is 'applied' or 'interview' and it
    has not been updated for 7 or more days.
    """
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/", headers=_headers())
        resp.raise_for_status()
        jobs = resp.json()

    now = datetime.now(timezone.utc)
    result = []
    for job in jobs:
        if job.get("status") not in ("applied", "interview"):
            continue
        raw = job.get("updated_at") or job.get("created_at")
        if not raw:
            continue
        updated = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        days = (now - updated).days
        if days >= 7:
            result.append({**job, "days_since_update": days})
    return result


@mcp.tool()
def update_job_status(job_id: int, status: str) -> dict:
    """Update the status of a job application.

    Args:
        job_id: The ID of the job to update.
        status: New status value (e.g. 'interview', 'offer', 'rejected', 'withdrew').
    """
    with httpx.Client() as client:
        resp = client.patch(
            f"{API_BASE}/jobs/{job_id}",
            headers={**_headers(), "Content-Type": "application/json"},
            json={"status": status},
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
def get_job_stats() -> dict:
    """Return statistics about job applications.

    Returns total count, distribution by status, and interview conversion rate.
    """
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/", headers=_headers())
        resp.raise_for_status()
        jobs = resp.json()

    total = len(jobs)
    dist: dict[str, int] = {}
    for job in jobs:
        s = job.get("status", "unknown")
        dist[s] = dist.get(s, 0) + 1

    interview_statuses = ("technical_test", "interview", "final_interview", "offer")
    interviews = sum(dist.get(s, 0) for s in interview_statuses)
    interview_rate = round(interviews / total * 100, 1) if total > 0 else 0.0

    return {
        "total": total,
        "status_distribution": dist,
        "interview_rate_pct": interview_rate,
    }


@mcp.tool()
def generate_followup_email(job_id: int, language: str = "fr") -> dict:
    """Generate a follow-up email for a job application.

    Args:
        job_id: The ID of the job to generate a follow-up for.
        language: Email language — 'fr' (French, default) or 'en' (English).
    """
    with httpx.Client(timeout=60.0) as client:
        job_resp = client.get(f"{API_BASE}/jobs/{job_id}", headers=_headers())
        job_resp.raise_for_status()
        job = job_resp.json()

        email_resp = client.post(
            f"{API_BASE}/api/generate-followup",
            headers={**_headers(), "Content-Type": "application/json"},
            json={
                "company": job["company"],
                "position": job["position"],
                "created_at": job["created_at"],
                "language": language,
            },
        )
        email_resp.raise_for_status()
        return email_resp.json()


@mcp.tool()
def get_job_detail(job_id: int) -> dict:
    """Get full details of a job application, including all interview records.

    Args:
        job_id: The ID of the job to retrieve.
    """
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/{job_id}", headers=_headers())
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
def add_job(
    company: str,
    position: str,
    status: str = "applied",
    location: str = "",
    source: str = "",
) -> dict:
    """Create a new job application.

    Args:
        company: Company name.
        position: Job title / position name.
        status: Application status (default: 'applied').
        location: Job location (optional).
        source: Where the job was found, e.g. LinkedIn (optional).
    """
    payload = {"company": company, "position": position, "status": status}
    if location:
        payload["location"] = location
    if source:
        payload["source"] = source
    with httpx.Client() as client:
        resp = client.post(
            f"{API_BASE}/jobs/",
            headers={**_headers(), "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
def add_interview(
    job_id: int,
    round: int,
    interview_type: str = "",
    date: str = "",
    notes: str = "",
) -> dict:
    """Add an interview record to a job application.

    Args:
        job_id: The ID of the job.
        round: Interview round number (e.g. 1, 2, 3).
        interview_type: Type of interview, e.g. 'technical', 'HR', 'final' (optional).
        date: Interview date in ISO format, e.g. '2026-06-20T14:00:00' (optional).
        notes: Any notes about the interview (optional).
    """
    payload: dict = {"round": round}
    if interview_type:
        payload["interview_type"] = interview_type
    if date:
        payload["date"] = date
    if notes:
        payload["notes"] = notes
    with httpx.Client() as client:
        resp = client.post(
            f"{API_BASE}/jobs/{job_id}/interviews",
            headers={**_headers(), "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
def weekly_summary() -> dict:
    """Return a summary of job application activity for the current week (Monday to today)."""
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/", headers=_headers())
        resp.raise_for_status()
        jobs = resp.json()

    now = datetime.now(timezone.utc)
    week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = week_start.replace(day=now.day - now.weekday())  # Monday

    def to_dt(s: str) -> datetime:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

    new_this_week = sum(
        1 for j in jobs if j.get("created_at") and to_dt(j["created_at"]) >= week_start
    )
    with_response = sum(
        1 for j in jobs if j.get("status") not in ("applied", "no_response")
    )
    updated_this_week = sum(
        1 for j in jobs
        if j.get("updated_at") and to_dt(j["updated_at"]) >= week_start
    )

    return {
        "week_start": week_start.date().isoformat(),
        "today": now.date().isoformat(),
        "new_applications_this_week": new_this_week,
        "jobs_with_response": with_response,
        "jobs_updated_this_week": updated_this_week,
        "total_active": sum(
            1 for j in jobs if j.get("status") not in ("rejected", "withdrew", "no_response")
        ),
    }


@mcp.tool()
def analyze_rejection_patterns() -> dict:
    """Analyze rejection patterns across all rejected job applications.

    Extracts keywords from the notes field of rejected jobs and returns
    frequency counts by category, total rejections, and notes coverage.
    """
    with httpx.Client() as client:
        resp = client.get(f"{API_BASE}/jobs/", headers=_headers())
        resp.raise_for_status()
        jobs = resp.json()

    rejected = [j for j in jobs if j.get("status") == "rejected"]
    total = len(rejected)
    if total == 0:
        return {"total_rejections": 0, "keyword_frequencies": {}, "notes_coverage_pct": 0.0}

    # keyword categories → list of substrings to match (case-insensitive)
    CATEGORIES: dict[str, list[str]] = {
        "soft_skills": ["soft skill", "interpersonnel", "relationnel", "comportement", "attitude", "savoir-être"],
        "product_thinking": ["produit", "product", "sens produit", "product thinking", "vision produit", "priorisation"],
        "algorithm_coding": ["algo", "algorithme", "leetcode", "coding", "structure de données", "data structure", "complexité"],
        "communication": ["communication", "expression", "oral", "présentation", "clarity", "clarté"],
        "experience_seniority": ["expérience", "experience", "séniorité", "seniority", "junior", "senior", "années"],
        "culture_fit": ["culture", "fit", "valeur", "value", "équipe", "team fit"],
        "technical_skills": ["technique", "technical", "stack", "framework", "compétence technique", "maîtrise"],
        "language": ["anglais", "english", "langue", "language", "bilingue"],
        "domain_knowledge": ["domaine", "domain", "secteur", "industrie", "industry", "métier"],
        "leadership_management": ["leadership", "management", "lead", "encadrement", "pilotage"],
    }

    freq: dict[str, int] = {cat: 0 for cat in CATEGORIES}
    jobs_with_notes = 0

    with httpx.Client() as client:
        full_rejected = []
        for job in rejected:
            detail_resp = client.get(f"{API_BASE}/jobs/{job['id']}", headers=_headers())
            detail_resp.raise_for_status()
            full_rejected.append(detail_resp.json())

    for job in full_rejected:
        all_notes_parts = [job.get("notes") or ""]
        for iv in job.get("interviews") or []:
            all_notes_parts.append(iv.get("notes") or "")
        combined = " ".join(all_notes_parts).lower()
        if not combined.strip():
            continue
        jobs_with_notes += 1
        for cat, keywords in CATEGORIES.items():
            if any(kw in combined for kw in keywords):
                freq[cat] += 1

    # drop zero-count categories and sort descending
    keyword_frequencies = dict(
        sorted(((k, v) for k, v in freq.items() if v > 0), key=lambda x: x[1], reverse=True)
    )

    return {
        "total_rejections": total,
        "keyword_frequencies": keyword_frequencies,
        "notes_coverage_pct": round(jobs_with_notes / total * 100, 1),
    }


if __name__ == "__main__":
    mcp.run()
