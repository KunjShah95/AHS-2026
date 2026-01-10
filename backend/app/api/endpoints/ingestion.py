from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ingestion import IngestionService
from app.services.intelligence import CodeIntelligenceService
from app.services.learning_graph import LearningGraphService
from app.services.task_generation import TaskGenerationService

router = APIRouter()

class IngestRequest(BaseModel):
    repo_path: str
    github_url: str = None

@router.post("/process")
async def process_repository(request: IngestRequest):
    """
    Full pipeline: Ingest -> Intelligence -> Learning Graph -> Tasks
    """
    try:
        # 1. Ingestion
        ingest_service = IngestionService()
        if request.github_url:
            target_path = ingest_service.clone_repository(request.github_url, request.repo_path)
        else:
            target_path = request.repo_path
            
        file_tree = ingest_service.parse_file_tree(target_path)
        
        # 2. Intelligence
        intel_service = CodeIntelligenceService()
        code_graph = intel_service.build_dependency_graph(file_tree, target_path)
        
        # 3. Learning Graph
        learning_service = LearningGraphService()
        learning_path = learning_service.construct_learning_path(code_graph)
        
        # 4. Tasks
        task_service = TaskGenerationService()
        tasks = task_service.generate_tasks(code_graph)
        
        return {
            "status": "success",
            "metadata": {
                "file_count": len(file_tree),
                "node_count": len(code_graph.nodes),
                "learning_concept_count": len(learning_path.nodes),
                "task_count": len(tasks)
            },
            "file_tree": file_tree,
            "code_graph": code_graph.model_dump(),
            "learning_path": learning_path.model_dump(),
            "tasks": tasks
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
