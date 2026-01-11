"""
Knowledge Verification Quiz API
================================
Auto-generate quizzes from codebase analysis to verify developer understanding.
This is a key differentiator - MCP can answer questions, but can't VERIFY learning.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import random

from app.core.gemini_client import GeminiClient

router = APIRouter()

# ============================================================================
# Request/Response Models
# ============================================================================

class QuizQuestion(BaseModel):
    id: str
    question: str
    question_type: str  # multiple_choice, true_false, code_completion, explain_code
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: int  # 1-5
    concept: str
    related_file: Optional[str] = None
    code_snippet: Optional[str] = None
    points: int = 10

class Quiz(BaseModel):
    id: str
    title: str
    description: str
    module: str
    questions: List[QuizQuestion]
    time_limit_minutes: int
    passing_score: int
    created_at: str
    difficulty: str  # beginner, intermediate, advanced

class GenerateQuizRequest(BaseModel):
    repo_name: str
    module_name: str
    code_context: str
    concepts: List[str]
    difficulty: str = "intermediate"
    question_count: int = 5

class GenerateQuizFromRepoRequest(BaseModel):
    repo_id: str
    user_id: str
    difficulty: str = "intermediate"
    question_count: int = 10

class SubmitQuizRequest(BaseModel):
    quiz_id: str
    user_id: str
    answers: Dict[str, str]  # question_id -> user_answer
    time_taken_seconds: int

class QuizResult(BaseModel):
    quiz_id: str
    user_id: str
    score: int
    total_points: int
    percentage: float
    passed: bool
    time_taken_seconds: int
    question_results: List[Dict[str, Any]]
    concepts_mastered: List[str]
    concepts_to_review: List[str]
    submitted_at: str
    certificate_eligible: bool

# ============================================================================
# Quiz Endpoints
# ============================================================================

@router.post("/generate", response_model=Quiz)
async def generate_quiz(request: GenerateQuizRequest):
    """
    Generate a quiz from codebase analysis using AI.
    This verifies actual understanding, not just Q&A ability.
    """
    try:
        questions = await generate_ai_questions(
            request.repo_name,
            request.module_name,
            request.code_context,
            request.concepts,
            request.difficulty,
            request.question_count
        )
        
        quiz = Quiz(
            id=f"quiz_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            title=f"Knowledge Check: {request.module_name}",
            description=f"Verify your understanding of {request.module_name} in {request.repo_name}",
            module=request.module_name,
            questions=questions,
            time_limit_minutes=request.question_count * 3,  # 3 min per question
            passing_score=70,
            created_at=datetime.now().isoformat(),
            difficulty=request.difficulty
        )
        
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-from-repo", response_model=Quiz)
async def generate_quiz_from_repo(request: GenerateQuizFromRepoRequest):
    """
    Generate quiz questions from a previously analyzed repository.
    This creates repository-specific quiz content.
    """
    try:
        # In production, fetch analyzed repo data from Firestore using repo_id
        # For now, use demo data as fallback
        demo_quiz = generate_demo_quiz()
        
        # Update quiz to show it's repository-specific
        demo_quiz.id = f"repo_quiz_{request.repo_id[:8]}"
        demo_quiz.title = f"Repository Knowledge Verification"
        demo_quiz.description = f"Custom quiz based on your repository analysis"
        demo_quiz.difficulty = request.difficulty
        
        # Generate new questions with AI based on repo
        if demo_quiz.questions:
            questions = await generate_ai_questions(
                repo_name=f"repo_{request.repo_id}",
                module_name="Repository Code Analysis",
                code_context="Based on analyzed repository structure and patterns",
                concepts=["Architecture", "Design Patterns", "Code Quality", "Best Practices"],
                difficulty=request.difficulty,
                question_count=request.question_count
            )
            demo_quiz.questions = questions
        
        return demo_quiz
        
    except Exception as e:
        print(f"Error generating repository quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit", response_model=QuizResult)
async def submit_quiz(request: SubmitQuizRequest):
    """Submit quiz answers and get detailed results."""
    try:
        # In production, fetch quiz from database
        # For now, use demo evaluation
        result = evaluate_quiz_submission(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demo-quiz", response_model=Quiz)
async def get_demo_quiz():
    """Get a demo quiz for hackathon demonstration."""
    return generate_demo_quiz()

# ============================================================================
# Quiz Generation Functions
# ============================================================================

async def generate_ai_questions(
    repo_name: str,
    module_name: str,
    code_context: str,
    concepts: List[str],
    difficulty: str,
    question_count: int
) -> List[QuizQuestion]:
    """Generate quiz questions using AI based on codebase analysis."""
    
    # Try to use Gemini for intelligent question generation
    try:
        client = GeminiClient()
        
        prompt = f"""Generate {question_count} quiz questions to verify a developer's understanding of this codebase module.

