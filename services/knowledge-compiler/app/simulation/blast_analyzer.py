"""
Blast Radius Analyzer - Rule-based impact prediction using entity graph dependencies.

Analyzes the potential impact of proposed code changes by traversing the entity graph
and identifying direct and transitive dependencies that would be affected.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Any
from collections import defaultdict
import re

from app.entities import EntityGraph


@dataclass
class BlastZone:
    """A zone of impact with severity level."""

    zone_name: str
    severity: str  # critical, high, medium, low
    files: List[str] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)
    description: str = ""


@dataclass
class BlastRadiusResult:
    """Result of blast radius analysis."""

    target_file: str
    total_affected_files: int
    total_affected_entities: int
    zones: List[BlastZone]
    direct_dependencies: List[str] = field(default_factory=list)
    transitive_dependencies: List[str] = field(default_factory=list)
    import_updates_required: List[Dict[str, str]] = field(default_factory=list)
    breaking_changes: List[Dict[str, str]] = field(default_factory=list)
    estimated_effort_hours: float = 0.0
    confidence: float = 0.0


class BlastRadiusAnalyzer:
    """
    Analyzes blast radius for code changes using entity graph dependencies.

    Uses dependency analysis to predict:
    - Direct dependencies (files that import the target)
    - Transitive dependencies (files that import files that import the target)
    - Import statements that need updating
    - Potential breaking changes
    """

    def __init__(self, entity_graph: Optional[EntityGraph] = None):
        self.entity_graph = entity_graph
        self._dependency_cache: Dict[str, List[str]] = {}

    def analyze(
        self,
        target_path: str,
        change_type: str = "modify",
        include_transitive: bool = True,
    ) -> BlastRadiusResult:
        """
        Analyze blast radius for changes to a target file.

        Args:
            target_path: Path to the file being changed
            change_type: Type of change (modify, delete, extract, rename)
            include_transitive: Whether to include transitive dependencies

        Returns:
            BlastRadiusResult with impact analysis
        """
        if not self.entity_graph:
            return self._empty_result(target_path)

        direct_deps = self._get_direct_dependencies(target_path)
        transitive_deps = (
            self._get_transitive_dependencies(target_path) if include_transitive else []
        )

        zones = self._calculate_zones(direct_deps, transitive_deps, change_type)
        import_updates = self._find_import_updates(target_path, direct_deps)
        breaking_changes = self._predict_breaking_changes(
            target_path, direct_deps, change_type
        )
        effort = self._estimate_effort(target_path, direct_deps, transitive_deps, zones)
        confidence = self._calculate_confidence(direct_deps, transitive_deps)

        return BlastRadiusResult(
            target_file=target_path,
            total_affected_files=len(set(direct_deps + transitive_deps)),
            total_affected_entities=len(direct_deps) + len(transitive_deps),
            zones=zones,
            direct_dependencies=direct_deps,
            transitive_dependencies=transitive_deps,
            import_updates_required=import_updates,
            breaking_changes=breaking_changes,
            estimated_effort_hours=effort,
            confidence=confidence,
        )

    def analyze_multiple(
        self,
        target_paths: List[str],
        change_type: str = "modify",
    ) -> Dict[str, BlastRadiusResult]:
        """Analyze blast radius for multiple files."""
        results = {}
        for path in target_paths:
            results[path] = self.analyze(path, change_type)
        return results

    def analyze_entity(
        self,
        entity_name: str,
        file_path: str,
        change_type: str = "modify",
    ) -> BlastRadiusResult:
        """Analyze blast radius for a specific entity within a file."""
        target_path = f"{file_path}:{entity_name}"
        return self.analyze(target_path, change_type)

    def _get_direct_dependencies(self, target_path: str) -> List[str]:
        """Get files that directly depend on the target."""
        if target_path in self._dependency_cache:
            return self._dependency_cache[target_path]

        direct_deps = []

        file_name = target_path.split("/")[-1]
        module_name = file_name.replace(".py", "")

        for file_path, entities in self.entity_graph.entities_by_file.items():
            if file_path == target_path:
                continue

            content = ""
            for entity in entities:
                if entity.get("content"):
                    content = entity.get("content")
                    break

            if content and self._imports_module(content, module_name):
                direct_deps.append(file_path)

        self._dependency_cache[target_path] = direct_deps
        return direct_deps

    def _get_transitive_dependencies(self, target_path: str) -> List[str]:
        """Get transitive dependencies (dependencies of dependencies)."""
        direct = self._get_direct_dependencies(target_path)
        transitive = set()

        for dep in direct:
            dep_direct = self._get_direct_dependencies(dep)
            for dd in dep_direct:
                if dd != target_path and dd not in direct:
                    transitive.add(dd)

        return list(transitive)

    def _imports_module(self, content: str, module_name: str) -> bool:
        """Check if content imports a specific module."""
        patterns = [
            f"from\\s+{module_name}\\s+import",
            f"import\\s+{module_name}",
            f"from\\s+\\S*\\.{module_name}\\s+import",
            f"import\\s+\\S*\\.{module_name}",
        ]
        return any(re.search(pattern, content) for pattern in patterns)

    def _calculate_zones(
        self,
        direct_deps: List[str],
        transitive_deps: List[str],
        change_type: str,
    ) -> List[BlastZone]:
        """Calculate impact zones based on dependency depth."""
        zones = []

        severity_multiplier = {
            "delete": 2.0,
            "extract": 1.5,
            "rename": 1.3,
            "modify": 1.0,
        }.get(change_type, 1.0)

        if direct_deps:
            critical_count = max(1, int(len(direct_deps) * 0.3 * severity_multiplier))
            high_count = max(1, int(len(direct_deps) * 0.5 * severity_multiplier))

            zones.append(
                BlastZone(
                    zone_name="zone_1_critical",
                    severity="critical",
                    files=direct_deps[:critical_count],
                    description="Files with direct imports that will break",
                )
            )

            zones.append(
                BlastZone(
                    zone_name="zone_2_high",
                    severity="high",
                    files=direct_deps[critical_count:high_count],
                    description="Files requiring import updates",
                )
            )

        if transitive_deps:
            zones.append(
                BlastZone(
                    zone_name="zone_3_medium",
                    severity="medium",
                    files=transitive_deps[:10],
                    description="Transitively affected files",
                )
            )

        return zones

    def _find_import_updates(
        self, target_path: str, direct_deps: List[str]
    ) -> List[Dict[str, str]]:
        """Find import statements that need updating."""
        updates = []

        target_name = target_path.split("/")[-1].replace(".py", "")
        new_module_path = self._extract_new_module_path(target_path)

        for dep in direct_deps:
            entities = self.entity_graph.entities_by_file.get(dep, [])
            for entity in entities:
                content = entity.get("content", "")

                if self._imports_module(content, target_name):
                    old_import = f"from {target_name} import"
                    new_import = (
                        f"from {new_module_path} import"
                        if new_module_path
                        else old_import
                    )

                    updates.append(
                        {
                            "file": dep,
                            "entity": entity.get("name", ""),
                            "old_import_pattern": old_import,
                            "new_import_pattern": new_import,
                        }
                    )

        return updates

    def _extract_new_module_path(self, target_path: str) -> str:
        """Extract potential new module path (for extract scenarios)."""
        parts = target_path.split("/")
        if len(parts) > 1:
            return "/".join(parts[:-1]) + "/" + parts[-1].replace(".py", "")
        return target_path.replace(".py", "")

    def _predict_breaking_changes(
        self, target_path: str, direct_deps: List[str], change_type: str
    ) -> List[Dict[str, str]]:
        """Predict potential breaking changes."""
        breaking = []

        if change_type == "delete":
            breaking.append(
                {
                    "type": "removed_file",
                    "file": target_path,
                    "impact": "All importing files will fail",
                    "severity": "critical",
                }
            )

        for dep in direct_deps:
            entities = self.entity_graph.entities_by_file.get(dep, [])
            for entity in entities:
                content = entity.get("content", "")

                if self._imports_module(
                    content, target_path.split("/")[-1].replace(".py", "")
                ):
                    if change_type == "extract":
                        breaking.append(
                            {
                                "type": "api_contract_change",
                                "file": dep,
                                "entity": entity.get("name", ""),
                                "impact": f"Import path changed - update to new module path",
                                "severity": "high",
                            }
                        )

        return breaking

    def _estimate_effort(
        self,
        target_path: str,
        direct_deps: List[str],
        transitive_deps: List[str],
        zones: List[BlastZone],
    ) -> float:
        """Estimate effort in hours based on impact."""
        base_hours = 1.0

        file_hours = len(set(direct_deps + transitive_deps)) * 0.5

        zone_hours = 0
        for zone in zones:
            zone_multiplier = {"critical": 4, "high": 2, "medium": 1}.get(
                zone.severity, 1
            )
            zone_hours += len(zone.files) * 0.5 * zone_multiplier

        return round(base_hours + file_hours + zone_hours, 1)

    def _calculate_confidence(
        self, direct_deps: List[str], transitive_deps: List[str]
    ) -> float:
        """Calculate confidence score for the analysis."""
        total_deps = len(direct_deps) + len(transitive_deps)

        if total_deps == 0:
            return 0.9

        if total_deps < 5:
            return 0.85

        if total_deps < 20:
            return 0.75

        return 0.65

    def _empty_result(self, target_path: str) -> BlastRadiusResult:
        """Return empty result when no entity graph is available."""
        return BlastRadiusResult(
            target_file=target_path,
            total_affected_files=0,
            total_affected_entities=0,
            zones=[],
            confidence=0.0,
        )


def analyze_blast_radius(
    entity_graph: EntityGraph,
    target_path: str,
    change_type: str = "modify",
) -> BlastRadiusResult:
    """Convenience function for blast radius analysis."""
    analyzer = BlastRadiusAnalyzer(entity_graph)
    return analyzer.analyze(target_path, change_type)
