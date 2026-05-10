"""
LLM Intent Inference Engine

Automatically infers the WHY behind code using LLM reasoning.
Generates WHY.md, ASSUMPTIONS.md, TRADEOFFS.md for entities.

Key features:
- Structured output extraction
- Confidence-based filtering
- Intent verification loop
- Incremental inference (not batch)
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
import hashlib


# Intent inference result
@dataclass
class IntentInferenceResult:
    """Result from LLM intent inference."""

    entity_id: str
    entity_type: str

    # Core intent
    purpose: str = ""
    why_exists: str = ""
    problem_solved: str = ""

    # Supporting context
    assumptions: List[str] = field(default_factory=list)
    tradeoffs: List[Dict[str, str]] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)

    # Quality metrics
    confidence: float = 0.0
    reasoning: str = ""
    source_snippets: List[str] = field(default_factory=list)

    # Metadata
    inferred_at: datetime = field(default_factory=datetime.now)
    model_used: str = ""
    tokens_used: int = 0


# Prompt templates
SYSTEM_PROMPT = """You are a senior software architect with 20 years of experience analyzing code.
Your task is to infer the INTENTION behind code entities.

For each entity, extract:
1. PURPOSE: What problem does this solve? Be specific, not generic.
2. ASSUMPTIONS: What must be true for this to work correctly?
3. TRADEOFFS: What design tradeoffs were made?

Return STRUCTURED JSON. Do not speculate beyond what is evident in the code.

Confidence scoring guidelines:
- 0.9-1.0: Intent is EXPLICIT in comments/docstrings
- 0.7-0.9: Intent is CLEAR from code structure and naming
- 0.5-0.7: Intent is a REASONABLE inference
- 0.3-0.5: Mention but flag as uncertain
- <0.3: Do not include

CRITICAL RULES:
- NEVER invent intent. If unclear, return confidence < 0.5
- Focus on BUSINESS logic, not implementation details
- Look for WHY patterns in comments (because, designed to, intended to)
- Consider what would break if this code didn't exist
- Identify tradeoffs by what is sacrificed vs what is gained

Return this exact JSON structure:
{
  "purpose": "one sentence describing what problem this solves",
  "assumptions": ["assumption 1", "assumption 2"],
  "tradeoffs": [
    {"what": "what was chosen", "for": "what benefit", "sacrificed": "what was given up"}
  ],
  "confidence": 0.85,
  "reasoning": "brief explanation of why this inference"
}"""


ENTITY_CONTEXT_PROMPT = """Analyze this {entity_type} and infer its intent.

Name: {entity_name}
File: {file_path}

Code:
```{language}
{code}
```

Context:
- Complexity: {complexity}
- Imports: {imports}
- Called by: {callers}
- Calls: {callees}

Analyze the code structure, naming, comments, and context to infer WHY this entity exists.

