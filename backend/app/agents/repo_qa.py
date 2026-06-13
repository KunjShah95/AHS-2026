from typing import Dict, Any
from app.agents.base_agent import BaseAgent


class RepoQA(BaseAgent):
    """RAG-based Q&A over codebase."""

    async def index_repo(self, repo_path: str) -> str:
        """Index repo files + docs. Returns index_id. Stub."""
        return f"index_{repo_path.replace('/', '_')}"

    async def ask(self, index_id: str, question: str) -> str:
        """Answer question with code context. Stub."""
        return f"Answer to: {question}"
