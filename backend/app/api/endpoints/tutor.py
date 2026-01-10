from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.agents.interactive_tutor import InteractiveTutorAgent
from app.models.graph import CodeGraph

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    context_graph: Dict[str, Any]

@router.post("/ask")
async def ask_tutor(request: QuestionRequest):
    try:
        code_graph = CodeGraph(**request.context_graph)
        agent = InteractiveTutorAgent()
        answer = agent.answer(request.question, code_graph)
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"Error: {str(e)}"}