Return JSON:"""


# Intent cache
class IntentCache:
    """Cache for inferred intents to avoid repeated LLM calls."""

    def __init__(self, cache_dir: str = "./.codegenome/intent_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache: Dict[str, IntentInferenceResult] = {}
        self._load_cache()

    def _load_cache(self):
        cache_file = self.cache_dir / "intents.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r") as f:
                    data = json.load(f)
                    for entity_id, item in data.items():
                        self.cache[entity_id] = self._deserialize(item)
            except Exception:
                pass

    def _serialize(self, result: IntentInferenceResult) -> dict:
        return {
            "entity_id": result.entity_id,
            "entity_type": result.entity_type,
            "purpose": result.purpose,
            "why_exists": result.why_exists,
            "problem_solved": result.problem_solved,
            "assumptions": result.assumptions,
            "tradeoffs": result.tradeoffs,
            "constraints": result.constraints,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
            "source_snippets": result.source_snippets,
            "inferred_at": result.inferred_at.isoformat(),
            "model_used": result.model_used,
            "tokens_used": result.tokens_used,
        }

    def _deserialize(self, data: dict) -> IntentInferenceResult:
        return IntentInferenceResult(
            entity_id=data["entity_id"],
            entity_type=data["entity_type"],
            purpose=data.get("purpose", ""),
            why_exists=data.get("why_exists", ""),
            problem_solved=data.get("problem_solved", ""),
            assumptions=data.get("assumptions", []),
            tradeoffs=data.get("tradeoffs", []),
            constraints=data.get("constraints", []),
            confidence=data.get("confidence", 0.0),
            reasoning=data.get("reasoning", ""),
            source_snippets=data.get("source_snippets", []),
            inferred_at=datetime.fromisoformat(
                data.get("inferred_at", datetime.now().isoformat())
            ),
            model_used=data.get("model_used", ""),
            tokens_used=data.get("tokens_used", 0),
        )

    def save(self):
        cache_file = self.cache_dir / "intents.json"
        with open(cache_file, "w") as f:
            json.dump(
                {k: self._serialize(v) for k, v in self.cache.items()}, f, indent=2
            )

    def get(self, entity_id: str) -> Optional[IntentInferenceResult]:
        return self.cache.get(entity_id)

    def set(self, entity_id: str, result: IntentInferenceResult):
        self.cache[entity_id] = result
        self.save()

    def clear(self):
        self.cache.clear()
        self.save()


# LLM Client wrapper
class LLMIntentClient:
    """
    LLM client for intent inference.

    Supports:
    - OpenAI
    - Anthropic (Claude)
    - Azure OpenAI
    - Ollama (local)
    """

    def __init__(
        self, provider: str = "openai", api_key: str = None, model: str = None
    ):
        self.provider = provider
        self.api_key = api_key
        self.model = model or self._default_model()

        # Lazy import to avoid dependency issues
        self._client = None

    def _default_model(self) -> str:
        models = {
            "openai": "gpt-4o",
            "anthropic": "claude-sonnet-4-20250514",
            "azure": "gpt-4o",
            "ollama": "llama3",
        }
        return models.get(self.provider, "gpt-4o")

    def _get_client(self):
        if self._client is None:
            if self.provider == "openai":
                from openai import AsyncOpenAI

                self._client = AsyncOpenAI(api_key=self.api_key)
            elif self.provider == "anthropic":
                import anthropic

                self._client = anthropic.AsyncAnthropic(api_key=self.api_key)
            elif self.provider == "ollama":
                from app.ollama_client import OllamaClient

                self._client = OllamaClient(base_url="http://localhost:11434")
            elif self.provider == "azure":
                from openai import AsyncAzureOpenAI

                self._client = AsyncAzureOpenAI(
                    api_key=self.api_key,
                    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
                    api_version="2024-02-01",
                )
        return self._client

    async def complete(self, prompt: str, system: str = SYSTEM_PROMPT) -> str:
        """Generate completion for intent inference."""
        client = self._get_client()

        if self.provider == "openai":
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,  # Low temp for consistent structured output
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content

        elif self.provider == "anthropic":
            response = await client.messages.create(
                model=self.model,
                system=system,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )
            return response.content[0].text

        elif self.provider == "ollama":
            return await client.complete(prompt, system)

        elif self.provider == "azure":
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content

        raise ValueError(f"Unknown provider: {self.provider}")

    async def infer_intent(
        self,
        entity_id: str,
        entity_type: str,
        entity_name: str,
        file_path: str,
        code: str,
        context: Dict[str, Any],
    ) -> IntentInferenceResult:
        """
        Infer intent for a code entity.

        Args:
            entity_id: Unique identifier
            entity_type: function, class, module, etc.
            entity_name: Name of the entity
            file_path: Path to containing file
            code: The actual code
            context: Additional context (imports, callers, callees)
        """
        # Build prompt
        language = self._detect_language(file_path)

        # Truncate code if too long
        max_code_len = 3000
        truncated_code = code[:max_code_len] if len(code) > max_code_len else code

        prompt = ENTITY_CONTEXT_PROMPT.format(
            entity_type=entity_type,
            entity_name=entity_name,
            file_path=file_path,
            language=language,
            code=truncated_code,
            complexity=context.get("complexity", 0),
            imports=", ".join(context.get("imports", [])[:10]),
            callers=", ".join(context.get("callers", [])[:5]),
            callees=", ".join(context.get("callees", [])[:10]),
        )

        try:
            response = await self.complete(prompt, SYSTEM_PROMPT)
            result = self._parse_response(response)

            # Create inference result
            inference = IntentInferenceResult(
                entity_id=entity_id,
                entity_type=entity_type,
                purpose=result.get("purpose", ""),
                assumptions=result.get("assumptions", []),
                tradeoffs=result.get("tradeoffs", []),
                confidence=result.get("confidence", 0.0),
                reasoning=result.get("reasoning", ""),
                model_used=self.model,
                tokens_used=len(prompt) + len(response),
            )

            return inference

        except Exception as e:
            # Return empty result on error
            return IntentInferenceResult(
                entity_id=entity_id,
                entity_type=entity_type,
                confidence=0.0,
                reasoning=f"Error: {str(e)}",
            )

    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension."""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".jsx": "javascript",
            ".tsx": "typescript",
            ".go": "go",
            ".rs": "rust",
            ".java": "java",
            ".cs": "csharp",
            ".cpp": "cpp",
            ".c": "c",
            ".rb": "ruby",
            ".php": "php",
            ".swift": "swift",
            ".kt": "kotlin",
        }
        ext = Path(file_path).suffix.lower()
        return ext_map.get(ext, "text")

    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse LLM response into structured result."""
        try:
            # Try to parse as JSON
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re

            json_pattern = (
                r'\{[^{}]*"purpose"[^{}]*"assumptions"[^{}]*"tradeoffs"[^{}]*\}'
            )
            match = re.search(json_pattern, response, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass

            # Return empty on parse failure
            return {
                "purpose": "",
                "assumptions": [],
                "tradeoffs": [],
                "confidence": 0.0,
                "reasoning": "Parse failed",
            }


# Intent inference orchestrator
class IntentInferenceOrchestrator:
    """
    Orchestrates intent inference across a codebase.

    Features:
    - Incremental inference (not batch)
    - Confidence-based filtering
    - Caching to avoid repeated LLM calls
    - Verification loop for code changes
    """

    def __init__(self, llm_client: LLMIntentClient = None):
        self.llm_client = llm_client or LLMIntentClient()
        self.cache = IntentCache()

    async def infer_for_entity(
        self,
        entity_id: str,
        entity_type: str,
        entity_name: str,
        file_path: str,
        code: str,
        context: Dict[str, Any],
    ) -> IntentInferenceResult:
        """Infer intent for a single entity."""
        # Check cache first
        cached = self.cache.get(entity_id)
        if cached:
            return cached

        # Check confidence threshold
        complexity = context.get("complexity", 0)
        if entity_type == "function" and complexity < 5:
            # Skip simple utility functions
            return IntentInferenceResult(
                entity_id=entity_id,
                entity_type=entity_type,
                confidence=0.0,
                reasoning="Skipped - complexity too low",
            )

        # Infer via LLM
        inference = await self.llm_client.infer_intent(
            entity_id=entity_id,
            entity_type=entity_type,
            entity_name=entity_name,
            file_path=file_path,
            code=code,
            context=context,
        )

        # Only cache high-confidence results
        if inference.confidence >= 0.5:
            self.cache.set(entity_id, inference)

        return inference

    async def infer_for_file(
        self, file_path: str, code: str, entities: List[Dict[str, Any]]
    ) -> List[IntentInferenceResult]:
        """Infer intent for all entities in a file."""
        results = []

        for entity in entities:
            inference = await self.infer_for_entity(
                entity_id=entity["id"],
                entity_type=entity.get("type", "function"),
                entity_name=entity.get("name", "unknown"),
                file_path=file_path,
                code=entity.get("code", ""),
                context={
                    "complexity": entity.get("complexity", 0),
                    "imports": entity.get("imports", []),
                    "callers": entity.get("called_by", []),
                    "callees": entity.get("calls", []),
                },
            )

            if inference.confidence >= 0.5:
                results.append(inference)

        return results

    def verify_intent(
        self, entity_id: str, current_code: str, old_intent: IntentInferenceResult
    ) -> Dict[str, Any]:
        """
        Verify that intent still matches code.

        Returns drift analysis between intent and code.
        """
        drift_score = 0.0
        issues = []

        # Check assumptions
        for assumption in old_intent.assumptions:
            if assumption.lower() not in current_code.lower():
                drift_score += 0.1
                issues.append(f"Assumption may be stale: {assumption}")

        # Check purpose keywords
        purpose_keywords = old_intent.purpose.lower().split()
        purpose_matches = sum(
            1 for kw in purpose_keywords if kw in current_code.lower()
        )
        purpose_ratio = (
            purpose_matches / len(purpose_keywords) if purpose_keywords else 0
        )

        if purpose_ratio < 0.5:
            drift_score += 0.3
            issues.append("Purpose keywords no longer present in code")

        return {
            "entity_id": entity_id,
            "status": "verified" if drift_score < 0.3 else "drifted",
            "drift_score": drift_score,
            "issues": issues,
            "confidence": old_intent.confidence,
        }

    def generate_markdown_docs(
        self, inference: IntentInferenceResult
    ) -> Dict[str, str]:
        """Generate WHY.md, ASSUMPTIONS.md, TRADEOFFS.md for an inference."""

        why_md = f"""# WHY: {inference.entity_id}

