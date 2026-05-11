"""
Simulation Engine - Hybrid rule-based + LLM what-if analysis.

Provides:
- Complexity router that scores scenario complexity
- Rule-based analyzer for deterministic blast radius
- LLM-powered reasoner for complex scenarios
"""

import os
import hashlib
import json
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Literal
from enum import Enum
from datetime import datetime

from app.entities import EntityGraph
from app.simulation.blast_analyzer import BlastRadiusAnalyzer, BlastRadiusResult
from app.drift import ArchitectureDriftDetector
from app.decisions import DecisionStore


class SimulationTier(Enum):
    """Which simulation tier is used."""

    RULE_BASED = "rule_based"
    LLM_POWERED = "llm_powered"
    HYBRID = "hybrid"


class ScenarioType(Enum):
    """Types of scenarios that can be simulated."""

    EXTRACT_SERVICE = "extract_service"
    EXTRACT_MODULE = "extract_module"
    MERGE_MODULES = "merge_modules"
    RENAME_REFACTOR = "rename_refactor"
    DELETE_DEPRECATED = "delete_deprecated"
    BREAK_MONOLITH = "break_monolith"
    MICROSERVICE_MIGRATION = "microservice_migration"
    API_CONTRACT_CHANGE = "api_contract_change"
    GENERIC = "generic"


class SimulationDepth(Enum):
    """Depth of simulation analysis."""

    SHALLOW = "shallow"
    MEDIUM = "medium"
    DEEP = "deep"


@dataclass
class SimulationRequest:
    """Request for what-if simulation."""

    scenario_type: str
    target: str
    action: str
    into: Optional[str] = None
    options: Optional[Dict[str, Any]] = None


@dataclass
class SimulationResult:
    """Result of simulation."""

    simulation_id: str
    tier_used: SimulationTier
    scenario_type: str
    target: str
    predictions: Dict[str, Any]
    risks: List[Dict[str, str]] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    affected_decisions: List[Dict[str, Any]] = field(default_factory=list)
    complexity_score: float = 0.0
    execution_time_ms: float = 0.0
    llm_reasoning: Optional[str] = None
    timestamp: str = ""


@dataclass
class MigrationPathRequest:
    """Request for migration path planning."""

    current_state: str
    target_state: str
    constraints: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MigrationPathResult:
    """Result of migration path planning."""

    path_id: str
    current_state: str
    target_state: str
    steps: List[Dict[str, Any]] = field(default_factory=list)
    estimated_total_hours: float = 0.0
    risks: List[Dict[str, str]] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)


class ComplexityRouter:
    """
    Routes scenarios to appropriate simulation tier based on complexity.

    Complexity score is calculated from:
    - File count
    - Dependency depth
    - Pattern violations
    """

    COMPLEXITY_THRESHOLD = 50.0

    def __init__(self):
        self.weights = {
            "file_count": 1.0,
            "dependency_depth": 2.0,
            "pattern_violations": 3.0,
            "decision_overlap": 1.5,
        }

    def calculate_complexity(
        self,
        target: str,
        entity_graph: Optional[EntityGraph] = None,
        drift_detector: Optional[ArchitectureDriftDetector] = None,
    ) -> float:
        """Calculate complexity score for a scenario."""
        score = 0.0

        file_count = self._count_target_files(target, entity_graph)
        score += file_count * self.weights["file_count"]

        depth = self._calculate_dependency_depth(target, entity_graph)
        score += depth * self.weights["dependency_depth"]

        violations = self._count_pattern_violations(target, drift_detector)
        score += violations * self.weights["pattern_violations"]

        return score

    def should_use_llm(self, complexity_score: float) -> bool:
        """Determine if LLM tier should be used."""
        return complexity_score >= self.COMPLEXITY_THRESHOLD

    def _count_target_files(self, target: str, graph: Optional[EntityGraph]) -> int:
        """Count files in target scope."""
        if not graph:
            return 1

        if target.endswith("*"):
            prefix = target[:-1]
            return len(
                [f for f in graph.entities_by_file.keys() if f.startswith(prefix)]
            )

        return 1 if target in graph.entities_by_file else 0

    def _calculate_dependency_depth(
        self, target: str, graph: Optional[EntityGraph]
    ) -> int:
        """Calculate maximum dependency depth."""
        if not graph:
            return 1

        max_depth = 0
        visited = set()

        def traverse(path: str, depth: int):
            nonlocal max_depth
            if path in visited or depth > 10:
                return
            visited.add(path)
            max_depth = max(max_depth, depth)

            for file_path in graph.entities_by_file.keys():
                if file_path != path:
                    entities = graph.entities_by_file[file_path]
                    for entity in entities:
                        content = entity.get("content", "")
                        if target.split("/")[-1] in content:
                            traverse(file_path, depth + 1)

        traverse(target, 0)
        return max_depth

    def _count_pattern_violations(
        self, target: str, detector: Optional[ArchitectureDriftDetector]
    ) -> int:
        """Count potential pattern violations."""
        return 0


