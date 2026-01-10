from fastapi import FastAPI
from app.api.endpoints import analytics, learning, ingestion, tutor, progress

app = FastAPI(
    title="Codebase Intelligence Layer",
    description="API for AI-driven codebase onboarding system",
    version="0.1.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Update with your frontend URL
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

@app.get("/")
async def root():
    return {"message": "Codebase Intelligence Layer Operational"}
