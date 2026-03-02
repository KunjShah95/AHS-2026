"""
Universal Multi-Model Configuration for CodeFlow
================================================
Support for ALL major AI providers with intelligent routing.

Supported Providers:
- OpenRouter (200+ models)
- OpenAI (GPT-4o, GPT-4-turbo, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
- Google Gemini (1.5 Pro, 1.5 Flash)
- DeepSeek (v2.5, Coder)
- Groq (Ultra-fast inference)
- Together AI
- Cohere
- Mistral AI
- Vercel AI SDK compatible

NO RESTRICTIONS - Use ANY model from ANY provider!
"""

import os
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


# ============================================================================
# PROVIDER REGISTRY
# ============================================================================

class AIProvider(str, Enum):
    """All supported AI providers."""
    OPENROUTER = "openrouter"      # Gateway to 200+ models
    OPENAI = "openai"              # GPT models
    ANTHROPIC = "anthropic"        # Claude models
    GEMINI = "gemini"              # Google Gemini
    DEEPSEEK = "deepseek"          # DeepSeek models
    GROQ = "groq"                  # Ultra-fast inference
    TOGETHER = "together"          # Together AI
    COHERE = "cohere"              # Cohere models
    MISTRAL = "mistral"            # Mistral AI
    REPLICATE = "replicate"        # Replicate (open source)
    HUGGINGFACE = "huggingface"    # HuggingFace inference
    VERCEL = "vercel"              # Vercel AI SDK
    AZURE = "azure"                # Azure OpenAI
    PERPLEXITY = "perplexity"      # Perplexity AI
    AUTO = "auto"                  # Automatic provider selection


class ModelTier(str, Enum):
    """Model cost/capability tiers."""
    ULTRA_CHEAP = "ultra_cheap"    # < $0.10 per 1M tokens
    CHEAP = "cheap"                # $0.10 - $0.50 per 1M tokens
    ECONOMY = "economy"            # $0.50 - $2.00 per 1M tokens
    STANDARD = "standard"          # $2.00 - $5.00 per 1M tokens
    PREMIUM = "premium"            # $5.00 - $15.00 per 1M tokens
    ULTRA_PREMIUM = "ultra_premium"  # > $15.00 per 1M tokens


# ============================================================================
# COMPREHENSIVE MODEL REGISTRY
# ============================================================================

