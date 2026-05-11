"""
Team Knowledge Mapping - Maps team expertise to code entities.

This module provides:
- Module/file ownership tracking
- Contributor expertise scoring
- Knowledge gap detection
- Reviewer suggestions
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import json
import subprocess
from collections import defaultdict


@dataclass
class Contributor:
    """Represents a contributor to the codebase."""

    id: str
    name: str
    email: str
    first_commit: Optional[datetime] = None
    last_active: Optional[datetime] = None
    total_commits: int = 0
    files_touched: int = 0
    lines_added: int = 0
    lines_removed: int = 0


@dataclass
class Expertise:
    """Represents expertise in a specific code area."""

    contributor_id: str
    target_id: str
    target_type: str
    contribution_score: float
    first_contribution: Optional[datetime] = None
    last_contribution: Optional[datetime] = None
    commit_count: int = 0
    lines_touched: int = 0


@dataclass
class Ownership:
    """Represents ownership of a module or file."""

    target_path: str
    target_type: str
    primary_owner: Optional[str] = None
    co_owners: List[str] = field(default_factory=list)
    expertise_scores: Dict[str, float] = field(default_factory=dict)
    last_analysis: Optional[datetime] = None


@dataclass
class KnowledgeGap:
    """Represents a knowledge gap in the codebase."""

    path: str
    issue_type: str
    description: str
    severity: str
    owner: Optional[str] = None


class TeamKnowledgeMapper:
    """Maps team expertise to code entities."""

    def __init__(self, repo_path: str, storage_path: str = "./.codegenome/team"):
        self.repo_path = Path(repo_path)
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.contributors: Dict[str, Contributor] = {}
        self.expertise: Dict[str, List[Expertise]] = defaultdict(list)
        self.ownership: Dict[str, Ownership] = {}

        self._load()

    def _load(self):
        """Load cached team knowledge data."""
        contributors_file = self.storage_path / "contributors.json"
        expertise_file = self.storage_path / "expertise.json"
        ownership_file = self.storage_path / "ownership.json"

        if contributors_file.exists():
            with open(contributors_file, "r") as f:
                data = json.load(f)
                for cid, cdata in data.items():
                    self.contributors[cid] = Contributor(
                        id=cdata["id"],
                        name=cdata["name"],
                        email=cdata["email"],
                        first_commit=datetime.fromisoformat(cdata["first_commit"])
                        if cdata.get("first_commit")
                        else None,
                        last_active=datetime.fromisoformat(cdata["last_active"])
                        if cdata.get("last_active")
                        else None,
                        total_commits=cdata.get("total_commits", 0),
                        files_touched=cdata.get("files_touched", 0),
                        lines_added=cdata.get("lines_added", 0),
                        lines_removed=cdata.get("lines_removed", 0),
                    )

        if expertise_file.exists():
            with open(expertise_file, "r") as f:
                data = json.load(f)
                for target, experts in data.items():
                    self.expertise[target] = [
                        Expertise(
                            contributor_id=e["contributor_id"],
                            target_id=e["target_id"],
                            target_type=e["target_type"],
                            contribution_score=e["contribution_score"],
                            first_contribution=datetime.fromisoformat(
                                e["first_contribution"]
                            )
                            if e.get("first_contribution")
                            else None,
                            last_contribution=datetime.fromisoformat(
                                e["last_contribution"]
                            )
                            if e.get("last_contribution")
                            else None,
                            commit_count=e.get("commit_count", 0),
                            lines_touched=e.get("lines_touched", 0),
                        )
                        for e in experts
                    ]

        if ownership_file.exists():
            with open(ownership_file, "r") as f:
                data = json.load(f)
                for path, odata in data.items():
                    self.ownership[path] = Ownership(
                        target_path=odata["target_path"],
                        target_type=odata["target_type"],
                        primary_owner=odata.get("primary_owner"),
                        co_owners=odata.get("co_owners", []),
                        expertise_scores=odata.get("expertise_scores", {}),
                        last_analysis=datetime.fromisoformat(odata["last_analysis"])
                        if odata.get("last_analysis")
                        else None,
                    )

    def save(self):
        """Persist team knowledge data."""
        with open(self.storage_path / "contributors.json", "w") as f:
            json.dump(
                {
                    cid: {
                        "id": c.id,
                        "name": c.name,
                        "email": c.email,
                        "first_commit": c.first_commit.isoformat()
                        if c.first_commit
                        else None,
                        "last_active": c.last_active.isoformat()
                        if c.last_active
                        else None,
                        "total_commits": c.total_commits,
                        "files_touched": c.files_touched,
                        "lines_added": c.lines_added,
                        "lines_removed": c.lines_removed,
                    }
                    for cid, c in self.contributors.items()
                },
                f,
                indent=2,
            )

        with open(self.storage_path / "expertise.json", "w") as f:
            json.dump(
                {
                    target: [
                        {
                            "contributor_id": e.contributor_id,
                            "target_id": e.target_id,
                            "target_type": e.target_type,
                            "contribution_score": e.contribution_score,
                            "first_contribution": e.first_contribution.isoformat()
                            if e.first_contribution
                            else None,
                            "last_contribution": e.last_contribution.isoformat()
                            if e.last_contribution
                            else None,
                            "commit_count": e.commit_count,
                            "lines_touched": e.lines_touched,
                        }
                        for e in experts
                    ]
                    for target, experts in self.expertise.items()
                },
                f,
                indent=2,
            )

        with open(self.storage_path / "ownership.json", "w") as f:
            json.dump(
                {
                    path: {
                        "target_path": o.target_path,
                        "target_type": o.target_type,
                        "primary_owner": o.primary_owner,
                        "co_owners": o.co_owners,
                        "expertise_scores": o.expertise_scores,
                        "last_analysis": o.last_analysis.isoformat()
                        if o.last_analysis
                        else None,
                    }
                    for path, o in self.ownership.items()
                },
                f,
                indent=2,
            )

    def get_git_blame(self, file_path: str) -> List[Dict[str, Any]]:
        """Get git blame for a file to track line-level contributions."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "blame",
                    "--line-porcelain",
                    file_path,
                ],
                capture_output=True,
                text=True,
            )

            if result.returncode != 0:
                return []

            blame_info = []
            current_commit = None
            current_author = None
            current_email = None

            for line in result.stdout.split("\n"):
                if line.startswith("author "):
                    current_author = line[7:]
                elif line.startswith("author-mail "):
                    current_email = line[12:].strip("<").strip(">")
                elif line.startswith("committer-time "):
                    timestamp = int(line[16:])
                    current_commit = {
                        "author": current_author,
                        "email": current_email,
                        "date": datetime.fromtimestamp(timestamp),
                    }
                elif line and line[0].isdigit():
                    if current_commit:
                        current_commit["line_number"] = int(line)
                        blame_info.append(current_commit.copy())

            return blame_info
        except Exception as e:
            print(f"Error getting git blame for {file_path}: {e}")
            return []

    def get_git_log_files(self, file_path: str) -> List[Dict[str, Any]]:
        """Get git log for a specific file to track contributions."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "log",
                    "--format=%H|%an|%ae|%ad",
                    "--date=iso",
                    "--follow",
                    file_path,
                ],
                capture_output=True,
                text=True,
            )

            commits = []
            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    parts = line.split("|")
                    if len(parts) >= 4:
                        commits.append(
                            {
                                "hash": parts[0],
                                "author": parts[1],
                                "email": parts[2],
                                "date": datetime.fromisoformat(parts[3].strip()),
                            }
                        )

            return commits
        except Exception as e:
            print(f"Error getting git log for {file_path}: {e}")
            return []

    def analyze_contributions(self) -> Dict[str, Any]:
        """Analyze all contributions in the repository."""
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

            author_stats: Dict[str, Dict[str, Any]] = defaultdict(
                lambda: {
                    "commits": 0,
                    "files": set(),
                    "first_commit": None,
                    "last_active": None,
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

                author_key = email.lower() if email else author
                stats = author_stats[author_key]

                stats["commits"] += 1
                stats["first_commit"] = min(date, stats["first_commit"] or date)
                stats["last_active"] = max(date, stats["last_active"] or date)

            for key, stats in author_stats.items():
                contributor = Contributor(
                    id=key,
                    name=stats.get("name", key),
                    email=key,
                    first_commit=stats["first_commit"],
                    last_active=stats["last_active"],
                    total_commits=stats["commits"],
                )
                self.contributors[key] = contributor

            self._analyze_file_ownership()

            self.save()

            return {
                "total_contributors": len(self.contributors),
                "total_expertise_entries": sum(len(e) for e in self.expertise.values()),
                "total_ownership_entries": len(self.ownership),
            }
        except Exception as e:
            return {"error": str(e), "status": "failed"}

    def _analyze_file_ownership(self):
        """Analyze ownership for files and modules."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "ls-files",
                ],
                capture_output=True,
                text=True,
            )

            files = result.stdout.strip().split("\n")

            file_authors: Dict[str, Dict[str, Any]] = defaultdict(
                lambda: {"commits": 0, "last_date": None}
            )

            for file_path in files:
                if not file_path or not file_path.strip():
                    continue

                commits = self.get_git_log_files(file_path)
                for commit in commits:
                    email = (
                        commit["email"].lower() if commit["email"] else commit["author"]
                    )
                    file_authors[email]["commits"] += 1
                    if (
                        file_authors[email]["last_date"] is None
                        or commit["date"] > file_authors[email]["last_date"]
                    ):
                        file_authors[email]["last_date"] = commit["date"]

                if file_path not in self.expertise:
                    self.expertise[file_path] = []

                for author, stats in file_authors.items():
                    if stats["commits"] > 0:
                        score = self._calculate_expertise_score(
                            stats["commits"], stats["last_date"]
                        )
                        self.expertise[file_path].append(
                            Expertise(
                                contributor_id=author,
                                target_id=file_path,
                                target_type="file",
                                contribution_score=score,
                                last_contribution=stats["last_date"],
                                commit_count=stats["commits"],
                            )
                        )

                file_authors.clear()

            self._build_module_ownership()

        except Exception as e:
            print(f"Error analyzing file ownership: {e}")

    def _build_module_ownership(self):
        """Build ownership at module level by aggregating file-level data."""
        module_owners: Dict[str, Dict[str, float]] = defaultdict(
            lambda: defaultdict(float)
        )

        for file_path, expertise_list in self.expertise.items():
            parts = Path(file_path).parts
            if len(parts) > 1:
                module = parts[0]
            else:
                module = "root"

            for expertise in expertise_list:
                module_owners[module][expertise.contributor_id] += (
                    expertise.contribution_score
                )

        for module, owners in module_owners.items():
            sorted_owners = sorted(owners.items(), key=lambda x: x[1], reverse=True)

            ownership = Ownership(
                target_path=module,
                target_type="module",
                primary_owner=sorted_owners[0][0] if sorted_owners else None,
                co_owners=[o[0] for o in sorted_owners[1:3]]
                if len(sorted_owners) > 1
                else [],
                expertise_scores={k: round(v, 2) for k, v in sorted_owners},
                last_analysis=datetime.now(),
            )
            self.ownership[module] = ownership

    def _calculate_expertise_score(
        self, commit_count: int, last_date: Optional[datetime]
    ) -> float:
        """Calculate expertise score based on commits and recency."""
        base_score = min(commit_count * 5, 50)

        if last_date:
            days_since = (datetime.now() - last_date).days
            recency_multiplier = max(0.5, 1.0 - (days_since / 365))
            score = base_score * recency_multiplier
        else:
            score = base_score

        return min(score, 100)

    def get_file_ownership(self, file_path: str) -> Optional[Ownership]:
        """Get ownership for a specific file."""
        if file_path in self.expertise:
            experts = self.expertise[file_path]
            sorted_experts = sorted(
                experts, key=lambda x: x.contribution_score, reverse=True
            )

            return Ownership(
                target_path=file_path,
                target_type="file",
                primary_owner=sorted_experts[0].contributor_id
                if sorted_experts
                else None,
                co_owners=[e.contributor_id for e in sorted_experts[1:3]]
                if len(sorted_experts) > 1
                else [],
                expertise_scores={
                    e.contributor_id: e.contribution_score for e in sorted_experts[:5]
                },
                last_analysis=datetime.now(),
            )

        return None

    def get_module_ownership(self, module_path: str) -> Optional[Ownership]:
        """Get ownership for a specific module."""
        return self.ownership.get(module_path)

    def get_all_ownership(self) -> Dict[str, Any]:
        """Get all ownership data."""
        return {
            "modules": {
                path: {
                    "primary_owner": o.primary_owner,
                    "co_owners": o.co_owners,
                    "expertise_scores": o.expertise_scores,
                }
                for path, o in self.ownership.items()
            },
            "total_modules": len(self.ownership),
        }

    def suggest_reviewers(
        self, changed_files: List[str], exclude: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Suggest best reviewers based on expertise."""
        if exclude is None:
            exclude = []

        file_scores: Dict[str, float] = defaultdict(float)

        for file_path in changed_files:
            if file_path in self.expertise:
                for expertise in self.expertise[file_path]:
                    if expertise.contributor_id not in exclude:
                        file_scores[expertise.contributor_id] += (
                            expertise.contribution_score
                        )

        suggestions = sorted(file_scores.items(), key=lambda x: x[1], reverse=True)[:10]

        return [
            {
                "contributor_id": contributor_id,
                "score": round(score, 2),
                "reason": f"Expertise score: {round(score, 2)}",
            }
            for contributor_id, score in suggestions
        ]

    def find_experts(self, query: str) -> List[Dict[str, Any]]:
        """Find who knows about a topic by searching module paths."""
        query_lower = query.lower()
        matching_experts: Dict[str, float] = defaultdict(float)

        for target, expertise_list in self.expertise.items():
            if query_lower in target.lower():
                for expertise in expertise_list:
                    matching_experts[expertise.contributor_id] += (
                        expertise.contribution_score
                    )

        results = sorted(matching_experts.items(), key=lambda x: x[1], reverse=True)[
            :10
        ]

        return [
            {
                "contributor_id": contributor_id,
                "score": round(score, 2),
            }
            for contributor_id, score in results
        ]

    def get_contributor_expertise(self, contributor_id: str) -> Dict[str, Any]:
        """Get expertise profile for a contributor."""
        expertise_targets = []

        for target, expertise_list in self.expertise.items():
            for expertise in expertise_list:
                if expertise.contributor_id == contributor_id:
                    expertise_targets.append(
                        {
                            "target_id": expertise.target_id,
                            "target_type": expertise.target_type,
                            "score": round(expertise.contribution_score, 2),
                            "commit_count": expertise.commit_count,
                            "last_contribution": expertise.last_contribution.isoformat()
                            if expertise.last_contribution
                            else None,
                        }
                    )

        expertise_targets.sort(key=lambda x: x["score"], reverse=True)

        contributor = self.contributors.get(contributor_id)

        return {
            "contributor": {
                "id": contributor_id,
                "name": contributor.name if contributor else contributor_id,
                "email": contributor.email if contributor else contributor_id,
                "total_commits": contributor.total_commits if contributor else 0,
                "first_commit": contributor.first_commit.isoformat()
                if contributor and contributor.first_commit
                else None,
                "last_active": contributor.last_active.isoformat()
                if contributor and contributor.last_active
                else None,
            },
            "expertise_areas": expertise_targets[:20],
            "total_targets": len(expertise_targets),
        }

    def get_knowledge_gaps(self) -> List[KnowledgeGap]:
        """Find modules with single owner or no recent activity."""
        gaps = []

        for path, ownership in self.ownership.items():
            if not ownership.primary_owner:
                gaps.append(
                    KnowledgeGap(
                        path=path,
                        issue_type="no_owner",
                        description="No identified owner for this module",
                        severity="high",
                    )
                )
            elif len(ownership.co_owners) == 0:
                contributor = self.contributors.get(ownership.primary_owner)
                last_active = contributor.last_active if contributor else None

                if last_active:
                    months_inactive = (datetime.now() - last_active).days / 30
                    if months_inactive > 6:
                        gaps.append(
                            KnowledgeGap(
                                path=path,
                                issue_type="single_owner_inactive",
                                description=f"Single owner ({ownership.primary_owner}) inactive for {months_inactive:.1f} months",
                                severity="high",
                                owner=ownership.primary_owner,
                            )
                        )
                    else:
                        gaps.append(
                            KnowledgeGap(
                                path=path,
                                issue_type="single_owner",
                                description=f"Single owner without backup - {ownership.primary_owner}",
                                severity="medium",
                                owner=ownership.primary_owner,
                            )
                        )

        for file_path, expertise_list in self.expertise.items():
            if len(expertise_list) == 0:
                continue
            if len(expertise_list) == 1:
                gaps.append(
                    KnowledgeGap(
                        path=file_path,
                        issue_type="single_author_file",
                        description=f"Only one contributor to this file",
                        severity="low",
                        owner=expertise_list[0].contributor_id,
                    )
                )

        return gaps