**Purpose**: {inference.purpose}

**Confidence**: {inference.confidence:.0%}
**Inferred**: {inference.inferred_at.strftime("%Y-%m-%d")}
**Model**: {inference.model_used}

## Reasoning

{inference.reasoning}
"""

        assumptions_md = f"""# ASSUMPTIONS: {inference.entity_id}

This code assumes the following conditions are true:

"""
        if inference.assumptions:
            for i, assumption in enumerate(inference.assumptions, 1):
                assumptions_md += f"{i}. {assumption}\n"
        else:
            assumptions_md += "*No explicit assumptions documented.*\n"

        assumptions_md += f"""
---
**Note**: These assumptions were inferred from code structure and context.
Confidence: {inference.confidence:.0%}
"""

        tradeoffs_md = f"""# TRADEOFFS: {inference.entity_id}

This code makes the following tradeoffs:

"""
        if inference.tradeoffs:
            for tradeoff in inference.tradeoffs:
                tradeoffs_md += f"""## {tradeoff.get("what", "Tradeoff")}

**For**: {tradeoff.get("for", "unknown benefit")}
**Sacrificed**: {tradeoff.get("sacrificed", "unknown cost")}

"""
        else:
            tradeoffs_md += "*No explicit tradeoffs documented.*\n"

        tradeoffs_md += f"""
---
**Note**: These tradeoffs were inferred from design decisions.
Confidence: {inference.confidence:.0%}
"""

        return {
            "WHY.md": why_md,
            "ASSUMPTIONS.md": assumptions_md,
            "TRADEOFFS.md": tradeoffs_md,
        }


# Standalone inference function
async def infer_entity_intent(
    entity_id: str,
    entity_type: str,
    entity_name: str,
    file_path: str,
    code: str,
    context: Dict[str, Any],
    provider: str = "openai",
    api_key: str = None,
) -> IntentInferenceResult:
    """
    Convenience function for single-entity intent inference.
    """
    client = LLMIntentClient(provider=provider, api_key=api_key)
    orchestrator = IntentInferenceOrchestrator(client)

    return await orchestrator.infer_for_entity(
        entity_id=entity_id,
        entity_type=entity_type,
        entity_name=entity_name,
        file_path=file_path,
        code=code,
        context=context,
    )
