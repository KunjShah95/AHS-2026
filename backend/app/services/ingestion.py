import os
import git
from typing import List, Dict
from app.models.graph import CodeNode, NodeType

class IngestionService:
    def __init__(self):
        pass

    def clone_repository(self, repo_url: str, target_dir: str) -> str:
        """Clones a repository to a target directory."""
        if os.path.exists(target_dir):
            # In a real system, we might pull latest or error out
            return target_dir
        
        git.Repo.clone_from(repo_url, target_dir)
        return target_dir

    def parse_file_tree(self, root_path: str) -> List[Dict]:
        """
        Walks the directory and builds a simple file tree structure.
        Returns a list of file metadata.
        """
        file_tree = []
        for root, dirs, files in os.walk(root_path):
            if ".git" in root:
                continue
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_path)
                
                # Simple language detection by extension
                _, ext = os.path.splitext(file)
                lang = self._detect_language(ext)
                
                file_tree.append({
                    "path": rel_path,
                    "full_path": file_path,
                    "language": lang,
                    "type": "file"
                })
        return file_tree

    def _detect_language(self, ext: str) -> str:
        mapping = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".java": "java",
            ".cpp": "cpp",
            ".c": "c",
            ".go": "go",
            ".rs": "rust",
            ".md": "markdown"
        }
        return mapping.get(ext, "unknown")
