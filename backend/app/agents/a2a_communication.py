"""
CodeFlow - Agent-to-Agent (A2A) Protocol Implementation
======================================================

Implements the Agent-to-Agent protocol for secure communication
between CodeFlow agents.

A2A Protocol Reference:
- https://developers.google.com/agent-to-agent-protocol
- Enables secure task delegation between agents
- Supports context sharing and handoffs

Key Features:
- Message passing between agents
- Task delegation and routing
- Context propagation
- Error handling and retry logic
- Dead letter queue for failed tasks
"""

import os
import asyncio
import json
import logging
import hashlib
import uuid
import time
from typing import TYPE_CHECKING, Dict, Any, Optional, List, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor

if TYPE_CHECKING:
    from app.agents.adk_orchestrator import (
        AgentTask,
        AgentContext,
        AgentResult,
        TaskPriority,
    )

logger = logging.getLogger(__name__)


class AgentCapability(Enum):
    """Enumeration of all agent capabilities in CodeFlow."""

    CODEBASE_ANALYSIS = "codebase_analysis"
    DEPENDENCY_MAPPING = "dependency_mapping"
    ARCHITECTURE_DETECTION = "architecture_detection"
    MODULE_IDENTIFICATION = "module_identification"
    LEARNING_PATH_GENERATION = "learning_path_generation"
    MILESTONE_CREATION = "milestone_creation"
    TIME_ESTIMATION = "time_estimation"
    DIFFICULTY_CALIBRATION = "difficulty_calibration"
    TASK_GENERATION = "task_generation"
    QUICK_WIN_IDENTIFICATION = "quick_win_identification"
    HINT_GENERATION = "hint_generation"
    QUESTION_ANSWERING = "question_answering"
    CODE_EXPLANATION = "code_explanation"
    CONCEPT_CLARIFICATION = "concept_clarification"
    FOLLOW_UP_SUGGESTIONS = "follow_up_suggestions"
    PROGRESS_TRACKING = "progress_tracking"
    ACHIEVEMENT_MANAGEMENT = "achievement_management"
    PERSONALIZED_FEEDBACK = "personalized_feedback"
    GAMIFICATION = "gamification"


