from fastapi import APIRouter
from pydantic import BaseModel
from app.agents import RepoQA

router = APIRouter(prefix="/ask", tags=["qa"])

class IndexRequest(BaseModel):
    repo_path: str

class QueryRequest(BaseModel):
    index_id: str
    question: str

@router.post("/index")
async def index_repo(request: IndexRequest):
    """POST /api/v1/ask/index"""
    qa = RepoQA(None)
    index_id = await qa.index_repo(request.repo_path)
    return {"index_id": index_id}

@router.post("/query")
async def query_repo(request: QueryRequest):
    """POST /api/v1/ask/query"""
    qa = RepoQA(None)
    answer = await qa.ask(request.index_id, request.question)
    return {"answer": answer}
