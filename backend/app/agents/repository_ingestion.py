import os
import git
from typing import List, Dict, Any
from app.core.vertex import get_vertex_client

class RepositoryIngestionAgent:
    """
    Agent 1: Repository Ingestion & Analysis
    Hybrid: Deterministic (Git/OS) + AI (Labeling)
    """
    def __init__(self):
        self.vertex = get_vertex_client()

    def clone_repository(self, repo_url: str, target_dir: str) -> str:
        """Clones a repository to a target directory."""
        if os.path.exists(target_dir):
            return target_dir
        git.Repo.clone_from(repo_url, target_dir)
        return target_dir

    def parse_file_tree(self, root_path: str) -> List[Dict]:
        """
        Deterministic file walking.
        """
        file_tree = []
        for root, dirs, files in os.walk(root_path):
            if ".git" in root:
                continue
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_path)
                _, ext = os.path.splitext(file)
                lang = self._detect_language(ext)
                
                # Check for entry points deterministically first
                is_entry_point = self._is_potential_entry_point(file, rel_path) 

                file_tree.append({
                    "path": rel_path,
                    "full_path": file_path,
                    "language": lang,
                    "type": "file",
                    "is_entry_point": is_entry_point
                })
        return file_tree
    
    # ... inside class ...

    def _is_potential_entry_point(self, filename: str, rel_path: str) -> bool:
        # Core heuristic: Root level files or standard names
        if os.path.dirname(rel_path) == "": # Root directory
             return filename.lower() in ["main.py", "index.js", "app.py", "server.ts", "manage.py", "wsgi.py"]
        return False
    def analyze_modules(self, file_tree: List[Dict]) -> List[Dict]:
        """
        Uses Vertex AI to label modules if needed (Module Purpose).
        To save tokens, we only analyze top-level or structural files.
        """
        # Mock/Basic implementation: select a few important files and ask AI to summarize purpose.
        # In a real system, we'd batch these.
        for file in file_tree[:3]: # Limit to first 3 to avoid spamming API in demo
            if file['language'] in ['python', 'typescript', 'javascript']:
                purpose = self._ask_ai_for_purpose(file['full_path'])
                file['ai_summary'] = purpose
        return file_tree

    def _ask_ai_for_purpose(self, file_path: str) -> str:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read(2000) # Read first 2k chars
            
            prompt = f"""
            Analyze the following code file and describe its primary responsibility in one sentence.
            File: {os.path.basename(file_path)}
            Code:
            {content}
            """
            return self.vertex.generate_text(prompt)
        except Exception:
            return "Could not analyze."

    def _detect_language(self, ext: str) -> str:
        mapping = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".java": "java",
            ".json": "json",
            ".md": "markdown"
        }
        return mapping.get(ext, "unknown")
