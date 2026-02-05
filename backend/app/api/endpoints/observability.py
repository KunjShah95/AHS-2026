"""
CodeFlow - Observability API Endpoints
====================================

API endpoints for:
- Health checks
- Metrics
- Performance profiling
- Tracing

Usage:
    from app.api.endpoints.observability import router
    app.include_router(router, prefix="/api/v1/observability")
"""

import os
import time
import psutil
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from datetime import datetime

from app.core.observability import (
    metrics,
    tracer,
    health_checker,
    profiler,
    cloud_logger,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/observability", tags=["observability"])


# Response Models
class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: str
    version: str
    uptime_seconds: float
    checks: Dict[str, Any]


class MetricsResponse(BaseModel):
    """Metrics response."""

    counters: Dict[str, int]
    gauges: Dict[str, float]
    histograms: Dict[str, Dict[str, float]]


class TraceResponse(BaseModel):
    """Trace creation response."""

    trace_id: str
    span_id: str
    message: str


class PerformanceResponse(BaseModel):
    """Performance profile response."""

    functions: Dict[str, Any]
    total_calls: int
    timestamp: str
    memory: Optional[Dict[str, Any]] = None


class SystemInfoResponse(BaseModel):
    """System information response."""

    python_version: str
    platform: str
    cpu_percent: float
    memory_mb: Dict[str, float]
    disk_mb: Dict[str, float]


# Startup time tracking
_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint.

    Checks all dependencies and returns overall status.
    """
    overall_health = await health_checker.check_all()

    uptime = time.time() - _start_time

    return HealthResponse(
        status=overall_health["status"],
        timestamp=overall_health["timestamp"],
        version="2.0.0",
        uptime_seconds=round(uptime, 2),
        checks=overall_health["checks"],
    )


@router.get("/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe.

    Returns 200 if the service is alive.
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_check():
    """
    Kubernetes readiness probe.

    Returns 200 if the service is ready to accept traffic.
    """
    health = await health_checker.check_all()

    if health["status"] == "unhealthy":
        raise HTTPException(
            status_code=503, detail={"status": "not_ready", "checks": health["checks"]}
        )

    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/component/{component_name}")
async def component_health(component_name: str):
    """Check health of specific component."""
    result = await health_checker.check_component(component_name)
    return result


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """
    Get current metrics.

    Returns counters, gauges, and histogram statistics.
    """
    all_metrics = metrics.get_all_metrics()

    return MetricsResponse(
        counters=all_metrics["counters"],
        gauges=all_metrics["gauges"],
        histograms=all_metrics["histograms"],
    )


@router.get("/metrics/counter/{name}")
async def get_counter(name: str):
    """Get specific counter value."""
    value = metrics.get_counter(name)
    return {"name": name, "value": value}


@router.get("/metrics/gauge/{name}")
async def get_gauge(name: str):
    """Get specific gauge value."""
    value = metrics.get_gauge(name)
    return {"name": name, "value": value}


@router.get("/metrics/histogram/{name}")
async def get_histogram(name: str):
    """Get histogram statistics."""
    stats = metrics.get_histogram(name)
    return {"name": name, **stats}


@router.post("/metrics/counter/{name}")
async def increment_counter(name: str, value: int = 1):
    """Increment a counter."""
    new_value = metrics.counter(name, value)
    return {"name": name, "value": new_value}


@router.post("/metrics/gauge/{name}")
async def set_gauge(name: str, value: float):
    """Set a gauge value."""
    metrics.gauge(name, value)
    return {"name": name, "value": value}


@router.get("/trace/start", response_model=TraceResponse)
async def start_trace(name: str):
    """
    Start a distributed trace.

    Returns trace_id and span_id for correlation.
    """
    with tracer.trace(name) as span:
        trace_id = tracer.get_trace_id()
        span_id = tracer.get_span_id()

        return TraceResponse(
            trace_id=trace_id or "",
            span_id=span_id or "",
            message=f"Trace '{name}' started",
        )


@router.get("/trace/{trace_id}/span")
async def create_span(
    trace_id: str, span_name: str, attributes: Optional[Dict[str, str]] = None
):
    """Create a child span in existing trace."""
    context = {"trace_id": trace_id}

    with tracer.create_child_span(span_name, context) as span:
        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)

        return {
            "span_name": span_name,
            "parent_trace_id": trace_id,
            "message": f"Span '{span_name}' created",
        }


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance():
    """Get performance profile."""
    report = profiler.get_profile_report()
    return PerformanceResponse(**report)


@router.get("/performance/memory")
async def get_memory_info():
    """Get current memory usage."""
    sample = profiler.track_memory()

    if sample:
        return sample

    return {"error": "psutil not installed", "rss_mb": 0, "vms_mb": 0}


@router.get("/performance/reset")
async def reset_performance():
    """Reset performance profiling data."""
    profiler.reset()
    metrics.reset()
    return {"message": "Performance metrics reset"}


@router.get("/system", response_model=SystemInfoResponse)
async def get_system_info():
    """Get system information."""
    process = psutil.Process()
    memory_info = process.memory_info()
    disk = psutil.disk_usage("/")

    return SystemInfoResponse(
        python_version=os.sys.version,
        platform=os.sys.platform,
        cpu_percent=psutil.cpu_percent(),
        memory_mb={
            "rss": memory_info.rss / (1024 * 1024),
            "vms": memory_info.vms / (1024 * 1024),
            "available": psutil.virtual_memory().available / (1024 * 1024),
            "percent": psutil.virtual_memory().percent,
        },
        disk_mb={
            "total": disk.total / (1024 * 1024),
            "used": disk.used / (1024 * 1024),
            "free": disk.free / (1024 * 1024),
            "percent": disk.percent,
        },
    )


@router.get("/uptime")
async def get_uptime():
    """Get service uptime."""
    uptime = time.time() - _start_time

    return {
        "uptime_seconds": round(uptime, 2),
        "uptime_formatted": str(datetime.fromtimestamp(_start_time)),
        "started_at": datetime.fromtimestamp(_start_time).isoformat(),
    }


@router.get("/version")
async def get_version():
    """Get service version."""
    return {
        "version": "2.0.0",
        "name": "CodeFlow AI Onboarding Platform",
        "adk_enabled": True,
        "observability_enabled": True,
    }


@router.get("/logs/recent")
async def get_recent_logs(limit: int = 100, level: Optional[str] = None):
    """Get recent log entries (for debugging)."""
    return {
        "message": "Log retrieval not implemented - use Cloud Logging console",
        "limit": limit,
        "level_filter": level,
    }


@router.get("/agents/metrics")
async def get_agent_metrics():
    """Get metrics for all agents."""
    agent_metrics = {}

    for agent_name in [
        "codebase_architect",
        "learning_path_architect",
        "task_generator",
        "interactive_tutor",
        "progress_coach",
    ]:
        agent_metrics[agent_name] = {
            "executions": metrics.get_counter(f"agent.{agent_name}.executions"),
            "errors": metrics.get_counter(f"agent.{agent_name}.errors"),
            "avg_duration_ms": metrics.get_histogram(
                f"agent.{agent_name}.duration_ms"
            ).get("avg", 0),
        }

    return {"agents": agent_metrics, "timestamp": datetime.utcnow().isoformat()}


@router.get("/requests/recent")
async def get_recent_request_metrics():
    """Get metrics for recent requests."""
    return {
        "total_requests": metrics.get_counter("http.requests.total"),
        "successful_requests": metrics.get_counter("http.requests.success"),
        "failed_requests": metrics.get_counter("http.requests.failed"),
        "avg_response_time_ms": metrics.get_histogram("http.requests.duration_ms").get(
            "avg", 0
        ),
        "active_connections": metrics.get_gauge("http.connections.active") or 0,
    }


@router.post("/debug/enable")
async def enable_debug_mode():
    """Enable debug logging temporarily."""
    import logging

    logging.getLogger().setLevel(logging.DEBUG)
    return {"message": "Debug logging enabled for 60 seconds"}


@router.get("/debug/trace")
async def enable_request_tracing(
    user_id: Optional[str] = None, correlation_id: Optional[str] = None
):
    """Enable detailed tracing for debugging."""
    correlation = correlation_id or f"debug-{int(time.time())}"

    cloud_logger.set_context(correlation_id=correlation, user_id=user_id)

    return {
        "message": "Detailed tracing enabled",
        "correlation_id": correlation,
        "expires_in_seconds": 60,
    }
