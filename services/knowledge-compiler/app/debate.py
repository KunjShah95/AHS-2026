"""
Debate System for Multi-Agent Swarm

Implements the full debate system where different agent perspectives
(Security, Architecture, Refactoring, Performance) debate changes.

Based on 20 years of engineering experience: the best decisions come from
constructive conflict, not sequential review.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
import uuid
import asyncio
import re
import hashlib

from .agents import AgentType


class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    def value_level(self) -> int:
        levels = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        return levels.get(self.value, 0)


class Verdict(Enum):
    APPROVE = "approve"
    REQUEST_CHANGES = "request_changes"
    BLOCK = "block"


@dataclass
class Evidence:
    """Evidence supporting a finding"""

    agent_type: AgentType
    statement: str
    code_snippet: Optional[str] = None
    source: str = "analysis"


@dataclass
class Finding:
    """A finding from an agent"""

    id: str
    finding_type: str
    description: str
    severity: Severity
    file_path: str
    line_number: Optional[int] = None
    evidence: List[Evidence] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    confidence: float = 0.8
    contested: bool = False
    contesting_agents: List[AgentType] = field(default_factory=list)
    final_severity: Optional[Severity] = None


@dataclass
class DebateRound:
    """A single debate round"""

    round_number: int
    agent_type: AgentType
    action: str
    content: str
    target_finding_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DebateResult:
    """Result of the multi-agent debate"""

    debate_id: str
    consensus_score: float
    security_vetoed: bool
    rounds: List[DebateRound] = field(default_factory=list)
    findings: List[Finding] = field(default_factory=list)
    reasoning_trace: List[str] = field(default_factory=list)
    final_recommendations: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentPosition:
    """A single agent's position on a change (for git diff analysis)"""

    agent_type: AgentType
    verdict: Verdict
    severity: Severity

    concerns: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    reasoning: str = ""

    supporting_evidence: List[str] = field(default_factory=list)
    violations: List[Dict[str, Any]] = field(default_factory=list)

    confidence: float = 0.0
    estimated_fix_hours: float = 0.0


@dataclass
class DebateConflict:
    """A conflict detected between agent positions"""

    conflict_type: str
    agents: List[AgentType]
    description: str
    severity: Severity = field(default=Severity.MEDIUM)


@dataclass
class ModeratorVerdict:
    """Final verdict from the debate moderator"""

    verdict: Verdict
    resolution: str
    rationale: str
    priority_order: List[AgentType] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)
    escalate_to_human: bool = False


@dataclass
class Change:
    """A proposed code change for debate"""

    change_id: str
    change_type: str

    files_added: List[str] = field(default_factory=list)
    files_modified: List[str] = field(default_factory=list)
    files_deleted: List[str] = field(default_factory=list)

    diff_content: str = ""
    commit_message: str = ""

    author: str = ""
    branch: str = ""


@dataclass
class FullDebateResult:
    """Complete debate result with positions and conflicts"""

    debate_id: str
    change_id: str
    timestamp: datetime

    positions: List[AgentPosition] = field(default_factory=list)
    conflicts: List[DebateConflict] = field(default_factory=list)
    verdict: Optional[ModeratorVerdict] = None

    findings: List[Finding] = field(default_factory=list)
    rounds: List[DebateRound] = field(default_factory=list)

    summary: str = ""