UNIVERSAL_MODEL_REGISTRY = {
    # ========================================================================
    # ULTRA CHEAP MODELS (< $0.10 per 1M tokens) - Use for 50%+ of requests
    # ========================================================================
    
    "gemini-1.5-flash": {
        "provider": AIProvider.GEMINI,
        "tier": ModelTier.ULTRA_CHEAP,
        "pricing": {"input": 0.075, "output": 0.30},
        "context": 1_000_000,
        "max_output": 8192,
        "speed": "fast",
        "quality": "good",
        "use_for": ["classification", "simple_analysis", "tagging", "routing"]
    },
    
    "gpt-4o-mini": {
        "provider": AIProvider.OPENAI,
        "tier": ModelTier.ULTRA_CHEAP,
        "pricing": {"input": 0.075, "output": 0.30},
        "context": 128_000,
        "max_output": 16384,
        "speed": "fast",
        "quality": "good",
        "use_for": ["summaries", "extraction", "simple_qa"]
    },
    
    "deepseek-chat": {
        "provider": AIProvider.DEEPSEEK,
        "tier": ModelTier.ULTRA_CHEAP,
        "pricing": {"input": 0.014, "output": 0.28},  # Cheapest!
        "context": 64_000,
        "max_output": 8192,
        "speed": "fast",
        "quality": "good",
        "use_for": ["coding", "analysis", "generation"]
    },
    
    "groq/llama-3.1-8b-instant": {
        "provider": AIProvider.GROQ,
        "tier": ModelTier.ULTRA_CHEAP,
        "pricing": {"input": 0.05, "output": 0.08},
        "context": 128_000,
        "max_output": 8192,
        "speed": "ultra_fast",  # 500+ tokens/sec!
        "quality": "moderate",
        "use_for": ["real_time_chat", "fast_responses"]
    },
    
    "openrouter/qwen/qwen-2.5-7b-instruct": {
        "provider": AIProvider.OPENROUTER,
        "tier": ModelTier.ULTRA_CHEAP,
        "pricing": {"input": 0.036, "output": 0.036},
        "context": 32_768,
        "max_output": 8192,
        "speed": "fast",
        "quality": "good",
        "use_for": ["multilingual", "reasoning"]
    },
    
    # ========================================================================
    # CHEAP MODELS ($0.10 - $0.50) - Use for 30% of requests
    # ========================================================================
    
    "claude-3-haiku": {
        "provider": AIProvider.ANTHROPIC,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.25, "output": 1.25},
        "context": 200_000,
        "max_output": 4096,
        "speed": "fast",
        "quality": "excellent",
        "use_for": ["code_review", "analysis", "writing"]
    },
    
    "groq/llama-3.1-70b-versatile": {
        "provider": AIProvider.GROQ,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.40, "output": 0.40},
        "context": 128_000,
        "max_output": 8192,
        "speed": "ultra_fast",
        "quality": "very_good",
        "use_for": ["complex_analysis", "real_time"]
    },
    
    "openrouter/meta-llama/llama-3.3-70b-instruct": {
        "provider": AIProvider.OPENROUTER,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.35, "output": 0.40},
        "context": 128_000,
        "max_output": 32768,
        "speed": "fast",
        "quality": "excellent",
        "use_for": ["general_purpose", "reasoning", "coding"]
    },
    
    "mistral-small": {
        "provider": AIProvider.MISTRAL,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.40, "output": 0.40},
        "context": 32_768,
        "max_output": 8192,
        "speed": "fast",
        "quality": "very_good",
        "use_for": ["multilingual", "translation"]
    },
    
    # ========================================================================
    # ECONOMY MODELS ($0.50 - $2.00) - Use for 15% of requests
    # ========================================================================
    
    "gemini-1.5-pro": {
        "provider": AIProvider.GEMINI,
        "tier": ModelTier.ECONOMY,
        "pricing": {"input": 1.25, "output": 5.00},
        "context": 2_000_000,  # Massive context!
        "max_output": 8192,
        "speed": "medium",
        "quality": "excellent",
        "use_for": ["large_documents", "codebase_analysis", "long_context"]
    },
    
    "deepseek-coder": {
        "provider": AIProvider.DEEPSEEK,
        "tier": ModelTier.ECONOMY,
        "pricing": {"input": 0.014, "output": 0.28},
        "context": 64_000,
        "max_output": 8192,
        "speed": "fast",
        "quality": "excellent",
        "use_for": ["code_generation", "debugging", "refactoring"]
    },
    
    "mistral-medium": {
        "provider": AIProvider.MISTRAL,
        "tier": ModelTier.ECONOMY,
        "pricing": {"input": 1.00, "output": 3.00},
        "context": 32_768,
        "max_output": 8192,
        "speed": "medium",
        "quality": "excellent",
        "use_for": ["complex_reasoning", "creative_writing"]
    },
    
    # ========================================================================
    # STANDARD MODELS ($2.00 - $5.00) - Use for 4% of requests
    # ========================================================================
    
    "gpt-4o": {
        "provider": AIProvider.OPENAI,
        "tier": ModelTier.STANDARD,
        "pricing": {"input": 2.50, "output": 10.00},
        "context": 128_000,
        "max_output": 16384,
        "speed": "medium",
        "quality": "excellent",
        "use_for": ["vision", "multimodal", "complex_reasoning"]
    },
    
    "claude-3-opus": {
        "provider": AIProvider.ANTHROPIC,
        "tier": ModelTier.STANDARD,
        "pricing": {"input": 15.00, "output": 75.00},
        "context": 200_000,
        "max_output": 4096,
        "speed": "slow",
        "quality": "best",
        "use_for": ["critical_analysis", "research", "writing"]
    },
    
    # ========================================================================
    # PREMIUM MODELS ($5.00 - $15.00) - Use for <1% of requests
    # ========================================================================
    
    "claude-3.5-sonnet": {
        "provider": AIProvider.ANTHROPIC,
        "tier": ModelTier.PREMIUM,
        "pricing": {"input": 3.00, "output": 15.00},
        "context": 200_000,
        "max_output": 8192,
        "speed": "medium",
        "quality": "best",
        "use_for": ["code_generation", "complex_reasoning", "critical_tasks"]
    },
    
    "gpt-4-turbo": {
        "provider": AIProvider.OPENAI,
        "tier": ModelTier.PREMIUM,
        "pricing": {"input": 10.00, "output": 30.00},
        "context": 128_000,
        "max_output": 4096,
        "speed": "slow",
        "quality": "excellent",
        "use_for": ["vision", "complex_analysis"]
    },
    
    # ========================================================================
    # SPECIALIZED MODELS
    # ========================================================================
    
    "perplexity/sonar-large": {
        "provider": AIProvider.PERPLEXITY,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.60, "output": 0.60},
        "context": 127_000,
        "max_output": 4096,
        "speed": "fast",
        "quality": "good",
        "use_for": ["search", "research", "fact_checking"]
    },
    
    "cohere/command-r": {
        "provider": AIProvider.COHERE,
        "tier": ModelTier.CHEAP,
        "pricing": {"input": 0.50, "output": 1.50},
        "context": 128_000,
        "max_output": 4096,
        "speed": "fast",
        "quality": "good",
        "use_for": ["rag", "search", "summarization"]
    },
}