class TaskStatus(Enum):
    """Status of a task in the A2A system."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    DELEGATED = "delegated"


class MessageType(Enum):
    """Types of messages in A2A protocol."""

    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    TASK_DELEGATION = "task_delegation"
    CONTEXT_UPDATE = "context_update"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    ACK = "acknowledge"


@dataclass
class A2AMessageHeader:
    """Header for A2A messages."""

    message_id: str
    correlation_id: str
    message_type: MessageType
    sender: str
    receiver: str
    timestamp: float
    version: str = "1.0.0"
    priority: int = 3
    ttl_seconds: int = 300


@dataclass
class A2AMessage:
    """
    A2A Protocol message format.

    Attributes:
        header: Message metadata
        capability: The capability being requested/provided
        task_id: Unique task identifier
        payload: Task-specific data
        context: Shared context between agents
        attachments: Additional data (code snippets, files, etc.)
    """

    header: A2AMessageHeader
    capability: AgentCapability
    task_id: str
    payload: Dict[str, Any]
    context: Dict[str, Any] = field(default_factory=dict)
    attachments: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize message to dictionary."""
        return {
            "header": {
                "message_id": self.header.message_id,
                "correlation_id": self.header.correlation_id,
                "message_type": self.header.message_type.value,
                "sender": self.header.sender,
                "receiver": self.header.receiver,
                "timestamp": self.header.timestamp,
                "version": self.header.version,
                "priority": self.header.priority,
                "ttl_seconds": self.header.ttl_seconds,
            },
            "capability": self.capability.value,
            "task_id": self.task_id,
            "payload": self.payload,
            "context": self.context,
            "attachments": self.attachments,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "A2AMessage":
        """Deserialize message from dictionary."""
        header_data = data["header"]
        return cls(
            header=A2AMessageHeader(
                message_id=header_data["message_id"],
                correlation_id=header_data["correlation_id"],
                message_type=MessageType(header_data["message_type"]),
                sender=header_data["sender"],
                receiver=header_data["receiver"],
                timestamp=header_data["timestamp"],
                version=header_data.get("version", "1.0.0"),
                priority=header_data.get("priority", 3),
                ttl_seconds=header_data.get("ttl_seconds", 300),
            ),
            capability=AgentCapability(data["capability"]),
            task_id=data["task_id"],
            payload=data.get("payload", {}),
            context=data.get("context", {}),
            attachments=data.get("attachments", {}),
            metadata=data.get("metadata", {}),
        )


@dataclass
class TaskResult:
    """Result from processing a task."""

    task_id: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    execution_time_ms: float = 0.0
    artifacts: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    warnings: List[str] = field(default_factory=list)


class A2AChannel:
    """
    Agent-to-Agent communication channel.

    Provides:
    - Message publishing and subscribing
    - Request-response pattern
    - Task delegation
    - Context propagation
    """

    def __init__(
        self, agent_id: str, redis_url: Optional[str] = None, use_redis: bool = False
    ):
        self.agent_id = agent_id
        self.use_redis = use_redis and redis_url is not None
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")

        self._message_queue: asyncio.Queue = asyncio.Queue()
        self._pending_tasks: Dict[str, asyncio.Future] = {}
        self._response_cache: Dict[str, TaskResult] = {}
        self._subscriptions: Dict[str, Callable] = {}

        self._executor = ThreadPoolExecutor(max_workers=10)

        self._running = False

        if self.use_redis:
            self._init_redis()

        logger.info(
            f"A2A Channel initialized for agent '{agent_id}' (Redis: {self.use_redis})"
        )

    def _init_redis(self):
        """Initialize Redis connection for message passing."""
        try:
            import redis.asyncio as redis

            self._redis = redis.from_url(self.redis_url, decode_responses=True)
            self._pubsub = self._redis.pubsub()
        except Exception as e:
            logger.warning(
                f"Failed to initialize Redis, falling back to in-memory: {e}"
            )
            self.use_redis = False

    def _generate_message_id(self) -> str:
        """Generate unique message ID."""
        return f"msg_{uuid.uuid4().hex[:16]}"

    def _generate_task_id(self) -> str:
        """Generate unique task ID."""
        return f"task_{uuid.uuid4().hex[:16]}"

    async def publish_message(self, message: A2AMessage) -> bool:
        """
        Publish a message to the A2A bus.

        For local mode: Adds to in-memory queue
        For Redis mode: Publishes to Redis channel
        """
        message.header.message_id = self._generate_message_id()
        message.header.timestamp = time.time()

        try:
            if self.use_redis:
                channel_name = f"a2a:{message.header.receiver}"
                await self._redis.publish(channel_name, json.dumps(message.to_dict()))
            else:
                await self._message_queue.put(message.to_dict())

            logger.debug(
                f"Message {message.header.message_id} published to {message.header.receiver}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            return False

    async def send_task(
        self,
        target_agent: str,
        capability: AgentCapability,
        payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        priority: int = 3,
        timeout_seconds: int = 300,
    ) -> TaskResult:
        """
        Send a task to another agent and wait for response.

        Implements request-response pattern with timeout.
        """
        task_id = self._generate_task_id()

        message = A2AMessage(
            header=A2AMessageHeader(
                message_id=self._generate_message_id(),
                correlation_id=task_id,
                message_type=MessageType.TASK_REQUEST,
                sender=self.agent_id,
                receiver=target_agent,
                timestamp=time.time(),
                priority=priority,
            ),
            capability=capability,
            task_id=task_id,
            payload=payload,
            context=context or {},
        )

        logger.info(
            f"Sending task {task_id} to {target_agent} for capability {capability.value}"
        )

        await self.publish_message(message)

        loop = asyncio.get_event_loop()
        future = loop.create_future()
        self._pending_tasks[task_id] = future

        try:
            result = await asyncio.wait_for(
                self._wait_for_response(task_id), timeout=timeout_seconds
            )

            return result

        except asyncio.TimeoutError:
            logger.warning(f"Task {task_id} timed out after {timeout_seconds}s")
            return TaskResult(
                task_id=task_id,
                success=False,
                error="Task timed out",
                error_code="TIMEOUT",
            )

        finally:
            self._pending_tasks.pop(task_id, None)

    async def _wait_for_response(self, task_id: str) -> TaskResult:
        """Wait for response to a task."""
        if task_id in self._response_cache:
            return self._response_cache.pop(task_id)

        while True:
            if self.use_redis:
                await self._process_redis_messages()

            if task_id in self._response_cache:
                return self._response_cache.pop(task_id)

            await asyncio.sleep(0.1)

    async def delegate_task(
        self,
        from_capability: AgentCapability,
        to_agent: str,
        to_capability: AgentCapability,
        original_payload: Dict[str, Any],
        context: Dict[str, Any],
    ) -> TaskResult:
        """
        Delegate a task to another agent.

        Used when an agent cannot fulfill a request and delegates
        to a more suitable agent.
        """
        delegation_payload = {
            "delegation": {
                "from_agent": self.agent_id,
                "from_capability": from_capability.value,
                "original_task_id": original_payload.get("task_id"),
                "reason": original_payload.get(
                    "delegation_reason", "Capability not available"
                ),
            },
            **original_payload,
        }

        result = await self.send_task(
            target_agent=to_agent,
            capability=to_capability,
            payload=delegation_payload,
            context=context,
            priority=2,
        )

        return result

    async def broadcast_task(
        self,
        capability: AgentCapability,
        payload: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> List[TaskResult]:
        """
        Broadcast a task to all agents with the given capability.

        Returns list of results from all responding agents.
        """
        agents = get_a2a_agent_registry()._capability_map.get(capability, [])
        results = []

        for agent in agents:
            result = await self.send_task(
                target_agent=agent,
                capability=capability,
                payload=payload,
                context=context,
            )
            results.append(result)

        return results

    async def start_listening(self):
        """Start listening for incoming messages."""
        self._running = True

        if self.use_redis:
            await self._subscribe_to_channel(f"a2a:{self.agent_id}")
            await self._pubsub.run()
        else:
            asyncio.create_task(self._process_local_queue())

    async def stop_listening(self):
        """Stop listening for messages."""
        self._running = False

    async def _process_local_queue(self):
        """Process messages from local queue."""
        while self._running:
            try:
                message_dict = await self._message_queue.get()
                message = A2AMessage.from_dict(message_dict)

                if message.header.receiver == self.agent_id:
                    asyncio.create_task(self._handle_message(message))

            except Exception as e:
                logger.error(f"Error processing local message: {e}")

            await asyncio.sleep(0.1)

    async def _subscribe_to_channel(self, channel_name: str):
        """Subscribe to Redis channel."""
        await self._pubsub.subscribe(channel_name)

        async def reader():
            async for message in self._pubsub.listen():
                if message["type"] == "message":
                    try:
                        message_dict = json.loads(message["data"])
                        message = A2AMessage.from_dict(message_dict)
                        asyncio.create_task(self._handle_message(message))
                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")

        asyncio.create_task(reader())

    async def _process_redis_messages(self):
        """Process any pending Redis messages."""
        pass

    async def _handle_message(self, message: A2AMessage):
        """Handle incoming message (to be implemented by subclass)."""
        logger.debug(
            f"Agent {self.agent_id} received message {message.header.message_id}"
        )

        raise NotImplementedError("Subclasses must implement _handle_message")

    async def acknowledge_message(self, message_id: str, status: str = "received"):
        """Send acknowledgment for received message."""
        ack_message = A2AMessage(
            header=A2AMessageHeader(
                message_id=self._generate_message_id(),
                correlation_id=message_id,
                message_type=MessageType.ACK,
                sender=self.agent_id,
                receiver="system",
                timestamp=time.time(),
            ),
            capability=AgentCapability.CODEBASE_ANALYSIS,
            task_id=message_id,
            payload={"status": status},
        )

        await self.publish_message(ack_message)

    def get_channel_stats(self) -> Dict[str, Any]:
        """Get channel statistics."""
        return {
            "agent_id": self.agent_id,
            "using_redis": self.use_redis,
            "pending_tasks": len(self._pending_tasks),
            "cached_responses": len(self._response_cache),
            "subscriptions": len(self._subscriptions),
        }


class A2AAgentChannel(A2AChannel):
    """
    A2A Channel with agent-specific message handling.

    Integrates with ADKBaseAgent for seamless agent communication.
    """

    def __init__(
        self,
        agent_id: str,
        agent_instance: "ADKBaseAgent",
        redis_url: Optional[str] = None,
        use_redis: bool = False,
    ):
        super().__init__(agent_id, redis_url, use_redis)
        self.agent = agent_instance

    async def _handle_message(self, message: A2AMessage):
        """Handle incoming message using the agent."""
        logger.info(
            f"Agent '{self.agent_id}' processing message {message.header.message_id}"
        )

        await self.acknowledge_message(message.header.message_id, "processing")

        start_time = time.time()

        try:
            from app.agents.adk_orchestrator import (
                AgentTask,
                AgentContext,
                AgentResult,
                TaskPriority,
            )

            task = AgentTask(
                task_id=message.task_id,
                agent_name=self.agent_id,
                capability=message.capability.value,
                payload=message.payload,
                priority=TaskPriority(message.header.priority),
            )

            context_dict = message.context or {}
            context = AgentContext(
                session_id=context_dict.get("session_id", message.task_id),
                user_id=context_dict.get("user_id", "system"),
                repository_url=context_dict.get("repository_url", ""),
                metadata=context_dict.get("metadata", {}),
                artifacts=context_dict.get("artifacts", {}),
            )

            result = await self.agent.execute(task, context)

            execution_time = (time.time() - start_time) * 1000

            task_result = TaskResult(
                task_id=message.task_id,
                success=result.success,
                result=result.result,
                error=result.error,
                execution_time_ms=execution_time,
                artifacts=result.artifacts,
            )

            await self._send_response(message, task_result)

            logger.info(
                f"Agent '{self.agent_id}' completed message {message.header.message_id} in {execution_time:.2f}ms"
            )

        except Exception as e:
            logger.error(f"Agent '{self.agent_id}' error processing message: {e}")

            task_result = TaskResult(
                task_id=message.task_id,
                success=False,
                error=str(e),
                error_code="PROCESSING_ERROR",
                execution_time_ms=(time.time() - start_time) * 1000,
            )

            await self._send_response(message, task_result)

    async def _send_response(self, original_message: A2AMessage, result: TaskResult):
        """Send task result back to sender."""
        response = A2AMessage(
            header=A2AMessageHeader(
                message_id=self._generate_message_id(),
                correlation_id=original_message.header.message_id,
                message_type=MessageType.TASK_RESPONSE,
                sender=self.agent_id,
                receiver=original_message.header.sender,
                timestamp=time.time(),
            ),
            capability=original_message.capability,
            task_id=original_message.task_id,
            payload={
                "success": result.success,
                "result": result.result,
                "error": result.error,
                "execution_time_ms": result.execution_time_ms,
                "artifacts": result.artifacts,
            },
            metadata={"error_code": result.error_code},
        )

        await self.publish_message(response)

        if result.task_id in self._response_cache:
            self._response_cache[result.task_id] = result


class A2AMessageBus:
    """
    Central message bus for A2A communication.

    Provides:
    - Message routing
    - Agent discovery
    - Load balancing
    - Dead letter queue
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._channels: Dict[str, A2AChannel] = {}
        self._dead_letter_queue: List[A2AMessage] = []
        self._message_history: List[Dict[str, Any]] = []
        self._max_history_size = 10000

        self._agent_registry = A2AAgentRegistry()

        logger.info("A2A Message Bus initialized")

    def register_channel(self, channel: A2AChannel) -> None:
        """Register an agent channel with the bus."""
        self._channels[channel.agent_id] = channel
        self._agent_registry.register_agent(
            agent_id=channel.agent_id,
            capabilities=[],
            endpoint=f"local:{channel.agent_id}",
        )
        logger.info(f"Channel '{channel.agent_id}' registered with message bus")

    def unregister_channel(self, agent_id: str) -> None:
        """Unregister an agent channel."""
        self._channels.pop(agent_id, None)
        self._agent_registry.unregister_agent(agent_id)
        logger.info(f"Channel '{agent_id}' unregistered from message bus")

    def route_message(self, message: A2AMessage) -> bool:
        """
        Route message to appropriate channel.

        Returns True if routed successfully.
        """
        if message.header.receiver in self._channels:
            asyncio.create_task(
                self._channels[message.header.receiver]._handle_message(message)
            )
            return True

        logger.warning(f"No channel found for receiver '{message.header.receiver}'")
        return False

    def add_to_dead_letter_queue(self, message: A2AMessage, reason: str) -> None:
        """Add failed message to dead letter queue."""
        self._dead_letter_queue.append(message)
        logger.warning(f"Message {message.header.message_id} added to DLQ: {reason}")

        while len(self._dead_letter_queue) > 1000:
            self._dead_letter_queue.pop(0)

    def get_message_bus_stats(self) -> Dict[str, Any]:
        """Get message bus statistics."""
        return {
            "registered_channels": len(self._channels),
            "dead_letter_queue_size": len(self._dead_letter_queue),
            "message_history_size": len(self._message_history),
            "agents": self._agent_registry.get_all_agents(),
        }


class A2AAgentRegistry:
    """
    Central registry of all agents and their capabilities.

    Enables:
    - Dynamic agent discovery
    - Capability-based routing
    - Load balancing
    - Health monitoring
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._agents = {}
            cls._instance._capability_map = {}
        return cls._instance

    def register_agent(
        self,
        agent_id: str,
        capabilities: List[AgentCapability],
        endpoint: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Register an agent and its capabilities."""
        self._agents[agent_id] = {
            "id": agent_id,
            "capabilities": [c.value for c in capabilities],
            "capability_objects": capabilities,
            "endpoint": endpoint,
            "status": "active",
            "load": 0,
            "metadata": metadata or {},
            "last_heartbeat": None,
            "registered_at": time.time(),
        }

        for capability in capabilities:
            if capability not in self._capability_map:
                self._capability_map[capability] = []
            if agent_id not in self._capability_map[capability]:
                self._capability_map[capability].append(agent_id)

        logger.info(
            f"Agent '{agent_id}' registered with capabilities: {[c.value for c in capabilities]}"
        )

    def unregister_agent(self, agent_id: str) -> None:
        """Unregister an agent."""
        self._agents.pop(agent_id, None)

        for capability_list in self._capability_map.values():
            if agent_id in capability_list:
                capability_list.remove(agent_id)

        logger.info(f"Agent '{agent_id}' unregistered")

    def get_agent_for_capability(
        self, capability: AgentCapability, strategy: str = "least_load"
    ) -> Optional[str]:
        """Find agent with specific capability."""
        suitable = self._capability_map.get(capability, [])

        if not suitable:
            return None

        if strategy == "least_load":
            return min(suitable, key=lambda x: self._agents.get(x, {}).get("load", 0))
        elif strategy == "round_robin":
            return suitable[0]
        else:
            return suitable[0]

    def update_agent_load(self, agent_id: str, load_delta: int) -> None:
        """Update agent load (for load balancing)."""
        if agent_id in self._agents:
            self._agents[agent_id]["load"] = max(
                0, self._agents[agent_id]["load"] + load_delta
            )

    def heartbeat(self, agent_id: str) -> None:
        """Update agent heartbeat timestamp."""
        if agent_id in self._agents:
            self._agents[agent_id]["last_heartbeat"] = time.time()

    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all registered agents."""
        return list(self._agents.values())

    def get_healthy_agents(self, max_age_seconds: int = 60) -> List[str]:
        """Get agents with recent heartbeats."""
        now = time.time()
        return [
            agent_id
            for agent_id, info in self._agents.items()
            if info.get("last_heartbeat", 0) > now - max_age_seconds
        ]


def get_a2a_message_bus() -> A2AMessageBus:
    """Get the global A2A message bus instance."""
    return A2AMessageBus()


def get_a2a_agent_registry() -> A2AAgentRegistry:
    """Get the global A2A agent registry instance."""
    return A2AAgentRegistry()
