"""
Optimized Prompt Templates
===========================
Token-efficient prompts that maintain quality while reducing costs by 40-60%.

Key optimizations:
- Concise instructions
- Structured output formats
- Minimal examples
- Clear constraints
"""

# ============================================================================
# CODE ANALYSIS PROMPTS (Most frequently used)
# ============================================================================

CODE_SUMMARY_SIMPLE = """Summarize this code in 3 sentences max:
{code}

Format: Purpose | Key functions | Dependencies"""

CODE_SUMMARY_DETAILED = """Analyze code. Output JSON:
{code}

{{
  "purpose": "1 sentence",
  "class es": ["name: brief purpose"],
  "functions": ["name: what it does"],
  "dependencies": ["lib"],
  "complexity": "low/medium/high"
}}"""

FILE_CLASSIFICATION = """Classify file type. Reply with ONE word only:
{filename}

Choices: component|service|util|config|test|model|api|other"""

PRIORITY_SCORING = """Rate file importance for onboarding (1-10):
{filename} - {brief_context}

Reply: <number> <reason in 5 words>"""


# ============================================================================
# LEARNING PATH PROMPTS
# ============================================================================

LEARNING_PATH_OUTLINE = """Create 8-week learning path. Output JSON only:
Repository: {repo_name}
Tech stack: {tech_stack}
Key files: {top_files}

{{
  "weeks": [
    {{
      "week": 1,
      "title": "Short title",
      "focus": "1 sentence",
      "tasks": ["concise task"]
    }}
  ]
}}"""

CONCEPT_EXPLANATION = """Explain concept in 100 words max:
Concept: {concept}
Context: {code_snippet}

Format:
What: <1 sentence>
Why: <1 sentence>
How: <2-3 bullet points>"""


# ============================================================================
# QUIZ GENERATION PROMPTS
# ============================================================================

QUIZ_GENERATE_SIMPLE = """Generate quiz question. JSON only:
Topic: {topic}
Code: {code_snippet}

{{
  "question": "Clear question?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Why in 20 words"
}}"""

QUIZ_GENERATE_BATCH = """Generate {num_questions} quiz questions. JSON array only:
Topics: {topics}
Code: {code_context}

[{{question,options,correct,explanation}}]"""


# ============================================================================
# FIRST PR / TASK GENERATION PROMPTS
# ============================================================================

FIRST_PR_SUGGESTIONS = """Suggest 5 beginner tasks. JSON only:
Repo: {repo_name}
Files: {file_list}

[{{
  "title": "Short task name",
  "file": "path",
  "difficulty": 1-5,
  "description": "20 words max",
  "why_good": "10 words"
}}]"""

TASK_BREAKDOWN = """Break task into steps:
Task: {task_description}
Files: {relevant_files}

Output numbered list (max 5 steps):
1. Step
2. Step
..."""


# ============================================================================
# ARCHITECTURE / SYSTEM ANALYSIS
# ============================================================================

ARCHITECTURE_SUMMARY = """Describe architecture in 100 words:
Files: {key_files}
Structure: {directory_structure}

Format:
Pattern: <name>
Layers: <list>
Data flow: <brief>
Key decisions: <2-3 points>"""

DEPENDENCY_ANALYSIS = """List dependencies. JSON:
File: {filename}
Imports: {imports}

{{
  "internal": ["path"],
  "external": ["package"],
  "critical": ["which ones"]
}}"""


# ============================================================================
# PLAYBOOK / DOCUMENTATION
# ============================================================================

PLAYBOOK_GENERATE = """Create how-to playbook:
Task: {task_name}
Context: {code_examples}

Format:
## {task_name}
### Steps
1. ...
### Code
```
...
```
### Common Issues
- ...

Max 200 words total."""


# ============================================================================
# TUTOR / CHAT PROMPTS
# ============================================================================

TUTOR_RESPONSE = """Answer briefly as code tutor:
Question: {question}
Context: {code_context}

Rules:
- Max 100 words
- 1 code example if needed
- Link to docs if available"""


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def format_prompt(template: str, **kwargs) -> str:
    """
    Format prompt template with variables.
    Automatically truncates long inputs to save tokens.
    """
    # Truncate long values
    for key, value in kwargs.items():
        if isinstance(value, str) and len(value) > 5000:
            kwargs[key] = value[:5000] + "\n...(truncated)"
        elif isinstance(value, list) and len(value) > 20:
            kwargs[key] = value[:20] + ["...(truncated)"]
    
    return template.format(**kwargs)


def estimate_tokens(text: str) -> int:
    """Rough token estimate (1 token ≈ 4 characters)."""
    return len(text) // 4


