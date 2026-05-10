"""
Ollama Client for local LLM inference
"""

import aiohttp
from typing import List, Dict, Optional


class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, str]],
        options: Optional[Dict] = None,
    ) -> Dict:
        """Send a chat request to Ollama"""
        session = await self._get_session()

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
        }

        if options:
            payload["options"] = options

        async with session.post(
            f"{self.base_url}/api/chat",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def generate(
        self,
        model: str,
        prompt: str,
        options: Optional[Dict] = None,
    ) -> Dict:
        """Send a generate request to Ollama"""
        session = await self._get_session()

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }

        if options:
            payload["options"] = options

        async with session.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=120),
        ) as response:
            response.raise_for_status()
            return await response.json()

    async def list_models(self) -> List[Dict]:
        """List available models"""
        session = await self._get_session()

        async with session.get(f"{self.base_url}/api/tags") as response:
            response.raise_for_status()
            data = await response.json()
            return data.get("models", [])

    async def close(self):
        """Close the session"""
        if self._session and not self._session.closed:
            await self._session.close()
