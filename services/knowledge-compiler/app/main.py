import os
import json
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Literal, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if current_time - t < 60
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return HTTPException(
                status_code=429, detail="Rate limit exceeded. Please try again later."
            )

        self.requests[client_ip].append(current_time)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            self.requests_per_minute - len(self.requests[client_ip])
        )
        return response


from . import ingest, parser, entities, wiki
from . import agents
from . import drift
from . import intent as intent_layer
from .simulation import BlastRadiusAnalyzer, SimulationEngine as sim_engine
from . import cross_repo_graph
from . import pattern_db
from . import collaborate

try:
    from . import llm
    from . import dev_profile as profile_module
    from . import profile_builder
    from . import context_injector

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

# Cross-repo stores
cross_graph = cross_repo_graph.CrossRepoGraphStore()
pattern_db = pattern_db.PatternDatabase()


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


@app.get("/api/v1/llm/providers")
async def list_llm_providers():
    """List available LLM providers and their status"""
    from .llm import PROVIDER_INFO, LLMProvider

    providers = []
    for provider, info in PROVIDER_INFO.items():
        api_key = None
        if info.get("env_key"):
            api_key = "configured" if os.getenv(info["env_key"]) else None

        providers.append(
            {
                "name": info["name"],
                "provider": provider.value,
                "free": info.get("free_tier", False),
                "models": info.get("models", []),
                "configured": bool(api_key),
                "description": info.get("description", ""),
            }
        )

    current = os.getenv("LLM_PROVIDER", "not configured")
    return {
        "current": current,
        "available": providers,
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


# ============== Time Machine API ==============


@app.get("/api/v1/repos/{owner}/{name}/time-machine/evolution")
async def get_evolution_analysis(owner: str, name: str):
    """Get repository evolution analysis"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .time_machine import TimeMachine

    tm = TimeMachine(repo_path)
    result = tm.analyze_evolution()

    return {"repo": repo_id, **result}


@app.get("/api/v1/repos/{owner}/{name}/time-machine/timeline/{file_path:path}")
async def get_file_timeline(owner: str, name: str, file_path: str):
    """Get evolution timeline for a specific file"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .time_machine import TimeMachine

    tm = TimeMachine(repo_path)
    timeline = tm.get_evolution_timeline(file_path)

    return {"file_path": file_path, "timeline": timeline}


@app.get("/api/v1/repos/{owner}/{name}/time-machine/contributors")
async def get_contributor_stats(owner: str, name: str):
    """Get contributor statistics"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .time_machine import TimeMachine

    tm = TimeMachine(repo_path)
    stats = tm.get_contributor_stats()

    return {"repo": repo_id, "contributors": stats, "total_contributors": len(stats)}


@app.get("/api/v1/repos/{owner}/{name}/time-machine/churn")
async def get_code_churn(owner: str, name: str):
    """Get code churn metrics"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .time_machine import TimeMachine

    tm = TimeMachine(repo_path)
    churn = tm.calculate_code_churn()

    return {"repo": repo_id, **churn}


@app.get("/api/v1/repos/{owner}/{name}/time-machine/bugs")
async def get_bug_propagation(owner: str, name: str):
    """Get bug propagation analysis"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .time_machine import TimeMachine, BugPropagator

    tm = TimeMachine(repo_path)
    bp = BugPropagator(tm)
    bugs = bp.analyze_bug_propagation()

    return {"repo": repo_id, "bug_propagations": bugs, "total_bugs": len(bugs)}


# ============== Wiki Health API ==============


@app.get("/api/v1/repos/{owner}/{name}/wiki/health")
async def get_wiki_health(owner: str, name: str):
    """Get wiki health score and stale pages"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    wiki_engine = wiki.WikiEngine(repo_data["wiki_path"])

    entities = repo_data.get("entities", [])
    files = repo_data.get("files", [])

    health = wiki_engine.get_wiki_health_score(repo_data["repo_path"], entities)
    stale = wiki_engine.detect_stale_pages(repo_data["repo_path"], entities)

    return {"repo": repo_id, "health": health, "stale_pages": stale}


@app.post("/api/v1/repos/{owner}/{name}/wiki/heal")
async def heal_wiki(owner: str, name: str):
    """Heal all stale wiki pages"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    wiki_engine = wiki.WikiEngine(repo_data["wiki_path"])

    entities = repo_data.get("entities", [])

    result = wiki_engine.heal_all_stale(repo_data["repo_path"], entities)

    return {"repo": repo_id, **result}


@app.get("/api/v1/repos/{owner}/{name}/wiki/impact")
async def get_wiki_impact(owner: str, name: str, changed_files: str = ""):
    """Analyze impact of file changes on wiki"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    wiki_engine = wiki.WikiEngine(repo_data["wiki_path"])

    files = changed_files.split(",") if changed_files else []

    impact = wiki_engine.get_change_impact(files, repo_data.get("entities", []))

    return {"repo": repo_id, **impact}


# ============== Cross-Repo Intelligence ==============


@app.get("/api/v1/cross-repo/indexed-repos")
async def get_indexed_repos():
    """Get list of repositories in cross-repo graph."""
    return {"repos": cross_graph.get_indexed_repos()}


@app.get("/api/v1/cross-repo/repo-stats/{repo_id}")
async def get_cross_repo_stats(repo_id: str):
    """Get statistics for a repo in the cross-graph."""
    return cross_graph.get_repo_stats(repo_id)


@app.get("/api/v1/repos/{owner}/{name}/cross-repo-graph")
async def get_cross_repo_graph(owner: str, name: str, include_edges: bool = True):
    """Get merged cross-repo graph for a repository."""
    repo_id = f"{owner}/{name}"

    # First ensure this repo is in the cross-graph
    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    # Get cross-graph for this repo
    result = await cross_graph.get_merged_graph(
        repos=[repo_id], include_edges=include_edges
    )

    return result


@app.get("/api/v1/cross-repo/graph")
async def get_full_cross_graph(
    repos: Optional[str] = None,
    include_edges: bool = True,
):
    """Get the full cross-repo graph."""
    repo_list = repos.split(",") if repos else None
    result = await cross_graph.get_merged_graph(
        repos=repo_list, include_edges=include_edges
    )
    return result


@app.get("/api/v1/cross-repo/query")
async def cross_repo_query(
    entity_type: Optional[str] = None,
    pattern: Optional[str] = None,
    repos: Optional[str] = None,
    limit: int = 100,
):
    """Query entities across repositories."""
    repo_list = repos.split(",") if repos else None
    result = await cross_graph.query_cross_repo(
        entity_type=entity_type,
        pattern=pattern,
        repos=repo_list,
        limit=limit,
    )
    return {
        "entities": result.entities,
        "total_count": result.total_count,
        "repos_queried": result.repos_queried,
        "query_time_ms": result.query_time_ms,
    }


@app.get("/api/v1/cross-repo/related/{entity_id}")
async def find_related_across_repos(
    entity_id: str,
    repo_id: Optional[str] = None,
    max_results: int = 20,
):
    """Find related entities across repositories."""
    related = await cross_graph.find_related_across_repos(
        entity_id=entity_id,
        repo_id=repo_id,
        max_results=max_results,
    )
    return {
        "entity_id": entity_id,
        "related": [r.to_dict() for r in related],
        "count": len(related),
    }


# ============== Pattern Database API ==============


@app.get("/api/v1/pattern/types")
async def get_pattern_types():
    """Get all pattern types with registered instances."""
    return {"types": pattern_db.get_all_pattern_types()}


@app.get("/api/v1/pattern/types/{pattern_type}/stats")
async def get_pattern_statistics(pattern_type: str):
    """Get statistics for a pattern type."""
    stats = await pattern_db.get_pattern_stats(pattern_type)
    if stats is None:
        raise HTTPException(status_code=404, detail="Pattern type not found")
    return {
        "pattern_type": stats.pattern_type,
        "total_instances": stats.total_instances,
        "repos_count": stats.repos_count,
        "repos": stats.repos,
        "top_files": stats.top_files,
        "avg_confidence": stats.avg_confidence,
    }


@app.post("/api/v1/pattern/search")
async def search_patterns(
    pattern_type: Optional[str] = None,
    repo_id: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 50,
):
    """Search patterns across repositories."""
    result = await pattern_db.search(
        pattern_type=pattern_type,
        repo_id=repo_id,
        query=query,
        limit=limit,
    )
    return {
        "instances": [i.to_dict() for i in result.instances],
        "total_count": result.total_count,
        "search_time_ms": result.search_time_ms,
        "pattern_type": result.pattern_type,
    }


@app.post("/api/v1/pattern/find-similar")
async def find_similar_patterns(
    code: str,
    pattern_type: Optional[str] = None,
    max_results: int = 10,
):
    """Find patterns similar to given code."""
    similar = await pattern_db.find_similar(
        code=code,
        pattern_type=pattern_type,
        max_results=max_results,
    )
    return {
        "similar": [s.to_dict() for s in similar],
        "count": len(similar),
    }


class RegisterPatternRequest(BaseModel):
    pattern_type: str
    repo_id: str
    entity_id: str
    entity_name: str
    file_path: str
    code_snippet: str
    purpose: str
    confidence: float = 0.7
    tags: List[str] = []


@app.post("/api/v1/pattern/register")
async def register_pattern(request: RegisterPatternRequest):
    """Register a new pattern instance."""
    code_hash = hashlib.sha256(request.code_snippet.encode()).hexdigest()[:16]

    pattern = pattern_db.PatternInstance(
        pattern_type=request.pattern_type,
        repo_id=request.repo_id,
        entity_id=request.entity_id,
        entity_name=request.entity_name,
        file_path=request.file_path,
        code_snippet=request.code_snippet[:1000],
        code_hash=code_hash,
        purpose=request.purpose,
        confidence=request.confidence,
        tags=request.tags,
    )

    registered = await pattern_db.register_pattern(pattern, auto_detect_type=False)

    return {
        "registered": registered,
        "pattern_type": request.pattern_type,
        "entity_id": request.entity_id,
    }


@app.get("/api/v1/pattern/repos")
async def get_repos_with_patterns():
    """Get repos that have patterns registered."""
    return {"repos": pattern_db.get_repos_with_patterns()}


# ============== Analyze Pipeline Integration ==============


@app.post("/api/v1/repos/{owner}/{name}/register-cross-repo")
async def register_to_cross_repo(owner: str, name: str):
    """Register repository to cross-repo graph and pattern database."""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]

    # Merge entity graph
    repo_graph = entities.EntityGraph()
    for entity in repo_data.get("entities", []):
        repo_graph.add_entity(entity)
    repo_graph.build_relationships()

    await cross_graph.merge_repo_graph(
        repo_id, repo_graph, {"files_count": len(repo_data.get("files", []))}
    )

    # Register patterns
    code_map = {}
    repo_path = repo_data.get("repo_path", "")
    for file_info in repo_data.get("files", [])[:50]:
        content = await ingest.read_file(repo_path, file_info["path"])
        if content:
            for entity in repo_data.get("entities", []):
                if entity.get("file") == file_info["path"]:
                    code_map[entity.get("id", "")] = content

    await pattern_db.register_from_entities(
        repo_id, repo_data.get("entities", []), code_map
    )

    return {
        "status": "registered",
        "repo_id": repo_id,
        "cross_graph_nodes": cross_graph.get_repo_stats(repo_id).get("total_nodes", 0),
    }


