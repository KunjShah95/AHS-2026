from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.services.tutor import TutorService
from app.models.graph import CodeGraph

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    context_graph: Dict[str, Any] # Client sends the graph context state? Or we fetch from DB?
    # For stateless V0, client sends context or we re-compute (expensive).
    # Ideally, we load from a DB. I'll accept a simplified graph or just assume stateless for now.

@router.post("/ask")
async def ask_tutor(request: QuestionRequest):
    # Reconstruct graph object from dict
    graph_data = request.context_graph
    # Validation skipped for brevity
    # We need to parse back to CodeGraph model, simplistic approach:
    # This requires the client to send back the full graph they got from /ingestion/process
    # Not efficient but functional for V0 demo.
    
    # In reality, we'd hydrate `CodeGraph` from the dict
    # But `CodeGraph` expects Pydantic objects.
    # Let's just pass the dict to service if we change service signature, 
    # or quick-fix:
    
    # Mocking the reconstruction for the stub
    # service = TutorService()
    # answer = service.answer_question(request.question, code_graph)
    
    return {"answer": "Tutor endpoint is reachable. Implement graph hydration for full functionality."}
