"""
AI Helper Module - Simplified Universal AI Client Usage

This module provides easy-to-use helper functions for common AI operations.
No need to understand the full UniversalAIClient interface - just call these!

Quick Examples:
    # Simple text generation
    response = await ai_generate("Review this code: def add(a,b): return a+b")
    
    # Code review with automatic cheap model selection
    review = await ai_code_review(code_string)
    
    # Architecture analysis with premium model
    analysis = await ai_analyze_architecture(architecture_docs, use_premium=True)
"""

import os
import asyncio
from typing import Optional, Dict, Any, List, Union
from enum import Enum

# Import the universal client and config
from .enhanced_universal_client import EnhancedUniversalAIClient
from .multi_model_config import TaskType, AIProvider, ModelTier

# Global client instance (lazy initialization)
_global_client: Optional[EnhancedUniversalAIClient] = None


def get_ai_client() -> EnhancedUniversalAIClient:
    """
    Get or create the global AI client instance.
    
    Returns:
        EnhancedUniversalAIClient: The global AI client
    """
    global _global_client
    if _global_client is None:
        _global_client = EnhancedUniversalAIClient()
    return _global_client


# ============================================================================
# SIMPLE TEXT GENERATION
# ============================================================================

async def ai_generate(
    prompt: str,
    task: Optional[TaskType] = None,
    max_budget: float = 1.0,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    prefer_speed: bool = False,
    use_premium: bool = False
) -> Dict[str, Any]:
    """
    Generate AI response with automatic model selection.
    
    Args:
        prompt: The prompt to send to the AI
        task: Task type for intelligent routing (optional)
        max_budget: Maximum cost per 1M tokens (default: $1.00)
        temperature: Response randomness 0-1 (default: 0.7)
        max_tokens: Maximum response length (default: 2000)
        prefer_speed: Prefer faster models (default: False)
        use_premium: Force premium model for quality (default: False)
    
    Returns:
        {
            "content": str,          # The generated text
            "model_used": str,       # Which model was used
            "provider": str,         # Which provider
            "cost": float,           # Actual cost in USD
            "tokens": {
                "input": int,
                "output": int,
                "total": int
            }
        }
    
    Example:
        >>> response = await ai_generate("Explain async/await in Python")
        >>> print(response["content"])
        >>> print(f"Cost: ${response['cost']:.6f}")
    """
    client = get_ai_client()
    
    # Adjust budget for premium models
    if use_premium:
        max_budget = 15.0  # Allow premium models
    
    # Select optimal model
    model, provider, est_cost = client.select_optimal_model(
        task=task or TaskType.SIMPLE_QA,
        max_budget=max_budget,
        prefer_speed=prefer_speed
    )
    
    # Generate
    messages = [{"role": "user", "content": prompt}]
    response = await client.generate_async(
        messages=messages,
        model=model,
        provider=provider,
        temperature=temperature,
        max_tokens=max_tokens
    )
    
    return response


def ai_generate_sync(
    prompt: str,
    task: Optional[TaskType] = None,
    max_budget: float = 1.0,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> Dict[str, Any]:
    """
    Synchronous version of ai_generate.
    
    Example:
        >>> response = ai_generate_sync("What is 2+2?")
        >>> print(response["content"])
    """
    return asyncio.run(ai_generate(prompt, task, max_budget, temperature, max_tokens))


async def ai_generate_streaming(
    prompt: str,
    task: Optional[TaskType] = None,
    max_budget: float = 1.0,
    temperature: float = 0.7,
    max_tokens: int = 2000
):
    """
    Generate AI response with streaming (for real-time output).
    
    Yields:
        str: Chunks of the response as they arrive
    
    Example:
        >>> async for chunk in ai_generate_streaming("Write a story"):
        >>>     print(chunk, end="", flush=True)
    """
    client = get_ai_client()
    
    model, provider, _ = client.select_optimal_model(
        task=task or TaskType.SIMPLE_QA,
        max_budget=max_budget
    )
    
    messages = [{"role": "user", "content": prompt}]
    
    async for chunk in client.generate_streaming(
        messages=messages,
        model=model,
        provider=provider,
        temperature=temperature,
        max_tokens=max_tokens
    ):
        yield chunk


# ============================================================================
# CODE-SPECIFIC HELPERS
# ============================================================================

async def ai_code_review(
    code: str,
    language: Optional[str] = None,
    focus: Optional[str] = None
) -> Dict[str, Any]:
    """
    Review code with automatic cheap model selection.
    
    Args:
        code: The code to review
        language: Programming language (optional, for better context)
        focus: What to focus on: "security", "performance", "style", "all"
    
    Returns:
        {
            "content": str,     # The review with suggestions
            "model_used": str,
            "cost": float
        }
    
    Example:
        >>> code = "def add(a,b):\\n    return a+b"
        >>> review = await ai_code_review(code, language="python")
        >>> print(review["content"])
    """
    prompt = f"Review this code"
    if language:
        prompt += f" ({language})"
    if focus:
        prompt += f" focusing on {focus}"
    prompt += f":\\n\\n```\\n{code}\\n```\\n\\nProvide constructive feedback."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.CODE_REVIEW,
        max_budget=0.20,  # Use cheap model
        temperature=0.3,  # Lower randomness for technical tasks
        max_tokens=1500
    )


