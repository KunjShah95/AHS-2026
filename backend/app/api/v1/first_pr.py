from fastapi import APIRouter
from pydantic import BaseModel
from app.agents import FirstPRAccelerator

router = APIRouter(prefix="/first-pr", tags=["onboarding"])

class IssuesRequest(BaseModel):
    repo_url: str
    user_level: str = "junior"

class GuideRequest(BaseModel):
    issue_id: int
    repo_structure: dict

@router.post("/issues")
async def find_issues(request: IssuesRequest):
    """POST /api/v1/first-pr/issues"""
    accelerator = FirstPRAccelerator(None)
    issues = await accelerator.find_issues(
        repo_url=request.repo_url,
        user_level=request.user_level
    )
    return {"issues": issues}

@router.post("/guide")
async def generate_guide(request: GuideRequest):
    """POST /api/v1/first-pr/guide"""
    accelerator = FirstPRAccelerator(None)
    guide = await accelerator.generate_guide(
        issue_id=request.issue_id,
        repo_structure=request.repo_structure
    )
    return guide
