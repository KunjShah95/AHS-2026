import os
import json
from pathlib import Path
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from . import ingest, parser, entities, wiki
from . import agents
from . import drift
from . import intent as intent_layer

try:
    from . import llm

    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


app = FastAPI(
    title="Knowledge Compiler API",
    version="1.0.0",
    description="LLM Wiki pattern - compile once, maintain, query efficiently",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class AnalyzeRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"


class QueryRequest(BaseModel):
    question: str
    repo_id: Optional[str] = None


class WikiPageRequest(BaseModel):
    page_name: str
    repo_id: Optional[str] = None


class SwarmAnalyzeRequest(BaseModel):
    files: Dict[str, str] = {}


# In-memory storage (would use database in production)
repos_storage = {}


@app.get("/health")
async def health_check():
    llm_enabled = os.getenv("LLM_ENABLED", "false").lower() == "true"
    return {
        "status": "healthy",
        "service": "knowledge-compiler",
        "llm": {
            "available": LLM_AVAILABLE,
            "enabled": llm_enabled,
            "provider": os.getenv("LLM_PROVIDER", "not configured"),
            "model": os.getenv("LLM_MODEL", "not configured"),
        },
    }


@app.post("/api/v1/analyze")
async def analyze_repository(
    request: AnalyzeRequest, background_tasks: BackgroundTasks
):
    """Full pipeline: ingest → parse → entity graph → wiki"""

    # Step 1: Ingest
    branch = request.branch or "main"
    try:
        ingest_result = await ingest.ingest_github_repo(request.repo_url, branch)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ingestion failed: {str(e)}")

    repo_path = ingest_result["path"]
    owner = ingest_result["owner"]
    name = ingest_result["name"]
    repo_id = f"{owner}/{name}"

    # Step 2: Get file tree
    files = await ingest.get_repo_files(repo_path)

    # Step 3: Parse files and extract entities
    all_entities = []
    entities_by_file = {}

    # Limit files for demo (in production, use async parallel processing)
    for file_info in files[:100]:
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            file_entities = parser.extract_entities(file_info["path"], content)
            all_entities.extend(file_entities)
            entities_by_file[file_info["path"]] = file_entities

    # Step 4: Build entity graph
    graph = entities.build_entity_graph(files, entities_by_file)
    graph_summary = graph.get_summary()

    # Step 5: Calculate risk score
    risk = parser.calculate_risk_score(all_entities)

    # Step 6: Compile wiki
    wiki_path = f"./wiki/{owner}_{name}"
    wiki_result = wiki.compile_wiki(repo_path, all_entities, files, wiki_path)

    # Store result
    repos_storage[repo_id] = {
        "repo_url": request.repo_url,
        "repo_path": repo_path,
        "files": files,
        "entities": all_entities,
        "graph": graph_summary,
        "risk": risk,
        "wiki_path": wiki_path,
        "wiki_result": wiki_result,
        "ingest_result": ingest_result,
    }

    return {
        "repo_id": repo_id,
        "status": "completed",
        "files_count": len(files),
        "entities_count": len(all_entities),
        "graph": graph_summary,
        "risk": risk,
        "wiki_pages": wiki_result.get("pages", []),
        "cached": ingest_result.get("cached", False),
    }


@app.get("/api/v1/repos/{owner}/{name}")
async def get_repository(owner: str, name: str):
    """Get cached repository data"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    return repos_storage[repo_id]


@app.get("/api/v1/repos/{owner}/{name}/graph")
async def get_entity_graph(owner: str, name: str):
    """Get entity graph"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    return repos_storage[repo_id]["graph"]


@app.get("/api/v1/repos/{owner}/{name}/risk")
async def get_risk_assessment(owner: str, name: str):
    """Get risk assessment"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    return repos_storage[repo_id]["risk"]


@app.get("/api/v1/repos/{owner}/{name}/wiki")
async def get_wiki_pages(owner: str, name: str):
    """Get list of wiki pages"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    wiki_engine = wiki.WikiEngine(repos_storage[repo_id]["wiki_path"])
    return {"pages": wiki_engine.get_all_pages()}


@app.get("/api/v1/repos/{owner}/{name}/wiki/{page_name}")
async def get_wiki_page(owner: str, name: str, page_name: str):
    """Get specific wiki page content"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    wiki_engine = wiki.WikiEngine(repos_storage[repo_id]["wiki_path"])
    content = wiki_engine.get_page(page_name)

    if content is None:
        raise HTTPException(status_code=404, detail="Wiki page not found")

    return {"page_name": page_name, "content": content}


@app.post("/api/v1/repos/{owner}/{name}/query")
async def query_repository(owner: str, name: str, request: QueryRequest):
    """Query the compiled wiki"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    wiki_engine = wiki.WikiEngine(repos_storage[repo_id]["wiki_path"])
    result = wiki_engine.query(request.question)

    return result


@app.get("/api/v1/files")
async def list_available_files():
    """List all cached repositories"""
    return {"repos": list(repos_storage.keys())}


# ============== Multi-Agent Analysis ==============


@app.post("/api/v1/repos/{owner}/{name}/agents/analyze")
async def run_agent_analysis(owner: str, name: str):
    """Run multi-agent analysis on repository"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    # Get files to analyze
    files = {}
    for file_info in repo_data.get("files", [])[:50]:  # Limit for demo
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            files[file_info["path"]] = content

    # Run multi-agent analysis
    results = await agents.run_multi_agent_analysis(files)

    # Store in repo data
    repo_data["agent_analysis"] = results

    return results


# ============== Multi-Agent Swarm with Debate ==============


@app.post("/api/v1/repos/{owner}/{name}/swarm/analyze")
async def run_swarm_analysis(owner: str, name: str, request: SwarmAnalyzeRequest):
    """Run multi-agent swarm analysis with debate

    Returns:
        - Debate results per file
        - Consensus scores
        - Security veto status
        - Reasoning trace
    """
    from .swarm import run_swarm_analysis as swarm_run

    repo_id = f"{owner}/{name}"

    if not request.files:
        # Try to get from cached repo
        if repo_id in repos_storage:
            repo_data = repos_storage[repo_id]
            repo_path = repo_data["repo_path"]
            for file_info in repo_data.get("files", [])[:50]:
                content = await ingest.read_file(repo_path, file_info["path"])
                if content:
                    request.files[file_info["path"]] = content

    if not request.files:
        raise HTTPException(status_code=400, detail="No files to analyze")

    results = await swarm_run(request.files)

    return {"status": "complete", "repo": repo_id, **results}


# ============== Architecture Drift Detection ==============


@app.get("/api/v1/repos/{owner}/{name}/drift")
async def get_drift_analysis(owner: str, name: str):
    """Get architecture drift analysis"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    # Get files
    files = {}
    for file_info in repo_data.get("files", [])[:50]:
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            files[file_info["path"]] = content

    # Run drift analysis
    result = drift.analyze_drift_and_debt(files)

    # Store
    repo_data["drift_analysis"] = result

    return result


# ============== Tech Debt ==============


@app.get("/api/v1/repos/{owner}/{name}/tech-debt")
async def get_tech_debt(owner: str, name: str):
    """Get tech debt analysis with financial model"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    # Use cached drift analysis or run new
    repo_data = repos_storage[repo_id]

    if "drift_analysis" not in repo_data:
        # Get files
        repo_path = repo_data["repo_path"]
        files = {}
        for file_info in repo_data.get("files", [])[:50]:
            content = await ingest.read_file(repo_path, file_info["path"])
            if content:
                files[file_info["path"]] = content

        repo_data["drift_analysis"] = drift.analyze_drift_and_debt(files)

    return repo_data["drift_analysis"]["tech_debt"]


# ============== Intent Layer ==============


@app.get("/api/v1/repos/{owner}/{name}/intent")
async def get_intent_analysis(owner: str, name: str):
    """Get intent/assumption analysis"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    # Extract intent from files
    all_entries = []
    intent_storage = f"./intent/{owner}_{name}"

    for file_info in repo_data.get("files", [])[:50]:
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            entries = intent_layer.extract_intent(
                file_info["path"], content, intent_storage
            )
            all_entries.extend(entries)

    return {
        "total_entries": len(all_entries),
        "entries": [
            {
                "id": e.id,
                "type": e.type,
                "title": e.title,
                "description": e.description,
                "file_path": e.file_path,
                "tags": e.tags,
            }
            for e in all_entries[:50]
        ],
        "summary": intent_layer.get_intent_summary(intent_storage),
    }


# ============== Full Analysis ==============


@app.get("/api/v1/repos/{owner}/{name}/full-analysis")
async def get_full_analysis(owner: str, name: str):
    """Get complete analysis including agents, drift, tech debt, intent"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    # Get files
    files = {}
    for file_info in repo_data.get("files", [])[:50]:
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            files[file_info["path"]] = content

    # Run all analyses
    import asyncio

    # 1. Multi-agent analysis
    agent_results = await agents.run_multi_agent_analysis(files)

    # 2. Drift analysis
    drift_result = drift.analyze_drift_and_debt(files)

    # 3. Intent extraction
    intent_storage = f"./intent/{owner}_{name}"
    for file_path, content in files.items():
        intent_layer.extract_intent(file_path, content, intent_storage)
    intent_summary = intent_layer.get_intent_summary(intent_storage)

    return {
        "repository": repo_id,
        "timestamp": repo_data.get("ingest_result", {}).get("cached", False),
        "basic_stats": {
            "files": repo_data.get("files_count", 0),
            "entities": repo_data.get("entities_count", 0),
            "risk_score": repo_data.get("risk", {}).get("score", 0),
        },
        "multi_agent": agent_results,
        "architecture_drift": {
            "score": drift_result["drift_score"],
            "grade": drift_result["drift_grade"],
            "signals": drift_result["drift_signals"],
            "findings_count": len(drift_result["findings"]),
        },
        "tech_debt": drift_result["tech_debt"],
        "intent_layer": intent_summary,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
