"""
CodeFlow - Agent Package Initialization
========================================

This package contains the ADK-based agent implementation
for the CodeFlow AI Onboarding Platform.

Modules:
- adk_orchestrator: Main ADK orchestrator and agent implementations
- a2a_communication: Agent-to-Agent protocol implementation
- registry: Agent capability registry and discovery

Usage:
    from app.agents import get_adk_orchestrator, get_agent_registry

    orchestrator = get_adk_orchestrator()
    result = await orchestrator.start_onboarding(...)
"""

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
    register_codeflow_agents,
)

from app.agents.a2a_communication import (
    A2AMessageBus,
    A2AChannel,
    A2AAgentChannel,
    A2AAgentRegistry,
    A2AMessage,
    A2AMessageHeader,
    TaskResult,
    AgentCapability,
    TaskStatus,
    MessageType,
    get_a2a_message_bus,
    get_a2a_agent_registry,
)

__all__ = [
    # ADK Orchestrator
    "ADKBaseAgent",
    "ADKOrchestrator",
    "CodebaseArchitectAgent",
    "LearningPathArchitectAgent",
    "TaskGeneratorAgent",
    "InteractiveTutorAgent",
    "ProgressCoachAgent",
    "AgentContext",
    "AgentTask",
    "AgentResult",
    "AgentState",
    "TaskPriority",
    "get_adk_orchestrator",
    # Registry
    "AgentRegistry",
    "AgentInfo",
    "AgentStatus",
    "get_agent_registry",
    "register_codeflow_agents",
    # A2A Protocol
    "A2AMessageBus",
    "A2AChannel",
    "A2AAgentChannel",
    "A2AAgentRegistry",
    "A2AMessage",
    "A2AMessageHeader",
    "TaskResult",
    "AgentCapability",
    "TaskStatus",
    "MessageType",
    "get_a2a_message_bus",
    "get_a2a_agent_registry",
]