class RuleBasedAnalyzer:
    """
    Rule-based simulation for deterministic scenarios.

    Applies pattern rules to predict direct impacts:
    - Service extraction patterns
    - Module merge patterns
    - API breaking change detection
    """

    SCENARIO_PATTERNS = {
        ScenarioType.EXTRACT_SERVICE: [
            ("service_layer_needed", 0.8),
            ("api_routes_affected", 0.7),
            ("config_updates_required", 0.5),
        ],
        ScenarioType.EXTRACT_MODULE: [
            ("import_updates_required", 0.9),
            ("tests_need_update", 0.6),
            ("docs_need_update", 0.4),
        ],
        ScenarioType.MERGE_MODULES: [
            ("naming_conflicts", 0.7),
            ("duplicate_exports", 0.6),
            ("circular_dependency_risk", 0.5),
        ],
        ScenarioType.DELETE_DEPRECATED: [
            ("breaking_changes", 0.9),
            ("unused_code_detected", 0.7),
            ("tests_affected", 0.6),
        ],
        ScenarioType.BREAK_MONOLITH: [
            ("api_contracts_needed", 0.9),
            ("data_sharding_needed", 0.8),
            ("service_discovery_needed", 0.7),
        ],
    }

    def __init__(self, entity_graph: Optional[EntityGraph] = None):
        self.entity_graph = entity_graph
        self.blast_analyzer = BlastRadiusAnalyzer(entity_graph)

    def analyze(
        self,
        scenario_type: ScenarioType,
        target: str,
        action: str,
        into: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run rule-based analysis."""
        predictions = {
            "files_affected": 0,
            "imports_to_update": 0,
            "breaking_changes": [],
            "estimated_effort_hours": 0.0,
            "blast_radius": {},
            "patterns_detected": [],
        }

        blast_result = self.blast_analyzer.analyze(target, "modify")
        predictions["files_affected"] = blast_result.total_affected_files
        predictions["imports_to_update"] = len(blast_result.import_updates_required)
        predictions["breaking_changes"] = [
            bc["type"] for bc in blast_result.breaking_changes
        ]
        predictions["estimated_effort_hours"] = blast_result.estimated_effort_hours

        predictions["blast_radius"] = {
            zone.zone_name: zone.files for zone in blast_result.zones
        }

        patterns = self.SCENARIO_PATTERNS.get(scenario_type, [])
        predictions["patterns_detected"] = [pattern[0] for pattern in patterns]

        predictions["action_specific"] = self._analyze_action(
            scenario_type, target, action, into
        )

        return predictions

    def _analyze_action(
        self,
        scenario_type: ScenarioType,
        target: str,
        action: str,
        into: Optional[str],
    ) -> Dict[str, Any]:
        """Analyze action-specific outcomes."""
        results = {}

        if action == "extract" and into:
            results["new_location"] = into
            results["service_layer_needed"] = True
            results["interface_file_needed"] = True

        elif action == "merge":
            results["combined_module"] = target
            results["export_resolution_needed"] = True

        elif action == "delete":
            results["removal_strategy"] = "gradual"
            results["deprecation_warning_needed"] = True

        return results


class LLMReasoner:
    """
    LLM-powered reasoning for complex scenarios.

    Uses LLM to reason about:
    - Intent inference from decisions
    - Historical patterns
    - Tradeoff analysis
    """

    def __init__(self, decision_store: Optional[DecisionStore] = None):
        self.decision_store = decision_store
        self._llm_client = None
        self._initialize_llm()

    def _initialize_llm(self):
        """Initialize LLM client if available."""
        try:
            from . import llm

            if hasattr(llm, "LLMClient"):
                self._llm_client = llm.LLMClient()
        except ImportError:
            pass

    def reason(
        self,
        scenario_type: str,
        target: str,
        action: str,
        context: Dict[str, Any],
    ) -> Optional[str]:
        """Generate LLM reasoning for complex scenario."""
        if not self._llm_client:
            return self._fallback_reasoning(scenario_type, target, action)

        prompt = self._build_reasoning_prompt(scenario_type, target, action, context)

        try:
            response = self._llm_client.complete(prompt)
            return response.get("content", "")
        except Exception:
            return self._fallback_reasoning(scenario_type, target, action)

    def _build_reasoning_prompt(
        self, scenario_type: str, target: str, action: str, context: Dict[str, Any]
    ) -> str:
        """Build prompt for LLM reasoning."""
        affected_decisions = context.get("affected_decisions", [])

        prompt = f"""Analyze this architecture change scenario:

Scenario: {scenario_type}
Target: {target}
Action: {action}

Affected decisions: {affected_decisions}

Consider:
1. Why might this refactoring fail?
2. What hidden costs might appear?
3. What historical patterns suggest caution?
4. What tradeoffs need consideration?

Provide a brief analysis.
"""
        return prompt

    def _fallback_reasoning(self, scenario_type: str, target: str, action: str) -> str:
        """Fallback reasoning when LLM is not available."""
        return (
            f"Analysis of {scenario_type} scenario for {target}: "
            f"The {action} operation may introduce complexity. "
            f"Consider incremental approach and testing at each step."
        )


class SimulationEngine:
    """
    Main simulation engine with tier routing.

    Routes queries to appropriate tier:
    - Rule-based for simple, deterministic scenarios
    - LLM-powered for complex scenarios requiring context
    """

    def __init__(
        self,
        entity_graph: Optional[EntityGraph] = None,
        decision_store: Optional[DecisionStore] = None,
    ):
        self.entity_graph = entity_graph
        self.decision_store = decision_store

        self.complexity_router = ComplexityRouter()
        self.rule_analyzer = RuleBasedAnalyzer(entity_graph)
        self.llm_reasoner = LLMReasoner(decision_store)
        self.blast_analyzer = BlastRadiusAnalyzer(entity_graph)

        self._simulation_history: Dict[str, SimulationResult] = {}

    def simulate(
        self,
        request: SimulationRequest,
        include_llm_reasoning: bool = True,
        depth: SimulationDepth = SimulationDepth.MEDIUM,
    ) -> SimulationResult:
        """Run simulation for a what-if scenario."""
        start_time = datetime.now()

        scenario_type = self._parse_scenario_type(request.scenario_type)

        complexity = self.complexity_router.calculate_complexity(
            request.target,
            self.entity_graph,
            None,
        )

        use_llm = include_llm_reasoning and self.complexity_router.should_use_llm(
            complexity
        )

        if use_llm:
            tier = SimulationTier.HYBRID
            predictions = self.rule_analyzer.analyze(
                scenario_type,
                request.target,
                request.action,
                request.into,
            )

            context = {
                "affected_decisions": self._get_affected_decisions(request.target),
                "complexity": complexity,
            }
            llm_reasoning = self.llm_reasoner.reason(
                request.scenario_type,
                request.target,
                request.action,
                context,
            )
        else:
            tier = SimulationTier.RULE_BASED
            predictions = self.rule_analyzer.analyze(
                scenario_type,
                request.target,
                request.action,
                request.into,
            )
            llm_reasoning = None

        risks = self._identify_risks(predictions, request)
        recommendations = self._generate_recommendations(predictions, request, risks)

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        simulation_id = self._generate_simulation_id(
            request.scenario_type, request.target, request.action
        )

        result = SimulationResult(
            simulation_id=simulation_id,
            tier_used=tier,
            scenario_type=request.scenario_type,
            target=request.target,
            predictions=predictions,
            risks=risks,
            recommendations=recommendations,
            affected_decisions=self._get_affected_decisions(request.target),
            complexity_score=complexity,
            execution_time_ms=execution_time,
            llm_reasoning=llm_reasoning,
            timestamp=datetime.now().isoformat(),
        )

        self._simulation_history[simulation_id] = result
        return result

    def get_simulation(self, simulation_id: str) -> Optional[SimulationResult]:
        """Get previous simulation by ID."""
        return self._simulation_history.get(simulation_id)

    def get_blast_radius(
        self, target_path: str, change_type: str = "modify"
    ) -> BlastRadiusResult:
        """Get blast radius for a specific file change."""
        return self.blast_analyzer.analyze(target_path, change_type)

    def plan_migration(self, request: MigrationPathRequest) -> MigrationPathResult:
        """Plan migration path from current to target state."""
        steps = self._generate_migration_steps(
            request.current_state, request.target_state, request.constraints
        )

        total_hours = sum(step.get("estimated_hours", 0) for step in steps)

        risks = self._identify_migration_risks(
            request.current_state, request.target_state, steps
        )

        return MigrationPathResult(
            path_id=self._generate_path_id(request.current_state, request.target_state),
            current_state=request.current_state,
            target_state=request.target_state,
            steps=steps,
            estimated_total_hours=total_hours,
            risks=risks,
            dependencies=self._get_migration_dependencies(steps),
        )

    def _parse_scenario_type(self, scenario_str: str) -> ScenarioType:
        """Parse scenario string to enum."""
        try:
            return ScenarioType(scenario_str)
        except ValueError:
            return ScenarioType.GENERIC

    def _get_affected_decisions(self, target: str) -> List[Dict[str, Any]]:
        """Get decisions affected by target."""
        if not self.decision_store:
            return []

        decisions = self.decision_store.get_for_file(target)
        return [
            {
                "decision_id": d.id,
                "title": d.title,
                "requires_update": True,
                "reason": f"Simulation target {target} affects this decision",
            }
            for d in decisions[:5]
        ]

    def _identify_risks(
        self, predictions: Dict[str, Any], request: SimulationRequest
    ) -> List[Dict[str, str]]:
        """Identify risks based on predictions."""
        risks = []

        files_affected = predictions.get("files_affected", 0)
        if files_affected > 20:
            risks.append(
                {
                    "type": "highblast_radius",
                    "likelihood": "high",
                    "description": f"Large number of files affected: {files_affected}",
                }
            )

        breaking_changes = predictions.get("breaking_changes", [])
        if breaking_changes:
            risks.append(
                {
                    "type": "breaking_changes",
                    "likelihood": "medium",
                    "description": f"Potential breaking changes: {', '.join(breaking_changes)}",
                }
            )

        effort = predictions.get("estimated_effort_hours", 0)
        if effort > 40:
            risks.append(
                {
                    "type": "high_effort",
                    "likelihood": "high",
                    "description": f"High estimated effort: {effort} hours",
                }
            )

        return risks

    def _generate_recommendations(
        self,
        predictions: Dict[str, Any],
        request: SimulationRequest,
        risks: List[Dict[str, str]],
    ) -> List[str]:
        """Generate recommendations based on predictions."""
        recommendations = []

        if request.action == "extract":
            recommendations.append(
                "Extract service layer first before moving domain logic"
            )

        if any("highblast_radius" in r["type"] for r in risks):
            recommendations.append("Consider breaking into smaller incremental changes")

        if predictions.get("imports_to_update", 0) > 5:
            recommendations.append("Automate import updates with codemod")

        if recommendations:
            return recommendations

        return ["Proceed with standard refactoring process"]

    def _generate_simulation_id(self, scenario: str, target: str, action: str) -> str:
        """Generate unique simulation ID."""
        data = f"{scenario}:{target}:{action}"
        return f"sim_{hashlib.md5(data.encode()).hexdigest()[:8]}"

    def _generate_path_id(self, current: str, target: str) -> str:
        """Generate migration path ID."""
        data = f"{current}:{target}"
        return f"path_{hashlib.md5(data.encode()).hexdigest()[:8]}"

    def _generate_migration_steps(
        self, current: str, target: str, constraints: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate migration steps."""
        steps = []

        if current == "monolithic" and target == "microservices":
            steps = [
                {"order": 1, "step": "Identify bounded contexts", "estimated_hours": 8},
                {
                    "order": 2,
                    "step": "Extract service boundaries",
                    "estimated_hours": 16,
                },
                {
                    "order": 3,
                    "step": "Set up service communication",
                    "estimated_hours": 12,
                },
                {"order": 4, "step": "Migrate data stores", "estimated_hours": 16},
                {
                    "order": 5,
                    "step": "Update client integrations",
                    "estimated_hours": 8,
                },
            ]

        elif current == "monolith" and target == "modular":
            steps = [
                {
                    "order": 1,
                    "step": "Identify module boundaries",
                    "estimated_hours": 6,
                },
                {
                    "order": 2,
                    "step": "Extract shared dependencies",
                    "estimated_hours": 8,
                },
                {"order": 3, "step": "Refactor internal APIs", "estimated_hours": 12},
                {
                    "order": 4,
                    "step": "Update imports across modules",
                    "estimated_hours": 4,
                },
            ]
        else:
            steps = [
                {
                    "order": 1,
                    "step": f"Migrate from {current} to {target}",
                    "estimated_hours": 20,
                },
            ]

        max_hours = constraints.get("budget_hours", 100)
        if max_hours < sum(s["estimated_hours"] for s in steps):
            steps = steps[:3]

        return steps

    def _identify_migration_risks(
        self, current: str, target: str, steps: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Identify migration risks."""
        risks = []

        if len(steps) > 5:
            risks.append(
                {
                    "type": "long_migration",
                    "likelihood": "medium",
                    "description": "Long migration window increases risk of schema drift",
                }
            )

        if target == "microservices":
            risks.append(
                {
                    "type": "distributed_systems",
                    "likelihood": "high",
                    "description": "Added complexity of distributed system management",
                }
            )

        return risks

    def _get_migration_dependencies(self, steps: List[Dict[str, Any]]) -> List[str]:
        """Get migration step dependencies."""
        dependencies = []
        for step in steps:
            if step.get("order", 0) > 1:
                dependencies.append(f"step_{step['order'] - 1} -> step_{step['order']}")
        return dependencies


def create_simulation_engine(
    entity_graph: Optional[EntityGraph] = None,
    decision_store: Optional[DecisionStore] = None,
) -> SimulationEngine:
    """Factory function to create simulation engine."""
    return SimulationEngine(entity_graph, decision_store)
