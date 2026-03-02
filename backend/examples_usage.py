"""
Practical Examples - Universal AI System Usage

This script demonstrates real-world usage of the universal AI system
with the simplified ai_helper module.

Run with: python examples_usage.py
"""

import asyncio
import os
from pathlib import Path

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent))

from app.core.ai_helper import (
    ai_generate,
    ai_code_review,
    ai_code_generate,
    ai_explain_code,
    ai_fix_code,
    ai_analyze_architecture,
    ai_security_audit,
    ai_summarize,
    ai_create_learning_path,
    ai_generate_quiz,
    ai_chat,
    get_available_providers,
    estimate_cost,
    get_provider_status
)


# ============================================================================
# EXAMPLE 1: Repository Onboarding (Your Main Use Case)
# ============================================================================

async def example_repository_onboarding():
    """
    Example: Analyze a GitHub repository for onboarding.
    This is your platform's main use case!
    """
    print("=" * 60)
    print("EXAMPLE 1: Repository Onboarding")
    print("=" * 60)
    
    # Simulate repository analysis
    repo_structure = """
    project/
    ├── src/
    │   ├── main.py
    │   ├── utils.py
    │   └── config.py
    ├── tests/
    │   └── test_main.py
    ├── requirements.txt
    └── README.md
    """
    
    main_py = """
    from fastapi import FastAPI
    
    app = FastAPI()
    
    @app.get("/")
    def read_root():
        return {"Hello": "World"}
    
    @app.get("/items/{item_id}")
    def read_item(item_id: int, q: str = None):
        return {"item_id": item_id, "q": q}
    """
    
    # Step 1: Analyze architecture (use cheap model)
    print("\n📐 Step 1: Analyzing architecture...")
    architecture_analysis = await ai_analyze_architecture(
        architecture_docs=f"Structure:\n{repo_structure}\n\nMain file:\n{main_py}",
        focus="general",
        use_premium=False  # Use cheap model for initial analysis
    )
    print(f"   ✅ Analysis complete!")
    print(f"   Model: {architecture_analysis['model_used']}")
    print(f"   Cost: ${architecture_analysis['cost']:.6f}")
    print(f"   Summary: {architecture_analysis['content'][:200]}...")
    
    # Step 2: Security audit (use moderate model)
    print("\n🔒 Step 2: Security audit...")
    security = await ai_security_audit(main_py, audit_type="code")
    print(f"   ✅ Audit complete!")
    print(f"   Model: {security['model_used']}")
    print(f"   Cost: ${security['cost']:.6f}")
    print(f"   Summary: {security['content'][:200]}...")
    
    # Step 3: Generate learning path for the technology stack
    print("\n📚 Step 3: Creating learning path...")
    learning_path = await ai_create_learning_path(
        topic="FastAPI web development",
        skill_level="beginner",
        duration="2 weeks"
    )
    print(f"   ✅ Learning path created!")
    print(f"   Model: {learning_path['model_used']}")
    print(f"   Cost: ${learning_path['cost']:.6f}")
    
    # Step 4: Generate quiz to test understanding
    print("\n🎯 Step 4: Generating quiz...")
    quiz = await ai_generate_quiz(
        topic="FastAPI basics",
        difficulty="medium",
        num_questions=3
    )
    print(f"   ✅ Quiz generated!")
    print(f"   Model: {quiz['model_used']}")
    print(f"   Cost: ${quiz['cost']:.6f}")
    
    # Total cost for complete onboarding
    total_cost = (
        architecture_analysis['cost'] +
        security['cost'] +
        learning_path['cost'] +
        quiz['cost']
    )
    print(f"\n💰 Total onboarding cost: ${total_cost:.6f}")
    print(f"   (With Gemini Pro only: ~$0.15)")
    print(f"   Savings: ~{((0.15 - total_cost) / 0.15 * 100):.0f}%")


# ============================================================================
# EXAMPLE 2: Code Review at Scale
# ============================================================================

