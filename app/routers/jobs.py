from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.schemas.job import JobCreate, JobUpdate, JobResponse
import auth

router = APIRouter(prefix="/jobs", tags=["Jobs"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        username = auth.decode_token(token)
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/", response_model=list[JobResponse])
def get_jobs(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Job).filter(Job.user_id == current_user.id)
    if status:
        query = query.filter(Job.status == status)
    return query.order_by(Job.created_at.desc()).all()

@router.get("/{id}", response_model=JobResponse)
def get_job(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = Job(**job.model_dump(), user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.patch("/{id}", response_model=JobResponse)
def update_job(id: int, job: JobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in job.model_dump(exclude_unset=True).items():
        setattr(db_job, field, value)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/{id}")
def delete_job(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_job = db.query(Job).filter(Job.id == id, Job.user_id == current_user.id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(db_job)
    db.commit()
    return {"message": f"Job {id} deleted"}