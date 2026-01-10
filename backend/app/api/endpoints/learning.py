from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.learning_graph import LearningGraphService
from app.models.graph import CodeGraph

router = APIRouter()

class LearningPathRequest(BaseModel):
    code_graph: Dict[str, Any]

@router.post("/path")
async def generate_learning_path(request: LearningPathRequest):
    """
    Re-generates or updates the learning path based on the provided code graph.
    Useful if the frontend modifies the graph or filters it.
    """
    try:
        # Reconstruct CodeGraph from dict
        # In a real app, strict validation needed.
        cg = CodeGraph(**request.code_graph)
        
        service = LearningGraphService()
        learning_path = service.construct_learning_path(cg)
        
        return learning_path.model_dump()
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {str(e)}")
