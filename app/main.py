from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth, jobs

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Tracker API",
    description="Track your job applications — built with FastAPI + PostgreSQL",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(jobs.router)

@app.get("/")
def root():
    return {"message": "Job Tracker API is running"}