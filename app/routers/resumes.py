from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
import auth

router = APIRouter(prefix="/resumes", tags=["Resumes"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

MAX_RESUMES = 5


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


class ResumeCreate(BaseModel):
    name: str
    content: str


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    name: str
    content: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[ResumeResponse])
def get_resumes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()


@router.post("/", response_model=ResumeResponse, status_code=201)
def create_resume(resume: ResumeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    if count >= MAX_RESUMES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_RESUMES} resume versions allowed")
    db_resume = Resume(user_id=current_user.id, name=resume.name, content=resume.content)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not db_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(db_resume)
    db.commit()
    return {"message": f"Resume {resume_id} deleted"}


@router.patch("/{resume_id}/default", response_model=ResumeResponse)
def set_default_resume(resume_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not db_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_default == True).update({"is_default": False})
    db_resume.is_default = True
    db.commit()
    db.refresh(db_resume)
    return db_resume
