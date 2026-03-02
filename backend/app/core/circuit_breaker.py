"""
CodeFlow - Circuit Breaker Module
==================================

Resilience pattern for external service calls.
Prevents cascade failures when external APIs are unavailable.
"""

import asyncio
import logging
import time
from typing import Callable, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing - reject all requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitConfig:
    """Circuit breaker configuration."""

    failure_threshold: int = 5
    success_threshold: int = 2
    timeout_seconds: float = 30.0
    expected_exception: type = Exception


@dataclass
class CircuitStats:
    """Circuit breaker statistics."""

    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    total_calls: int = 0
    rejected_calls: int = 0

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        self.total_calls += 1

    def record_success(self):
        self.success_count += 1
        self.last_success_time = time.time()
        self.total_calls += 1

    def record_rejected(self):
        self.rejected_calls += 1
        self.total_calls += 1


class CircuitBreaker:
    """
    Circuit breaker implementation for external service calls.

    States:
    - CLOSED: Normal operation, calls pass through
    - OPEN: Service failing, calls rejected immediately
    - HALF_OPEN: Testing recovery, limited calls allowed
    """

    def __init__(self, name: str, config: CircuitConfig = None):
        self.name = name
        self.config = config or CircuitConfig()
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._lock = asyncio.Lock()
        self._half_open_successes = 0

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        if self._state == CircuitState.OPEN:
            if (
                time.time() - (self._stats.last_failure_time or 0)
                >= self.config.timeout_seconds
            ):
                return CircuitState.HALF_OPEN
        return self._state

    @property
    def stats(self) -> CircuitStats:
        """Get circuit statistics."""
        return self._stats

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Async function to execute
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit is open
            Original exception: If function fails
        """
        async with self._lock:
            current_state = self.state

            if current_state == CircuitState.OPEN:
                self._stats.record_rejected()
                raise CircuitBreakerOpen(
                    f"Circuit {self.name} is OPEN. Service unavailable."
                )

            if current_state == CircuitState.HALF_OPEN:
                self._half_open_successes = 0

        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except self.config.expected_exception as e:
            await self._on_failure()
            raise

    async def _on_success(self):
        """Handle successful call."""
        async with self._lock:
            self._stats.record_success()

            if self._state == CircuitState.HALF_OPEN:
                self._half_open_successes += 1
                if self._half_open_successes >= self.config.success_threshold:
                    self._state = CircuitState.CLOSED
                    self._stats.state = CircuitState.CLOSED
                    logger.info(f"Circuit {self.name}: CLOSED (recovered)")

    async def _on_failure(self):
        """Handle failed call."""
        async with self._lock:
            self._stats.record_failure()

            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.OPEN
                self._stats.state = CircuitState.OPEN
                logger.warning(f"Circuit {self.name}: OPEN (failure in half-open)")
            elif self._stats.failure_count >= self.config.failure_threshold:
                self._state = CircuitState.OPEN
                self._stats.state = CircuitState.OPEN
                logger.warning(f"Circuit {self.name}: OPEN (threshold reached)")

    def reset(self):
        """Reset circuit to closed state."""
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._half_open_successes = 0
        logger.info(f"Circuit {self.name}: RESET")


class CircuitBreakerError(Exception):
    """Base exception for circuit breaker errors."""

    pass


class CircuitBreakerOpen(CircuitBreakerError):
    """Raised when circuit is open."""

    pass


class CircuitRegistry:
    """
    Registry of circuit breakers for different services.
    """

    def __init__(self):
        self._circuits: dict[str, CircuitBreaker] = {}

    def get(self, name: str, config: CircuitConfig = None) -> CircuitBreaker:
        """Get or create circuit breaker."""
        if name not in self._circuits:
            self._circuits[name] = CircuitBreaker(name, config)
        return self._circuits[name]

    def all(self) -> dict[str, CircuitBreaker]:
        """Get all circuit breakers."""
        return self._circuits

    def stats(self) -> dict[str, dict]:
        """Get stats for all circuits."""
        return {
            name: {
                "state": circuit.state.value,
                "failure_count": circuit.stats.failure_count,
                "success_count": circuit.stats.success_count,
                "rejected_calls": circuit.stats.rejected_calls,
                "total_calls": circuit.stats.total_calls,
            }
            for name, circuit in self._circuits.items()
        }

    def reset_all(self):
        """Reset all circuits."""
        for circuit in self._circuits.values():
            circuit.reset()


def circuit_breaker(
    name: str, failure_threshold: int = 5, timeout_seconds: float = 30.0
):
    """
    Decorator to add circuit breaker to async functions.

    Args:
        name: Circuit breaker name (usually service name)
        failure_threshold: Failures before opening circuit
        timeout_seconds: Seconds before trying again

    Usage:
        @circuit_breaker("gemini_api", failure_threshold=3, timeout_seconds=60)
        async def call_gemini_api(prompt: str) -> str:
            ...
    """
    config = CircuitConfig(
        failure_threshold=failure_threshold, timeout_seconds=timeout_seconds
    )
    registry = CircuitRegistry()
    breaker = registry.get(name, config)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            return await breaker.call(func, *args, **kwargs)

        return wrapper

    return decorator


# Pre-configured circuit breakers for common services
gemini_circuit = CircuitBreaker(
    "gemini_api",
    CircuitConfig(failure_threshold=5, success_threshold=3, timeout_seconds=60.0),
)

firebase_circuit = CircuitBreaker(
    "firebase_auth",
    CircuitConfig(failure_threshold=3, success_threshold=2, timeout_seconds=30.0),
)

redis_circuit = CircuitBreaker(
    "redis_cache",
    CircuitConfig(failure_threshold=3, success_threshold=2, timeout_seconds=10.0),
)

registry = CircuitRegistry()