class SecurityDebateAgent:
    """Agent focused on security concerns for git diff analysis"""

    def __init__(self):
        self.agent_type = AgentType.SECURITY
        self.security_patterns = {
            "sql_injection": {
                "patterns": ["execute(", "query(", "cursor.execute", "raw("],
                "severity": Severity.CRITICAL,
                "description": "Potential SQL injection",
                "fix": "Use parameterized queries",
            },
            "hardcoded_secrets": {
                "patterns": ["password", "api_key", "secret", "token", "private_key"],
                "severity": Severity.CRITICAL,
                "description": "Hardcoded secret detected",
                "fix": "Use environment variables or secrets manager",
            },
            "eval_usage": {
                "patterns": ["eval(", "exec(", "compile("],
                "severity": Severity.CRITICAL,
                "description": "Dynamic code execution",
                "fix": "Avoid dynamic code execution",
            },
            "path_traversal": {
                "patterns": ["open(", "readFile", "os.path.join"],
                "severity": Severity.HIGH,
                "description": "Potential path traversal",
                "fix": "Validate and sanitize file paths",
            },
            "xss": {
                "patterns": ["innerHTML", "dangerouslySetInnerHTML", "document.write"],
                "severity": Severity.HIGH,
                "description": "Potential XSS vulnerability",
                "fix": "Use textContent or React's default escaping",
            },
            "weak_crypto": {
                "patterns": ["md5", "sha1", "DES", "RC4"],
                "severity": Severity.MEDIUM,
                "description": "Weak cryptographic algorithm",
                "fix": "Use SHA-256 or stronger",
            },
        }

    async def analyze(self, change: Change) -> AgentPosition:
        concerns = []
        recommendations = []
        violations = []

        diff_lower = change.diff_content.lower()

        for issue_name, pattern_info in self.security_patterns.items():
            for pattern in pattern_info["patterns"]:
                if pattern.lower() in diff_lower:
                    concerns.append(f"{pattern_info['description']}: found `{pattern}`")
                    recommendations.append(f"Fix: {pattern_info['fix']}")
                    violations.append(
                        {
                            "type": issue_name,
                            "severity": pattern_info["severity"].value,
                            "pattern": pattern,
                        }
                    )

        max_severity = Severity.LOW
        for violation in violations:
            sev = Severity(violation["severity"])
            if sev.value_level() > max_severity.value_level():
                max_severity = sev

        verdict = Verdict.APPROVE
        if max_severity == Severity.CRITICAL:
            verdict = Verdict.BLOCK
        elif max_severity == Severity.HIGH:
            verdict = Verdict.REQUEST_CHANGES

        confidence = min(0.95, 0.7 + (len(concerns) * 0.05)) if concerns else 0.5

        return AgentPosition(
            agent_type=self.agent_type,
            verdict=verdict,
            severity=max_severity,
            concerns=concerns,
            recommendations=recommendations,
            reasoning=self._build_reasoning(concerns, verdict),
            violations=violations,
            confidence=confidence,
        )

    def _build_reasoning(self, concerns: List[str], verdict: Verdict) -> str:
        if not concerns:
            return "No security concerns detected in this change."
        if verdict == Verdict.BLOCK:
            return f"CRITICAL: This change introduces {len(concerns)} security issues that must be fixed before merge."
        return f"This change has {len(concerns)} security concerns that should be addressed."


class ArchitectureDebateAgent:
    """Agent focused on architectural concerns"""

    def __init__(self):
        self.agent_type = AgentType.ARCHITECTURE

    async def analyze(self, change: Change) -> AgentPosition:
        concerns = []
        recommendations = []
        violations = []

        api_files = [
            f
            for f in change.files_modified
            if "api" in f.lower() or "controller" in f.lower()
        ]
        db_files = [
            f
            for f in change.files_modified
            if "db" in f.lower() or "models" in f.lower()
        ]

        if api_files and db_files:
            concerns.append("API layer modifying database layer directly")
            recommendations.append("Use service layer for database operations")
            violations.append(
                {
                    "type": "layer_violation",
                    "severity": Severity.HIGH.value,
                    "files": list(set(api_files) & set(db_files)),
                }
            )

        if len(change.files_modified) > 10:
            concerns.append(
                f"Large change affecting {len(change.files_modified)} files"
            )
            recommendations.append("Consider breaking into smaller PRs")

        verdict = Verdict.APPROVE
        severity = Severity.LOW

        if violations:
            severity = Severity.HIGH
            verdict = Verdict.REQUEST_CHANGES

        if len(change.files_modified) > 20:
            severity = Severity.MEDIUM

        confidence = min(0.95, 0.7 + (len(concerns) * 0.05)) if concerns else 0.5

        return AgentPosition(
            agent_type=self.agent_type,
            verdict=verdict,
            severity=severity,
            concerns=concerns,
            recommendations=recommendations,
            reasoning=f"Architecture analysis found {len(concerns)} concerns.",
            violations=violations,
            confidence=confidence,
        )