# ============== Team Knowledge Mapping API ==============


@app.get("/api/v1/repos/{owner}/{name}/team/analyze")
async def analyze_team_knowledge(owner: str, name: str):
    """Analyze team knowledge and expertise"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .team_knowledge import TeamKnowledgeMapper

    mapper = TeamKnowledgeMapper(repo_path)
    result = mapper.analyze_contributions()

    repo_data["team_knowledge"] = result

    return {"repo": repo_id, **result}


@app.get("/api/v1/repos/{owner}/{name}/ownership")
async def get_module_ownership(owner: str, name: str):
    """Get module ownership map"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .team_knowledge import TeamKnowledgeMapper

    mapper = TeamKnowledgeMapper(repo_path)
    ownership = mapper.get_all_ownership()

    return {"repo": repo_id, **ownership}


@app.get("/api/v1/repos/{owner}/{name}/expertise/{author}")
async def get_contributor_expertise(owner: str, name: str, author: str):
    """Get expertise profile for a contributor"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .team_knowledge import TeamKnowledgeMapper

    mapper = TeamKnowledgeMapper(repo_path)
    expertise = mapper.get_contributor_expertise(author.lower())

    return {"repo": repo_id, **expertise}


@app.get("/api/v1/repos/{owner}/{name}/reviewers/{file_path:path}")
async def suggest_reviewers(owner: str, name: str, file_path: str, exclude: str = ""):
    """Suggest reviewers for a file"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .team_knowledge import TeamKnowledgeMapper

    mapper = TeamKnowledgeMapper(repo_path)
    excluded = exclude.split(",") if exclude else []
    suggestions = mapper.suggest_reviewers([file_path], exclude=excluded)

    return {"repo": repo_id, "file": file_path, "suggestions": suggestions}


