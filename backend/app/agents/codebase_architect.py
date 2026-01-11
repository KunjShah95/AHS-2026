"""
CodeFlow - Codebase Architect Agent
====================================
The brain of the onboarding system. Analyzes repository architecture,
identifies patterns, and creates the foundation for learning paths.

HACKATHON DIFFERENTIATOR: This agent does what MCP + Cursor CANNOT:
- Proactive architecture analysis (not reactive Q&A)
- Structured output for downstream processing
- Onboarding-optimized insights
"""

import os
import ast
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import json
import logging

from app.core.gemini_client import get_gemini_client
from app.core.prompts import (
    CODEBASE_ARCHITECT_SYSTEM,
    get_architecture_analysis_prompt,
    get_module_analysis_prompt
)

logger = logging.getLogger(__name__)


class ArchitecturePattern(str, Enum):
    MONOLITH = "monolith"
    MICROSERVICES = "microservices"
    MVC = "mvc"
    LAYERED = "layered"
    EVENT_DRIVEN = "event_driven"
    SERVERLESS = "serverless"
    UNKNOWN = "unknown"


@dataclass
class ModuleAnalysis:
    """Deep analysis of a single module."""
    path: str
    primary_responsibility: str
    key_components: List[Dict[str, str]]
    complexity_score: int  # 1-10
    junior_difficulty: int  # 1-10
    prerequisites: List[str]
    eli_junior_summary: str  # Explain Like I'm a Junior
    key_concepts: List[str]
    common_pitfalls: List[str]
    loc: int
    imports: List[str]


@dataclass
class ArchitectureAnalysis:
    """Complete architecture analysis of a codebase."""
    architecture_type: ArchitecturePattern
    confidence: float
    layers: List[Dict[str, Any]]
    core_domain_location: str
    observations: List[str]
    onboarding_priority: List[str]
    module_analyses: List[ModuleAnalysis]
    entry_points: List[str]
    risk_zones: List[Dict[str, Any]]


