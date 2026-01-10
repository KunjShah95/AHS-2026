import os
import logging
from typing import Optional, Any, List
# Conditional import to allow valid syntax without library installed (if dev environment differs)
try:
    import vertexai
    from vertexai.language_models import TextGenerationModel, TextEmbeddingModel
    from vertexai.generative_models import GenerativeModel, Part
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False
    print("Warning: google-cloud-aiplatform not installed or accessible.")

logger = logging.getLogger(__name__)

class VertexAIClient:
    _instance = None
    
    def __init__(self, project_id: str = None, location: str = "us-central1"):
        if not VERTEX_AVAILABLE:
            self.mock_mode = True
            logger.warning("Vertex AI dependencies not found. Running in MOCK mode.")
            return

        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = location
        self.mock_mode = False
        
        if not self.project_id:
            logger.warning("GOOGLE_CLOUD_PROJECT not set. Vertex AI calls will fail or fallback to mock.")
            self.mock_mode = True
            return

        try:
            vertexai.init(project=self.project_id, location=self.location)
            # Initialize models
            self.gemini_pro = GenerativeModel("gemini-pro")
            self.embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@003")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {e}")
            self.mock_mode = True

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = VertexAIClient()
        return cls._instance

    def generate_text(self, prompt: str, temperature: float = 0.2) -> str:
        if self.mock_mode:
            return f"[MOCK VERTEX AI] Response to: {prompt[:50]}..."
        
        try:
            responses = self.gemini_pro.generate_content(
                prompt,
                generation_config={"temperature": temperature, "max_output_tokens": 2048},
                stream=False
            )
            return responses.text
        except Exception as e:
            logger.error(f"Vertex AI Generation Error: {e}")
            return f"Error generating content: {str(e)}"

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.mock_mode:
            # Return dummy 768-dim vectors
            return [[0.1] * 768 for _ in texts]

        try:
            embeddings = self.embedding_model.get_embeddings(texts)
            return [embedding.values for embedding in embeddings]
        except Exception as e:
            logger.error(f"Vertex AI Embedding Error: {e}")
            return []

# Singleton helper
def get_vertex_client():
    return VertexAIClient.get_instance()
