"""
CodeFlow - Unit Tests for ADK Components
=========================================

Tests for:
- ADK Orchestrator
- A2A Protocol
- Agent Registry

Run with: pytest tests/test_adk_components.py -v
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import time

from app.agents.adk_orchestrator import (
    ADKBaseAgent,
    ADKOrchestrator,
    CodebaseArchitectAgent,
    LearningPathArchitectAgent,
    TaskGeneratorAgent,
    InteractiveTutorAgent,
    ProgressCoachAgent,
    AgentContext,
    AgentTask,
    AgentResult,
    AgentState,
    TaskPriority,
    get_adk_orchestrator,
)

from app.agents.registry import (
    AgentRegistry,
    AgentInfo,
    AgentStatus,
    get_agent_registry,
)

from app.agents.a2a_communication import (
    A2AMessage,
    A2AMessageHeader,
    TaskResult,
    AgentCapability,
    TaskStatus,
    MessageType,
    A2AAgentRegistry,
)


class TestAgentContext:
    """Tests for AgentContext dataclass."""

    def test_context_creation(self):
        """Test creating an AgentContext."""
        context = AgentContext(
            session_id="session_123",
            user_id="user_456",
            repository_url="https://github.com/example/repo",
        )

        assert context.session_id == "session_123"
        assert context.user_id == "user_456"
        assert context.repository_url == "https://github.com/example/repo"
        assert isinstance(context.created_at, datetime)
        assert context.metadata == {}
        assert context.artifacts == {}

    def test_context_with_metadata(self):
        """Test creating context with metadata."""
        context = AgentContext(
            session_id="session_123",
            user_id="user_456",
            repository_url="https://github.com/example/repo",
            metadata={"key": "value"},
            artifacts={"analysis": "data"},
        )

        assert context.metadata == {"key": "value"}
        assert context.artifacts == {"analysis": "data"}


class TestAgentTask:
    """Tests for AgentTask dataclass."""

    def test_task_creation(self):
        """Test creating an AgentTask."""
        task = AgentTask(
            task_id="task_001",
            agent_name="codebase_architect",
            capability="codebase_analysis",
            payload={"action": "analyze"},
        )

        assert task.task_id == "task_001"
        assert task.agent_name == "codebase_architect"
        assert task.capability == "codebase_analysis"
        assert task.priority == TaskPriority.MEDIUM
        assert task.retry_count == 0
        assert task.max_retries == 3

    def test_task_with_priority(self):
        """Test creating a high-priority task."""
        task = AgentTask(
            task_id="task_002",
            agent_name="interactive_tutor",
            capability="question_answering",
            payload={"question": "What is this?"},
            priority=TaskPriority.HIGH,
        )

        assert task.priority == TaskPriority.HIGH


class TestAgentResult:
    """Tests for AgentResult dataclass."""

    def test_successful_result(self):
        """Test creating a successful result."""
        result = AgentResult(
            task_id="task_001",
            agent_name="codebase_architect",
            success=True,
            result={"analysis": "complete"},
            execution_time_ms=150.5,
        )

        assert result.success is True
        assert result.result == {"analysis": "complete"}
        assert result.error is None
        assert result.execution_time_ms == 150.5

    def test_failed_result(self):
        """Test creating a failed result."""
        result = AgentResult(
            task_id="task_002",
            agent_name="interactive_tutor",
            success=False,
            error="Timeout exceeded",
            error_code="TIMEOUT",
        )

        assert result.success is False
        assert result.error == "Timeout exceeded"
        assert result.error_code == "TIMEOUT"


class TestCodebaseArchitectAgent:
    """Tests for CodebaseArchitectAgent."""

    @pytest.fixture
    def mock_vertex_client(self):
        """Create a mock vertex client."""
        client = MagicMock()
        client.generate_text = AsyncMock(
            return_value='{"architecture_type": "FastAPI", "modules": [], "confidence": 0.9}'
        )
        return client

    @pytest.fixture
    def agent(self, mock_vertex_client):
        """Create agent with mock client."""
        return CodebaseArchitectAgent(vertex_client=mock_vertex_client)

    def test_agent_initialization(self, agent):
        """Test agent is properly initialized."""
        assert agent.name == "codebase_architect"
        assert agent.state == AgentState.IDLE
        assert len(agent._tools) >= 0

    def test_get_capabilities(self, agent):
        """Test agent capabilities."""
        capabilities = agent.get_capabilities()

        assert "codebase_analysis" in capabilities
        assert "architecture_detection" in capabilities

    @pytest.mark.asyncio
    async def test_analyze_repository(self, agent):
        """Test repository analysis."""
        context = AgentContext(
            session_id="session_123",
            user_id="user_456",
            repository_url="https://github.com/example/repo",
        )

        task = AgentTask(
            task_id="task_001",
            agent_name="codebase_architect",
            capability="codebase_analysis",
            payload={"action": "analyze", "repository_path": "/tmp/repo"},
        )

        result = await agent.execute(task, context)

        assert result.success is True
        assert result.result["architecture_type"] == "FastAPI"
        assert result.execution_time_ms >= 0


class TestLearningPathArchitectAgent:
    """Tests for LearningPathArchitectAgent."""

    @pytest.fixture
    def mock_vertex_client(self):
        """Create a mock vertex client."""
        client = MagicMock()
        client.generate_text = AsyncMock(
            return_value='{"total_phases": 5, "estimated_total_hours": 20, "milestones": [], "quick_wins": []}'
        )
        return client

    @pytest.fixture
    def agent(self, mock_vertex_client):
        """Create agent with mock client."""
        return LearningPathArchitectAgent(vertex_client=mock_vertex_client)

    def test_agent_initialization(self, agent):
        """Test agent is properly initialized."""
        assert agent.name == "learning_path_architect"
        assert agent.state == AgentState.IDLE

    def test_get_capabilities(self, agent):
        """Test agent capabilities."""
        capabilities = agent.get_capabilities()

        assert "learning_path_generation" in capabilities
        assert "time_estimation" in capabilities


class TestADKOrchestrator:
    """Tests for ADK Orchestrator."""

    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator with mocked agents."""
        with (
            patch("app.agents.adk_orchestrator.CodebaseArchitectAgent") as mock_arch,
            patch(
                "app.agents.adk_orchestrator.LearningPathArchitectAgent"
            ) as mock_learn,
            patch("app.agents.adk_orchestrator.TaskGeneratorAgent") as mock_task,
            patch("app.agents.adk_orchestrator.InteractiveTutorAgent") as mock_tutor,
            patch("app.agents.adk_orchestrator.ProgressCoachAgent") as mock_coach,
        ):
            mock_arch_instance = MagicMock()
            mock_arch_instance.get_capabilities.return_value = ["codebase_analysis"]
            mock_arch.return_value = mock_arch_instance

            mock_learn_instance = MagicMock()
            mock_learn_instance.get_capabilities.return_value = [
                "learning_path_generation"
            ]
            mock_learn.return_value = mock_learn_instance

            mock_task_instance = MagicMock()
            mock_task_instance.get_capabilities.return_value = ["task_generation"]
            mock_task.return_value = mock_task_instance

            mock_tutor_instance = MagicMock()
            mock_tutor_instance.get_capabilities.return_value = ["question_answering"]
            mock_tutor.return_value = mock_tutor_instance

            mock_coach_instance = MagicMock()
            mock_coach_instance.get_capabilities.return_value = ["progress_tracking"]
            mock_coach.return_value = mock_coach_instance

            orchestrator = ADKOrchestrator()
            orchestrator._agents = {
                "codebase_architect": mock_arch_instance,
                "learning_path_architect": mock_learn_instance,
                "task_generator": mock_task_instance,
                "interactive_tutor": mock_tutor_instance,
                "progress_coach": mock_coach_instance,
            }
            yield orchestrator

    def test_get_agent(self, orchestrator):
        """Test getting an agent by name."""
        agent = orchestrator.get_agent("codebase_architect")
        assert agent is not None

        nonexistent = orchestrator.get_agent("nonexistent")
        assert nonexistent is None

    def test_get_all_agents(self, orchestrator):
        """Test getting all agents."""
        agents = orchestrator.get_all_agents()

        assert len(agents) == 5
        assert "codebase_architect" in agents
        assert "interactive_tutor" in agents

    @pytest.mark.asyncio
    async def test_execute_task_success(self, orchestrator):
        """Test successful task execution."""
        mock_agent = MagicMock()
        mock_result = AgentResult(
            task_id="task_001",
            agent_name="codebase_architect",
            success=True,
            result={"analysis": "complete"},
        )
        mock_agent.execute = AsyncMock(return_value=mock_result)

        context = AgentContext(
            session_id="session_123",
            user_id="user_456",
            repository_url="https://github.com/example/repo",
        )

        task = AgentTask(
            task_id="task_001",
            agent_name="codebase_architect",
            capability="codebase_analysis",
            payload={"action": "analyze"},
        )

        result = await orchestrator.execute_task("codebase_architect", task, context)

        assert result.success is True
        assert result.result == {"analysis": "complete"}

    @pytest.mark.asyncio
    async def test_execute_task_agent_not_found(self, orchestrator):
        """Test task execution with non-existent agent."""
        context = AgentContext(
            session_id="session_123",
            user_id="user_456",
            repository_url="https://github.com/example/repo",
        )

        task = AgentTask(
            task_id="task_001",
            agent_name="nonexistent",
            capability="unknown",
            payload={},
        )

        result = await orchestrator.execute_task("nonexistent", task, context)

        assert result.success is False
        assert "not found" in result.error.lower()


