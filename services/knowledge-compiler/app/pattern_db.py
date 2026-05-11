"""
Pattern Database

Stores and retrieves common code patterns across repositories.
Enables pattern discovery, similarity search, and cross-repo benchmarking.
"""

import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime
from collections import defaultdict
import re


# Pattern types to track
PATTERN_TYPES = {
    "authentication": ["login", "jwt", "oauth", "session", "password", "auth"],
    "data_access": ["crud", "repository", "orm", "database", "query", "model"],
    "api_design": ["endpoint", "route", "controller", "api", "rest", "graphql"],
    "error_handling": ["exception", "error", "try", "catch", "raise"],
    "async_patterns": ["async", "await", "queue", "job", "worker", "task"],
    "config_management": ["config", "env", "settings", "yaml", "json"],
    "testing": ["test", "mock", "fixture", "assert", "pytest", "unittest"],
}


@dataclass
class PatternInstance:
    """A detected pattern instance in code."""

    pattern_type: str
    repo_id: str
    entity_id: str
    entity_name: str
    file_path: str
    code_snippet: str
    code_hash: str
    purpose: str
    confidence: float
    detected_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "pattern_type": self.pattern_type,
            "repo_id": self.repo_id,
            "entity_id": self.entity_id,
            "entity_name": self.entity_name,
            "file_path": self.file_path,
            "code_snippet": self.code_snippet[:500],  # Truncate for storage
            "code_hash": self.code_hash,
            "purpose": self.purpose,
            "confidence": self.confidence,
            "detected_at": self.detected_at.isoformat(),
            "tags": self.tags,
        }

    @staticmethod
    def from_dict(data: dict) -> "PatternInstance":
        return PatternInstance(
            pattern_type=data["pattern_type"],
            repo_id=data["repo_id"],
            entity_id=data["entity_id"],
            entity_name=data["entity_name"],
            file_path=data["file_path"],
            code_snippet=data["code_snippet"],
            code_hash=data["code_hash"],
            purpose=data["purpose"],
            confidence=data["confidence"],
            detected_at=datetime.fromisoformat(data["detected_at"]),
            tags=data.get("tags", []),
        )


@dataclass
class PatternStats:
    """Statistics for a pattern type across repos."""

    pattern_type: str
    total_instances: int
    repos_count: int
    repos: Dict[str, int]
    top_files: List[tuple]
    avg_confidence: float


@dataclass
class PatternSearchResult:
    """Result from pattern search."""

    instances: List[PatternInstance]
    total_count: int
    search_time_ms: float
    pattern_type: Optional[str]


