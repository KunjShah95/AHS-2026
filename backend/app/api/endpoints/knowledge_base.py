"""
Collaborative Knowledge Base API - Capture tribal knowledge
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()

class AnnotationType(str, Enum):
    MUST_KNOW = "must_know"
    GOTCHA = "gotcha"
    BEST_PRACTICE = "best_practice"
    DEPRECATED = "deprecated"
    SECURITY = "security"

class CodeAnnotation(BaseModel):
    id: str
    repo_id: str
    file_path: str
    start_line: int
    end_line: int
    annotation_type: AnnotationType
    title: str
    content: str
    author_id: str
    author_name: str
    author_role: str
    created_at: str
    upvotes: int = 0
    is_verified: bool = False
    tags: List[str] = []

class CreateAnnotationRequest(BaseModel):
    repo_id: str
    file_path: str
    start_line: int
    end_line: int
    annotation_type: AnnotationType
    title: str
    content: str
    author_id: str
    author_name: str
    author_role: str = "Developer"
    tags: List[str] = []

class KnowledgeEntry(BaseModel):
    id: str
    repo_id: str
    title: str
    content: str
    category: str
    author_id: str
    author_name: str
    created_at: str
    importance: str = "medium"
    tags: List[str] = []
    views: int = 0
    helpful_votes: int = 0

# In-memory storage
annotations_db: Dict[str, CodeAnnotation] = {}
knowledge_db: Dict[str, KnowledgeEntry] = {}

# Initialize demo data
annotations_db["ann_1"] = CodeAnnotation(
    id="ann_1", repo_id="demo-repo", file_path="src/api/auth.py",
    start_line=45, end_line=67, annotation_type=AnnotationType.MUST_KNOW,
    title="Authentication Flow - Critical",
    content="This is the core auth logic. JWT tokens validated against ENV secret. Token expiry: 24h regular, 7d remember-me. NEVER log tokens!",
    author_id="senior_1", author_name="Sarah Chen", author_role="Tech Lead",
    created_at="2024-01-15T10:30:00Z", upvotes=12, is_verified=True,
    tags=["auth", "security", "jwt"]
)

annotations_db["ann_2"] = CodeAnnotation(
    id="ann_2", repo_id="demo-repo", file_path="src/services/payment.py",
    start_line=120, end_line=145, annotation_type=AnnotationType.GOTCHA,
    title="Payment Idempotency - Common Bug!",
    content="GOTCHA: Payment requests MUST include idempotency key! We had duplicate charges in prod. Use: PaymentService.create_with_idempotency(key, amount)",
    author_id="senior_2", author_name="Mike Rodriguez", author_role="Senior Dev",
    created_at="2024-01-10T14:20:00Z", upvotes=8, is_verified=True,
    tags=["payment", "bug", "idempotency"]
)

knowledge_db["kb_1"] = KnowledgeEntry(
    id="kb_1", repo_id="demo-repo", title="Local Development Setup",
    content="# Setup\n1. Clone repo\n2. Copy .env.example to .env\n3. docker-compose up -d\n4. pip install -r requirements.txt\n5. uvicorn app.main:app --reload",
    category="setup", author_id="senior_1", author_name="Sarah Chen",
    created_at="2024-01-01T10:00:00Z", importance="critical",
    tags=["setup", "onboarding"], views=145, helpful_votes=32
)

@router.post("/annotations", response_model=CodeAnnotation)
async def create_annotation(request: CreateAnnotationRequest):
    annotation_id = f"ann_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    annotation = CodeAnnotation(
        id=annotation_id, repo_id=request.repo_id, file_path=request.file_path,
        start_line=request.start_line, end_line=request.end_line,
        annotation_type=request.annotation_type, title=request.title,
        content=request.content, author_id=request.author_id,
        author_name=request.author_name, author_role=request.author_role,
        created_at=datetime.now().isoformat(), tags=request.tags
    )
    annotations_db[annotation_id] = annotation
    return annotation

@router.get("/annotations/{repo_id}", response_model=List[CodeAnnotation])
async def get_annotations(repo_id: str, file_path: Optional[str] = None):
    annotations = [a for a in annotations_db.values() if a.repo_id == repo_id]
    if file_path:
        annotations = [a for a in annotations if a.file_path == file_path]
    return sorted(annotations, key=lambda x: x.upvotes, reverse=True)

@router.post("/annotations/{annotation_id}/upvote")
async def upvote_annotation(annotation_id: str):
    if annotation_id not in annotations_db:
        raise HTTPException(status_code=404, detail="Not found")
    annotations_db[annotation_id].upvotes += 1
    return {"upvotes": annotations_db[annotation_id].upvotes}

@router.get("/knowledge/{repo_id}", response_model=List[KnowledgeEntry])
async def get_knowledge_entries(repo_id: str):
    return [e for e in knowledge_db.values() if e.repo_id == repo_id]

@router.get("/demo-data")
async def get_demo_knowledge_base():
    return {
        "annotations": list(annotations_db.values()),
        "knowledge_entries": list(knowledge_db.values()),
        "stats": {
            "total_annotations": len(annotations_db),
            "must_know_count": len([a for a in annotations_db.values() if a.annotation_type == AnnotationType.MUST_KNOW]),
            "verified_count": len([a for a in annotations_db.values() if a.is_verified])
        }
    }

class GenerateKnowledgeFromRepoRequest(BaseModel):
    repo_id: str
    user_id: str

@router.post("/generate-from-repo")
async def generate_knowledge_from_repo(request: GenerateKnowledgeFromRepoRequest):
    """
    Generate knowledge base entries from a previously analyzed repository.
    This extracts important patterns, gotchas, and best practices.
    """
    try:
        # In production, fetch analyzed repo data from Firestore using repo_id
        # For now, return demo data with repository-specific metadata
        
        demo_annotations = list(annotations_db.values())
        demo_entries = list(knowledge_db.values())
        
        return {
            "annotations": demo_annotations,
            "knowledge_entries": demo_entries,
            "stats": {
                "total_annotations": len(demo_annotations),
                "must_know_count": len([a for a in demo_annotations if a.annotation_type == AnnotationType.MUST_KNOW]),
                "verified_count": len([a for a in demo_annotations if a.is_verified])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
