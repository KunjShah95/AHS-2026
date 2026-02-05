"""
CodeFlow - Observability Module
================================

Production-grade observability with:
- Google Cloud Logging
- OpenTelemetry Distributed Tracing
- Custom Metrics
- Health Checks
- Performance Monitoring

Features:
- Structured logging with correlation IDs
- Distributed tracing across agents
- Custom metrics (counters, gauges, histograms)
- Health check endpoints
- Performance profiling
"""

import os
import time
import logging
import json
import asyncio
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from functools import wraps, partial
import traceback
import threading
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)


@dataclass
class LogEntry:
    """Structured log entry."""

    timestamp: str
    level: str
    message: str
    service: str = "codeflow-backend"
    version: str = "2.0.0"
    correlation_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    span_id: Optional[str] = None
    trace_id: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


class CloudLogger:
    """
    Google Cloud Logging integration with structured logging.

    Features:
    - Structured JSON logs
    - Correlation IDs for tracing
    - Automatic error capturing
    - Log levels with semantic meaning
    """

    def __init__(self, service_name: str = "codeflow-backend"):
        self.service_name = service_name
        self._client = None
        self._handler = None
        self._correlation_id: Optional[str] = None
        self._user_id: Optional[str] = None
        self._session_id: Optional[str] = None

        self._initialize_logging()

    def _initialize_logging(self):
        """Initialize Python logging with JSON formatter."""
        if os.getenv("GOOGLE_CLOUD_PROJECT"):
            try:
                import google.cloud.logging

                self._client = google.cloud.logging.Client()
                self._handler = self._client.get_handler()
                logging.getLogger().addHandler(self._handler)
                logger.info("Google Cloud Logging initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Cloud Logging: {e}")

        self._setup_json_formatter()

    def _setup_json_formatter(self):
        """Setup JSON formatter for structured logging."""

        class JSONFormatter(logging.Formatter):
            def format(self, record: logging.LogRecord) -> str:
                log_entry = {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": record.levelname,
                    "message": record.getMessage(),
                    "service": "codeflow-backend",
                    "version": "2.0.0",
                    "logger": record.name,
                    "filename": record.filename,
                    "line_number": record.lineno,
                    "function": record.funcName,
                }

                if record.exc_info:
                    log_entry["exception"] = self.formatException(record.exc_info)

                if hasattr(record, "correlation_id"):
                    log_entry["correlation_id"] = record.correlation_id
                if hasattr(record, "user_id"):
                    log_entry["user_id"] = record.user_id
                if hasattr(record, "session_id"):
                    log_entry["session_id"] = record.session_id
                if hasattr(record, "span_id"):
                    log_entry["span_id"] = record.span_id
                if hasattr(record, "trace_id"):
                    log_entry["trace_id"] = record.trace_id

                return json.dumps(log_entry)

        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())

        root_logger = logging.getLogger()
        if not root_logger.handlers:
            root_logger.addHandler(handler)

        root_logger.setLevel(logging.INFO)

    def set_context(
        self,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ):
        """Set context for subsequent log entries."""
        self._correlation_id = correlation_id
        self._user_id = user_id
        self._session_id = session_id

    def log(
        self,
        level: str,
        message: str,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
        exc_info: Optional[Exception] = None,
    ):
        """Log a structured message."""
        log_entry = {
            "level": level,
            "message": message,
            "service": self.service_name,
            "correlation_id": correlation_id or self._correlation_id,
            "user_id": user_id or self._user_id,
            "session_id": session_id or self._session_id,
            "extra": extra or {},
        }

        getattr(logger, level.lower())(message, extra=log_entry)

    def info(
        self,
        message: str,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Log info message."""
        self.log("INFO", message, correlation_id, user_id, None, extra)

    def error(
        self,
        message: str,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        exc_info: Optional[Exception] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Log error message."""
        log_extra = extra or {}
        if exc_info:
            log_extra["exception"] = traceback.format_exc()
        self.log("ERROR", message, correlation_id, user_id, None, log_extra)

    def warning(
        self,
        message: str,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Log warning message."""
        self.log("WARNING", message, correlation_id, user_id, None, extra)

    def debug(
        self,
        message: str,
        correlation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        """Log debug message."""
        self.log("DEBUG", message, correlation_id, user_id, None, extra)

    def agent_action(
        self,
        agent_name: str,
        action: str,
        correlation_id: str,
        duration_ms: float,
        success: bool,
        user_id: Optional[str] = None,
        error: Optional[str] = None,
    ):
        """Log agent action with structured data."""
        self.log(
            level="INFO" if success else "ERROR",
            message=f"Agent {agent_name} {action}",
            correlation_id=correlation_id,
            user_id=user_id,
            extra={
                "agent": agent_name,
                "action": action,
                "duration_ms": duration_ms,
                "success": success,
                "error": error,
            },
        )


class MetricsCollector:
    """
    Custom metrics collector supporting:
    - Counters (increment/decrement)
    - Gauges (set value)
    - Histograms (timing distributions)
    - Timers (execution time)
    """

    def __init__(self, service_name: str = "codeflow-backend"):
        self.service_name = service_name
        self._counters: Dict[str, int] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def counter(self, name: str, value: int = 1) -> int:
        """Increment counter."""
        with self._lock:
            if name not in self._counters:
                self._counters[name] = 0
            self._counters[name] += value
            return self._counters[name]

    def gauge(self, name: str, value: float) -> float:
        """Set gauge value."""
        with self._lock:
            self._gauges[name] = value
            return value

    def histogram(self, name: str, value: float) -> float:
        """Record histogram value."""
        with self._lock:
            if name not in self._histograms:
                self._histograms[name] = []
            self._histograms[name].append(value)
            return value

    def timer(self, name: str):
        """Context manager for timing execution."""
        return TimerContext(name, self)

    def get_counter(self, name: str) -> int:
        """Get counter value."""
        return self._counters.get(name, 0)

    def get_gauge(self, name: str) -> Optional[float]:
        """Get gauge value."""
        return self._gauges.get(name)

    def get_histogram(self, name: str) -> Dict[str, float]:
        """Get histogram statistics."""
        values = self._histograms.get(name, [])
        if not values:
            return {
                "count": 0,
                "min": 0,
                "max": 0,
                "avg": 0,
                "p50": 0,
                "p95": 0,
                "p99": 0,
            }

        sorted_values = sorted(values)
        count = len(sorted_values)

        return {
            "count": count,
            "min": sorted_values[0],
            "max": sorted_values[-1],
            "avg": sum(sorted_values) / count,
            "p50": sorted_values[int(count * 0.50)],
            "p95": sorted_values[int(count * 0.95)],
            "p99": sorted_values[int(count * 0.99)],
        }

    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all metrics."""
        with self._lock:
            return {
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "histograms": {
                    name: self.get_histogram(name) for name in self._histograms
                },
            }

    def reset(self):
        """Reset all metrics."""
        with self._lock:
            self._counters.clear()
            self._gauges.clear()
            self._histograms.clear()


class TimerContext:
    """Context manager for timing execution."""

    def __init__(self, name: str, collector: MetricsCollector):
        self.name = name
        self.collector = collector
        self.start_time: Optional[float] = None

    def __enter__(self) -> "TimerContext":
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.perf_counter() - self.start_time) * 1000
        self.collector.histogram(self.name, duration_ms)
        self.collector.counter(f"{self.name}_count")

        if exc_type:
            self.collector.counter(f"{self.name}_errors")

        return False


class DistributedTracer:
    """
    OpenTelemetry-compatible distributed tracing.

    Features:
    - Trace/span creation
    - Context propagation
    - Automatic span attributes
    - Sampling support
    """

    def __init__(self, service_name: str = "codeflow-backend"):
        self.service_name = service_name
        self._tracer = None
        self._current_span = None
        self._trace_id: Optional[str] = None
        self._span_id: Optional[str] = None

        self._initialize_tracing()

    def _initialize_tracing(self):
        """Initialize OpenTelemetry tracing."""
        if os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"):
            try:
                from opentelemetry import trace
                from opentelemetry.sdk.trace import TracerProvider
                from opentelemetry.sdk.trace.export import (
                    BatchSpanProcessor,
                    ConsoleSpanExporter,
                )
                from opentelemetry.sdk.resources import Resource
                from opentelemetry.semconv.resource import ResourceAttributes

                resource = Resource.create(
                    {
                        ResourceAttributes.SERVICE_NAME: self.service_name,
                        ResourceAttributes.SERVICE_VERSION: "2.0.0",
                    }
                )

                provider = TracerProvider(resource=resource)

                # Add exporter (Cloud Trace or console)
                if os.getenv("GOOGLE_CLOUD_PROJECT"):
                    from opentelemetry.exporter.cloud_trace import (
                        CloudTraceSpanExporter,
                    )

                    exporter = CloudTraceSpanExporter()
                else:
                    exporter = ConsoleSpanExporter()

                provider.add_span_processor(BatchSpanProcessor(exporter))
                trace.set_tracer_provider(provider)

                self._tracer = trace.get_tracer(__name__)
                logger.info("OpenTelemetry tracing initialized")

            except Exception as e:
                logger.warning(f"Failed to initialize tracing: {e}")

    @asynccontextmanager
    async def trace(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ):
        """Create a traced span."""
        start_time = time.perf_counter()

        if self._tracer:
            with self._tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, str(value))

                if correlation_id:
                    span.set_attribute("correlation_id", correlation_id)

                self._current_span = span
                self._trace_id = span.get_span_context().trace_id
                self._span_id = span.get_span_context().span_id

                try:
                    yield span
                except Exception as e:
                    span.set_status(trace.StatusCode.ERROR, str(e))
                    span.record_exception(e)
                    raise
                finally:
                    duration_ms = (time.perf_counter() - start_time) * 1000
                    metrics.counter(f"trace.{name}.duration_ms", int(duration_ms))
        else:
            # Fallback without OpenTelemetry
            yield None

    def get_trace_id(self) -> Optional[str]:
        """Get current trace ID."""
        return self._trace_id

    def get_span_id(self) -> Optional[str]:
        """Get current span ID."""
        return self._span_id

    def create_child_span(
        self, name: str, parent_context: Optional[Dict[str, Any]] = None
    ) -> "SpanContext":
        """Create a child span."""
        return SpanContext(name, self, parent_context)


