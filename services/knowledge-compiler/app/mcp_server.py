"""
MCP Server for CodeGenome - AI Agent Integration

Exposes the knowledge graph via Model Context Protocol so AI coding agents
(Claude Code, Cursor, Copilot) can query repository context.

Tools provided:
- query_knowledge: Hybrid search across wiki + code graph
- get_entity_context: 360° view of any symbol
- analyze_impact: What breaks if this change is made
- get_intent: WHY this code exists
- detect_changes: Git diff → affected symbols
- find_related: Semantically related code
- get_architecture: Module boundaries
- time_machine: Evolution timeline
- explain_commit: What changed and why
- trace_evolution: File history
- get_decisions: Decisions affecting a file
- get_risk_assessment: Health + tech debt
"""

import json
from typing import Any, Optional, List, Dict
from pathlib import Path
from collections.abc import AsyncIterator
from collections import defaultdict

from mcp.server.fastmcp import FastMCP, Context
from mcp.server.session import ServerSession
from mcp.types import TextResourceContents, Resource

from .entities import EntityGraph
from .intent import IntentLayer, IntentDocument
from .decisions import DecisionStore, Decision
from .time_machine import TimeMachine
from .drift import ArchitectureDriftDetector, TechDebtCalculator
from .cross_repo_graph import CrossRepoGraphStore
from .pattern_db import PatternDatabase
from . import agents as agent_system


# Initialize FastMCP server
mcp = FastMCP(
    "CodeGenome",
    dependencies=["networkx", "gitpython"],
    stateless_http=True,
)


# In-memory storage for demo (would use database in production)
class KnowledgeStore:
    """Global knowledge store - shared across MCP sessions."""

    def __init__(self):
        self.entity_graphs: Dict[str, EntityGraph] = {}
        self.intent_layers: Dict[str, IntentLayer] = {}
        self.decision_stores: Dict[str, DecisionStore] = {}
        self.time_machines: Dict[str, TimeMachine] = {}
        self.repo_paths: Dict[str, Path] = {}

    def get_repo_id(self, owner: str, name: str) -> str:
        return f"{owner}/{name}"

    def store_repo(
        self,
        owner: str,
        name: str,
        repo_path: Path,
        files: Dict[str, str],
        entities_count: int = 0,
    ):
        repo_id = self.get_repo_id(owner, name)
        self.repo_paths[repo_id] = repo_path

        # Build entity graph
        graph = EntityGraph()
        for file_path, content in files.items():
            for entity in self._extract_entities(file_path, content):
                graph.add_entity(entity)

        self.entity_graphs[repo_id] = graph

        # Initialize intent layer
        intent_path = f"./.codegenome/intent/{owner}_{name}"
        self.intent_layers[repo_id] = IntentLayer(intent_path)

        # Initialize decision store
        decisions_path = f"./.codegenome/decisions/{owner}_{name}"
        self.decision_stores[repo_id] = DecisionStore(decisions_path)

        # Initialize time machine
        self.time_machines[repo_id] = TimeMachine(repo_path)

    def _extract_entities(self, file_path: str, content: str) -> List[Dict]:
        """Extract entities from file content."""
        import re

        entities = []

        # Extract functions
        func_pattern = r"def\s+(\w+)\s*\([^)]*\):"
        for match in re.finditer(func_pattern, content):
            entities.append(
                {
                    "id": f"{file_path}:{match.group(1)}",
                    "type": "function",
                    "name": match.group(1),
                    "file": file_path,
                    "calls": [],
                    "called_by": [],
                }
            )

        # Extract classes
        class_pattern = r"class\s+(\w+)\s*[:(]"
        for match in re.finditer(class_pattern, content):
            entities.append(
                {
                    "id": f"{file_path}:{match.group(1)}",
                    "type": "class",
                    "name": match.group(1),
                    "file": file_path,
                    "calls": [],
                    "called_by": [],
                }
            )

        return entities

    def get_entity_context(self, repo_id: str, entity_id: str) -> Optional[Dict]:
        """Get 360° context for an entity."""
        if repo_id not in self.entity_graphs:
            return None

        graph = self.entity_graphs[repo_id]
        node = graph.get_entity(entity_id)

        if not node:
            return None

        # Get related entities
        related = graph.get_related(entity_id, depth=2)

        # Get intent if available
        intent = None
        if repo_id in self.intent_layers:
            intent_doc = self.intent_layers[repo_id].get_intent(entity_id, "entity")
            if intent_doc:
                intent = {
                    "purpose": intent_doc.purpose,
                    "assumptions": intent_doc.assumptions,
                    "tradeoffs": intent_doc.tradeoffs_made,
                    "confidence": intent_doc.confidence,
                }

        return {
            "entity": node,
            "related": related,
            "intent": intent,
        }


# Global store instance
knowledge_store = KnowledgeStore()

# Cross-repo stores
cross_graph_store = CrossRepoGraphStore()
pattern_database = PatternDatabase()


