from fastapi import FastAPI, HTTPException, Request, Response
from app.api.endpoints import analytics, learning, ingestion, tutor, progress
from app.api.endpoints import team_analytics, quiz, knowledge_base, playbooks, first_pr
from app.api.endpoints import security, observability
import os
import time
import uuid
from dotenv import load_dotenv
from typing import List, Dict, Any
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CodeFlow - AI Onboarding Intelligence Platform",
    description="Enterprise-grade AI-driven codebase onboarding system with team analytics, knowledge verification, and accelerated first contributions",
    version="2.0.0",
)

from fastapi.middleware.cors import CORSMiddleware

# Configure CORS based on environment
allowed_origins = [
    "http://localhost:5173",  # Local dev - Vite
    "http://localhost:3000",  # Local dev - alternate
    "http://localhost:8000",  # Local dev - backend
]

# Add production URLs from environment
if frontend_url := os.getenv("FRONTEND_URL_PROD"):
    allowed_origins.append(frontend_url)

# Allow all Vercel preview deployments
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 4: Observability Middleware
from app.core.observability import metrics, tracer


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """Track request metrics and tracing."""
    start_time = time.perf_counter()

    correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

    try:
        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000

        metrics.counter("http.requests.total")
        metrics.histogram("http.requests.duration_ms", duration_ms)

        if 200 <= response.status_code < 300:
            metrics.counter("http.requests.success")
        else:
            metrics.counter("http.requests.failed")

        response.headers["X-Correlation-ID"] = correlation_id

        return response

    except Exception as e:
        metrics.counter("http.requests.errors")
        raise


# Include routers (commented out until created)
app.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])
app.include_router(learning.router, prefix="/learning", tags=["learning"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(tutor.router, prefix="/tutor", tags=["tutor"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])

# Enterprise Features - Differentiators from MCP+Cursor
app.include_router(
    team_analytics.router, prefix="/team-analytics", tags=["team-analytics"]
)
app.include_router(quiz.router, prefix="/quiz", tags=["knowledge-verification"])
app.include_router(knowledge_base.router, prefix="/knowledge", tags=["knowledge-base"])
app.include_router(playbooks.router, prefix="/playbooks", tags=["playbooks"])
app.include_router(first_pr.router, prefix="/first-pr", tags=["first-pr-acceleration"])

# Phase 3: Enterprise Security
app.include_router(security.router, prefix="/api/v1", tags=["security"])

# Phase 4: Observability
app.include_router(observability.router, prefix="/api/v1", tags=["observability"])


# Phase 1: ADK-based Orchestrator Integration
from app.agents import (
    get_adk_orchestrator,
    get_agent_registry,
    register_codeflow_agents,
    ADKOrchestrator,
)


# Initialize ADK orchestrator and registry on startup
@app.on_event("startup")
async def initialize_adk():
    """Initialize ADK orchestrator and register agents."""
    try:
        orchestrator = get_adk_orchestrator()
        register_codeflow_agents()
        registry = get_agent_registry()
        print(
            f"ADK Orchestrator initialized with {len(orchestrator.get_all_agents())} agents"
        )
        print(f"Agent Registry has {len(registry.get_all_agents())} registered agents")
    except Exception as e:
        print(f"Warning: Could not initialize ADK components: {e}")


class OnboardingRequest(BaseModel):
    """Request body for ADK-based onboarding."""

    user_id: str
    repository_url: str
    file_tree: List[Dict[str, Any]]
    developer_level: str = "junior"
    time_available: str = "2 weeks"


class OnboardingResponse(BaseModel):
    """Response from ADK-based onboarding."""

    success: bool
    session_id: str
    message: str
    architecture_summary: Dict[str, Any]
    learning_path_summary: Dict[str, Any]
    initial_tasks: List[Dict[str, Any]]
    next_steps: List[str]


@app.post("/adk/onboarding", response_model=OnboardingResponse)
async def start_adk_onboarding(request: OnboardingRequest):
    """
    Start onboarding using the new ADK-based orchestrator.

    This endpoint uses Google Agent Development Kit patterns
    for improved agent coordination and scalability.
    """
    try:
        orchestrator = get_adk_orchestrator()
        result = await orchestrator.start_onboarding(
            user_id=request.user_id,
            repository_url=request.repository_url,
            file_tree=request.file_tree,
            developer_level=request.developer_level,
            time_available=request.time_available,
        )

        if not result["success"]:
            raise HTTPException(
                status_code=500, detail=result.get("error", "Unknown error")
            )

        return OnboardingResponse(
            success=True,
            session_id=result["session_id"],
            message=result["message"],
            architecture_summary=result.get("architecture_summary", {}),
            learning_path_summary=result.get("learning_path_summary", {}),
            initial_tasks=result.get("initial_tasks", []),
            next_steps=result.get("next_steps", []),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/adk/health")
async def adk_health_check():
    """
    Health check for ADK components.

    Returns status of all agents and the orchestrator.
    """
    try:
        orchestrator = get_adk_orchestrator()
        registry = get_agent_registry()

        agent_health = await orchestrator.health_check_all()
        registry_stats = registry.get_registry_stats()

        return {
            "status": "healthy",
            "orchestrator": {
                "initialized": True,
                "agent_count": len(orchestrator.get_all_agents()),
            },
            "agents": agent_health,
            "registry": registry_stats,
        }
    except Exception as e:
        return {"status": "degraded", "error": str(e)}


@app.get("/adk/agents")
async def list_agents():
    """List all registered agents and their capabilities."""
    try:
        registry = get_agent_registry()
        agents = registry.get_all_agents()

        return {
            "agents": [agent.to_dict() for agent in agents],
            "total_count": len(agents),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {
        "message": "CodeFlow - AI Onboarding Intelligence Platform",
        "version": "2.0.0",
        "adk_enabled": True,
        "features": [
            "Team Analytics Dashboard",
            "Knowledge Verification Quizzes",
            "Collaborative Knowledge Base",
            "Onboarding Playbooks",
            "First PR Acceleration Mode",
            "Google ADK Agent Orchestration",
            "Agent-to-Agent (A2A) Protocol",
        ],
        "docs": "/docs",
        "adk_docs": "/adk",
    }


@app.get("/adk")
async def adk_info():
    """Information about ADK integration."""
    return {
        "version": "2.0.0",
        "description": "Google Agent Development Kit Integration",
        "components": [
            {
                "name": "ADK Orchestrator",
                "description": "Central coordinator for all CodeFlow agents",
                "endpoints": ["/adk/onboarding", "/adk/health"],
            },
            {
                "name": "Agent Registry",
                "description": "Central registry for agent discovery and load balancing",
                "endpoints": ["/adk/agents"],
            },
            {
                "name": "A2A Protocol",
                "description": "Agent-to-Agent communication protocol",
                "features": ["Task delegation", "Context sharing", "Dead letter queue"],
            },
        ],
        "agents": [
            "codebase_architect",
            "learning_path_architect",
            "task_generator",
            "interactive_tutor",
            "progress_coach",
        ],
    }
