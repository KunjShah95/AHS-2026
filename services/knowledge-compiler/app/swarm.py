"""
Multi-Agent Swarm for Code Analysis
Main entry point for the swarm system
"""

from typing import Dict, List, Optional, Any
import asyncio

from .agents import (
    MultiAgentOrchestrator,
    AgentType as BaseAgentType,
    SecurityAgent,
    RefactoringAgent,
    ArchitectureAgent,
    DocumentationAgent,
)
from .debate import DebateOrchestrator, DebateResult, Finding, Severity, AgentType


class CodeGenomeSwarm:
    """Main swarm class that orchestrates multi-agent debate"""

    def __init__(self, use_llm: bool = True):
        self.use_llm = use_llm
        self._setup_agents()

    def _setup_agents(self):
        """Initialize all agents"""
        self.agents = {
            AgentType.SECURITY: SecurityAgent(),
            AgentType.REFACTORING: RefactoringAgent(),
            AgentType.ARCHITECTURE: ArchitectureAgent(),
            AgentType.DOCUMENTATION: DocumentationAgent(),
        }

    async def analyze(self, files: Dict[str, str]) -> Dict[str, Any]:
        """Run full swarm analysis on repository"""
        results = {
            "file_results": {},
            "repository_summary": {
                "total_files": len(files),
                "total_findings": 0,
                "critical_issues": 0,
                "high_issues": 0,
            },
            "debate_sessions": [],
        }

        for file_path, content in files.items():
            debate_result = await self._analyze_file(file_path, content)

            results["file_results"][file_path] = {
                "findings": [
                    {
                        "type": f.finding_type,
                        "description": f.description,
                        "severity": f.final_severity.value
                        if f.final_severity
                        else f.severity.value,
                        "file": f.file_path,
                    }
                    for f in debate_result.findings
                ],
                "score": debate_result.consensus_score,
                "security_veto": debate_result.security_vetoed,
            }

            results["debate_sessions"].append(
                {
                    "file": file_path,
                    "rounds": len(debate_result.rounds),
                    "debate_id": debate_result.debate_id,
                }
            )

            # Update summary
            results["repository_summary"]["total_findings"] += len(
                debate_result.findings
            )
            results["repository_summary"]["critical_issues"] += sum(
                1
                for f in debate_result.findings
                if f.final_severity == Severity.CRITICAL
                or f.severity == Severity.CRITICAL
            )
            results["repository_summary"]["high_issues"] += sum(
                1
                for f in debate_result.findings
                if f.final_severity == Severity.HIGH or f.severity == Severity.HIGH
            )

        # Calculate overall health
        all_scores = [r["score"] for r in results["file_results"].values()]
        results["repository_summary"]["overall_health"] = (
            sum(all_scores) / len(all_scores) if all_scores else 100
        )

        return results

    async def _analyze_file(self, file_path: str, content: str) -> DebateResult:
        """Run debate analysis on a single file"""
        orchestrator = DebateOrchestrator(self.agents)
        return await orchestrator.run_debate(file_path, content)

    def get_critical_findings(self, results: Dict[str, Any]) -> List[Dict]:
        """Extract all critical findings from results"""
        critical = []
        for file_result in results.get("file_results", {}).values():
            for finding in file_result.get("findings", []):
                if finding.get("severity") == "critical":
                    critical.append(finding)
        return critical


async def run_swarm_analysis(
    files: Dict[str, str], use_llm: bool = True
) -> Dict[str, Any]:
    """Run swarm analysis - convenience function"""
    swarm = CodeGenomeSwarm(use_llm=use_llm)
    return await swarm.analyze(files)
