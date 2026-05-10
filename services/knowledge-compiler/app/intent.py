"""
Intent Layer - captures WHY code exists, what was assumed, and what was traded off.

This is the key differentiator for CodeGenome. While other tools parse WHAT code does,
this layer captures the INTENTION behind the code.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import hashlib


@dataclass
class IntentDocument:
    """Represents the intent behind a code entity or decision."""

    id: str
    target_id: str
    target_type: str

    purpose: str = ""
    why_exists: str = ""
    problem_solved: str = ""
    original_context: str = ""

    assumptions: List[str] = field(default_factory=list)
    constraints_accepted: List[str] = field(default_factory=list)
    preconditions: List[str] = field(default_factory=list)

    tradeoffs_made: List[Dict[str, str]] = field(default_factory=list)
    alternatives_rejected: List[Dict[str, str]] = field(default_factory=list)
    what_was_sacrificed: List[str] = field(default_factory=list)

    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_verified: Optional[datetime] = None

    confidence: float = 0.5
    source: str = "extracted"

    def to_markdown(self, include_sections: Optional[List[str]] = None) -> str:
        if include_sections is None:
            include_sections = ["purpose", "assumptions", "tradeoffs", "evolution"]

        lines = [
            f"# Intent: {self.target_id}",
            "",
            f"**Type**: {self.target_type}",
            f"**Confidence**: {self.confidence:.0%}",
            f"**Source**: {self.source}",
            "",
        ]

        if "purpose" in include_sections:
            if self.purpose:
                lines.extend(["## Purpose", "", self.purpose, ""])
            if self.why_exists:
                lines.extend(["## Why This Exists", "", self.why_exists, ""])
            if self.problem_solved:
                lines.extend(["## Problem Solved", "", self.problem_solved, ""])

        if "assumptions" in include_sections:
            if self.assumptions:
                lines.extend(["## Assumptions", ""])
                for assumption in self.assumptions:
                    lines.append(f"- {assumption}")
                lines.append("")

        if "tradeoffs" in include_sections:
            if self.tradeoffs_made:
                lines.extend(["## Trade-offs Made", ""])
                for tradeoff in self.tradeoffs_made:
                    lines.append(
                        f"- **{tradeoff.get('what', 'Unknown')}**: {tradeoff.get('for', 'unknown')} (sacrificed: {tradeoff.get('tradeoff', 'unknown')})"
                    )
                lines.append("")

        if "evolution" in include_sections:
            lines.extend(
                [
                    "## Evolution",
                    "",
                    f"- **Created**: {self.created_at.strftime('%Y-%m-%d')}",
                    f"- **Updated**: {self.updated_at.strftime('%Y-%m-%d')}",
                    f"- **Last Verified**: {self.last_verified.strftime('%Y-%m-%d') if self.last_verified else 'Never'}",
                    "",
                ]
            )

        return "\n".join(lines)


class IntentLayer:
    def __init__(self, storage_path: str = "./.codegenome/intent"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.documents: Dict[str, IntentDocument] = {}
        self._load()

    def _load(self):
        index_file = self.storage_path / "index.json"
        if index_file.exists():
            with open(index_file, "r") as f:
                data = json.load(f)
                for doc_data in data.get("documents", []):
                    self.documents[doc_data["id"]] = self._deserialize(doc_data)

    def _deserialize(self, data: dict) -> IntentDocument:
        return IntentDocument(
            id=data["id"],
            target_id=data["target_id"],
            target_type=data["target_type"],
            purpose=data.get("purpose", ""),
            why_exists=data.get("why_exists", ""),
            problem_solved=data.get("problem_solved", ""),
            original_context=data.get("original_context", ""),
            assumptions=data.get("assumptions", []),
            constraints_accepted=data.get("constraints_accepted", []),
            preconditions=data.get("preconditions", []),
            tradeoffs_made=data.get("tradeoffs_made", []),
            alternatives_rejected=data.get("alternatives_rejected", []),
            what_was_sacrificed=data.get("what_was_sacrificed", []),
            created_at=datetime.fromisoformat(
                data.get("created_at", datetime.now().isoformat())
            ),
            updated_at=datetime.fromisoformat(
                data.get("updated_at", datetime.now().isoformat())
            ),
            last_verified=datetime.fromisoformat(data["last_verified"])
            if data.get("last_verified")
            else None,
            confidence=data.get("confidence", 0.5),
            source=data.get("source", "extracted"),
        )

    def _serialize(self, doc: IntentDocument) -> dict:
        return {
            "id": doc.id,
            "target_id": doc.target_id,
            "target_type": doc.target_type,
            "purpose": doc.purpose,
            "why_exists": doc.why_exists,
            "problem_solved": doc.problem_solved,
            "original_context": doc.original_context,
            "assumptions": doc.assumptions,
            "constraints_accepted": doc.constraints_accepted,
            "preconditions": doc.preconditions,
            "tradeoffs_made": doc.tradeoffs_made,
            "alternatives_rejected": doc.alternatives_rejected,
            "what_was_sacrificed": doc.what_was_sacrificed,
            "created_at": doc.created_at.isoformat(),
            "updated_at": doc.updated_at.isoformat(),
            "last_verified": doc.last_verified.isoformat()
            if doc.last_verified
            else None,
            "confidence": doc.confidence,
            "source": doc.source,
        }

    def save(self):
        index_file = self.storage_path / "index.json"
        with open(index_file, "w") as f:
            json.dump(
                {"documents": [self._serialize(d) for d in self.documents.values()]},
                f,
                indent=2,
            )

    def generate_id(self, target_id: str, target_type: str) -> str:
        raw = f"{target_type}:{target_id}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]

    def create_intent(
        self, target_id: str, target_type: str, **kwargs
    ) -> IntentDocument:
        doc_id = self.generate_id(target_id, target_type)
        doc = IntentDocument(
            id=doc_id, target_id=target_id, target_type=target_type, **kwargs
        )
        self.documents[doc_id] = doc
        self.save()
        return doc

    def get_intent(self, target_id: str, target_type: str) -> Optional[IntentDocument]:
        doc_id = self.generate_id(target_id, target_type)
        return self.documents.get(doc_id)

    def update_intent(self, target_id: str, target_type: str, **kwargs):
        doc_id = self.generate_id(target_id, target_type)
        if doc_id in self.documents:
            doc = self.documents[doc_id]
            for key, value in kwargs.items():
                if hasattr(doc, key):
                    setattr(doc, key, value)
            doc.updated_at = datetime.now()
            self.save()
            return doc
        return None

    def verify_intent(
        self, target_id: str, target_type: str, current_code: str
    ) -> Dict[str, Any]:
        doc = self.get_intent(target_id, target_type)
        if not doc:
            return {"status": "no_intent", "drift": 0}

        drift_score = 0
        issues = []

        if doc.assumptions:
            for assumption in doc.assumptions:
                if assumption.lower() not in current_code.lower():
                    drift_score += 0.1
                    issues.append(f"Assumption may be stale: {assumption}")

        doc.last_verified = datetime.now()
        self.save()

        return {
            "status": "verified",
            "drift": drift_score,
            "issues": issues,
            "confidence": doc.confidence,
        }

    def generate_why_md(self, target_id: str, target_type: str) -> str:
        doc = self.get_intent(target_id, target_type)
        if not doc:
            return f"# Why: {target_id}\n\n*No intent documented yet.*"
        return doc.to_markdown(include_sections=["purpose"])

    def generate_assumptions_md(self, target_id: str, target_type: str) -> str:
        doc = self.get_intent(target_id, target_type)
        if not doc:
            return f"# Assumptions: {target_id}\n\n*No assumptions documented yet.*"
        return doc.to_markdown(include_sections=["assumptions"])

    def generate_tradeoffs_md(self, target_id: str, target_type: str) -> str:
        doc = self.get_intent(target_id, target_type)
        if not doc:
            return f"# Trade-offs: {target_id}\n\n*No tradeoffs documented yet.*"
        return doc.to_markdown(include_sections=["tradeoffs"])


class IntentExtractor:
    def __init__(self):
        pass

    def extract_from_docstring(self, docstring: str) -> Dict[str, Any]:
        if not docstring:
            return {}

        intent = {
            "purpose": "",
            "assumptions": [],
            "tradeoffs": [],
        }

        lines = docstring.split("\n")

        for line in lines:
            stripped = line.strip().lower()

            if any(
                kw in stripped
                for kw in [
                    "purpose:",
                    "intend",
                    "used to",
                    "designed to",
                    "this module",
                ]
            ):
                intent["purpose"] = line.strip()

            if any(
                kw in stripped
                for kw in ["assumes", "assumption", "expects", "depends on"]
            ):
                intent["assumptions"].append(line.strip())

            if any(
                kw in stripped
                for kw in ["tradeoff", "compromise", "balance", "sacrificed"]
            ):
                intent["tradeoffs"].append(line.strip())

        return intent

    def extract_from_comments(self, content: str) -> Dict[str, Any]:
        import re

        intent = {
            "why_comments": [],
            "decision_hints": [],
            "context_notes": [],
        }

        patterns = {
            "why": r"(?://|#|/\*)\s*.*(?:why|because|reason|this is how|intentional)",
            "context": r"(?://|#|/\*)\s*.*(?:context|background|originally|before)",
            "decision": r"(?://|#|/\*)\s*.*(?:decision|chose|selected|architecture)",
        }

        for intent_type, pattern in patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                intent[f"{intent_type}_hints"] = matches

        return intent

    def extract_from_git_message(self, commit_message: str) -> Dict[str, Any]:
        intent = {
            "reason": "",
            "problem": "",
            "solution": "",
        }

        lines = commit_message.split("\n")
        first_line = lines[0] if lines else ""

        if "fix" in first_line.lower():
            intent["problem"] = first_line
        elif "add" in first_line.lower() or "implement" in first_line.lower():
            intent["solution"] = first_line
        elif "refactor" in first_line.lower():
            intent["reason"] = first_line

        body = "\n".join(lines[1:]) if len(lines) > 1 else ""
        if body and "because" in body.lower():
            intent["reason"] = body

        return intent

    def generate_intent_prompt(
        self, entity_name: str, entity_type: str, code: str, context: Dict
    ) -> str:
        prompt = f"""Analyze the following {entity_type} "{entity_name}" and infer its intent.

