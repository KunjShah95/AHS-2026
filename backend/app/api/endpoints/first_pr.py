"""
First PR Acceleration Mode - Help juniors submit first PR faster
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class IssueType(str, Enum):
    DOCUMENTATION = "documentation"
    BUG_FIX = "bug_fix"
    REFACTOR = "refactor"
    TEST = "test"
    FEATURE = "feature"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class FirstIssue(BaseModel):
    id: str
    title: str
    description: str
    issue_type: IssueType
    difficulty: Difficulty
    estimated_hours: float
    file_paths: List[str]
    skills_required: List[str]
    mentorship_available: bool
    related_docs: List[str]
    guidance_steps: List[str]
    success_criteria: List[str]
    points: int

class FirstPRProgress(BaseModel):
    user_id: str
    selected_issue_id: str
    started_at: str
    current_step: int
    total_steps: int
    completed_steps: List[int]
    questions_asked: int
    mentor_sessions: int
    status: str  # in_progress, submitted, merged, abandoned

class PRGuidanceRequest(BaseModel):
    user_id: str
    repo_id: str
    skill_level: str = "junior"

class PRGuidanceResponse(BaseModel):
    recommended_issues: List[FirstIssue]
    time_to_first_pr_estimate: str
    mentor_available: bool
    quick_start_tips: List[str]

# Demo first issues
demo_issues = [
    FirstIssue(
        id="issue_1", title="Add missing docstrings to utils.py",
        description="Several utility functions lack proper docstrings. Add Google-style docstrings with examples.",
        issue_type=IssueType.DOCUMENTATION, difficulty=Difficulty.EASY,
        estimated_hours=1.5, file_paths=["src/utils.py", "src/helpers.py"],
        skills_required=["Python basics", "Documentation"],
        mentorship_available=True, related_docs=["docs/contributing.md"],
        guidance_steps=[
            "1. Open src/utils.py and identify functions without docstrings",
            "2. Read existing docstrings for style reference",
            "3. Add docstrings following Google style format",
            "4. Run `pytest tests/test_utils.py` to ensure nothing broke",
            "5. Create a branch: `git checkout -b docs/add-utils-docstrings`",
            "6. Commit and push your changes",
            "7. Open a PR with title: 'docs: Add missing docstrings to utils.py'"
        ],
        success_criteria=["All functions have docstrings", "Tests pass", "PR approved"],
        points=50
    ),
    FirstIssue(
        id="issue_2", title="Fix typo in error messages",
        description="There are several typos in user-facing error messages. Find and fix them.",
        issue_type=IssueType.BUG_FIX, difficulty=Difficulty.EASY,
        estimated_hours=1.0, file_paths=["src/errors.py", "src/messages.py"],
        skills_required=["Basic Python", "Attention to detail"],
        mentorship_available=True, related_docs=["CONTRIBUTING.md"],
        guidance_steps=[
            "1. Search for common typos: 'occure', 'recieve', 'seperate'",
            "2. Check error messages and user-facing strings",
            "3. Fix identified typos",
            "4. Run tests to verify nothing broke",
            "5. Create branch: `git checkout -b fix/error-message-typos`",
            "6. Submit PR with clear description of changes"
        ],
        success_criteria=["No typos remain", "Tests pass", "PR merged"],
        points=30
    ),
    FirstIssue(
        id="issue_3", title="Add unit tests for validation module",
        description="The validation module has low test coverage. Add tests for edge cases.",
        issue_type=IssueType.TEST, difficulty=Difficulty.MEDIUM,
        estimated_hours=3.0, file_paths=["src/validation.py", "tests/test_validation.py"],
        skills_required=["Python", "pytest", "Testing principles"],
        mentorship_available=True, related_docs=["docs/testing.md"],
        guidance_steps=[
            "1. Review current test coverage with `pytest --cov=src/validation`",
            "2. Identify untested functions and edge cases",
            "3. Write tests following existing patterns in test file",
            "4. Run tests locally and ensure they pass",
            "5. Create branch: `git checkout -b test/validation-coverage`",
            "6. Submit PR with coverage improvement notes"
        ],
        success_criteria=["Coverage increased by 10%+", "All tests pass", "PR approved"],
        points=100
    ),
    FirstIssue(
        id="issue_4", title="Improve loading state UI component",
        description="The loading spinner is basic. Add a pulsing animation and loading text.",
        issue_type=IssueType.FEATURE, difficulty=Difficulty.MEDIUM,
        estimated_hours=2.5, file_paths=["src/components/Loading.tsx", "src/styles/loading.css"],
        skills_required=["React", "CSS animations", "TypeScript"],
        mentorship_available=True, related_docs=["docs/ui-guidelines.md"],
        guidance_steps=[
            "1. Review current Loading component implementation",
            "2. Add CSS keyframe animation for pulsing effect",
            "3. Add configurable loading text prop",
            "4. Test in different loading scenarios",
            "5. Create branch: `git checkout -b feat/improved-loading-ui`",
            "6. Submit PR with before/after screenshots"
        ],
        success_criteria=["Animation smooth", "Component flexible", "PR approved"],
        points=80
    )
]

progress_db: Dict[str, FirstPRProgress] = {}

@router.post("/guidance", response_model=PRGuidanceResponse)
async def get_first_pr_guidance(request: PRGuidanceRequest):
    """Get personalized first PR recommendations."""
    
    # Filter issues by skill level
    if request.skill_level == "junior":
        recommended = [i for i in demo_issues if i.difficulty in [Difficulty.EASY, Difficulty.MEDIUM]]
    else:
        recommended = demo_issues
    
    # Sort by difficulty (easiest first)
    difficulty_order = {Difficulty.EASY: 0, Difficulty.MEDIUM: 1, Difficulty.HARD: 2}
    recommended = sorted(recommended, key=lambda x: difficulty_order[x.difficulty])
    
    return PRGuidanceResponse(
        recommended_issues=recommended[:5],
        time_to_first_pr_estimate="2-4 hours for documentation, 4-8 hours for code changes",
        mentor_available=True,
        quick_start_tips=[
            "🎯 Start with documentation or typo fixes - lowest risk, high learning",
            "🔍 Read CONTRIBUTING.md before starting",
            "💬 Ask questions early - don't spin for hours",
            "📝 Write clear commit messages: type(scope): description",
            "✅ Run tests locally before pushing"
        ]
    )

@router.get("/issues", response_model=List[FirstIssue])
async def list_first_issues(difficulty: Optional[Difficulty] = None, issue_type: Optional[IssueType] = None):
    """List all available first issues."""
    issues = demo_issues
    if difficulty:
        issues = [i for i in issues if i.difficulty == difficulty]
    if issue_type:
        issues = [i for i in issues if i.issue_type == issue_type]
    return issues

@router.get("/issues/{issue_id}", response_model=FirstIssue)
async def get_issue_details(issue_id: str):
    """Get detailed guidance for a specific issue."""
    issue = next((i for i in demo_issues if i.id == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.post("/start/{issue_id}")
async def start_first_pr(issue_id: str, user_id: str):
    """Start working on a first PR issue."""
    issue = next((i for i in demo_issues if i.id == issue_id), None)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    progress = FirstPRProgress(
        user_id=user_id, selected_issue_id=issue_id,
        started_at=datetime.now().isoformat(),
        current_step=1, total_steps=len(issue.guidance_steps),
        completed_steps=[], questions_asked=0, mentor_sessions=0,
        status="in_progress"
    )
    progress_db[f"{user_id}_{issue_id}"] = progress
    
    return {"message": "Started!", "progress": progress, "first_step": issue.guidance_steps[0]}

@router.post("/progress/{issue_id}/step/{step_num}")
async def complete_step(issue_id: str, step_num: int, user_id: str):
    """Mark a step as completed."""
    key = f"{user_id}_{issue_id}"
    if key not in progress_db:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    progress = progress_db[key]
    if step_num not in progress.completed_steps:
        progress.completed_steps.append(step_num)
        progress.current_step = max(progress.current_step, step_num + 1)
    
    issue = next((i for i in demo_issues if i.id == issue_id), None)
    if progress.current_step > progress.total_steps:
        progress.status = "submitted"
    
    return {
        "progress": progress,
        "next_step": issue.guidance_steps[progress.current_step - 1] if progress.current_step <= progress.total_steps else "Ready to submit PR!"
    }

@router.get("/progress/{user_id}", response_model=List[FirstPRProgress])
async def get_user_progress(user_id: str):
    """Get all first PR progress for a user."""
    return [p for p in progress_db.values() if p.user_id == user_id]

@router.get("/leaderboard")
async def get_first_pr_leaderboard():
    """Get leaderboard of first PR completions."""
    return {
        "fastest_first_pr": [
            {"name": "Alex Chen", "time_hours": 2.5, "issue_type": "documentation"},
            {"name": "Jordan Smith", "time_hours": 4.0, "issue_type": "bug_fix"},
            {"name": "Sam Wilson", "time_hours": 5.5, "issue_type": "test"}
        ],
        "this_week": {
            "prs_submitted": 8,
            "prs_merged": 6,
            "avg_time_to_merge_hours": 4.2
        }
    }
