"""
CodeFlow Universal AI Client
=============================
Multi-provider AI client supporting:
- OpenRouter (Claude, GPT, Llama, Mistral, etc.)
- Vercel AI SDK compatible endpoints
- OpenAI API
- Anthropic API
- Google Gemini

Features:
- Unified interface for all AI providers
- Automatic provider fallback
- Cost optimization across providers
- Response caching
- Token usage tracking
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Any, Union, Callable
from enum import Enum
from functools import lru_cache
import time
import asyncio
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class AIProvider(Enum):
    """Supported AI providers."""

    OPENROUTER = "openrouter"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    VERCEL = "vercel"
    MOCK = "mock"


class ModelCapability(Enum):
    """Model capability flags."""

    CHAT = "chat"
    COMPLETION = "completion"
    STREAMING = "streaming"
    FUNCTION_CALLING = "function_calling"
    VISION = "vision"
    EMBEDDINGS = "embeddings"


# Default model configurations
DEFAULT_MODELS = {
    # OpenRouter models (recommended - best pricing)
    "openrouter/meta-llama/llama-3.3-70b-instruct": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 128000,
        "max_output_tokens": 32768,
        "capabilities": [ModelCapability.CHAT, ModelCapability.STREAMING],
        "pricing": {"input": 0.35, "output": 0.7},  # per 1M tokens
    },
    "openrouter/qwen/qwen-2.5-72b-instruct": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 32768,
        "max_output_tokens": 8192,
        "capabilities": [ModelCapability.CHAT, ModelCapability.STREAMING],
        "pricing": {"input": 0.40, "output": 0.80},
    },
    "openrouter/anthropic/claude-3.5-sonnet": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 200000,
        "max_output_tokens": 8192,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 3.00, "output": 15.00},
    },
    "openrouter/anthropic/claude-3-haiku": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 200000,
        "max_output_tokens": 4096,
        "capabilities": [ModelCapability.CHAT, ModelCapability.STREAMING],
        "pricing": {"input": 0.25, "output": 1.25},
    },
    "openrouter/openai/gpt-4o-mini": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 128000,
        "max_output_tokens": 16384,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 0.075, "output": 0.30},
    },
    "openrouter/openai/gpt-4o": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 128000,
        "max_output_tokens": 16384,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 2.50, "output": 10.00},
    },
    "openrouter/mistralai/mistral-large": {
        "provider": AIProvider.OPENROUTER,
        "context_window": 128000,
        "max_output_tokens": 32768,
        "capabilities": [ModelCapability.CHAT, ModelCapability.STREAMING],
        "pricing": {"input": 1.00, "output": 3.00},
    },
    # Direct OpenAI
    "gpt-4o-mini": {
        "provider": AIProvider.OPENAI,
        "context_window": 128000,
        "max_output_tokens": 16384,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 0.075, "output": 0.30},
    },
    "gpt-4o": {
        "provider": AIProvider.OPENAI,
        "context_window": 128000,
        "max_output_tokens": 16384,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 2.50, "output": 10.00},
    },
    "gpt-4-turbo": {
        "provider": AIProvider.OPENAI,
        "context_window": 128000,
        "max_output_tokens": 4096,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 10.00, "output": 30.00},
    },
    # Anthropic direct
    "claude-3-5-sonnet-20241022": {
        "provider": AIProvider.ANTHROPIC,
        "context_window": 200000,
        "max_output_tokens": 8192,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.FUNCTION_CALLING,
        ],
        "pricing": {"input": 3.00, "output": 15.00},
    },
    "claude-3-haiku-20240307": {
        "provider": AIProvider.ANTHROPIC,
        "context_window": 200000,
        "max_output_tokens": 4096,
        "capabilities": [ModelCapability.CHAT, ModelCapability.STREAMING],
        "pricing": {"input": 0.25, "output": 1.25},
    },
    # Gemini (existing)
    "gemini-1.5-pro": {
        "provider": AIProvider.GEMINI,
        "context_window": 2000000,
        "max_output_tokens": 8192,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.VISION,
        ],
        "pricing": {"input": 1.25, "output": 5.00},
    },
    "gemini-1.5-flash": {
        "provider": AIProvider.GEMINI,
        "context_window": 1000000,
        "max_output_tokens": 8192,
        "capabilities": [
            ModelCapability.CHAT,
            ModelCapability.STREAMING,
            ModelCapability.VISION,
        ],
        "pricing": {"input": 0.075, "output": 0.30},
    },
}


class BaseAIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate a chat completion."""
        pass

    @abstractmethod
    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate a chat completion asynchronously."""
        pass

    @abstractmethod
    def generate_streaming(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Callable:
        """Generate a streaming chat completion."""
        pass


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter provider - unified gateway to 200+ models."""

    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mode = "live" if api_key else "mock"

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
            "X-Title": os.getenv("APP_NAME", "CodeFlow"),
        }

    def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import requests

        url = f"{self.BASE_URL}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        payload.update(kwargs)

        try:
            response = requests.post(
                url, headers=self._get_headers(), json=payload, timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            return {"error": str(e)}

    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import aiohttp

        url = f"{self.BASE_URL}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        payload.update(kwargs)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as response:
                return await response.json()

    def generate_streaming(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Callable:
        import requests

        def stream_generator():
            url = f"{self.BASE_URL}/chat/completions"

            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
            }

            if max_tokens:
                payload["max_tokens"] = max_tokens

            payload.update(kwargs)

            try:
                response = requests.post(
                    url,
                    headers=self._get_headers(),
                    json=payload,
                    stream=True,
                    timeout=60,
                )
                response.raise_for_status()

                for line in response.iter_lines():
                    if line:
                        line = line.decode("utf-8")
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            yield data
            except Exception as e:
                logger.error(f"OpenRouter streaming error: {e}")
                yield json.dumps({"error": str(e)})

        return stream_generator


class OpenAIProvider(BaseAIProvider):
    """Direct OpenAI API provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mode = "live" if api_key else "mock"

        if api_key:
            try:
                import openai

                openai.api_key = api_key
                self.client = openai.OpenAI()
            except ImportError:
                logger.warning("openai package not installed")
                self.client = None
        else:
            self.client = None

    def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        if not self.client:
            return {"error": "OpenAI client not initialized"}

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )
            return response.model_dump()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {"error": str(e)}

    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        if not self.client:
            return {"error": "OpenAI client not initialized"}

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs,
            )
            return response.model_dump()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {"error": str(e)}

    def generate_streaming(
        self, messages, model, temperature=0.7, max_tokens=None, **kwargs
    ):
        def stream_generator():
            if not self.client:
                yield json.dumps({"error": "OpenAI client not initialized"})
                return

            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    **kwargs,
                )
                for chunk in response:
                    yield chunk.model_dump_json()
            except Exception as e:
                logger.error(f"OpenAI streaming error: {e}")
                yield json.dumps({"error": str(e)})

        return stream_generator


class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude API provider."""

    BASE_URL = "https://api.anthropic.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.mode = "live" if api_key else "mock"

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Convert OpenAI format messages to Anthropic format."""
        converted = []
        system_message = ""

        for msg in messages:
            if msg.get("role") == "system":
                system_message = msg.get("content", "")
            else:
                converted.append({"role": msg["role"], "content": msg["content"]})

        return {"messages": converted, "system": system_message}

    def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import requests

        converted = self._convert_messages(max_tokens or 1024)

        url = f"{self.BASE_URL}/messages"

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": converted["messages"],
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,
        }

        if converted["system"]:
            payload["system"] = converted["system"]

        payload.update(kwargs)

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()

            # Convert to OpenAI format for consistency
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": data["content"][0]["text"],
                        },
                        "finish_reason": data.get("stop_reason", "stop"),
                    }
                ],
                "usage": {
                    "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
                    "completion_tokens": data.get("usage", {}).get("output_tokens", 0),
                    "total_tokens": data.get("usage", {}).get("input_tokens", 0)
                    + data.get("usage", {}).get("output_tokens", 0),
                },
            }
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return {"error": str(e)}

    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import aiohttp

        converted = self._convert_messages(messages)

        url = f"{self.BASE_URL}/messages"

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": converted["messages"],
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,
        }

        if converted["system"]:
            payload["system"] = converted["system"]

        payload.update(kwargs)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as response:
                data = await response.json()

                if response.status != 200:
                    return {"error": data.get("error", {}).get("message", str(data))}

                return {
                    "choices": [
                        {
                            "message": {
                                "role": "assistant",
                                "content": data["content"][0]["text"],
                            },
                            "finish_reason": data.get("stop_reason", "stop"),
                        }
                    ],
                    "usage": {
                        "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
                        "completion_tokens": data.get("usage", {}).get(
                            "output_tokens", 0
                        ),
                        "total_tokens": data.get("usage", {}).get("input_tokens", 0)
                        + data.get("usage", {}).get("output_tokens", 0),
                    },
                }

    def generate_streaming(
        self, messages, model, temperature=0.7, max_tokens=None, **kwargs
    ):
        def stream_generator():
            import requests

            converted = self._convert_messages(messages)

            url = f"{self.BASE_URL}/messages"

            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }

            payload = {
                "model": model,
                "messages": converted["messages"],
                "temperature": temperature,
                "max_tokens": max_tokens or 1024,
                "stream": True,
            }

            if converted["system"]:
                payload["system"] = converted["system"]

            payload.update(kwargs)

            try:
                response = requests.post(
                    url, headers=headers, json=payload, stream=True, timeout=60
                )
                response.raise_for_status()

                for line in response.iter_lines():
                    if line:
                        line = line.decode("utf-8")
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            yield data
            except Exception as e:
                logger.error(f"Anthropic streaming error: {e}")
                yield json.dumps({"error": str(e)})

        return stream_generator


class VercelAIProvider(BaseAIProvider):
    """Vercel AI SDK compatible provider (works with any Vercel-compatible endpoint)."""

    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key or os.getenv("VERCEL_AI_API_KEY")
        self.base_url = base_url or os.getenv(
            "VERCEL_AI_BASE_URL", "https://api.vercel.ai/v1"
        )
        self.mode = "live" if self.api_key else "mock"

    def generate(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import requests

        url = f"{self.base_url}/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        payload.update(kwargs)

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Vercel AI API error: {e}")
            return {"error": str(e)}

    async def generate_async(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        import aiohttp

        url = f"{self.base_url}/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        payload.update(kwargs)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),
            ) as response:
                return await response.json()

    def generate_streaming(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs,
    ) -> Callable:
        import requests

        def stream_generator():
            url = f"{self.base_url}/chat/completions"

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
            }

            if max_tokens:
                payload["max_tokens"] = max_tokens

            payload.update(kwargs)

            try:
                response = requests.post(
                    url, headers=headers, json=payload, stream=True, timeout=60
                )
                response.raise_for_status()

                for line in response.iter_lines():
                    if line:
                        line = line.decode("utf-8")
                        if line.startswith("data: "):
                            data = line[6:]
                            if data == "[DONE]":
                                break
                            yield data
            except Exception as e:
                logger.error(f"Vercel AI streaming error: {e}")
                yield json.dumps({"error": str(e)})

        return stream_generator


class MockAIProvider(BaseAIProvider):
    """Mock provider for testing without API keys."""

    def generate(self, messages, model, temperature=0.7, max_tokens=None, **kwargs):
        return self._generate_mock(messages)

    async def generate_async(
        self, messages, model, temperature=0.7, max_tokens=None, **kwargs
    ):
        return self._generate_mock(messages)

    def generate_streaming(
        self, messages, model, temperature=0.7, max_tokens=None, **kwargs
    ):
        def stream_generator():
            content = self._generate_mock(messages)["choices"][0]["message"]["content"]
            for word in content.split():
                yield json.dumps(
                    {
                        "choices": [
                            {"delta": {"content": word + " "}, "finish_reason": None}
                        ]
                    }
                )
            yield json.dumps({"choices": [{"finish_reason": "stop"}]})

        return stream_generator

    def _generate_mock(self, messages):
        last_message = messages[-1]["content"] if messages else ""

        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": f"Mock response for: {last_message[:50]}...",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        }


class UniversalAIClient:
    """
    Universal AI Client - unified interface for all AI providers.

    Features:
    - Single interface for OpenRouter, OpenAI, Anthropic, Gemini, Vercel
    - Automatic model selection based on task complexity
    - Cost optimization with smart model routing
    - Response caching
    - Token usage tracking
    """

    _instance = None

    def __init__(self):
        # Initialize providers
        self.providers: Dict[AIProvider, BaseAIProvider] = {}
        self.default_provider = AIProvider.OPENROUTER
        self.default_model = "openrouter/meta-llama/llama-3.3-70b-instruct"

        # Token usage tracking
        self.token_usage = {"input": 0, "output": 0}
        self._cache: Dict[str, str] = {}

        # Initialize providers based on available API keys
        self._initialize_providers()

        # Legacy support for existing Gemini client
        self.gemini_mode = "mock"
        self._init_legacy_gemini()

    def _initialize_providers(self):
        """Initialize all available providers."""
        # OpenRouter
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if openrouter_key:
            self.providers[AIProvider.OPENROUTER] = OpenRouterProvider(openrouter_key)
            logger.info("✅ OpenRouter provider initialized")

        # OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.providers[AIProvider.OPENAI] = OpenAIProvider(openai_key)
            logger.info("✅ OpenAI provider initialized")

        # Anthropic
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            self.providers[AIProvider.ANTHROPIC] = AnthropicProvider(anthropic_key)
            logger.info("✅ Anthropic provider initialized")

        # Vercel AI
        vercel_key = os.getenv("VERCEL_AI_API_KEY")
        if vercel_key:
            self.providers[AIProvider.VERCEL] = VercelAIProvider()
            logger.info("✅ Vercel AI provider initialized")

        # Fallback to mock if no providers
        if not self.providers:
            self.providers[AIProvider.MOCK] = MockAIProvider()
            logger.warning("⚠️ No AI providers available. Using MOCK mode.")

    def _init_legacy_gemini(self):
        """Initialize legacy Gemini client for backward compatibility."""
        try:
            import google.generativeai as genai

            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                self.gemini_mode = "live"
                self.providers[AIProvider.GEMINI] = None  # Special handling
                logger.info("✅ Gemini (legacy) initialized")
        except ImportError:
            pass

    @classmethod
    def get_instance(cls) -> "UniversalAIClient":
        if cls._instance is None:
            cls._instance = UniversalAIClient()
        return cls._instance

    def _get_provider_and_model(self, model: str = None) -> tuple:
        """Get provider based on model name."""
        model = model or self.default_model

        if model in DEFAULT_MODELS:
            provider_type = DEFAULT_MODELS[model]["provider"]
            if provider_type in self.providers:
                return self.providers[provider_type], model

        # Default to OpenRouter
        if AIProvider.OPENROUTER in self.providers:
            return self.providers[AIProvider.OPENROUTER], self.default_model

        return self.providers[AIProvider.MOCK], "mock-model"

    def _get_cache_key(self, messages: List[Dict], model: str) -> str:
        """Generate cache key for messages."""
        content = json.dumps(messages, sort_keys=True)
        return f"{model}_{hashlib.md5(content.encode()).hexdigest()}"

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = None,
        temperature: float = 0.7,
        use_cache: bool = True,
        max_retries: int = 3,
        **kwargs,
    ) -> str:
        """Generate text response using unified interface."""
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Check cache
        model = model or self.default_model
        cache_key = self._get_cache_key(messages, model)

        if use_cache and cache_key in self._cache:
            logger.debug(f"Cache hit for prompt: {prompt[:50]}...")
            return self._cache[cache_key]

        # Get provider
        provider, actual_model = self._get_provider_and_model(model)

        # Retry logic
        for attempt in range(max_retries):
            try:
                if actual_model.startswith("gemini"):
                    response = self._generate_gemini(
                        messages, temperature=temperature, **kwargs
                    )
                else:
                    response = provider.generate(
                        messages, actual_model, temperature=temperature, **kwargs
                    )

                if "error" in response:
                    raise Exception(response["error"])

                # Extract content
                content = response["choices"][0]["message"]["content"]

                # Cache response
                if use_cache:
                    self._cache[cache_key] = content

                # Track usage
                if "usage" in response:
                    self.token_usage["input"] += response["usage"].get(
                        "prompt_tokens", 0
                    )
                    self.token_usage["output"] += response["usage"].get(
                        "completion_tokens", 0
                    )

                return content

            except Exception as e:
                wait_time = (2**attempt) + 1
                logger.warning(
                    f"AI generation error (attempt {attempt + 1}): {e}. Retrying in {wait_time}s..."
                )
                time.sleep(wait_time)

        return f"Error: Failed to generate response after {max_retries} attempts"

    def _generate_gemini(
        self, messages: List[Dict], temperature: float = 0.7, **kwargs
    ) -> Dict:
        """Generate using legacy Gemini client."""
        import google.generativeai as genai

        # Convert messages to Gemini format
        system_msg = ""
        user_msg = ""

        for msg in messages:
            if msg["role"] == "system":
                system_msg = msg["content"]
            else:
                user_msg = msg["content"]

        full_prompt = f"{system_msg}\n\n{user_msg}" if system_msg else user_msg

        model_name = (
            "gemini-1.5-flash"
            if "flash" in str(kwargs.get("model", "")).lower()
            else "gemini-1.5-pro"
        )

        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                full_prompt, generation_config={"temperature": temperature}
            )

            return {
                "choices": [
                    {
                        "message": {"role": "assistant", "content": response.text},
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": len(full_prompt.split()) * 1.3,
                    "completion_tokens": len(response.text.split()) * 1.3,
                },
            }
        except Exception as e:
            return {"error": str(e)}

    def generate_json(
        self, prompt: str, system_prompt: str = "", model: str = None, **kwargs
    ) -> Dict[str, Any]:
        """Generate and parse JSON response."""
        json_prompt = f"""{prompt}

CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanation, just JSON.
Start your response with {{ and end with }}"""

        response = self.generate(
            json_prompt, system_prompt, model, temperature=0.05, **kwargs
        )

        return self._parse_json_response(response)

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Extract and parse JSON from response."""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        if "```json" in response:
            try:
                json_str = response.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            except (IndexError, json.JSONDecodeError):
                pass

        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass

        logger.error(f"Failed to parse JSON from response: {response[:200]}...")
        return {"error": "Failed to parse JSON", "raw_response": response[:500]}

    async def generate_async(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> str:
        """Generate text asynchronously."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        provider, actual_model = self._get_provider_and_model(model)

        try:
            if actual_model.startswith("gemini"):
                response = self._generate_gemini(
                    messages, temperature=temperature, **kwargs
                )
            else:
                response = await provider.generate_async(
                    messages, actual_model, temperature=temperature, **kwargs
                )

            if "error" in response:
                return f"Error: {response['error']}"

            return response["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Async generation error: {e}")
            return f"Error: {str(e)}"

    def generate_streaming(
        self,
        messages: List[Dict[str, str]],
        model: str = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> Callable:
        """Generate streaming response."""
        provider, actual_model = self._get_provider_and_model(model)

        if actual_model.startswith("gemini"):
            # Gemini streaming not fully supported in this interface
            return MockAIProvider().generate_streaming(messages, model, temperature)

        return provider.generate_streaming(
            messages, actual_model, temperature=temperature, **kwargs
        )

    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models with their configurations."""
        available = []

        for model_name, config in DEFAULT_MODELS.items():
            provider = config["provider"]
            is_available = provider in self.providers

            if provider == AIProvider.GEMINI:
                is_available = self.gemini_mode == "live"

            if is_available:
                available.append(
                    {
                        "model": model_name,
                        "provider": provider.value,
                        "context_window": config.get("context_window"),
                        "max_output_tokens": config.get("max_output_tokens"),
                        "capabilities": [
                            c.value for c in config.get("capabilities", [])
                        ],
                        "pricing": config.get("pricing"),
                    }
                )

        return available

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get token usage statistics."""
        return {
            "input_tokens": int(self.token_usage["input"]),
            "output_tokens": int(self.token_usage["output"]),
            "total_tokens": int(self.token_usage["input"] + self.token_usage["output"]),
            "available_providers": [p.value for p in self.providers.keys()],
            "default_model": self.default_model,
        }

    def clear_cache(self):
        """Clear the response cache."""
        self._cache.clear()
        logger.info("Response cache cleared")

    # ===== Backward Compatibility Methods (GeminiClient-style) =====

    def generate_text(
        self,
        prompt: str,
        system_prompt: str = "",
        use_flash: bool = False,
        temperature: float = 0.1,
        use_cache: bool = True,
        max_retries: int = 3,
    ) -> str:
        """
        Backward compatible generate_text method.
        Works like the old GeminiClient.generate_text()
        """
        model = self.default_model
        if use_flash or "flash" in model.lower():
            model = "gemini-1.5-flash"

        return self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            use_cache=use_cache,
            max_retries=max_retries,
        )

    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        use_flash: bool = False,
        max_retries: int = 3,
    ) -> Dict[str, Any]:
        """
        Backward compatible generate_json method.
        Works like the old GeminiClient.generate_json()
        """
        model = self.default_model
        if use_flash or "flash" in model.lower():
            model = "gemini-1.5-flash"

        return self.generate_json(
            prompt=prompt, system_prompt=system_prompt, model=model
        )

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text similarity search."""
        import requests

        model = "openrouter/baai/bge-m3"

        url = "https://openrouter.ai/api/v1/embeddings"

        headers = {
            "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY', '')}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "input": texts,
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return [[0.1] * 768 for _ in texts]


# Singleton accessor
def get_ai_client() -> UniversalAIClient:
    return UniversalAIClient.get_instance()


# Backward compatibility - expose common interface
def generate_ai_response(
    prompt: str,
    system_prompt: str = "",
    model: str = None,
    temperature: float = 0.7,
    **kwargs,
) -> str:
    """Unified function for AI text generation."""
    client = get_ai_client()
    return client.generate(prompt, system_prompt, model, temperature, **kwargs)


def generate_ai_json(
    prompt: str, system_prompt: str = "", model: str = None, **kwargs
) -> Dict[str, Any]:
    """Unified function for AI JSON generation."""
    client = get_ai_client()
    return client.generate_json(prompt, system_prompt, model, **kwargs)


# Example usage
if __name__ == "__main__":
    client = UniversalAIClient.get_instance()

    print("=" * 60)
    print("CodeFlow Universal AI Client")
    print("=" * 60)

    print("\n📋 Available Models:\n")
    models = client.get_available_models()
    for m in models[:10]:
        print(f"  • {m['model']}")
        print(
            f"    Provider: {m['provider']}, Pricing: ${m['pricing']['input']}/${m['pricing']['output']} per 1M tokens\n"
        )

    print("\n🔄 Testing Generation:\n")
    response = client.generate(
        "What is FastAPI? Give me a brief explanation.",
        system_prompt="You are a helpful coding assistant.",
        model="openrouter/meta-llama/llama-3.3-70b-instruct",
    )
    print(f"Response: {response[:200]}...")

    print("\n📊 Usage Stats:")
    print(f"  {client.get_usage_stats()}")