# ============== Cross-Repo MCP Tools ==============


@mcp.tool()
async def find_cross_repo_pattern(
    ctx: Context,
    pattern_type: Optional[str] = None,
    query: Optional[str] = None,
    max_results: int = 20,
) -> str:
    """
    Find patterns across multiple repositories.

    Searches the pattern database for code patterns that appear
    across different repositories (auth, CRUD, API design, etc.).
    """
    result = await pattern_database.search(
        pattern_type=pattern_type,
        query=query,
        limit=max_results,
    )

    if not result.instances:
        return f"No patterns found for type: {pattern_type or 'all'}"

    # Group by repo
    by_repo: Dict[str, List] = defaultdict(list)
    for inst in result.instances:
        by_repo[inst.repo_id].append(inst)

    parts = [
        f"# Cross-Repo Pattern Search",
        f"",
        f"Found {result.total_count} pattern instances",
        f"Pattern Type: {pattern_type or 'all'}",
        "",
    ]

    for repo_id, instances in by_repo.items():
        parts.append(f"## Repository: {repo_id} ({len(instances)} instances)")
        for inst in instances[:5]:
            parts.append(f"- **{inst.entity_name}** ({inst.file_path})")
            parts.append(f"  Purpose: {inst.purpose}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_cross_repo_entities(
    ctx: Context,
    entity_type: Optional[str] = None,
    pattern: Optional[str] = None,
    repos: Optional[str] = None,
    max_results: int = 50,
) -> str:
    """
    Get entities spanning multiple repositories.

    Queries the cross-repo graph to find entities across all
    analyzed repositories matching the criteria.
    """
    repo_list = repos.split(",") if repos else None

    result = await cross_graph_store.query_cross_repo(
        entity_type=entity_type,
        pattern=pattern,
        repos=repo_list,
        limit=max_results,
    )

    if not result.entities:
        return (
            f"No cross-repo entities found for: pattern={pattern}, type={entity_type}"
        )

    # Group by repo
    by_repo: Dict[str, List] = defaultdict(list)
    for entity in result.entities:
        by_repo[entity.get("repo_id", "unknown")].append(entity)

    parts = [
        f"# Cross-Repo Entities",
        f"",
        f"Found {result.total_count} entities across {len(result.repos_queried)} repos",
        f"Query Time: {result.query_time_ms:.2f}ms",
        "",
    ]

    for repo_id, entities in by_repo.items():
        parts.append(f"## {repo_id} ({len(entities)} entities)")
        for entity in entities[:10]:
            parts.append(
                f"- **{entity.get('name', 'unknown')}** ({entity.get('type', 'type')})"
            )
            parts.append(f"  File: {entity.get('file', 'unknown')}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def find_similar_across_repos(
    ctx: Context,
    entity_id: str,
    max_results: int = 10,
) -> str:
    """
    Find similar entities across repositories.

    Given an entity, finds related or similar entities in
    other repositories based on name, type, and path patterns.
    """
    related = await cross_graph_store.find_related_across_repos(
        entity_id=entity_id,
        max_results=max_results,
    )

    if not related:
        return f"No related entities found for: {entity_id}"

    parts = [
        f"# Related Entities: {entity_id}",
        f"",
        f"Found {len(related)} related entities across repos:",
        "",
    ]

    for rel in related:
        parts.append(f"## {rel.entity_name}")
        parts.append(f"**Repo**: {rel.repo_id}")
        parts.append(f"**Type**: {rel.entity_type}")
        parts.append(f"**File**: {rel.file_path}")
        parts.append(f"**Similarity Reasons**: {', '.join(rel.similar_entities)}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_pattern_statistics(
    ctx: Context,
    pattern_type: str,
) -> str:
    """
    Get statistics for a pattern type across all repos.

    Returns aggregated statistics showing how a pattern
    appears across different repositories.
    """
    stats = await pattern_database.get_pattern_stats(pattern_type)

    if stats is None:
        return f"No patterns found for type: {pattern_type}"

    parts = [
        f"# Pattern Statistics: {pattern_type}",
        "",
        f"**Total Instances**: {stats.total_instances}",
        f"**Repositories**: {stats.repos_count}",
        f"**Average Confidence**: {stats.avg_confidence:.0%}",
        "",
        "## By Repository",
        "",
    ]

    for repo_id, count in sorted(stats.repos.items(), key=lambda x: x[1], reverse=True):
        parts.append(f"- {repo_id}: {count} instances")

    if stats.top_files:
        parts.extend(
            [
                "",
                "## Top Files",
                "",
            ]
        )
        for file_path, count in stats.top_files[:10]:
            parts.append(f"- {file_path}: {count}")

    return "\n".join(parts)


# ============== Original MCP Tools ==============