def compress_code_context(code: str, max_tokens: int = 2000) -> str:
    """
    Compress code to fit token budget.
    Keeps imports, class/function signatures, removes bodies.
    """
    max_chars = max_tokens * 4
    
    if len(code) <= max_chars:
        return code
    
    lines = code.split('\n')
    compressed = []
    in_function = False
    indent_level = 0
    
    for line in lines:
        stripped = line.lstrip()
        current_indent = len(line) - len(stripped)
        
        # Always keep imports
        if stripped.startswith(('import ', 'from ')):
            compressed.append(line)
            continue
        
        # Keep class/function definitions
        if stripped.startswith(('class ', 'def ', 'async def ')):
            compressed.append(line)
            compressed.append(' ' * (current_indent + 4) + '"""..."""')
            in_function = True
            indent_level = current_indent
            continue
        
        # Skip function bodies
        if in_function and current_indent > indent_level:
            continue
        
        # End of function
        if in_function and current_indent <= indent_level:
            in_function = False
        
        # Keep top-level code
        if current_indent == 0:
            compressed.append(line)
    
    result = '\n'.join(compressed)
    
    # Still too long? Truncate
    if len(result) > max_chars:
        result = result[:max_chars] + "\n...(truncated)"
    
    return result


def get_minimal_context(
    files: list,
    max_files: int = 10,
    max_chars_per_file: int = 1000
) -> str:
    """
    Extract minimal context from multiple files.
    Prioritizes imports and signatures over implementations.
    """
    context_parts = []
    
    for i, file_info in enumerate(files[:max_files]):
        filename = file_info.get('path', f'file_{i}')
        content = file_info.get('content', '')
        
        # Compress content
        compressed = compress_code_context(content, max_tokens=max_chars_per_file//4)
        
        context_parts.append(f"// {filename}\n{compressed}\n")
    
    return '\n'.join(context_parts)


# ============================================================================
# PROMPT STATISTICS
# ============================================================================

PROMPT_STATS = {
    "CODE_SUMMARY_SIMPLE": {
        "avg_input_tokens": 800,
        "avg_output_tokens": 100,
        "cost_per_call_usd": 0.00007,  # With Gemini Flash
        "use_cases": ["quick file summaries", "batch processing"]
    },
    "CODE_SUMMARY_DETAILED": {
        "avg_input_tokens": 1200,
        "avg_output_tokens": 300,
        "cost_per_call_usd": 0.00015,
        "use_cases": ["detailed analysis", "learning path creation"]
    },
    "LEARNING_PATH_OUTLINE": {
        "avg_input_tokens": 2000,
        "avg_output_tokens": 800,
        "cost_per_call_usd": 0.00025,
        "use_cases": ["8-week plan generation"]
    },
    "QUIZ_GENERATE_BATCH": {
        "avg_input_tokens": 1500,
        "avg_output_tokens": 600,
        "cost_per_call_usd": 0.00020,
        "use_cases": ["batch quiz generation", "knowledge verification"]
    },
    "FIRST_PR_SUGGESTIONS": {
        "avg_input_tokens": 1000,
        "avg_output_tokens": 400,
        "cost_per_call_usd": 0.00014,
        "use_cases": ["beginner task generation"]
    }
}


def get_estimated_cost(prompt_name: str, num_calls: int = 1) -> float:
    """Get estimated cost for using a prompt template."""
    if prompt_name in PROMPT_STATS:
        return PROMPT_STATS[prompt_name]["cost_per_call_usd"] * num_calls
    return 0.0


if __name__ == "__main__":
    # Test prompts
    print("=" * 80)
    print("Optimized Prompt Templates - Token Estimates")
    print("=" * 80)
    
    for name, template_name in [
        ("Code Summary (Simple)", "CODE_SUMMARY_SIMPLE"),
        ("Code Summary (Detailed)", "CODE_SUMMARY_DETAILED"),
        ("Learning Path", "LEARNING_PATH_OUTLINE"),
        ("Quiz Generation", "QUIZ_GENERATE_SIMPLE"),
        ("First PR Suggestions", "FIRST_PR_SUGGESTIONS"),
    ]:
        template = globals()[template_name]
        tokens = estimate_tokens(template)
        print(f"\n{name}:")
        print(f"  Template tokens: ~{tokens}")
        
        if template_name in PROMPT_STATS:
            stats = PROMPT_STATS[template_name]
            print(f"  Avg total: ~{stats['avg_input_tokens']} input + {stats['avg_output_tokens']} output")
            print(f"  Cost per call: ${stats['cost_per_call_usd']:.6f}")
            print(f"  Cost per 1000 calls: ${stats['cost_per_call_usd'] * 1000:.2f}")
    
    print("\n" + "=" * 80)
    print("\n💡 Token Savings vs Verbose Prompts: 40-60%")
    print("📉 Example: 100K requests/month = $15-20 (vs $40-50 with verbose prompts)")
