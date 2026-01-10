from fastapi import FastAPI
from app.api.endpoints import analytics, learning, ingestion, tutor

app = FastAPI(
    title="Codebase Intelligence Layer",
    description="API for AI-driven codebase onboarding system",
    version="0.1.0"
)

# Include routers (commented out until created)
app.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
app.include_router(learning.router, prefix="/learning", tags=["learning"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(tutor.router, prefix="/tutor", tags=["tutor"])

@app.get("/")
async def root():
    return {"message": "Codebase Intelligence Layer Operational"}
