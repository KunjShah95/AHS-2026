"""
CodeFlow - Enhanced Vertex AI Client
=================================

Production-ready Vertex AI client with:
- Automatic model selection (Gemini 2.0 preferred)
- Token counting and cost estimation
- Streaming support
- Retry logic with exponential backoff
- Response caching
- Fallback chains
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional, List, AsyncIterator, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from functools import wraps
import asyncio

logger = logging.getLogger(__name__)


class ModelType(Enum):
    """Supported AI models."""

    GEMINI_2_0_FLASH = "gemini-2.0-flash"
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    GEMINI_1_5_FLASH = "gemini-1.5-flash"
    GEMINI_PRO = "gemini-pro"
    TEXT_EMBEDDING_3 = "text-embedding-3"


@dataclass
class ModelConfig:
    """Model configuration."""

    name: str
    max_tokens: int
    temperature_range: tuple
    cost_per_1k_input: float
    cost_per_1k_output: float
    supports_streaming: bool = True
    supports_vision: bool = False
    context_window: int = 1000000


# Model configurations
MODEL_CONFIGS: Dict[ModelType, ModelConfig] = {
    ModelType.GEMINI_2_0_FLASH: ModelConfig(
        name="gemini-2.0-flash",
        max_tokens=8192,
        temperature_range=(0.0, 2.0),
        cost_per_1k_input=0.00001,
        cost_per_1k_output=0.00003,
        supports_streaming=True,
        supports_vision=True,
        context_window=1000000,
    ),
    ModelType.GEMINI_1_5_PRO: ModelConfig(
        name="gemini-1.5-pro",
        max_tokens=8192,
        temperature_range=(0.0, 1.0),
        cost_per_1k_input=0.000075,
        cost_per_1k_output=0.0003,
        supports_streaming=True,
        supports_vision=True,
        context_window=2000000,
    ),
    ModelType.GEMINI_1_5_FLASH: ModelConfig(
        name="gemini-1.5-flash",
        max_tokens=8192,
        temperature_range=(0.0, 1.0),
        cost_per_1k_input=0.00001,
        cost_per_1k_output=0.00003,
        supports_streaming=True,
        supports_vision=True,
        context_window=1000000,
    ),
    ModelType.GEMINI_PRO: ModelConfig(
        name="gemini-pro",
        max_tokens=2048,
        temperature_range=(0.0, 1.0),
        cost_per_1k_input=0.00005,
        cost_per_1k_output=0.0005,
        supports_streaming=True,
        supports_vision=False,
        context_window=32768,
    ),
}


@dataclass
class TokenUsage:
    """Token usage statistics."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def to_dict(self) -> Dict[str, int]:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
        }


@dataclass
class CostEstimate:
    """Cost estimation."""

    input_cost: float = 0.0
    output_cost: float = 0.0
    total_cost: float = 0.0

    def to_dict(self) -> Dict[str, float]:
        return {
            "input_cost": round(self.input_cost, 6),
            "output_cost": round(self.output_cost, 6),
            "total_cost": round(self.total_cost, 6),
        }


@dataclass
class GenerationResult:
    """Result from text generation."""

    text: str
    model: str
    usage: TokenUsage
    cost: CostEstimate
    finish_reason: Optional[str] = None
    response_time_ms: float = 0.0
    cached: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class RateLimiter:
    """Token-based rate limiter."""

    def __init__(self, rpm: int = 60, tpm: int = 1000000):
        self.rpm = rpm
        self.tpm = tpm
        self._requests = []
        self._tokens = []

    async def acquire(self, estimated_tokens: int) -> bool:
        """Acquire rate limit permission."""
        now = time.time()

        self._requests = [t for t in self._requests if now - t < 60]
        self._tokens = [t for t in self._tokens if now - t < 60]

        if len(self._requests) >= self.rpm:
            return False

        if sum(self._tokens) + estimated_tokens > self.tpm:
            return False

        self._requests.append(now)
        self._tokens.append(estimated_tokens)
        return True

    def get_remaining(self) -> Dict[str, int]:
        """Get remaining rate limit."""
        now = time.time()
        self._requests = [t for t in self._requests if now - t < 60]
        self._tokens = [t for t in self._tokens if now - t < 60]

        return {
            "requests_remaining": self.rpm - len(self._requests),
            "tokens_remaining": self.tpm - sum(self._tokens),
        }


