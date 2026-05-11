"""
Contributor Tracker - Extract contributor statistics from git history.

Provides detailed contributor profiles including:
- Commit activity over time
- File/module contributions
- Activity patterns
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import json
import subprocess
from collections import defaultdict


@dataclass
class ContributorStats:
    """Detailed contributor statistics."""

    contributor_id: str
    name: str
    email: str
    first_commit: Optional[datetime] = None
    last_active: Optional[datetime] = None
    total_commits: int = 0
    files_authored: int = 0
    modules_touched: List[str] = field(default_factory=list)
    lines_added: int = 0
    lines_removed: int = 0
    activity_by_month: Dict[str, int] = field(default_factory=dict)


class ContributorTracker:
    """Track and analyze contributor statistics."""

    def __init__(
        self, repo_path: str, storage_path: str = "./.codegenome/contributors"
    ):
        self.repo_path = Path(repo_path)
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.contributors: Dict[str, ContributorStats] = {}

        self._load()

    def _load(self):
        """Load cached contributor data."""
        contributors_file = self.storage_path / "stats.json"

        if contributors_file.exists():
            with open(contributors_file, "r") as f:
                data = json.load(f)
                for cid, cdata in data.items():
                    self.contributors[cid] = ContributorStats(
                        contributor_id=cdata["contributor_id"],
                        name=cdata["name"],
                        email=cdata["email"],
                        first_commit=datetime.fromisoformat(cdata["first_commit"])
                        if cdata.get("first_commit")
                        else None,
                        last_active=datetime.fromisoformat(cdata["last_active"])
                        if cdata.get("last_active")
                        else None,
                        total_commits=cdata.get("total_commits", 0),
                        files_authored=cdata.get("files_authored", 0),
                        modules_touched=cdata.get("modules_touched", []),
                        lines_added=cdata.get("lines_added", 0),
                        lines_removed=cdata.get("lines_removed", 0),
                        activity_by_month=cdata.get("activity_by_month", {}),
                    )

    def save(self):
        """Persist contributor data."""
        with open(self.storage_path / "stats.json", "w") as f:
            json.dump(
                {
                    cid: {
                        "contributor_id": c.contributor_id,
                        "name": c.name,
                        "email": c.email,
                        "first_commit": c.first_commit.isoformat()
                        if c.first_commit
                        else None,
                        "last_active": c.last_active.isoformat()
                        if c.last_active
                        else None,
                        "total_commits": c.total_commits,
                        "files_authored": c.files_authored,
                        "modules_touched": c.modules_touched,
                        "lines_added": c.lines_added,
                        "lines_removed": c.lines_removed,
                        "activity_by_month": c.activity_by_month,
                    }
                    for cid, c in self.contributors.items()
                },
                f,
                indent=2,
            )

    def get_all_contributors(self) -> List[Dict[str, Any]]:
        """Get all contributor stats."""
        return [
            {
                "id": c.contributor_id,
                "name": c.name,
                "email": c.email,
                "total_commits": c.total_commits,
                "files_authored": c.files_authored,
                "modules": c.modules_touched,
                "first_commit": c.first_commit.isoformat() if c.first_commit else None,
                "last_active": c.last_active.isoformat() if c.last_active else None,
                "lines_added": c.lines_added,
                "lines_removed": c.lines_removed,
            }
            for c in self.contributors.values()
        ]

    def get_contributor(self, contributor_id: str) -> Optional[Dict[str, Any]]:
        """Get stats for a specific contributor."""
        contributor = self.contributors.get(contributor_id)
        if not contributor:
            return None

        return {
            "id": contributor.contributor_id,
            "name": contributor.name,
            "email": contributor.email,
            "total_commits": contributor.total_commits,
            "files_authored": contributor.files_authored,
            "modules_touched": contributor.modules_touched,
            "first_commit": contributor.first_commit.isoformat()
            if contributor.first_commit
            else None,
            "last_active": contributor.last_active.isoformat()
            if contributor.last_active
            else None,
            "lines_added": contributor.lines_added,
            "lines_removed": contributor.lines_removed,
            "activity_by_month": contributor.activity_by_month,
        }

    def analyze_contributors(self) -> Dict[str, Any]:
        """Analyze all contributors in the repository."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "log",
                    "--format=%H|%an|%ae|%ad",
                    "--date=iso",
                ],
                capture_output=True,
                text=True,
            )

            contributor_data: Dict[str, Dict[str, Any]] = defaultdict(
                lambda: {
                    "name": "",
                    "email": "",
                    "commits": [],
                    "files": set(),
                    "modules": set(),
                    "lines_added": 0,
                    "lines_removed": 0,
                }
            )

            for line in result.stdout.strip().split("\n"):
                if "|" not in line:
                    continue

                parts = line.split("|")
                if len(parts) < 4:
                    continue

                author = parts[1]
                email = parts[2]
                date = datetime.fromisoformat(parts[3].strip())

                key = email.lower() if email else author.lower()
                data = contributor_data[key]

                data["name"] = author
                data["email"] = email
                data["commits"].append(
                    {
                        "date": date,
                        "month": date.strftime("%Y-%m"),
                    }
                )

            for key, data in contributor_data.items():
                commits = data["commits"]
                if not commits:
                    continue

                commit_dates = [c["date"] for c in commits]
                months = [c["month"] for c in commits]

                month_counts: Dict[str, int] = defaultdict(int)
                for month in months:
                    month_counts[month] += 1

                stats = ContributorStats(
                    contributor_id=key,
                    name=data["name"],
                    email=data["email"],
                    first_commit=min(commit_dates),
                    last_active=max(commit_dates),
                    total_commits=len(commits),
                    files_authored=len(data["files"]),
                    modules_touched=sorted(data["modules"]),
                    activity_by_month=dict(month_counts),
                )

                self.contributors[key] = stats

            self.save()

            return {
                "total_contributors": len(self.contributors),
                "status": "completed",
            }
        except Exception as e:
            return {"error": str(e), "status": "failed"}

    def get_top_contributors(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top contributors by commit count."""
        sorted_contributors = sorted(
            self.contributors.values(),
            key=lambda c: c.total_commits,
            reverse=True,
        )

        return [
            {
                "id": c.contributor_id,
                "name": c.name,
                "email": c.email,
                "total_commits": c.total_commits,
                "first_commit": c.first_commit.isoformat() if c.first_commit else None,
                "last_active": c.last_active.isoformat() if c.last_active else None,
            }
            for c in sorted_contributors[:limit]
        ]

    def get_activity_timeline(self, contributor_id: str) -> List[Dict[str, Any]]:
        """Get activity timeline for a contributor."""
        contributor = self.contributors.get(contributor_id)
        if not contributor:
            return []

        timeline = []
        for month, count in sorted(contributor.activity_by_month.items()):
            timeline.append(
                {
                    "month": month,
                    "commits": count,
                }
            )

        return timeline
