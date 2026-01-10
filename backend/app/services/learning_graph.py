from typing import List
from app.models.graph import CodeGraph, LearningPath, LearningNode, GraphEdge, EdgeType

class LearningGraphService:
    def __init__(self):
        pass

    def construct_learning_path(self, code_graph: CodeGraph) -> LearningPath:
        """
        Converts a raw code graph into a structured learning path.
        """
        learning_nodes = []
        learning_edges = []
        
        # Simple heuristic: Each module is a "Concept" to be learned.
        # This is a baseline V0 approach.
        
        # Map code node IDs to learning node IDs
        code_to_learning = {}

        for node in code_graph.nodes:
            if node.type == "module": # focus on modules first
                l_node = LearningNode(
                    id=f"concept_{node.id}",
                    concept_name=f"Understanding {node.name}",
                    difficulty=3, # Default
                    cognitive_load=3,
                    description=f"Learn about the module {node.path}",
                    related_code_nodes=[node.id]
                )
                learning_nodes.append(l_node)
                code_to_learning[node.id] = l_node.id

        # Map edges
        for edge in code_graph.edges:
            if edge.type == EdgeType.IMPORTS:
                source_conf = code_to_learning.get(edge.source)
                target_conf = code_to_learning.get(edge.target)
                
                if source_conf and target_conf:
                    # If A imports B, you probably need to understand B before A?
                    # Or maybe A is the entry point and B is a detail?
                    # Usually "Dependency" means B is a prerequisite for A.
                    learning_edges.append(GraphEdge(
                        source=target_conf, # Prerequisite
                        target=source_conf,
                        type=EdgeType.DEPENDS_ON
                    ))

        # Identify entry points (nodes with no incoming dependencies)
        # In a learning graph, entry points are leaf nodes in the dependency tree (no prereqs).
        
        # Build a set of all targets
        targets = {e.target for e in learning_edges}
        entry_points = [n.id for n in learning_nodes if n.id not in targets]

        return LearningPath(
            nodes=learning_nodes,
            edges=learning_edges,
            entry_points=entry_points
        )