class TestAgentRegistry:
    """Tests for Agent Registry."""

    @pytest.fixture
    def registry(self):
        """Create a fresh registry."""
        AgentRegistry._instance = None
        return get_agent_registry()

    def test_register_agent(self, registry):
        """Test registering an agent."""
        agent = registry.register_agent(
            agent_id="test_agent",
            name="Test Agent",
            description="A test agent",
            capabilities=["test_capability"],
            endpoint="local:test_agent",
        )

        assert agent.agent_id == "test_agent"
        assert agent.name == "Test Agent"
        assert "test_capability" in agent.capabilities

    def test_unregister_agent(self, registry):
        """Test unregistering an agent."""
        registry.register_agent(
            agent_id="test_agent",
            name="Test Agent",
            description="A test agent",
            capabilities=["test_capability"],
            endpoint="local:test_agent",
        )

        result = registry.unregister_agent("test_agent")
        assert result is True

        agent = registry.get_agent("test_agent")
        assert agent is None

    def test_get_agents_by_capability(self, registry):
        """Test getting agents by capability."""
        registry.register_agent(
            agent_id="agent_1",
            name="Agent 1",
            description="Agent 1",
            capabilities=["capability_a", "capability_b"],
            endpoint="local:agent_1",
        )
        registry.register_agent(
            agent_id="agent_2",
            name="Agent 2",
            description="Agent 2",
            capabilities=["capability_a"],
            endpoint="local:agent_2",
        )

        agents = registry.get_agents_by_capability("capability_a")
        assert len(agents) == 2

        agents = registry.get_agents_by_capability("capability_b")
        assert len(agents) == 1
        assert agents[0].agent_id == "agent_1"

    def test_get_registry_stats(self, registry):
        """Test getting registry statistics."""
        registry.register_agent(
            agent_id="test_agent",
            name="Test Agent",
            description="A test agent",
            capabilities=["test_capability"],
            endpoint="local:test_agent",
        )

        stats = registry.get_registry_stats()

        assert stats["total_agents"] == 1
        assert stats["healthy_agents"] == 1
        assert "test_capability" in stats["capabilities"]


