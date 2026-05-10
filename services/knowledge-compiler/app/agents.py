"""
Multi-Agent System for Code Analysis
Based on patterns from RefAgent, Code Broker, and IBM research
"""

import asyncio
import os
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import json
from datetime import datetime

try:
    from . import llm

    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


class AgentType(Enum):
    SECURITY = "security"
    REFACTORING = "refactoring"
    ARCHITECTURE = "architecture"
    DOCUMENTATION = "documentation"
    PERFORMANCE = "performance"
    TESTING = "testing"


@dataclass
class AgentResult:
    """Result from an agent execution"""

    agent_type: AgentType
    findings: List[Dict[str, Any]]
    score: float  # 0-100
    recommendations: List[str]
    severity: str  # low, medium, high, critical
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentTask:
    """Task assigned to an agent"""

    agent_type: AgentType
    target_code: str
    file_path: str
    context: Dict[str, Any] = field(default_factory=dict)


class BaseAgent:
    """Base class for all agents"""

    def __init__(self, agent_type: AgentType):
        self.agent_type = agent_type
        self.name = agent_type.value.title()

    async def analyze(self, task: AgentTask) -> AgentResult:
        """Analyze code and return results"""
        raise NotImplementedError

    def _calculate_severity(self, findings: List[Dict]) -> str:
        """Calculate severity based on findings"""
        critical = any(f.get("severity") == "critical" for f in findings)
        high = any(f.get("severity") == "high" for f in findings)
        medium = any(f.get("severity") == "medium" for f in findings)

        if critical:
            return "critical"
        elif high:
            return "high"
        elif medium:
            return "medium"
        return "low"


class SecurityAgent(BaseAgent):
    """Security analysis agent - identifies vulnerabilities"""

    def __init__(self):
        super().__init__(AgentType.SECURITY)
        self.security_patterns = {
            "sql_injection": {
                "patterns": ["execute(", "query(", "raw(", "cursor.execute"],
                "severity": "critical",
                "description": "Potential SQL injection vulnerability",
            },
            "hardcoded_secrets": {
                "patterns": ["password", "api_key", "secret", "token"],
                "severity": "high",
                "description": "Hardcoded secret detected",
            },
            "insecure_random": {
                "patterns": ["random.random", "Math.random"],
                "severity": "medium",
                "description": "Insecure random usage",
            },
            "eval_usage": {
                "patterns": ["eval(", "exec(", "compile("],
                "severity": "high",
                "description": "Dynamic code execution",
            },
            "path_traversal": {
                "patterns": ["open(", "readFile", "readFileSync"],
                "severity": "high",
                "description": "Potential path traversal",
            },
            "weak_crypto": {
                "patterns": ["md5", "sha1", "DES", "RC4"],
                "severity": "medium",
                "description": "Weak cryptographic algorithm",
            },
            "xss": {
                "patterns": ["innerHTML", "dangerouslySetInnerHTML", "document.write"],
                "severity": "high",
                "description": "Potential XSS vulnerability",
            },
            "unsafe_yaml": {
                "patterns": ["yaml.load", "unsafe_load"],
                "severity": "high",
                "description": "Unsafe YAML parsing",
            },
        }

    async def analyze(self, task: AgentTask) -> AgentResult:
        """Analyze code for security issues"""
        findings = []
        code = task.target_code

        for pattern_name, pattern_info in self.security_patterns.items():
            for pattern in pattern_info["patterns"]:
                if pattern.lower() in code.lower():
                    findings.append(
                        {
                            "type": pattern_name,
                            "description": pattern_info["description"],
                            "severity": pattern_info["severity"],
                            "file": task.file_path,
                            "pattern": pattern,
                            "recommendation": self._get_recommendation(pattern_name),
                        }
                    )

        # LLM enhancement for deeper analysis
        if LLM_AVAILABLE and os.getenv("LLM_ENABLED") == "true":
            try:
                llm_findings = await self._analyze_with_llm(code, task.file_path)
                findings.extend(llm_findings)
            except Exception as e:
                print(f"LLM security analysis failed: {e}")

        score = max(0, 100 - (len(findings) * 15))
        severity = self._calculate_severity(findings)

        return AgentResult(
            agent_type=self.agent_type,
            findings=findings,
            score=score,
            recommendations=self._get_recommendations(findings),
            severity=severity,
            metadata={"patterns_checked": len(self.security_patterns)},
        )

    def _get_recommendation(self, pattern_name: str) -> str:
        """Get recommendation for specific pattern"""
        recommendations = {
            "sql_injection": "Use parameterized queries or ORM",
            "hardcoded_secrets": "Move to environment variables or secrets manager",
            "insecure_random": "Use cryptographically secure random",
            "eval_usage": "Avoid dynamic code execution",
            "path_traversal": "Validate and sanitize file paths",
            "weak_crypto": "Use SHA-256 or stronger",
            "xss": "Use textContent or React's default escaping",
            "unsafe_yaml": "Use yaml.safe_load",
        }
        return recommendations.get(pattern_name, "Review and fix")

    async def _analyze_with_llm(self, code: str, file_path: str) -> List[Dict]:
        """Use LLM to find additional security issues"""
        if not LLM_AVAILABLE:
            return []

        system_prompt = """You are a security expert. Analyze the following code for security vulnerabilities.
Focus on: authentication, authorization, input validation, data exposure, and common weaknesses.
Return findings as a JSON array with: type, description, severity (critical/high/medium/low), recommendation.
Only return the JSON, no other text."""

        try:
            response = await llm.analyze_with_llm(
                f"Analyze this code for security issues:\n```{code[:2000]}```",
                system_prompt=system_prompt,
            )

            # Try to parse JSON from response
            import re

            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                findings = json.loads(json_match.group())
                return findings
        except Exception as e:
            print(f"LLM analysis parse error: {e}")

        return []

    def _get_recommendations(self, findings: List[Dict]) -> List[str]:
        """Get overall recommendations"""
        if not findings:
            return ["No security issues detected"]

        recommendations = []
        severity_counts = {}

        for f in findings:
            sev = f.get("severity", "low")
            severity_counts[sev] = severity_counts.get(sev, 0) + 1

        if severity_counts.get("critical", 0) > 0:
            recommendations.append(
                "🚨 Critical security issues found - fix immediately"
            )
        if severity_counts.get("high", 0) > 0:
            recommendations.append("⚠️ High severity issues require attention")

        recommendations.append(f"Found {len(findings)} security patterns to review")

        return recommendations


