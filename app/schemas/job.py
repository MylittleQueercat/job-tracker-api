from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

VALID_STATUSES = {"applied", "interview", "offer", "rejected"}

class JobCreate(BaseModel):
    company: str
    position: str
    status: str = "applied"
    url: Optional[str] = None
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
    url: Optional[str] = None
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
    url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True