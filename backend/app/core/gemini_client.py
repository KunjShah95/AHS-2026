"""
CodeFlow Gemini AI Client
==========================
A production-grade Gemini API client with:
- Structured JSON output parsing
- Automatic retry with exponential backoff
- Token usage tracking
- Response caching for cost optimization
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Any, Union
from functools import lru_cache
import time

logger = logging.getLogger(__name__)

# Try to import Google GenAI
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not installed. Running in MOCK mode.")


class GeminiClient:
    """
    Production-grade Gemini API client for CodeFlow.
    
    Features:
    - Automatic JSON parsing and validation
    - Retry logic with exponential backoff
    - Response caching (in-memory)
    - Token usage tracking
    - Multiple model support (flash, pro)
    """
    
    _instance = None
    
    def __init__(self):
        self.mode = "mock"
        self.model = None
        self.flash_model = None
        self.embedding_model = None
        self.token_usage = {"input": 0, "output": 0}
        self._cache: Dict[str, str] = {}
        
        if GENAI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    
                    # Initialize models with optimal settings
                    generation_config = {
                        "temperature": 0.1,  # Low for consistency
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 8192,
                    }
                    
                    # Safety settings - allow technical content
                    safety_settings = {
                        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                    }
                    
                    # Primary model for complex tasks
                    self.model = genai.GenerativeModel(
                        model_name="gemini-1.5-pro",
                        generation_config=generation_config,
                        safety_settings=safety_settings
                    )
                    
                    # Flash model for quick tasks
                    self.flash_model = genai.GenerativeModel(
                        model_name="gemini-1.5-flash",
                        generation_config=generation_config,
                        safety_settings=safety_settings
                    )
                    
                    self.mode = "live"
                    logger.info("GeminiClient initialized successfully in LIVE mode")
                    
                except Exception as e:
                    logger.error(f"Failed to initialize Gemini: {e}")
                    self.mode = "mock"
            else:
                logger.warning("GEMINI_API_KEY not found. Running in MOCK mode.")
        
    @classmethod
    def get_instance(cls) -> 'GeminiClient':
        if cls._instance is None:
            cls._instance = GeminiClient()
        return cls._instance
    
    def _get_cache_key(self, prompt: str, use_flash: bool) -> str:
        """Generate cache key for prompt."""
        model_prefix = "flash" if use_flash else "pro"
        return f"{model_prefix}_{hashlib.md5(prompt.encode()).hexdigest()}"
    
    def generate_text(
        self, 
        prompt: str, 
        system_prompt: str = "",
        use_flash: bool = False,
        temperature: float = 0.1,
        use_cache: bool = True,
        max_retries: int = 3
    ) -> str:
        """
        Generate text response from Gemini.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system-level instructions
            use_flash: Use faster flash model (for simple tasks)
            temperature: Creativity level (0-1)
            use_cache: Whether to use response caching
            max_retries: Number of retries on failure
            
        Returns:
            Generated text response
        """
        # Check cache first
        cache_key = self._get_cache_key(f"{system_prompt}{prompt}", use_flash)
        if use_cache and cache_key in self._cache:
            logger.debug(f"Cache hit for prompt: {prompt[:50]}...")
            return self._cache[cache_key]
        
        if self.mode == "mock":
            mock_response = self._generate_mock_response(prompt)
            return mock_response
        
        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        # Select model
        model = self.flash_model if use_flash else self.model
        
        # Retry logic with exponential backoff
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    full_prompt,
                    generation_config={"temperature": temperature}
                )
                
                result = response.text
                
                # Cache the response
                if use_cache:
                    self._cache[cache_key] = result
                
                # Track usage (approximate)
                self.token_usage["input"] += len(full_prompt.split()) * 1.3
                self.token_usage["output"] += len(result.split()) * 1.3
                
                return result
                
            except Exception as e:
                wait_time = (2 ** attempt) + 1
                logger.warning(f"Gemini API error (attempt {attempt + 1}): {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
        
        logger.error(f"Failed to generate after {max_retries} attempts")
        return f"Error: Failed to generate response after {max_retries} attempts"
    
    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        use_flash: bool = False,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Generate and parse JSON response from Gemini.
        
        Includes automatic JSON extraction and validation.
        """
        # Add JSON instruction to prompt
        json_prompt = f"""{prompt}

CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanation, just JSON.
Start your response with {{ and end with }}"""
        
        response = self.generate_text(
            json_prompt, 
            system_prompt, 
            use_flash,
            temperature=0.05,  # Very low for JSON consistency
            max_retries=max_retries
        )
        
        return self._parse_json_response(response)
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Extract and parse JSON from response."""
        try:
            # Try direct parse first
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        
        # Try to extract JSON from markdown code blocks
        if "```json" in response:
            try:
                json_str = response.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            except (IndexError, json.JSONDecodeError):
                pass
        
        # Try to find JSON object in response
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        logger.error(f"Failed to parse JSON from response: {response[:200]}...")
        return {"error": "Failed to parse JSON", "raw_response": response[:500]}
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text similarity search."""
        if self.mode == "mock":
            return [[0.1] * 768 for _ in texts]
        
        try:
            results = []
            for text in texts:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                results.append(result['embedding'])
            return results
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return [[0.1] * 768 for _ in texts]
    
    def _generate_mock_response(self, prompt: str) -> str:
        """Generate mock responses for testing without API."""
        prompt_lower = prompt.lower()
        
        if "architecture" in prompt_lower or "structure" in prompt_lower:
            return json.dumps({
                "architecture_type": "Modern Python Backend (FastAPI)",
                "confidence": 0.85,
                "layers": [
                    {"name": "API Layer", "purpose": "HTTP endpoints and request handling", "key_files": ["app/api/"]},
                    {"name": "Service Layer", "purpose": "Business logic", "key_files": ["app/services/"]},
                    {"name": "Agent Layer", "purpose": "AI-powered analysis", "key_files": ["app/agents/"]}
                ],
                "core_domain_location": "app/",
                "observations": ["Well-structured FastAPI application", "Clear separation of concerns"],
                "onboarding_priority": ["app/main.py", "app/api/endpoints/", "README.md"]
            })
        
        if "learning" in prompt_lower or "roadmap" in prompt_lower:
            return json.dumps({
                "total_phases": 5,
                "estimated_total_hours": 40,
                "phases": [
                    {
                        "phase_number": 1,
                        "title": "Environment Setup & Orientation",
                        "duration_hours": 4,
                        "objectives": ["Set up development environment", "Understand project structure"],
                        "modules_to_study": ["README.md", "app/main.py"],
                        "concepts_introduced": ["FastAPI basics", "Project layout"],
                        "hands_on_task": {
                            "type": "scavenger_hunt",
                            "description": "Find and list all API endpoints",
                            "success_criteria": "Document at least 5 endpoints with their HTTP methods"
                        }
                    }
                ],
                "quick_wins": ["Can run project locally after Phase 1"],
                "milestones": [
                    {"phase": 1, "milestone": "Development environment working"},
                    {"phase": 3, "milestone": "Can navigate codebase independently"},
                    {"phase": 5, "milestone": "Ready for first real task"}
                ]
            })
        
        if "task" in prompt_lower:
            return json.dumps({
                "task_id": "task_explore_001",
                "title": "Explore the API Structure",
                "type": "scavenger_hunt",
                "estimated_minutes": 30,
                "difficulty": 2,
                "objective": "Understand the API layer organization",
                "instructions": [
                    "Open the app/api directory",
                    "List all endpoint files",
                    "Document one endpoint from each file"
                ],
                "files_involved": ["app/api/"],
                "success_criteria": ["Documented at least 5 endpoints"],
                "hints": [{"hint_number": 1, "hint": "Look for files named after features"}],
                "follow_up_concepts": ["Request validation", "Response models"]
            })
        
        # Default response
        return json.dumps({
            "response": "Analysis completed",
            "details": f"Processed prompt: {prompt[:100]}..."
        })
    
    def get_usage_stats(self) -> Dict[str, int]:
        """Get token usage statistics."""
        return {
            "input_tokens": int(self.token_usage["input"]),
            "output_tokens": int(self.token_usage["output"]),
            "total_tokens": int(self.token_usage["input"] + self.token_usage["output"]),
            "mode": self.mode
        }
    
    def clear_cache(self):
        """Clear the response cache."""
        self._cache.clear()
        logger.info("Response cache cleared")


# Singleton accessor
def get_gemini_client() -> GeminiClient:
    return GeminiClient.get_instance()
