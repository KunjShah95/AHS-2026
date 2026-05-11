"""
LLM Integration Module
Supports multiple free and paid LLM providers
"""

import os
import json
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class LLMProvider(Enum):
    OPENAI = "openai"
    AZURE = "azure"
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    GROQ = "groq"
    COHERE = "cohere"
    MISTRAL = "mistral"
    BEDROCK = "bedrock"
    HUGGINGFACE = "huggingface"
    LMSTUDIO = "lmstudio"
    LOCALAI = "localai"
    OPENROUTER = "openrouter"
    CUSTOM = "custom"


PROVIDER_INFO = {
    LLMProvider.OPENAI: {
        "name": "OpenAI",
        "free_tier": False,
        "models": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
            "o1-preview",
            "o1-mini",
        ],
        "env_key": "OPENAI_API_KEY",
        "description": "GPT-4, GPT-4o models",
    },
    LLMProvider.AZURE: {
        "name": "Azure OpenAI",
        "free_tier": False,
        "models": ["gpt-4", "gpt-35-turbo"],
        "env_key": "AZURE_OPENAI_API_KEY",
        "description": "Microsoft Azure-hosted OpenAI",
    },
    LLMProvider.ANTHROPIC: {
        "name": "Anthropic",
        "free_tier": False,
        "models": [
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ],
        "env_key": "ANTHROPIC_API_KEY",
        "description": "Claude models",
    },
    LLMProvider.GOOGLE: {
        "name": "Google Gemini",
        "free_tier": True,
        "models": [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "gemini-2.0-flash",
        ],
        "env_key": "GEMINI_API_KEY",
        "description": "Free tier available",
    },
    LLMProvider.GROQ: {
        "name": "Groq",
        "free_tier": True,
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
        "env_key": "GROQ_API_KEY",
        "description": "Free tier with fast inference",
    },
    LLMProvider.COHERE: {
        "name": "Cohere",
        "free_tier": False,
        "models": ["command-r-plus", "command-r", "command"],
        "env_key": "COHERE_API_KEY",
        "description": "Command models",
    },
    LLMProvider.MISTRAL: {
        "name": "Mistral AI",
        "free_tier": True,
        "models": ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
        "env_key": "MISTRAL_API_KEY",
        "description": "Free tier available",
    },
    LLMProvider.BEDROCK: {
        "name": "AWS Bedrock",
        "free_tier": False,
        "models": [
            "anthropic.claude-3-sonnet",
            "anthropic.claude-3-haiku",
            "meta.llama3-70b",
            "amazon.titan-text",
        ],
        "env_key": "AWS_ACCESS_KEY_ID",
        "description": "Amazon AWS hosted models",
    },
    LLMProvider.HUGGINGFACE: {
        "name": "Hugging Face",
        "free_tier": True,
        "models": [
            "meta-llama/Llama-3.3-70B-Instruct",
            "meta-llama/Llama-3.1-70B-Instruct",
            "Qwen/Qwen2.5-72B-Instruct",
        ],
        "env_key": "HF_TOKEN",
        "description": "Free inference API tier",
    },
    LLMProvider.OLLAMA: {
        "name": "Ollama",
        "free_tier": True,
        "models": ["llama3.3", "llama3.1", "mistral", "codellama", "phi3", "qwen2.5"],
        "env_key": None,
        "description": "Local self-hosted models",
    },
    LLMProvider.LMSTUDIO: {
        "name": "LM Studio",
        "free_tier": True,
        "models": ["llama3", "mistral", "codellama"],
        "env_key": None,
        "description": "Local desktop app",
    },
    LLMProvider.LOCALAI: {
        "name": "LocalAI",
        "free_tier": True,
        "models": ["llama2", "mistral", "vicuna"],
        "env_key": None,
        "description": "Self-hosted API",
    },
    LLMProvider.OPENROUTER: {
        "name": "OpenRouter",
        "free_tier": True,
        "models": [
            "openai/gpt-4o",
            "openai/gpt-4o-mini",
            "anthropic/claude-3.5-sonnet",
            "meta-llama/llama-3.3-70b-instruct",
            "google/gemini-2.0-flash",
            "mistralai/mistral-small",
            "deepseek/deepseek-chat",
        ],
        "env_key": "OPENROUTER_API_KEY",
        "description": "Unified API to 300+ models - free credits available",
    },
    LLMProvider.CUSTOM: {
        "name": "Custom OpenAI-Compatible",
        "free_tier": True,
        "models": ["custom"],
        "env_key": None,
        "description": "Use any OpenAI-compatible API (LM Studio, LocalAI, Tabby, etc.)",
    },
}


