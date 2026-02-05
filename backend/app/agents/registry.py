"""
CodeFlow - Agent Capability Registry
======================================

Central registry for all CodeFlow agents and their capabilities.
Provides:
- Agent discovery
- Capability mapping
- Load balancing
- Health monitoring
- Version management

This registry is used by:
- A2A Protocol for task routing
- Load balancer for agent selection
- Admin dashboard for monitoring
- Dynamic agent scaling
"""

import os
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from threading import Lock
import json

logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    """Agent lifecycle status."""

    STARTING = "starting"
    READY = "ready"
    BUSY = "busy"
    UNHEALTHY = "unhealthy"
    STOPPING = "stopping"
    STOPPED = "stopped"


class AgentVersion(Enum):
    """Agent version info."""

    V1_0 = "1.0.0"
    V2_0 = "2.0.0"


@dataclass
class AgentInfo:
    """Information about a registered agent."""

    agent_id: str
    name: str
    description: str
    capabilities: List[str]
    version: str
    status: AgentStatus
    endpoint: str

    load: int = 0
    max_concurrent_tasks: int = 10

    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0

    last_heartbeat: Optional[float] = None
    last_task_time: Optional[float] = None
    total_tasks_completed: int = 0
    total_tasks_failed: int = 0
    average_response_time_ms: float = 0.0

    registered_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None

    metadata: Dict[str, Any] = field(default_factory=dict)
    health_check_url: Optional[str] = None

    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "version": self.version,
            "status": self.status.value,
            "endpoint": self.endpoint,
            "load": self.load,
            "max_concurrent_tasks": self.max_concurrent_tasks,
            "memory_usage_mb": self.memory_usage_mb,
            "cpu_usage_percent": self.cpu_usage_percent,
            "last_heartbeat": self.last_heartbeat,
            "last_task_time": self.last_task_time,
            "total_tasks_completed": self.total_tasks_completed,
            "total_tasks_failed": self.total_tasks_failed,
            "average_response_time_ms": self.average_response_time_ms,
            "registered_at": self.registered_at,
            "started_at": self.started_at,
            "metadata": self.metadata,
            "health_check_url": self.health_check_url,
            "tags": self.tags,
            "health_score": self.get_health_score(),
        }

    def get_health_score(self) -> float:
        """Calculate health score (0-100) based on metrics."""
        score = 100.0

        if self.status == AgentStatus.UNHEALTHY:
            score -= 50
        elif self.status in [AgentStatus.STOPPED, AgentStatus.STOPPING]:
            score -= 100

        score -= (
            min(30, self.load / self.max_concurrent_tasks * 30)
            if self.max_concurrent_tasks > 0
            else 0
        )

        if self.average_response_time_ms > 10000:
            score -= 20
        elif self.average_response_time_ms > 5000:
            score -= 10

        if self.total_tasks_failed > 0:
            failure_rate = self.total_tasks_failed / (
                self.total_tasks_completed + self.total_tasks_failed
            )
            score -= failure_rate * 30

        return max(0, min(100, score))

    def is_healthy(self, max_heartbeat_age: int = 60) -> bool:
        """Check if agent is healthy based on heartbeat."""
        if self.status in [AgentStatus.STOPPED, AgentStatus.STOPPING]:
            return False

        if self.last_heartbeat is None:
            return self.status == AgentStatus.STARTING

        return (time.time() - self.last_heartbeat) < max_heartbeat_age


@dataclass
class CapabilityInfo:
    """Information about an agent capability."""

    name: str
    description: str
    version: str
    agents: List[str]
    average_latency_ms: float
    success_rate: float
    usage_count: int
    last_used: Optional[float] = None