class TestA2AMessage:
    """Tests for A2A Message Protocol."""

    def test_message_serialization(self):
        """Test message serialization and deserialization."""
        header = A2AMessageHeader(
            message_id="msg_001",
            correlation_id="corr_001",
            message_type=MessageType.TASK_REQUEST,
            sender="agent_a",
            receiver="agent_b",
            timestamp=time.time(),
            priority=3,
        )

        message = A2AMessage(
            header=header,
            capability=AgentCapability.CODEBASE_ANALYSIS,
            task_id="task_001",
            payload={"action": "analyze"},
            context={"session_id": "session_123"},
        )

        message_dict = message.to_dict()
        restored = A2AMessage.from_dict(message_dict)

        assert restored.header.message_id == "msg_001"
        assert restored.header.sender == "agent_a"
        assert restored.capability == AgentCapability.CODEBASE_ANALYSIS
        assert restored.task_id == "task_001"
        assert restored.context["session_id"] == "session_123"

    def test_message_types(self):
        """Test all message types."""
        assert MessageType.TASK_REQUEST.value == "task_request"
        assert MessageType.TASK_RESPONSE.value == "task_response"
        assert MessageType.TASK_DELEGATION.value == "task_delegation"

    def test_agent_capabilities(self):
        """Test agent capability enumeration."""
        assert AgentCapability.CODEBASE_ANALYSIS.value == "codebase_analysis"
        assert (
            AgentCapability.LEARNING_PATH_GENERATION.value == "learning_path_generation"
        )
        assert AgentCapability.TASK_GENERATION.value == "task_generation"


class TestTaskResult:
    """Tests for TaskResult."""

    def test_successful_task_result(self):
        """Test creating a successful task result."""
        result = TaskResult(
            task_id="task_001",
            success=True,
            result={"output": "data"},
            execution_time_ms=100.0,
        )

        assert result.success is True
        assert result.result["output"] == "data"
        assert result.error is None

    def test_failed_task_result(self):
        """Test creating a failed task result."""
        result = TaskResult(
            task_id="task_002",
            success=False,
            error="Task failed",
            error_code="FAILED",
            execution_time_ms=50.0,
        )

        assert result.success is False
        assert result.error == "Task failed"
        assert result.error_code == "FAILED"


class TestA2AAgentRegistry:
    """Tests for A2A Agent Registry singleton."""

    def test_singleton_pattern(self):
        """Test that A2AAgentRegistry is a singleton."""
        A2AAgentRegistry._instance = None
        registry1 = get_a2a_agent_registry()
        registry2 = get_a2a_agent_registry()

        assert registry1 is registry2

    def test_register_agent(self):
        """Test registering an agent."""
        A2AAgentRegistry._instance = None
        registry = get_a2a_agent_registry()

        registry.register_agent(
            agent_id="test_a2a_agent",
            capabilities=[AgentCapability.CODEBASE_ANALYSIS],
            endpoint="local:test",
        )

        assert "test_a2a_agent" in registry._agents


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
