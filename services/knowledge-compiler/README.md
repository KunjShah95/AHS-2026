# CodeGenome - AI-Native Code Intelligence System

> **Not another DeepWiki clone.** Building the next generation of code intelligence where repositories become living knowledge organisms — powered by Phase 4 Intelligence Network.

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
| Cross-repo intelligence | None | None | **Pattern DB + unified graph** |
| Team knowledge | None | None | **Expertise mapping + gaps** |
| Personalization | None | None | **Dev profile + style adaptation** |
| What-if simulation | None | None | **Hybrid rule + LLM** |
| Live collaboration | None | None | **SSE + presence** |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODEROME PIPELINE                              │
│                                                                  │
│  GitHub Repo → AST Parser → Entity Graph → Intent Layer → Wiki   │
│                            ↓                                      │
│         ┌──────────────┬──────────────┐  ┌──────────────────┐   │
│         │   Time       │   Decision    │  │  Cross-Repo      │   │
│         │   Machine    │   Tracker     │  │  Graph Store     │   │
│         └──────────────┴──────────────┘  └──────────────────┘   │
│                            ↓                     ↓               │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐           │
│  │Security │  │ Refactor│  │Architecture│ │   Docs │           │
│  │ Agent   │  │  Agent  │  │   Agent   │  │  Agent  │           │
│  └─────────┘  └─────────┘  └──────────┘  └─────────┘           │
│                            ↓                                      │
│         ┌──────────────────────────────┐  ┌───────────────┐   │
│         │     Architecture Drift +     │  │  Simulation   │   │
│         │     Tech Debt Calculator     │  │    Engine     │   │
│         └──────────────────────────────┘  └───────────────┘   │
│                            ↓                     ↓               │
│    ┌──────────────────────────────────────────────────────┐   │
│    │         TEAM KNOWLEDGE LAYER                           │   │
│    │  Contributor Analysis │ Expertise │ Knowledge Gaps     │   │
│    └──────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│    ┌──────────────────────────────────────────────────────┐   │
│    │         PERSONALIZATION LAYER                          │   │
│    │  Dev Profiles │ Profile Builder │ Context Injector     │   │
│    └──────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│    ┌──────────────────────────────────────────────────────┐   │
│    │         COLLABORATION LAYER                            │   │
│    │  SSE Presence │ Collab Rooms │ Event Bus               │   │
│    └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules (Phase 1-3)

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

# MCP tools exposed (20 total):
# Query & Context: query_knowledge, get_entity_context, get_intent, detect_changes
# Analysis: analyze_impact, find_related, get_architecture
# Evolution: time_machine, explain_commit, trace_evolution
# Decision: get_decisions, get_risk_assessment
# Cross-repo: find_cross_repo_pattern, get_cross_repo_entities, find_similar_across_repos
# Team: get_module_ownership, find_expert, suggest_code_reviewers, detect_knowledge_gaps
# Simulation: simulate_what_if, get_blast_radius, plan_migration
# Collaboration: get_page_presence, get_live_collaborators
```

### 9. LLM Intent Inference (`app/llm_intent.py`)
Auto-generates WHY.md, ASSUMPTIONS.md, TRADEOFFS.md from code. Supports personalized explanations via developer profiles.

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

## Phase 4 Modules (Intelligence Network)

### 11. Cross-Repo Intelligence (`app/cross_repo_graph.py`, `app/pattern_db.py`)
Learn patterns across multiple codebases.

```python
from app.cross_repo_graph import CrossRepoGraphStore
from app.pattern_db import PatternDatabase

# Merge entity graphs across repos
graph = CrossRepoGraphStore()
graph.merge_repo_graph("my-org/my-repo", entities)

# Find patterns across repos
db = PatternDatabase()
db.register_pattern(pattern_type="authentication", code_snippet=code, repo_id="...")
results = db.search(pattern_type="authentication")
```

### 12. Team Knowledge Mapping (`app/team_knowledge.py`, `app/contributor.py`)
Map expertise to modules. Who knows what about which code.

```python
from app.team_knowledge import TeamKnowledgeMapper

mapper = TeamKnowledgeMapper("./my-repo")
ownership = mapper.get_module_ownership()
reviewers = mapper.suggest_reviewers("src/auth/login.py")
gaps = mapper.get_knowledge_gaps()

# Example output:
# {
#   "src/auth/*": {"primary": ["@alice", "@bob"], "secondary": ["@carol"]},
#   "knowledge_gaps": [{"file": "src/legacy/payments.py", "risk": "high", "owner": "@dave"}]
# }
```

### 13. Personal Engineering Brain (`app/dev_profile.py`, `app/profile_builder.py`, `app/context_injector.py`)
Adapt every response to individual developer style.

```python
from app.profile_builder import ProfileBuilder
from app.context_injector import ContextInjector

builder = ProfileBuilder()
profile = builder.build_profile(dev_id="alice", repo_path="./my-repo")
# Detects: preferred paradigm (OOP/functional), naming conventions, commit style, explanation depth

