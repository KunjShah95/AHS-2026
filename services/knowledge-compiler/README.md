# CodeGenome - AI-Native Code Intelligence System

> **Not another DeepWiki clone.** Building the next generation of code intelligence where repositories become living knowledge organisms.

## The Vision

CodeGenome treats repositories as **"living knowledge organisms"** — not static code folders. Inspired by Andrej Karpathy's Software 3.0 and LLM Wiki patterns, it builds continuously evolving semantic world models that understand not just *what* code exists, but *why* it exists.

```python
# Traditional code intelligence: "What is this function?"
# CodeGenome: "Why was this written? What was traded off? How has it evolved?"
```

## Quick Start

```bash
cd services/knowledge-compiler
pip install -r requirements.txt
python -m app.main
```

API available at `http://localhost:3003/docs`

## What Makes CodeGenome Different

| Feature | DeepWiki | GitNexus | CodeGenome |
|---------|----------|----------|------------|
| Code understanding | LLM summaries | AST + graph | **AST + graph + reasoning** |
| Memory | None | None | **Persistent, evolving** |
| Intent tracking | None | None | **WHY, ASSUMPTIONS, TRADEOFFS** |
| Evolution tracking | Static | None | **Time machine** |
| Multi-agent | None | None | **Swarm debate** |
| Self-healing docs | Generate once | None | **Continuous update** |
| Decision tracking | None | None | **Full history** |
| Bug propagation | None | None | **Traced over time** |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODEROME PIPELINE                              │
│                                                                  │
│  GitHub Repo → AST Parser → Entity Graph → Intent Layer → Wiki   │
│                            ↓                                      │
│         ┌──────────────┬──────────────┐                        │
│         │   Time       │   Decision    │                        │
│         │   Machine    │   Tracker     │                        │
│         └──────────────┴──────────────┘                        │
│                            ↓                                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐           │
│  │Security │  │ Refactor│  │Architecture│ │   Docs │           │
│  │ Agent   │  │  Agent  │  │   Agent   │  │  Agent  │           │
│  └─────────┘  └─────────┘  └──────────┘  └─────────┘           │
│                            ↓                                      │
│         ┌──────────────────────────────┐                        │
│         │     Architecture Drift +     │                        │
│         │     Tech Debt Calculator     │                        │
│         └──────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Knowledge Compiler (`app/ingest.py`, `app/parser.py`, `app/entities.py`)
Compiles codebases into persistent knowledge structures with multi-language AST parsing.

### 2. Intent Layer (`app/intent.py`)
**Key differentiator.** Captures WHY code exists — not just what it does.

```python
from app.intent import IntentLayer

layer = IntentLayer("./.codegenome/intent")
layer.create_intent(
    target_id="src/payments.py",
    target_type="file",
    purpose="Handles payment processing for the platform",
    assumptions=["Stripe API is available", "User has valid card"],
    tradeoffs_made=[{"what": "sync", "for": "debugging", "sacrificed": "scalability"}]
)
```

Generates: `WHY.md`, `ASSUMPTIONS.md`, `TRADEOFFS.md`

### 3. Decision Tracker (`app/decisions.py`)
Records architectural decisions with full rationale and alternatives considered.

```python
from app.decisions import Decision, DecisionType, DecisionStore

store = DecisionStore()
store.add(Decision(
    id="dec_001",
    title="Use Stripe over Braintree",
    decision_type=DecisionType.ARCHITECTURAL,
    status=DecisionStatus.ACCEPTED,
    rationale="Stripe's webhook system better matches our event-driven architecture",
    alternatives_considered=["Braintree", "PayPal"],
    tradeoffs=["Sacrificed PayPal's merchant support for better API design"],
    affected_files=["src/payments/*", "src/webhooks/*"]
))
```

### 4. Repository Time Machine (`app/time_machine.py`)
Tracks evolution and explains HOW the codebase evolved.

```python
from app.time_machine import TimeMachine

tm = TimeMachine("./my-repo")
report = tm.analyze_evolution()

# Example output:
# "Payments system became unstable after abstraction rewrite in Feb 2026"
```

### 5. Multi-Agent Swarm (`app/agents.py`)
Security, Refactoring, Architecture, and Documentation agents that can debate each other.

```python
from app.agents import MultiAgentOrchestrator, AgentType

orchestrator = MultiAgentOrchestrator()
results = await orchestrator.analyze_repository(files)

# Returns overall health score, findings by severity, per-agent analysis
```

### 6. Architecture Drift Detection (`app/drift.py`)
Detects when actual architecture diverges from intended design.

```python
from app.drift import detect_architecture_drift, calculate_tech_debt

drift_score = detect_architecture_drift(files)
debt = calculate_tech_debt(drift_score)

# Returns: drift_score, grade (A-F), tech_debt_principal, monthly_interest
```

