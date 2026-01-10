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
        
        # Build dependency map for fan-out calculation
        dependencies = {n.id: 0 for n in code_graph.nodes}
        for edge in code_graph.edges:
            if edge.type == EdgeType.IMPORTS and edge.source in dependencies:
                dependencies[edge.source] += 1

        for node in code_graph.nodes:
            if node.type == "module":
                # Difficulty heuristics
                loc = node.metadata.get("loc", 0)
                dep_count = dependencies.get(node.id, 0)
                
                # Base difficulty on LOC
                # < 50 loc = 1, > 500 loc = 8
                diff_score = min(10, max(1, int(loc / 50)))
                
                # Cognitive load increases with dependencies
                cog_load = min(10, max(1, diff_score + int(dep_count / 2)))
                
                # Beginner safe?
                is_safe = diff_score <= 3 and dep_count <= 2

                l_node = LearningNode(
                    id=f"concept_{node.id}",
                    concept_name=f"Understanding {node.name}",
                    difficulty=diff_score,
                    cognitive_load=cog_load,
                    description=f"Learn about the module {node.path}. LOC: {loc}, Deps: {dep_count}{' (Beginner Safe)' if is_safe else ''}",
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
                    learning_edges.append(GraphEdge(
                        source=target_conf, # Prerequisite
                        target=source_conf,
                        type=EdgeType.DEPENDS_ON
                    ))

        # Identify entry points
        targets = {e.target for e in learning_edges}
        entry_points = [n.id for n in learning_nodes if n.id not in targets]

        return LearningPath(
            nodes=learning_nodes,
            edges=learning_edges,
            entry_points=entry_points
        )
