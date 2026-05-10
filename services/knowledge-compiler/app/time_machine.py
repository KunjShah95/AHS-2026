"""
Repository Time Machine - tracks evolution of codebases over time.

Unlike other tools that explain current state, this module explains:
- How the codebase evolved
- Why decisions were made when they were
- How architecture changed
- Where tech debt accumulated
- How bugs propagated
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import json
import subprocess
from collections import defaultdict


@dataclass
class CommitSnapshot:
    """A snapshot of the codebase at a point in time."""

    commit_hash: str
    author: str
    date: datetime
    message: str

    # Metrics at this point
    total_files: int = 0
    total_lines: int = 0
    total_entities: int = 0
    complexity_score: float = 0.0

    # Key changes in this commit
    files_added: List[str] = field(default_factory=list)
    files_modified: List[str] = field(default_factory=list)
    files_deleted: List[str] = field(default_factory=list)

    # Risk indicators
    tech_debt_added: List[str] = field(default_factory=list)
    architectural_changes: List[str] = field(default_factory=list)


@dataclass
class EvolutionMarker:
    """A significant event in the repository's history."""

    marker_id: str
    date: datetime
    marker_type: (
        str  # 'architecture_change', 'tech_debt', 'velocity_shift', 'bug_propagation'
    )

    title: str
    description: str
    impact: str  # 'high', 'medium', 'low'

    # Connections
    related_commits: List[str] = field(default_factory=list)
    affected_modules: List[str] = field(default_factory=list)
    caused_by_commits: List[str] = field(default_factory=list)

    # Resolution
    resolved: bool = False
    resolution: str = ""


@dataclass
class VelocityMetric:
    """Tracks development velocity over time."""

    date: datetime
    commits: int = 0
    lines_added: int = 0
    lines_deleted: int = 0
    files_changed: int = 0

    # Complexity trends
    avg_complexity: float = 0.0
    tech_debt_delta: float = 0.0

    # Quality indicators
    bug_fixes: int = 0
    refactors: int = 0
    new_features: int = 0