@app.get("/api/v1/repos/{owner}/{name}/knowledge-gaps")
async def get_knowledge_gaps(owner: str, name: str):
    """Detect single points of failure and knowledge gaps"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .team_knowledge import TeamKnowledgeMapper

    mapper = TeamKnowledgeMapper(repo_path)
    gaps = mapper.get_knowledge_gaps()

    return {
        "repo": repo_id,
        "gaps": [
            {
                "path": g.path,
                "issue_type": g.issue_type,
                "description": g.description,
                "severity": g.severity,
                "owner": g.owner,
            }
            for g in gaps
        ],
        "total_gaps": len(gaps),
    }


@app.get("/api/v1/repos/{owner}/{name}/team/contributors")
async def get_team_contributors(owner: str, name: str):
    """Get all contributors and their stats"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .contributor import ContributorTracker

    tracker = ContributorTracker(repo_path)
    result = tracker.analyze_contributors()

    contributors = tracker.get_all_contributors()

    return {"repo": repo_id, "contributors": contributors, "total": len(contributors)}


@app.get("/api/v1/repos/{owner}/{name}/team/contributors/{author}")
async def get_contributor_detail(owner: str, name: str, author: str):
    """Get detailed stats for a specific contributor"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    from .contributor import ContributorTracker

    tracker = ContributorTracker(repo_path)
    tracker.analyze_contributors()

    contributor = tracker.get_contributor(author.lower())

    if not contributor:
        raise HTTPException(status_code=404, detail="Contributor not found")

    timeline = tracker.get_activity_timeline(author.lower())

    return {"repo": repo_id, **contributor, "timeline": timeline}


# ============== Architecture Simulation API ==============


class SimulateWhatIfRequest(BaseModel):
    scenario_type: str
    target: str
    action: str
    into: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


class MigrationRequest(BaseModel):
    current_state: str
    target_state: str
    constraints: Optional[Dict[str, Any]] = None


@app.post("/api/v1/simulate/what-if")
async def simulate_what_if(request: SimulateWhatIfRequest):
    """Run what-if analysis for a proposed architecture change."""
    sim_request = sim_engine.SimulationRequest(
        scenario_type=request.scenario_type,
        target=request.target,
        action=request.action,
        into=request.into,
        options=request.options,
    )

    include_llm = (
        request.options.get("include_llm_reasoning", True) if request.options else True
    )
    depth_str = request.options.get("depth", "medium") if request.options else "medium"
    depth = sim_engine.SimulationDepth(depth_str)

    engine = sim_engine.SimulationEngine()
    result = engine.simulate(
        sim_request, include_llm_reasoning=include_llm, depth=depth
    )

    return {
        "simulation_id": result.simulation_id,
        "tier_used": result.tier_used.value,
        "scenario_type": result.scenario_type,
        "target": result.target,
        "predictions": result.predictions,
        "risks": result.risks,
        "recommendations": result.recommendations,
        "affected_decisions": result.affected_decisions,
        "complexity_score": result.complexity_score,
        "execution_time_ms": result.execution_time_ms,
        "llm_reasoning": result.llm_reasoning,
        "timestamp": result.timestamp,
    }


@app.get("/api/v1/simulate/{simulation_id}")
async def get_simulation(simulation_id: str):
    """Get a previous simulation by ID."""
    engine = sim_engine.SimulationEngine()
    result = engine.get_simulation(simulation_id)

    if not result:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {
        "simulation_id": result.simulation_id,
        "tier_used": result.tier_used.value,
        "scenario_type": result.scenario_type,
        "target": result.target,
        "predictions": result.predictions,
        "risks": result.risks,
        "recommendations": result.recommendations,
        "execution_time_ms": result.execution_time_ms,
    }


@app.get("/api/v1/simulate/blast-radius/{file_path:path}")
async def get_blast_radius(owner: str, name: str, file_path: str):
    """Get blast radius for a file change."""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]

    graph = entities.EntityGraph()
    for entity in repo_data.get("entities", []):
        graph.add_entity(entity)
    graph.build_relationships()

    analyzer = BlastRadiusAnalyzer(graph)
    result = analyzer.analyze(file_path, "modify")

    return {
        "target_file": result.target_file,
        "total_affected_files": result.total_affected_files,
        "total_affected_entities": result.total_affected_entities,
        "zones": [
            {
                "zone_name": zone.zone_name,
                "severity": zone.severity,
                "files": zone.files,
                "description": zone.description,
            }
            for zone in result.zones
        ],
        "direct_dependencies": result.direct_dependencies,
        "transitive_dependencies": result.transitive_dependencies,
        "import_updates_required": result.import_updates_required,
        "breaking_changes": result.breaking_changes,
        "estimated_effort_hours": result.estimated_effort_hours,
        "confidence": result.confidence,
    }


@app.post("/api/v1/simulate/migration")
async def plan_migration(request: MigrationRequest):
    """Plan migration path from current state to target state."""
    constraints = request.constraints or {}

    migration_request = sim_engine.MigrationPathRequest(
        current_state=request.current_state,
        target_state=request.target_state,
        constraints=constraints,
    )

    engine = sim_engine.SimulationEngine()
    result = engine.plan_migration(migration_request)

    return {
        "path_id": result.path_id,
        "current_state": result.current_state,
        "target_state": result.target_state,
        "steps": result.steps,
        "estimated_total_hours": result.estimated_total_hours,
        "risks": result.risks,
        "dependencies": result.dependencies,
    }


# ============== Developer Profile API ==============


class ProfileUpdateRequest(BaseModel):
    preferred_paradigm: Optional[str] = None
    preferred_language: Optional[str] = None
    naming_conventions: Optional[List[str]] = None
    explanation_depth: Optional[str] = None
    include_examples: Optional[bool] = None
    technical_level: Optional[str] = None
    query_style: Optional[str] = None


class ProfileFeedbackRequest(BaseModel):
    correction: str
    preferred_style: Optional[str] = None


@app.post("/api/v1/repos/{owner}/{name}/profiles/{dev_id}/build")
async def build_profile(owner: str, name: str, dev_id: str):
    """Build developer profile from git history"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    repo_data = repos_storage[repo_id]
    repo_path = repo_data["repo_path"]

    profile = profile_builder.build_profile_for_repo(
        repo_path=repo_path,
        user_id=dev_id,
        repo_id=repo_id,
    )

    profile_module.save_profile(profile)

    return {
        "status": "complete",
        "profile": profile.to_dict(),
    }