class RefactoringDebateAgent:
    """Agent focused on code quality concerns"""

    def __init__(self):
        self.agent_type = AgentType.REFACTORING

    async def analyze(self, change: Change) -> AgentPosition:
        concerns = []
        recommendations = []

        func_pattern = r"def\s+\w+\s*\([^)]*\):\s*\n(?:[ \t]+[^\n]*\n){50,}"
        long_funcs = re.findall(func_pattern, change.diff_content)
        if long_funcs:
            concerns.append(f"Found {len(long_funcs)} long function definitions")
            recommendations.append("Break long functions into smaller units")

        magic_pattern = r"\b\d{3,}\b"
        magic_numbers = re.findall(magic_pattern, change.diff_content)
        suspicious = [n for n in magic_numbers if int(n) > 100 and int(n) < 2100]
        if len(suspicious) > 5:
            concerns.append(f"Found {len(suspicious)} magic numbers")
            recommendations.append("Use named constants")

        todos = re.findall(r"(TODO|FIXME|HACK):\s*([^\n]+)", change.diff_content)
        if len(todos) > 3:
            concerns.append(f"Found {len(todos)} TODO/FIXME comments")
            recommendations.append("Address technical debt items or create tickets")

        verdict = Verdict.APPROVE if not concerns else Verdict.REQUEST_CHANGES
        severity = Severity.LOW if not concerns else Severity.MEDIUM
        confidence = min(0.95, 0.7 + (len(concerns) * 0.05)) if concerns else 0.5

        return AgentPosition(
            agent_type=self.agent_type,
            verdict=verdict,
            severity=severity,
            concerns=concerns,
            recommendations=recommendations,
            reasoning=f"Refactoring analysis found {len(concerns)} code quality concerns.",
            confidence=confidence,
        )


class PerformanceDebateAgent:
    """Agent focused on performance concerns"""

    def __init__(self):
        self.agent_type = AgentType.PERFORMANCE

    async def analyze(self, change: Change) -> AgentPosition:
        concerns = []
        recommendations = []

        if "for" in change.diff_content and (
            "query" in change.diff_content.lower()
            or "fetch" in change.diff_content.lower()
        ):
            concerns.append("Potential N+1 query pattern detected")
            recommendations.append("Consider batch fetching or eager loading")

        loop_pattern = r"for\s+\w+\s+in\s+.*:\s*\n(?:[ \t]+[^\n]*\n){100,}"
        large_loops = re.findall(loop_pattern, change.diff_content)
        if large_loops:
            concerns.append(f"Found {len(large_loops)} large loops")
            recommendations.append("Consider pagination or streaming")

        verdict = Verdict.APPROVE if not concerns else Verdict.REQUEST_CHANGES
        severity = Severity.LOW if not concerns else Severity.MEDIUM
        confidence = min(0.95, 0.7 + (len(concerns) * 0.05)) if concerns else 0.5

        return AgentPosition(
            agent_type=self.agent_type,
            verdict=verdict,
            severity=severity,
            concerns=concerns,
            recommendations=recommendations,
            reasoning=f"Performance analysis found {len(concerns)} concerns.",
            confidence=confidence,
        )


