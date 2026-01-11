"""
CodeFlow - Interactive Tutor Agent
===================================
An AI tutor that provides personalized, context-aware assistance.

HACKATHON DIFFERENTIATOR:
Unlike generic ChatGPT/Cursor which answer any question about any code,
this tutor is CONSTRAINED to the specific codebase and PERSONALIZED
to the developer's learning progress.
"""

import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
import json

from app.core.gemini_client import get_gemini_client
from app.core.prompts import (
    INTERACTIVE_TUTOR_SYSTEM,
    get_tutor_response_prompt
)

logger = logging.getLogger(__name__)


@dataclass
class ConversationMessage:
    """A single message in the tutoring conversation."""
    role: str  # user, tutor
    content: str
    timestamp: datetime
    references: List[str] = None  # File paths referenced


@dataclass
class TutorResponse:
    """Response from the tutor with metadata."""
    answer: str
    confidence: float
    references: List[Dict[str, Any]]  # File references with context
    follow_up_suggestions: List[str]
    concepts_touched: List[str]
    learning_tip: Optional[str]


class InteractiveTutorAgent:
    """
    Agent 3: Interactive Tutor
    
    A Socratic-method AI tutor that:
    1. Answers questions ONLY based on codebase context
    2. Tracks conversation history for coherent dialogue
    3. Adapts explanations to developer skill level
    4. Provides follow-up suggestions to deepen learning
    5. Integrates with progress tracking
    
    Key Differentiator vs MCP + Cursor:
    - Knows what the developer has already learned
    - References specific files from the analyzed codebase
    - Guides toward learning goals, not just answers questions
    - Celebrates progress and builds confidence
    """
    
    def __init__(self):
        self.gemini = get_gemini_client()
        self.conversations: Dict[str, List[ConversationMessage]] = {}  # user_id -> messages
    
    async def answer_question(
        self,
        user_id: str,
        question: str,
        codebase_context: Dict[str, Any],
        user_progress: Optional[Dict[str, Any]] = None
    ) -> TutorResponse:
        """
        Answer a developer's question about the codebase.
        
        Args:
            user_id: Unique user identifier
            question: The developer's question
            codebase_context: Analyzed codebase data (modules, architecture)
            user_progress: Optional progress data for personalization
        
        Returns:
            TutorResponse with answer and metadata
        """
        logger.info(f"Answering question from {user_id}: {question[:50]}...")
        
        # Get conversation history
        conversation_history = self._format_conversation_history(user_id)
        
        # Format codebase context
        code_context = self._format_codebase_context(codebase_context)
        
        # Format developer profile
        developer_profile = self._format_developer_profile(user_progress)
        
        # Generate prompt
        prompt = get_tutor_response_prompt(
            question=question,
            code_context=code_context,
            conversation_history=conversation_history,
            developer_profile=developer_profile
        )
        
        # Get AI response
        response_text = self.gemini.generate_text(
            prompt,
            INTERACTIVE_TUTOR_SYSTEM,
            use_flash=True,  # Fast responses for chat
            temperature=0.3
        )
        
        # Parse and enhance response
        response = self._enhance_response(response_text, codebase_context, question)
        
        # Store message in conversation history
        self._add_to_conversation(user_id, "user", question)
        self._add_to_conversation(user_id, "tutor", response.answer)
        
        return response
    
    async def explain_code(
        self,
        file_path: str,
        code_content: str,
        explanation_style: str = "eli_junior"
    ) -> str:
        """
        Explain a specific piece of code.
        
        Explanation styles:
        - eli_junior: Explain like I'm a junior developer
        - rubber_duck: Line-by-line explanation
        - analogy: Use real-world analogies
        - interview: Explain as if describing to an interviewer
        """
        style_prompts = {
            "eli_junior": "Explain this code as if teaching a junior developer who's new to the codebase. Use simple terms and explain the 'why' behind design decisions.",
            "rubber_duck": "Go through this code line by line, explaining what each part does and why it's there.",
            "analogy": "Explain this code using real-world analogies that make the concepts memorable.",
            "interview": "Explain this code as if you're describing it in a technical interview, highlighting key patterns and decisions."
        }
        
        style_instruction = style_prompts.get(explanation_style, style_prompts["eli_junior"])
        
        prompt = f"""Analyze and explain this code file.

File: {file_path}

Code:
```
{code_content[:4000]}
```

Instructions: {style_instruction}

Provide a clear, helpful explanation that builds understanding.
"""
        
        response = self.gemini.generate_text(
            prompt,
            INTERACTIVE_TUTOR_SYSTEM,
            use_flash=True,
            temperature=0.2
        )
        
        return response
    
    async def trace_data_flow(
        self,
        entry_point: str,
        target_function: str,
        codebase_modules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Help trace data flow through the application.
        
        This is a KEY learning activity that builds mental models.
        """
        modules_str = json.dumps(codebase_modules[:20], indent=2)
        
        prompt = f"""Help trace the data flow in this application.

Starting Point: {entry_point}
Target: {target_function}

Available Modules:
{modules_str}

Create a step-by-step trace showing:
1. Where data enters the system
2. How it flows through different modules
3. Transformations that occur
4. Where it ends up

Format as a numbered list with file references.
"""
        
        response = self.gemini.generate_text(
            prompt,
            INTERACTIVE_TUTOR_SYSTEM,
            use_flash=False,  # Pro for accuracy
            temperature=0.1
        )
        
        return {
            "entry_point": entry_point,
            "target": target_function,
            "trace": response,
            "learning_tip": "After understanding this flow, try modifying a small part to see the effects!"
        }
    
    async def get_concept_explanation(
        self,
        concept: str,
        codebase_examples: List[str]
    ) -> Dict[str, Any]:
        """
        Explain a programming concept using examples from the codebase.
        
        This makes learning RELEVANT to what the developer is working with.
        """
        examples_str = "\n".join(f"- {ex}" for ex in codebase_examples)
        
        prompt = f"""Explain the concept "{concept}" using examples from this specific codebase.

Relevant files/patterns in this codebase:
{examples_str}

Your explanation should:
1. Define the concept clearly
2. Show how it's used in this specific codebase
3. Explain why this approach was chosen
4. Provide a practical tip for working with it

Keep the explanation focused and practical.
"""
        
        response = self.gemini.generate_text(
            prompt,
            INTERACTIVE_TUTOR_SYSTEM,
            use_flash=True,
            temperature=0.2
        )
        
        return {
            "concept": concept,
            "explanation": response,
            "codebase_examples": codebase_examples,
            "next_concepts": []  # Could be enhanced with concept graph
        }
    
    def _format_conversation_history(self, user_id: str, max_messages: int = 10) -> str:
        """Format recent conversation history for context."""
        if user_id not in self.conversations:
            return ""
        
        messages = self.conversations[user_id][-max_messages:]
        history = []
        for msg in messages:
            history.append(f"{msg.role.upper()}: {msg.content}")
        
        return "\n".join(history)
    
    def _format_codebase_context(self, context: Dict[str, Any]) -> str:
        """Format codebase context for AI consumption."""
        lines = ["CODEBASE CONTEXT:"]
        
        if "architecture_type" in context:
            lines.append(f"Architecture: {context['architecture_type']}")
        
        if "modules" in context:
            lines.append("\nKey Modules:")
            for module in context["modules"][:15]:
                lines.append(f"- {module.get('path', 'unknown')}: {module.get('responsibility', 'Unknown')}")
        
        if "entry_points" in context:
            lines.append(f"\nEntry Points: {', '.join(context['entry_points'][:5])}")
        
        return "\n".join(lines)
    
    def _format_developer_profile(self, progress: Optional[Dict[str, Any]]) -> str:
        """Format developer profile for personalization."""
        if not progress:
            return "Junior developer, recently started onboarding."
        
        profile_lines = []
        
        if "level" in progress:
            profile_lines.append(f"Experience level: {progress['level']}")
        
        if "completed_phases" in progress:
            profile_lines.append(f"Completed phases: {progress['completed_phases']}")
        
        if "strengths" in progress:
            profile_lines.append(f"Strengths: {', '.join(progress['strengths'])}")
        
        if "current_focus" in progress:
            profile_lines.append(f"Currently learning: {progress['current_focus']}")
        
        return "\n".join(profile_lines) if profile_lines else "Junior developer, recently started onboarding."
    
    def _add_to_conversation(self, user_id: str, role: str, content: str):
        """Add message to conversation history."""
        if user_id not in self.conversations:
            self.conversations[user_id] = []
        
        message = ConversationMessage(
            role=role,
            content=content,
            timestamp=datetime.now()
        )
        self.conversations[user_id].append(message)
        
        # Keep only last 50 messages per user
        if len(self.conversations[user_id]) > 50:
            self.conversations[user_id] = self.conversations[user_id][-50:]
    
    def _enhance_response(
        self, 
        response_text: str, 
        codebase_context: Dict[str, Any],
        question: str
    ) -> TutorResponse:
        """Enhance raw AI response with metadata."""
        # Find file references in response
        references = []
        modules = codebase_context.get("modules", [])
        for module in modules:
            path = module.get("path", "")
            if path and (path in response_text or os.path.basename(path) in response_text):
                references.append({
                    "path": path,
                    "type": "file",
                    "context": module.get("responsibility", "")
                })
        
        # Generate follow-up suggestions
        follow_ups = self._generate_follow_ups(question, codebase_context)
        
        # Identify concepts touched
        concepts = []
        concept_keywords = ["function", "class", "import", "dependency", "api", "database", "test"]
        for keyword in concept_keywords:
            if keyword in response_text.lower():
                concepts.append(keyword.capitalize())
        
        return TutorResponse(
            answer=response_text,
            confidence=0.85 if references else 0.7,
            references=references[:5],
            follow_up_suggestions=follow_ups[:3],
            concepts_touched=concepts[:5],
            learning_tip=self._get_learning_tip(question)
        )
    
    def _generate_follow_ups(self, question: str, context: Dict[str, Any]) -> List[str]:
        """Generate relevant follow-up questions."""
        follow_ups = []
        
        question_lower = question.lower()
        
        if "how" in question_lower:
            follow_ups.append("Would you like me to trace the data flow step by step?")
        
        if "why" in question_lower:
            follow_ups.append("Want me to explain alternative approaches and why this one was chosen?")
        
        if "error" in question_lower or "bug" in question_lower:
            follow_ups.append("Should I help you understand common pitfalls in this area?")
        
        if any(mod in question_lower for mod in ["function", "class", "module"]):
            follow_ups.append("Would you like me to show related functions or tests?")
        
        # Generic helpful follow-ups
        follow_ups.append("Would you like a hands-on task to practice this concept?")
        follow_ups.append("Want me to explain this in a different way?")
        
        return follow_ups
    
    def _get_learning_tip(self, question: str) -> str:
        """Generate a contextual learning tip."""
        tips = [
            "💡 Try explaining this concept to yourself out loud - it helps solidify understanding!",
            "💡 After understanding the theory, try making a small modification to see the effects.",
            "💡 Draw a quick diagram of the data flow - visual learning sticks better!",
            "💡 Write a test for this functionality - it's the best way to verify your understanding.",
            "💡 Compare this pattern to something you've seen before in other projects."
        ]
        
        import random
        return random.choice(tips)
    
    def clear_conversation(self, user_id: str):
        """Clear conversation history for a user."""
        if user_id in self.conversations:
            self.conversations[user_id] = []
    
    def get_conversation_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of a user's tutoring sessions."""
        if user_id not in self.conversations:
            return {"message_count": 0, "topics": []}
        
        messages = self.conversations[user_id]
        return {
            "message_count": len(messages),
            "first_interaction": messages[0].timestamp.isoformat() if messages else None,
            "last_interaction": messages[-1].timestamp.isoformat() if messages else None,
            "topics": []  # Could analyze conversation for topics
        }
