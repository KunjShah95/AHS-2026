from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent


class FirstPRAccelerator(BaseAgent):
    """Finds beginner-friendly issues and generates step-by-step guides."""

    async def find_issues(self, repo_url: str, user_level: str = "junior") -> List[Dict[str, Any]]:
        """Find good-first-issues. Stub."""
        return []

    async def generate_guide(self, issue_id: int, repo_structure: Dict) -> Dict[str, Any]:
        """Generate step-by-step guide for issue. Stub."""
        return {
            "issue_id": issue_id,
            "files_to_touch": [],
            "steps": [],
            "similar_prs": []
        }
