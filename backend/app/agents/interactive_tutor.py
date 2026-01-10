from app.models.graph import CodeGraph
from app.core.vertex import get_vertex_client

class InteractiveTutorAgent:
    """
    Agent 5: Interactive Tutor
    Constrained LLM answering questions based on Graph Context.
    """
    def __init__(self):
        self.vertex = get_vertex_client()

    def answer(self, question: str, context: CodeGraph) -> str:
        # 1. Retrieve Context (Graph Nodes)
        # Convert graph to string representation for the LLM
        graph_context = "\n".join([f"- {n.name} ({n.path})" for n in context.nodes])
        
        # 2. Prompting
        prompt = f"""
        You are an expert code tutor. Answer the user's question using ONLY the provided code context.
        If the answer is not in the context, say "I don't know based on the current graph."
        
        Context:
        {graph_context}
        
        User Question: {question}
        """
        
        return self.vertex.generate_text(prompt)
