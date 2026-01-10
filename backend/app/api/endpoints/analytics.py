from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.agents.change_impact import ChangeImpactAgent
from app.models.graph import CodeGraph

router = APIRouter()

class ImpactRequest(BaseModel):
    changed_module: str
    code_graph: Dict[str, Any]

@router.post("/impact")
async def analyze_impact(request: ImpactRequest):
    agent = ChangeImpactAgent()
    cg = CodeGraph(**request.code_graph)
    return agent.analyze(request.changed_module, cg)