class CodebaseArchitectAgent:
    """
    Agent 1: Codebase Architect
    
    Responsibilities:
    - Parse and map repository structure
    - Identify architectural patterns
    - Analyze individual modules for onboarding
    - Identify risk zones and entry points
    - Create onboarding-optimized prioritization
    
    Key Differentiator: Unlike MCP, this agent PROACTIVELY analyzes
    and structures information for learning, not just answering questions.
    """
    
    def __init__(self):
        self.gemini = get_gemini_client()
        self.analysis_cache: Dict[str, Any] = {}
    
    async def analyze_repository(
        self,
        root_path: str,
        file_tree: List[Dict],
        max_modules_to_analyze: int = 15
    ) -> ArchitectureAnalysis:
        """
        Perform complete repository analysis.
        
        Args:
            root_path: Absolute path to repository root
            file_tree: Pre-parsed file tree from ingestion
            max_modules_to_analyze: Limit for deep module analysis (to control costs)
        
        Returns:
            Complete ArchitectureAnalysis with actionable onboarding insights
        """
        logger.info(f"Starting architecture analysis for: {root_path}")
        
        # Step 1: Identify entry points
        entry_points = self._identify_entry_points(file_tree)
        logger.debug(f"Identified {len(entry_points)} entry points")
        
        # Step 2: Generate file tree string for AI analysis
        file_tree_str = self._format_file_tree(file_tree)
        entry_points_str = "\n".join(f"- {ep}" for ep in entry_points)
        
        # Step 3: AI-powered architecture analysis
        arch_prompt = get_architecture_analysis_prompt(file_tree_str, entry_points_str)
        arch_result = self.gemini.generate_json(
            arch_prompt, 
            CODEBASE_ARCHITECT_SYSTEM,
            use_flash=False  # Use Pro for accuracy
        )
        
        # Step 4: Deep analysis of key modules
        priority_modules = self._select_priority_modules(file_tree, max_modules_to_analyze)
        module_analyses = await self._analyze_modules(root_path, priority_modules)
        
        # Step 5: Identify risk zones
        risk_zones = self._identify_risk_zones(module_analyses)
        
        # Step 6: Build final analysis
        return ArchitectureAnalysis(
            architecture_type=self._parse_architecture_type(arch_result.get("architecture_type", "unknown")),
            confidence=arch_result.get("confidence", 0.5),
            layers=arch_result.get("layers", []),
            core_domain_location=arch_result.get("core_domain_location", ""),
            observations=arch_result.get("observations", []),
            onboarding_priority=arch_result.get("onboarding_priority", []),
            module_analyses=module_analyses,
            entry_points=entry_points,
            risk_zones=risk_zones
        )
    
    def _identify_entry_points(self, file_tree: List[Dict]) -> List[str]:
        """Identify likely entry points using heuristics."""
        entry_point_names = [
            "main.py", "app.py", "index.js", "index.ts", "server.py", "server.ts",
            "manage.py", "wsgi.py", "asgi.py", "__main__.py", "cli.py",
            "index.html", "App.tsx", "App.jsx", "main.tsx", "main.ts"
        ]
        
        entry_points = []
        for file_info in file_tree:
            filename = os.path.basename(file_info["path"])
            # Root level files with known names
            if filename.lower() in [ep.lower() for ep in entry_point_names]:
                depth = file_info["path"].count(os.sep)
                if depth <= 2:  # Shallow depth
                    entry_points.append(file_info["path"])
        
        return entry_points[:10]  # Limit
    
    def _format_file_tree(self, file_tree: List[Dict], max_files: int = 100) -> str:
        """Format file tree for AI consumption."""
        lines = []
        for file_info in file_tree[:max_files]:
            lang = file_info.get("language", "unknown")
            lines.append(f"- {file_info['path']} [{lang}]")
        
        if len(file_tree) > max_files:
            lines.append(f"... and {len(file_tree) - max_files} more files")
        
        return "\n".join(lines)
    
    def _select_priority_modules(self, file_tree: List[Dict], limit: int) -> List[Dict]:
        """Select most important modules for deep analysis."""
        # Priority order: entry points > low-depth Python/JS/TS > configs
        scored = []
        for file_info in file_tree:
            score = 0
            path = file_info["path"]
            lang = file_info.get("language", "unknown")
            
            # Prioritize code files
            if lang in ["python", "javascript", "typescript"]:
                score += 10
            
            # Prioritize shallow depth
            depth = path.count(os.sep) + path.count("/")
            score -= depth * 2
            
            # Prioritize core directories
            if any(core in path.lower() for core in ["app", "src", "core", "api", "services"]):
                score += 5
            
            # Deprioritize tests, configs, node_modules
            if any(skip in path.lower() for skip in ["test", "spec", "node_modules", "__pycache__", ".git"]):
                score -= 20
            
            scored.append((score, file_info))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]
    
    async def _analyze_modules(self, root_path: str, modules: List[Dict]) -> List[ModuleAnalysis]:
        """Perform deep analysis on selected modules."""
        analyses = []
        
        for module in modules:
            try:
                full_path = module.get("full_path") or os.path.join(root_path, module["path"])
                
                if not os.path.exists(full_path):
                    continue
                
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Get imports and LOC
                imports = self._extract_imports(content, module.get("language", "unknown"))
                loc = len(content.splitlines())
                
                # Skip very small or very large files
                if loc < 5 or loc > 1000:
                    continue
                
                # AI analysis
                dependencies_str = "\n".join(f"- {imp}" for imp in imports)
                prompt = get_module_analysis_prompt(
                    module["path"],
                    content[:4000],  # Truncate for token limits
                    dependencies_str
                )
                
                result = self.gemini.generate_json(
                    prompt,
                    CODEBASE_ARCHITECT_SYSTEM,
                    use_flash=True  # Use flash for individual modules
                )
                
                analysis = ModuleAnalysis(
                    path=module["path"],
                    primary_responsibility=result.get("primary_responsibility", "Unknown"),
                    key_components=result.get("key_components", []),
                    complexity_score=result.get("complexity_score", 5),
                    junior_difficulty=result.get("junior_difficulty", 5),
                    prerequisites=result.get("prerequisites", []),
                    eli_junior_summary=result.get("eli_junior_summary", "No summary available"),
                    key_concepts=result.get("key_concepts_to_learn", []),
                    common_pitfalls=result.get("common_pitfalls", []),
                    loc=loc,
                    imports=imports
                )
                analyses.append(analysis)
                
            except Exception as e:
                logger.error(f"Failed to analyze module {module['path']}: {e}")
                continue
        
        return analyses
    
    def _extract_imports(self, content: str, language: str) -> List[str]:
        """Extract import statements from code."""
        imports = []
        
        if language == "python":
            try:
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports.append(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imports.append(node.module)
            except SyntaxError:
                # Fallback to regex
                for line in content.splitlines():
                    if line.strip().startswith("import ") or line.strip().startswith("from "):
                        imports.append(line.strip())
        
        elif language in ["javascript", "typescript"]:
            for line in content.splitlines():
                line = line.strip()
                if line.startswith("import ") or line.startswith("const ") and "require(" in line:
                    imports.append(line[:80])
        
        return imports[:20]  # Limit
    
    def _identify_risk_zones(self, module_analyses: List[ModuleAnalysis]) -> List[Dict[str, Any]]:
        """Identify high-risk modules for new developers."""
        risk_zones = []
        
        for analysis in module_analyses:
            risk_level = "low"
            reasons = []
            
            if analysis.complexity_score >= 7:
                risk_level = "high"
                reasons.append("High complexity score")
            elif analysis.complexity_score >= 5:
                risk_level = "medium"
            
            if len(analysis.imports) > 10:
                if risk_level == "low":
                    risk_level = "medium"
                reasons.append("Many dependencies")
            
            if analysis.loc > 500:
                risk_level = "high"
                reasons.append("Large file")
            
            if risk_level != "low":
                risk_zones.append({
                    "path": analysis.path,
                    "risk_level": risk_level,
                    "reasons": reasons,
                    "recommendation": f"Review {analysis.path} with a mentor before making changes"
                })
        
        return sorted(risk_zones, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["risk_level"]])
    
    def _parse_architecture_type(self, type_str: str) -> ArchitecturePattern:
        """Parse architecture type string to enum."""
        type_str = type_str.lower()
        for pattern in ArchitecturePattern:
            if pattern.value in type_str:
                return pattern
        return ArchitecturePattern.UNKNOWN
    
    def to_dict(self, analysis: ArchitectureAnalysis) -> Dict[str, Any]:
        """Convert analysis to dictionary for API response."""
        return {
            "architecture_type": analysis.architecture_type.value,
            "confidence": analysis.confidence,
            "layers": analysis.layers,
            "core_domain_location": analysis.core_domain_location,
            "observations": analysis.observations,
            "onboarding_priority": analysis.onboarding_priority,
            "entry_points": analysis.entry_points,
            "risk_zones": analysis.risk_zones,
            "module_count": len(analysis.module_analyses),
            "modules": [
                {
                    "path": m.path,
                    "responsibility": m.primary_responsibility,
                    "difficulty": m.junior_difficulty,
                    "summary": m.eli_junior_summary,
                    "key_concepts": m.key_concepts,
                    "loc": m.loc
                }
                for m in analysis.module_analyses
            ]
        }
