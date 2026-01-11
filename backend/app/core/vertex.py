import os
import logging
from typing import Optional, Any, List

# Setup Logger
logger = logging.getLogger(__name__)

# Try importing Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Try importing Vertex AI (Fallback)
try:
    import vertexai
    from vertexai.language_models import TextEmbeddingModel
    from vertexai.generative_models import GenerativeModel
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False

class VertexAIClient:
    """
    Unified Client for AI operations.
    Supports:
    1. Google Gemini API (via google-generativeai) - Preferred if GEMINI_API_KEY is properly set.
    2. Google Vertex AI (via vertexai) - Fallback if GOOGLE_CLOUD_PROJECT is set.
    3. Mock Mode - Fallback if neither is available.
    """
    _instance = None
    
    def __init__(self):
        self.mock_mode = False
        self.client_type = "mock" # 'vertex' | 'genai' | 'mock'
        
        # 1. Check for Gemini API Key (User Preferred)
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # 2. Check for GCP Project (Vertex Fallback)
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = "us-central1"

        # Initialization Logic
        if self.api_key and GENAI_AVAILABLE:
            try:
                genai.configure(api_key=self.api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
                self.client_type = "genai"
                logger.info("Initialized Google Generative AI (Gemini) Client.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self._try_vertex_fallback()

        elif self.project_id and VERTEX_AVAILABLE:
            self._try_vertex_fallback()
        else:
            self._set_mock_mode("No valid AI credentials found (GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT).")

    def _try_vertex_fallback(self):
        if self.project_id and VERTEX_AVAILABLE:
            try:
                vertexai.init(project=self.project_id, location=self.location)
                self.gemini_model = GenerativeModel("gemini-pro")
                self.embedding_model = TextEmbeddingModel.from_pretrained("textembedding-gecko@003")
                self.client_type = "vertex"
                logger.info("Initialized Vertex AI Client.")
            except Exception as e:
                self._set_mock_mode(f"Failed to initialize Vertex AI: {e}")
        else:
            self._set_mock_mode("Vertex AI dependencies or Project ID missing.")

    def _set_mock_mode(self, reason: str):
        logger.warning(f"{reason} Using MOCK mode.")
        self.mock_mode = True
        self.client_type = "mock"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = VertexAIClient()
        return cls._instance

    def generate_text(self, prompt: str, temperature: float = 0.2) -> str:
        if self.mock_mode:
            return f"[MOCK AI] Response to: {prompt[:50]}..."
        
        try:
            if self.client_type == "genai":
                response = self.gemini_model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=2048
                    )
                )
                return response.text
            elif self.client_type == "vertex":
                response = self.gemini_model.generate_content(
                    prompt,
                    generation_config={"temperature": temperature, "max_output_tokens": 2048}
                )
                return response.text

        except Exception as e:
            logger.error(f"AI Generation Error ({self.client_type}): {e}")
            return f"Error generating content: {str(e)}"

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.mock_mode:
            # Return dummy 768-dim vectors
            return [[0.1] * 768 for _ in texts]

        try:
            if self.client_type == "genai":
                # google-generativeai embedding model selection
                model_name = "models/embedding-001"
                
                # Check strict limits or batching if needed, but for now pass directly
                result = genai.embed_content(
                    model=model_name,
                    content=texts,
                    task_type="retrieval_document"
                )
                
                # result['embedding'] will be a list of lists if input is a list
                if 'embedding' in result:
                     return result['embedding']
                return []
                
            elif self.client_type == "vertex":
                embeddings = self.embedding_model.get_embeddings(texts)
                return [embedding.values for embedding in embeddings]

        except Exception as e:
            logger.error(f"AI Embedding Error ({self.client_type}): {e}")
            return []

# Singleton helper
def get_vertex_client():
    return VertexAIClient.get_instance()
