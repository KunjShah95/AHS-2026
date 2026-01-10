from typing import List, Dict, Set, Any
import networkx as nx
from app.models.graph import CodeGraph, EdgeType

class ImpactAnalysisService:
    def __init__(self):
        pass

    def match_node(self, graph: nx.DiGraph, query: str) -> str:
        # Simple exact match or first substring match for V0
        for node in graph.nodes:
            if query == node or query in node:
                return node
        return None

    def calculate_impact(self, code_graph_data: CodeGraph, changed_file_or_module: str) -> Dict[str, Any]:
        """
        Determines which modules are affected if the given module changes.
        Uses reverse dependencies (transpose of the dependency graph).
        """
        # Reconstruct graph
        G = nx.DiGraph()
        for node_data in code_graph_data.nodes:
            G.add_node(node_data.id, **node_data.model_dump())
        
        for edge in code_graph_data.edges:
            G.add_edge(edge.source, edge.target, type=edge.type)

        target_node = self.match_node(G, changed_file_or_module)
        if not target_node:
            return {"error": "Module not found in graph"}

        # Impact = Ancestors in the dependency graph (Who depends on me?)
        # If A imports B, edge is A -> B.
        # If B changes, A is affected.
        # So we look for Predecessors of B (nodes that have an edge TO B).
        # Recursive ancestors.
        
        affected_nodes = list(nx.ancestors(G, target_node))
        affected_nodes.append(target_node) # Self is affected
        
        # Calculate Risk Score based on number of affected nodes using PageRank or simple count
        risk_score = len(affected_nodes) 
        risk_level = "LOW"
        if risk_score > 5:
            risk_level = "MEDIUM"
        if risk_score > 20:
            risk_level = "HIGH"

        return {
            "target_node": target_node,
            "impact_radius": len(affected_nodes),
            "risk_level": risk_level,
            "affected_modules": affected_nodes
        }