async def example_bulk_code_review():
    """
    Example: Review multiple code files cheaply.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Bulk Code Review (Ultra-Cheap)")
    print("=" * 60)
    
    code_samples = [
        "def divide(a, b):\n    return a / b",
        "def get_user(id):\n    return db.query(f'SELECT * FROM users WHERE id={id}')",
        "password = 'admin123'\napi_key = '12345-abcde'",
    ]
    
    print(f"\n📝 Reviewing {len(code_samples)} code samples...")
    
    total_cost = 0
    for i, code in enumerate(code_samples, 1):
        review = await ai_code_review(code, language="python", focus="security")
        total_cost += review['cost']
        
        print(f"\n   Sample {i}:")
        print(f"   Model: {review['model_used']}")
        print(f"   Cost: ${review['cost']:.6f}")
        print(f"   Issues found: {review['content'][:100]}...")
    
    print(f"\n💰 Total cost for {len(code_samples)} reviews: ${total_cost:.6f}")
    print(f"   Average per review: ${total_cost/len(code_samples):.6f}")
    print(f"   (With GPT-4: ~$0.05 = 50x more expensive!)")


# ============================================================================
# EXAMPLE 3: Chat with Context (Multi-Turn Conversation)
# ============================================================================

async def example_chat_conversation():
    """
    Example: Multi-turn conversation with context.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Chat Conversation")
    print("=" * 60)
    
    messages = []
    
    # Turn 1
    print("\n👤 User: What is FastAPI?")
    messages.append({"role": "user", "content": "What is FastAPI?"})
    response1 = await ai_chat(messages)
    messages.append({"role": "assistant", "content": response1['content']})
    print(f"🤖 Assistant: {response1['content'][:150]}...")
    print(f"   Model: {response1['model_used']}, Cost: ${response1['cost']:.6f}")
    
    # Turn 2
    print("\n👤 User: How is it different from Flask?")
    messages.append({"role": "user", "content": "How is it different from Flask?"})
    response2 = await ai_chat(messages)
    messages.append({"role": "assistant", "content": response2['content']})
    print(f"🤖 Assistant: {response2['content'][:150]}...")
    print(f"   Model: {response2['model_used']}, Cost: ${response2['cost']:.6f}")
    
    # Turn 3
    print("\n👤 User: Show me a simple example")
    messages.append({"role": "user", "content": "Show me a simple example"})
    response3 = await ai_chat(messages)
    print(f"🤖 Assistant: {response3['content'][:150]}...")
    print(f"   Model: {response3['model_used']}, Cost: ${response3['cost']:.6f}")
    
    total_cost = response1['cost'] + response2['cost'] + response3['cost']
    print(f"\n💰 Total conversation cost: ${total_cost:.6f}")


# ============================================================================
# EXAMPLE 4: Code Generation and Testing
# ============================================================================

async def example_code_generation_workflow():
    """
    Example: Generate code → Review it → Fix issues → Explain it
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Code Generation Workflow")
    print("=" * 60)
    
    # Step 1: Generate code
    print("\n⚡ Step 1: Generating binary search function...")
    generated = await ai_code_generate(
        description="Binary search algorithm",
        language="python",
        include_tests=True,
        include_docs=True
    )
    print(f"   ✅ Code generated!")
    print(f"   Model: {generated['model_used']}")
    print(f"   Cost: ${generated['cost']:.6f}")
    code = generated['content'][:500]  # Truncate for demo
    
    # Step 2: Review the generated code
    print("\n🔍 Step 2: Reviewing generated code...")
    review = await ai_code_review(code, language="python", focus="all")
    print(f"   ✅ Review complete!")
    print(f"   Model: {review['model_used']}")
    print(f"   Cost: ${review['cost']:.6f}")
    print(f"   Feedback: {review['content'][:150]}...")
    
    # Step 3: Explain the code
    print("\n📖 Step 3: Explaining the code...")
    explanation = await ai_explain_code(code, language="python", depth="simple")
    print(f"   ✅ Explanation generated!")
    print(f"   Model: {explanation['model_used']}")
    print(f"   Cost: ${explanation['cost']:.6f}")
    
    total_cost = generated['cost'] + review['cost'] + explanation['cost']
    print(f"\n💰 Total workflow cost: ${total_cost:.6f}")


# ============================================================================
# EXAMPLE 5: Provider Management
# ============================================================================

async def example_provider_management():
    """
    Example: Check providers, estimate costs, monitor health.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Provider Management")
    print("=" * 60)
    
    # Check available providers
    print("\n📡 Available providers:")
    providers = get_available_providers()
    for provider in providers:
        print(f"   ✅ {provider}")
    
    if not providers:
        print("   ⚠️  No providers configured! Add API keys to .env.ai")
        return
    
    # Estimate costs before making requests
    print("\n💵 Cost estimation:")
    models_to_estimate = [
        ("deepseek-chat", "DeepSeek Chat"),
        ("gemini-1.5-flash", "Gemini Flash"),
        ("gpt-4o", "GPT-4o"),
        ("claude-3-5-sonnet", "Claude 3.5 Sonnet"),
    ]
    
    for model_id, model_name in models_to_estimate:
        try:
            cost = estimate_cost(model_id, input_tokens=1000, output_tokens=500)
            print(f"   {model_name}: ${cost:.6f} per request")
        except:
            pass  # Model not in registry
    
    # Check provider health
    print("\n🏥 Provider health:")
    try:
        status = await get_provider_status()
        for provider, health in status.items():
            emoji = "✅" if health['status'] == "healthy" else "⚠️" if health['status'] == "degraded" else "❌"
            print(f"   {emoji} {provider}: {health['status']}")
            print(f"      Success rate: {health['success_rate']:.1%}")
            print(f"      Avg latency: {health['avg_latency']:.2f}s")
    except Exception as e:
        print(f"   ℹ️  No health data yet (need to make some requests first)")