async def ai_code_generate(
    description: str,
    language: str = "python",
    include_tests: bool = False,
    include_docs: bool = True
) -> Dict[str, Any]:
    """
    Generate code from description.
    
    Args:
        description: What the code should do
        language: Target programming language
        include_tests: Whether to include unit tests
        include_docs: Whether to include documentation
    
    Returns:
        {
            "content": str,     # The generated code
            "model_used": str,
            "cost": float
        }
    
    Example:
        >>> result = await ai_code_generate(
        ...     "Binary search algorithm",
        ...     language="python",
        ...     include_tests=True
        ... )
        >>> print(result["content"])
    """
    prompt = f"Generate {language} code for: {description}\\n\\n"
    
    if include_docs:
        prompt += "Include comprehensive documentation/comments.\\n"
    if include_tests:
        prompt += "Include unit tests.\\n"
    
    prompt += f"\\nProvide clean, production-ready {language} code."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.CODE_GENERATION,
        max_budget=0.50,  # Mid-tier model for quality
        temperature=0.4,
        max_tokens=3000
    )


async def ai_explain_code(
    code: str,
    language: Optional[str] = None,
    depth: str = "simple"
) -> Dict[str, Any]:
    """
    Explain what code does.
    
    Args:
        code: The code to explain
        language: Programming language (optional)
        depth: "simple", "detailed", or "expert"
    
    Example:
        >>> explanation = await ai_explain_code(
        ...     "lambda x: x**2",
        ...     language="python",
        ...     depth="simple"
        ... )
        >>> print(explanation["content"])
    """
    depth_prompts = {
        "simple": "Explain simply, as if to a beginner",
        "detailed": "Provide a detailed explanation with examples",
        "expert": "Provide expert-level analysis including time/space complexity"
    }
    
    prompt = f"{depth_prompts.get(depth, depth_prompts['simple'])}:\\n\\n"
    if language:
        prompt += f"({language}) "
    prompt += f"```\\n{code}\\n```"
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.CODE_SUMMARY,
        max_budget=0.15,  # Very cheap for explanations
        temperature=0.5,
        max_tokens=1000
    )