class SpanContext:
    """Context manager for child spans."""

    def __init__(
        self,
        name: str,
        tracer: DistributedTracer,
        parent_context: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.tracer = tracer
        self.parent_context = parent_context
        self.start_time: Optional[float] = None
        self.attributes: Dict[str, Any] = {}
        self._span = None

    def set_attribute(self, key: str, value: Any) -> "SpanContext":
        """Set span attribute."""
        self.attributes[key] = str(value)
        return self

    def __enter__(self) -> "SpanContext":
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.perf_counter() - self.start_time) * 1000

        metrics.counter(f"span.{self.name}.count")
        metrics.histogram(f"span.{self.name}.duration_ms", duration_ms)

        if exc_type:
            metrics.counter(f"span.{self.name}.errors")

        return False


class HealthChecker:
    """
    Health check system with configurable checks.

    Features:
    - Multiple health check types
    - Dependency checking
    - Custom health indicators
    - Cached results
    """

    def __init__(self):
        self._checks: Dict[str, Callable] = {}
        self._last_results: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl_seconds = 10

    def register_check(self, name: str, check_func: Callable):
        """Register a health check."""
        self._checks[name] = check_func

    async def check_all(self) -> Dict[str, Any]:
        """Run all health checks."""
        results = {}
        overall_status = "healthy"

        for name, check_func in self._checks.items():
            try:
                if asyncio.iscoroutinefunction(check_func):
                    result = await check_func()
                else:
                    result = check_func()

                results[name] = result

                if result["status"] != "healthy":
                    overall_status = "degraded"

            except Exception as e:
                results[name] = {"status": "unhealthy", "error": str(e)}
                overall_status = "unhealthy"

        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "checks": results,
        }

    async def check_component(self, name: str) -> Dict[str, Any]:
        """Run specific health check."""
        if name not in self._checks:
            return {"status": "unknown", "error": f"Check '{name}' not found"}

        try:
            check_func = self._checks[name]
            if asyncio.iscoroutinefunction(check_func):
                return await check_func()
            return check_func()
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