@mcp.tool()
async def query_knowledge(ctx: Context, question: str, repo_id: str) -> str:
    """
    Query the knowledge base with natural language.

    Returns structured answers with citations to source code.
    """
    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not found. Please analyze the repository first."

    graph = knowledge_store.entity_graphs[repo_id]

    # Simple keyword matching for MVP
    # In production, this would use hybrid search (BM25 + embeddings)
    terms = [t.lower() for t in question.split() if len(t) > 3]

    results = []
    for nid, data in graph.G.nodes(data=True):
        label = data.get("name", "").lower()
        if any(term in label for term in terms):
            results.append(data)

    if not results:
        return f"No results found for: {question}"

    # Format response
    response_parts = [f"Found {len(results)} relevant entities for: {question}\n"]

    for result in results[:10]:  # Limit to 10
        response_parts.append(f"## {result.get('name', 'Unknown')}")
        response_parts.append(f"Type: {result.get('type', 'unknown')}")
        response_parts.append(f"File: {result.get('file', 'unknown')}")
        if result.get("description"):
            response_parts.append(f"Description: {result['description']}")
        response_parts.append("")

    return "\n".join(response_parts)


@mcp.tool()
async def get_entity_context(
    ctx: Context, owner: str, name: str, entity_id: str
) -> str:
    """
    Get 360° view of any code entity with full graph context.

    Returns entity details, related entities, and inferred intent.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)
    context = knowledge_store.get_entity_context(repo_id, entity_id)

    if not context:
        return f"Entity {entity_id} not found in {repo_id}."

    entity = context["entity"]
    related = context.get("related", [])
    intent = context.get("intent")

    parts = [
        f"# {entity.get('name', 'Unknown')}",
        f"**Type**: {entity.get('type', 'unknown')}",
        f"**File**: {entity.get('file', 'unknown')}",
        "",
    ]

    if entity.get("complexity"):
        parts.append(f"**Complexity**: {entity['complexity']}")

    # Related entities
    if related:
        parts.extend(
            [
                "## Related Entities",
                "",
            ]
        )
        for rel in related[:5]:
            parts.append(
                f"- **{rel.get('name', 'Unknown')}** ({rel.get('type', 'type')})"
            )
        parts.append("")

    # Intent
    if intent:
        parts.extend(
            [
                "## Intent",
                "",
                f"**Purpose**: {intent.get('purpose', 'Not documented')}",
                "",
            ]
        )
        if intent.get("assumptions"):
            parts.append("**Assumptions**:")
            for assumption in intent["assumptions"]:
                parts.append(f"  - {assumption}")
            parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def analyze_impact(
    ctx: Context, owner: str, name: str, file_path: str, change_type: str = "modify"
) -> str:
    """
    Analyze what breaks if this change is made.

    Returns blast radius analysis with confidence scores.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not found."

    graph = knowledge_store.entity_graphs[repo_id]

    # Find entities in this file
    affected_entities = []
    for nid, data in graph.G.nodes(data=True):
        if data.get("file") == file_path:
            affected_entities.append(data)

    if not affected_entities:
        return f"No entities found in {file_path}."

    # Find dependents
    dependents = set()
    for entity in affected_entities:
        entity_id = entity.get("id", "")
        # Get entities that call this one
        for nid, data in graph.G.nodes(data=True):
            if entity_id in data.get("called_by", []):
                dependents.add(data)

    # Calculate severity
    severity = "low"
    if change_type == "delete":
        severity = "high" if len(dependents) > 0 else "critical"
    elif change_type == "modify":
        severity = "medium" if len(affected_entities) > 5 else "low"

    parts = [
        f"# Impact Analysis: {file_path}",
        f"**Change Type**: {change_type}",
        f"**Severity**: {severity}",
        "",
        f"## Affected Entities ({len(affected_entities)})",
        "",
    ]

    for entity in affected_entities[:10]:
        parts.append(
            f"- **{entity.get('name', 'Unknown')}** ({entity.get('type', 'type')})"
        )

    if dependents:
        parts.extend(
            [
                "",
                f"## Dependents ({len(dependents)})",
                "",
                "These entities depend on the affected code:",
                "",
            ]
        )
        for dep in list(dependents)[:10]:
            parts.append(
                f"- **{dep.get('name', 'Unknown')}** ({dep.get('type', 'type')})"
            )

    return "\n".join(parts)