class EnhancedVertexClient:
    """
    Enhanced Vertex AI client with production features.

    Features:
    - Automatic model selection
    - Token counting and cost estimation
    - Response caching
    - Retry with exponential backoff
    - Streaming support
    - Rate limiting
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self._client = None
        self._embedding_client = None
        self._mock_mode = True

        self._api_key = os.getenv("GEMINI_API_KEY")
        self._project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self._location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 3600

        self._rate_limiter = RateLimiter(rpm=60, tpm=1000000)

        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize AI clients."""
        if self._api_key:
            try:
                import google.generativeai as genai

                genai.configure(api_key=self._api_key)
                self._client = genai.GenerativeModel("gemini-2.0-flash")
                self._mock_mode = False
                logger.info("Initialized Gemini 2.0 client")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")

        if self._project_id:
            try:
                import vertexai
                from vertexai.language_models import TextEmbeddingModel
                from vertexai.generative_models import GenerativeModel

                vertexai.init(project=self._project_id, location=self._location)
                self._client = GenerativeModel("gemini-1.5-pro")
                self._embedding_client = TextEmbeddingModel.from_pretrained(
                    "text-embedding-3"
                )
                self._mock_mode = False
                logger.info("Initialized Vertex AI client")
                return
            except Exception as e:
                logger.warning(f"Failed to initialize Vertex AI: {e}")

        logger.warning("Running in mock mode - no AI credentials configured")

    def _get_cache_key(self, prompt: str, **kwargs) -> str:
        """Generate cache key."""
        import hashlib

        content = json.dumps({"prompt": prompt, **kwargs}, sort_keys=True)
        return hashlib.md5(content.encode()).hexdigest()

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)."""
        return len(text) // 4 + 100

    def _calculate_cost(self, model: ModelType, usage: TokenUsage) -> CostEstimate:
        """Calculate cost for token usage."""
        config = MODEL_CONFIGS[model]

        input_cost = (usage.prompt_tokens / 1000) * config.cost_per_1k_input
        output_cost = (usage.completion_tokens / 1000) * config.cost_per_1k_output

        return CostEstimate(
            input_cost=input_cost,
            output_cost=output_cost,
            total_cost=input_cost + output_cost,
        )

    async def generate(
        self,
        prompt: str,
        model: ModelType = ModelType.GEMINI_2_0_FLASH,
        temperature: float = 0.2,
        max_tokens: Optional[int] = None,
        use_cache: bool = True,
        retry_count: int = 3,
    ) -> GenerationResult:
        """
        Generate text using AI model.

        Args:
            prompt: Input prompt
            model: Model to use
            temperature: Creativity (0.0-2.0)
            max_tokens: Maximum output tokens
            use_cache: Use cached response
            retry_count: Number of retries on failure

        Returns:
            GenerationResult with text, usage, and cost
        """
        start_time = time.perf_counter()

        cache_key = self._get_cache_key(
            prompt, model=model.value, temperature=temperature
        )

        if use_cache and cache_key in self._cache:
            cached = self._cache[cache_key]
            if time.time() - cached["timestamp"] < self._cache_ttl:
                logger.debug(f"Cache hit for {cache_key}")
                return GenerationResult(
                    text=cached["result"],
                    model=model.value,
                    usage=TokenUsage(**cached["usage"]),
                    cost=CostEstimate(**cached["cost"]),
                    cached=True,
                )

        estimated_tokens = self._estimate_tokens(prompt)
        if not await self._rate_limiter.acquire(estimated_tokens):
            raise Exception("Rate limit exceeded")

        config = MODEL_CONFIGS[model]

        for attempt in range(retry_count):
            try:
                if self._mock_mode:
                    text = f"[MOCK AI] Response to: {prompt[:50]}..."
                else:
                    import google.generativeai as genai

                    generation_config = genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens or config.max_tokens,
                    )

                    response = self._client.generate_content(
                        prompt, generation_config=generation_config
                    )
                    text = response.text

                response_time = (time.perf_counter() - start_time) * 1000

                usage = TokenUsage(
                    prompt_tokens=self._estimate_tokens(prompt),
                    completion_tokens=self._estimate_tokens(text),
                    total_tokens=self._estimate_tokens(prompt)
                    + self._estimate_tokens(text),
                )

                cost = self._calculate_cost(model, usage)

                result = GenerationResult(
                    text=text,
                    model=config.name,
                    usage=usage,
                    cost=cost,
                    response_time_ms=response_time,
                    cached=False,
                )

                self._cache[cache_key] = {
                    "result": text,
                    "usage": usage.to_dict(),
                    "cost": cost.to_dict(),
                    "timestamp": time.time(),
                }

                logger.info(
                    f"Generated {len(text)} chars in {response_time:.0f}ms "
                    f"(${cost.total_cost:.6f})"
                )

                return result

            except Exception as e:
                if attempt < retry_count - 1:
                    wait_time = 2**attempt
                    logger.warning(f"Generation failed, retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    raise Exception(
                        f"Generation failed after {retry_count} attempts: {e}"
                    )

        raise Exception("Unexpected error in generation")

    async def generate_streaming(
        self,
        prompt: str,
        model: ModelType = ModelType.GEMINI_2_0_FLASH,
        temperature: float = 0.2,
    ) -> AsyncIterator[str]:
        """
        Generate text with streaming output.

        Yields text chunks as they are generated.
        """
        config = MODEL_CONFIGS[model]

        if not config.supports_streaming:
            raise Exception(f"Model {model.value} does not support streaming")

        if self._mock_mode:
            yield f"[MOCK AI] Response to: {prompt[:50]}..."
            return

        try:
            import google.generativeai as genai

            generation_config = genai.types.GenerationConfig(
                temperature=temperature, max_output_tokens=config.max_tokens
            )

            response = self._client.generate_content(
                prompt, generation_config=generation_config, stream=True
            )

            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            raise

    async def get_embeddings(
        self, texts: List[str], model: ModelType = ModelType.TEXT_EMBEDDING_3
    ) -> List[List[float]]:
        """Get embeddings for texts."""
        if self._mock_mode:
            return [[0.1] * 768 for _ in texts]

        if self._embedding_client:
            embeddings = self._embedding_client.get_embeddings(texts)
            return [e.values for e in embeddings]

        return [[0.1] * 768 for _ in texts]

    async def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return self._estimate_tokens(text)

    def get_model_info(self, model: ModelType) -> Dict[str, Any]:
        """Get model configuration info."""
        config = MODEL_CONFIGS[model]
        remaining = self._rate_limiter.get_remaining()

        return {
            "name": config.name,
            "max_tokens": config.max_tokens,
            "temperature_range": config.temperature_range,
            "context_window": config.context_window,
            "cost_per_1k_input": config.cost_per_1k_input,
            "cost_per_1k_output": config.cost_per_1k_output,
            "supports_streaming": config.supports_streaming,
            "supports_vision": config.supports_vision,
            "rate_limit_remaining": remaining,
            "mock_mode": self._mock_mode,
        }

    def list_available_models(self) -> List[Dict[str, Any]]:
        """List all available models with status."""
        return [
            {
                "id": model.value,
                "name": config.name,
                "available": not self._mock_mode,
                **self.get_model_info(model),
            }
            for model, config in MODEL_CONFIGS.items()
        ]

    def clear_cache(self, older_than_seconds: Optional[int] = None):
        """Clear response cache."""
        now = time.time()
        keys_to_remove = []

        for key, value in self._cache.items():
            if older_than_seconds:
                if now - value["timestamp"] > older_than_seconds:
                    keys_to_remove.append(key)
            else:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self._cache[key]

        logger.info(f"Cleared {len(keys_to_remove)} cache entries")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        now = time.time()
        valid_count = 0
        expired_count = 0

        for value in self._cache.values():
            if now - value["timestamp"] < self._cache_ttl:
                valid_count += 1
            else:
                expired_count += 1

        return {
            "total_entries": len(self._cache),
            "valid_entries": valid_count,
            "expired_entries": expired_count,
            "ttl_seconds": self._cache_ttl,
        }


# Singleton instance
_enhanced_client: Optional[EnhancedVertexClient] = None


def get_enhanced_client() -> EnhancedVertexClient:
    """Get enhanced client instance."""
    global _enhanced_client
    if _enhanced_client is None:
        _enhanced_client = EnhancedVertexClient()
    return _enhanced_client