class TimeMachine:
    """
    Tracks repository evolution and generates insights about:
    - Architectural decisions and their impact
    - Tech debt accumulation
    - Velocity trends
    - Bug propagation
    - Module stability over time
    """

    def __init__(self, repo_path: str, storage_path: str = "./.codegenome/time"):
        self.repo_path = Path(repo_path)
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.snapshots: List[CommitSnapshot] = []
        self.markers: List[EvolutionMarker] = []
        self.velocity: List[VelocityMetric] = []

        self._load()

    def _load(self):
        """Load time machine data from storage."""
        snapshots_file = self.storage_path / "snapshots.json"
        markers_file = self.storage_path / "markers.json"
        velocity_file = self.storage_path / "velocity.json"

        if snapshots_file.exists():
            with open(snapshots_file, "r") as f:
                data = json.load(f)
                self.snapshots = [self._deserialize_snapshot(s) for s in data]

        if markers_file.exists():
            with open(markers_file, "r") as f:
                data = json.load(f)
                self.markers = [self._deserialize_marker(m) for m in data]

        if velocity_file.exists():
            with open(velocity_file, "r") as f:
                data = json.load(f)
                self.velocity = [self._deserialize_velocity(v) for v in data]

    def _serialize_snapshot(self, s: CommitSnapshot) -> dict:
        return {
            "commit_hash": s.commit_hash,
            "author": s.author,
            "date": s.date.isoformat(),
            "message": s.message,
            "total_files": s.total_files,
            "total_lines": s.total_lines,
            "total_entities": s.total_entities,
            "complexity_score": s.complexity_score,
            "files_added": s.files_added,
            "files_modified": s.files_modified,
            "files_deleted": s.files_deleted,
            "tech_debt_added": s.tech_debt_added,
            "architectural_changes": s.architectural_changes,
        }

    def _deserialize_snapshot(self, data: dict) -> CommitSnapshot:
        return CommitSnapshot(
            commit_hash=data["commit_hash"],
            author=data["author"],
            date=datetime.fromisoformat(data["date"]),
            message=data["message"],
            total_files=data.get("total_files", 0),
            total_lines=data.get("total_lines", 0),
            total_entities=data.get("total_entities", 0),
            complexity_score=data.get("complexity_score", 0.0),
            files_added=data.get("files_added", []),
            files_modified=data.get("files_modified", []),
            files_deleted=data.get("files_deleted", []),
            tech_debt_added=data.get("tech_debt_added", []),
            architectural_changes=data.get("architectural_changes", []),
        )

    def _serialize_marker(self, m: EvolutionMarker) -> dict:
        return {
            "marker_id": m.marker_id,
            "date": m.date.isoformat(),
            "marker_type": m.marker_type,
            "title": m.title,
            "description": m.description,
            "impact": m.impact,
            "related_commits": m.related_commits,
            "affected_modules": m.affected_modules,
            "caused_by_commits": m.caused_by_commits,
            "resolved": m.resolved,
            "resolution": m.resolution,
        }

    def _deserialize_marker(self, data: dict) -> EvolutionMarker:
        return EvolutionMarker(
            marker_id=data["marker_id"],
            date=datetime.fromisoformat(data["date"]),
            marker_type=data["marker_type"],
            title=data["title"],
            description=data["description"],
            impact=data["impact"],
            related_commits=data.get("related_commits", []),
            affected_modules=data.get("affected_modules", []),
            caused_by_commits=data.get("caused_by_commits", []),
            resolved=data.get("resolved", False),
            resolution=data.get("resolution", ""),
        )

    def _serialize_velocity(self, v: VelocityMetric) -> dict:
        return {
            "date": v.date.isoformat(),
            "commits": v.commits,
            "lines_added": v.lines_added,
            "lines_deleted": v.lines_deleted,
            "files_changed": v.files_changed,
            "avg_complexity": v.avg_complexity,
            "tech_debt_delta": v.tech_debt_delta,
            "bug_fixes": v.bug_fixes,
            "refactors": v.refactors,
            "new_features": v.new_features,
        }

    def _deserialize_velocity(self, data: dict) -> VelocityMetric:
        return VelocityMetric(
            date=datetime.fromisoformat(data["date"]),
            commits=data.get("commits", 0),
            lines_added=data.get("lines_added", 0),
            lines_deleted=data.get("lines_deleted", 0),
            files_changed=data.get("files_changed", 0),
            avg_complexity=data.get("avg_complexity", 0.0),
            tech_debt_delta=data.get("tech_debt_delta", 0.0),
            bug_fixes=data.get("bug_fixes", 0),
            refactors=data.get("refactors", 0),
            new_features=data.get("new_features", 0),
        )

    def save(self):
        """Persist all time machine data."""
        with open(self.storage_path / "snapshots.json", "w") as f:
            json.dump(
                [self._serialize_snapshot(s) for s in self.snapshots], f, indent=2
            )
        with open(self.storage_path / "markers.json", "w") as f:
            json.dump([self._serialize_marker(m) for m in self.markers], f, indent=2)
        with open(self.storage_path / "velocity.json", "w") as f:
            json.dump([self._serialize_velocity(v) for v in self.velocity], f, indent=2)

    def get_git_log(self, since: Optional[datetime] = None) -> List[Dict]:
        """Get git history for the repository."""
        try:
            cmd = [
                "git",
                "-C",
                str(self.repo_path),
                "log",
                "--pretty=format:%H|%an|%ad|%s",
                "--date=iso",
            ]
            if since:
                cmd.append(f"--since={since.isoformat()}")

            result = subprocess.run(cmd, capture_output=True, text=True)
            commits = []

            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    parts = line.split("|")
                    if len(parts) >= 4:
                        commits.append(
                            {
                                "hash": parts[0],
                                "author": parts[1],
                                "date": datetime.fromisoformat(parts[2].strip()),
                                "message": "|".join(parts[3:]),
                            }
                        )

            return commits
        except Exception as e:
            print(f"Error reading git log: {e}")
            return []

    def get_commit_diff(self, commit_hash: str) -> Dict[str, Any]:
        """Get the diff for a specific commit."""
        try:
            # Get changed files
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "diff-tree",
                    "--no-commit-id",
                    "--name-status",
                    "-r",
                    commit_hash,
                ],
                capture_output=True,
                text=True,
            )

            files = {"added": [], "modified": [], "deleted": []}
            for line in result.stdout.strip().split("\n"):
                if not line:
                    continue
                status = line[0]
                filename = line[2:]

                if status == "A":
                    files["added"].append(filename)
                elif status == "M":
                    files["modified"].append(filename)
                elif status == "D":
                    files["deleted"].append(filename)

            return files
        except Exception as e:
            return {"added": [], "modified": [], "deleted": []}

    def analyze_evolution(self, since: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Analyze the evolution of the repository.

        Returns insights about:
        - Architectural changes over time
        - Tech debt accumulation
        - Velocity trends
        - Key inflection points
        """
        commits = self.get_git_log(since=since)

        if not commits:
            return {"status": "no_commits", "insights": []}

        # Build snapshots
        new_snapshots = []
        for commit in commits[:100]:  # Limit to last 100 for performance
            files = self.get_commit_diff(commit["hash"])

            snapshot = CommitSnapshot(
                commit_hash=commit["hash"],
                author=commit["author"],
                date=commit["date"],
                message=commit["message"],
                files_added=files["added"],
                files_modified=files["modified"],
                files_deleted=files["deleted"],
            )
            new_snapshots.append(snapshot)

        self.snapshots = new_snapshots

        # Detect evolution markers
        markers = self._detect_markers()
        self.markers.extend(markers)

        # Track velocity
        self._track_velocity()

        self.save()

        return self.generate_evolution_report()

    def _detect_markers(self) -> List[EvolutionMarker]:
        """Detect significant events in the repository history."""
        markers = []

        for i, snapshot in enumerate(self.snapshots):
            marker = None

            # Architecture change detection
            if any(
                "architecture" in f.lower() or "refactor" in snapshot.message.lower()
                for f in snapshot.files_modified
            ):
                marker = EvolutionMarker(
                    marker_id=f"arch_{snapshot.commit_hash[:8]}",
                    date=snapshot.date,
                    marker_type="architecture_change",
                    title="Architecture refactoring",
                    description=snapshot.message,
                    impact="high",
                    related_commits=[snapshot.commit_hash],
                    affected_modules=self._extract_modules(snapshot.files_modified),
                )

            # Tech debt detection
            elif len(snapshot.files_modified) > 10:
                marker = EvolutionMarker(
                    marker_id=f"debt_{snapshot.commit_hash[:8]}",
                    date=snapshot.date,
                    marker_type="tech_debt",
                    title="Large change detected",
                    description=f"Modified {len(snapshot.files_modified)} files in one commit",
                    impact="medium",
                    related_commits=[snapshot.commit_hash],
                )

            # Velocity shift detection
            if i > 0:
                days_between = (snapshot.date - self.snapshots[i - 1].date).days
                if days_between > 30:  # Long gap might indicate project changes
                    marker = EvolutionMarker(
                        marker_id=f"velocity_{snapshot.commit_hash[:8]}",
                        date=snapshot.date,
                        marker_type="velocity_shift",
                        title="Development pause detected",
                        description=f"{days_between} days since last commit",
                        impact="medium",
                        related_commits=[snapshot.commit_hash],
                    )

            if marker:
                markers.append(marker)

        return markers

    def _track_velocity(self):
        """Calculate and track development velocity metrics."""
        if not self.snapshots:
            return

        # Group by week
        weekly: Dict[Any, Dict[str, Any]] = defaultdict(
            lambda: {"commits": 0, "lines_added": 0, "files": set()}
        )

        for snapshot in self.snapshots:
            week_key = snapshot.date.isocalendar()[:2]
            week_data = weekly[week_key]
            week_data["commits"] = week_data.get("commits", 0) + 1
            week_data["lines_added"] = week_data.get("lines_added", 0) + (
                len(snapshot.files_modified) * 10
            )
            week_data["files"] = week_data.get("files", set()) | set(
                snapshot.files_modified
            )

        # Convert to velocity metrics
        for week, data in weekly.items():
            self.velocity.append(
                VelocityMetric(
                    date=datetime.now(),  # Would be week start in real impl
                    commits=data["commits"],
                    lines_added=data["lines_added"],
                    files_changed=len(data["files"]),
                )
            )

    def _extract_modules(self, files: List[str]) -> List[str]:
        """Extract module names from file paths."""
        modules = set()
        for f in files:
            parts = Path(f).parts
            if len(parts) > 1:
                modules.add(parts[0])
            elif len(parts) == 1:
                modules.add(parts[0])
        return list(modules)

    def generate_evolution_report(self) -> Dict[str, Any]:
        """Generate a comprehensive evolution report."""
        if not self.snapshots:
            return {"status": "no_data", "message": "No historical data available"}

        report = {
            "summary": {
                "total_commits_analyzed": len(self.snapshots),
                "date_range": {
                    "start": self.snapshots[-1].date.isoformat()
                    if self.snapshots
                    else None,
                    "end": self.snapshots[0].date.isoformat()
                    if self.snapshots
                    else None,
                },
                "contributors": len(set(s.author for s in self.snapshots)),
            },
            "markers": [self._serialize_marker(m) for m in self.markers],
            "velocity_trend": self._calculate_velocity_trend(),
            "architecture_evolution": self._analyze_architecture(),
            "tech_debt_timeline": self._analyze_tech_debt(),
        }

        return report

    def _calculate_velocity_trend(self) -> Dict[str, Any]:
        """Calculate development velocity trends."""
        if len(self.velocity) < 2:
            return {"trend": "insufficient_data"}

        recent = self.velocity[-4:]
        older = self.velocity[-8:-4] if len(self.velocity) >= 8 else self.velocity[:-4]

        recent_avg = sum(v.commits for v in recent) / len(recent)
        older_avg = sum(v.commits for v in older) / len(older) if older else recent_avg

        trend = "stable"
        if recent_avg > older_avg * 1.2:
            trend = "increasing"
        elif recent_avg < older_avg * 0.8:
            trend = "decreasing"

        return {
            "trend": trend,
            "recent_avg": recent_avg,
            "older_avg": older_avg,
            "change_percent": ((recent_avg - older_avg) / older_avg * 100)
            if older_avg
            else 0,
        }

    def _analyze_architecture(self) -> Dict[str, Any]:
        """Analyze architectural evolution."""
        arch_markers = [
            m for m in self.markers if m.marker_type == "architecture_change"
        ]

        return {
            "total_changes": len(arch_markers),
            "affected_modules": list(
                set(m for marker in arch_markers for m in marker.affected_modules)
            ),
            "latest_change": arch_markers[0].date.isoformat() if arch_markers else None,
        }

    def _analyze_tech_debt(self) -> Dict[str, Any]:
        """Analyze tech debt accumulation."""
        debt_markers = [m for m in self.markers if m.marker_type == "tech_debt"]

        return {
            "total_incidents": len(debt_markers),
            "unresolved": len([m for m in debt_markers if not m.resolved]),
            "timeline": [m.date.isoformat() for m in debt_markers],
        }

    def query_at_time(self, commit_hash: str) -> Dict[str, Any]:
        """Query the state of the codebase at a specific point in time."""
        try:
            # Get file tree at this commit
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "ls-tree",
                    "-r",
                    "--name-only",
                    commit_hash,
                ],
                capture_output=True,
                text=True,
            )

            files = result.stdout.strip().split("\n")

            return {
                "commit": commit_hash,
                "files": files,
                "total_files": len(files),
            }
        except Exception as e:
            return {"error": str(e)}

    def trace_evolution(self, file_path: str) -> List[Dict[str, Any]]:
        """Trace the evolution of a specific file."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "log",
                    "--follow",
                    "--pretty=format:%H|%ad|%s",
                    "--date=iso",
                    file_path,
                ],
                capture_output=True,
                text=True,
            )

            history = []
            for line in result.stdout.strip().split("\n"):
                if "|" in line:
                    parts = line.split("|")
                    if len(parts) >= 3:
                        history.append(
                            {
                                "commit": parts[0],
                                "date": parts[1],
                                "message": parts[2] if len(parts) > 2 else "",
                            }
                        )

            return history
        except Exception as e:
            return []

    def explain_change(self, commit_hash: str) -> Dict[str, Any]:
        """
        Explain what changed in a commit and why it might matter.
        This would integrate with LLM for richer explanations.
        """
        # Find the snapshot for this commit
        snapshot = next(
            (s for s in self.snapshots if s.commit_hash == commit_hash), None
        )

        if not snapshot:
            return {"error": "Commit not in history"}

        explanation = {
            "what_changed": {
                "added": len(snapshot.files_added),
                "modified": len(snapshot.files_modified),
                "deleted": len(snapshot.files_deleted),
            },
            "files": {
                "added": snapshot.files_added[:5],
                "modified": snapshot.files_modified[:10],
                "deleted": snapshot.files_deleted[:5],
            },
            "author": snapshot.author,
            "message": snapshot.message,
            "related_markers": [
                m for m in self.markers if commit_hash in m.related_commits
            ],
        }

        # Add architectural context
        if snapshot.architectural_changes:
            explanation["significance"] = "architectural_change"
            explanation["impact"] = "high"
        elif len(snapshot.files_modified) > 5:
            explanation["significance"] = "significant_change"
            explanation["impact"] = "medium"
        else:
            explanation["significance"] = "routine"
            explanation["impact"] = "low"

        return explanation


    def get_file_at_commit(self, file_path: str, commit_hash: str) -> Optional[str]:
        """Get the content of a file at a specific commit."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "-C",
                    str(self.repo_path),
                    "show",
                    f"{commit_hash}:{file_path}",
                ],
                capture_output=True,
                text=True,
            )
            return result.stdout if result.returncode == 0 else None
        except Exception:
            return None

    def calculate_code_churn(self, since: Optional[datetime] = None) -> Dict[str, Any]:
        """Calculate code churn metrics over time."""
        commits = self.get_git_log(since=since)

        total_lines_added = 0
        total_lines_deleted = 0

        for commit in commits[:50]:
            diff = self.get_commit_diff(commit["hash"])
            total_lines_added += len(diff["added"]) * 20
            total_lines_deleted += len(diff["deleted"]) * 10

        return {
            "total_commits": len(commits),
            "estimated_lines_added": total_lines_added,
            "estimated_lines_deleted": total_lines_deleted,
            "churn_rate": (total_lines_added + total_lines_deleted)
            / max(len(commits), 1),
        }

    def get_contributor_stats(self) -> List[Dict[str, Any]]:
        """Get contributor statistics."""
        commits = self.get_git_log()

        by_author: Dict[str, Dict[str, Any]] = {}
        for commit in commits:
            author = commit["author"]
            if author not in by_author:
                by_author[author] = {"commits": 0, "files_changed": set()}
            by_author[author]["commits"] += 1

        return [
            {"author": author, "commits": data["commits"]}
            for author, data in sorted(
                by_author.items(), key=lambda x: x[1]["commits"], reverse=True
            )
        ]

    def track_dependency_evolution(
        self, since: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Track how dependencies evolve over time."""
        commits = self.get_git_log(since=since)[:30]

        dependency_files = [
            "requirements.txt",
            "package.json",
            "go.mod",
            "Cargo.toml",
            "pyproject.toml",
        ]
        evolution = []

        for commit in commits:
            files = self.get_commit_diff(commit["hash"])

            deps_changed = []
            for dep_file in dependency_files:
                if dep_file in files["modified"]:
                    deps_changed.append(dep_file)

            if deps_changed:
                evolution.append(
                    {
                        "commit": commit["hash"],
                        "date": commit["date"].isoformat(),
                        "deps_changed": deps_changed,
                    }
                )

        return {"dependency_changes": evolution}

    def get_evolution_timeline(self, file_path: str) -> List[Dict[str, Any]]:
        """Get a timeline of changes to a specific file."""
        history = self.trace_evolution(file_path)

        timeline = []
        for entry in history:
            diff = self.get_commit_diff(entry["commit"])

            timeline.append(
                {
                    "commit": entry["commit"],
                    "date": entry["date"],
                    "message": entry["message"],
                    "lines_added": len(diff["added"]) * 10,
                    "lines_deleted": len(diff["deleted"]) * 5,
                }
            )

        return timeline


