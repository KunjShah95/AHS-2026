from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.services.impact import ImpactAnalysisService
from app.models.graph import CodeGraph

router = APIRouter()

class ImpactRequest(BaseModel):
    changed_module: str
    code_graph: Dict[str, Any]

@router.post("/impact")
async def analyze_impact(request: ImpactRequest):
    service = ImpactAnalysisService()
    # Mocking hydration again, assuming code_graph is compatible structure
    # In real app: use CodeGraph(**request.code_graph)
    cg = CodeGraph(**request.code_graph)
    
    result = service.calculate_impact(cg, request.changed_module)
    return result