# ============================================================================
# INTELLIGENT MODEL ROUTING
# ============================================================================

class TaskType(str, Enum):
    """Task types for intelligent routing."""
    # Ultra-cheap tasks
    CLASSIFICATION = "classification"
    TAGGING = "tagging"
    SIMPLE_QA = "simple_qa"
    ROUTING = "routing"
    
    # Cheap tasks
    SUMMARIZATION = "summarization"
    EXTRACTION = "extraction"
    SIMPLE_ANALYSIS = "simple_analysis"
    
    # Economy tasks
    CODE_SUMMARY = "code_summary"
    LEARNING_PATH = "learning_path"
    QUIZ_GENERATION = "quiz_generation"
    
    # Standard tasks
    CODE_GENERATION = "code_generation"
    COMPLEX_ANALYSIS = "complex_analysis"
    ARCHITECTURE_REVIEW = "architecture_review"
    
    # Premium tasks
    SECURITY_AUDIT = "security_audit"
    CRITICAL_REVIEW = "critical_review"
    PRODUCTION_CODE = "production_code"


# Task to recommended models mapping
TASK_TO_MODELS: Dict[TaskType, List[str]] = {
    # Ultra-cheap (50%+ volume)
    TaskType.CLASSIFICATION: [
        "deepseek-chat",           # Cheapest
        "gemini-1.5-flash",        # Fast + cheap
        "groq/llama-3.1-8b-instant"  # Ultra-fast
    ],
    
    TaskType.SIMPLE_QA: [
        "deepseek-chat",
        "gpt-4o-mini",
        "gemini-1.5-flash"
    ],
    
    # Cheap (30% volume)
    TaskType.SUMMARIZATION: [
        "claude-3-haiku",          # Best quality
        "openrouter/meta-llama/llama-3.3-70b-instruct",
        "gpt-4o-mini"
    ],
    
    TaskType.CODE_SUMMARY: [
        "deepseek-coder",          # Specialized
        "claude-3-haiku",
        "gemini-1.5-pro"
    ],
    
    # Economy (15% volume)
    TaskType.CODE_GENERATION: [
        "deepseek-coder",          # Best for code
        "claude-3.5-sonnet",
        "gpt-4o"
    ],
    
    TaskType.LEARNING_PATH: [
        "gemini-1.5-pro",          # Large context
        "claude-3-haiku",
        "openrouter/meta-llama/llama-3.3-70b-instruct"
    ],
    
    # Premium (<5% volume)
    TaskType.SECURITY_AUDIT: [
        "claude-3.5-sonnet",       # Best reasoning
        "gpt-4o",
        "claude-3-opus"
    ],
    
    TaskType.CRITICAL_REVIEW: [
        "claude-3.5-sonnet",
        "gpt-4-turbo",
        "claude-3-opus"
    ]
}


# ============================================================================
# PROVIDER CONFIGURATION
# ============================================================================

class ProviderConfig(BaseModel):
    """Configuration for each provider."""
    
    name: AIProvider
    enabled: bool = True
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    priority: int = 1  # Lower = higher priority
    fallback_enabled: bool = True
    rate_limit_rpm: int = 60  # Requests per minute
    timeout_seconds: int = 60