### 7. Wiki Engine (`app/wiki.py`)
Self-healing documentation that evolves with code.

### 8. MCP Server (`app/mcp_server.py`)
AI agent integration via Model Context Protocol.

```python
from app.mcp_server import mcp

# MCP tools exposed:
# - query_knowledge: Hybrid search
# - get_entity_context: 360° symbol view
# - analyze_impact: Blast radius analysis
# - get_intent: WHY code exists
# - detect_changes: Git diff analysis
# - find_related: Semantically related code
# - get_architecture: Module boundaries
# - time_machine: Evolution timeline
# - get_decisions: Architectural decisions
# - get_risk_assessment: Health + tech debt
```

### 9. LLM Intent Inference (`app/llm_intent.py`)
Auto-generate WHY.md, ASSUMPTIONS.md, TRADEOFFS.md from code.

```python
from app.llm_intent import infer_entity_intent

result = await infer_entity_intent(
    entity_id="src/payments.py:process_payment",
    entity_type="function",
    entity_name="process_payment",
    file_path="src/payments.py",
    code="def process_payment(amount): ...",
    context={'complexity': 12, 'imports': ['stripe']},
    provider="openai",
    api_key="sk-..."
)

# Returns: IntentInferenceResult with purpose, assumptions, tradeoffs, confidence
```

### 10. Agent Debate System (`app/debate.py`)
Multi-agent debate with conflict resolution.

```python
from app.debate import debate_git_diff

result = await debate_git_diff(diff_content, commit_message)

# Returns debate with:
# - positions: Each agent's position
# - conflicts: Detected conflicts between agents
# - verdict: Moderator's decision
# - summary: Markdown debate summary
```

## API Endpoints

### Core Analysis
```bash
POST /api/v1/analyze              # Full pipeline: ingest → parse → graph → wiki
GET  /api/v1/repos/{owner}/{name}  # Get cached analysis
```

### Advanced Analysis
```bash
POST /api/v1/repos/{owner}/{name}/agents/analyze   # Multi-agent analysis
GET  /api/v1/repos/{owner}/{name}/drift             # Architecture drift detection
GET  /api/v1/repos/{owner}/{name}/tech-debt        # Tech debt financial model
GET  /api/v1/repos/{owner}/{name}/intent            # Intent layer analysis
GET  /api/v1/repos/{owner}/{name}/full-analysis    # Complete analysis report
```

## Example Output

### Multi-Agent Analysis
```json
{
  "overall_health": 78,
  "aggregated": {
    "security": {"avg_score": 85, "findings_by_severity": {"high": 2}},
    "architecture": {"avg_score": 72, "findings_by_severity": {"critical": 1}},
    "refactoring": {"avg_score": 80, "findings_by_severity": {"medium": 3}}
  }
}
```

### Tech Debt Financial Model
```json
{
  "drift_score": 78,
  "drift_grade": "B",
  "tech_debt": {
    "debt_principal": 2400,
    "monthly_interest": 120,
    "risk_level": "medium"
  }
}
```

## Roadmap

### Phase 1: MVP ✓
- [x] GitHub repo ingestion
- [x] Multi-language AST parsing
- [x] Entity graph construction
- [x] Basic wiki generation
- [x] Natural language query

### Phase 2: Intelligence ✓
- [x] Intent layer (WHY, ASSUMPTIONS, TRADEOFFS)
- [x] Decision tracking
- [x] Multi-agent analysis
- [x] Architecture drift detection
- [x] LLM-powered intent inference

### Phase 3: Autonomy ✓
- [x] MCP server for AI agent integration
- [x] LLM intent inference engine
- [x] Agent debate system
- [ ] Architecture simulation
- [ ] Self-healing wiki
- [ ] Personal engineering brain
- [ ] Bug propagation tracking

### Phase 4: Platform (Future)
- [ ] Cross-repo intelligence
- [ ] Team knowledge mapping
- [ ] Real-time collaboration

## Why India is the Right Market

Current AI coding tools optimize for:
- Silicon Valley teams
- Enterprise workflows
- English-heavy engineering

India opportunity:
- **Indie hackers**: Fast iteration, tight budgets
- **Freelancers**: Multiple codebases, need speed
- **Agencies**: Many clients, fast onboarding
- **Students**: Learning curve reduction
- **Startups**: Move fast, break things (with intelligence)
- **Outsourced teams**: Knowledge transfer is painful

## References

- [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [GitNexus](https://github.com/abhigyanpatwari/GitNexus) (36K stars)
- [Software 3.0](https://www.latent.space/p/s3)
- [CoreStory](https://corestory.ai/post/the-ai-native-code-intelligence-stack)

## License

MIT