@dataclass
class LLMConfig:
    provider: LLMProvider = LLMProvider.OPENAI
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 4096
    region: Optional[str] = None


@dataclass
class LLMResponse:
    content: str
    model: str
    usage: Dict[str, int]
    finish_reason: str


class LLMClient:
    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or self._load_config()
        self._client = None

    def _load_config(self) -> LLMConfig:
        provider = os.getenv("LLM_PROVIDER", "openai").lower()

        provider_map = {
            "openai": LLMProvider.OPENAI,
            "azure": LLMProvider.AZURE,
            "ollama": LLMProvider.OLLAMA,
            "anthropic": LLMProvider.ANTHROPIC,
            "google": LLMProvider.GOOGLE,
            "gemini": LLMProvider.GOOGLE,
            "groq": LLMProvider.GROQ,
            "cohere": LLMProvider.COHERE,
            "mistral": LLMProvider.MISTRAL,
            "bedrock": LLMProvider.BEDROCK,
            "huggingface": LLMProvider.HUGGINGFACE,
            "hf": LLMProvider.HUGGINGFACE,
            "lmstudio": LLMProvider.LMSTUDIO,
            "localai": LLMProvider.LOCALAI,
            "openrouter": LLMProvider.OPENROUTER,
            "custom": LLMProvider.CUSTOM,
        }

        config = LLMConfig(
            provider=provider_map.get(provider, LLMProvider.OPENAI),
            api_key=self._get_api_key(provider),
            endpoint=os.getenv("LLM_ENDPOINT"),
            model=os.getenv("LLM_MODEL", "gpt-4o"),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4096")),
            region=os.getenv("LLM_REGION"),
        )

        if config.provider == LLMProvider.AZURE:
            config.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        return config

    def _get_api_key(self, provider: str) -> Optional[str]:
        key_map = {
            "openai": "OPENAI_API_KEY",
            "azure": "AZURE_OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "google": "GEMINI_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "groq": "GROQ_API_KEY",
            "cohere": "COHERE_API_KEY",
            "mistral": "MISTRAL_API_KEY",
            "bedrock": "AWS_ACCESS_KEY_ID",
            "huggingface": "HF_TOKEN",
            "hf": "HF_TOKEN",
            "openrouter": "OPENROUTER_API_KEY",
            "custom": "OPENAI_API_KEY",
            "lmstudio": None,
            "localai": None,
            "ollama": None,
        }
        env_key = key_map.get(provider, "OPENAI_API_KEY")
        return os.getenv(env_key) if env_key else None

    def _get_client(self):
        if self._client is not None:
            return self._client

        if self.config.provider == LLMProvider.OPENAI:
            try:
                from openai import OpenAI

                self._client = OpenAI(
                    api_key=self.config.api_key,
                    base_url=self.config.endpoint,
                )
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.AZURE:
            try:
                from openai import AzureOpenAI

                self._client = AzureOpenAI(
                    api_key=self.config.api_key,
                    api_version="2024-02-01",
                    azure_endpoint=self.config.endpoint or "",
                )
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.OLLAMA:
            from .ollama_client import OllamaClient

            self._client = OllamaClient(
                self.config.endpoint or "http://localhost:11434"
            )

        elif self.config.provider == LLMProvider.GOOGLE:
            try:
                import google.generativeai as genai

                if self.config.api_key:
                    genai.configure(api_key=self.config.api_key)
                self._client = genai
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.ANTHROPIC:
            try:
                import anthropic

                self._client = anthropic.Anthropic(api_key=self.config.api_key)
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.GROQ:
            try:
                from groq import Groq

                self._client = Groq(api_key=self.config.api_key)
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.COHERE:
            try:
                import cohere

                self._client = cohere.Client(api_key=self.config.api_key)
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.MISTRAL:
            try:
                from mistralai import Mistral

                self._client = Mistral(api_key=self.config.api_key)
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.HUGGINGFACE:
            try:
                from huggingface_hub import InferenceClient

                self._client = InferenceClient(
                    model=self.config.endpoint or "meta-llama/Llama-3.3-70B-Instruct",
                    token=self.config.api_key,
                )
            except ImportError:
                self._client = None

        elif self.config.provider in [LLMProvider.LMSTUDIO, LLMProvider.LOCALAI]:
            endpoint = self.config.endpoint or "http://localhost:1234/v1"
            try:
                from openai import OpenAI

                self._client = OpenAI(
                    api_key="not-needed",
                    base_url=endpoint,
                )
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.OPENROUTER:
            try:
                from openai import OpenAI

                self._client = OpenAI(
                    api_key=self.config.api_key,
                    base_url="https://openrouter.ai/api/v1",
                )
            except ImportError:
                self._client = None

        elif self.config.provider == LLMProvider.CUSTOM:
            endpoint = self.config.endpoint or os.getenv("CUSTOM_LLM_ENDPOINT")
            if endpoint:
                try:
                    from openai import OpenAI

                    self._client = OpenAI(
                        api_key=self.config.api_key or "not-needed",
                        base_url=endpoint,
                    )
                except ImportError:
                    self._client = None

        return self._client

    async def complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Send a completion request to the LLM"""
        client = self._get_client()

        if client is None:
            return self._fallback_response(messages)

        try:
            provider = self.config.provider
            if provider == LLMProvider.OLLAMA:
                return await self._ollama_complete(messages, temperature, max_tokens)
            elif provider == LLMProvider.GOOGLE:
                return await self._google_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            elif provider == LLMProvider.ANTHROPIC:
                return await self._anthropic_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            elif provider == LLMProvider.GROQ:
                return await self._groq_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            elif provider == LLMProvider.COHERE:
                return await self._cohere_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            elif provider == LLMProvider.MISTRAL:
                return await self._mistral_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            elif provider == LLMProvider.HUGGINGFACE:
                return await self._hf_complete(messages, temperature, max_tokens)
            elif provider in [
                LLMProvider.LMSTUDIO,
                LLMProvider.LOCALAI,
                LLMProvider.OPENAI,
                LLMProvider.AZURE,
                LLMProvider.OPENROUTER,
                LLMProvider.CUSTOM,
            ]:
                return await self._openai_complete(
                    messages, system_prompt, temperature, max_tokens
                )
            else:
                return await self._openai_complete(
                    messages, system_prompt, temperature, max_tokens
                )
        except Exception as e:
            print(f"LLM error: {e}")
            return self._fallback_response(messages)

    async def _openai_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        response = client.chat.completions.create(
            model=self.config.model,
            messages=all_messages,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )

        return LLMResponse(
            content=response.choices[0].message.content or "",
            model=response.model,
            usage={
                "prompt": response.usage.prompt_tokens if response.usage else 0,
                "completion": response.usage.completion_tokens if response.usage else 0,
                "total": response.usage.total_tokens if response.usage else 0,
            },
            finish_reason=response.choices[0].finish_reason or "stop",
        )

    async def _ollama_complete(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        response = await client.chat(
            model=self.config.model,
            messages=messages,
            options={
                "temperature": temperature or self.config.temperature,
                "num_predict": max_tokens or self.config.max_tokens,
            },
        )

        return LLMResponse(
            content=response["message"]["content"],
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason="stop",
        )

    async def _google_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_content = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            all_content += f"{role}: {content}\n"

        if system_prompt:
            all_content = f"System: {system_prompt}\n\n{all_content}"

        response = client.generate_content(
            all_content,
            generation_config={
                "temperature": temperature or self.config.temperature,
                "max_output_tokens": max_tokens or self.config.max_tokens,
            },
        )

        return LLMResponse(
            content=response.text,
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason="stop",
        )

    async def _anthropic_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_content = ""
        if system_prompt:
            all_content = f"{system_prompt}\n\n"
        for msg in messages:
            all_content += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"

        response = client.messages.create(
            model=self.config.model,
            max_tokens=max_tokens or self.config.max_tokens,
            temperature=temperature or self.config.temperature,
            messages=[{"role": "user", "content": all_content}],
        )

        return LLMResponse(
            content=response.content[0].text,
            model=self.config.model,
            usage={
                "prompt": response.usage.input_tokens
                if hasattr(response, "usage")
                else 0,
                "completion": response.usage.output_tokens
                if hasattr(response, "usage")
                else 0,
                "total": response.usage.input_tokens + response.usage.output_tokens
                if hasattr(response, "usage")
                else 0,
            },
            finish_reason="stop",
        )

    async def _groq_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        response = client.chat.completions.create(
            model=self.config.model,
            messages=all_messages,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )

        return LLMResponse(
            content=response.choices[0].message.content or "",
            model=response.model,
            usage={
                "prompt": response.usage.prompt_tokens if response.usage else 0,
                "completion": response.usage.completion_tokens if response.usage else 0,
                "total": response.usage.total_tokens if response.usage else 0,
            },
            finish_reason=response.choices[0].finish_reason or "stop",
        )

    async def _cohere_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_content = ""
        if system_prompt:
            all_content = f"{system_prompt}\n\n"
        for msg in messages:
            all_content += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"

        response = client.generate(
            prompt=all_content,
            model=self.config.model,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )

        return LLMResponse(
            content=response.generations[0].text,
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason="stop",
        )

    async def _mistral_complete(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        response = client.chat.complete(
            model=self.config.model,
            messages=all_messages,
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason=response.choices[0].finish_reason or "stop",
        )

    async def _hf_complete(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float],
        max_tokens: Optional[int],
    ) -> LLMResponse:
        client = self._get_client()

        all_content = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            all_content += f"{role}: {content}\n"

        response = client.chat.completions.create(
            model=self.config.model,
            messages=[{"role": "user", "content": all_content}],
            temperature=temperature or self.config.temperature,
            max_tokens=max_tokens or self.config.max_tokens,
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason="stop",
        )

    def _fallback_response(self, messages: List[Dict[str, str]]) -> LLMResponse:
        """Fallback when LLM is not available"""
        last_message = messages[-1]["content"] if messages else ""

        return LLMResponse(
            content=f"[LLM not configured - would analyze: {last_message[:100]}...]",
            model=self.config.model,
            usage={"prompt": 0, "completion": 0, "total": 0},
            finish_reason="stop",
        )


async def analyze_with_llm(
    prompt: str,
    context: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """Convenience function to analyze code with LLM"""
    client = LLMClient()

    messages = []
    if context:
        messages.append(
            {"role": "user", "content": f"Context:\n```\n{context}\n```\n\n{prompt}"}
        )
    else:
        messages.append({"role": "user", "content": prompt})

    response = await client.complete(messages, system_prompt=system_prompt)
    return response.content


async def generate_wiki_content(
    file_path: str,
    code: str,
    entities: List[Dict[str, Any]],
) -> str:
    """Generate wiki content for a file using LLM"""
    client = LLMClient()

    system_prompt = """You are a code documentation expert. Generate clear, concise wiki-style documentation for code.
