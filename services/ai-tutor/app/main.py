from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

app = FastAPI(
    title="AI Tutor Service",
    version="2.0.0",
    description="Multi-provider AI integration - Gemini, Claude, GPT",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str
    context: Optional[str] = None
    repo_url: Optional[str] = None


class AIResponse(BaseModel):
    answer: str
    provider: str
    model: str
    sources: List[str] = []


class CodeExplanation(BaseModel):
    code: str
    language: str


# Simple in-memory cache for demo
qa_cache = {}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-tutor"}


@app.post("/api/v1/ask", response_model=AIResponse)
async def ask_question(question: Question):
    """Ask the AI tutor a question about a codebase"""
    cache_key = f"{question.question}:{question.context}"

    if cache_key in qa_cache:
        return qa_cache[cache_key]

    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    if gemini_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")

            prompt = f"You are an expert software engineer tutoring someone about a codebase.\n"
            if question.context:
                prompt += f"Context:\n{question.context}\n"
            prompt += f"\nQuestion: {question.question}"

            response = model.generate_content(prompt)

            result = AIResponse(
                answer=response.text,
                provider="gemini",
                model="gemini-2.0-flash",
                sources=[],
            )
            qa_cache[cache_key] = result
            return result
        except Exception as e:
            pass

    if openai_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=openai_key)

            messages = [
                {
                    "role": "system",
                    "content": "You are an expert software engineer tutoring someone about a codebase.",
                }
            ]
            if question.context:
                messages.append(
                    {"role": "user", "content": f"Context:\n{question.context}\n"}
                )
            messages.append({"role": "user", "content": question.question})

            response = client.chat.completions.create(model="gpt-4o", messages=messages)

            result = AIResponse(
                answer=response.choices[0].message.content,
                provider="openai",
                model="gpt-4o",
                sources=[],
            )
            qa_cache[cache_key] = result
            return result
        except Exception as e:
            pass

    if anthropic_key:
        try:
            import anthropic

            client = anthropic.Anthropic(api_key=anthropic_key)

            prompt = f"You are an expert software engineer tutoring someone about a codebase.\n"
            if question.context:
                prompt += f"Context:\n{question.context}\n"
            prompt += f"\nQuestion: {question.question}"

            response = client.messages.create(
                model="claude-4-sonnet-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            result = AIResponse(
                answer=response.content[0].text,
                provider="anthropic",
                model="claude-4-sonnet",
                sources=[],
            )
            qa_cache[cache_key] = result
            return result
        except Exception as e:
            pass

    fallback_answer = AIResponse(
        answer="I can help explain codebases, generate learning paths, and answer technical questions. Configure an AI provider (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY) to get started.",
        provider="demo",
        model="demo",
        sources=[],
    )
    qa_cache[cache_key] = fallback_answer
    return fallback_answer


@app.post("/api/v1/explain", response_model=AIResponse)
async def explain_code(explanation: CodeExplanation):
    """Explain a piece of code"""
    prompt = f"Explain this {explanation.language} code clearly and concisely:\n\n{explanation.code}"

    question = Question(question=prompt)
    return await ask_question(question)


@app.post("/api/v1/refactor")
async def refactor_code(code: str, language: str = "python"):
    """Get code refactoring suggestions"""
    prompt = (
        f"Refactor this {language} code to be cleaner and more maintainable:\n\n{code}"
    )

    question = Question(question=prompt)
    response = await ask_question(question)

    return {"suggestions": response.answer, "provider": response.provider}


@app.get("/api/v1/providers")
async def list_providers():
    """List available AI providers"""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

    return {
        "available": [
            {"name": "gemini", "configured": bool(gemini_key)},
            {"name": "openai", "configured": bool(openai_key)},
            {"name": "anthropic", "configured": bool(anthropic_key)},
        ]
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3004"))
    uvicorn.run(app, host="0.0.0.0", port=port)
