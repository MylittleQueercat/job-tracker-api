from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date as date_type

VALID_STATUSES = {"applied", "phone_screen", "technical_test", "interview", "final_interview", "offer", "rejected", "withdrawn", "ghosted"}
VALID_JOB_TYPES = {"internship", "full-time", "contract"}

class InterviewCreate(BaseModel):
    round: int
    interview_type: Optional[str] = None
    date: Optional[date_type] = None
    notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    job_id: int
    round: int
    interview_type: Optional[str]
    date: Optional[date_type]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    company: str
    position: str
    status: str = "applied"
    location: Optional[str] = None
    job_type: Optional[str] = None
    source: Optional[str] = None
    deadline: Optional[date_type] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v

class JobUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    source: Optional[str] = None
    deadline: Optional[date_type] = None
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v

class JobResponse(BaseModel):
    id: int
    company: str
    position: str
    status: str
    location: Optional[str]
    job_type: Optional[str]
    source: Optional[str]
    deadline: Optional[date_type]
    notes: Optional[str]
    created_at: datetime
    interviews: list[InterviewResponse] = []

    class Config:
        from_attributes = True