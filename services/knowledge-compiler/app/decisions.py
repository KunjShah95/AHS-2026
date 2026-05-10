"""
Decision Tracker - captures architectural decisions and their rationale.

This is the foundation of the "Intent Layer" that makes CodeGenome different from
other code intelligence tools. It tracks WHY decisions were made, not just what exists.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import json
from pathlib import Path


class DecisionType(Enum):
    ARCHITECTURAL = "architectural"
    TECHNICAL = "technical"
    DESIGN = "design"
    SECURITY = "security"
    PERFORMANCE = "performance"
    DEPRECATION = "deprecation"
    REFACTORING = "refactoring"


class DecisionStatus(Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    SUPERSEDED = "superseded"
    REJECTED = "rejected"


@dataclass
class Decision:
    """Represents an architectural or technical decision."""

    id: str
    title: str
    summary: str
    decision_type: DecisionType
    status: DecisionStatus
    created_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None

    # Intent Layer - the WHY
    rationale: str = ""
    problem_statement: str = ""
    alternatives_considered: List[str] = field(default_factory=list)
    tradeoffs: List[str] = field(default_factory=list)
    assumptions: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)

    # Impact tracking
    affected_files: List[str] = field(default_factory=list)
    affected_entities: List[str] = field(default_factory=list)
    risk_level: str = "medium"

    # Consequences
    positive_consequences: List[str] = field(default_factory=list)
    negative_consequences: List[str] = field(default_factory=list)

    # Links to code
    code_references: List[Dict[str, str]] = field(default_factory=list)

    # Review
    review_date: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_notes: str = ""

    def to_markdown(self) -> str:
        """Generate a wiki-style markdown page for this decision."""
        lines = [
            f"# {self.title}",
            "",
            f"**Type**: {self.decision_type.value}",
            f"**Status**: {self.status.value}",
            f"**Created**: {self.created_at.strftime('%Y-%m-%d')}",
            "",
        ]

        if self.decided_at:
            lines.append(
                f"**Decided**: {self.decided_at.strftime('%Y-%m-%d')} by {self.decided_by or 'unknown'}"
            )

        lines.extend(
            [
                "",
                "## Summary",
                "",
                self.summary,
                "",
                "## Problem Statement",
                "",
                self.problem_statement,
                "",
            ]
        )

        if self.rationale:
            lines.extend(
                [
                    "## Rationale",
                    "",
                    self.rationale,
                    "",
                ]
            )

        if self.tradeoffs:
            lines.extend(
                [
                    "## Trade-offs",
                    "",
                ]
            )
            for tradeoff in self.tradeoffs:
                lines.append(f"- {tradeoff}")
            lines.append("")

        if self.alternatives_considered:
            lines.extend(
                [
                    "## Alternatives Considered",
                    "",
                ]
            )
            for alt in self.alternatives_considered:
                lines.append(f"- {alt}")
            lines.append("")

        if self.assumptions:
            lines.extend(
                [
                    "## Assumptions",
                    "",
                ]
            )
            for assumption in self.assumptions:
                lines.append(f"- {assumption}")
            lines.append("")

        if self.affected_files:
            lines.extend(
                [
                    "## Affected Files",
                    "",
                ]
            )
            for file in self.affected_files:
                lines.append(f"- `{file}`")
            lines.append("")

        if self.code_references:
            lines.extend(
                [
                    "## Code References",
                    "",
                ]
            )
            for ref in self.code_references:
                lines.append(
                    f"- [{ref.get('label', ref.get('file', 'ref'))}]({ref.get('file', '')})"
                )
            lines.append("")

        if self.positive_consequences or self.negative_consequences:
            lines.extend(
                [
                    "## Consequences",
                    "",
                    "### Positive",
                    "",
                ]
            )
            for consequence in self.positive_consequences:
                lines.append(f"- {consequence}")
            lines.append("")
            lines.append("### Negative")
            lines.append("")
            for consequence in self.negative_consequences:
                lines.append(f"- {consequence}")
            lines.append("")

        return "\n".join(lines)


class DecisionStore:
    """Persistent store for architectural decisions."""

    def __init__(self, storage_path: str = "./.codegenome/decisions"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.decisions: Dict[str, Decision] = {}
        self._load()

    def _load(self):
        """Load all decisions from storage."""
        decisions_file = self.storage_path / "decisions.json"
        if decisions_file.exists():
            with open(decisions_file, "r") as f:
                data = json.load(f)
                for d in data:
                    self.decisions[d["id"]] = self._deserialize(d)

    def _deserialize(self, data: dict) -> Decision:
        """Deserialize a decision from JSON."""
        return Decision(
            id=data["id"],
            title=data["title"],
            summary=data["summary"],
            decision_type=DecisionType(data["decision_type"]),
            status=DecisionStatus(data["status"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            decided_at=datetime.fromisoformat(data["decided_at"])
            if data.get("decided_at")
            else None,
            decided_by=data.get("decided_by"),
            rationale=data.get("rationale", ""),
            problem_statement=data.get("problem_statement", ""),
            alternatives_considered=data.get("alternatives_considered", []),
            tradeoffs=data.get("tradeoffs", []),
            assumptions=data.get("assumptions", []),
            constraints=data.get("constraints", []),
            affected_files=data.get("affected_files", []),
            affected_entities=data.get("affected_entities", []),
            risk_level=data.get("risk_level", "medium"),
            positive_consequences=data.get("positive_consequences", []),
            negative_consequences=data.get("negative_consequences", []),
            code_references=data.get("code_references", []),
            review_date=datetime.fromisoformat(data["review_date"])
            if data.get("review_date")
            else None,
            reviewed_by=data.get("reviewed_by"),
            review_notes=data.get("review_notes", ""),
        )

    def _serialize(self, decision: Decision) -> dict:
        """Serialize a decision to JSON."""
        return {
            "id": decision.id,
            "title": decision.title,
            "summary": decision.summary,
            "decision_type": decision.decision_type.value,
            "status": decision.status.value,
            "created_at": decision.created_at.isoformat(),
            "decided_at": decision.decided_at.isoformat()
            if decision.decided_at
            else None,
            "decided_by": decision.decided_by,
            "rationale": decision.rationale,
            "problem_statement": decision.problem_statement,
            "alternatives_considered": decision.alternatives_considered,
            "tradeoffs": decision.tradeoffs,
            "assumptions": decision.assumptions,
            "constraints": decision.constraints,
            "affected_files": decision.affected_files,
            "affected_entities": decision.affected_entities,
            "risk_level": decision.risk_level,
            "positive_consequences": decision.positive_consequences,
            "negative_consequences": decision.negative_consequences,
            "code_references": decision.code_references,
            "review_date": decision.review_date.isoformat()
            if decision.review_date
            else None,
            "reviewed_by": decision.reviewed_by,
            "review_notes": decision.review_notes,
        }

    def save(self):
        """Persist all decisions to storage."""
        decisions_file = self.storage_path / "decisions.json"
        with open(decisions_file, "w") as f:
            json.dump(
                [self._serialize(d) for d in self.decisions.values()], f, indent=2
            )

    def add(self, decision: Decision):
        """Add a new decision."""
        self.decisions[decision.id] = decision
        self.save()

    def get(self, decision_id: str) -> Optional[Decision]:
        """Get a decision by ID."""
        return self.decisions.get(decision_id)

    def list_by_type(self, decision_type: DecisionType) -> List[Decision]:
        """List all decisions of a specific type."""
        return [d for d in self.decisions.values() if d.decision_type == decision_type]

    def list_by_status(self, status: DecisionStatus) -> List[Decision]:
        """List all decisions with a specific status."""
        return [d for d in self.decisions.values() if d.status == status]

    def get_for_file(self, file_path: str) -> List[Decision]:
        """Get all decisions that affect a specific file."""
        return [d for d in self.decisions.values() if file_path in d.affected_files]

    def get_for_entity(self, entity_name: str) -> List[Decision]:
        """Get all decisions that affect a specific entity."""
        return [
            d for d in self.decisions.values() if entity_name in d.affected_entities
        ]

    def supersede(self, decision_id: str, new_decision_id: str, reason: str = ""):
        """Mark a decision as superseded by another."""
        if decision_id in self.decisions:
            self.decisions[decision_id].status = DecisionStatus.SUPERSEDED
            self.decisions[
                decision_id
            ].review_notes += f"\n\nSuperseded by {new_decision_id}: {reason}"
            self.save()


class DecisionExtractor:
    """Extract decisions from code comments and git history."""

    def __init__(self, decision_store: DecisionStore):
        self.store = decision_store

    def extract_from_docstring(self, docstring: str) -> Dict[str, Any]:
        """Extract potential decision context from docstrings."""
        hints = {
            "rationale": [],
            "alternatives": [],
            "tradeoffs": [],
            "assumptions": [],
        }

        keywords = {
            "rationale": ["because", "reason", "why", "designed to", "intended to"],
            "alternatives": [
                "instead of",
                "rather than",
                "alternatively",
                "we chose to",
            ],
            "tradeoffs": ["tradeoff", "compromise", "balance", "sacrificed", "cost"],
            "assumptions": ["assumes", "assumed", "expects", "depends on"],
        }

        for hint_type, words in keywords.items():
            for word in words:
                if word.lower() in docstring.lower():
                    hints[hint_type].append(docstring)

        return hints

    def extract_from_comments(self, content: str) -> List[str]:
        """Extract decision-like comments from code."""
        decisions = []

        # Look for TODO comments about decisions
        import re

        decision_patterns = [
            r"(?:TODO|FIXME|NOTE):.*(?:decision|choose|chose|decided|architecture)",
            r"DECISION:.*",
            r"Architecture:.*",
            r"Rationale:.*",
        ]

        for pattern in decision_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            decisions.extend(matches)

        return decisions
