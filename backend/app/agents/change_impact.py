from typing import Dict, Any, List
import networkx as nx
from app.models.graph import CodeGraph
from app.core.vertex import get_vertex_client

class ChangeImpactAgent:
    """
    Agent 6: Change Impact Reasoning
    Predicts downstream effects.
    """
    def __init__(self):
        self.vertex = get_vertex_client()

    def analyze(self, changed_module: str, code_graph: CodeGraph) -> Dict[str, Any]:
        # 1. Deterministic Graph Traversal
        affected_modules = self._calculate_impact(code_graph, changed_module)
        
        # 2. AI Explanation
        if affected_modules:
            prompt = f"""
            Users plan to modify '{changed_module}'.
            This will directly or indirectly affect: {', '.join(affected_modules[:10])}.
            Explain the potential risks in 1 sentence.
            """
            risk_explanation = self.vertex.generate_text(prompt)
        else:
            risk_explanation = "No downstream dependencies found."
        
        return {
            "target": changed_module,
            "affected": affected_modules,
            "risk_analysis": risk_explanation
        }

    def _calculate_impact(self, code_graph_data: CodeGraph, changed_node_id: str) -> List[str]:
        # Reconstruct graph
        G = nx.DiGraph()
        for node in code_graph_data.nodes:
            G.add_node(node.id)
        for edge in code_graph_data.edges:
            G.add_edge(edge.source, edge.target)

        # Check if node exists (fuzzy match for UX or exact)
        target = next((n for n in G.nodes if changed_node_id in n), None)
        
        if not target:
            return []

        # Ancestors = Nodes that depend on target (because edge is Source -> Target per IMPORTS)
        # Wait, if A imports B, edge is A -> B.
        # If B changes, A is affected.
        # So we want Predecessors (Who points to me?).
        # Ancestors in networkx (for DiGraph) returns all nodes having a path TO target.
        # Yes, Ancestors = Upstream dependents.
        
        try:
            affected = list(nx.ancestors(G, target))
            return affected
        except Exception:
            return []