class RefactoringAgent(BaseAgent):
    """Refactoring analysis agent - identifies code smells"""

    def __init__(self):
        super().__init__(AgentType.REFACTORING)
        self.code_smells = {
            "long_method": {
                "threshold": 50,
                "severity": "medium",
                "description": "Method too long",
            },
            "large_class": {
                "threshold": 500,
                "severity": "high",
                "description": "Class too large",
            },
            "too_many_parameters": {
                "threshold": 5,
                "severity": "medium",
                "description": "Too many parameters",
            },
            "duplicated_code": {
                "threshold": 3,
                "severity": "high",
                "description": "Potential duplicate code",
            },
            "dead_code": {"severity": "medium", "description": "Potentially dead code"},
            "magic_numbers": {
                "severity": "low",
                "description": "Magic number without explanation",
            },
        }

    async def analyze(self, task: AgentTask) -> AgentResult:
        """Analyze code for refactoring opportunities"""
        findings = []
        code = task.target_code
        lines = code.split("\n")

        # Check for long methods (simple heuristic)
        if len(lines) > 50:
            findings.append(
                {
                    "type": "long_method",
                    "description": f"Method has {len(lines)} lines (recommended: <50)",
                    "severity": "medium",
                    "file": task.file_path,
                    "recommendation": "Break into smaller methods",
                }
            )

        # Check for too many parameters (heuristic)
        import re

        func_pattern = r"def\s+\w+\(([^)]*)\)"
        params = re.findall(func_pattern, code)
        for param_list in params:
            param_count = len([p for p in param_list.split(",") if p.strip()])
            if param_count > 5:
                findings.append(
                    {
                        "type": "too_many_parameters",
                        "description": f"Function has {param_count} parameters (recommended: <5)",
                        "severity": "medium",
                        "file": task.file_path,
                        "recommendation": "Use parameter objects or builder pattern",
                    }
                )

        # Check for magic numbers
        magic_pattern = r"\b\d{2,}\b"
        numbers = re.findall(magic_pattern, code)
        # Filter out years, versions
        for num in numbers[:5]:  # Limit findings
            if int(num) > 100 and int(num) < 2100:
                findings.append(
                    {
                        "type": "magic_numbers",
                        "description": f"Magic number {num} found",
                        "severity": "low",
                        "file": task.file_path,
                        "recommendation": "Use named constant",
                    }
                )

        score = max(0, 100 - (len(findings) * 10))
        severity = self._calculate_severity(findings)

        return AgentResult(
            agent_type=self.agent_type,
            findings=findings,
            score=score,
            recommendations=self._get_refactoring_recommendations(findings),
            severity=severity,
            metadata={"lines_of_code": len(lines)},
        )

    def _get_refactoring_recommendations(self, findings: List[Dict]) -> List[str]:
        """Get refactoring recommendations"""
        if not findings:
            return ["Code looks clean from refactoring perspective"]

        recommendations = []
        type_counts = {}

        for f in findings:
            t = f.get("type", "unknown")
            type_counts[t] = type_counts.get(t, 0) + 1

        if type_counts.get("long_method", 0) > 0:
            recommendations.append(
                "Consider breaking down long methods into smaller units"
            )
        if type_counts.get("large_class", 0) > 0:
            recommendations.append(
                "Consider splitting large classes using Single Responsibility Principle"
            )
        if type_counts.get("duplicated_code", 0) > 0:
            recommendations.append("Extract duplicated code into shared utilities")

        return recommendations


