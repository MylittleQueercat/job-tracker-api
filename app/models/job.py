from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False)
    status = Column(String, default="applied")
    location = Column(String, nullable=True)
    job_type = Column(String, nullable=True)  # internship / full-time
    source = Column(String, nullable=True)    # LinkedIn / WttJ / direct
    deadline = Column(Date, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    interviews = relationship("Interview", back_populates="job", cascade="all, delete")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    round = Column(Integer, nullable=False)
    interview_type = Column(String, nullable=True)  # phone / technical / hr / final
    date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    job = relationship("Job", back_populates="interviews")