@app.get("/api/v1/repos/{owner}/{name}/profiles/{dev_id}")
async def get_profile(owner: str, name: str, dev_id: str):
    """Get developer profile"""
    repo_id = f"{owner}/{name}"

    profile = profile_module.load_profile(repo_id, dev_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile.to_dict()


@app.put("/api/v1/repos/{owner}/{name}/profiles/{dev_id}")
async def update_profile(
    owner: str, name: str, dev_id: str, request: ProfileUpdateRequest
):
    """Update developer profile preferences"""
    repo_id = f"{owner}/{name}"

    profile = profile_module.load_profile(repo_id, dev_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if request.preferred_paradigm:
        profile.preferred_paradigm = request.preferred_paradigm
    if request.preferred_language:
        profile.preferred_language = request.preferred_language
    if request.naming_conventions:
        profile.naming_conventions = request.naming_conventions
    if request.explanation_depth:
        profile.explanation_depth = request.explanation_depth
    if request.include_examples is not None:
        profile.include_examples = request.include_examples
    if request.technical_level:
        profile.technical_level = request.technical_level
    if request.query_style:
        profile.query_style = request.query_style

    profile.updated_at = datetime.now()
    profile_module.save_profile(profile)

    return {
        "status": "updated",
        "profile": profile.to_dict(),
    }


@app.delete("/api/v1/repos/{owner}/{name}/profiles/{dev_id}")
async def delete_profile(owner: str, name: str, dev_id: str):
    """Delete developer profile"""
    repo_id = f"{owner}/{name}"

    store = profile_module.ProfileStore()
    deleted = store.delete(repo_id, dev_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"status": "deleted", "dev_id": dev_id}


@app.get("/api/v1/repos/{owner}/{name}/profiles")
async def list_profiles(owner: str, name: str):
    """List all profiles for a repository"""
    repo_id = f"{owner}/{name}"

    store = profile_module.ProfileStore()
    profiles = store.list_profiles(repo_id)

    return {"profiles": [p.to_dict() for p in profiles], "count": len(profiles)}


@app.post("/api/v1/repos/{owner}/{name}/profiles/{dev_id}/feedback")
async def submit_feedback(
    owner: str, name: str, dev_id: str, request: ProfileFeedbackRequest
):
    """Submit feedback to refine profile"""
    repo_id = f"{owner}/{name}"

    profile = profile_module.load_profile(repo_id, dev_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.feedback_signals += 1
    profile.updated_at = datetime.now()

    if request.preferred_style:
        if request.preferred_style == "functional":
            profile.preferred_paradigm = "functional"
        elif request.preferred_style == "oop":
            profile.preferred_paradigm = "oop"

    profile_module.save_profile(profile)

    return {
        "status": "feedback recorded",
        "feedback_signals": profile.feedback_signals,
    }


# ============== Profile-Aware Query API ==============


@app.post("/api/v1/repos/{owner}/{name}/query")
async def query_repository(
    owner: str,
    name: str,
    request: QueryRequest,
    x_developer_id: Optional[str] = Header(None, alias="X-Developer-ID"),
):
    """Query the compiled wiki with optional profile"""
    repo_id = f"{owner}/{name}"

    if repo_id not in repos_storage:
        raise HTTPException(status_code=404, detail="Repository not analyzed yet")

    profile = None
    if x_developer_id:
        profile = profile_module.load_profile(repo_id, x_developer_id)

    wiki_engine = wiki.WikiEngine(repos_storage[repo_id]["wiki_path"])
    result = wiki_engine.query(request.question)

    if profile:
        from .context_injector import adapt_response

        result["answer"] = adapt_response(result.get("answer", ""), profile)

    return result


# ============== Real-time Collaboration ==============

_collab_manager: Optional[collaborate.CollaborationManager] = None


async def get_collab_manager() -> collaborate.CollaborationManager:
    global _collab_manager
    if _collab_manager is None:
        wiki_path = os.getenv("WIKI_PATH", "./wiki")
        redis_url = os.getenv("REDIS_URL")
        _collab_manager = collaborate.CollaborationManager(wiki_path, redis_url)
        await _collab_manager.initialize()
    return _collab_manager


@app.on_event("startup")
async def startup_collab():
    await get_collab_manager()


@app.on_event("shutdown")
async def shutdown_collab():
    global _collab_manager
    if _collab_manager:
        await _collab_manager.shutdown()


class CollabJoinRequest(BaseModel):
    user_id: str
    user_name: str
    role: Literal["editor", "viewer"] = "editor"


class CollabEditRequest(BaseModel):
    op_type: Literal["insert", "delete"]
    content: str
    position: int
    version: int
    user_id: str


class CollabPresenceUpdate(BaseModel):
    user_id: str
    cursor_pos: Optional[int] = None
    selection: Optional[Dict[str, int]] = None


@app.get("/api/v1/wiki/{page}/presence")
async def get_presence_sse(
    page: str,
    request: Request,
    user_id: str = "",
    user_name: str = "Anonymous",
):
    """SSE stream for presence updates on a wiki page."""
    if not user_id:
        user_id = request.headers.get("X-User-ID", "anonymous")

    manager = await get_collab_manager()
    await manager.join_page(page, user_id, user_name)

    async def event_stream():
        try:
            async for data in manager.presence.subscribe(page, user_id):
                yield data
        except asyncio.CancelledError:
            await manager.leave_page(page, user_id)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/v1/wiki/{page}/join")
async def join_collab_room(page: str, request: CollabJoinRequest):
    """Join a collaboration room."""
    manager = await get_collab_manager()
    result = await manager.join_page(
        page_id=page,
        user_id=request.user_id,
        user_name=request.user_name,
        role=request.role,
    )
    return result


@app.post("/api/v1/wiki/{page}/leave")
async def leave_collab_room(page: str, request: CollabJoinRequest):
    """Leave a collaboration room."""
    manager = await get_collab_manager()
    result = await manager.leave_page(page, request.user_id)
    return {"status": "left" if result else "not_in_room", "page": page}


@app.post("/api/v1/wiki/{page}/edit")
async def submit_edit(page: str, request: CollabEditRequest):
    """Submit an edit to a wiki page with version check."""
    manager = await get_collab_manager()
    result = await manager.apply_edit(
        page_id=page,
        user_id=request.user_id,
        op_type=request.op_type,
        content=request.content,
        position=request.position,
        version=request.version,
    )
    return result


@app.get("/api/v1/wiki/{page}/collaborators")
async def get_collaborators(page: str):
    """Get active collaborators for a wiki page."""
    manager = await get_collab_manager()
    result = await manager.get_collaborators(page)
    return result


@app.get("/api/v1/wiki/{page}/content")
async def get_collab_content(page: str):
    """Get current content and version for a wiki page."""
    manager = await get_collab_manager()
    result = await manager.get_page_content(page)
    return result


@app.post("/api/v1/wiki/{page}/save")
async def save_collab_page(page: str):
    """Persist collaboration content to filesystem."""
    manager = await get_collab_manager()
    result = await manager.save_page(page)
    return result


@app.post("/api/v1/wiki/{page}/presence-update")
async def update_presence(page: str, request: CollabPresenceUpdate):
    """Update cursor position or selection for a user."""
    manager = await get_collab_manager()
    result = await manager.update_presence(
        page_id=page,
        user_id=request.user_id,
        cursor_pos=request.cursor_pos,
        selection=request.selection,
    )
    return {"status": "ok" if result else "not_found"}


@app.get("/api/v1/collaboration/health")
async def collab_health():
    """Health check for collaboration service."""
    manager = await get_collab_manager()
    return await manager.health_check()


@app.get("/api/v1/collaboration/active-pages")
async def get_active_pages():
    """Get all pages with active collaborators."""
    manager = await get_collab_manager()
    return await manager.get_all_active_pages()


@app.get("/api/v1/collaboration/repos/{owner}/{name}/live-collaborators")
async def get_live_collaborators(owner: str, name: str):
    """Get live collaborators across all wiki pages for a repository."""
    manager = await get_collab_manager()
    repo_id = f"{owner}/{name}"

    active_pages = await manager.get_all_active_pages()

    total_collaborators = set()
    for page_info in active_pages.get("active_pages", []):
        for user in page_info.get("users", []):
            total_collaborators.add((user["user_id"], user["user_name"]))

    return {
        "repo": repo_id,
        "total_active": len(total_collaborators),
        "collaborators": [
            {"user_id": uid, "user_name": uname} for uid, uname in total_collaborators
        ],
        "active_pages": len(active_pages.get("active_pages", [])),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3003"))
    uvicorn.run(app, host="0.0.0.0", port=port)