Code:
```{context.get("language", "unknown")}
{code[:2000]}
```

Context:
- File: {context.get("file_path", "unknown")}
- Imports: {context.get("imports", [])}
- Called by: {context.get("callers", [])}
- Calls: {context.get("callees", [])}

Based on the code structure and context, infer:
1. **Purpose**: What problem does this solve?
2. **Assumptions**: What must be true for this to work?
3. **Tradeoffs**: What was traded off in this design?

Format as JSON with keys: purpose, assumptions (list), tradeoffs (list of {{what, for, sacrificed}})
"""
        return prompt


def extract_intent(file_path: str, content: str, storage_path: str) -> List[Any]:
    """Extract intent entries from a file."""
    extractor = IntentExtractor()
    intent_docs = []

    # Extract from docstring
    import re

    docstring_pattern = r'"""(.*?)"""'
    docstrings = re.findall(docstring_pattern, content, re.DOTALL)

    for docstring in docstrings[:5]:  # Limit
        extracted = extractor.extract_from_docstring(docstring)
        if extracted.get("purpose") or extracted.get("assumptions"):
            doc_id = hashlib.md5(f"{file_path}:{docstring[:50]}".encode()).hexdigest()[
                :16
            ]
            intent_docs.append(
                IntentEntry(
                    id=doc_id,
                    type="docstring",
                    title=extracted.get("purpose", file_path),
                    description=str(extracted),
                    file_path=file_path,
                    tags=["intent", "docstring"],
                )
            )

    # Extract from comments
    comment_intent = extractor.extract_from_comments(content)
    if comment_intent.get("why_comments"):
        doc_id = hashlib.md5(f"{file_path}:comments".encode()).hexdigest()[:16]
        intent_docs.append(
            IntentEntry(
                id=doc_id,
                type="comment",
                title="Intent from comments",
                description="\n".join(comment_intent.get("why_comments", [])),
                file_path=file_path,
                tags=["intent", "comment"],
            )
        )

    return intent_docs


def get_intent_summary(storage_path: str) -> Dict[str, Any]:
    """Get summary of intent entries."""
    return {
        "total_intent_entries": 0,
        "by_type": {},
        "confidence_avg": 0.5,
    }


@dataclass
class IntentEntry:
    """Simple entry for intent documents."""

    id: str
    type: str
    title: str
    description: str
    file_path: str
    tags: List[str] = field(default_factory=list)