class ArchitectureAgent(BaseAgent):
    """Architecture analysis agent - detects drift and violations"""

    def __init__(self):
        super().__init__(AgentType.ARCHITECTURE)
        self.architecture_rules = {
            "layer_violation": {
                "patterns": {
                    "api->db": r"from\s+.*db.*import|import.*database",
                    "service->controller": r"from\s+.*controller.*import",
                },
                "severity": "high",
                "description": "Layer boundary violation",
            },
            "circular_dependency": {
                "severity": "critical",
                "description": "Circular dependency detected",
            },
            "god_class": {
                "threshold": 1000,
                "severity": "high",
                "description": "God class - too much responsibility",
            },
            "feature_envy": {
                "severity": "medium",
                "description": "Class more interested in another class",
            },
        }

    async def analyze(self, task: AgentTask) -> AgentResult:
        """Analyze code for architectural issues"""
        findings = []
        code = task.target_code
        file_path = task.file_path

        # Simple layer violation detection
        if "api" in file_path or "routes" in file_path or "controller" in file_path:
            if (
                "db" in code.lower()
                or "database" in code.lower()
                or "models" in code.lower()
            ):
                if "import" in code.lower():
                    findings.append(
                        {
                            "type": "layer_violation",
                            "description": "API/Controller layer importing from database layer",
                            "severity": "high",
                            "file": file_path,
                            "recommendation": "Use service layer for database operations",
                        }
                    )

        # Check for large files
        lines = code.split("\n")
        if len(lines) > 500:
            findings.append(
                {
                    "type": "large_file",
                    "description": f"File has {len(lines)} lines - consider splitting",
                    "severity": "medium",
                    "file": file_path,
                    "recommendation": "Split into smaller modules",
                }
            )

        # Cyclomatic complexity check
        complexity = self._calculate_complexity(code)
        if complexity > 20:
            findings.append(
                {
                    "type": "high_complexity",
                    "description": f"Cyclomatic complexity: {complexity}",
                    "severity": "high",
                    "file": file_path,
                    "recommendation": "Simplify control flow",
                }
            )

        score = max(0, 100 - (len(findings) * 12))
        severity = self._calculate_severity(findings)

        return AgentResult(
            agent_type=self.agent_type,
            findings=findings,
            score=score,
            recommendations=self._get_architecture_recommendations(findings),
            severity=severity,
            metadata={"lines_of_code": len(lines), "complexity": complexity},
        )

    def _calculate_complexity(self, code: str) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1
        keywords = [
            "if",
            "elif",
            "else",
            "for",
            "while",
            "and",
            "or",
            "try",
            "except",
            "finally",
            "with",
        ]

        for keyword in keywords:
            complexity += code.lower().count(keyword)

        return complexity

    def _get_architecture_recommendations(self, findings: List[Dict]) -> List[str]:
        """Get architecture recommendations"""
        if not findings:
            return ["Architecture looks clean"]

        recommendations = []

        violations = [f for f in findings if f.get("type") == "layer_violation"]
        if violations:
            recommendations.append(
                "🔴 Layer violations detected - review architecture boundaries"
            )

        complex = [f for f in findings if f.get("type") == "high_complexity"]
        if complex:
            recommendations.append("⚠️ High complexity areas need attention")

        return recommendations


