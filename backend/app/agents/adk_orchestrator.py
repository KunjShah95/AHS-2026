"""
CodeFlow - Google Agent Development Kit (ADK) Integration
=========================================================

This module provides ADK-based agent orchestration for production use.
Replaces the custom orchestrator with Google ADK patterns.

Google ADK Reference:
- https://developers.google.com/agent-development-kit
- https://github.com/google/Adept-Agent-Development-Kit
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod
import json

from app.core.vertex import VertexAIClient, get_vertex_client

logger = logging.getLogger(__name__)


class AgentState(Enum):
    """Agent lifecycle states."""

    IDLE = "idle"
    RUNNING = "running"
    WAITING = "waiting"
    ERROR = "error"
    STOPPED = "stopped"


class TaskPriority(Enum):
    """Task priority levels for A2A communication."""

    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4


@dataclass
class AgentContext:
    """Context shared between agents in a session."""

    session_id: str
    user_id: str
    repository_url: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    artifacts: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentTask:
    """Task to be executed by an agent."""

    task_id: str
    agent_name: str
    capability: str
    payload: Dict[str, Any]
    priority: TaskPriority = TaskPriority.MEDIUM
    created_at: datetime = field(default_factory=datetime.utcnow)
    timeout_seconds: int = 300
    retry_count: int = 0
    max_retries: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResult:
    """Result from agent execution."""

    task_id: str
    agent_name: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    token_usage: Dict[str, int] = field(default_factory=dict)
    artifacts: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class ADKBaseAgent(ABC):
    """
    Base class for CodeFlow agents using ADK patterns.

    Provides:
    - Standardized lifecycle management
    - Tool calling framework
    - State persistence
    - Error handling
    """

    def __init__(
        self,
        name: str,
        description: str,
        vertex_client: Optional[VertexAIClient] = None,
    ):
        self.name = name
        self.description = description
        self.state = AgentState.IDLE
        self.vertex_client = vertex_client or get_vertex_client()
        self.prompt_manager = PromptManager()

        self._tools: Dict[str, Callable] = {}
        self._task_history: List[AgentTask] = []
        self._result_cache: Dict[str, AgentResult] = {}

        logger.info(f"Agent '{name}' initialized")

    @property
    def tools(self) -> Dict[str, Callable]:
        """Get registered tools for this agent."""
        return self._tools.copy()

    def register_tool(self, name: str, func: Callable) -> None:
        """Register a tool for this agent."""
        self._tools[name] = func
        logger.debug(f"Tool '{name}' registered for agent '{self.name}'")

    def register_tools_from_functions(self) -> None:
        """Auto-register methods that start with 'tool_'."""
        for attr_name in dir(self):
            if attr_name.startswith("tool_"):
                func = getattr(self, attr_name)
                if callable(func):
                    tool_name = attr_name[5:]  # Remove 'tool_' prefix
                    self.register_tool(tool_name, func)

    async def execute(self, task: AgentTask, context: AgentContext) -> AgentResult:
        """
        Execute a task with this agent.

        This is the main entry point for ADK-style execution.
        """
        start_time = datetime.utcnow()
        self.state = AgentState.RUNNING

        try:
            logger.info(f"Agent '{self.name}' executing task {task.task_id}")

            # Execute the task (implemented by subclass)
            result = await self._execute_impl(task, context)

            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000

            agent_result = AgentResult(
                task_id=task.task_id,
                agent_name=self.name,
                success=True,
                result=result,
                execution_time_ms=execution_time,
            )

            self._task_history.append(task)
            self._result_cache[task.task_id] = agent_result

            logger.info(
                f"Agent '{self.name}' completed task {task.task_id} in {execution_time:.2f}ms"
            )

            return agent_result

        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            error_msg = str(e)

            logger.error(f"Agent '{self.name}' failed task {task.task_id}: {error_msg}")

            agent_result = AgentResult(
                task_id=task.task_id,
                agent_name=self.name,
                success=False,
                error=error_msg,
                execution_time_ms=execution_time,
            )

            self._task_history.append(task)
            self._result_cache[task.task_id] = agent_result

            return agent_result

        finally:
            self.state = AgentState.IDLE

    @abstractmethod
    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """
        Implementation of task execution.
        Must be implemented by subclasses.
        """
        pass

    def get_capabilities(self) -> List[str]:
        """Get list of capabilities this agent provides."""
        return []

    async def health_check(self) -> Dict[str, Any]:
        """Check agent health and readiness."""
        return {
            "agent": self.name,
            "state": self.state.value,
            "tools_registered": len(self._tools),
            "tasks_completed": len([t for t in self._task_history]),
            "healthy": self.state != AgentState.ERROR,
        }


class CodebaseArchitectAgent(ADKBaseAgent):
    """
    Agent for analyzing repository architecture using ADK patterns.

    Capabilities:
    - Repository structure analysis
    - Module dependency mapping
    - Architecture type detection
    - Entry point identification
    """

    def __init__(self, vertex_client: Optional[VertexAIClient] = None):
        super().__init__(
            name="codebase_architect",
            description="Analyzes repository structure and identifies architecture patterns",
        )
        self.register_tools_from_functions()

    def get_capabilities(self) -> List[str]:
        return [
            "codebase_analysis",
            "dependency_mapping",
            "architecture_detection",
            "module_identification",
        ]

    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """Execute architecture analysis task."""
        action = task.payload.get("action", "analyze")

        if action == "analyze":
            return await self._analyze_repository(task.payload, context)
        elif action == "get_modules":
            return await self._get_module_info(task.payload, context)
        elif action == "identify_entry_points":
            return await self._identify_entry_points(task.payload, context)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _analyze_repository(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Analyze repository structure."""
        repository_path = payload.get(
            "repository_path", context.metadata.get("repository_path")
        )
        max_modules = payload.get("max_modules", 10)

        prompt = self.prompt_manager.get_prompt(
            "architect_analysis",
            repository_path=repository_path,
            max_modules=max_modules,
        )

        response = self.vertex_client.generate_text(prompt=prompt, temperature=0.2)

        try:
            analysis = json.loads(response)
        except json.JSONDecodeError:
            analysis = {"raw_response": response}

        return {
            "architecture_type": analysis.get("architecture_type", "Unknown"),
            "modules": analysis.get("modules", []),
            "confidence": analysis.get("confidence", 0.8),
            "layers": analysis.get("layers", []),
            "entry_points": analysis.get("entry_points", []),
            "risk_zones": analysis.get("risk_zones", []),
            "file_tree_summary": analysis.get("file_tree_summary", {}),
        }

    async def _get_module_info(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Get detailed information about a module."""
        module_path = payload.get("module_path")

        if not module_path:
            return {"error": "module_path is required"}

        return {
            "module_path": module_path,
            "files": [],
            "dependencies": [],
            "complexity_score": 0.0,
            "test_coverage": 0.0,
        }

    async def _identify_entry_points(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Identify entry points for the repository."""
        repository_path = payload.get(
            "repository_path", context.metadata.get("repository_path")
        )

        prompt = self.prompt_manager.get_prompt(
            "identify_entry_points", repository_path=repository_path
        )

        response = self.vertex_client.generate_text(prompt=prompt)

        return {
            "entry_points": json.loads(response) if response.startswith("[") else [],
            "primary_entry": None,
            "alternative_entries": [],
        }


class LearningPathArchitectAgent(ADKBaseAgent):
    """
    Agent for generating personalized learning paths using ADK patterns.

    Capabilities:
    - Learning path generation
    - Milestone creation
    - Time estimation
    - Difficulty calibration
    """

    def __init__(self, vertex_client: Optional[VertexAIClient] = None):
        super().__init__(
            name="learning_path_architect",
            description="Generates personalized learning paths based on architecture analysis",
        )
        self.register_tools_from_functions()

    def get_capabilities(self) -> List[str]:
        return [
            "learning_path_generation",
            "milestone_creation",
            "time_estimation",
            "difficulty_calibration",
        ]

    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """Execute learning path task."""
        action = task.payload.get("action", "generate")

        if action == "generate":
            return await self._generate_learning_path(task.payload, context)
        elif action == "get_milestones":
            return await self._get_milestones(task.payload, context)
        elif action == "estimate_time":
            return await self._estimate_time(task.payload, context)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _generate_learning_path(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Generate learning path from architecture analysis."""
        architecture_analysis = payload.get("architecture_analysis", {})
        developer_level = payload.get("developer_level", "junior")
        time_available = payload.get("time_available", "2 weeks")

        prompt = self.prompt_manager.get_prompt(
            "learning_path_generation",
            architecture=architecture_analysis,
            level=developer_level,
            time_available=time_available,
        )

        response = self.vertex_client.generate_text(prompt=prompt, temperature=0.3)

        try:
            path_data = json.loads(response)
        except json.JSONDecodeError:
            path_data = {"raw_response": response}

        return {
            "total_phases": path_data.get("total_phases", 5),
            "estimated_total_hours": path_data.get("estimated_total_hours", 20),
            "milestones": path_data.get("milestones", []),
            "quick_wins": path_data.get("quick_wins", []),
            "modules": path_data.get("modules", []),
            "recommended_order": path_data.get("recommended_order", []),
        }

    async def _get_milestones(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Get milestone information."""
        return {"milestones": [], "current_phase": 1, "progress_percentage": 0.0}

    async def _estimate_time(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Estimate time for completing learning path."""
        return {
            "estimated_hours": 20,
            "estimated_days": 10,
            "hours_per_day_recommended": 2,
            "breakdown": {},
        }


class TaskGeneratorAgent(ADKBaseAgent):
    """
    Agent for generating learning tasks using ADK patterns.

    Capabilities:
    - Task generation from modules
    - Quick win identification
    - Task difficulty assessment
    - Hint generation
    """

    def __init__(self, vertex_client: Optional[VertexAIClient] = None):
        super().__init__(
            name="task_generator",
            description="Generates learning tasks based on module analysis",
        )
        self.register_tools_from_functions()

    def get_capabilities(self) -> List[str]:
        return [
            "task_generation",
            "quick_win_identification",
            "difficulty_assessment",
            "hint_generation",
        ]

    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """Execute task generation."""
        action = task.payload.get("action", "generate")

        if action == "generate":
            return await self._generate_task(task.payload, context)
        elif action == "quick_win":
            return await self._generate_quick_win(task.payload, context)
        elif action == "batch":
            return await self._generate_batch(task.payload, context)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _generate_task(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Generate a single task."""
        module_info = payload.get("module_info", {})
        developer_progress = payload.get("developer_progress", {})

        prompt = self.prompt_manager.get_prompt(
            "task_generation", module=module_info, progress=developer_progress
        )

        response = self.vertex_client.generate_text(prompt=prompt, temperature=0.4)

        try:
            task_data = json.loads(response)
        except json.JSONDecodeError:
            task_data = {"raw_response": response}

        return {
            "task_id": f"task_{context.session_id}_{len(context.artifacts)}",
            "title": task_data.get("title", "Untitled Task"),
            "description": task_data.get("description", ""),
            "difficulty": task_data.get("difficulty", "medium"),
            "estimated_time": task_data.get("estimated_time", "30 minutes"),
            "steps": task_data.get("steps", []),
            "hints": task_data.get("hints", []),
            "resources": task_data.get("resources", []),
        }

    async def _generate_quick_win(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Generate a quick win task."""
        architecture_analysis = payload.get("architecture_analysis", {})

        return {
            "task_id": f"quick_win_{context.session_id}",
            "title": "Setup Development Environment",
            "description": "Configure your local development environment",
            "difficulty": "easy",
            "estimated_time": "15 minutes",
            "steps": [
                "Clone the repository",
                "Install dependencies",
                "Run initial setup scripts",
                "Verify the build",
            ],
            "type": "quick_win",
        }

    async def _generate_batch(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Generate a batch of tasks."""
        module_infos = payload.get("module_infos", [])
        count = payload.get("count", 5)

        tasks = []
        for i, module_info in enumerate(module_infos[:count]):
            task = await self._generate_task(
                {"module_info": module_info, "developer_progress": {}}, context
            )
            tasks.append(task)

        return {"tasks": tasks, "total_generated": len(tasks)}


class InteractiveTutorAgent(ADKBaseAgent):
    """
    Agent for interactive tutoring using ADK patterns.

    Capabilities:
    - Question answering
    - Code explanation
    - Concept clarification
    - Follow-up suggestions
    """

    def __init__(self, vertex_client: Optional[VertexAIClient] = None):
        super().__init__(
            name="interactive_tutor",
            description="Provides interactive tutoring and code explanations",
        )
        self.register_tools_from_functions()

    def get_capabilities(self) -> List[str]:
        return [
            "question_answering",
            "code_explanation",
            "concept_clarification",
            "follow_up_suggestions",
        ]

    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """Execute tutoring task."""
        action = task.payload.get("action", "answer")

        if action == "answer":
            return await self._answer_question(task.payload, context)
        elif action == "explain_code":
            return await self._explain_code(task.payload, context)
        elif action == "clarify_concept":
            return await self._clarify_concept(task.payload, context)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _answer_question(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Answer a user's question."""
        question = payload.get("question", "")
        codebase_context = payload.get(
            "codebase_context", context.artifacts.get("architecture_analysis", {})
        )
        user_progress = payload.get("user_progress", {})

        prompt = self.prompt_manager.get_prompt(
            "tutor_answer",
            question=question,
            context=codebase_context,
            progress=user_progress,
        )

        response = self.vertex_client.generate_text(prompt=prompt, temperature=0.5)

        return {
            "answer": response,
            "confidence": 0.9,
            "follow_up_suggestions": [
                "Can you explain this concept further?",
                "Show me an example?",
                "What related topics should I learn?",
            ],
            "learning_tip": "Practice makes perfect!",
        }

    async def _explain_code(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Explain a piece of code."""
        code_snippet = payload.get("code", "")

        return {
            "explanation": "Code explanation here...",
            "complexity": "medium",
            "key_concepts": [],
            "related_resources": [],
        }

    async def _clarify_concept(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Clarify a programming concept."""
        concept = payload.get("concept", "")

        return {
            "definition": f"Definition of {concept}",
            "examples": [],
            "common_misconceptions": [],
            "related_concepts": [],
        }


class ProgressCoachAgent(ADKBaseAgent):
    """
    Agent for progress tracking and coaching using ADK patterns.

    Capabilities:
    - Progress tracking
    - Achievement management
    - Personalized feedback
    - Gamification
    """

    def __init__(self, vertex_client: Optional[VertexAIClient] = None):
        super().__init__(
            name="progress_coach",
            description="Tracks progress and provides personalized coaching",
        )
        self.register_tools_from_functions()

        self._progress_store: Dict[str, Any] = {}

    def get_capabilities(self) -> List[str]:
        return [
            "progress_tracking",
            "achievement_management",
            "personalized_feedback",
            "gamification",
        ]

    async def _execute_impl(
        self, task: AgentTask, context: AgentContext
    ) -> Dict[str, Any]:
        """Execute progress coaching task."""
        action = task.payload.get("action", "track")

        if action == "track":
            return await self._track_progress(task.payload, context)
        elif action == "feedback":
            return await self._get_feedback(task.payload, context)
        elif action == "achievement":
            return await self._check_achievements(task.payload, context)
        elif action == "leaderboard":
            return await self._get_leaderboard(task.payload, context)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _track_progress(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Track user progress."""
        user_id = payload.get("user_id", context.user_id)
        task_id = payload.get("task_id")
        task_title = payload.get("task_title")
        time_spent = payload.get("time_spent_minutes", 0)
        difficulty = payload.get("difficulty", 3)
        self_rating = payload.get("self_rating", 3)

        if user_id not in self._progress_store:
            self._progress_store[user_id] = {
                "completed_tasks": [],
                "total_time_spent": 0,
                "xp": 0,
                "level": 1,
                "streak": 0,
                "badges": [],
            }

        progress = self._progress_store[user_id]

        progress["completed_tasks"].append(
            {
                "task_id": task_id,
                "title": task_title,
                "completed_at": datetime.utcnow().isoformat(),
                "time_spent": time_spent,
                "difficulty": difficulty,
                "self_rating": self_rating,
            }
        )

        xp_earned = time_spent * difficulty // 2
        progress["xp"] += xp_earned
        progress["total_time_spent"] += time_spent

        if progress["xp"] >= progress["level"] * 100:
            progress["level"] += 1

        return {
            "user_id": user_id,
            "completed_tasks_count": len(progress["completed_tasks"]),
            "total_time_spent": progress["total_time_spent"],
            "xp": progress["xp"],
            "level": progress["level"],
            "progress_to_next_level": (progress["xp"] % 100) / 100,
        }

    async def _get_feedback(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Get personalized feedback."""
        user_id = payload.get("user_id", context.user_id)

        return {
            "greeting": f"Great progress, developer!",
            "recent_win": "You completed your first module!",
            "encouragement": "Keep up the excellent work!",
            "next_focus": "Try the authentication module next.",
            "improvement_tip": "Consider spending more time on testing practices.",
        }

    async def _check_achievements(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Check for new achievements."""
        user_id = payload.get("user_id", context.user_id)

        return {"new_achievements": [], "existing_badges": [], "total_badges": 0}

    async def _get_leaderboard(
        self, payload: Dict[str, Any], context: AgentContext
    ) -> Dict[str, Any]:
        """Get leaderboard data."""
        limit = payload.get("limit", 10)

        sorted_users = sorted(
            self._progress_store.items(), key=lambda x: x[1].get("xp", 0), reverse=True
        )[:limit]

        return {
            "leaderboard": [
                {"rank": i + 1, "user_id": uid, **data}
                for i, (uid, data) in enumerate(sorted_users)
            ]
        }


class ADKOrchestrator:
    """
    Master orchestrator using Google ADK patterns.

    Coordinates all CodeFlow agents to deliver:
    1. Initial repository analysis
    2. Personalized learning path generation
    3. Task assignment and tracking
    4. Interactive tutoring
    5. Progress coaching

    Features:
    - Agent lifecycle management
    - Task queue and prioritization
    - Context sharing between agents
    - Error handling and recovery
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
        self._vertex_client = get_vertex_client()

        self._agents: Dict[str, ADKBaseAgent] = {}
        self._task_queue: asyncio.Queue = asyncio.Queue()
        self._running_tasks: Dict[str, asyncio.Task] = {}

        self._initialize_agents()

        logger.info("ADK Orchestrator initialized with all agents")

    def _initialize_agents(self):
        """Initialize all CodeFlow agents."""
        self._agents["codebase_architect"] = CodebaseArchitectAgent(self._vertex_client)
        self._agents["learning_path_architect"] = LearningPathArchitectAgent(
            self._vertex_client
        )
        self._agents["task_generator"] = TaskGeneratorAgent(self._vertex_client)
        self._agents["interactive_tutor"] = InteractiveTutorAgent(self._vertex_client)
        self._agents["progress_coach"] = ProgressCoachAgent(self._vertex_client)

        for agent in self._agents.values():
            agent.register_tools_from_functions()

    def get_agent(self, name: str) -> Optional[ADKBaseAgent]:
        """Get agent by name."""
        return self._agents.get(name)

    def get_all_agents(self) -> Dict[str, ADKBaseAgent]:
        """Get all registered agents."""
        return self._agents.copy()

    async def execute_task(
        self, agent_name: str, task: AgentTask, context: AgentContext
    ) -> AgentResult:
        """Execute a task with the specified agent."""
        agent = self._agents.get(agent_name)

        if not agent:
            return AgentResult(
                task_id=task.task_id,
                agent_name=agent_name,
                success=False,
                error=f"Agent '{agent_name}' not found",
            )

        result = await agent.execute(task, context)

        return result

    async def start_onboarding(
        self,
        user_id: str,
        repository_url: str,
        file_tree: List[Dict],
        developer_level: str = "junior",
        time_available: str = "2 weeks",
    ) -> Dict[str, Any]:
        """
        Start the complete onboarding process.

        This is the MAIN ORCHESTRATION FUNCTION.
        """
        session_id = f"session_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        context = AgentContext(
            session_id=session_id,
            user_id=user_id,
            repository_url=repository_url,
            metadata={
                "repository_url": repository_url,
                "file_tree": file_tree,
                "developer_level": developer_level,
                "time_available": time_available,
            },
        )

        logger.info(f"Starting onboarding session: {session_id}")

        try:
            architecture_task = AgentTask(
                task_id=f"{session_id}_arch_001",
                agent_name="codebase_architect",
                capability="codebase_analysis",
                payload={
                    "action": "analyze",
                    "repository_path": repository_url,
                    "file_tree": file_tree,
                },
                priority=TaskPriority.HIGH,
            )

            architecture_result = await self.execute_task(
                "codebase_architect", architecture_task, context
            )

            if not architecture_result.success:
                raise Exception(
                    f"Architecture analysis failed: {architecture_result.error}"
                )

            context.artifacts["architecture_analysis"] = architecture_result.result

            learning_path_task = AgentTask(
                task_id=f"{session_id}_learn_001",
                agent_name="learning_path_architect",
                capability="learning_path_generation",
                payload={
                    "action": "generate",
                    "architecture_analysis": architecture_result.result,
                    "developer_level": developer_level,
                    "time_available": time_available,
                },
                priority=TaskPriority.HIGH,
            )

            learning_path_result = await self.execute_task(
                "learning_path_architect", learning_path_task, context
            )

            if learning_path_result.success:
                context.artifacts["learning_path"] = learning_path_result.result

            quick_win_task = AgentTask(
                task_id=f"{session_id}_task_qw_001",
                agent_name="task_generator",
                capability="quick_win_identification",
                payload={
                    "action": "quick_win",
                    "architecture_analysis": architecture_result.result,
                },
                priority=TaskPriority.CRITICAL,
            )

            quick_win_result = await self.execute_task(
                "task_generator", quick_win_task, context
            )

            arch_result = architecture_result.result or {}
            learn_result = (
                learning_path_result.result if learning_path_result.success else None
            )
            quick_result = quick_win_result.result if quick_win_result.success else None

            return {
                "success": True,
                "session_id": session_id,
                "message": "Welcome to your onboarding journey! 🚀",
                "architecture_summary": {
                    "type": arch_result.get("architecture_type", "Unknown"),
                    "confidence": arch_result.get("confidence", 0),
                    "entry_points": arch_result.get("entry_points", [])[:5],
                    "module_count": arch_result.get("module_count", 0),
                    "risk_zones_count": len(arch_result.get("risk_zones", [])),
                },
                "learning_path_summary": learn_result,
                "initial_tasks": [quick_result] if quick_result else [],
                "next_steps": [
                    "Start with your Quick Win task to get familiar",
                    "Explore the entry points of the codebase",
                    "Ask the AI Tutor if you have any questions",
                    "Complete tasks to earn XP and badges!",
                ],
            }

        except Exception as e:
            logger.error(f"Error in onboarding: {e}")
            return {
                "success": False,
                "session_id": session_id,
                "error": str(e),
                "message": "There was an error analyzing the repository. Please try again.",
            }

    async def health_check_all(self) -> Dict[str, Any]:
        """Health check all agents."""
        results = {}
        for name, agent in self._agents.items():
            results[name] = await agent.health_check()
        return results


def get_adk_orchestrator() -> ADKOrchestrator:
    """Get the global ADK orchestrator instance."""
    return ADKOrchestrator()
