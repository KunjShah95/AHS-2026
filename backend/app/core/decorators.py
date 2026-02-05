import functools
from typing import Callable, TypeVar, Any
from loguru import logger
from datetime import datetime

F = TypeVar("F", bound=Callable[..., Any])


def log_execution(func: F) -> F:
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"Executing {func.__name__} with args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        logger.info(f"{func.__name__} completed successfully")
        return result

    return wrapper


def log_execution_async(func: F) -> F:
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        logger.info(f"Async executing {func.__name__}")
        result = await func(*args, **kwargs)
        logger.info(f"Async {func.__name__} completed successfully")
        return result

    return wrapper


def measure_time(func: F) -> F:
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = datetime.utcnow()
        result = func(*args, **kwargs)
        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(f"{func.__name__} took {elapsed:.2f}ms")
        return result

    return wrapper


def measure_time_async(func: F) -> F:
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = datetime.utcnow()
        result = await func(*args, **kwargs)
        elapsed = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.info(f"Async {func.__name__} took {elapsed:.2f}ms")
        return result

    return wrapper


class Metrics:
    def __init__(self):
        self.counters = {}
        self.timers = {}
        self.gauges = {}

    def counter(self, name: str, value: int = 1):
        if name not in self.counters:
            self.counters[name] = 0
        self.counters[name] += value
        logger.debug(f"Counter {name}: {self.counters[name]}")

    def timer(self, name: str, value: float):
        if name not in self.timers:
            self.timers[name] = []
        self.timers[name].append(value)
        logger.debug(f"Timer {name}: {value}ms")

    def gauge(self, name: str, value: float):
        self.gauges[name] = value
        logger.debug(f"Gauge {name}: {value}")


metrics = Metrics()
