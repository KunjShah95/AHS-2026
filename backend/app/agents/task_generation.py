"""
CodeFlow - Hands-On Task Generator Agent
==========================================
Generates practical, engaging learning tasks.

HACKATHON DIFFERENTIATOR:
These aren't generic coding exercises - they're SPECIFIC to the codebase,
designed to build confidence through achievable wins while teaching
real system knowledge.
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import logging
import json
import uuid

from app.core.gemini_client import get_gemini_client
from app.core.prompts import (
    TASK_GENERATION_SYSTEM,
    get_task_generation_prompt
)

logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    SCAVENGER_HUNT = "scavenger_hunt"  # Find patterns/functions
    TRACE_FLOW = "trace_flow"  # Follow data through system
    SAFE_MODIFICATION = "safe_modification"  # Small, low-risk changes
    DOCUMENTATION = "documentation"  # Add comments/docs
    TEST_EXPLORATION = "test_exploration"  # Learn through tests
    CODE_REVIEW = "code_review"  # Review existing code
    BUG_HUNT = "bug_hunt"  # Find and fix small issues


class TaskDifficulty(int, Enum):
    TRIVIAL = 1  # < 15 minutes
    EASY = 2  # 15-30 minutes
    MEDIUM = 3  # 30-60 minutes
    CHALLENGING = 4  # 1-2 hours
    COMPLEX = 5  # 2+ hours


@dataclass
class TaskHint:
    """A hint for a task (progressively revealed)."""
    hint_number: int
    content: str
    reveal_after_minutes: int = 10


@dataclass
class LearningTask:
    """A complete hands-on learning task."""
    task_id: str
    title: str
    task_type: TaskType
    difficulty: TaskDifficulty
    estimated_minutes: int
    objective: str  # What they'll learn
    context: str  # Background info
    instructions: List[str]
    files_involved: List[str]
    success_criteria: List[str]
    hints: List[TaskHint]
    follow_up_concepts: List[str]
    created_at: datetime = field(default_factory=datetime.now)
    xp_reward: int = 10  # Gamification
    badge: Optional[str] = None


@dataclass
class TaskProgress:
    """Track progress on a task."""
    task_id: str
    status: str  # not_started, in_progress, completed, abandoned
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    hints_revealed: int = 0
    notes: str = ""

# Import Graph models
from app.models.graph import CodeGraph, NodeType


class TaskGeneratorAgent:
    """
    Agent 4: Hands-On Task Generator
    
    Creates engaging, achievable tasks that:
    1. Build confidence through small wins
    2. Teach real codebase knowledge
    3. Progress from exploration to modification
    4. Provide clear success criteria
    5. Include hints for when developers get stuck
    
    This is what makes onboarding ACTIVE, not passive.
    Developers don't just read docs - they DO things.
    """
    
    def __init__(self):
        self.gemini = get_gemini_client()
        self.task_templates = self._load_task_templates()
    
    async def generate_tasks(self, code_graph: Any) -> List[LearningTask]:
        """
        Generate a sequence of tasks based on a CodeGraph.
        """
        modules = []
        # Import here to avoid circular dependencies if any, or just use dynamic access
        # Assuming code_graph has .nodes attribute
        
        nodes = getattr(code_graph, "nodes", [])
        
        for node in nodes:
            # Check if it's a module
            if getattr(node, "type", "") == "module":
                risk_score = node.metadata.get("risk_score", "low")
                difficulty = self._calculate_difficulty_from_risk(risk_score)
                
                modules.append({
                    "path": node.path,
                    "name": node.name,
                    "difficulty": difficulty,
                    "context": f"Risk Level: {risk_score}. {node.metadata.get('metrics', '')}"
                })
        
        # If no modules found, create a dummy one to ensure at least one task
        if not modules:
            modules = [{"path": "README.md", "difficulty": 1}]
            
        return await self.generate_task_sequence(modules)

    def _calculate_difficulty_from_risk(self, risk_score: str) -> int:
        """Derive difficulty from risk score dynamically."""
        # This allows for future expansion where risk definition changes
        base_map = {"low": 2, "medium": 3, "high": 4, "critical": 5}
        return base_map.get(risk_score.lower(), 3)
    
    async def generate_task(
        self,
        module_info: Dict[str, Any],
        developer_progress: Dict[str, Any],
        preferred_type: Optional[TaskType] = None
    ) -> LearningTask:
        """
        Generate a single learning task.
        
        Args:
            module_info: Information about the target module
            developer_progress: Current progress data
            preferred_type: Optional task type preference
        
        Returns:
            A complete LearningTask ready for the developer
        """
        logger.info(f"Generating task for module: {module_info.get('path', 'unknown')}")
        
        # Format inputs for AI
        module_str = json.dumps(module_info, indent=2)
        progress_str = json.dumps(developer_progress, indent=2) if developer_progress else "{}"
        type_preference = preferred_type.value if preferred_type else "any"
        
        # Generate via AI
        prompt = get_task_generation_prompt(module_str, progress_str, type_preference)
        result = self.gemini.generate_json(prompt, TASK_GENERATION_SYSTEM, use_flash=True)
        
        # Parse result
        return self._parse_task_result(result, module_info)
    
    async def generate_task_sequence(
        self,
        modules: List[Dict[str, Any]],
        total_tasks: int = 5,
        difficulty_progression: bool = True
    ) -> List[LearningTask]:
        """
        Generate a sequence of tasks with progressive difficulty.
        
        This creates a complete "quest line" for the developer.
        """
        tasks = []
        used_types = set()
        
        # Sort modules by difficulty for progression
        sorted_modules = sorted(modules, key=lambda m: m.get("difficulty", 5))
        
        for i, module in enumerate(sorted_modules[:total_tasks]):
            # Vary task types for engagement
            available_types = [t for t in TaskType if t not in used_types]
            if not available_types:
                available_types = list(TaskType)
            
            # Choose type based on difficulty and variety
            if i == 0:
                # Start with exploration
                task_type = TaskType.SCAVENGER_HUNT
            elif i == total_tasks - 1:
                # End with a real contribution
                task_type = TaskType.SAFE_MODIFICATION
            else:
                # Mix it up
                task_type = available_types[i % len(available_types)]
            
            used_types.add(task_type)
            
            # Generate task
            task = await self.generate_task(
                module_info=module,
                developer_progress={"completed_tasks": i},
                preferred_type=task_type
            )
            tasks.append(task)
        
        return tasks
    
    def generate_quick_win_task(
        self,
        codebase_analysis: Dict[str, Any]
    ) -> LearningTask:
        """
        Generate a quick win task that can be completed in < 15 minutes.
        
        Perfect for day one to build confidence immediately.
        """
        # Find the simplest module
        modules = codebase_analysis.get("modules", [])
        simple_modules = [m for m in modules if m.get("difficulty", 10) <= 3]
        
        if not simple_modules:
            simple_modules = modules[:1]
        
        target = simple_modules[0] if simple_modules else {"path": "README.md"}
        
        task = LearningTask(
            task_id=f"quick_win_{uuid.uuid4().hex[:8]}",
            title="🎯 Quick Win: Your First Code Discovery",
            task_type=TaskType.SCAVENGER_HUNT,
            difficulty=TaskDifficulty.TRIVIAL,
            estimated_minutes=10,
            objective="Get familiar with the project structure and make your first discovery",
            context="Every journey starts with a single step. Let's explore!",
            instructions=[
                f"1. Open the file: {target.get('path', 'main file')}",
                "2. Find the main function or entry point",
                "3. Identify 3 imports or dependencies used",
                "4. Write down one question you have about this code"
            ],
            files_involved=[target.get("path", "")],
            success_criteria=[
                "Located the main entry point",
                "Listed 3 dependencies",
                "Documented one question to explore later"
            ],
            hints=[
                TaskHint(1, "Look for 'main', 'app', or 'index' in function names", 5),
                TaskHint(2, "Imports are usually at the top of the file", 8)
            ],
            follow_up_concepts=["Project structure", "Dependency management"],
            xp_reward=25,
            badge="First Explorer 🔍"
        )
        
        return task
    
    def generate_documentation_task(self, module_path: str) -> LearningTask:
        """Generate a documentation improvement task."""
        return LearningTask(
            task_id=f"docs_{uuid.uuid4().hex[:8]}",
            title=f"📝 Improve Documentation: {os.path.basename(module_path)}",
            task_type=TaskType.DOCUMENTATION,
            difficulty=TaskDifficulty.EASY,
            estimated_minutes=25,
            objective="Add helpful documentation while learning the code",
            context="Good documentation helps you AND future developers. This is a real contribution!",
            instructions=[
                f"1. Open {module_path}",
                "2. Read through the code and understand its purpose",
                "3. Add a docstring to ANY function that's missing one",
                "4. Add inline comments to explain any tricky logic",
                "5. Commit your changes (even if just to a branch)"
            ],
            files_involved=[module_path],
            success_criteria=[
                "Added at least 1 function docstring",
                "Added at least 2 inline comments",
                "Your documentation is accurate"
            ],
            hints=[
                TaskHint(1, "Start with the main function - what does it do?", 5),
                TaskHint(2, "Docstrings describe WHAT and WHY, not HOW", 10),
                TaskHint(3, "If you don't understand something, ask your tutor!", 15)
            ],
            follow_up_concepts=["Code documentation", "Clean code"],
            xp_reward=50,
            badge="Documentation Hero 📖"
        )
    
    def generate_trace_flow_task(
        self,
        entry_point: str,
        target_output: str
    ) -> LearningTask:
        """Generate a data flow tracing task."""
        return LearningTask(
            task_id=f"trace_{uuid.uuid4().hex[:8]}",
            title=f"🔍 Trace the Flow: {entry_point} → {target_output}",
            task_type=TaskType.TRACE_FLOW,
            difficulty=TaskDifficulty.MEDIUM,
            estimated_minutes=45,
            objective="Build a mental model of how data flows through the system",
            context="Understanding data flow is KEY to working effectively in any codebase.",
            instructions=[
                f"1. Start at {entry_point}",
                "2. Follow function calls step by step",
                "3. Note down each transformation of the data",
                f"4. Trace until you reach {target_output}",
                "5. Draw a simple diagram of the flow"
            ],
            files_involved=[entry_point],
            success_criteria=[
                "Documented the complete flow path",
                "Identified key transformations",
                "Created a simple flow diagram",
                "Could explain this to a colleague"
            ],
            hints=[
                TaskHint(1, "Use your IDE's 'Go to Definition' feature to follow function calls", 10),
                TaskHint(2, "Write down each file you visit in order", 20),
                TaskHint(3, "Ask the tutor to help trace specific functions", 30)
            ],
            follow_up_concepts=["Data flow", "System architecture", "Dependencies"],
            xp_reward=75,
            badge="Flow Master 🌊"
        )
    
    def generate_safe_modification_task(
        self,
        target_file: str,
        modification_type: str = "enhancement"
    ) -> LearningTask:
        """Generate a safe code modification task."""
        return LearningTask(
            task_id=f"modify_{uuid.uuid4().hex[:8]}",
            title=f"✏️ First Code Change: {os.path.basename(target_file)}",
            task_type=TaskType.SAFE_MODIFICATION,
            difficulty=TaskDifficulty.MEDIUM,
            estimated_minutes=45,
            objective="Make your first real code contribution",
            context="This is a low-risk file, perfect for your first modification. You've got this!",
            instructions=[
                "1. Create a new branch for your changes",
                f"2. Open {target_file}",
                "3. Make ONE of these improvements:",
                "   - Add type hints to a function",
                "   - Improve an error message",
                "   - Refactor a repeated pattern",
                "4. Run the tests to verify nothing broke",
                "5. Commit your changes with a clear message"
            ],
            files_involved=[target_file],
            success_criteria=[
                "Made a meaningful code improvement",
                "Tests still pass",
                "Committed with a descriptive message",
                "Code follows existing style"
            ],
            hints=[
                TaskHint(1, "Small changes are fine! Even improving one error message counts.", 10),
                TaskHint(2, "Before changing, make sure you understand the existing code", 20),
                TaskHint(3, "If tests fail, use the error message to understand why", 30)
            ],
            follow_up_concepts=["Git workflow", "Testing", "Code review"],
            xp_reward=100,
            badge="Code Contributor 🌟"
        )
    
    async def generate_tasks(
        self,
        code_graph: CodeGraph,
        total_tasks: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate a set of tasks based on the provided CodeGraph.
        This adapts the graph into the module format expected by the generator.
        """
        modules = []
        risk_map = {"low": 1, "medium": 2, "high": 3, "critical": 4, "unknown": 2}
        
        for node in code_graph.nodes:
            if node.type == NodeType.MODULE:
                # Calculate difficulty based on risk_score or defaults
                risk = node.metadata.get("risk_score", "medium")
                if isinstance(risk, str):
                    difficulty = risk_map.get(risk, 2)
                else:
                    difficulty = 2
                    
                modules.append({
                    "path": node.path,
                    "name": node.name,
                    "difficulty": difficulty,
                    "content": node.metadata.get("embedding", "") # Using embedding as proxy for now, but usually we need content
                    # Note: The agent might need actual file content or summaries which might not be in the graph fully.
                })
        
        # If no modules found, try to use what we have
        if not modules:
            # Fallback or empty
            return []
            
        # Generate sequence
        tasks = await self.generate_task_sequence(modules, total_tasks)
        
        # Return as dicts
        return [self.to_dict(t) for t in tasks]

    def _load_task_templates(self) -> Dict[TaskType, List[Dict]]:
        """Pre-load task templates for fast generation."""
        return {
            TaskType.SCAVENGER_HUNT: [
                {"title": "Find the Entry Point", "objective": "Locate where the application starts"},
                {"title": "Map the API", "objective": "Document all API endpoints"},
                {"title": "Discover the Data Models", "objective": "Find and list all data models"}
            ],
            TaskType.TRACE_FLOW: [
                {"title": "Request Flow", "objective": "Trace an HTTP request through the system"},
                {"title": "Data Processing", "objective": "Follow data transformation pipeline"},
                {"title": "Error Handling", "objective": "Trace how errors propagate"}
            ],
            TaskType.DOCUMENTATION: [
                {"title": "Document a Module", "objective": "Add comprehensive docstrings"},
                {"title": "Create a README Section", "objective": "Improve project documentation"},
                {"title": "Comment Complex Logic", "objective": "Explain tricky code sections"}
            ]
        }
    
    def _parse_task_result(self, result: Dict[str, Any], module_info: Dict[str, Any]) -> LearningTask:
        """Parse AI-generated task result into LearningTask."""
        # Handle errors in AI response
        if "error" in result:
            # Fall back to template-based task
            return self.generate_quick_win_task({"modules": [module_info]})
        
        # Parse hints
        hints = []
        for hint_data in result.get("hints", []):
            hints.append(TaskHint(
                hint_number=hint_data.get("hint_number", 1),
                content=hint_data.get("hint", "Try asking the tutor for help!"),
                reveal_after_minutes=hint_data.get("hint_number", 1) * 10
            ))
        
        return LearningTask(
            task_id=result.get("task_id", f"task_{uuid.uuid4().hex[:8]}"),
            title=result.get("title", "Learning Task"),
            task_type=self._parse_task_type(result.get("type", "scavenger_hunt")),
            difficulty=TaskDifficulty(min(5, max(1, result.get("difficulty", 2)))),
            estimated_minutes=result.get("estimated_minutes", 30),
            objective=result.get("objective", "Learn about this module"),
            context=f"Working with: {module_info.get('path', 'unknown')}",
            instructions=result.get("instructions", ["Explore the module"]),
            files_involved=result.get("files_involved", [module_info.get("path", "")]),
            success_criteria=result.get("success_criteria", ["Task completed"]),
            hints=hints,
            follow_up_concepts=result.get("follow_up_concepts", []),
            xp_reward=result.get("xp_reward", result.get("difficulty", 2) * 25)
        )
    
    def _parse_task_type(self, type_str: str) -> TaskType:
        """Parse task type string to enum."""
        type_str = type_str.lower()
        for task_type in TaskType:
            if task_type.value in type_str:
                return task_type
        return TaskType.SCAVENGER_HUNT
    
    def to_dict(self, task: LearningTask) -> Dict[str, Any]:
        """Convert task to dictionary for API response."""
        return {
            "task_id": task.task_id,
            "title": task.title,
            "type": task.task_type.value,
            "difficulty": task.difficulty.value,
            "estimated_minutes": task.estimated_minutes,
            "objective": task.objective,
            "context": task.context,
            "instructions": task.instructions,
            "files_involved": task.files_involved,
            "success_criteria": task.success_criteria,
            "hints": [
                {"hint_number": h.hint_number, "content": h.content, "reveal_after": h.reveal_after_minutes}
                for h in task.hints
            ],
            "follow_up_concepts": task.follow_up_concepts,
            "xp_reward": task.xp_reward,
            "badge": task.badge
        }
