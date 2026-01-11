from fastapi import FastAPI
from app.api.endpoints import analytics, learning, ingestion, tutor, progress
from app.api.endpoints import team_analytics, quiz, knowledge_base, playbooks, first_pr
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CodeFlow - AI Onboarding Intelligence Platform",
    description="Enterprise-grade AI-driven codebase onboarding system with team analytics, knowledge verification, and accelerated first contributions",
    version="1.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

# Configure CORS based on environment
allowed_origins = [
    "http://localhost:5173",      # Local dev - Vite
    "http://localhost:3000",      # Local dev - alternate
    "http://localhost:8000",      # Local dev - backend
]

# Add production URLs from environment
if frontend_url := os.getenv("FRONTEND_URL_PROD"):
    allowed_origins.append(frontend_url)

# Allow all Vercel preview deployments
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (commented out until created)
app.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
app.include_router(learning.router, prefix="/learning", tags=["learning"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])

# Enterprise Features - Differentiators from MCP+Cursor
app.include_router(team_analytics.router, prefix="/team-analytics", tags=["team-analytics"])
app.include_router(quiz.router, prefix="/quiz", tags=["knowledge-verification"])
app.include_router(knowledge_base.router, prefix="/knowledge", tags=["knowledge-base"])
app.include_router(playbooks.router, prefix="/playbooks", tags=["playbooks"])
app.include_router(first_pr.router, prefix="/first-pr", tags=["first-pr-acceleration"])

@app.get("/")
async def root():
    return {
        "message": "CodeFlow - AI Onboarding Intelligence Platform",
        "version": "1.0.0",
        "features": [
            "Team Analytics Dashboard",
            "Knowledge Verification Quizzes", 
            "Collaborative Knowledge Base",
            "Onboarding Playbooks",
            "First PR Acceleration Mode"
        ],
        "docs": "/docs"
    }

