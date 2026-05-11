"""
Developer Profile - stores personalized developer preferences and patterns.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional
import json
import hashlib
from pathlib import Path


@dataclass
class DeveloperProfile:
    """Learned preferences for a developer."""

    user_id: str
    repo_id: str

    preferred_paradigm: str = "mixed"
    preferred_language: str = "python"
    naming_conventions: List[str] = field(default_factory=list)
    pattern_usage: Dict[str, float] = field(default_factory=dict)

    commit_style: str = "conventional"
    commit_keywords: List[str] = field(default_factory=list)

    explanation_depth: str = "detailed"
    include_examples: bool = True
    technical_level: str = "intermediate"

    query_style: str = "exploratory"
    feedback_signals: int = 0

    commits_analyzed: int = 0
    profile_confidence: float = 0.0

    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "repo_id": self.repo_id,
            "preferred_paradigm": self.preferred_paradigm,
            "preferred_language": self.preferred_language,
            "naming_conventions": self.naming_conventions,
            "pattern_usage": self.pattern_usage,
            "commit_style": self.commit_style,
            "commit_keywords": self.commit_keywords,
            "explanation_depth": self.explanation_depth,
            "include_examples": self.include_examples,
            "technical_level": self.technical_level,
            "query_style": self.query_style,
            "feedback_signals": self.feedback_signals,
            "commits_analyzed": self.commits_analyzed,
            "profile_confidence": self.profile_confidence,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "DeveloperProfile":
        return cls(
            user_id=data["user_id"],
            repo_id=data["repo_id"],
            preferred_paradigm=data.get("preferred_paradigm", "mixed"),
            preferred_language=data.get("preferred_language", "python"),
            naming_conventions=data.get("naming_conventions", []),
            pattern_usage=data.get("pattern_usage", {}),
            commit_style=data.get("commit_style", "conventional"),
            commit_keywords=data.get("commit_keywords", []),
            explanation_depth=data.get("explanation_depth", "detailed"),
            include_examples=data.get("include_examples", True),
            technical_level=data.get("technical_level", "intermediate"),
            query_style=data.get("query_style", "exploratory"),
            feedback_signals=data.get("feedback_signals", 0),
            commits_analyzed=data.get("commits_analyzed", 0),
            profile_confidence=data.get("profile_confidence", 0.0),
            created_at=datetime.fromisoformat(
                data.get("created_at", datetime.now().isoformat())
            ),
            updated_at=datetime.fromisoformat(
                data.get("updated_at", datetime.now().isoformat())
            ),
        )


class ProfileStore:
    """Storage for developer profiles."""

    def __init__(self, storage_path: str = "./.codegenome/profiles"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def _get_profile_path(self, repo_id: str, user_id: str) -> Path:
        safe_repo = repo_id.replace("/", "_")
        return self.storage_path / safe_repo / f"{user_id}.json"

    def save(self, profile: DeveloperProfile) -> None:
        file_path = self._get_profile_path(profile.repo_id, profile.user_id)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w") as f:
            json.dump(profile.to_dict(), f, indent=2)

    def load(self, repo_id: str, user_id: str) -> Optional[DeveloperProfile]:
        file_path = self._get_profile_path(repo_id, user_id)
        if not file_path.exists():
            return None
        with open(file_path, "r") as f:
            data = json.load(f)
            return DeveloperProfile.from_dict(data)

    def delete(self, repo_id: str, user_id: str) -> bool:
        file_path = self._get_profile_path(repo_id, user_id)
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def list_profiles(self, repo_id: str) -> List[DeveloperProfile]:
        safe_repo = repo_id.replace("/", "_")
        repo_dir = self.storage_path / safe_repo
        if not repo_dir.exists():
            return []
        profiles = []
        for file_path in repo_dir.glob("*.json"):
            with open(file_path, "r") as f:
                data = json.load(f)
                profiles.append(DeveloperProfile.from_dict(data))
        return profiles