injector = ContextInjector(profile)
context = injector.build_system_context()
# "You are explaining code to a developer who prefers functional patterns..."
```

### 14. Architecture Simulation (`app/simulation/`)
Hybrid rule-based + LLM what-if analysis for code changes.

```python
from app.simulation import SimulationEngine, BlastRadiusAnalyzer

# Rule-based blast radius
analyzer = BlastRadiusAnalyzer(graph)
blast = analyzer.analyze_blast_radius("src/auth/", change_type="delete")

# Full what-if with complexity routing
engine = SimulationEngine()
result = engine.simulate(
    scenario="Extract auth service to microservices",
    tier="full",
    llm_client=client
)
```

### 15. Real-Time Collaboration (`app/collaborate.py`)
Live wiki editing with SSE presence awareness.

```python
from app.collaborate import CollaborationManager

manager = CollaborationManager()
room = manager.join_page("api/auth", user_id="alice")

# SSE endpoint: GET /api/v1/wiki/{page}/presence
# Returns live presence stream with heartbeat
```

## API Endpoints

### Core Analysis
```bash
POST /api/v1/analyze              # Full pipeline: ingest → parse → graph → wiki
GET  /api/v1/repos/{owner}/{name}  # Get cached analysis
```

### Multi-Agent & Intelligence
```bash
POST /api/v1/repos/{owner}/{name}/agents/analyze   # Multi-agent analysis
GET  /api/v1/repos/{owner}/{name}/drift             # Architecture drift detection
GET  /api/v1/repos/{owner}/{name}/tech-debt        # Tech debt financial model
GET  /api/v1/repos/{owner}/{name}/intent            # Intent layer analysis
GET  /api/v1/repos/{owner}/{name}/full-analysis    # Complete analysis report
```

### Cross-Repo Intelligence (Phase 4)
```bash
GET  /api/v1/repos/{owner}/{name}/cross-repo-graph  # Get merged cross-repo graph
GET  /api/v1/cross-repo/graph                       # Full cross-repo graph
GET  /api/v1/cross-repo/query                       # Query entities across repos
GET  /api/v1/pattern/types                          # List pattern types
POST /api/v1/pattern/search                        # Search patterns across repos
POST /api/v1/pattern/register                      # Register a pattern
```

### Team Knowledge (Phase 4)
```bash
GET  /api/v1/repos/{owner}/{name}/team/analyze       # Analyze team knowledge
GET  /api/v1/repos/{owner}/{name}/ownership          # Module ownership map
GET  /api/v1/repos/{owner}/{name}/expertise/{author} # Contributor expertise
GET  /api/v1/repos/{owner}/{name}/reviewers/{file}   # Suggest reviewers
GET  /api/v1/repos/{owner}/{name}/knowledge-gaps    # Detect single points of failure
GET  /api/v1/repos/{owner}/{name}/team/contributors  # All contributors
```

### Personalization (Phase 4)
```bash
POST /api/v1/repos/{owner}/{name}/profiles/{dev_id}/build  # Build profile from git
GET  /api/v1/repos/{owner}/{name}/profiles/{dev_id}        # Get developer profile
PUT  /api/v1/repos/{owner}/{name}/profiles/{dev_id}         # Update preferences
GET  /api/v1/repos/{owner}/{name}/profiles                  # List all profiles
```

### Simulation (Phase 4)
```bash
POST /api/v1/simulate/what-if              # What-if analysis
GET  /api/v1/simulate/{sim_id}            # Get simulation result
GET  /api/v1/simulate/blast-radius/{file} # Blast radius for file change
POST /api/v1/simulate/migration           # Migration path planning
```

### Collaboration (Phase 4)
```bash
GET  /api/v1/wiki/{page}/presence         # SSE presence stream
POST /api/v1/wiki/{page}/join             # Join collaboration room
POST /api/v1/wiki/{page}/leave            # Leave collaboration room
POST /api/v1/wiki/{page}/edit             # Submit edit with version check
GET  /api/v1/wiki/{page}/collaborators    # Get active collaborators
GET  /api/v1/wiki/{page}/content          # Get current content + version
GET  /api/v1/collaboration/active-pages  # All pages with collaborators
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

### Phase 3: Autonomy ✓ (COMPLETE)
- [x] MCP server for AI agent integration (20 tools)
- [x] LLM intent inference engine
- [x] Agent debate system
- [x] Time Machine (commit history + pattern analysis)
- [x] Self-healing wiki
- [x] Bug propagation tracking
- [x] Multi-agent swarm orchestration

### Phase 4: Intelligence Network ✓ (IMPLEMENTED)
- [x] Cross-repo intelligence (CrossRepoGraphStore + PatternDatabase)
- [x] Team knowledge mapping (TeamKnowledgeMapper + ContributorTracker)
- [x] Personal engineering brain (DevProfile + ProfileBuilder + ContextInjector)
- [x] Architecture simulation (SimulationEngine + BlastRadiusAnalyzer)
- [x] Real-time collaboration (CollaborationManager + SSE Presence)

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