@mcp.tool()
async def get_intent(ctx: Context, owner: str, name: str, entity_id: str) -> str:
    """
    Get the WHY behind code - purpose, assumptions, tradeoffs.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.intent_layers:
        return f"Repository {repo_id} not analyzed for intent."

    intent_layer = knowledge_store.intent_layers[repo_id]
    intent_doc = intent_layer.get_intent(entity_id, "entity")

    if not intent_doc:
        return f"No intent documented for {entity_id}."

    return intent_doc.to_markdown()


@mcp.tool()
async def detect_changes(ctx: Context, owner: str, name: str, diff_content: str) -> str:
    """
    Analyze git diff and return affected symbols.

    Input: Unified diff format
    Returns: List of affected entities with blast radius
    """
    import re

    # Parse diff to find changed files
    file_pattern = r"^diff.*a/(.*)b/"
    changed_files = set()

    for match in re.finditer(file_pattern, diff_content, re.MULTILINE):
        changed_files.add(match.group(1))

    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]

    affected_entities = []
    for nid, data in graph.G.nodes(data=True):
        if data.get("file") in changed_files:
            affected_entities.append(data)

    parts = [
        f"# Change Detection Results",
        f"",
        f"**Changed Files**: {len(changed_files)}",
        f"**Affected Entities**: {len(affected_entities)}",
        "",
        f"## Files Changed",
        "",
    ]

    for f in sorted(changed_files):
        parts.append(f"- {f}")

    if affected_entities:
        parts.extend(
            [
                "",
                f"## Entities Affected",
                "",
            ]
        )
        for entity in affected_entities[:20]:
            parts.append(
                f"- **{entity.get('name', 'Unknown')}** ({entity.get('type', 'type')})"
            )

    return "\n".join(parts)


@mcp.tool()
async def find_related(
    ctx: Context, owner: str, name: str, entity_id: str, max_results: int = 10
) -> str:
    """
    Find semantically related code across the codebase.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]
    related = graph.get_related(entity_id, depth=3)

    if not related:
        return f"No related entities found for {entity_id}."

    parts = [
        f"# Related Entities: {entity_id}",
        f"",
        f"Found {len(related)} related entities:",
        "",
    ]

    for rel in related[:max_results]:
        parts.append(f"## {rel.get('name', 'Unknown')}")
        parts.append(f"Type: {rel.get('type', 'unknown')}")
        parts.append(f"File: {rel.get('file', 'unknown')}")
        if rel.get("relationship"):
            parts.append(f"Relationship: {rel['relationship']}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_architecture(ctx: Context, owner: str, name: str) -> str:
    """
    Get module boundaries and architecture graph.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]

    # Group by file/module
    modules: Dict[str, List] = {}
    for nid, data in graph.G.nodes(data=True):
        file_path = data.get("file", "unknown")
        module = str(Path(file_path).parent) if file_path else "root"
        if module not in modules:
            modules[module] = []
        modules[module].append(data)

    parts = [
        f"# Architecture Overview: {repo_id}",
        f"",
        f"**Modules**: {len(modules)}",
        f"**Total Entities**: {graph.G.number_of_nodes()}",
        "",
    ]

    for module, entities in sorted(modules.items()):
        parts.append(f"## {module}")
        entity_types = {}
        for e in entities:
            t = e.get("type", "unknown")
            entity_types[t] = entity_types.get(t, 0) + 1

        type_summary = ", ".join(f"{k}: {v}" for k, v in entity_types.items())
        parts.append(f"Entities ({len(entities)}): {type_summary}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def time_machine(
    ctx: Context, owner: str, name: str, entity_id: Optional[str] = None
) -> str:
    """
    Get evolution timeline for repository or specific entity.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.time_machines:
        return f"Repository {repo_id} not analyzed for evolution."

    tm = knowledge_store.time_machines[repo_id]
    report = tm.analyze_evolution()

    if report.get("status") == "no_data":
        return f"No evolution data available for {repo_id}."

    parts = [
        f"# Evolution Report: {repo_id}",
        "",
    ]

    # Summary
    if "summary" in report:
        summary = report["summary"]
        parts.append(
            f"**Commits Analyzed**: {summary.get('total_commits_analyzed', 0)}"
        )
        parts.append(f"**Contributors**: {summary.get('contributors', 0)}")
        if summary.get("date_range"):
            parts.append(
                f"**Date Range**: {summary['date_range'].get('start', 'N/A')} to {summary['date_range'].get('end', 'N/A')}"
            )
        parts.append("")

    # Markers
    if report.get("markers"):
        parts.extend(
            [
                "## Significant Events",
                "",
            ]
        )
        for marker in report["markers"][:10]:
            parts.append(f"### {marker.get('title', 'Event')}")
            parts.append(f"Type: {marker.get('marker_type', 'unknown')}")
            parts.append(f"Date: {marker.get('date', 'unknown')}")
            parts.append(f"Impact: {marker.get('impact', 'unknown')}")
            parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def explain_commit(ctx: Context, owner: str, name: str, commit_hash: str) -> str:
    """
    Explain what changed in a commit and why it might matter.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.time_machines:
        return f"Repository {repo_id} not analyzed."

    tm = knowledge_store.time_machines[repo_id]
    explanation = tm.explain_change(commit_hash)

    if "error" in explanation:
        return explanation["error"]

    parts = [
        f"# Commit Analysis: {commit_hash[:8]}",
        "",
        f"**Author**: {explanation.get('author', 'unknown')}",
        f"**Message**: {explanation.get('message', 'No message')}",
        f"**Significance**: {explanation.get('significance', 'unknown')}",
        f"**Impact**: {explanation.get('impact', 'unknown')}",
        "",
    ]

    # What changed
    if "what_changed" in explanation:
        wc = explanation["what_changed"]
        parts.extend(
            [
                "## What Changed",
                "",
                f"- Added: {wc.get('added', 0)} files",
                f"- Modified: {wc.get('modified', 0)} files",
                f"- Deleted: {wc.get('deleted', 0)} files",
                "",
            ]
        )

    return "\n".join(parts)


@mcp.tool()
async def get_decisions(
    ctx: Context, owner: str, name: str, file_path: Optional[str] = None
) -> str:
    """
    Get architectural decisions affecting a file or repository.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.decision_stores:
        return f"Repository {repo_id} not analyzed for decisions."

    store = knowledge_store.decision_stores[repo_id]

    if file_path:
        decisions = store.get_for_file(file_path)
    else:
        decisions = list(store.decisions.values())

    if not decisions:
        return f"No decisions found for {file_path or repo_id}."

    parts = [
        f"# Architectural Decisions: {file_path or repo_id}",
        "",
        f"Found {len(decisions)} decisions:",
        "",
    ]

    for decision in decisions[:20]:
        parts.append(f"## {decision.title}")
        parts.append(f"Type: {decision.decision_type.value}")
        parts.append(f"Status: {decision.status.value}")
        if decision.rationale:
            parts.append(f"Rationale: {decision.rationale}")
        if decision.tradeoffs:
            parts.append("Trade-offs:")
            for t in decision.tradeoffs:
                parts.append(f"  - {t}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_risk_assessment(ctx: Context, owner: str, name: str) -> str:
    """
    Get overall health score, tech debt, and risk assessment.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]

    # Run drift detection
    files = {}
    # This is simplified - in production, would load actual file contents
    detector = ArchitectureDriftDetector()
    drift_score = detector.analyze(files)

    # Calculate tech debt
    calculator = TechDebtCalculator()
    debt = calculator.calculate(drift_score, {})

    parts = [
        f"# Risk Assessment: {repo_id}",
        "",
        f"**Overall Health Score**: {drift_score.score}/100 (Grade: {drift_score.grade})",
        "",
        f"## Architecture Drift Signals",
        "",
    ]

    for signal, count in drift_score.signals.items():
        if count > 0:
            parts.append(f"- {signal}: {count}")

    parts.extend(
        [
            "",
            f"## Tech Debt",
            "",
            f"**Principal**: ${debt.get('debt_principal', 0):,.2f}",
            f"**Monthly Interest**: ${debt.get('monthly_interest', 0):,.2f}",
            f"**Risk Level**: {debt.get('risk_level', 'unknown')}",
            "",
        ]
    )

    return "\n".join(parts)


@mcp.tool()
async def trace_evolution(ctx: Context, owner: str, name: str, file_path: str) -> str:
    """
    Trace how a specific file evolved over time.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.time_machines:
        return f"Repository {repo_id} not analyzed."

    tm = knowledge_store.time_machines[repo_id]
    history = tm.trace_evolution(file_path)

    if not history:
        return f"No history found for {file_path}."

    parts = [
        f"# Evolution: {file_path}",
        "",
        f"Found {len(history)} commits:",
        "",
    ]

    for entry in history[:20]:
        parts.append(f"## {entry.get('commit', 'unknown')[:8]}")
        parts.append(f"Date: {entry.get('date', 'unknown')}")
        parts.append(f"Message: {entry.get('message', 'No message')}")
        parts.append("")

    return "\n".join(parts)


# ============== Team Knowledge Mapping MCP Tools ==============


@mcp.tool()
async def get_module_ownership(ctx: Context, owner: str, name: str) -> str:
    """
    Get module ownership map - who owns which modules.

    Returns primary owner and co-owners for each module.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.repo_paths:
        return f"Repository {repo_id} not found."

    from .team_knowledge import TeamKnowledgeMapper

    repo_path = str(knowledge_store.repo_paths[repo_id])
    mapper = TeamKnowledgeMapper(repo_path)
    ownership = mapper.get_all_ownership()

    if not ownership.get("modules"):
        return f"No ownership data available for {repo_id}. Run team analysis first."

    parts = [
        f"# Module Ownership: {repo_id}",
        "",
        f"**Total Modules**: {ownership.get('total_modules', 0)}",
        "",
    ]

    for module, data in ownership["modules"].items():
        parts.append(f"## {module}")
        if data.get("primary_owner"):
            parts.append(f"**Primary Owner**: {data['primary_owner']}")
        if data.get("co_owners"):
            parts.append(f"**Co-Owners**: {', '.join(data['co_owners'])}")
        if data.get("expertise_scores"):
            scores = ", ".join(
                f"{k}: {v}" for k, v in list(data["expertise_scores"].items())[:3]
            )
            parts.append(f"**Expertise**: {scores}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def find_expert(ctx: Context, owner: str, name: str, query: str) -> str:
    """
    Find the right person for a question or topic.

    Input: query (e.g., "auth", "payments", "api")
    Returns: List of experts with scores
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.repo_paths:
        return f"Repository {repo_id} not found."

    from .team_knowledge import TeamKnowledgeMapper

    repo_path = str(knowledge_store.repo_paths[repo_id])
    mapper = TeamKnowledgeMapper(repo_path)
    experts = mapper.find_experts(query)

    if not experts:
        return f"No experts found for: {query}"

    parts = [
        f"# Experts for: {query}",
        "",
        f"Found {len(experts)} experts:",
        "",
    ]

    for expert in experts:
        contributor = mapper.contributors.get(expert["contributor_id"])
        name = contributor.name if contributor else expert["contributor_id"]
        parts.append(f"## {name}")
        parts.append(f"**Score**: {expert['score']}")
        parts.append(f"**Email**: {expert['contributor_id']}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_contributor_profile(
    ctx: Context, owner: str, name: str, author: str
) -> str:
    """
    Get expertise profile for a contributor.

    Returns all areas of expertise with scores and activity.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.repo_paths:
        return f"Repository {repo_id} not found."

    from .team_knowledge import TeamKnowledgeMapper

    repo_path = str(knowledge_store.repo_paths[repo_id])
    mapper = TeamKnowledgeMapper(repo_path)
    profile = mapper.get_contributor_expertise(author.lower())

    if not profile.get("contributor"):
        return f"Contributor {author} not found."

    contributor = profile["contributor"]
    expertise = profile.get("expertise_areas", [])

    parts = [
        f"# Contributor Profile: {contributor.get('name', author)}",
        "",
        f"**Email**: {contributor.get('email', 'N/A')}",
        f"**Total Commits**: {contributor.get('total_commits', 0)}",
        f"**First Commit**: {contributor.get('first_commit', 'N/A')[:10] if contributor.get('first_commit') else 'N/A'}",
        f"**Last Active**: {contributor.get('last_active', 'N/A')[:10] if contributor.get('last_active') else 'N/A'}",
        "",
    ]

    if expertise:
        parts.extend(
            [
                "## Areas of Expertise",
                "",
            ]
        )
        for area in expertise[:15]:
            parts.append(
                f"- **{area['target_id']}** (score: {area['score']}, commits: {area['commit_count']})"
            )
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def suggest_code_reviewers(
    ctx: Context, owner: str, name: str, files: str
) -> str:
    """
    Suggest reviewers for changed files.

    Input: files (comma-separated list of file paths)
    Returns: Best reviewers based on expertise
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.repo_paths:
        return f"Repository {repo_id} not found."

    from .team_knowledge import TeamKnowledgeMapper

    repo_path = str(knowledge_store.repo_paths[repo_id])
    mapper = TeamKnowledgeMapper(repo_path)

    file_list = [f.strip() for f in files.split(",") if f.strip()]
    suggestions = mapper.suggest_reviewers(file_list)

    if not suggestions:
        return f"No reviewers found for: {files}"

    parts = [
        f"# Reviewer Suggestions",
        "",
        f"**Files**: {', '.join(file_list)}",
        "",
        "## Suggested Reviewers",
        "",
    ]

    for suggestion in suggestions:
        contributor = mapper.contributors.get(suggestion["contributor_id"])
        name = contributor.name if contributor else suggestion["contributor_id"]
        parts.append(f"### {name}")
        parts.append(f"**Score**: {suggestion['score']}")
        parts.append(f"**Reason**: {suggestion['reason']}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def detect_knowledge_gaps(ctx: Context, owner: str, name: str) -> str:
    """
    Detect knowledge gaps and single points of failure.

    Returns modules with insufficient ownership coverage.
    """
    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.repo_paths:
        return f"Repository {repo_id} not found."

    from .team_knowledge import TeamKnowledgeMapper

    repo_path = str(knowledge_store.repo_paths[repo_id])
    mapper = TeamKnowledgeMapper(repo_path)
    gaps = mapper.get_knowledge_gaps()

    if not gaps:
        return f"No knowledge gaps detected in {repo_id}."

    parts = [
        f"# Knowledge Gaps: {repo_id}",
        "",
        f"**Total Gaps**: {len(gaps)}",
        "",
    ]

    for gap in gaps:
        parts.append(f"## {gap.path}")
        parts.append(f"**Issue**: {gap.issue_type}")
        parts.append(f"**Description**: {gap.description}")
        parts.append(f"**Severity**: {gap.severity}")
        if gap.owner:
            parts.append(f"**Owner**: {gap.owner}")
        parts.append("")

    return "\n".join(parts)


# ============== Architecture Simulation MCP Tools ==============


@mcp.tool()
async def simulate_what_if(
    ctx: Context,
    owner: str,
    name: str,
    scenario_type: str,
    target: str,
    action: str,
    into: Optional[str] = None,
    include_llm_reasoning: bool = True,
) -> str:
    """
    Run what-if analysis for a proposed architecture change.

    Input:
    - scenario_type: Type of scenario (extract_service, extract_module, merge_modules, etc.)
    - target: File or module being changed
    - action: Action being performed (extract, merge, delete, rename)
    - into: Optional target location (for extract scenarios)
    - include_llm_reasoning: Whether to use LLM for complex reasoning

    Returns predictions, risks, and recommendations.
    """
    from . import simulation_engine as sim_engine

    repo_id = knowledge_store.get_repo_id(owner, name)

    entity_graph = None
    decision_store = None
    if repo_id in knowledge_store.entity_graphs:
        entity_graph = knowledge_store.entity_graphs[repo_id]
    if repo_id in knowledge_store.decision_stores:
        decision_store = knowledge_store.decision_stores[repo_id]

    engine = sim_engine.SimulationEngine(entity_graph, decision_store)

    sim_request = sim_engine.SimulationRequest(
        scenario_type=scenario_type,
        target=target,
        action=action,
        into=into,
    )

    result = engine.simulate(sim_request, include_llm_reasoning=include_llm_reasoning)

    parts = [
        f"# Simulation: {scenario_type}",
        f"**Target**: {target}",
        f"**Action**: {action}",
        f"**Tier Used**: {result.tier_used.value}",
        "",
        f"## Predictions",
        "",
        f"- **Files Affected**: {result.predictions.get('files_affected', 0)}",
        f"- **Imports to Update**: {result.predictions.get('imports_to_update', 0)}",
        f"- **Estimated Effort**: {result.predictions.get('estimated_effort_hours', 0)} hours",
        "",
    ]

    if result.risks:
        parts.extend(["## Risks", ""])
        for risk in result.risks:
            parts.append(
                f"- **{risk['type']}** ({risk['likelihood']}): {risk['description']}"
            )
        parts.append("")

    if result.recommendations:
        parts.extend(["## Recommendations", ""])
        for rec in result.recommendations:
            parts.append(f"- {rec}")
        parts.append("")

    if result.llm_reasoning:
        parts.extend(["## LLM Analysis", "", result.llm_reasoning, ""])

    return "\n".join(parts)


@mcp.tool()
async def get_blast_radius(
    ctx: Context, owner: str, name: str, file_path: str, change_type: str = "modify"
) -> str:
    """
    Get blast radius for a file change.

    Input:
    - file_path: Path to the file being changed
    - change_type: Type of change (modify, delete, extract, rename)

    Returns impact zones and affected files.
    """
    from . import blast_analyzer

    repo_id = knowledge_store.get_repo_id(owner, name)

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]
    analyzer = blast_analyzer.BlastRadiusAnalyzer(graph)
    result = analyzer.analyze(file_path, change_type)

    parts = [
        f"# Blast Radius: {file_path}",
        f"**Change Type**: {change_type}",
        "",
        f"**Files Affected**: {result.total_affected_files}",
        f"**Entities Affected**: {result.total_affected_entities}",
        f"**Estimated Effort**: {result.estimated_effort_hours} hours",
        f"**Confidence**: {result.confidence:.0%}",
        "",
    ]

    for zone in result.zones:
        parts.append(f"## {zone.zone_name} ({zone.severity})")
        if zone.files:
            for f in zone.files[:5]:
                parts.append(f"- {f}")
        if len(zone.files) > 5:
            parts.append(f"... and {len(zone.files) - 5} more")
        parts.append("")

    if result.breaking_changes:
        parts.extend(["## Breaking Changes", ""])
        for bc in result.breaking_changes:
            parts.append(f"- **{bc.get('type', 'unknown')}**: {bc.get('impact', '')}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def plan_migration(
    ctx: Context,
    current_state: str,
    target_state: str,
    max_downtime_hours: Optional[int] = None,
    budget_hours: Optional[int] = None,
) -> str:
    """
    Plan migration path from current state to target state.

    Input:
    - current_state: Current architecture (monolithic, modular, etc.)
    - target_state: Target architecture (microservices, serverless, etc.)
    - max_downtime_hours: Maximum allowed downtime
    - budget_hours: Budget for migration

    Returns migration steps, risks, and dependencies.
    """
    from . import simulation_engine as sim_engine

    constraints = {}
    if max_downtime_hours:
        constraints["max_downtime_hours"] = max_downtime_hours
    if budget_hours:
        constraints["budget_hours"] = budget_hours

    migration_request = sim_engine.MigrationPathRequest(
        current_state=current_state,
        target_state=target_state,
        constraints=constraints,
    )

    engine = sim_engine.SimulationEngine()
    result = engine.plan_migration(migration_request)

    parts = [
        f"# Migration Plan",
        f"**From**: {current_state}",
        f"**To**: {target_state}",
        "",
        f"**Total Estimated Hours**: {result.estimated_total_hours}",
        "",
    ]

    if result.steps:
        parts.extend(["## Steps", ""])
        for step in result.steps:
            parts.append(f"### {step['order']}. {step['step']}")
            hours = step.get("estimated_hours", 0)
            parts.append(f"**Estimated Hours**: {hours}")
            parts.append("")

    if result.risks:
        parts.extend(["## Risks", ""])
        for risk in result.risks:
            parts.append(
                f"- **{risk['type']}** ({risk['likelihood']}): {risk['description']}"
            )
        parts.append("")

    if result.dependencies:
        parts.extend(["## Dependencies", ""])
        for dep in result.dependencies:
            parts.append(f"- {dep}")
        parts.append("")

    return "\n".join(parts)


# ============== MCP Resources ==============


@mcp.resource("codegenome://repos/{owner}/{name}/summary")
def get_repo_summary(owner: str, name: str) -> str:
    """Get repository summary for context injection."""
    repo_id = f"{owner}/{name}"

    if repo_id not in knowledge_store.entity_graphs:
        return f"Repository {repo_id} not analyzed."

    graph = knowledge_store.entity_graphs[repo_id]

    # Count entities by type
    entity_counts = {}
    for nid, data in graph.G.nodes(data=True):
        t = data.get("type", "unknown")
        entity_counts[t] = entity_counts.get(t, 0) + 1

    return f"""
# CodeGenome Summary: {repo_id}

## Overview
- Total Entities: {graph.G.number_of_nodes()}
- Total Relationships: {graph.G.number_of_edges()}

## Entities by Type
{chr(10).join(f"- {k}: {v}" for k, v in entity_counts.items())}

## Quick Access
- Use `/query` to search knowledge
- Use `/entity` to get entity context
- Use `/impact` to analyze changes
"""


@mcp.resource("codegenome://repos/{owner}/{name}/entities")
def get_entities_resource(owner: str, name: str) -> str:
    """List all entities in repository."""
    repo_id = f"{owner}/{name}"

    if repo_id not in knowledge_store.entity_graphs:
        return "[]"

    graph = knowledge_store.entity_graphs[repo_id]
    entities = []

    for nid, data in graph.G.nodes(data=True):
        entities.append(
            {
                "id": nid,
                "name": data.get("name", ""),
                "type": data.get("type", ""),
                "file": data.get("file", ""),
            }
        )

    return json.dumps(entities, indent=2)


# ============== Real-time Collaboration MCP Tools ==============


@mcp.tool()
async def get_page_presence(ctx: Context, page_id: str) -> str:
    """
    Get who is currently viewing/editing a wiki page.

    Returns list of active users with their roles and cursor positions.
    """
    from . import collaborate

    manager = collaborate.get_collaboration_manager()
    await manager.initialize()

    result = await manager.get_collaborators(page_id)

    if result.get("status") == "no_room":
        return f"No active collaboration session for page: {page_id}"

    collaborators = result.get("collaborators", [])
    if not collaborators:
        return f"No users currently viewing page: {page_id}"

    parts = [
        f"# Live Presence: {page_id}",
        "",
        f"**Active Users**: {len(collaborators)}",
        "",
        "## Collaborators",
        "",
    ]

    for user in collaborators:
        parts.append(f"- **{user['user_name']}** ({user['user_id']})")
        parts.append(f"  - Role: {user.get('role', 'unknown')}")
        if user.get("cursor_pos") is not None:
            parts.append(f"  - Cursor: position {user['cursor_pos']}")
        if user.get("selection"):
            sel = user["selection"]
            parts.append(f"  - Selection: {sel.get('start', 0)}-{sel.get('end', 0)}")
        parts.append("")

    return "\n".join(parts)


@mcp.tool()
async def get_live_collaborators(ctx: Context, owner: str, name: str) -> str:
    """
    Get live collaborators across all wiki pages for a repository.

    Returns all users currently active in any wiki page.
    """
    from . import collaborate

    repo_id = f"{owner}/{name}"
    manager = collaborate.get_collaboration_manager()
    await manager.initialize()

    active_pages = await manager.get_all_active_pages()

    total_collaborators: Dict[str, str] = {}
    for page_info in active_pages.get("active_pages", []):
        for user in page_info.get("users", []):
            total_collaborators[user["user_id"]] = user["user_name"]

    if not total_collaborators:
        return f"No live collaborators for repository: {repo_id}"

    parts = [
        f"# Live Collaborators: {repo_id}",
        "",
        f"**Total Active Users**: {len(total_collaborators)}",
        f"**Active Pages**: {len(active_pages.get('active_pages', []))}",
        "",
        "## Active Users",
        "",
    ]

    for user_id, user_name in total_collaborators.items():
        parts.append(f"- **{user_name}** ({user_id})")
        for page_info in active_pages.get("active_pages", []):
            for user in page_info.get("users", []):
                if user["user_id"] == user_id:
                    parts.append(f"  - Viewing: {page_info['page_id']}")
        parts.append("")

    return "\n".join(parts)


# ============== Helper to mount on FastAPI ==============


def get_mcp_app():
    """Get the MCP app for mounting on FastAPI."""
    return mcp.streamable_http_app()


def run_mcp_server():
    """Run MCP server standalone."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    run_mcp_server()