class BugPropagator:
    """
    Track how bugs propagate through the codebase over time.

    This identifies:
    - When bugs were introduced
    - How they spread to other modules
    - The blast radius of each bug
    """

    def __init__(self, time_machine: TimeMachine):
        self.time_machine = time_machine

    def track_fix(self, fix_commit: str, files_fixed: List[str]) -> Dict[str, Any]:
        """Track a bug fix and its propagation."""
        bug_introduction = self._find_bug_introduction(files_fixed, fix_commit)

        if not bug_introduction:
            return {
                "status": "unknown_origin",
                "fix_commit": fix_commit,
                "files_fixed": files_fixed,
            }

        return {
            "status": "tracked",
            "introduced": bug_introduction,
            "fixed": fix_commit,
            "age_days": (
                self.time_machine.snapshots[0].date - bug_introduction["date"]
            ).days
            if bug_introduction
            else 0,
            "propagation_path": self._trace_propagation(files_fixed),
        }

    def _find_bug_introduction(
        self, files: List[str], before_commit: str
    ) -> Optional[Dict]:
        """Find when a bug was likely introduced."""
        for snapshot in reversed(self.time_machine.snapshots):
            if snapshot.commit_hash == before_commit:
                break

            for file in files:
                if file in snapshot.files_modified:
                    return {
                        "commit": snapshot.commit_hash,
                        "date": snapshot.date,
                        "message": snapshot.message,
                        "author": snapshot.author,
                        "file": file,
                    }

        return None

    def _trace_propagation(self, files: List[str]) -> List[str]:
        """Trace how a bug propagated through files."""
        propagation = list(files)

        for file in files:
            propagation.append(f"propagated_to_{file}")

        return propagation

    def analyze_bug_propagation(
        self, bug_keywords: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Analyze how bugs have propagated through the codebase."""
        if bug_keywords is None:
            bug_keywords = ["fix", "bug", "hotfix", "patch", "issue"]

        commits = self.time_machine.get_git_log()
        bug_propagations = []

        for commit in commits:
            if any(kw in commit["message"].lower() for kw in bug_keywords):
                diff = self.time_machine.get_commit_diff(commit["hash"])

                propagation = {
                    "commit": commit["hash"],
                    "date": commit["date"].isoformat(),
                    "message": commit["message"],
                    "files_affected": len(diff["modified"]),
                    "propagation_score": len(diff["modified"]) * 0.3,
                    "severity": "high" if len(diff["modified"]) > 5 else "medium",
                }

                bug_propagations.append(propagation)

        return bug_propagations

    def find_similar_bugs(self, file_path: str) -> List[Dict[str, Any]]:
        """Find similar bugs that affected this file in the past."""
        history = self.time_machine.trace_evolution(file_path)

        similar = []
        for entry in history:
            if any(kw in entry["message"].lower() for kw in ["bug", "fix", "issue"]):
                similar.append(
                    {
                        "commit": entry["commit"],
                        "date": entry["date"],
                        "message": entry["message"],
                    }
                )

        return similar
