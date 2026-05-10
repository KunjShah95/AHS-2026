import ast
import re
from pathlib import Path
from typing import Optional


class CodeParser:
    """Extracts entities from code files using AST analysis"""

    SUPPORTED_EXTENSIONS = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".jsx": "javascript",
        ".tsx": "typescript",
        ".rs": "rust",
        ".go": "go",
        ".java": "java",
        ".rb": "ruby",
        ".ts": "typescript",
    }

    def __init__(self):
        self.entities = []

    def parse_file(self, file_path: str, content: str) -> list:
        """Parse a single file and extract entities"""
        path = Path(file_path)
        ext = path.suffix.lower()
        language = self.SUPPORTED_EXTENSIONS.get(ext, "unknown")

        if language == "python":
            return self._parse_python(content, str(path))
        else:
            # For unsupported languages, do basic extraction
            return self._parse_generic(content, str(path), language)

    def _parse_python(self, content: str, file_path: str) -> list:
        """Extract Python entities using AST"""
        entities = []

        try:
            tree = ast.parse(content)

            for node in ast.walk(tree):
                entity = {
                    "file": file_path,
                    "type": None,
                    "name": None,
                    "line": None,
                    "docstring": None,
                    "children": [],
                    "complexity": 1,
                }

                if isinstance(node, ast.Module):
                    entity["type"] = "module"
                    entity["name"] = file_path.split("/")[-1].replace(".py", "")
                    entity["docstring"] = ast.get_docstring(node)
                    entity["complexity"] = 1

                elif isinstance(node, ast.FunctionDef):
                    entity["type"] = "function"
                    entity["name"] = node.name
                    entity["line"] = node.lineno
                    entity["docstring"] = ast.get_docstring(node)
                    entity["complexity"] = self._calculate_complexity(node)

                    # Extract parameters
                    entity["params"] = [arg.arg for arg in node.args.args]

                elif isinstance(node, ast.ClassDef):
                    entity["type"] = "class"
                    entity["name"] = node.name
                    entity["line"] = node.lineno
                    entity["docstring"] = ast.get_docstring(node)

                    # Get methods
                    methods = [
                        n.name for n in node.body if isinstance(n, ast.FunctionDef)
                    ]
                    entity["children"] = methods

                elif isinstance(node, ast.AsyncFunctionDef):
                    entity["type"] = "async_function"
                    entity["name"] = node.name
                    entity["line"] = node.lineno
                    entity["docstring"] = ast.get_docstring(node)
                    entity["complexity"] = self._calculate_complexity(node)
                    entity["params"] = [arg.arg for arg in node.args.args]

                if entity["type"]:
                    entities.append(entity)

        except SyntaxError:
            pass  # Skip files with syntax errors

        return entities

    def _calculate_complexity(self, node) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1

        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1

        return complexity

    def _parse_generic(self, content: str, file_path: str, language: str) -> list:
        """Basic extraction for unsupported languages"""
        entities = []

        # Module entity
        entities.append(
            {
                "file": file_path,
                "type": "module",
                "name": file_path.split("/")[-1],
                "line": 1,
                "docstring": None,
                "complexity": 1,
            }
        )

        # Try to find functions/classes by pattern matching
        if language in ["javascript", "typescript"]:
            # Find function declarations
            func_pattern = r"(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(?:async\s+)?(?:function\s+)?(\w+)\s*\()"
            for match in re.finditer(func_pattern, content):
                func_name = match.group(1) or match.group(2) or match.group(3)
                if func_name:
                    entities.append(
                        {
                            "file": file_path,
                            "type": "function",
                            "name": func_name,
                            "line": content[: match.start()].count("\n") + 1,
                            "docstring": None,
                            "complexity": 1,
                        }
                    )

        elif language == "rust":
            # Find functions
            func_pattern = r"fn\s+(\w+)"
            for match in re.finditer(func_pattern, content):
                entities.append(
                    {
                        "file": file_path,
                        "type": "function",
                        "name": match.group(1),
                        "line": content[: match.start()].count("\n") + 1,
                        "docstring": None,
                        "complexity": 1,
                    }
                )

        elif language == "go":
            # Find functions
            func_pattern = r"func\s+(?:\([^)]+\)\s+)?(\w+)"
            for match in re.finditer(func_pattern, content):
                entities.append(
                    {
                        "file": file_path,
                        "type": "function",
                        "name": match.group(1),
                        "line": content[: match.start()].count("\n") + 1,
                        "docstring": None,
                        "complexity": 1,
                    }
                )

        return entities


# Standalone functions
def extract_entities(file_path: str, content: str) -> list:
    """Extract code entities from file"""
    parser = CodeParser()
    return parser.parse_file(file_path, content)


def calculate_risk_score(entities: list) -> dict:
    """Calculate risk score based on complexity"""
    total_entities = len(entities)
    high_complexity = sum(1 for e in entities if e.get("complexity", 1) > 5)

    avg_complexity = sum(e.get("complexity", 1) for e in entities) / max(
        total_entities, 1
    )

    # Risk categories
    risk_level = "low"
    if avg_complexity > 5 or high_complexity > total_entities * 0.2:
        risk_level = "high"
    elif avg_complexity > 3:
        risk_level = "medium"

    return {
        "total_entities": total_entities,
        "avg_complexity": round(avg_complexity, 2),
        "high_complexity_count": high_complexity,
        "risk_level": risk_level,
        "score": max(100 - (avg_complexity * 10), 0),
    }
