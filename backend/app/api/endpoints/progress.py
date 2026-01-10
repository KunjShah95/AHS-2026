from fastapi import APIRouter
from app.agents.progress import ProgressAgent

router = APIRouter()
agent = ProgressAgent()

@router.get("/{user_id}")
async def get_progress(user_id: str):
    return agent.get_progress(user_id)

@router.post("/{user_id}/complete/{task_id}")
async def complete_task(user_id: str, task_id: str):
    agent.mark_task_complete(user_id, task_id)
    return {"status": "success"}
