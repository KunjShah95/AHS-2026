import os
import asyncio
import shutil
import hashlib
from pathlib import Path
from typing import Optional
import httpx
import git


class GitHubIngester:
    """Handles repository ingestion from GitHub"""

    def __init__(self, storage_path: str = "./repos"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def _get_repo_id(self, owner: str, name: str) -> str:
        """Generate unique ID for repository"""
        return hashlib.sha256(f"{owner}/{name}".encode()).hexdigest()[:16]

    def _get_repo_path(self, owner: str, name: str) -> Path:
        """Get local storage path for repo"""
        repo_id = self._get_repo_id(owner, name)
        return self.storage_path / repo_id / name

    async def clone(self, repo_url: str, branch: str = "main") -> dict:
        """Clone repository from GitHub"""
        # Parse URL
        if not repo_url.startswith("https://github.com/"):
            raise ValueError("Invalid GitHub URL")

        path_parts = repo_url.replace("https://github.com/", "").split("/")
        if len(path_parts) < 2:
            raise ValueError("Invalid repository URL")

        owner, name = path_parts[0], path_parts[1].replace(".git", "")
        repo_path = self._get_repo_path(owner, name)

        # Check if already cloned
        if repo_path.exists():
            # Pull latest
            try:
                repo = git.Repo(repo_path)
                origin = repo.remotes.origin
                origin.pull()
                return {
                    "path": str(repo_path),
                    "owner": owner,
                    "name": name,
                    "cached": True,
                }
            except Exception as e:
                # Remove and re-clone
                shutil.rmtree(repo_path)

        # Clone fresh
        try:
            repo = git.Repo.clone_from(
                repo_url,
                repo_path,
                branch=branch,
                depth=1,  # Shallow clone for speed
            )
            return {
                "path": str(repo_path),
                "owner": owner,
                "name": name,
                "cached": False,
            }
        except Exception as e:
            raise RuntimeError(f"Failed to clone repository: {e}")

    async def get_file_tree(self, repo_path: str, max_files: int = 1000) -> list:
        """Get file tree structure"""
        path = Path(repo_path)
        files = []

        for root, dirs, filenames in os.walk(path):
            # Skip common non-code directories
            dirs[:] = [
                d
                for d in dirs
                if d
                not in {
                    ".git",
                    "node_modules",
                    "__pycache__",
                    ".venv",
                    "venv",
                    "dist",
                    "build",
                    ".pytest_cache",
                }
            ]

            for filename in filenames:
                file_path = Path(root) / filename
                rel_path = file_path.relative_to(path)

                # Skip binary and large files
                try:
                    size = file_path.stat().st_size
                    if size > 500_000:  # Skip files > 500KB
                        continue
                except:
                    continue

                files.append(
                    {
                        "path": str(rel_path),
                        "size": size if "size" in locals() else 0,
                        "extension": filename.split(".")[-1] if "." in filename else "",
                    }
                )

                if len(files) >= max_files:
                    break

            if len(files) >= max_files:
                break

        return files

    async def get_file_content(self, repo_path: str, file_path: str) -> Optional[str]:
        """Get content of a single file"""
        full_path = Path(repo_path) / file_path

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return None

    async def cleanup(self, owner: str, name: str):
        """Remove local repository files"""
        repo_path = self._get_repo_path(owner, name)
        if repo_path.exists():
            shutil.rmtree(repo_path.parent)


# Standalone functions for the pipeline
async def ingest_github_repo(repo_url: str, branch: str = "main") -> dict:
    """Main entry point for repo ingestion"""
    ingester = GitHubIngester()
    return await ingester.clone(repo_url, branch)


async def get_repo_files(repo_path: str) -> list:
    """Get file tree for repository"""
    ingester = GitHubIngester()
    return await ingester.get_file_tree(repo_path)


async def read_file(repo_path: str, file_path: str) -> Optional[str]:
    """Read specific file content"""
    ingester = GitHubIngester()
    return await ingester.get_file_content(repo_path, file_path)