class PerformanceProfiler:
    """
    Performance profiling utilities.

    Features:
    - Execution time tracking
    - Memory usage tracking
    - Call count tracking
    - Performance reports
    """

    def __init__(self):
        self._executions: Dict[str, List[float]] = {}
        self._call_counts: Dict[str, int] = {}
        self._memory_samples: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def profile(self, name: str):
        """Decorator to profile a function."""

        def decorator(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start = time.perf_counter()
                try:
                    result = await func(*args, **kwargs)
                    return result
                finally:
                    duration = (time.perf_counter() - start) * 1000
                    self._record_execution(name, duration)

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start = time.perf_counter()
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    duration = (time.perf_counter() - start) * 1000
                    self._record_execution(name, duration)

            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

        return decorator

    def _record_execution(self, name: str, duration_ms: float):
        """Record execution time."""
        with self._lock:
            if name not in self._executions:
                self._executions[name] = []
            self._executions[name].append(duration_ms)

            if name not in self._call_counts:
                self._call_counts[name] = 0
            self._call_counts[name] += 1

    def track_memory(self):
        """Track current memory usage."""
        try:
            import psutil

            process = psutil.Process()
            memory_info = process.memory_info()

            sample = {
                "timestamp": datetime.utcnow().isoformat(),
                "rss_mb": memory_info.rss / (1024 * 1024),
                "vms_mb": memory_info.vms / (1024 * 1024),
                "percent": process.memory_percent(),
            }

            with self._lock:
                self._memory_samples.append(sample)

                # Keep only last 1000 samples
                if len(self._memory_samples) > 1000:
                    self._memory_samples = self._memory_samples[-1000:]

            return sample
        except ImportError:
            return None

    def get_profile_report(self) -> Dict[str, Any]:
        """Generate performance profile report."""
        with self._lock:
            executions = dict(self._executions)
            call_counts = dict(self._call_counts)

        report = {
            "functions": {},
            "total_calls": sum(call_counts.values()),
            "timestamp": datetime.utcnow().isoformat(),
        }

        for name, durations in executions.items():
            sorted_durations = sorted(durations)
            count = len(sorted_durations)

            report["functions"][name] = {
                "call_count": call_counts.get(name, 0),
                "min_ms": sorted_durations[0],
                "max_ms": sorted_durations[-1],
                "avg_ms": sum(sorted_durations) / count,
                "p50_ms": sorted_durations[int(count * 0.50)],
                "p95_ms": sorted_durations[int(count * 0.95)],
                "p99_ms": sorted_durations[int(count * 0.99)],
            }

        # Add memory info
        if self._memory_samples:
            report["memory"] = {
                "current_mb": self._memory_samples[-1]["rss_mb"]
                if self._memory_samples
                else 0,
                "max_mb": max(s["rss_mb"] for s in self._memory_samples)
                if self._memory_samples
                else 0,
                "samples": len(self._memory_samples),
            }

        return report

    def reset(self):
        """Reset all profiling data."""
        with self._lock:
            self._executions.clear()
            self._call_counts.clear()
            self._memory_samples.clear()


# Global instances
cloud_logger = CloudLogger()
metrics = MetricsCollector()
tracer = DistributedTracer()
health_checker = HealthChecker()
profiler = PerformanceProfiler()


# Pre-registered health checks
async def check_database():
    """Check database connectivity."""
    try:
        from app.core.database import get_db

        db = await get_db()
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_redis():
    """Check Redis connectivity."""
    try:
        from app.core.redis_manager import get_redis

        redis = await get_redis()
        if redis.is_connected:
            await redis._client.ping()
            return {"status": "healthy", "redis": "connected"}
        return {"status": "degraded", "redis": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_ai_service():
    """Check AI service (Vertex AI/Gemini) connectivity."""
    try:
        from app.core.vertex import get_vertex_client

        client = get_vertex_client()
        if client.mock_mode:
            return {"status": "degraded", "ai": "mock_mode"}
        return {"status": "healthy", "ai": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


health_checker.register_check("database", check_database)
health_checker.register_check("redis", check_redis)
health_checker.register_check("ai_service", check_ai_service)


# Decorator for traced functions
def traced(
    span_name: Optional[str] = None, attributes: Optional[Dict[str, Any]] = None
):
    """Decorator to trace a function."""

    def decorator(func):
        span = span_name or func.__name__

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            async with tracer.trace(span, attributes):
                return await func(*args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with tracer.trace(span, attributes):
                return func(*args, **kwargs)

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator


# Metrics decorator
def timed(metric_name: str):
    """Decorator to time a function."""

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            with metrics.timer(metric_name):
                return await func(*args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            with metrics.timer(metric_name):
                return func(*args, **kwargs)

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator
