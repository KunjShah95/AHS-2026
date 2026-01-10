import ast
import os
import networkx as nx
from typing import List
from app.models.graph import CodeGraph, CodeNode, GraphEdge, NodeType, EdgeType

class CodeIntelligenceService:
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_dependency_graph(self, file_tree: List[dict], root_path: str) -> CodeGraph:
        """
        Builds a dependency graph from the file tree.
        Focuses on Python AST for demonstration.
        """
        nodes = []
        edges = []

        for file_info in file_tree:
            if file_info["language"] == "python":
                self._process_python_file(file_info["full_path"], file_info["path"], nodes, edges)
        
        return CodeGraph(nodes=nodes, edges=edges)

    def _process_python_file(self, full_path: str, rel_path: str, nodes: List[CodeNode], edges: List[GraphEdge]):
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            tree = ast.parse(content)
            
            # Create a node for the module/file
            module_id = rel_path
            loc = len(content.splitlines())
            nodes.append(CodeNode(
                id=module_id,
                type=NodeType.MODULE,
                name=os.path.basename(rel_path),
                path=rel_path,
                metadata={"loc": loc}
            ))

            for node in ast.walk(tree):
                # Detect imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        target = alias.name
                        edges.append(GraphEdge(
                            source=module_id,
                            target=target, # In a real system, resolve this to a file path
                            type=EdgeType.IMPORTS
                        ))
                elif isinstance(node, ast.ImportFrom):
                    module = node.module
                    if module:
                        edges.append(GraphEdge(
                            source=module_id,
                            target=module,
                            type=EdgeType.IMPORTS
                        ))
                
                # Detect functions
                elif isinstance(node, ast.FunctionDef):
                    func_id = f"{module_id}::{node.name}"
                    nodes.append(CodeNode(
                        id=func_id,
                        type=NodeType.FUNCTION,
                        name=node.name,
                        path=rel_path
                    ))
                    # Function belongs to module
                    edges.append(GraphEdge(
                        source=module_id,
                        target=func_id,
                        type=EdgeType.DEFINES
                    ))

        except Exception as e:
            print(f"Error processing {rel_path}: {e}")

