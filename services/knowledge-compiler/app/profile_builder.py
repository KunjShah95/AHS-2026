"""
Profile Builder - analyzes git history to extract developer patterns.
"""

import re
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import Counter
from .dev_profile import DeveloperProfile, ProfileStore


class ProfileBuilder:
    """Build developer profile from git history."""

    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)

    def get_git_log(self, max_commits: int = 200) -> List[Dict[str, Any]]:
        """Get git commit history."""
        try:
            result = subprocess.run(
                [
                    "git",
                    "log",
                    f"-{max_commits}",
                    "--pretty=format:%H|%an|%ae|%s|%b",
                    "--shortstat",
                ],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                return []

            commits = []
            for line in result.stdout.split("\n"):
                if not line.strip():
                    continue
                if "|" in line:
                    parts = line.split("|")
                    if len(parts) >= 4:
                        commits.append(
                            {
                                "hash": parts[0].strip(),
                                "author": parts[1].strip(),
                                "email": parts[2].strip(),
                                "message": parts[3].strip(),
                            }
                        )
            return commits
        except Exception:
            return []

    def get_changed_files(self, commit_hash: str) -> List[str]:
        """Get files changed in a commit."""
        try:
            result = subprocess.run(
                ["git", "show", "--stat", "--name-only", commit_hash],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                return []
            files = []
            for line in result.stdout.split("\n"):
                if "/" in line and not line.strip().startswith("-"):
                    files.append(line.strip())
            return files[:50]
        except Exception:
            return []

    def analyze_commit_style(self, commits: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect commit style (conventional, narrative, minimal)."""
        if not commits:
            return {"style": "conventional", "confidence": 0.0}

        conventional_keywords = [
            "feat",
            "fix",
            "chore",
            "refactor",
            "docs",
            "test",
            "perf",
        ]
        narrative_keywords = [
            "because",
            "therefore",
            "however",
            "meanwhile",
            "actually",
        ]

        conventional_count = 0
        narrative_count = 0
        all_keywords = []

        for commit in commits:
            msg = commit.get("message", "").lower()
            if any(kw in msg for kw in conventional_keywords):
                conventional_count += 1
            if any(kw in msg for kw in narrative_keywords):
                narrative_count += 1

            words = msg.replace("-", " ").replace("_", " ").split()
            all_keywords.extend([w for w in words if len(w) > 2][:5])

        keyword_counts = Counter(all_keywords).most_common(20)

        if conventional_count > len(commits) * 0.3:
            style = "conventional"
            confidence = min(0.9, 0.5 + conventional_count / len(commits))
        elif narrative_count > len(commits) * 0.2:
            style = "narrative"
            confidence = min(0.8, 0.4 + narrative_count / len(commits))
        else:
            style = "minimal"
            confidence = 0.6

        return {
            "style": style,
            "confidence": confidence,
            "keywords": [k for k, _ in keyword_counts[:10]],
        }

    def detect_language(self, files: List[str]) -> str:
        """Detect primary language from file extensions."""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".go": "go",
            ".rs": "rust",
            ".java": "java",
            ".rb": "ruby",
            ".cpp": "cpp",
            ".c": "c",
            ".cs": "csharp",
            ".php": "php",
            ".swift": "swift",
            ".kt": "kotlin",
        }

        extensions = [Path(f).suffix.lower() for f in files if "." in f]
        if not extensions:
            return "unknown"

        counter = Counter(extensions)
        most_common = counter.most_common(1)[0][0]
        return ext_map.get(most_common, "unknown")

    def detect_paradigm_preference(self, files: List[str]) -> str:
        """Infer functional vs OOP preference from file patterns."""
        code_files = [f for f in files if self._is_code_file(f)]

        if not code_files:
            return "mixed"

        has_haskell = any(f.endswith(".hs") for f in code_files)
        has_lisp = any(f.endswith((".lisp", ".clj", ".scm")) for f in code_files)
        if has_haskell or has_lisp:
            return "functional"

        has_oo_langs = any(
            f.endswith((".java", ".cs", ".cpp", ".rb")) for f in code_files
        )
        functional_exts = [".py", ".js", ".ts", ".go", ".rs"]

        oo_count = sum(
            1
            for f in code_files
            if any(f.endswith(ext) for ext in [".java", ".cs", ".rb"])
        )
        func_count = sum(
            1 for f in code_files if any(f.endswith(ext) for ext in functional_exts)
        )

        if oo_count > func_count * 1.5:
            return "oop"
        elif func_count > oo_count * 1.5:
            return "functional"

        return "mixed"

    def _is_code_file(self, file_path: str) -> bool:
        code_exts = [
            ".py",
            ".js",
            ".ts",
            ".jsx",
            ".tsx",
            ".go",
            ".rs",
            ".java",
            ".rb",
            ".cpp",
            ".c",
            ".cs",
            ".php",
            ".swift",
            ".kt",
        ]
        return any(file_path.endswith(ext) for ext in code_exts)

    def extract_naming_patterns(self, file_paths: List[str]) -> List[str]:
        """Extract naming conventions from file names."""
        snake_case = 0
        camel_case = 0
        kebab_case = 0
        pascal_case = 0

        for fp in file_paths:
            name = Path(fp).stem
            if "_" in name and name.islower():
                snake_case += 1
            elif "-" in name:
                kebab_case += 1
            elif name[0].isupper() and any(c.islower() for c in name):
                pascal_case += 1
            elif name[0].islower() and any(c.isupper() for c in name):
                camel_case += 1

        conventions = []
        if snake_case >= len(file_paths) * 0.3:
            conventions.append("snake_case")
        if camel_case >= len(file_paths) * 0.3:
            conventions.append("camelCase")
        if kebab_case >= len(file_paths) * 0.3:
            conventions.append("kebab-case")
        if pascal_case >= len(file_paths) * 0.3:
            conventions.append("PascalCase")

        return conventions if conventions else ["snake_case"]

    def detect_pattern_usage(self, code_samples: List[str]) -> Dict[str, float]:
        """Detect usage frequency of various patterns."""
        pattern_counts = {
            "map": 0,
            "filter": 0,
            "reduce": 0,
            "lambda": 0,
            "class": 0,
            "def": 0,
            "async": 0,
            "await": 0,
            "struct": 0,
            "interface": 0,
            "trait": 0,
            "fn": 0,
        }

        total_samples = len(code_samples)
        if total_samples == 0:
            return pattern_counts

        for code in code_samples:
            code_lower = code.lower()
            for pattern in pattern_counts:
                if pattern in code_lower:
                    pattern_counts[pattern] += 1

        return {
            pattern: count / total_samples
            for pattern, count in pattern_counts.items()
            if count > 0
        }

    def build_profile(self, user_id: str, repo_id: str) -> DeveloperProfile:
        """Build full profile from git history."""
        commits = self.get_git_log(max_commits=200)

        if not commits:
            return DeveloperProfile(
                user_id=user_id,
                repo_id=repo_id,
                profile_confidence=0.0,
            )

        commit_analysis = self.analyze_commit_style(commits)

        all_files = []
        code_samples = []
        for commit in commits[:50]:
            files = self.get_changed_files(commit["hash"])
            all_files.extend(files)

        detected_language = self.detect_language(all_files)
        naming_conventions = self.extract_naming_patterns(all_files[:100])
        paradigm = self.detect_paradigm_preference(all_files)

        confidence = min(0.9, 0.3 + len(commits) / 500)

        return DeveloperProfile(
            user_id=user_id,
            repo_id=repo_id,
            preferred_paradigm=paradigm,
            preferred_language=detected_language,
            naming_conventions=naming_conventions,
            pattern_usage={},
            commit_style=commit_analysis["style"],
            commit_keywords=commit_analysis.get("keywords", []),
            explanation_depth="detailed",
            include_examples=True,
            technical_level="intermediate",
            query_style="exploratory",
            feedback_signals=0,
            commits_analyzed=len(commits),
            profile_confidence=confidence,
        )


def build_profile_for_repo(
    repo_path: str,
    user_id: str,
    repo_id: str,
) -> DeveloperProfile:
    """Convenience function to build a profile."""
    builder = ProfileBuilder(repo_path)
    return builder.build_profile(user_id, repo_id)


def save_profile(profile: DeveloperProfile) -> None:
    """Save a profile to storage."""
    store = ProfileStore()
    store.save(profile)


def load_profile(repo_id: str, user_id: str) -> Optional[DeveloperProfile]:
    """Load a profile from storage."""
    store = ProfileStore()
    return store.load(repo_id, user_id)