## Repository: {repo_name}
## Module: {module_name}
## Difficulty: {difficulty}
## Concepts to test: {', '.join(concepts)}

## Code Context:
```
{code_context[:3000]}
```

## Question Types to Include:
1. Multiple Choice - Test conceptual understanding
2. True/False - Test specific facts
3. Code Reading - Test ability to understand what code does
4. Architecture - Test understanding of how components connect

## Output Format (JSON array):
[
  {{
    "question": "What is the primary purpose of the X function?",
    "question_type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "The function does X because...",
    "difficulty": 3,
    "concept": "Functions",
    "related_file": "path/to/file.py",
    "points": 10
  }}
]

Generate {question_count} diverse questions that truly test understanding, not just memorization.
Return ONLY valid JSON array, no markdown."""

        response = await client.generate_content_async(prompt)
        
        # Parse AI response
        questions_data = json.loads(response.strip())
        
        questions = []
        for i, q in enumerate(questions_data):
            questions.append(QuizQuestion(
                id=f"q_{i+1}",
                question=q.get("question", ""),
                question_type=q.get("question_type", "multiple_choice"),
                options=q.get("options"),
                correct_answer=q.get("correct_answer", ""),
                explanation=q.get("explanation", ""),
                difficulty=q.get("difficulty", 3),
                concept=q.get("concept", module_name),
                related_file=q.get("related_file"),
                code_snippet=q.get("code_snippet"),
                points=q.get("points", 10)
            ))
        
        return questions
        
    except Exception as e:
        print(f"AI generation failed, using fallback: {e}")
        return generate_fallback_questions(module_name, concepts, difficulty, question_count)

def generate_fallback_questions(
    module_name: str,
    concepts: List[str],
    difficulty: str,
    question_count: int
) -> List[QuizQuestion]:
    """Generate template-based questions if AI fails."""
    
    difficulty_points = {"beginner": 5, "intermediate": 10, "advanced": 15}
    base_points = difficulty_points.get(difficulty, 10)
    
    templates = [
        {
            "question": f"What is the primary responsibility of the {module_name} module?",
            "question_type": "multiple_choice",
            "options": [
                "Data validation and transformation",
                "User interface rendering",
                "Business logic processing",
                "External API communication"
            ],
            "correct_answer": "Business logic processing",
            "explanation": f"The {module_name} module handles core business logic for the application.",
            "concept": "Architecture"
        },
        {
            "question": f"True or False: The {module_name} module can be safely modified without affecting other parts of the system.",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "False",
            "explanation": "Most modules have dependencies and changes can affect connected components.",
            "concept": "Dependencies"
        },
        {
            "question": f"Which pattern is most commonly used in the {module_name} module?",
            "question_type": "multiple_choice",
            "options": ["Singleton", "Factory", "Observer", "Repository"],
            "correct_answer": "Repository",
            "explanation": "The module uses the Repository pattern for data access abstraction.",
            "concept": "Design Patterns"
        },
        {
            "question": f"What happens when an error occurs in {module_name}?",
            "question_type": "multiple_choice",
            "options": [
                "The application crashes",
                "Error is logged and a default value is returned",
                "Error propagates to the caller with context",
                "Error is silently ignored"
            ],
            "correct_answer": "Error propagates to the caller with context",
            "explanation": "Proper error handling ensures errors are propagated with useful context.",
            "concept": "Error Handling"
        },
        {
            "question": f"Why does {module_name} use dependency injection?",
            "question_type": "multiple_choice",
            "options": [
                "To improve performance",
                "For better testability and loose coupling",
                "To reduce memory usage",
                "Because it's required by the framework"
            ],
            "correct_answer": "For better testability and loose coupling",
            "explanation": "Dependency injection allows for easier testing and more maintainable code.",
            "concept": "Dependency Injection"
        }
    ]
    
    # Select questions up to count
    selected = templates[:question_count]
    
    questions = []
    for i, t in enumerate(selected):
        diff_level = {"beginner": 2, "intermediate": 3, "advanced": 4}.get(difficulty, 3)
        questions.append(QuizQuestion(
            id=f"q_{i+1}",
            question=t["question"],
            question_type=t["question_type"],
            options=t.get("options"),
            correct_answer=t["correct_answer"],
            explanation=t["explanation"],
            difficulty=diff_level,
            concept=t["concept"],
            points=base_points
        ))
    
    return questions

def evaluate_quiz_submission(request: SubmitQuizRequest) -> QuizResult:
    """Evaluate quiz submission and generate detailed results."""
    
    # Demo evaluation - in production, fetch quiz and compare
    demo_quiz = generate_demo_quiz()
    
    question_results = []
    concepts_correct = set()
    concepts_wrong = set()
    total_score = 0
    total_points = 0
    
    for q in demo_quiz.questions:
        total_points += q.points
        user_answer = request.answers.get(q.id, "")
        is_correct = user_answer.lower().strip() == q.correct_answer.lower().strip()
        
        if is_correct:
            total_score += q.points
            concepts_correct.add(q.concept)
        else:
            concepts_wrong.add(q.concept)
        
        question_results.append({
            "question_id": q.id,
            "question": q.question,
            "user_answer": user_answer,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "points_earned": q.points if is_correct else 0,
            "explanation": q.explanation if not is_correct else "Correct!",
            "concept": q.concept
        })
    
    percentage = (total_score / max(1, total_points)) * 100
    passed = percentage >= demo_quiz.passing_score
    
    return QuizResult(
        quiz_id=request.quiz_id,
        user_id=request.user_id,
        score=total_score,
        total_points=total_points,
        percentage=round(percentage, 1),
        passed=passed,
        time_taken_seconds=request.time_taken_seconds,
        question_results=question_results,
        concepts_mastered=list(concepts_correct - concepts_wrong),
        concepts_to_review=list(concepts_wrong),
        submitted_at=datetime.now().isoformat(),
        certificate_eligible=passed and percentage >= 85
    )

def generate_demo_quiz() -> Quiz:
    """Generate a demo quiz for hackathon demonstration."""
    questions = [
        QuizQuestion(
            id="q_1",
            question="What is the primary purpose of the Repository pattern used in this codebase?",
            question_type="multiple_choice",
            options=[
                "To store application configuration",
                "To abstract data access and provide a clean API for data operations",
                "To manage user authentication",
                "To handle HTTP routing"
            ],
            correct_answer="To abstract data access and provide a clean API for data operations",
            explanation="The Repository pattern abstracts the data layer, providing a clean separation between business logic and data access.",
            difficulty=3,
            concept="Design Patterns",
            points=10
        ),
        QuizQuestion(
            id="q_2",
            question="True or False: The FastAPI application uses dependency injection for database connections.",
            question_type="true_false",
            options=["True", "False"],
            correct_answer="True",
            explanation="FastAPI's Depends() function is used to inject database sessions into route handlers, enabling better testability.",
            difficulty=2,
            concept="Dependency Injection",
            points=10
        ),
        QuizQuestion(
            id="q_3",
            question="What happens when an API endpoint raises an HTTPException?",
            question_type="multiple_choice",
            options=[
                "The server crashes and restarts",
                "A 500 Internal Server Error is always returned",
                "The specified status code and detail message are returned to the client",
                "The error is logged but the request continues"
            ],
            correct_answer="The specified status code and detail message are returned to the client",
            explanation="FastAPI's HTTPException allows you to return specific HTTP status codes with meaningful error messages.",
            difficulty=2,
            concept="Error Handling",
            points=10
        ),
        QuizQuestion(
            id="q_4",
            question="Which file would you modify to add a new API endpoint for user profiles?",
            question_type="multiple_choice",
            options=[
                "app/main.py",
                "app/api/endpoints/profiles.py (new file)",
                "app/models/user.py",
                "requirements.txt"
            ],
            correct_answer="app/api/endpoints/profiles.py (new file)",
            explanation="Following the existing structure, new endpoints should be added as new files in the api/endpoints directory.",
            difficulty=3,
            concept="Project Structure",
            points=15
        ),
        QuizQuestion(
            id="q_5",
            question="Why does the codebase use Pydantic models for request/response validation?",
            question_type="multiple_choice",
            options=[
                "Because Python doesn't have built-in type checking",
                "For automatic validation, serialization, and API documentation generation",
                "To improve application performance",
                "Because it's required by the database"
            ],
            correct_answer="For automatic validation, serialization, and API documentation generation",
            explanation="Pydantic provides runtime type validation, JSON serialization, and integrates with FastAPI for automatic OpenAPI docs.",
            difficulty=3,
            concept="Data Validation",
            points=15
        )
    ]
    
    return Quiz(
        id="demo_quiz_001",
        title="Backend Architecture Knowledge Check",
        description="Verify your understanding of the FastAPI backend architecture",
        module="Backend Core",
        questions=questions,
        time_limit_minutes=15,
        passing_score=70,
        created_at=datetime.now().isoformat(),
        difficulty="intermediate"
    )