# ============================================================================
# EXAMPLE 6: Cost Comparison
# ============================================================================

async def example_cost_comparison():
    """
    Example: Same task with different models to see cost differences.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 6: Cost Comparison Across Models")
    print("=" * 60)
    
    prompt = "Explain what async/await means in Python in 2-3 sentences."
    
    models = [
        ("deepseek-chat", "deepseek", "DeepSeek Chat (cheapest)"),
        ("gemini-1.5-flash", "gemini", "Gemini Flash"),
        ("gpt-4o-mini", "openai", "GPT-4o Mini"),
    ]
    
    print(f"\n📝 Task: '{prompt}'")
    print("\nResults:")
    
    costs = []
    for model, provider, name in models:
        try:
            from app.core.enhanced_universal_client import get_universal_client
            
            client = get_universal_client()
            response = await client.generate_async(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                provider=provider,
                max_tokens=200
            )
            
            costs.append((name, response['cost']))
            print(f"\n   {name}:")
            print(f"   ├─ Response: {response['content'][:100]}...")
            print(f"   └─ Cost: ${response['cost']:.6f}")
        except Exception as e:
            print(f"\n   {name}: ⚠️  Not available ({str(e)[:50]})")
    
    if len(costs) > 1:
        most_expensive = max(costs, key=lambda x: x[1])
        cheapest = min(costs, key=lambda x: x[1])
        savings = ((most_expensive[1] - cheapest[1]) / most_expensive[1]) * 100
        
        print(f"\n💰 Cost comparison:")
        print(f"   Most expensive: {most_expensive[0]} at ${most_expensive[1]:.6f}")
        print(f"   Cheapest: {cheapest[0]} at ${cheapest[1]:.6f}")
        print(f"   Savings: {savings:.0f}% by choosing the right model!")


# ============================================================================
# MAIN
# ============================================================================

async def main():
    """Run all examples."""
    
    print("=" * 60)
    print("🚀 UNIVERSAL AI SYSTEM - PRACTICAL EXAMPLES")
    print("=" * 60)
    
    # Check if any providers are configured
    providers = get_available_providers()
    if not providers:
        print("\n⚠️  WARNING: No AI providers configured!")
        print("\n📋 To run these examples:")
        print("   1. Copy .env.ai.example to .env.ai")
        print("   2. Add at least one API key:")
        print("      - DEEPSEEK_API_KEY (cheapest, recommended)")
        print("      - GEMINI_API_KEY (fast, cheap)")
        print("      - GROQ_API_KEY (fastest, free tier)")
        print("      - OPENAI_API_KEY (premium)")
        print("      - ANTHROPIC_API_KEY (premium)")
        print("   3. Load environment: source .env.ai")
        print("   4. Run again: python examples_usage.py")
        return
    
    print(f"\n✅ Found {len(providers)} configured provider(s): {', '.join(providers)}")
    print("\n" + "=" * 60)
    
    try:
        # Run all examples
        await example_repository_onboarding()
        await example_bulk_code_review()
        await example_chat_conversation()
        await example_code_generation_workflow()
        await example_provider_management()
        await example_cost_comparison()
        
        print("\n" + "=" * 60)
        print("✅ ALL EXAMPLES COMPLETED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        print("\nTroubleshooting:")
        print("   1. Check API keys in .env.ai")
        print("   2. Verify providers have credits")
        print("   3. Run: python test_ai_providers.py")


if __name__ == "__main__":
    # Run examples
    asyncio.run(main())
