"""
Architecture Drift Detection
Based on patterns from Drift, Erode, and ArchDrift
- Pattern Fragmentation (PFS) - same concern solved differently
- Architecture Violations (AVS) - layer boundary violations
- Mutant Duplicates (MDS) - near-duplicate code
- Tech Debt Scoring with financial model
"""

import re
from typing import Dict, List, Optional, Any
from collections import defaultdict
from dataclasses import dataclass
import hashlib


@dataclass
class DriftFinding:
    """Single drift finding"""

    signal_type: str
    description: str
    severity: str  # error, warning, info
    file_path: str
    line_number: Optional[int] = None
    recommendation: str = ""


@dataclass
class DriftScore:
    """Overall drift score"""

    score: float  # 0-100, higher is better
    grade: str  # A, B, C, D, F
    signals: Dict[str, int]  # counts by signal type
    findings: List[DriftFinding]


class ArchitectureDriftDetector:
    """
    Detects architectural drift like Drift/Erode
    - Pattern Fragmentation: same concern handled inconsistently
    - Architecture Violations: layer boundary erosion
    - Mutant Duplicates: near-clones that diverged
    """

    def __init__(self):
        self.signal_weights = {
            "PFS": 15,  # Pattern Fragmentation
            "AVS": 20,  # Architecture Violation
            "MDS": 12,  # Mutant Duplicates
            "LFS": 8,  # Large File
            "HCN": 10,  # High Complexity
            "LVC": 16,  # Layer Violation
            "BCB": 10,  # Bad Code Block
        }

        # Common patterns to check for fragmentation
        self.fragmentation_patterns = {
            "error_handling": [
                r"try.*except",
                r"catch\s*\(",
                r"if.*error",
                r"return\s+False",
                r"return\s+null",
                r"raise\s+",
            ],
            "logging": [
                r"console\.log",
                r"print\(",
                r"logger\.",
                r"logging\.",
                r"sys\.stdout",
            ],
            "validation": [
                r"if\s+not\s+",
                r"assert\s+",
                r"validate\(",
                r"is_valid\(",
            ],
        }

    def analyze(self, files: Dict[str, str]) -> DriftScore:
        """Analyze all files for drift"""
        all_findings = []
        signal_counts: Dict[str, int] = defaultdict(int)

        # Track patterns for fragmentation detection
        pattern_usage: Dict[str, List[str]] = defaultdict(list)

        for file_path, content in files.items():
            # 1. Pattern Fragmentation Detection
            findings = self._detect_pattern_fragmentation(content, file_path)
            for f in findings:
                signal_counts["PFS"] += 1
                all_findings.append(f)
                pattern_usage[f.signal_type].append(file_path)

            # 2. Architecture Violations
            findings = self._detect_layer_violations(content, file_path)
            for f in findings:
                signal_counts["AVS"] += 1
                all_findings.append(f)

            # 3. Large File Detection
            if self._is_large_file(content, file_path):
                all_findings.append(
                    DriftFinding(
                        signal_type="LFS",
                        description=f"File has {len(content.split(chr(10)))} lines",
                        severity="warning",
                        file_path=file_path,
                        recommendation="Consider splitting into smaller modules",
                    )
                )
                signal_counts["LFS"] += 1

            # 4. High Complexity
            complexity = self._calculate_complexity(content)
            if complexity > 20:
                all_findings.append(
                    DriftFinding(
                        signal_type="HCN",
                        description=f"Cyclomatic complexity: {complexity}",
                        severity="warning",
                        file_path=file_path,
                        recommendation="Simplify control flow",
                    )
                )
                signal_counts["HCN"] += 1

            # 5. Detect bad code blocks
            findings = self._detect_bad_patterns(content, file_path)
            for f in findings:
                signal_counts["BCB"] += 1
                all_findings.append(f)

        # 6. Cross-file pattern fragmentation
        for pattern, file_list in pattern_usage.items():
            if len(file_list) > 3:
                all_findings.append(
                    DriftFinding(
                        signal_type="PFS",
                        description=f"Pattern '{pattern}' used in {len(file_list)} files inconsistently",
                        severity="warning",
                        file_path="cross-file",
                        recommendation=f"Standardize {pattern} across codebase",
                    )
                )

        # Calculate score
        total_weight = sum(signal_counts.values())
        score = max(0, min(100, 100 - (total_weight * 0.5)))

        # Calculate grade
        grade = self._calculate_grade(score)

        return DriftScore(
            score=score, grade=grade, signals=dict(signal_counts), findings=all_findings
        )

    def _detect_pattern_fragmentation(
        self, content: str, file_path: str
    ) -> List[DriftFinding]:
        """Detect if same concern is handled differently"""
        findings = []

        # Check for multiple error handling styles
        error_patterns = [
            (r"try\s*{[^}]*}\s*catch", "try-catch"),
            (r"except\s+Exception", "except Exception"),
            (r"if.*error", "if error"),
            (r"return\s+False", "return False"),
            (r"return\s+None", "return None"),
            (r"raise\s+\w+Exception", "raise Exception"),
        ]

        matched_patterns = []
        for pattern, name in error_patterns:
            if re.search(pattern, content, re.MULTILINE | re.DOTALL):
                matched_patterns.append(name)

        if len(matched_patterns) > 2:
            findings.append(
                DriftFinding(
                    signal_type="PFS",
                    description=f"Multiple error handling styles: {', '.join(matched_patterns)}",
                    severity="warning",
                    file_path=file_path,
                    recommendation="Standardize error handling approach",
                )
            )

        # Check for mixed logging styles
        logging_patterns = [
            (r"console\.log", "console.log"),
            (r"print\(", "print()"),
            (r"logging\.", "logging module"),
            (r"logger\.", "logger"),
        ]

        logging_styles = []
        for pattern, name in logging_patterns:
            if re.search(pattern, content):
                logging_styles.append(name)

        if len(logging_styles) > 1:
            findings.append(
                DriftFinding(
                    signal_type="PFS",
                    description=f"Mixed logging styles: {', '.join(logging_styles)}",
                    severity="info",
                    file_path=file_path,
                    recommendation="Use consistent logging",
                )
            )

        return findings

    def _detect_layer_violations(
        self, content: str, file_path: str
    ) -> List[DriftFinding]:
        """Detect layer boundary violations"""
        findings = []

        # Simple layer detection based on path
        path_parts = file_path.lower()

        # API/Controller importing from DB/Models
        if any(x in path_parts for x in ["api", "routes", "controller", "http"]):
            if (
                re.search(r"from\s+.*models?\s+import", content)
                or re.search(r"import\s+.*db", content)
                or re.search(r"from\s+.*database\s+import", content)
            ):
                findings.append(
                    DriftFinding(
                        signal_type="AVS",
                        description="API layer directly accessing database/models",
                        severity="error",
                        file_path=file_path,
                        recommendation="Use service layer for database operations",
                    )
                )

        # Service importing from controllers
        if "service" in path_parts or "business" in path_parts:
            if re.search(r"from\s+.*controller\s+import", content):
                findings.append(
                    DriftFinding(
                        signal_type="AVS",
                        description="Service layer importing from controller",
                        severity="error",
                        file_path=file_path,
                        recommendation="Services should not depend on controllers",
                    )
                )

        return findings

    def _is_large_file(self, content: str, file_path: str) -> bool:
        """Check if file is too large"""
        line_count = len(content.split("\n"))
        return line_count > 400

    def _calculate_complexity(self, content: str) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1

        # Count control flow structures
        keywords = [
            r"\bif\b",
            r"\belif\b",
            r"\belse\b",
            r"\bfor\b",
            r"\bwhile\b",
            r"\band\b",
            r"\bor\b",
            r"\btry\b",
            r"\bexcept\b",
            r"\bfinally\b",
            r"\bwith\b",
        ]

        for keyword in keywords:
            complexity += len(re.findall(keyword, content))

        return complexity

    def _detect_bad_patterns(self, content: str, file_path: str) -> List[DriftFinding]:
        """Detect common anti-patterns"""
        findings = []

        # Empty catch blocks
        if re.search(r"except[^:]*:\s*(?:\n\s*){0,2}(?:pass|$)", content):
            findings.append(
                DriftFinding(
                    signal_type="BCB",
                    description="Empty except block - errors silently swallowed",
                    severity="warning",
                    file_path=file_path,
                    recommendation="Handle or log exceptions properly",
                )
            )

        # TODO/FIXME in code (technical debt markers)
        todos = re.findall(r"#\s*(TODO|FIXME|HACK|XXX):?\s*(.+)", content)
        if len(todos) > 3:
            findings.append(
                DriftFinding(
                    signal_type="BCB",
                    description=f"Found {len(todos)} TODO/FIXME comments",
                    severity="info",
                    file_path=file_path,
                    recommendation="Address technical debt items",
                )
            )

        # Hardcoded strings that might be config
        if len(re.findall(r'["\'][^"\']{30,}["\']', content)) > 5:
            findings.append(
                DriftFinding(
                    signal_type="BCB",
                    description="Multiple long strings - might be config",
                    severity="info",
                    file_path=file_path,
                    recommendation="Consider externalizing configuration",
                )
            )

        return findings

    def _calculate_grade(self, score: float) -> str:
        """Calculate letter grade"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"


class TechDebtCalculator:
    """
    Calculate tech debt with financial model like ArchDrift
    - Debt principal: cost to fix
    - Monthly interest: ongoing cost
    """

    def __init__(self):
        # Cost multipliers (configurable)
        self.hourly_rate = 75  # $75/hour average dev rate
        self.cost_per_issue = {
            "critical": 8,  # hours to fix
            "high": 4,
            "medium": 2,
            "low": 1,
        }
        self.monthly_interest_rate = 0.05  # 5% monthly compounding

    def calculate(self, drift_score: DriftScore, agent_results: Dict) -> Dict:
        """Calculate tech debt in financial terms"""

        # Count issues by severity
        critical = drift_score.signals.get("AVS", 0) + drift_score.signals.get("HCN", 0)
        high = drift_score.signals.get("LFS", 0) + drift_score.signals.get("BCB", 0)
        medium = drift_score.signals.get("PFS", 0)
        low = drift_score.signals.get("LFS", 0)

        # Calculate principal (one-time fix cost)
        principal = (
            critical * self.cost_per_issue["critical"]
            + high * self.cost_per_issue["high"]
            + medium * self.cost_per_issue["medium"]
            + low * self.cost_per_issue["low"]
        ) * self.hourly_rate

        # Calculate monthly interest (velocity slowdown)
        # Based on complexity and issue density
        issue_density = len(drift_score.findings) / max(
            1, sum(drift_score.signals.values())
        )
        monthly_interest = principal * self.monthly_interest_rate * issue_density

        # Risk assessment
        risk_level = self._calculate_risk(drift_score)

        return {
            "debt_principal": principal,
            "monthly_interest": round(monthly_interest, 2),
            "total_debt_annual": round(principal + (monthly_interest * 12), 2),
            "risk_level": risk_level,
            "fix_priority": self._prioritize_fixes(drift_score.findings),
            "grade": drift_score.grade,
            "drift_score": drift_score.score,
        }

    def _calculate_risk(self, drift_score: DriftScore) -> str:
        """Calculate risk level"""
        if drift_score.score < 50:
            return "critical"
        elif drift_score.score < 70:
            return "high"
        elif drift_score.score < 85:
            return "medium"
        return "low"

    def _prioritize_fixes(self, findings: List[DriftFinding]) -> List[Dict]:
        """Prioritize fixes by severity"""
        priority_map = {"error": 1, "warning": 2, "info": 3}

        sorted_findings = sorted(
            findings, key=lambda f: priority_map.get(f.severity, 99)
        )

        return [
            {
                "signal": f.signal_type,
                "description": f.description,
                "severity": f.severity,
                "file": f.file_path,
                "recommendation": f.recommendation,
            }
            for f in sorted_findings[:10]  # Top 10
        ]


# Standalone functions
def detect_architecture_drift(files: Dict[str, str]) -> DriftScore:
    """Detect architecture drift in repository"""
    detector = ArchitectureDriftDetector()
    return detector.analyze(files)


def calculate_tech_debt(
    drift_score: DriftScore, agent_results: Optional[Dict] = None
) -> Dict:
    """Calculate tech debt in financial terms"""
    calculator = TechDebtCalculator()
    return calculator.calculate(drift_score, agent_results or {})


def analyze_drift_and_debt(files: Dict[str, str]) -> Dict:
    """Combined drift detection and tech debt calculation"""
    detector = ArchitectureDriftDetector()
    drift_score = detector.analyze(files)

    calculator = TechDebtCalculator()
    debt = calculator.calculate(drift_score, {})

    return {
        "drift_score": drift_score.score,
        "drift_grade": drift_score.grade,
        "drift_signals": drift_score.signals,
        "findings": [
            {
                "signal": f.signal_type,
                "description": f.description,
                "severity": f.severity,
                "file": f.file_path,
                "recommendation": f.recommendation,
            }
            for f in drift_score.findings
        ],
        "tech_debt": debt,
    }
