"""
CodeFlow - Learning Path Architect Agent
==========================================
Creates personalized, cognitive science-backed learning paths.

HACKATHON DIFFERENTIATOR: This is the KEY feature that beats MCP + Cursor!
- Structured learning sequences (not ad-hoc questions)
- Dependency-ordered modules
- Skill level adaptation
- Progress tracking integration
- Proactive guidance
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import logging
import json

from app.core.gemini_client import get_gemini_client
from app.core.prompts import (
    LEARNING_PATH_SYSTEM,
    get_learning_path_prompt,
    get_onboarding_roadmap_prompt,
    get_skill_gap_analysis_prompt
)

logger = logging.getLogger(__name__)


class DeveloperLevel(str, Enum):
    INTERN = "intern"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"


@dataclass
class LearningTask:
    """A specific task within a learning phase."""
    task_type: str  # scavenger_hunt, trace_flow, safe_modification, documentation
    description: str
    success_criteria: str
    estimated_minutes: int = 30


@dataclass
class LearningPhase:
    """A phase in the learning journey."""
    phase_number: int
    title: str
    duration_hours: float
    objectives: List[str]
    modules_to_study: List[str]
    concepts_introduced: List[str]
    hands_on_task: LearningTask
    checkpoint_questions: List[str]


@dataclass
class LearningMilestone:
    """Key milestone in the onboarding journey."""
    phase: int
    milestone: str
    success_indicator: str


@dataclass
class PersonalizedLearningPath:
    """Complete personalized learning path for a developer."""
    developer_level: DeveloperLevel
    total_phases: int
    estimated_total_hours: float
    phases: List[LearningPhase]
    quick_wins: List[str]
    milestones: List[LearningMilestone]
    skill_gaps: List[Dict[str, Any]]
    first_contribution_targets: List[Dict[str, Any]]


class LearningPathArchitectAgent:
    """
    Agent 2: Learning Path Architect
    
    The CORE DIFFERENTIATOR of CodeFlow.
    
    Unlike MCP + Cursor which answers ad-hoc questions, this agent:
    1. Creates structured, sequential learning paths
    2. Applies cognitive science principles (spaced repetition, interleaving)
    3. Adapts to developer skill level
    4. Tracks progress and adjusts recommendations
    5. Provides hands-on tasks, not just information
    
    This is what companies will PAY for - reduced onboarding time with
    measurable outcomes.
    """
    
    def __init__(self):
        self.gemini = get_gemini_client()
    
    async def generate_learning_path(
        self,
        architecture_analysis: Dict[str, Any],
        developer_level: DeveloperLevel = DeveloperLevel.JUNIOR,
        time_available: str = "2 weeks",
        focus_areas: Optional[List[str]] = None
    ) -> PersonalizedLearningPath:
        """
        Generate a personalized learning path.
        
        Args:
            architecture_analysis: Output from CodebaseArchitectAgent
            developer_level: Experience level of the developer
            time_available: Available onboarding time
            focus_areas: Optional specific areas to focus on
        
        Returns:
            Complete PersonalizedLearningPath with phases, tasks, and milestones
        """
        logger.info(f"Generating learning path for {developer_level.value} developer")
        
        # Step 1: Format architecture summary for AI
        arch_summary = self._format_architecture_summary(architecture_analysis)
        
        # Step 2: Format module analyses
        module_analyses = self._format_module_analyses(architecture_analysis.get("modules", []))
        
        # Step 3: Generate learning path via AI
        prompt = get_learning_path_prompt(
            architecture_summary=arch_summary,
            module_analyses=module_analyses,
            developer_level=developer_level.value,
            time_available=time_available
        )
        
        result = self.gemini.generate_json(
            prompt,
            LEARNING_PATH_SYSTEM,
            use_flash=False  # Use Pro for quality
        )
        
        # Step 4: Parse and validate result
        phases = self._parse_phases(result.get("phases", []))
        milestones = self._parse_milestones(result.get("milestones", []))
        
        # Step 5: Identify first contribution targets
        first_contributions = self._identify_first_contributions(architecture_analysis)
        
        return PersonalizedLearningPath(
            developer_level=developer_level,
            total_phases=result.get("total_phases", len(phases)),
            estimated_total_hours=result.get("estimated_total_hours", 40.0),
            phases=phases,
            quick_wins=result.get("quick_wins", []),
            milestones=milestones,
            skill_gaps=[],
            first_contribution_targets=first_contributions
        )
    
    async def analyze_skill_gap(
        self,
        developer_background: Dict[str, Any],
        codebase_requirements: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze skill gaps and create targeted learning recommendations.
        
        This is a PREMIUM feature for enterprise.
        """
        background_str = json.dumps(developer_background, indent=2)
        requirements_str = "\n".join(f"- {req}" for req in codebase_requirements)
        
        prompt = get_skill_gap_analysis_prompt(background_str, requirements_str)
        result = self.gemini.generate_json(prompt, LEARNING_PATH_SYSTEM)
        
        return result
    
    async def generate_onboarding_roadmap(
        self,
        repository_summary: str,
        role: str = "Backend Developer",
        team_size: str = "small"
    ) -> Dict[str, Any]:
        """
        Generate a complete onboarding roadmap with day-by-day breakdown.
        
        This is the DEMO feature for hackathon!
        """
        prompt = get_onboarding_roadmap_prompt(
            repository_summary=repository_summary,
            team_standards="",
            role_requirements=role
        )
        
        result = self.gemini.generate_json(prompt, LEARNING_PATH_SYSTEM)
        return result
    
    def _format_architecture_summary(self, analysis: Dict[str, Any]) -> str:
        """Format architecture analysis for AI consumption."""
        lines = [
            f"Architecture Type: {analysis.get('architecture_type', 'Unknown')}",
            f"Confidence: {analysis.get('confidence', 0.5):.0%}",
            "",
            "Layers:",
        ]
        
        for layer in analysis.get("layers", []):
            lines.append(f"  - {layer.get('name', 'Unknown')}: {layer.get('purpose', '')}")
        
        lines.append("")
        lines.append("Observations:")
        for obs in analysis.get("observations", []):
            lines.append(f"  - {obs}")
        
        lines.append("")
        lines.append(f"Entry Points: {', '.join(analysis.get('entry_points', []))}")
        
        return "\n".join(lines)
    
    def _format_module_analyses(self, modules: List[Dict[str, Any]]) -> str:
        """Format module analyses for AI consumption."""
        lines = []
        for module in modules[:20]:  # Limit for token constraints
            lines.append(f"Module: {module.get('path', 'Unknown')}")
            lines.append(f"  Responsibility: {module.get('responsibility', 'Unknown')}")
            lines.append(f"  Difficulty: {module.get('difficulty', 5)}/10")
            lines.append(f"  LOC: {module.get('loc', 0)}")
            lines.append("")
        
        return "\n".join(lines)
    
    def _parse_phases(self, phases_data: List[Dict[str, Any]]) -> List[LearningPhase]:
        """Parse phases from AI response."""
        phases = []
        for phase_data in phases_data:
            task_data = phase_data.get("hands_on_task", {})
            task = LearningTask(
                task_type=task_data.get("type", "exploration"),
                description=task_data.get("description", "Explore the codebase"),
                success_criteria=task_data.get("success_criteria", "Complete the task"),
                estimated_minutes=30
            )
            
            phase = LearningPhase(
                phase_number=phase_data.get("phase_number", 0),
                title=phase_data.get("title", "Learning Phase"),
                duration_hours=phase_data.get("duration_hours", 4.0),
                objectives=phase_data.get("objectives", []),
                modules_to_study=phase_data.get("modules_to_study", []),
                concepts_introduced=phase_data.get("concepts_introduced", []),
                hands_on_task=task,
                checkpoint_questions=phase_data.get("checkpoint_questions", [])
            )
            phases.append(phase)
        
        return phases
    
    def _parse_milestones(self, milestones_data: List[Dict[str, Any]]) -> List[LearningMilestone]:
        """Parse milestones from AI response."""
        milestones = []
        for m_data in milestones_data:
            milestone = LearningMilestone(
                phase=m_data.get("phase", 0),
                milestone=m_data.get("milestone", ""),
                success_indicator=m_data.get("criteria", "")
            )
            milestones.append(milestone)
        return milestones
    
    def _identify_first_contributions(self, architecture_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify good first contribution targets."""
        contributions = []
        
        modules = architecture_analysis.get("modules", [])
        
        # Find low-difficulty modules for documentation tasks
        for module in modules:
            if module.get("difficulty", 10) <= 3:
                contributions.append({
                    "type": "documentation",
                    "target": f"Add or improve docstrings in {module.get('path', 'unknown')}",
                    "difficulty": "easy",
                    "estimated_time": "30 minutes"
                })
                break
        
        contributions.append({
            "type": "bug_fix",
            "target": "Fix typos in error messages or comments",
            "difficulty": "easy",
            "estimated_time": "15 minutes"
        })
        
        contributions.append({
            "type": "test",
            "target": "Add a unit test for an existing function",
            "difficulty": "medium",
            "estimated_time": "1 hour"
        })
        
        return contributions
    
    def to_dict(self, path: PersonalizedLearningPath) -> Dict[str, Any]:
        """Convert learning path to dictionary for API response."""
        return {
            "developer_level": path.developer_level.value,
            "total_phases": path.total_phases,
            "estimated_total_hours": path.estimated_total_hours,
            "phases": [
                {
                    "phase_number": p.phase_number,
                    "title": p.title,
                    "duration_hours": p.duration_hours,
                    "objectives": p.objectives,
                    "modules_to_study": p.modules_to_study,
                    "concepts_introduced": p.concepts_introduced,
                    "hands_on_task": {
                        "type": p.hands_on_task.task_type,
                        "description": p.hands_on_task.description,
                        "success_criteria": p.hands_on_task.success_criteria,
                        "estimated_minutes": p.hands_on_task.estimated_minutes
                    },
                    "checkpoint_questions": p.checkpoint_questions
                }
                for p in path.phases
            ],
            "quick_wins": path.quick_wins,
            "milestones": [
                {
                    "phase": m.phase,
                    "milestone": m.milestone,
                    "success_indicator": m.success_indicator
                }
                for m in path.milestones
            ],
            "first_contribution_targets": path.first_contribution_targets
        }
