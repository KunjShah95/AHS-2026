from fastapi import APIRouter
from pydantic import BaseModel
from app.agents import LearningPathGenerator

router = APIRouter(prefix="/learn", tags=["learning"])

class LearnRequest(BaseModel):
    repo_structure: dict
    user_level: str  # "junior" | "mid" | "senior"

@router.post("/path")
async def generate_path(request: LearnRequest):
    """POST /api/v1/learn/path"""
    generator = LearningPathGenerator(None)
    result = await generator.execute(
        repo_structure=request.repo_structure,
        user_level=request.user_level
    )
    return result
