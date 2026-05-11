"""
Context Injector - injects developer profile into LLM prompts for personalized responses.
"""

from typing import Optional
from .dev_profile import DeveloperProfile


class ContextInjector:
    """Inject developer profile into LLM calls."""

    def __init__(self):
        pass

    def build_system_context(self, profile: DeveloperProfile) -> str:
        """Build system prompt suffix from profile."""
        context_parts = ["\n\n# Developer Context\n"]
        context_parts.append(
            "This response should be tailored to the following developer profile:\n"
        )

        paradigm_descriptions = {
            "functional": "Prefers functional patterns (map/filter/reduce, pure functions, immutability)",
            "oop": "Prefers object-oriented patterns (classes, encapsulation, inheritance)",
            "procedural": "Prefers procedural/imperative style",
            "mixed": "Comfortable with multiple paradigms",
        }

        context_parts.append(
            f"- **Paradigm**: {paradigm_descriptions.get(profile.preferred_paradigm, profile.preferred_paradigm)}"
        )
        context_parts.append(f"- **Primary Language**: {profile.preferred_language}")

        if profile.naming_conventions:
            naming_str = ", ".join(profile.naming_conventions)
            context_parts.append(f"- **Naming Conventions**: {naming_str}")

        level_descriptions = {
            "beginner": "Explain concepts with more detail, avoid jargon, provide simple examples",
            "intermediate": "Balanced explanations, some technical detail, practical examples",
            "expert": "Concise explanations, assume deep knowledge, focus on edge cases",
        }
        context_parts.append(f"- **Technical Level**: {profile.technical_level}")
        context_parts.append(
            f"  - {level_descriptions.get(profile.technical_level, 'Balanced explanations')}"
        )

        if profile.include_examples:
            context_parts.append("- **Include code examples**: Yes")
        else:
            context_parts.append("- **Include code examples**: No")

        depth_descriptions = {
            "brief": "Keep responses concise (1-2 paragraphs)",
            "detailed": "Provide thorough explanations (3-4 paragraphs with examples)",
            "comprehensive": "Provide exhaustive coverage (full details, multiple examples, edge cases)",
        }
        context_parts.append(
            f"- **Explanation Depth**: {depth_descriptions.get(profile.explanation_depth, profile.explanation_depth)}"
        )

        commit_style_note = {
            "conventional": "Use conventional commit style in examples (feat:, fix:, refactor:)",
            "narrative": "Use narrative explanations in commit-style examples",
            "minimal": "Keep explanations concise",
        }
        context_parts.append(f"\n# Response Style Notes\n")
        context_parts.append(
            f"- {commit_style_note.get(profile.commit_style, 'Standard explanations')}"
        )

        return "\n".join(context_parts)

    def inject_preferences(self, prompt: str, profile: DeveloperProfile) -> str:
        """Modify prompt based on user preferences."""
        if profile.query_style == "command":
            return f"Command-style query: {prompt}\nProvide direct, actionable answer."
        elif profile.query_style == "question":
            return (
                f"Question from user: {prompt}\nAnswer with explanation and reasoning."
            )
        else:
            return f"Exploratory query: {prompt}\nProvide comprehensive context and connections."

    def adapt_explanation(self, explanation: str, profile: DeveloperProfile) -> str:
        """Adapt an existing explanation to user's style preferences."""
        if profile.explanation_depth == "brief":
            paragraphs = explanation.split("\n\n")
            if len(paragraphs) > 2:
                explanation = "\n\n".join(paragraphs[:2])

        return explanation

    def get_response_config(self, profile: DeveloperProfile) -> dict:
        """Get response configuration based on profile."""
        config = {
            "temperature": 0.3,
            "max_tokens": 4096,
        }

        if profile.technical_level == "expert":
            config["max_tokens"] = 2000
        elif profile.technical_level == "beginner":
            config["max_tokens"] = 6000

        return config


def inject_profile_into_prompt(
    base_prompt: str,
    profile: Optional[DeveloperProfile],
) -> tuple[str, Optional[dict]]:
    """Convenience function to inject profile into any prompt."""
    if profile is None:
        return base_prompt, None

    injector = ContextInjector()
    modified_prompt = injector.inject_preferences(base_prompt, profile)
    config = injector.get_response_config(profile)
    system_context = injector.build_system_context(profile)

    return f"{system_context}\n\n{modified_prompt}", config


def adapt_response(
    response: str,
    profile: Optional[DeveloperProfile],
) -> str:
    """Adapt a response to match profile preferences."""
    if profile is None:
        return response

    injector = ContextInjector()
    return injector.adapt_explanation(response, profile)