class DebateOrchestrator:
    """Orchestrates multi-agent debate"""

    MAX_ROUNDS = 3
    SEVERITY_HIERARCHY = {
        Severity.CRITICAL: 4,
        Severity.HIGH: 3,
        Severity.MEDIUM: 2,
        Severity.LOW: 1,
    }

    def __init__(self, agents: Dict[AgentType, Any]):
        self.agents = agents
        self.rounds: List[DebateRound] = []
        self.findings: List[Finding] = []
        self.debate_id = str(uuid.uuid4())[:8]

    async def run_debate(self, file_path: str, content: str) -> DebateResult:
        """Run the full debate process"""
        await self._round_1_initial_analysis(file_path, content)
        await self._round_2_cross_examination()
        await self._round_3_synthesis()
        return self._build_result()

    async def _round_1_initial_analysis(self, file_path: str, content: str):
        """All agents analyze independently"""
        from .agents import AgentTask

        tasks = []
        for agent_type, agent in self.agents.items():
            task = AgentTask(
                agent_type=agent_type, target_code=content, file_path=file_path
            )
            tasks.append(self._run_agent_analysis(agent_type, agent, task))

        results = await asyncio.gather(*tasks)

        for agent_type, agent_findings in results:
            for i, finding_data in enumerate(agent_findings):
                severity_str = finding_data.get("severity", "medium")
                severity = Severity(severity_str)

                finding = Finding(
                    id=f"{self.debate_id}_{agent_type.value}_{i}",
                    finding_type=finding_data.get("type", "unknown"),
                    description=finding_data.get("description", ""),
                    severity=severity,
                    file_path=finding_data.get("file", file_path),
                    recommendations=[finding_data.get("recommendation", "")],
                )

                finding.evidence.append(
                    Evidence(
                        agent_type=agent_type,
                        statement=f"Initial finding from {agent_type.value} agent",
                        source="analysis",
                    )
                )

                self.findings.append(finding)

            self.rounds.append(
                DebateRound(
                    round_number=1,
                    agent_type=agent_type,
                    action="initial_analysis",
                    content=f"Analyzed and found {len(agent_findings)} issues",
                )
            )

    async def _run_agent_analysis(self, agent_type, agent, task):
        """Run analysis with a specific agent"""
        result = await agent.analyze(task)
        return agent_type, result.findings

    async def _round_2_cross_examination(self):
        """Agents challenge each other's findings"""
        for finding in self.findings:
            if finding.contested:
                continue

            if finding.severity in [Severity.HIGH, Severity.CRITICAL]:
                self.rounds.append(
                    DebateRound(
                        round_number=2,
                        agent_type=AgentType.SECURITY,
                        action="challenge",
                        content=f"Security challenge: {finding.description}",
                        target_finding_id=finding.id,
                    )
                )

                finding.contested = True
                finding.contesting_agents.append(AgentType.SECURITY)

                finding.evidence.append(
                    Evidence(
                        agent_type=AgentType.SECURITY,
                        statement=f"Security veto: This is {finding.severity.value} risk",
                        source="cross_examination",
                    )
                )

                if finding.severity == Severity.CRITICAL:
                    finding.final_severity = Severity.CRITICAL

    async def _round_3_synthesis(self):
        """Final synthesis and consensus"""
        self.rounds.append(
            DebateRound(
                round_number=3,
                agent_type=AgentType.ARCHITECTURE,
                action="synthesis",
                content="Final synthesis and consensus building",
            )
        )

        for finding in self.findings:
            if finding.final_severity is None:
                finding.final_severity = finding.severity

    def _build_result(self) -> DebateResult:
        """Build final debate result"""
        if not self.findings:
            consensus_score = 100.0
        else:
            total_confidence = sum(f.confidence for f in self.findings)
            consensus_score = total_confidence / len(self.findings) * 100

        reasoning_trace = []
        for round in self.rounds:
            if round.action == "challenge":
                reasoning_trace.append(
                    f"Round {round.round_number}: {round.agent_type.value} challenged finding"
                )
            elif round.action == "synthesis":
                reasoning_trace.append(
                    f"Round {round.round_number}: Final synthesis completed"
                )

        final_recommendations = []
        for f in self.findings:
            if f.final_severity in [Severity.CRITICAL, Severity.HIGH]:
                final_recommendations.extend(f.recommendations)

        return DebateResult(
            debate_id=self.debate_id,
            rounds=self.rounds,
            findings=self.findings,
            consensus_score=consensus_score,
            security_vetoed=any(
                f.final_severity == Severity.CRITICAL for f in self.findings
            ),
            reasoning_trace=reasoning_trace,
            final_recommendations=list(set(final_recommendations))[:5],
        )