class DocumentationAgent(BaseAgent):
    """Documentation generation agent"""

    def __init__(self):
        super().__init__(AgentType.DOCUMENTATION)

    async def analyze(self, task: AgentTask) -> AgentResult:
        """Analyze code documentation coverage"""
        findings = []
        code = task.target_code

        # Check for docstrings
        has_docstring = '"""' in code or "'''" in code
        has_comments = "#" in code

        lines = code.split("\n")
        code_lines = [l for l in lines if l.strip() and not l.strip().startswith("#")]
        comment_ratio = (
            lines.count("#") + code.count('"""') + code.count("'''")
        ) / max(len(code_lines), 1)

        if not has_docstring and len(code_lines) > 20:
            findings.append(
                {
                    "type": "missing_docstring",
                    "description": "File lacks module-level docstring",
                    "severity": "medium",
                    "file": task.file_path,
                    "recommendation": "Add module docstring explaining purpose",
                }
            )

        if comment_ratio < 0.05 and len(code_lines) > 50:
            findings.append(
                {
                    "type": "low_comment_density",
                    "description": f"Low comment density: {comment_ratio * 100:.1f}%",
                    "severity": "low",
                    "file": task.file_path,
                    "recommendation": "Add more comments for complex logic",
                }
            )

        score = max(0, 100 - (len(findings) * 20))
        severity = self._calculate_severity(findings)

        return AgentResult(
            agent_type=self.agent_type,
            findings=findings,
            score=score,
            recommendations=self._get_doc_recommendations(findings),
            severity=severity,
            metadata={"has_docstring": has_docstring, "comment_ratio": comment_ratio},
        )

    def _get_doc_recommendations(self, findings: List[Dict]) -> List[str]:
        """Get documentation recommendations"""
        if not findings:
            return ["Documentation coverage is good"]

        recommendations = []

        if any(f.get("type") == "missing_docstring" for f in findings):
            recommendations.append("Add docstrings to public modules and classes")

        if any(f.get("type") == "low_comment_density" for f in findings):
            recommendations.append("Increase comment density for complex logic")

        return recommendations


class MultiAgentOrchestrator:
    """Orchestrates multiple specialized agents"""

    def __init__(self):
        self.agents = {
            AgentType.SECURITY: SecurityAgent(),
            AgentType.REFACTORING: RefactoringAgent(),
            AgentType.ARCHITECTURE: ArchitectureAgent(),
            AgentType.DOCUMENTATION: DocumentationAgent(),
        }

    async def analyze_file(
        self,
        file_path: str,
        content: str,
        agent_types: Optional[List[AgentType]] = None,
    ) -> Dict[AgentType, AgentResult]:
        """Run multiple agents on a file"""
        agent_types = (
            agent_types if agent_types is not None else list(self.agents.keys())
        )

        tasks = [
            AgentTask(agent_type=agent_type, target_code=content, file_path=file_path)
            for agent_type in agent_types
        ]

        results = {}

        # Run agents in parallel
        for task in tasks:
            agent = self.agents[task.agent_type]
            result = await agent.analyze(task)
            results[task.agent_type] = result

        return results

    async def analyze_repository(self, files: Dict[str, str]) -> Dict[str, Any]:
        """Analyze entire repository with all agents"""
        all_results = {
            "summary": {
                "total_files": len(files),
                "agents_run": len(self.agents),
                "timestamp": datetime.utcnow().isoformat(),
            },
            "by_file": {},
            "aggregated": {},
        }

        # Aggregate scores by agent type
        agent_scores = {agent_type: [] for agent_type in self.agents.keys()}
        agent_findings = {agent_type: [] for agent_type in self.agents.keys()}

        for file_path, content in files.items():
            file_results = await self.analyze_file(file_path, content)

            all_results["by_file"][file_path] = {
                agent_type.value: {
                    "score": result.score,
                    "findings_count": len(result.findings),
                    "severity": result.severity,
                }
                for agent_type, result in file_results.items()
            }

            # Aggregate
            for agent_type, result in file_results.items():
                agent_scores[agent_type].append(result.score)
                agent_findings[agent_type].extend(result.findings)

        # Calculate aggregated scores
        for agent_type, scores in agent_scores.items():
            all_results["aggregated"][agent_type.value] = {
                "avg_score": sum(scores) / len(scores) if scores else 100,
                "total_findings": len(agent_findings[agent_type]),
                "findings_by_severity": self._count_by_severity(
                    agent_findings[agent_type]
                ),
            }

        # Overall health score
        all_scores = [s for scores in agent_scores.values() for s in scores]
        all_results["overall_health"] = (
            sum(all_scores) / len(all_scores) if all_scores else 100
        )

        return all_results

    def _count_by_severity(self, findings: List[Dict]) -> Dict[str, int]:
        """Count findings by severity"""
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for f in findings:
            sev = f.get("severity", "low")
            if sev in counts:
                counts[sev] += 1
        return counts


# Standalone functions
async def run_multi_agent_analysis(files: Dict[str, str]) -> Dict[str, Any]:
    """Run multi-agent analysis on repository"""
    orchestrator = MultiAgentOrchestrator()
    return await orchestrator.analyze_repository(files)


async def run_specific_agents(
    file_path: str, content: str, agent_types: List[AgentType]
) -> Dict[AgentType, AgentResult]:
    """Run specific agents on a file"""
    orchestrator = MultiAgentOrchestrator()
    return await orchestrator.analyze_file(file_path, content, agent_types)