async def ai_fix_code(
    code: str,
    error: Optional[str] = None,
    language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fix buggy code.
    
    Args:
        code: The code with bugs
        error: The error message (if available)
        language: Programming language
    
    Example:
        >>> fixed = await ai_fix_code(
        ...     "def divide(a,b): return a/b",
        ...     error="ZeroDivisionError",
        ...     language="python"
        ... )
        >>> print(fixed["content"])
    """
    prompt = f"Fix this code"
    if language:
        prompt += f" ({language})"
    prompt += f":\\n\\n```\\n{code}\\n```\\n\\n"
    
    if error:
        prompt += f"Error encountered: {error}\\n\\n"
    
    prompt += "Provide the fixed code with explanation of what was wrong."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.CODE_GENERATION,
        max_budget=0.30,
        temperature=0.3,
        max_tokens=2000
    )


# ============================================================================
# ANALYSIS HELPERS
# ============================================================================

async def ai_analyze_architecture(
    architecture_docs: str,
    focus: str = "general",
    use_premium: bool = True
) -> Dict[str, Any]:
    """
    Analyze software architecture.
    
    Args:
        architecture_docs: Architecture documentation/diagrams/code
        focus: "security", "scalability", "performance", "general"
        use_premium: Use premium model for better analysis (default: True)
    
    Example:
        >>> analysis = await ai_analyze_architecture(
        ...     architecture_docs=docs,
        ...     focus="scalability"
        ... )
    """
    prompt = f"Analyze this software architecture"
    if focus != "general":
        prompt += f" focusing on {focus}"
    prompt += f":\\n\\n{architecture_docs}\\n\\nProvide detailed analysis."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.AGENT_REASONING,
        use_premium=use_premium,
        temperature=0.5,
        max_tokens=4000
    )


async def ai_security_audit(
    code_or_config: str,
    audit_type: str = "code"
) -> Dict[str, Any]:
    """
    Security audit of code or configuration.
    
    Args:
        code_or_config: Code or config to audit
        audit_type: "code", "config", "api", "dependencies"
    
    Example:
        >>> audit = await ai_security_audit(code, audit_type="code")
        >>> print(audit["content"])
    """
    prompt = f"Perform security audit on this {audit_type}:\\n\\n"
    prompt += f"```\\n{code_or_config}\\n```\\n\\n"
    prompt += "Identify vulnerabilities, security risks, and provide remediation steps."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.SECURITY_AUDIT,
        max_budget=2.0,  # Moderate model for security
        temperature=0.3,
        max_tokens=3000
    )


async def ai_summarize(
    text: str,
    length: str = "medium",
    style: str = "bullet"
) -> Dict[str, Any]:
    """
    Summarize text.
    
    Args:
        text: Text to summarize
        length: "short" (2-3 sentences), "medium" (paragraph), "long" (detailed)
        style: "bullet" (bullet points), "paragraph", "technical"
    
    Example:
        >>> summary = await ai_summarize(long_text, length="short")
        >>> print(summary["content"])
    """
    length_guide = {
        "short": "2-3 sentences",
        "medium": "one paragraph",
        "long": "detailed summary with key points"
    }
    
    prompt = f"Summarize this text in {length_guide.get(length, 'a paragraph')}:\\n\\n"
    prompt += f"{text}\\n\\n"
    
    if style == "bullet":
        prompt += "Format as bullet points."
    elif style == "technical":
        prompt += "Focus on technical details and key facts."
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.SUMMARIZATION,
        max_budget=0.10,  # Very cheap for summaries
        temperature=0.5,
        max_tokens=500 if length == "short" else 1500
    )


# ============================================================================
# LEARNING/EDUCATION HELPERS
# ============================================================================

async def ai_create_learning_path(
    topic: str,
    skill_level: str = "beginner",
    duration: str = "1 month"
) -> Dict[str, Any]:
    """
    Create a learning path/curriculum.
    
    Args:
        topic: What to learn
        skill_level: "beginner", "intermediate", "advanced"
        duration: How long ("1 week", "1 month", "3 months")
    
    Example:
        >>> path = await ai_create_learning_path(
        ...     "Machine Learning",
        ...     skill_level="beginner",
        ...     duration="3 months"
        ... )
    """
    prompt = f"Create a {duration} learning path for {skill_level} to learn {topic}.\\n\\n"
    prompt += "Include:\\n"
    prompt += "- Weekly milestones\\n"
    prompt += "- Recommended resources\\n"
    prompt += "- Projects to build\\n"
    prompt += "- Skills to master"
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.LEARNING_PATH,
        max_budget=1.0,
        temperature=0.7,
        max_tokens=3000
    )


async def ai_generate_quiz(
    topic: str,
    difficulty: str = "medium",
    num_questions: int = 5
) -> Dict[str, Any]:
    """
    Generate quiz questions.
    
    Args:
        topic: Quiz topic
        difficulty: "easy", "medium", "hard"
        num_questions: Number of questions
    
    Example:
        >>> quiz = await ai_generate_quiz("Python basics", difficulty="easy", num_questions=10)
    """
    prompt = f"Generate {num_questions} {difficulty} quiz questions about {topic}.\\n\\n"
    prompt += "Format:\\n"
    prompt += "Question: [question]\\n"
    prompt += "A) [option]\\n"
    prompt += "B) [option]\\n"
    prompt += "C) [option]\\n"
    prompt += "D) [option]\\n"
    prompt += "Answer: [correct option]\\n"
    prompt += "Explanation: [why]\\n\\n"
    
    return await ai_generate(
        prompt=prompt,
        task=TaskType.QUIZ_GENERATION,
        max_budget=0.50,
        temperature=0.7,
        max_tokens=2000
    )


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

async def ai_chat(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    provider: Optional[AIProvider] = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> Dict[str, Any]:
    """
    Multi-turn chat with conversation history.
    
    Args:
        messages: List of {"role": "user"|"assistant", "content": "..."}
        model: Specific model to use (optional)
        provider: Specific provider to use (optional)
        temperature: Response randomness
        max_tokens: Max response length
    
    Example:
        >>> messages = [
        ...     {"role": "user", "content": "What is Python?"},
        ...     {"role": "assistant", "content": "Python is a programming language."},
        ...     {"role": "user", "content": "What can I build with it?"}
        ... ]
        >>> response = await ai_chat(messages)
    """
    client = get_ai_client()
    
    if model and provider:
        # Use specific model/provider
        response = await client.generate_async(
            messages=messages,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens
        )
    else:
        # Auto-select
        model, provider, _ = client.select_optimal_model(
            task=TaskType.SIMPLE_QA,
            max_budget=1.0
        )
        response = await client.generate_async(
            messages=messages,
            model=model,
            provider=provider,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    return response


def get_available_providers() -> List[str]:
    """
    Get list of configured AI providers.
    
    Returns:
        List of provider names that are ready to use
    
    Example:
        >>> providers = get_available_providers()
        >>> print(f"Available: {', '.join(providers)}")
    """
    client = get_ai_client()
    return [p.value for p in client.get_available_providers()]


def estimate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int
) -> float:
    """
    Estimate cost before making request.
    
    Args:
        model: Model ID (e.g., "gpt-4o", "deepseek-chat")
        input_tokens: Number of input tokens
        output_tokens: Expected output tokens
    
    Returns:
        Estimated cost in USD
    
    Example:
        >>> cost = estimate_cost("deepseek-chat", 1000, 500)
        >>> print(f"Estimated: ${cost:.6f}")
    """
    client = get_ai_client()
    return client.estimate_request_cost(model, input_tokens, output_tokens)


async def get_provider_status() -> Dict[str, Any]:
    """
    Get health status of all providers.
    
    Returns:
        {
            "provider_name": {
                "success_rate": float,
                "avg_latency": float,
                "total_requests": int,
                "status": "healthy"|"degraded"|"down"
            },
            ...
        }
    
    Example:
        >>> status = await get_provider_status()
        >>> for provider, health in status.items():
        >>>     print(f"{provider}: {health['status']}")
    """
    client = get_ai_client()
    providers = client.get_available_providers()
    
    status = {}
    for provider in providers:
        health = client.get_provider_health(provider)
        status[provider.value] = {
            "success_rate": health.success_rate,
            "avg_latency": health.avg_latency,
            "total_requests": health.total_requests,
            "error_count": health.error_count,
            "status": "healthy" if health.success_rate > 0.95 else "degraded" if health.success_rate > 0.8 else "down"
        }
    
    return status


# ============================================================================
# CONVENIENCE ALIASES (for quick migrations)
# ============================================================================

# Drop-in replacements for old Gemini-only functions
generate_with_gemini = ai_generate  # Old function name
analyze_code = ai_code_review  # Old function name
create_code = ai_code_generate  # Old function name


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    async def demo():
        """Demonstrate all helper functions."""
        
        print("🤖 AI Helper Demo\\n")
        
        # 1. Simple generation
        print("1️⃣ Simple Generation:")
        response = await ai_generate("What is 2+2?")
        print(f"   Response: {response['content'][:50]}...")
        print(f"   Model: {response['model_used']}, Cost: ${response['cost']:.6f}\\n")
        
        # 2. Code review
        print("2️⃣ Code Review:")
        code = "def add(a, b):\\n    return a + b"
        review = await ai_code_review(code, language="python")
        print(f"   Review: {review['content'][:100]}...")
        print(f"   Cost: ${review['cost']:.6f}\\n")
        
        # 3. Provider status
        print("3️⃣ Provider Status:")
        status = await get_provider_status()
        for provider, health in status.items():
            print(f"   {provider}: {health['status']} (success: {health['success_rate']:.1%})")
        
        print("\\n✅ Demo complete!")
    
    # Run demo
    asyncio.run(demo())
