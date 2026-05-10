"""
LLM Integration Module
Supports OpenAI-compatible APIs (Azure OpenAI, Ollama, OpenAI, etc.)
"""

import os
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum


class LLMProvider(Enum):
    OPENAI = "openai"
    AZURE = "azure"
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"


@dataclass
class LLMConfig:
    provider: LLMProvider = LLMProvider.OPENAI
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 4096


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

        config = LLMConfig(
            provider=LLMProvider(provider)
            if provider in ["openai", "azure", "ollama", "anthropic"]
            else LLMProvider.OPENAI,
            api_key=os.getenv("OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_API_KEY"),
            endpoint=os.getenv("LLM_ENDPOINT"),
            model=os.getenv("LLM_MODEL", "gpt-4"),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.7")),
            max_tokens=int(os.getenv("LLM_MAX_TOKENS", "4096")),
        )

        if config.provider == LLMProvider.AZURE:
            config.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

        return config

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
            if self.config.provider == LLMProvider.OLLAMA:
                return await self._ollama_complete(messages, temperature, max_tokens)
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
