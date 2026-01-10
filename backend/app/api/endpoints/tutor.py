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
    try:
        # Reconstruct graph object from dict
        # This assumes the frontend sends back the exact JSON structure received from /ingestion/process
        code_graph = CodeGraph(**request.context_graph)
        
        service = TutorService()
        answer = service.answer_question(request.question, code_graph)
        
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"Error processing question: {str(e)}"}
