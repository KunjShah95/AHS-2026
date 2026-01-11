from fastapi import APIRouter, HTTPException, Depends
from app.core.security import get_current_user
from pydantic import BaseModel
from app.agents.repository_ingestion import RepositoryIngestionAgent
from app.agents.code_intelligence import CodeIntelligenceAgent
from app.agents.learning_graph import LearningGraphContextAgent
from app.agents.task_generation import TaskGeneratorAgent

router = APIRouter()

class IngestRequest(BaseModel):
    repo_path: str
    github_url: str = None

@router.post("/process")
async def process_repository(request: IngestRequest):
    try:
        # Agent 1: Ingestion
        ingest_agent = RepositoryIngestionAgent()
        if request.github_url:
            target_path = ingest_agent.clone_repository(request.github_url, request.repo_path)
        else:
            target_path = request.repo_path
            
        file_tree = ingest_agent.parse_file_tree(target_path)
        # file_tree = await ingest_agent.analyze_modules(file_tree) # Optional AI enrichment

        # Agent 2: Intelligence
        intel_agent = CodeIntelligenceAgent()
        code_graph = intel_agent.build_graph(file_tree, target_path)
        
        # Agent 3: Learning Graph
        learning_agent = LearningGraphContextAgent()
        learning_path = learning_agent.generate_roadmap(code_graph)
        
        # Agent 4: Tasks
        task_agent = TaskGeneratorAgent()
        tasks = await task_agent.generate_tasks(code_graph)
        
        return {
            "status": "success",
            "agents_involved": ["RepositoryIngestion", "CodeIntelligence", "LearningGraph", "TaskGeneration"],
            "data": {
                "file_tree": file_tree,
                "code_graph": code_graph.model_dump(),
                "learning_path": learning_path.model_dump(),
                "tasks": tasks
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
