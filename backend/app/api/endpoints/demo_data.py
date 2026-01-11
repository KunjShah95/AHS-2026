"""
Demo Data Endpoints - Provides realistic mock data for hackathon demo
These endpoints showcase CodeFlow's enterprise features vs Cursor+MCP
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

router = APIRouter()

# TEAM ANALYTICS DEMO DATA

@router.get("/team-analytics")
async def get_team_analytics_demo():
    """
    Return compelling team analytics showing CodeFlow differentiation
    
    Key metrics that beat Cursor + MCP:
    - Team visibility (Cursor can't do this)
    - ROI metrics (proves business value)
    - Onboarding time reduction
    - Individual developer tracking
    """
    return {
        "team_id": "hackathon_demo_team_001",
        "onboarding_metrics": {
            "avg_onboarding_days": 32,  # Down from 90 days traditional
            "completion_rate": 85,  # % of phase completions
            "active_members": 12,  # Currently onboarding
            "total_members": 18  # Total team size
        },
        "roi_metrics": {
            "estimated_hours_saved": 1440,  # 60 days × 24 hours × team size
            "roi_percentage": 1250,  # 12.5x return on investment
            "traditional_onboarding_cost": 324000,  # 18 devs × $18K each
            "codeflow_onboarding_cost": 54000,  # Annual subscription
            # Net savings = $270K
        },
        "member_rankings": [
            {
                "id": "dev_001",
                "name": "Alice Chen",
                "role": "Frontend Engineer",
                "score": 95,
                "status": "on_track",
                "rank": 1
            },
            {
                "id": "dev_002",
                "name": "Bob Johnson",
                "role": "Backend Engineer",
                "score": 87,
                "status": "on_track",
                "rank": 2
            },
            {
                "id": "dev_003",
                "name": "Carol Williams",
                "role": "DevOps Engineer",
                "score": 82,
                "status": "on_track",
                "rank": 3
            },
            {
                "id": "dev_004",
                "name": "David Lee",
                "role": "Backend Engineer",
                "score": 71,
                "status": "needs_help",
                "rank": 4
            },
            {
                "id": "dev_005",
                "name": "Emma Rodriguez",
                "role": "Frontend Engineer",
                "score": 64,
                "status": "needs_help",
                "rank": 5
            }
        ],
        "skill_gaps": [
            {
                "skill_name": "Microservices Architecture",
                "priority": "critical",
                "avg_score": 42  # Red zone - needs intervention
            },
            {
                "skill_name": "Database Design",
                "priority": "high",
                "avg_score": 58  # Yellow zone
            },
            {
                "skill_name": "API Design Patterns",
                "priority": "high",
                "avg_score": 72  # Green zone
            },
            {
                "skill_name": "Async/Await Patterns",
                "priority": "medium",
                "avg_score": 65  # Yellow zone
            },
            {
                "skill_name": "Testing Strategy",
                "priority": "low",
                "avg_score": 78  # Green zone
            }
        ],
        "recommendations": [
            "🎯 Critical: 70% of team struggles with Microservices. Host a 2-hour workshop on Event-Driven Architecture.",
            "📊 Insight: Developers reach productivity 40% faster when they learn API patterns first.",
            "✅ Win: 85% quiz pass rate! Knowledge verification is working. Team understands the codebase.",
            "💡 Opportunity: Create a 'Database Design' playbook. 3 senior devs keep explaining the same concepts.",
            "🚀 Ready: 4 developers completed first PR in week 2 (vs average 8 weeks). Keep this momentum!"
        ]
    }


# KNOWLEDGE VERIFICATION QUIZ DEMO DATA

@router.get("/quiz")
async def get_demo_quiz():
    """
    Return a demo quiz showing CodeFlow's knowledge verification capabilities
    
    Features:
    - AI-generated questions
    - Adaptive difficulty
    - Spaced repetition integration
    - Certification-ready
    """
    return {
        "id": "quiz_demo_001",
        "title": "Architecture Mastery Assessment",
        "description": "Test your understanding of our microservices architecture",
        "questions": [
            {
                "id": "q_001",
                "question": "In our architecture, what is the primary responsibility of the API Gateway?",
                "question_type": "multiple_choice",
                "options": [
                    "Route requests to appropriate microservices and handle authentication",
                    "Store all user data in a centralized database",
                    "Execute business logic for all services",
                    "Cache all responses permanently"
                ],
                "points": 10,
                "concept": "API Gateway"
            },
            {
                "id": "q_002",
                "question": "Which pattern is used for service-to-service communication in our system?",
                "question_type": "multiple_choice",
                "options": [
                    "Message Queue (RabbitMQ/Kafka)",
                    "Direct HTTP calls only",
                    "Shared database writes",
                    "File system polling"
                ],
                "points": 10,
                "concept": "Service Communication"
            },
            {
                "id": "q_003",
                "question": "What happens when a service fails in our system?",
                "question_type": "multiple_choice",
                "options": [
                    "Circuit breaker prevents cascading failures; other services continue",
                    "Entire system goes down immediately",
                    "Requests are queued indefinitely",
                    "All data is automatically deleted"
                ],
                "points": 15,
                "concept": "Resilience Patterns"
            },
            {
                "id": "q_004",
                "question": "How is data consistency maintained across services?",
                "question_type": "multiple_choice",
                "options": [
                    "Eventual consistency with event sourcing",
                    "Two-phase commit across all databases",
                    "Real-time sync of all data",
                    "Services share a single database"
                ],
                "points": 15,
                "concept": "Data Consistency"
            },
            {
                "id": "q_005",
                "question": "Which of the following is NOT a responsibility of the service discovery layer?",
                "question_type": "multiple_choice",
                "options": [
                    "Route requests to user interfaces",
                    "Maintain current list of healthy service instances",
                    "Handle automatic failover",
                    "Track service versions"
                ],
                "points": 10,
                "concept": "Service Discovery"
            }
        ],
        "time_limit_minutes": 15,
        "passing_score": 70,
        "difficulty": "intermediate"
    }


@router.post("/quiz/submit")
async def submit_demo_quiz(
    quiz_id: str,
    user_id: str,
    answers: Dict[str, str],
    time_taken_seconds: int
):
    """
    Grade the quiz with AI-powered explanations
    
    Demonstrates:
    - Adaptive grading
    - Spaced repetition scheduling
    - Personalized feedback
    """
    
    # Correct answers for demo
    correct_answers = {
        "q_001": "Route requests to appropriate microservices and handle authentication",
        "q_002": "Message Queue (RabbitMQ/Kafka)",
        "q_003": "Circuit breaker prevents cascading failures; other services continue",
        "q_004": "Eventual consistency with event sourcing",
        "q_005": "Route requests to user interfaces"
    }
    
    # Score the answers
    score = 0
    total_points = 0
    question_results = []
    
    for qid, correct in correct_answers.items():
        total_points += 10  # All worth 10-15 in real quiz
        user_answer = answers.get(qid, "")
        is_correct = user_answer.lower().strip() == correct.lower().strip()
        
        if is_correct:
            score += 10
        
        # Generate AI-like explanation
        explanations = {
            "q_001": "Correct! The API Gateway is the entry point that routes requests and enforces security policies.",
            "q_002": "Good! Our system uses async message queues for loose coupling between services.",
            "q_003": "Excellent! Circuit breakers prevent cascade failures - a key resilience pattern.",
            "q_004": "Right! We accept eventual consistency to achieve horizontal scalability.",
            "q_005": "Correct! Service discovery manages service instances, not user routing."
        }
        
        question_results.append({
            "question_id": qid,
            "is_correct": is_correct,
            "explanation": explanations.get(qid, "Learn more about this concept in the module.")
        })
    
    passed = (score / total_points) * 100 >= 70
    
    return {
        "score": score,
        "total_points": total_points,
        "percentage": (score / total_points) * 100,
        "passed": passed,
        "question_results": question_results,
        "next_review": (datetime.now() + timedelta(days=1)).isoformat() if passed else None,
        "message": f"Great job! You scored {(score/total_points)*100:.0f}%. Review again in 1 day to reinforce." if passed else "Study the highlighted concepts and try again!"
    }


# FIRST PR ACCELERATION DEMO DATA

@router.get("/first-pr/issues")
async def get_first_pr_issues():
    """
    Return beginner-friendly issues personalized to learned concepts
    
    Demonstrates:
    - GitHub issue discovery
    - Relevance scoring
    - Difficulty estimation
    - Skill alignment
    """
    return [
        {
            "id": "issue_001",
            "title": "Add comprehensive error logging to API Gateway",
            "description": "The API Gateway currently doesn't log all errors. This causes debugging issues in production. Add structured logging for all request failures.",
            "issue_type": "enhancement",
            "difficulty": "easy",
            "estimated_hours": 2,
            "skills_required": ["Logging", "Error Handling", "API Gateway"],
            "points": 50,
            "guidance_steps": [
                "Understand the current error handling in api_gateway/main.py",
                "Review the logging configuration in config/logging.yaml",
                "Add structured logging for 5xx errors",
                "Add logging for authentication failures",
                "Write 2 test cases to verify logs are captured",
                "Create a PR with clear description",
                "Wait for code review feedback"
            ]
        },
        {
            "id": "issue_002",
            "title": "Implement circuit breaker timeout config",
            "description": "The circuit breaker has a hardcoded timeout. Make it configurable via environment variables so teams can tune for their services.",
            "issue_type": "feature",
            "difficulty": "easy",
            "estimated_hours": 3,
            "skills_required": ["Configuration", "Resilience Patterns"],
            "points": 75,
            "guidance_steps": [
                "Locate the circuit breaker implementation in services/resilience.py",
                "Review environment variable patterns used in the codebase",
                "Add CIRCUIT_BREAKER_TIMEOUT to .env.example",
                "Update the circuit breaker to read from environment",
                "Add validation for timeout values",
                "Update documentation with the new configuration",
                "Submit PR with tests"
            ]
        },
        {
            "id": "issue_003",
            "title": "Fix: Database connection pool exhaustion warning",
            "description": "When traffic spikes, we see connection pool exhaustion warnings. Add a warning threshold and monitoring metric.",
            "issue_type": "bug",
            "difficulty": "medium",
            "estimated_hours": 4,
            "skills_required": ["Database", "Monitoring", "Async Patterns"],
            "points": 100,
            "guidance_steps": [
                "Reproduce the connection pool exhaustion issue locally",
                "Review the database pool configuration in core/database.py",
                "Understand the current monitoring metrics",
                "Add connection pool exhaustion alerts",
                "Implement graceful degradation when nearing limits",
                "Add tests for the new monitoring",
                "Document the changes and limits"
            ]
        }
    ]


@router.post("/first-pr/start/{issue_id}")
async def start_first_pr(issue_id: str, user_id: str):
    """
    Start guided PR process
    
    Creates progress tracking and returns guidance
    """
    return {
        "progress": {
            "current_step": 1,
            "total_steps": 7,
            "completed_steps": [],
            "status": "in_progress",
            "selected_issue_id": issue_id
        },
        "message": "Let's get your first PR shipped! Follow the steps on the left. Each step guides you to production-ready code."
    }


@router.post("/first-pr/progress/{issue_id}/step/{step_num}")
async def update_first_pr_progress(issue_id: str, step_num: int, user_id: str):
    """
    Track progress through PR creation
    """
    return {
        "progress": {
            "current_step": step_num + 1,
            "total_steps": 7,
            "completed_steps": list(range(1, step_num + 1)),
            "status": "in_progress" if step_num < 7 else "submitted",
            "selected_issue_id": issue_id
        },
        "message": f"Great! You completed step {step_num}. Moving to step {step_num + 1}..."
    }


# INTEGRATION TEST ENDPOINT

@router.get("/health/demo")
async def demo_health_check():
    """
    Verify all demo endpoints are working
    """
    return {
        "status": "healthy",
        "demo_features": [
            "✅ Team Analytics Dashboard - Shows CTO-level metrics",
            "✅ Knowledge Verification Quizzes - AI-powered assessments",
            "✅ First PR Acceleration - Guided contributions",
            "✅ ROI Calculator - Business justification",
            "✅ Skill Gap Analysis - Team insights"
        ],
        "competitive_advantages": [
            "Cursor can't: Team visibility & analytics",
            "Cursor can't: Knowledge verification with spaced repetition",
            "Cursor can't: First PR acceleration guidance",
            "Cursor can't: ROI metrics for finance approval",
            "Cursor can't: Institutional knowledge capture"
        ],
        "message": "CodeFlow is ready to beat Cursor + MCP in the market! 🚀"
    }