class AgentRegistry:
    """
    Central registry for all CodeFlow agents.

    Provides thread-safe registration, discovery, and health monitoring.

    Features:
    - Atomic registration/unregistration
    - Capability-based lookup
    - Load balancing support
    - Health checks
    - Metrics collection
    """

    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._agents: Dict[str, AgentInfo] = {}
        self._capability_map: Dict[str, List[str]] = {}
        self._lock = Lock()

        self._metrics_history: List[Dict[str, Any]] = []
        self._max_history_size = 10000

        self._health_check_interval = 30
        self._max_heartbeat_age = 60

        self._callbacks: Dict[str, List[Callable]] = {
            "register": [],
            "unregister": [],
            "status_change": [],
            "heartbeat": [],
        }

        logger.info("Agent Registry initialized")

    def register_agent(
        self,
        agent_id: str,
        name: str,
        description: str,
        capabilities: List[str],
        endpoint: str,
        version: str = "1.0.0",
        max_concurrent_tasks: int = 10,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        health_check_url: Optional[str] = None,
    ) -> AgentInfo:
        """Register a new agent."""
        with self._lock:
            agent_info = AgentInfo(
                agent_id=agent_id,
                name=name,
                description=description,
                capabilities=capabilities,
                version=version,
                status=AgentStatus.READY,
                endpoint=endpoint,
                max_concurrent_tasks=max_concurrent_tasks,
                metadata=metadata or {},
                tags=tags or [],
                health_check_url=health_check_url,
                started_at=time.time(),
            )

            self._agents[agent_id] = agent_info

            for capability in capabilities:
                if capability not in self._capability_map:
                    self._capability_map[capability] = []
                if agent_id not in self._capability_map[capability]:
                    self._capability_map[capability].append(agent_id)

            self._trigger_callbacks("register", agent_info)

            logger.info(
                f"Agent '{name}' ({agent_id}) registered with capabilities: {capabilities}"
            )

            return agent_info

    def unregister_agent(self, agent_id: str) -> bool:
        """Unregister an agent."""
        with self._lock:
            if agent_id not in self._agents:
                return False

            agent = self._agents.pop(agent_id)

            for capability in agent.capabilities:
                if (
                    capability in self._capability_map
                    and agent_id in self._capability_map[capability]
                ):
                    self._capability_map[capability].remove(agent_id)

            self._trigger_callbacks("unregister", agent)

            logger.info(f"Agent '{agent.name}' ({agent_id}) unregistered")
            return True

    def get_agent(self, agent_id: str) -> Optional[AgentInfo]:
        """Get agent information by ID."""
        return self._agents.get(agent_id)

    def get_agents_by_capability(
        self, capability: str, healthy_only: bool = True, strategy: str = "least_load"
    ) -> List[AgentInfo]:
        """
        Get agents that provide a specific capability.

        Args:
            capability: The capability to search for
            healthy_only: Only return healthy agents
            strategy: Selection strategy (least_load, random, round_robin)
        """
        agent_ids = self._capability_map.get(capability, [])

        if healthy_only:
            agent_ids = [
                aid
                for aid in agent_ids
                if self._agents[aid].is_healthy(self._max_heartbeat_age)
            ]

        agents = [self._agents[aid] for aid in agent_ids if aid in self._agents]

        if strategy == "least_load":
            agents.sort(key=lambda a: a.load)
        elif strategy == "random":
            import random

            random.shuffle(agents)
        elif strategy == "round_robin":
            agents.sort(key=lambda a: a.last_task_time or 0)

        return agents

    def get_best_agent_for_capability(
        self, capability: str, healthy_only: bool = True
    ) -> Optional[AgentInfo]:
        """
        Get the best agent for a specific capability.

        Uses load, health score, and response time for selection.
        """
        agents = self.get_agents_by_capability(
            capability, healthy_only=healthy_only, strategy="least_load"
        )

        if not agents:
            return None

        if len(agents) == 1:
            return agents[0]

        best_agent = agents[0]
        best_score = self._calculate_agent_score(best_agent)

        for agent in agents[1:]:
            score = self._calculate_agent_score(agent)
            if score > best_score:
                best_agent = agent
                best_score = score

        return best_agent

    def _calculate_agent_score(self, agent: AgentInfo) -> float:
        """Calculate agent score for selection (higher is better)."""
        score = 100.0

        score -= (
            (agent.load / agent.max_concurrent_tasks * 40)
            if agent.max_concurrent_tasks > 0
            else 0
        )

        score += (
            (100 - agent.average_response_time_ms / 100)
            if agent.average_response_time_ms < 10000
            else 0
        )

        success_rate = (
            agent.total_tasks_completed
            / (agent.total_tasks_completed + agent.total_tasks_failed)
            if (agent.total_tasks_completed + agent.total_tasks_failed) > 0
            else 1.0
        )
        score += success_rate * 30

        score += agent.get_health_score() / 10

        return score

    def heartbeat(
        self, agent_id: str, metrics: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update agent heartbeat and metrics."""
        with self._lock:
            if agent_id not in self._agents:
                return False

            agent = self._agents[agent_id]
            agent.last_heartbeat = time.time()

            if metrics:
                if "load" in metrics:
                    agent.load = min(metrics["load"], agent.max_concurrent_tasks)
                if "memory_usage_mb" in metrics:
                    agent.memory_usage_mb = metrics["memory_usage_mb"]
                if "cpu_usage_percent" in metrics:
                    agent.cpu_usage_percent = metrics["cpu_usage_percent"]
                if "response_time_ms" in metrics:
                    response_time = metrics["response_time_ms"]
                    agent.average_response_time_ms = (
                        agent.average_response_time_ms * 0.7 + response_time * 0.3
                    )

            self._trigger_callbacks("heartbeat", agent)

            return True

    def record_task_completion(
        self, agent_id: str, success: bool, response_time_ms: float
    ) -> bool:
        """Record task completion for metrics."""
        with self._lock:
            if agent_id not in self._agents:
                return False

            agent = self._agents[agent_id]
            agent.last_task_time = time.time()
            agent.total_tasks_completed += 1

            if not success:
                agent.total_tasks_failed += 1

            agent.average_response_time_ms = (
                agent.average_response_time_ms * 0.9 + response_time_ms * 0.1
            )

            agent.load = max(0, agent.load - 1)

            self._collect_metrics(agent)

            return True

    def record_task_start(self, agent_id: str) -> bool:
        """Record task start to increment load."""
        with self._lock:
            if agent_id not in self._agents:
                return False

            agent = self._agents[agent_id]
            agent.load = min(agent.load + 1, agent.max_concurrent_tasks)

            return True

    def update_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update agent status."""
        with self._lock:
            if agent_id not in self._agents:
                return False

            old_status = self._agents[agent_id].status
            self._agents[agent_id].status = status

            self._trigger_callbacks("status_change", self._agents[agent_id], old_status)

            return True

    def get_all_agents(self) -> List[AgentInfo]:
        """Get all registered agents."""
        with self._lock:
            return list(self._agents.values())

    def get_healthy_agents(self) -> List[AgentInfo]:
        """Get all healthy agents."""
        with self._lock:
            return [
                agent
                for agent in self._agents.values()
                if agent.is_healthy(self._max_heartbeat_age)
            ]

    def get_unhealthy_agents(self) -> List[AgentInfo]:
        """Get all unhealthy agents."""
        with self._lock:
            return [
                agent
                for agent in self._agents.values()
                if not agent.is_healthy(self._max_heartbeat_age)
            ]

    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        with self._lock:
            agents = list(self._agents.values())

            total_tasks = sum(
                a.total_tasks_completed + a.total_tasks_failed for a in agents
            )
            total_completed = sum(a.total_tasks_completed for a in agents)
            total_failed = sum(a.total_tasks_failed for a in agents)

            return {
                "total_agents": len(agents),
                "healthy_agents": len(self.get_healthy_agents()),
                "unhealthy_agents": len(self.get_unhealthy_agents()),
                "total_capabilities": len(self._capability_map),
                "total_tasks_processed": total_tasks,
                "success_rate": (
                    total_completed / total_tasks if total_tasks > 0 else 0
                ),
                "average_response_time_ms": (
                    sum(a.average_response_time_ms for a in agents) / len(agents)
                    if agents
                    else 0
                ),
                "capabilities": {
                    cap: len(agents) for cap, agents in self._capability_map.items()
                },
            }

    def _collect_metrics(self, agent: AgentInfo):
        """Collect metrics for history."""
        self._metrics_history.append(
            {
                "timestamp": time.time(),
                "agent_id": agent.agent_id,
                "load": agent.load,
                "memory_usage_mb": agent.memory_usage_mb,
                "cpu_usage_percent": agent.cpu_usage_percent,
                "response_time_ms": agent.average_response_time_ms,
                "health_score": agent.get_health_score(),
            }
        )

        while len(self._metrics_history) > self._max_history_size:
            self._metrics_history.pop(0)

    def _trigger_callbacks(self, event: str, *args):
        """Trigger registered callbacks for an event."""
        for callback in self._callbacks.get(event, []):
            try:
                callback(*args)
            except Exception as e:
                logger.error(f"Error in {event} callback: {e}")

    def register_callback(self, event: str, callback: Callable) -> None:
        """Register a callback for an event."""
        if event in self._callbacks:
            self._callbacks[event].append(callback)

    def export_registry(self) -> Dict[str, Any]:
        """Export registry state for backup/replication."""
        return {
            "agents": [agent.to_dict() for agent in self.get_all_agents()],
            "capability_map": self._capability_map,
            "exported_at": time.time(),
        }

    def import_registry(self, state: Dict[str, Any]) -> int:
        """Import registry state from backup."""
        imported = 0

        for agent_data in state.get("agents", []):
            try:
                self.register_agent(
                    agent_id=agent_data["agent_id"],
                    name=agent_data["name"],
                    description=agent_data["description"],
                    capabilities=agent_data["capabilities"],
                    endpoint=agent_data["endpoint"],
                    version=agent_data.get("version", "1.0.0"),
                    max_concurrent_tasks=agent_data.get("max_concurrent_tasks", 10),
                    metadata=agent_data.get("metadata", {}),
                    tags=agent_data.get("tags", []),
                )
                imported += 1
            except Exception as e:
                logger.error(
                    f"Failed to import agent {agent_data.get('agent_id')}: {e}"
                )

        return imported


def get_agent_registry() -> AgentRegistry:
    """Get the global agent registry instance."""
    return AgentRegistry()


def register_codeflow_agents():
    """Register all CodeFlow agents with the registry."""
    registry = get_agent_registry()

    registry.register_agent(
        agent_id="codebase_architect",
        name="Codebase Architect",
        description="Analyzes repository structure and identifies architecture patterns",
        capabilities=[
            "codebase_analysis",
            "dependency_mapping",
            "architecture_detection",
            "module_identification",
        ],
        endpoint="local:codebase_architect",
        version="2.0.0",
        max_concurrent_tasks=20,
        tags=["analysis", "architecture", "codebase"],
    )

    registry.register_agent(
        agent_id="learning_path_architect",
        name="Learning Path Architect",
        description="Generates personalized learning paths based on architecture analysis",
        capabilities=[
            "learning_path_generation",
            "milestone_creation",
            "time_estimation",
            "difficulty_calibration",
        ],
        endpoint="local:learning_path_architect",
        version="2.0.0",
        max_concurrent_tasks=15,
        tags=["learning", "path", "education"],
    )

    registry.register_agent(
        agent_id="task_generator",
        name="Task Generator",
        description="Generates learning tasks based on module analysis",
        capabilities=[
            "task_generation",
            "quick_win_identification",
            "difficulty_assessment",
            "hint_generation",
        ],
        endpoint="local:task_generator",
        version="2.0.0",
        max_concurrent_tasks=25,
        tags=["tasks", "generation", "learning"],
    )

    registry.register_agent(
        agent_id="interactive_tutor",
        name="Interactive Tutor",
        description="Provides interactive tutoring and code explanations",
        capabilities=[
            "question_answering",
            "code_explanation",
            "concept_clarification",
            "follow_up_suggestions",
        ],
        endpoint="local:interactive_tutor",
        version="2.0.0",
        max_concurrent_tasks=30,
        tags=["tutoring", "education", "qa"],
    )

    registry.register_agent(
        agent_id="progress_coach",
        name="Progress Coach",
        description="Tracks progress and provides personalized coaching",
        capabilities=[
            "progress_tracking",
            "achievement_management",
            "personalized_feedback",
            "gamification",
        ],
        endpoint="local:progress_coach",
        version="2.0.0",
        max_concurrent_tasks=50,
        tags=["progress", "coaching", "gamification"],
    )

    logger.info("All CodeFlow agents registered with the registry")
