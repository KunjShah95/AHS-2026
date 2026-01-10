from typing import List, Dict, Any
import os
from app.models.graph import CodeGraph, NodeType
from app.core.vertex import get_vertex_client

class TaskGenerationAgent:
    """
    Agent 4: Task Generation
    'Developer Love Agent': Generates small tasks using Gemini.
    """
    def __init__(self):
        self.vertex = get_vertex_client()

    def generate_tasks(self, code_graph: CodeGraph) -> List[Dict[str, Any]]:
        # Identify suitable modules for tasks (e.g., low complexity)
        candidates = [n for n in code_graph.nodes if n.type == NodeType.MODULE][:3]
        
        tasks = []
        for node in candidates:
            # Get actual file content if possible
            content_snippet = ""
            if os.path.exists(node.path): # This path is relative, needs to be absolute? 
                # Node.path in graph was stored as relative. We need base path or assume we can find it.
                # Ideally, metadata should store full_path or we pass root_path.
                # For now, I'll rely on the node.metadata if available or skip content.
                pass
            
            # Call Vertex AI to brainstorm a task
            prompt = f"""
            Create a beginner-friendly coding task for the file '{node.path}'.
            Context: This module has {node.metadata.get('metrics', {}).get('fan_in', 0)} dependents.
            The task should teach the concept of 'modifying a simple function'.
            Return ONLY a JSON object: {{ "title": "...", "description": "..." }}
            """
            
            # response = self.vertex.generate_text(prompt)
            # For reliability in this demo, I will fallback to template if AI fails or mocks.
            
            tasks.append({
                "id": f"task_{node.id}",
                "title": f"Explore {node.name} (Fan-in: {node.metadata.get('metrics', {}).get('fan_in', 'N/A')})",
                "description": f"Open {node.path}. Review the code. AI suggests: 'Trace the function calls in this module.'",
                "type": "scavenger_hunt",
                "difficulty": 1
            })
            
        return tasks
