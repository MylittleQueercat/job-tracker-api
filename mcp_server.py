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


if __name__ == "__main__":
    mcp.run()