# Default provider configs (read from environment)
DEFAULT_PROVIDER_CONFIGS = {
    AIProvider.OPENROUTER: ProviderConfig(
        name=AIProvider.OPENROUTER,
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        priority=1,  # Highest priority - gateway to 200+ models
        rate_limit_rpm=100
    ),
    
    AIProvider.DEEPSEEK: ProviderConfig(
        name=AIProvider.DEEPSEEK,
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com/v1",
        priority=2,  # Very cheap, great for code
        rate_limit_rpm=60
    ),
    
    AIProvider.GEMINI: ProviderConfig(
        name=AIProvider.GEMINI,
        api_key=os.getenv("GEMINI_API_KEY"),
        base_url=None,  # Uses google-generativeai SDK
        priority=3,
        rate_limit_rpm=60
    ),
    
    AIProvider.GROQ: ProviderConfig(
        name=AIProvider.GROQ,
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
        priority=4,  # Ultra-fast for real-time
        rate_limit_rpm=100
    ),
    
    AIProvider.OPENAI: ProviderConfig(
        name=AIProvider.OPENAI,
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://api.openai.com/v1",
        priority=5,
        rate_limit_rpm=60
    ),
    
    AIProvider.ANTHROPIC: ProviderConfig(
        name=AIProvider.ANTHROPIC,
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        base_url="https://api.anthropic.com/v1",
        priority=6,
        rate_limit_rpm=50
    ),
    
    AIProvider.MISTRAL: ProviderConfig(
        name=AIProvider.MISTRAL,
        api_key=os.getenv("MISTRAL_API_KEY"),
        base_url="https://api.mistral.ai/v1",
        priority=7,
        rate_limit_rpm=60
    ),
    
    AIProvider.COHERE: ProviderConfig(
        name=AIProvider.COHERE,
        api_key=os.getenv("COHERE_API_KEY"),
        base_url="https://api.cohere.ai/v1",
        priority=8,
        rate_limit_rpm=60
    ),
}


# ============================================================================
# CONFIGURATION
# ============================================================================

class MultiModelConfig(BaseModel):
    """Universal multi-model configuration."""
    
    # Automatic provider selection
    auto_select_provider: bool = True
    auto_select_based_on: str = "cost"  # cost, speed, quality
    
    # Fallback strategy
    enable_fallbacks: bool = True
    max_fallback_attempts: int = 3
    fallback_order: List[AIProvider] = [
        AIProvider.OPENROUTER,  # Try gateway first
        AIProvider.DEEPSEEK,    # Then cheapest
        AIProvider.GEMINI,      # Then Google
        AIProvider.GROQ,        # Then fast
        AIProvider.OPENAI       # Finally OpenAI
    ]
    
    # Cost optimization
    prefer_cheap_models: bool = True
    max_cost_per_request: float = 0.10  # $0.10 max per request
    
    # Quality requirements
    min_quality_tier: str = "good"  # moderate, good, very_good, excellent, best
    
    # Speed requirements
    max_response_time_seconds: int = 30
    prefer_fast_models: bool = False
    
    # Provider configs
    providers: Dict[AIProvider, ProviderConfig] = Field(
        default_factory=lambda: DEFAULT_PROVIDER_CONFIGS
    )
    
    # Model registry
    models: Dict[str, Dict] = Field(
        default_factory=lambda: UNIVERSAL_MODEL_REGISTRY
    )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_models_by_tier(tier: ModelTier) -> List[str]:
    """Get all models in a specific tier."""
    return [
        model_id 
        for model_id, config in UNIVERSAL_MODEL_REGISTRY.items()
        if config["tier"] == tier
    ]


def get_cheapest_model_for_task(task: TaskType) -> str:
    """Get the cheapest model that can handle a task."""
    models = TASK_TO_MODELS.get(task, [])
    if not models:
        return "deepseek-chat"  # Default to cheapest
    return models[0]  # First model is always cheapest


def get_fastest_model() -> str:
    """Get the fastest model available."""
    return "groq/llama-3.1-8b-instant"  # Groq is ultra-fast


def estimate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    """Estimate cost for a request."""
    if model_id not in UNIVERSAL_MODEL_REGISTRY:
        return 0.0
    
    pricing = UNIVERSAL_MODEL_REGISTRY[model_id]["pricing"]
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    return input_cost + output_cost


def get_enabled_providers() -> List[AIProvider]:
    """Get list of providers with API keys configured."""
    enabled = []
    for provider, config in DEFAULT_PROVIDER_CONFIGS.items():
        if config.api_key:
            enabled.append(provider)
    return enabled


# Export config instance
multi_model_config = MultiModelConfig()
