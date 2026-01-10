import ast
import os
import networkx as nx
from typing import List
from app.models.graph import CodeGraph, CodeNode, GraphEdge, NodeType, EdgeType
from app.core.vertex import get_vertex_client

class CodeIntelligenceAgent:
    """
    Agent 2: Code Intelligence & Dependency Graph
    Responsibilities: Build Graph, Identify Risk, Generate Embeddings
    """
    def __init__(self):
        self.vertex = get_vertex_client()
        self.graph = nx.DiGraph()

    def build_graph(self, file_tree: List[dict], root_path: str) -> CodeGraph:
        nodes = []
        edges = []
        
        # 1. Deterministic Parsing (AST)
        for file_info in file_tree:
            if file_info["language"] == "python":
                self._process_python_file(file_info["full_path"], file_info["path"], nodes, edges)
        
        # Build temp networkx graph for analysis
        temp_graph = nx.DiGraph()
        for n in nodes:
            temp_graph.add_node(n.id)
        for e in edges:
            temp_graph.add_edge(e.source, e.target)

        # 2. Risk & Importance Analysis
        for node in nodes:
            # Fan-in: How many modules depend on me? (Impact)
            fan_in = temp_graph.in_degree(node.id) if node.id in temp_graph else 0
            # Fan-out: How many modules do I depend on? (Complexity)
            fan_out = temp_graph.out_degree(node.id) if node.id in temp_graph else 0
            
            risk_score = self._calculate_risk(fan_in, fan_out)
            node.metadata["risk_score"] = risk_score
            node.metadata["metrics"] = {"fan_in": fan_in, "fan_out": fan_out}

        # 3. AI Embeddings
        # We generate embeddings for the code structure to enable semantic search later.
        try:
            # Context for embedding: "Module: users.py, Type: module, Describes: User management logic..."
            # We mock the description for now, but in prod we'd use the Source Code summary.
            node_texts = [f"Code Entity: {n.name}, Type: {n.type}, Path: {n.path}" for n in nodes]
            embeddings = self.vertex.get_embeddings(node_texts)
            for i, node in enumerate(nodes):
                if i < len(embeddings):
                    node.metadata["embedding"] = embeddings[i]
        except Exception as e:
            print(f"Embedding generation failed: {e}")

        return CodeGraph(nodes=nodes, edges=edges)

    def _calculate_risk(self, fan_in: int, fan_out: int) -> str:
        # Simple heuristic
        # High Impact (High Fan-in) + High Complexity (High Fan-out) = Critical/High Risk
        if fan_in > 5 and fan_out > 5:
            return "critical"
        if fan_in > 3:
            return "high" # Many dependents, be careful
        if fan_out > 5:
            return "medium" # Complex logic
        return "low"

    def _process_python_file(self, full_path: str, rel_path: str, nodes: List[CodeNode], edges: List[GraphEdge]):
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            tree = ast.parse(content)
            
            # Module Node
            module_id = rel_path
            nodes.append(CodeNode(
                id=module_id,
                type=NodeType.MODULE,
                name=os.path.basename(rel_path),
                path=rel_path,
                metadata={"risk": "unknown", "embedding": []} # Placeholders
            ))

            # AST Walk
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        edges.append(GraphEdge(source=module_id, target=alias.name, type=EdgeType.IMPORTS))
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        edges.append(GraphEdge(source=module_id, target=node.module, type=EdgeType.IMPORTS))

        except Exception:
            pass
