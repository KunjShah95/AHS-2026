
import os
import logging
from typing import List, Optional

# Configure Logging
logger = logging.getLogger(__name__)

# Try to import ADK and GenAI
try:
    from google.adk.agents.llm_agent import Agent
    import google.generativeai as genai
    ADK_AVAILABLE = True
except ImportError as e:
    logger.error(f"ADK Import failed: {e}")
    ADK_AVAILABLE = False
    Agent = None
    genai = None

class ADKClient:
    _instance = None
    
    def __init__(self):
        self.mode = "mock"
        self.agent = None
        
        if ADK_AVAILABLE:
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                try:
                    # Configure GenAI for embeddings
                    genai.configure(api_key=api_key)
                    
                    # Initialize ADK Agent
                    # Note: Model default to gemini-pro or 1.5-flash as per docs
                    self.agent = Agent(
                        model='gemini-1.5-flash', 
                        name='core_agent',
                        description="Core AI Agent for backend services",
                        instruction="You are a helpful AI assistant for code analysis and generation."
                    )
                    self.mode = "adk"
                    logger.info("Initialized ADKClient with google-adk")
                except Exception as e:
                    logger.error(f"Failed to init ADK Agent: {e}")
                    self.mode = "mock"
            else:
                logger.warning("GOOGLE_API_KEY not found. Running in MOCK mode.")
        else:
            logger.warning("google-adk not installed. Running in MOCK mode.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ADKClient()
        return cls._instance

    def generate_text(self, prompt: str, temperature: float = 0.2) -> str:
        if self.mode == "mock":
            return f"[MOCK ADK] Response to: {prompt[:50]}..."
        
        try:
            # Try to invoke the agent. 
            # ADK Agent might use 'run', 'chat', 'invoke', 'query'
            # We attempt standard patterns since we couldn't inspect it.
            if hasattr(self.agent, 'run'):
                response = self.agent.run(prompt)
            elif hasattr(self.agent, 'invoke'):
                response = self.agent.invoke(prompt)
            elif hasattr(self.agent, 'generate_content'): # Direct model wrapper?
                response = self.agent.generate_content(prompt)
            else:
                # Fallback to direct GenAI if ADK usage is unclear
                return self._fallback_genai(prompt)

            # Parse response
            # Response might be an object or string
            return str(response)
            
        except Exception as e:
            logger.error(f"ADK Generation Error: {e}")
            return f"Error generating content: {str(e)}"

    def _fallback_genai(self, prompt: str) -> str:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.mode == "mock":
            return [[0.1] * 768 for _ in texts]

        try:
            # Use google-generativeai for embeddings
            results = [
                genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                ) for text in texts
            ]
            return [res['embedding'] for res in results]
        except Exception as e:
            logger.error(f"Embedding Error: {e}")
            return []

def get_adk_client():
    return ADKClient.get_instance()