Focus on:
1. What the code does (purpose)
2. How it works (key concepts)
3. Dependencies and relationships
4. Usage examples where relevant"""

    entity_summary = "\n".join(
        [
            f"- {e.get('type', 'item')}: {e.get('name', 'unknown')}"
            for e in entities[:10]
        ]
    )

    messages = [
        {
            "role": "user",
            "content": f"""Generate wiki documentation for this file: {file_path}

Extracted entities:
{entity_summary}

Code:
```
{code[:2000]}
```

Provide a brief summary (2-3 paragraphs) explaining what this file does and its role in the codebase.""",
        }
    ]

    response = await client.complete(messages, system_prompt=system_prompt)
    return response.content


async def query_codebase(
    query: str,
    relevant_context: List[Dict[str, str]],
) -> str:
    """Answer questions about the codebase using relevant context"""
    client = LLMClient()

    system_prompt = """You are a code expert answering questions about a codebase.
Use the provided context to give accurate, specific answers.
If you don't know the answer, say so clearly."""

    context_text = "\n\n".join(
        [
            f"--- {ctx.get('source', 'source')} ---\n{ctx.get('content', '')}"
            for ctx in relevant_context[:5]
        ]
    )

    messages = [
        {
            "role": "user",
            "content": f"""Based on this codebase context:

{context_text}

Question: {query}

Provide a detailed answer, citing specific files and code where relevant.""",
        }
    ]

    response = await client.complete(
        messages, system_prompt=system_prompt, temperature=0.5
    )
    return response.content
