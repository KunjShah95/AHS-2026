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

from mcp.server.fastmcp import FastMCP, Context
from mcp.server.session import ServerSession
from mcp.types import TextResourceContents, Resource

from .entities import EntityGraph
from .intent import IntentLayer, IntentDocument
from .decisions import DecisionStore, Decision
from .time_machine import TimeMachine
from .drift import ArchitectureDriftDetector, TechDebtCalculator
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


# ============== MCP Tools ==============


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


# ============== Helper to mount on FastAPI =============


def get_mcp_app():
    """Get the MCP app for mounting on FastAPI."""
    return mcp.streamable_http_app()


def run_mcp_server():
    """Run MCP server standalone."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    run_mcp_server()
