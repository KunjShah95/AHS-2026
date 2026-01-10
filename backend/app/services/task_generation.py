from typing import List, Dict, Any
from app.models.graph import CodeGraph, NodeType

class TaskGenerationService:
    def __init__(self):
        pass

    def generate_tasks(self, code_graph: CodeGraph) -> List[Dict[str, Any]]:
        """
        Generates a list of educational tasks based on the code graph.
        """
        tasks = []
        
        for node in code_graph.nodes:
            if node.type == NodeType.FUNCTION:
                # Task: Find the function definition
                tasks.append({
                    "id": f"task_find_{node.id}",
                    "title": f"Locate function {node.name}",
                    "description": f"Go to {node.path} and identify what {node.name} does.",
                    "type": "scavenger_hunt",
                    "target_node": node.id,
                    "difficulty": 1
                })
            elif node.type == NodeType.MODULE:
                # Task: Explain the module
                tasks.append({
                    "id": f"task_explain_{node.id}",
                    "title": f"Explain {node.name}",
                    "description": f"Read through {node.path} and summarize its responsibility.",
                    "type": "explanation",
                    "target_node": node.id,
                    "difficulty": 2
                })
                
        return tasks
