"""
Onboarding Playbooks API - Save and reuse successful onboarding paths
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

router = APIRouter()

class PlaybookPhase(BaseModel):
    phase_number: int
    title: str
    duration_hours: int
    objectives: List[str]
    modules: List[str]
    tasks: List[Dict[str, Any]]
    success_criteria: List[str]

class OnboardingPlaybook(BaseModel):
    id: str
    name: str
    description: str
    target_role: str  # Frontend Dev, Backend Dev, Full Stack, DevOps
    repo_id: str
    created_by: str
    created_by_name: str
    created_at: str
    phases: List[PlaybookPhase]
    total_hours: int
    success_rate: float
    times_used: int
    avg_completion_days: float
    tags: List[str] = []
    is_template: bool = False

class CreatePlaybookRequest(BaseModel):
    name: str
    description: str
    target_role: str
    repo_id: str
    created_by: str
    created_by_name: str
    phases: List[PlaybookPhase]
    tags: List[str] = []

class ClonePlaybookRequest(BaseModel):
    playbook_id: str
    new_name: str
    target_repo_id: str
    created_by: str
    created_by_name: str

# In-memory storage
playbooks_db: Dict[str, OnboardingPlaybook] = {}

# Demo playbooks
playbooks_db["pb_1"] = OnboardingPlaybook(
    id="pb_1", name="React Frontend Developer Onboarding",
    description="Complete onboarding path for new React frontend developers joining the team",
    target_role="Frontend Developer", repo_id="demo-repo",
    created_by="lead_1", created_by_name="Sarah Chen",
    created_at="2024-01-01T10:00:00Z",
    phases=[
        PlaybookPhase(
            phase_number=1, title="Environment & Tools Setup",
            duration_hours=4, objectives=["Set up dev environment", "Install tools", "Clone repos"],
            modules=["README.md", "package.json", ".env.example"],
            tasks=[{"type": "setup", "description": "Run npm install and verify build"}],
            success_criteria=["Can run npm start", "Can access localhost:3000"]
        ),
        PlaybookPhase(
            phase_number=2, title="React Architecture Overview",
            duration_hours=8, objectives=["Understand component structure", "Learn state management"],
            modules=["src/App.tsx", "src/components/", "src/hooks/"],
            tasks=[{"type": "explore", "description": "Trace data flow from App to child components"}],
            success_criteria=["Can explain component hierarchy", "Understands prop drilling vs context"]
        ),
        PlaybookPhase(
            phase_number=3, title="First Contribution",
            duration_hours=6, objectives=["Make first PR", "Follow code review process"],
            modules=["CONTRIBUTING.md", "src/components/ui/"],
            tasks=[{"type": "code", "description": "Add a new UI component or fix a bug"}],
            success_criteria=["PR submitted", "PR approved and merged"]
        )
    ],
    total_hours=18, success_rate=92.5, times_used=15,
    avg_completion_days=5.2, tags=["react", "frontend", "typescript"],
    is_template=True
)

playbooks_db["pb_2"] = OnboardingPlaybook(
    id="pb_2", name="Python Backend Developer Onboarding",
    description="FastAPI backend developer onboarding path with focus on API design",
    target_role="Backend Developer", repo_id="demo-repo",
    created_by="lead_1", created_by_name="Sarah Chen",
    created_at="2024-01-05T10:00:00Z",
    phases=[
        PlaybookPhase(
            phase_number=1, title="Python Environment Setup",
            duration_hours=3, objectives=["Set up Python venv", "Install dependencies"],
            modules=["requirements.txt", "pyproject.toml"],
            tasks=[{"type": "setup", "description": "Create venv and run pip install"}],
            success_criteria=["Can run uvicorn", "Tests pass locally"]
        ),
        PlaybookPhase(
            phase_number=2, title="API Architecture",
            duration_hours=10, objectives=["Understand FastAPI patterns", "Learn data models"],
            modules=["app/main.py", "app/api/", "app/models/"],
            tasks=[{"type": "explore", "description": "Trace request through router to service layer"}],
            success_criteria=["Can explain request lifecycle", "Understands dependency injection"]
        )
    ],
    total_hours=13, success_rate=88.0, times_used=8,
    avg_completion_days=4.0, tags=["python", "fastapi", "backend"],
    is_template=True
)

@router.post("/create", response_model=OnboardingPlaybook)
async def create_playbook(request: CreatePlaybookRequest):
    playbook_id = f"pb_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    total_hours = sum(p.duration_hours for p in request.phases)
    
    playbook = OnboardingPlaybook(
        id=playbook_id, name=request.name, description=request.description,
        target_role=request.target_role, repo_id=request.repo_id,
        created_by=request.created_by, created_by_name=request.created_by_name,
        created_at=datetime.now().isoformat(), phases=request.phases,
        total_hours=total_hours, success_rate=0.0, times_used=0,
        avg_completion_days=0.0, tags=request.tags
    )
    playbooks_db[playbook_id] = playbook
    return playbook

@router.get("/list", response_model=List[OnboardingPlaybook])
async def list_playbooks(repo_id: Optional[str] = None, role: Optional[str] = None):
    playbooks = list(playbooks_db.values())
    if repo_id:
        playbooks = [p for p in playbooks if p.repo_id == repo_id]
    if role:
        playbooks = [p for p in playbooks if role.lower() in p.target_role.lower()]
    return sorted(playbooks, key=lambda x: x.times_used, reverse=True)

@router.get("/templates", response_model=List[OnboardingPlaybook])
async def get_templates():
    return [p for p in playbooks_db.values() if p.is_template]

@router.get("/{playbook_id}", response_model=OnboardingPlaybook)
async def get_playbook(playbook_id: str):
    if playbook_id not in playbooks_db:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return playbooks_db[playbook_id]

@router.post("/clone", response_model=OnboardingPlaybook)
async def clone_playbook(request: ClonePlaybookRequest):
    if request.playbook_id not in playbooks_db:
        raise HTTPException(status_code=404, detail="Source playbook not found")
    
    source = playbooks_db[request.playbook_id]
    new_id = f"pb_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    cloned = OnboardingPlaybook(
        id=new_id, name=request.new_name, description=source.description,
        target_role=source.target_role, repo_id=request.target_repo_id,
        created_by=request.created_by, created_by_name=request.created_by_name,
        created_at=datetime.now().isoformat(), phases=source.phases,
        total_hours=source.total_hours, success_rate=0.0, times_used=0,
        avg_completion_days=0.0, tags=source.tags
    )
    playbooks_db[new_id] = cloned
    return cloned

@router.post("/{playbook_id}/use")
async def record_usage(playbook_id: str, completion_days: float):
    if playbook_id not in playbooks_db:
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    pb = playbooks_db[playbook_id]
    pb.times_used += 1
    pb.avg_completion_days = ((pb.avg_completion_days * (pb.times_used - 1)) + completion_days) / pb.times_used
    return {"times_used": pb.times_used, "avg_completion_days": pb.avg_completion_days}

class GeneratePlaybooksFromRepoRequest(BaseModel):
    repo_id: str
    user_id: str

@router.post("/generate-from-repo", response_model=List[OnboardingPlaybook])
async def generate_playbooks_from_repo(request: GeneratePlaybooksFromRepoRequest):
    """
    Generate customized onboarding playbooks from a previously analyzed repository.
    This creates role-specific learning paths based on the repository structure.
    """
    try:
        # In production, fetch analyzed repo data from Firestore using repo_id
        # For now, return demo playbooks with repository context
        
        # Filter playbooks for this repo or return templates
        repo_playbooks = [p for p in playbooks_db.values() if p.repo_id == "demo-repo"]
        
        if not repo_playbooks:
            # Return templates if no repo-specific playbooks exist
            repo_playbooks = [p for p in playbooks_db.values() if p.is_template][:2]
        
        return repo_playbooks
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