class PatternDatabase:
    """
    Stores and retrieves code patterns across repos.

    Features:
    - Pattern detection and registration
    - Cross-repo similarity search
    - Pattern statistics and analytics
    - Pattern type categorization
    """

    def __init__(self, storage_path: str = "./.codegenome/patterns"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.patterns: Dict[str, List[PatternInstance]] = defaultdict(list)
        self.hash_index: Dict[str, str] = {}  # code_hash -> entity_id

        self._load()

    def _get_storage_file(self) -> Path:
        return self.storage_path / "patterns.json"

    def _load(self):
        """Load patterns from storage."""
        storage_file = self._get_storage_file()
        if storage_file.exists():
            try:
                with open(storage_file, "r") as f:
                    data = json.load(f)

                    for pattern_type, instances in data.get("patterns", {}).items():
                        self.patterns[pattern_type] = [
                            PatternInstance.from_dict(i) for i in instances
                        ]

                    self.hash_index = data.get("hash_index", {})

            except Exception:
                pass

    def _save(self):
        """Save patterns to storage."""
        data = {
            "patterns": {
                pt: [i.to_dict() for i in instances]
                for pt, instances in self.patterns.items()
            },
            "hash_index": self.hash_index,
        }

        with open(self._get_storage_file(), "w") as f:
            json.dump(data, f, indent=2)

    def _compute_hash(self, code: str) -> str:
        """Compute hash for code snippet."""
        return hashlib.sha256(code.encode()).hexdigest()[:16]

    def _detect_pattern_type(
        self,
        entity_name: str,
        file_path: str,
        code: str,
    ) -> Optional[str]:
        """Detect pattern type from entity metadata."""
        search_text = f"{entity_name} {file_path} {code}".lower()

        for pattern_type, keywords in PATTERN_TYPES.items():
            for keyword in keywords:
                if keyword in search_text:
                    return pattern_type

        return None

    async def register_pattern(
        self,
        pattern: PatternInstance,
        auto_detect_type: bool = True,
    ) -> bool:
        """
        Register a detected pattern instance.

        Args:
            pattern: PatternInstance to register
            auto_detect_type: Auto-detect pattern type if not set

        Returns:
            True if registered, False if duplicate
        """
        # Auto-detect type if needed
        if auto_detect_type and not pattern.pattern_type:
            detected = self._detect_pattern_type(
                pattern.entity_name,
                pattern.file_path,
                pattern.code_snippet,
            )
            if detected:
                pattern.pattern_type = detected

        # Check for duplicates
        if pattern.code_hash in self.hash_index:
            return False

        # Register
        self.patterns[pattern.pattern_type].append(pattern)
        self.hash_index[pattern.code_hash] = pattern.entity_id
        self._save()

        return True

    async def register_from_entities(
        self,
        repo_id: str,
        entities: List[dict],
        code_map: Dict[str, str],
    ):
        """
        Register patterns from parsed entities.

        Args:
            repo_id: Repository ID
            entities: List of entity dicts from parser
            code_map: Mapping of entity_id -> code
        """
        for entity in entities:
            entity_id = entity.get("id", "")
            entity_name = entity.get("name", "")
            entity_type = entity.get("type", "")
            file_path = entity.get("file", "")

            code = code_map.get(entity_id, "")
            if not code:
                continue

            # Detect pattern type
            pattern_type = self._detect_pattern_type(entity_name, file_path, code)

            if not pattern_type:
                continue

            # Create pattern instance
            pattern = PatternInstance(
                pattern_type=pattern_type,
                repo_id=repo_id,
                entity_id=entity_id,
                entity_name=entity_name,
                file_path=file_path,
                code_snippet=code[:1000],
                code_hash=self._compute_hash(code),
                purpose=self._infer_purpose(entity_type, entity_name),
                confidence=0.7,
                tags=self._extract_tags(code, pattern_type),
            )

            await self.register_pattern(pattern, auto_detect_type=False)

    def _infer_purpose(self, entity_type: str, entity_name: str) -> str:
        """Infer pattern purpose from entity type/name."""
        name_lower = entity_name.lower()

        if "auth" in name_lower or "login" in name_lower:
            return "Handle user authentication"
        if "jwt" in name_lower:
            return "JWT token management"
        if "crud" in name_lower:
            return "Database CRUD operations"
        if "controller" in name_lower or "endpoint" in name_lower:
            return "API endpoint handler"
        if "test" in name_lower:
            return "Test case or fixture"
        if "config" in name_lower:
            return "Configuration management"

        return f"{entity_type} implementation"

    def _extract_tags(self, code: str, pattern_type: str) -> List[str]:
        """Extract relevant tags from code."""
        tags = []

        common_keywords = {
            "jwt",
            "oauth",
            "bcrypt",
            "session",
            "cookie",
            "sql",
            "orm",
            "query",
            "select",
            "insert",
            "update",
            "delete",
            "async",
            "await",
            "task",
            "queue",
            "try",
            "catch",
            "exception",
            "raise",
            "mock",
            "fixture",
            "assert",
            "env",
            "config",
            "yaml",
        }

        code_lower = code.lower()
        for keyword in common_keywords:
            if keyword in code_lower:
                tags.append(keyword)

        return list(set(tags))[:5]

    async def find_similar(
        self,
        code: str,
        pattern_type: Optional[str] = None,
        max_results: int = 10,
    ) -> List[PatternInstance]:
        """
        Find similar pattern instances.

        Args:
            code: Code snippet to match
            pattern_type: Optional pattern type filter
            max_results: Maximum results to return

        Returns:
            List of similar pattern instances
        """
        code_hash = self._compute_hash(code)

        # Exact match first
        if code_hash in self.hash_index:
            for instances in self.patterns.values():
                for inst in instances:
                    if inst.code_hash == code_hash:
                        return [inst]

        # Find by pattern type
        instances_to_search = []
        if pattern_type:
            instances_to_search = self.patterns.get(pattern_type, [])
        else:
            for inst_list in self.patterns.values():
                instances_to_search.extend(inst_list)

        # Simple similarity based on tags
        code_tags = set(self._extract_tags(code, pattern_type or ""))

        similar = []
        for inst in instances_to_search:
            if inst.code_hash == code_hash:
                continue

            inst_tags = set(inst.tags)
            overlap = len(code_tags & inst_tags)

            if overlap > 0:
                similar.append((inst, overlap))

        # Sort by overlap and return top results
        similar.sort(key=lambda x: x[1], reverse=True)
        return [inst for inst, _ in similar[:max_results]]

    async def get_pattern_stats(
        self,
        pattern_type: str,
    ) -> Optional[PatternStats]:
        """Get statistics for a pattern type across all repos."""
        if pattern_type not in self.patterns:
            return None

        instances = self.patterns[pattern_type]

        if not instances:
            return None

        # Count by repo
        repos_count: Dict[str, int] = defaultdict(int)
        for inst in instances:
            repos_count[inst.repo_id] += 1

        # Top files
        file_counts: Dict[str, int] = defaultdict(int)
        for inst in instances:
            file_counts[inst.file_path] += 1

        top_files = sorted(file_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        # Average confidence
        avg_confidence = sum(i.confidence for i in instances) / len(instances)

        return PatternStats(
            pattern_type=pattern_type,
            total_instances=len(instances),
            repos_count=len(repos_count),
            repos=dict(repos_count),
            top_files=top_files,
            avg_confidence=avg_confidence,
        )

    async def search(
        self,
        pattern_type: Optional[str] = None,
        repo_id: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 50,
    ) -> PatternSearchResult:
        """Search patterns with filters."""
        import time

        start_time = time.time()

        results = []

        # Determine which pattern types to search
        types_to_search = [pattern_type] if pattern_type else list(self.patterns.keys())

        for pt in types_to_search:
            for inst in self.patterns.get(pt, []):
                # Filter by repo
                if repo_id and inst.repo_id != repo_id:
                    continue

                # Filter by query
                if query:
                    query_lower = query.lower()
                    if (
                        query_lower not in inst.entity_name.lower()
                        and query_lower not in inst.purpose.lower()
                        and query_lower not in inst.file_path.lower()
                    ):
                        continue

                results.append(inst)

                if len(results) >= limit:
                    break

            if len(results) >= limit:
                break

        search_time = (time.time() - start_time) * 1000

        return PatternSearchResult(
            instances=results,
            total_count=len(results),
            search_time_ms=search_time,
            pattern_type=pattern_type,
        )

    def get_all_pattern_types(self) -> List[str]:
        """Get list of all pattern types with instances."""
        return [pt for pt, instances in self.patterns.items() if instances]

    def get_repos_with_patterns(self) -> List[str]:
        """Get list of repos that have patterns registered."""
        repos = set()
        for instances in self.patterns.values():
            for inst in instances:
                repos.add(inst.repo_id)
        return list(repos)


# Standalone functions


def create_pattern_database(storage_path: str = "./.codegenome/patterns"):
    """Create a new pattern database."""
    return PatternDatabase(storage_path)


async def register_patterns_from_repo(
    repo_id: str,
    entities: List[dict],
    code_map: Dict[str, str],
    storage_path: str = "./.codegenome/patterns",
):
    """Convenience function to register patterns from a repository."""
    db = PatternDatabase(storage_path)
    await db.register_from_entities(repo_id, entities, code_map)
    return db