class GitDiffDebateOrchestrator:
    """Orchestrates debate from git diff analysis"""

    def __init__(self):
        self.diff_agents = [
            SecurityDebateAgent(),
            ArchitectureDebateAgent(),
            RefactoringDebateAgent(),
            PerformanceDebateAgent(),
        ]

    async def run_debate(self, change: Change) -> FullDebateResult:
        """Run full debate on a git diff change"""
        tasks = [agent.analyze(change) for agent in self.diff_agents]
        positions = await asyncio.gather(*tasks)

        conflicts = self._detect_conflicts(positions)
        verdict = self._generate_verdict(positions, conflicts)
        summary = self._generate_summary(change, positions, conflicts, verdict)

        return FullDebateResult(
            debate_id=hashlib.md5(
                f"{change.change_id}{datetime.now().isoformat()}".encode()
            ).hexdigest()[:12],
            change_id=change.change_id,
            timestamp=datetime.now(),
            positions=positions,
            conflicts=conflicts,
            verdict=verdict,
            summary=summary,
        )

    def _detect_conflicts(self, positions: List[AgentPosition]) -> List[DebateConflict]:
        conflicts = []

        severity_values = [p.severity.value_level() for p in positions]
        if severity_values and max(severity_values) - min(severity_values) >= 2:
            severe_agents = [
                p.agent_type for p in positions if p.severity.value_level() >= 2
            ]
            mild_agents = [
                p.agent_type for p in positions if p.severity.value_level() < 2
            ]

            if severe_agents and mild_agents:
                conflicts.append(
                    DebateConflict(
                        conflict_type="severity_mismatch",
                        agents=severe_agents + mild_agents,
                        description=f"Some agents see critical issues ({', '.join(e.value for e in severe_agents)}) while others see minor concerns",
                        severity=Severity.MEDIUM,
                    )
                )

        blockers = [p for p in positions if p.verdict == Verdict.BLOCK]
        non_blocking = [p for p in positions if p.verdict != Verdict.BLOCK]

        if blockers and non_blocking:
            conflicts.append(
                DebateConflict(
                    conflict_type="blocking_disagreement",
                    agents=[p.agent_type for p in positions],
                    description=f"Some agents block the change while others approve",
                    severity=Severity.HIGH,
                )
            )

        return conflicts

    def _generate_verdict(
        self, positions: List[AgentPosition], conflicts: List[DebateConflict]
    ) -> ModeratorVerdict:
        priority_order = [
            AgentType.SECURITY,
            AgentType.ARCHITECTURE,
            AgentType.PERFORMANCE,
            AgentType.REFACTORING,
            AgentType.DOCUMENTATION,
        ]

        blockers = [p for p in positions if p.verdict == Verdict.BLOCK]
        if blockers:
            return ModeratorVerdict(
                verdict=Verdict.BLOCK,
                resolution="blocked",
                rationale=f"Change blocked by {', '.join(b.agent_type.value for b in blockers)}",
                priority_order=priority_order,
                action_items=self._collect_action_items(blockers),
                escalate_to_human=True,
            )

        severe_conflicts = [
            c for c in conflicts if c.severity in [Severity.HIGH, Severity.CRITICAL]
        ]
        if severe_conflicts:
            return ModeratorVerdict(
                verdict=Verdict.REQUEST_CHANGES,
                resolution="conflicts_resolved",
                rationale="Conflicts detected. Prioritizing security and architecture concerns.",
                priority_order=priority_order,
                action_items=self._collect_action_items(positions),
                escalate_to_human=False,
            )

        changes_requested = [
            p for p in positions if p.verdict == Verdict.REQUEST_CHANGES
        ]
        if changes_requested:
            return ModeratorVerdict(
                verdict=Verdict.REQUEST_CHANGES,
                resolution="changes_requested",
                rationale=f"{len(changes_requested)} agents request changes.",
                priority_order=priority_order,
                action_items=self._collect_action_items(changes_requested),
                escalate_to_human=False,
            )

        return ModeratorVerdict(
            verdict=Verdict.APPROVE,
            resolution="approved",
            rationale="All agents approve this change.",
            priority_order=priority_order,
            action_items=[],
            escalate_to_human=False,
        )

    def _collect_action_items(self, positions: List[AgentPosition]) -> List[str]:
        items = []
        for position in positions:
            for rec in position.recommendations[:3]:
                items.append(f"[{position.agent_type.value.upper()}] {rec}")
        return items[:10]

    def _generate_summary(
        self,
        change: Change,
        positions: List[AgentPosition],
        conflicts: List[DebateConflict],
        verdict: ModeratorVerdict,
    ) -> str:
        emoji_map = {
            AgentType.SECURITY: "🔒",
            AgentType.ARCHITECTURE: "🏗️",
            AgentType.REFACTORING: "♻️",
            AgentType.PERFORMANCE: "⚡",
        }

        parts = [
            f"# Debate Summary: {change.change_id}",
            "",
            f"**Verdict**: **{verdict.verdict.value.upper()}**",
            f"_{verdict.rationale}_",
            "",
        ]

        for position in positions:
            emoji = emoji_map.get(position.agent_type, "•")
            parts.append(f"### {emoji} {position.agent_type.value.title()}")
            parts.append(
                f"**Verdict**: {position.verdict.value} | **Severity**: {position.severity.value}"
            )

            if position.concerns:
                parts.append("**Concerns**:")
                for concern in position.concerns:
                    parts.append(f"- {concern}")

            if position.recommendations:
                parts.append("**Recommendations**:")
                for rec in position.recommendations:
                    parts.append(f"- {rec}")
            parts.append("")

        if conflicts:
            parts.append("## Conflicts Detected")
            for conflict in conflicts:
                parts.append(
                    f"- **{conflict.conflict_type.replace('_', ' ').title()}**: {conflict.description}"
                )
            parts.append("")

        if verdict.action_items:
            parts.append("## Action Items")
            for item in verdict.action_items:
                parts.append(f"- [ ] {item}")
            parts.append("")

        return "\n".join(parts)


async def debate_git_diff(
    diff_content: str, commit_message: str = ""
) -> FullDebateResult:
    """Run debate on a git diff"""
    file_pattern = r"^diff.*a/(.*)b/"
    files_added = []
    files_modified = []
    files_deleted = []

    current_file = None
    for line in diff_content.split("\n"):
        if line.startswith("diff"):
            match = re.match(r"diff.*a/(.*)b/", line)
            if match:
                current_file = match.group(1)
        elif line.startswith("+++ b/") and current_file:
            files_modified.append(current_file)
            current_file = None
        elif line.startswith("new file"):
            if current_file:
                files_added.append(current_file)
        elif line.startswith("deleted file"):
            if current_file:
                files_deleted.append(current_file)

    change = Change(
        change_id=hashlib.md5(diff_content[:100].encode()).hexdigest()[:8],
        change_type="modify" if files_modified else "add",
        files_added=files_added,
        files_modified=files_modified,
        files_deleted=files_deleted,
        diff_content=diff_content,
        commit_message=commit_message,
    )

    orchestrator = GitDiffDebateOrchestrator()
    return await orchestrator.run_debate(change)
