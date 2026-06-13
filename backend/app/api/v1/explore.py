from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents import ArchitectureExplorer

router = APIRouter(prefix="/explore", tags=["architecture"])

class ExploreRequest(BaseModel):
    repo_url: str
    branch: str = "main"

@router.post("/analyze")
async def analyze_repo(request: ExploreRequest):
    """POST /api/v1/explore/analyze"""
    explorer = ArchitectureExplorer(None)  # llm_client will be passed from main
    result = await explorer.execute(repo_url=request.repo_url, branch=request.branch)
    return result

@router.get("/health")
async def health():
    """GET /api/v1/explore/health"""
    return {"status": "ok"}
