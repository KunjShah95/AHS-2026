from typing import List, Optional
from app.models.graph import CodeGraph, CodeNode

class TutorService:
    def __init__(self):
        pass

    def answer_question(self, question: str, context_graph: CodeGraph) -> str:
        """
        1. Parse question to find keywords matching graph nodes.
        2. Retrieve relevant nodes (subgraph).
        3. (Mock) Generate answer reference those nodes.
        """
        
        # Simple keyword search
        relevant_nodes = []
        for node in context_graph.nodes:
            if node.name.lower() in question.lower() or node.type in question.lower():
                relevant_nodes.append(node)
        
        if not relevant_nodes:
            return "I cannot answer this question as it doesn't seem to reference any known code artifacts in the graph."
        
        # Build context string
        context_str = "\n".join([f"- {n.type} '{n.name}' in {n.path}" for n in relevant_nodes])
        
        # In a real system, we'd send this to an LLM
        return f"Based on the code structure, here is what I found regarding your question:\n{context_str}\n\n(This is a deterministic response based on graph data.)"
