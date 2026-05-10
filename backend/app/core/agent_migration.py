"""
Agent Migration Compatibility Layer

This module provides a backwards-compatible interface for existing agents
to use the new universal AI client while gradually supporting multi-provider routing.

Agents can continue using existing code while getting multi-provider benefits.
"""

import json
import asyncio
from typing import Dict, Any, Optional, List
import logging
from uuid import UUID

from app.core.enhanced_universal_client import EnhancedUniversalAIClient, AIProvider
from app.core.multi_model_config import TaskType
from app.services.ai_cost_tracker import get_cost_tracker

logger = logging.getLogger(__name__)


class UnifiedAIClientAdapter:
    """
    Backwards-compatible adapter for our existing agents.
    
    Converts old unified_ai_client API calls to new enhanced_universal_client.
    
    Usage:
        client = UnifiedAIClientAdapter()
        
        # Old API still works
        result = client.generate_json(prompt, system_prompt)
        result = client.generate_text(prompt, system_prompt)
        
        # But now with multi-provider support behind the scenes!
    """
    
    def __init__(self):
        """Initialize the adapter."""
        self.universal_client = EnhancedUniversalAIClient()
        self.cost_tracker = get_cost_tracker()
        self.task_routing = {
            "architecture": TaskType.ARCHITECTURE_REVIEW,
            "code_review": TaskType.CODE_REVIEW,
            "code_generation": TaskType.CODE_GENERATION,
            "summarization": TaskType.SUMMARIZATION,
            "learning": TaskType.LEARNING_PATH,
            "quiz": TaskType.QUIZ_GENERATION,
            "security": TaskType.SECURITY_AUDIT,
            "reasoning": TaskType.AGENT_REASONING,
            "general": TaskType.SIMPLE_QA,
        }
    
    # ========================================================================
    # BACKWARDS-COMPATIBLE API (original unified_ai_client methods)
    # ========================================================================
    
    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        use_flash: bool = True,
        **kwargs
    ) -> str:
        """
        Generate text (backwards compatible with old unified_ai_client).
        
        Args:
            prompt: User prompt
            system_prompt: System context
            temperature: Response randomness
            max_tokens: Max response length
            use_flash: If True, prefer faster/cheaper models
            **kwargs: Additional arguments (ignored for compatibility)
        
        Returns:
            Generated text
        """
        return asyncio.run(
            self.generate_text_async(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                use_flash=use_flash,
                **kwargs
            )
        )
    
    async def generate_text_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        use_flash: bool = True,
        **kwargs
    ) -> str:
        """Async version of generate_text."""
        
        # Determine task type from prompt keywords
        task = self._infer_task_type(prompt)
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Select model based on preference
        max_budget = 0.1 if use_flash else 2.0  # Cheap if flash, moderate otherwise
        
        model, provider, _ = self.universal_client.select_optimal_model(
            task=task,
            max_budget=max_budget,
            prefer_speed=use_flash  # Flash = prioritize speed
        )
        
        # Generate
        response = await self.universal_client.generate_async(
            messages=messages,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Log cost tracking
        user_id = kwargs.get("user_id")
        project_id = kwargs.get("project_id")
        
        try:
            await self.cost_tracker.log_request(
                provider=str(provider) if hasattr(provider, 'value') else str(provider),
                model=response.get('model_used', model),
                input_tokens=response.get('input_tokens', 0),
                output_tokens=response.get('output_tokens', 0),
                actual_cost=response.get('cost', 0.0),
                user_id=user_id,
                project_id=project_id,
                task_type=task.value if hasattr(task, 'value') else str(task),
                status="completed",
                latency_ms=response.get('latency_ms'),
                prompt_text=prompt,
                response_length=len(response.get('content', '')),
                metadata={
                    "system_prompt": system_prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "use_flash": use_flash
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log cost tracking: {e}")
        
        logger.info(
            f"Generated text with {response['model_used']}, "
            f"cost: ${response['cost']:.6f}"
        )
        
        return response['content']
    
    def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 3000,
        use_flash: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate JSON output (backwards compatible).
        
        Args:
            prompt: User prompt (should ask for JSON output)
            system_prompt: System context
            temperature: Lower for consistent JSON
            max_tokens: Response length
            use_flash: Use faster/cheaper models if True
            **kwargs: Additional args
        
        Returns:
            Parsed JSON as dict
        """
        return asyncio.run(
            self.generate_json_async(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                use_flash=use_flash,
                **kwargs
            )
        )
    
    async def generate_json_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 3000,
        use_flash: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """Async version of generate_json."""
        
        # Ensure prompt asks for JSON
        if "json" not in prompt.lower():
            prompt += "\n\nRespond with valid JSON only. No markdown, no explanation."
        
        # Determine task type
        task = self._infer_task_type(prompt)
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Select model (prefer moderate model for JSON accuracy)
        max_budget = 0.5 if use_flash else 2.0
        
        model, provider, _ = self.universal_client.select_optimal_model(
            task=task,
            max_budget=max_budget,
            prefer_speed=use_flash
        )
        
        # Generate with JSON mode
        response = await self.universal_client.generate_async(
            messages=messages,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Parse JSON
        try:
            result = json.loads(response['content'])
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON response, attempting extraction")
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response['content'], re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                except:
                    result = {"raw_response": response['content']}
            else:
                result = {"raw_response": response['content']}
        
        # Log cost tracking
        user_id = kwargs.get("user_id")
        project_id = kwargs.get("project_id")
        
        try:
            await self.cost_tracker.log_request(
                provider=str(provider) if hasattr(provider, 'value') else str(provider),
                model=response.get('model_used', model),
                input_tokens=response.get('input_tokens', 0),
                output_tokens=response.get('output_tokens', 0),
                actual_cost=response.get('cost', 0.0),
                user_id=user_id,
                project_id=project_id,
                task_type=task.value if hasattr(task, 'value') else str(task),
                status="completed",
                latency_ms=response.get('latency_ms'),
                prompt_text=prompt,
                response_length=len(response.get('content', '')),
                metadata={
                    "system_prompt": system_prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "use_flash": use_flash,
                    "response_type": "json"
                }
            )
        except Exception as e:
            logger.warning(f"Failed to log cost tracking: {e}")
        
        logger.info(
            f"Generated JSON with {response['model_used']}, "
            f"cost: ${response['cost']:.6f}"
        )
        
        return result
    
    # ========================================================================
    # ENHANCED API (new multi-provider methods)
    # ========================================================================
    
    async def generate_with_routing(
        self,
        prompt: str,
        task: TaskType,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        max_budget: float = 1.0,
        prefer_speed: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate with intelligent routing based on task type.
        
        Args:
            prompt: User prompt
            task: Task type (for intelligent routing)
            system_prompt: System context
            temperature: Response randomness
            max_tokens: Max length
            max_budget: Max cost in USD per 1M tokens
            prefer_speed: Prefer faster models
            **kwargs: Additional args
        
        Returns:
            {
                "content": str,
                "model_used": str,
                "provider": str,
                "cost": float,
                "tokens": {...}
            }
        """
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Select optimal model
        model, provider, est_cost = self.universal_client.select_optimal_model(
            task=task,
            max_budget=max_budget,
            prefer_speed=prefer_speed
        )
        
        # Generate
        response = await self.universal_client.generate_async(
            messages=messages,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        logger.info(
            f"Routed {task.value} to {response['model_used']}, "
            f"cost: ${response['cost']:.6f}"
        )
        
        return response
    
    def get_available_providers(self) -> List[str]:
        """Get list of configured providers."""
        return [p.value for p in self.universal_client.get_available_providers()]
    
    async def get_provider_health(self) -> Dict[str, Any]:
        """Get health status of all providers."""
        providers = self.universal_client.get_available_providers()
        
        health = {}
        for provider in providers:
            provider_health = self.universal_client.get_provider_health(provider)
            health[provider.value] = {
                "success_rate": provider_health.success_rate,
                "avg_latency": provider_health.avg_latency,
                "total_requests": provider_health.total_requests,
                "status": "healthy" if provider_health.success_rate > 0.95 else "degraded"
            }
        
        return health
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    def _infer_task_type(self, prompt: str) -> TaskType:
        """Infer likely task type from prompt."""
        prompt_lower = prompt.lower()
        
        # Simple keyword matching
        if any(word in prompt_lower for word in ["architecture", "structure", "design"]):
            return TaskType.ARCHITECTURE_REVIEW
        elif any(word in prompt_lower for word in ["review", "check", "audit"]):
            return TaskType.CODE_REVIEW
        elif any(word in prompt_lower for word in ["generate", "write", "create", "function"]):
            return TaskType.CODE_GENERATION
        elif any(word in prompt_lower for word in ["summarize", "summary", "brief"]):
            return TaskType.SUMMARIZATION
        elif any(word in prompt_lower for word in ["learn", "path", "curriculum"]):
            return TaskType.LEARNING_PATH
        elif any(word in prompt_lower for word in ["quiz", "question", "test"]):
            return TaskType.QUIZ_GENERATION
        elif any(word in prompt_lower for word in ["security", "vulnerability", "exploit"]):
            return TaskType.SECURITY_AUDIT
        else:
            return TaskType.SIMPLE_QA


# Global singleton instance
_adapter_instance: Optional[UnifiedAIClientAdapter] = None


def get_unified_ai_client() -> UnifiedAIClientAdapter:
    """Get the global unified AI client adapter instance."""
    global _adapter_instance
    if _adapter_instance is None:
        _adapter_instance = UnifiedAIClientAdapter()
    return _adapter_instance


def reset_adapter():
    """Reset the global adapter (for testing)."""
    global _adapter_instance
    _adapter_instance = None


# Old function name for backwards compatibility
def get_ai_client() -> UnifiedAIClientAdapter:
    """Alias for get_unified_ai_client (backwards compatible)."""
    return get_unified_ai_client()


# Even older function name for MAX compatibility
def get_gemini_client() -> UnifiedAIClientAdapter:
    """
    Alias that was used in some agents.
    Despite the name, now returns universal client!
    """
    return get_unified_ai_client()


if __name__ == "__main__":
    async def test():
        """Test the adapter."""
        client = UnifiedAIClientAdapter()
        
        # Test text generation
        print("Testing text generation...")
        text = await client.generate_text_async(
            "What is Python?",
            system_prompt="You are a helpful tutor."
        )
        print(f"✅ Generated: {text[:100]}...")
        
        # Test JSON generation
        print("\nTesting JSON generation...")
        data = await client.generate_json_async(
            "List 3 Python libraries. Respond in JSON: {\"libraries\": [...]}",
            system_prompt="You are a helpful assistant."
        )
        print(f"✅ Generated JSON: {data}")
        
        # Test with routing
        print("\nTesting task-based routing...")
        result = await client.generate_with_routing(
            "Review this code: def add(a,b): return a+b",
            task=TaskType.CODE_REVIEW,
            max_budget=0.1  # Use cheap models
        )
        print(f"✅ Review: {result['content'][:100]}...")
        print(f"   Model: {result['model_used']}, Cost: ${result['cost']:.6f}")
        
        print("\n✅ All tests passed!")
    
    asyncio.run(test())
