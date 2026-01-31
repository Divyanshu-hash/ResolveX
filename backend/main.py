"""ResolveX Backend - FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from database import engine, Base
from routers import auth, complaints, evidence, feedback, analytics, users
from services.escalation import run_escalation_job

# Create tables from models (optional; use MySQL schema.sql for fresh DB)
# Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ESCALATION_ENABLED:
        scheduler.add_job(run_escalation_job, "interval", hours=1, id="escalation")
        scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="ResolveX API",
    description="Complaint / Issue Management System - Enterprise Grievance Portal",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "ResolveX API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
