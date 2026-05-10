from typing import Dict, List, Optional, Any
from pathlib import Path
import json
from datetime import datetime
import os

try:
    from . import llm

    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False


class WikiEngine:
    """
    LLM Wiki Pattern - Karpathy style
    - Compile once: parse code → generate wiki pages
    - Maintain: detect stale content, update on changes
    - Query: answer from compiled wiki, not raw code
    """

    def __init__(self, wiki_path: str = "./wiki"):
        self.wiki_path = Path(wiki_path)
        self.wiki_path.mkdir(parents=True, exist_ok=True)

        self.pages = {}  # page_name -> content
        self.index = {}  # page_name -> metadata
        self.links = {}  # page_name -> linked pages

    def compile(
        self, repo_path: str, entities: List[dict], file_tree: List[dict]
    ) -> dict:
        """
        Compile source code into persistent wiki pages
        """
        # Group entities by file
        entities_by_file = {}
        for entity in entities:
            file_path = entity.get("file", "")
            if file_path not in entities_by_file:
                entities_by_file[file_path] = []
            entities_by_file[file_path].append(entity)

        # Generate overview page
        overview = self._generate_overview(entities, file_tree)
        self._save_page("overview", overview)

        # Generate file pages
        for file_path, file_entities in entities_by_file.items():
            page_name = self._path_to_page_name(file_path)
            content = self._generate_file_page(file_path, file_entities)
            self._save_page(page_name, content)
            self.pages[page_name] = content

        # Generate module hierarchy page
        hierarchy = self._generate_module_hierarchy(entities_by_file)
        self._save_page("modules", hierarchy)

        # Generate entity index
        self._build_index(entities)

        # Generate risk assessment page
        risk_page = self._generate_risk_assessment(entities)
        self._save_page("risk", risk_page)

        return {
            "repo_path": repo_path,
            "pages": list(self.pages.keys()),
            "index": self.index,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def _generate_overview(self, entities: List[dict], file_tree: List[dict]) -> str:
        """Generate repository overview page"""

        # Count by type
        type_counts = {}
        for entity in entities:
            t = entity.get("type", "unknown")
            type_counts[t] = type_counts.get(t, 0) + 1

        # Calculate average complexity
        complexities = [e.get("complexity", 1) for e in entities]
        avg_complexity = sum(complexities) / max(len(complexities), 1)

        lines = [
            "# Repository Overview",
            "",
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Statistics",
            "",
            f"- **Total Files**: {len(set(e.get('file', '') for e in entities))}",
            f"- **Total Entities**: {len(entities)}",
            f"- **Average Complexity**: {avg_complexity:.2f}",
            "",
            "### Entity Breakdown",
            "",
        ]

        for entity_type, count in sorted(
            type_counts.items(), key=lambda x: x[1], reverse=True
        ):
            lines.append(f"- **{entity_type}**: {count}")

        lines.extend(
            [
                "",
                "## File Structure",
                "",
                "```",
            ]
        )

        # Simple tree representation
        for f in file_tree[:20]:  # Limit to first 20
            lines.append(f"  - {f['path']}")

        if len(file_tree) > 20:
            lines.append(f"  ... and {len(file_tree) - 20} more files")

        lines.extend(
            [
                "```",
                "",
                "## Navigation",
                "",
                "- [Modules](modules) - Module hierarchy",
                "- [Risk Assessment](risk) - Code risk analysis",
                "",
            ]
        )

        return "\n".join(lines)

    def _generate_file_page(self, file_path: str, entities: List[dict]) -> str:
        """Generate wiki page for a single file"""

        lines = [
            f"# {Path(file_path).name}",
            "",
            f"**File**: `{file_path}`",
            "",
            "## Entities",
            "",
        ]

        # Group by type
        by_type = {}
        for entity in entities:
            t = entity.get("type", "unknown")
            if t not in by_type:
                by_type[t] = []
            by_type[t].append(entity)

        # Classes
        if "class" in by_type:
            lines.append("### Classes")
            lines.append("")
            for cls in by_type["class"]:
                lines.append(f"#### `{cls['name']}`")
                if cls.get("docstring"):
                    lines.append(f"_{cls['docstring']}_")
                if cls.get("children"):
                    lines.append(f"**Methods**: {', '.join(cls['children'])}")
                lines.append("")

        # Functions
        if "function" in by_type:
            lines.append("### Functions")
            lines.append("")
            for func in by_type["function"]:
                params = func.get("params", [])
                params_str = ", ".join(params) if params else "none"

                lines.append(f"#### `{func['name']}`({params_str})")
                if func.get("docstring"):
                    lines.append(f"_{func['docstring']}_")
                if func.get("complexity", 1) > 5:
                    lines.append(f"⚠️ **Complexity**: {func['complexity']}")
                lines.append("")

        # Async functions
        if "async_function" in by_type:
            lines.append("### Async Functions")
            lines.append("")
            for func in by_type["async_function"]:
                params = func.get("params", [])
                params_str = ", ".join(params) if params else "none"

                lines.append(f"#### `async {func['name']}`({params_str})")
                if func.get("docstring"):
                    lines.append(f"_{func['docstring']}_")
                lines.append("")

        # Modules
        if "module" in by_type and len(by_type["module"]) > 0:
            lines.append("### Module")
            lines.append("")
            for mod in by_type["module"]:
                if mod.get("docstring"):
                    lines.append(f"_{mod['docstring']}_")
                lines.append("")

        return "\n".join(lines)

    def _generate_module_hierarchy(
        self, entities_by_file: Dict[str, List[dict]]
    ) -> str:
        """Generate module hierarchy page"""

        # Build directory tree
        tree = {}
        for file_path in entities_by_file.keys():
            parts = Path(file_path).parts
            current = tree

            for i, part in enumerate(parts):
                if part not in current:
                    current[part] = {"_files": [], "_entities": 0}

                if i == len(parts) - 1:
                    current[part]["_files"].append(file_path)
                    current[part]["_entities"] = len(
                        entities_by_file.get(file_path, [])
                    )

                current = current[part]

        lines = ["# Module Hierarchy", ""]

        def print_tree(node: dict, prefix: str = "", is_last: bool = True):
            items = [(k, v) for k, v in node.items() if not k.startswith("_")]

            for i, (name, value) in enumerate(items):
                is_last_item = i == len(items) - 1
                connector = "└── " if is_last_item else "├── "

                entity_count = value.get("_entities", 0)
                files = value.get("_files", [])

                if files:
                    lines.append(
                        f"{prefix}{connector}📄 **{name}** ({entity_count} entities)"
                    )
                    for f in files:
                        lines.append(f"{prefix}    └── {f}")
                else:
                    lines.append(f"{prefix}{connector}📁 {name}")

                # Children
                child_items = [
                    (k, v) for k, v in value.items() if not k.startswith("_")
                ]
                if child_items:
                    new_prefix = prefix + ("    " if is_last_item else "│   ")
                    print_tree(value, new_prefix, is_last_item)

        print_tree(tree)

        return "\n".join(lines)

    def _generate_risk_assessment(self, entities: List[dict]) -> str:
        """Generate risk assessment page"""

        # Find high complexity entities
        high_complexity = [e for e in entities if e.get("complexity", 1) > 5]

        # Find files with many entities
        entity_count_by_file = {}
        for e in entities:
            fp = e.get("file", "")
            entity_count_by_file[fp] = entity_count_by_file.get(fp, 0) + 1

        large_files = sorted(
            [(fp, count) for fp, count in entity_count_by_file.items() if count > 10],
            key=lambda x: x[1],
            reverse=True,
        )[:10]

        lines = [
            "# Risk Assessment",
            "",
            "## High Complexity Functions",
            "",
            "These functions have complexity > 5 and may need refactoring:",
            "",
        ]

        if high_complexity:
            for e in high_complexity[:20]:
                lines.append(
                    f"- **{e['name']}** in `{e['file']}` (complexity: {e['complexity']})"
                )
        else:
            lines.append("✅ No high complexity functions found.")

        lines.extend(
            [
                "",
                "## Files with Most Entities",
                "",
                "These files may be doing too much and could benefit from splitting:",
                "",
            ]
        )

        if large_files:
            for fp, count in large_files:
                lines.append(f"- **{fp}**: {count} entities")
        else:
            lines.append("✅ No oversized files detected.")

        # Risk score
        avg_complexity = sum(e.get("complexity", 1) for e in entities) / max(
            len(entities), 1
        )
        risk_score = max(100 - (avg_complexity * 10), 0)

        risk_label = (
            "🟢 Low"
            if risk_score > 70
            else "🟡 Medium"
            if risk_score > 40
            else "🔴 High"
        )

        lines.extend(
            [
                "",
                "## Overall Risk Score",
                "",
                f"**{risk_label}** ({risk_score}/100)",
                "",
                f"Average complexity: {avg_complexity:.2f}",
                "",
            ]
        )

        return "\n".join(lines)

    def _path_to_page_name(self, file_path: str) -> str:
        """Convert file path to wiki page name"""
        return file_path.replace("/", "_").replace(".", "_").replace("-", "_")

    def _save_page(self, name: str, content: str):
        """Save wiki page to file"""
        page_path = self.wiki_path / f"{name}.md"
        page_path.write_text(content, encoding="utf-8")
        self.pages[name] = content

    def _build_index(self, entities: List[dict]):
        """Build wiki index for search"""
        self.index = {
            "entities": {},
            "files": set(),
            "last_updated": datetime.utcnow().isoformat(),
        }

        for entity in entities:
            name = entity.get("name", "")
            entity_type = entity.get("type", "unknown")
            file_path = entity.get("file", "")

            self.index["files"].add(file_path)

            if name:
                if entity_type not in self.index["entities"]:
                    self.index["entities"][entity_type] = []
                self.index["entities"][entity_type].append(
                    {"name": name, "file": file_path, "line": entity.get("line")}
                )

        self.index["files"] = list(self.index["files"])

        # Save index
        index_path = self.wiki_path / "index.json"
        index_path.write_text(json.dumps(self.index, indent=2), encoding="utf-8")

    def _find_relevant_pages(self, question: str) -> List[str]:
        """Find pages relevant to a question"""
        question_lower = question.lower()
        relevant = []

        for page_name in self.pages.keys():
            page_content = self.pages.get(page_name, "").lower()
            if any(word in page_content for word in question_lower.split()[:5]):
                relevant.append(page_name)

        return relevant[:10]

    def query(self, question: str) -> dict:
        """
        Query the wiki - answer from compiled content
        This would integrate with LLM for natural language answers
        """
        # Simple keyword matching for now
        question_lower = question.lower()

        results = {"question": question, "answer": None, "relevant_pages": []}

        # Find relevant entities
        for entity_type, entities in self.index.get("entities", {}).items():
            for entity in entities:
                if entity["name"].lower() in question_lower:
                    results["relevant_pages"].append(
                        {
                            "type": entity_type,
                            "name": entity["name"],
                            "file": entity["file"],
                        }
                    )

        # Look for file mentions
        for file_path in self.index.get("files", []):
            if file_path.split("/")[-1].lower() in question_lower:
                results["relevant_pages"].append({"type": "file", "file": file_path})

        return results

    def lint(self) -> dict:
        """
        Lint the wiki - detect stale content
        In production, this would check for contradictions and outdated info
        """
        return {"status": "ok", "pages_checked": len(self.pages), "issues": []}

    def get_page(self, page_name: str) -> Optional[str]:
        """Get specific wiki page content"""
        return self.pages.get(page_name)

    def get_all_pages(self) -> List[str]:
        """Get list of all wiki pages"""
        return list(self.pages.keys())

    def detect_stale_pages(
        self, repo_path: str, entities: List[dict]
    ) -> List[Dict[str, Any]]:
        """Detect wiki pages that are outdated"""
        stale_pages = []

        for page_name, page_content in self.pages.items():
            file_path = self._page_name_to_path(page_name)

            if (
                not file_path
                or file_path == "overview"
                or file_path == "modules"
                or file_path == "risk"
            ):
                continue

            full_path = Path(repo_path) / file_path
            if not full_path.exists():
                stale_pages.append(
                    {
                        "page": page_name,
                        "reason": "file_not_found",
                        "file_path": file_path,
                    }
                )
                continue

            file_mtime = full_path.stat().st_mtime

            page_meta = self.index.get(page_name, {})
            wiki_mtime = page_meta.get("generated_at", 0)

            if isinstance(wiki_mtime, str):
                try:
                    wiki_mtime = datetime.fromisoformat(wiki_mtime).timestamp()
                except:
                    wiki_mtime = 0

            if file_mtime > wiki_mtime:
                stale_pages.append(
                    {
                        "page": page_name,
                        "reason": "source_updated",
                        "file_path": file_path,
                        "file_modified": datetime.fromtimestamp(file_mtime).isoformat(),
                    }
                )

        return stale_pages

    def _page_name_to_path(self, page_name: str) -> str:
        """Convert page name back to file path"""
        if page_name == "overview" or page_name == "modules" or page_name == "risk":
            return page_name

        return page_name.replace("_", "/") + ".py"

    def heal_page(self, page_name: str, repo_path: str, entities: List[dict]) -> bool:
        """Regenerate a stale wiki page"""
        file_path = self._page_name_to_path(page_name)

        if file_path in ["overview", "modules", "risk"]:
            if file_path == "overview":
                content = self._generate_overview(entities, [])
            elif file_path == "modules":
                entities_by_file = self._group_entities_by_file(entities)
                content = self._generate_module_hierarchy(entities_by_file)
            else:
                content = self._generate_risk_assessment(entities)

            self._save_page(page_name, content)
            self.pages[page_name] = content
            return True

        file_entities = [e for e in entities if e.get("file", "") == file_path]

        if file_entities:
            content = self._generate_file_page(file_path, file_entities)
            self._save_page(page_name, content)
            self.pages[page_name] = content
            return True

        return False

    def heal_all_stale(self, repo_path: str, entities: List[dict]) -> Dict[str, Any]:
        """Heal all stale wiki pages"""
        stale = self.detect_stale_pages(repo_path, entities)

        healed = []
        failed = []

        for stale_page in stale:
            page_name = stale_page["page"]
            if self.heal_page(page_name, repo_path, entities):
                healed.append(page_name)
            else:
                failed.append(page_name)

        return {
            "total_stale": len(stale),
            "healed": healed,
            "failed": failed,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _group_entities_by_file(self, entities: List[dict]) -> Dict[str, List[dict]]:
        """Group entities by file path"""
        grouped = {}
        for entity in entities:
            file_path = entity.get("file", "")
            if file_path not in grouped:
                grouped[file_path] = []
            grouped[file_path].append(entity)
        return grouped

    def get_wiki_health_score(
        self, repo_path: str, entities: List[dict]
    ) -> Dict[str, Any]:
        """Calculate overall wiki health score"""
        stale = self.detect_stale_pages(repo_path, entities)
        total_pages = len(self.pages)

        if total_pages == 0:
            return {"score": 0, "status": "no_pages"}

        stale_count = len(stale)
        healthy_count = total_pages - stale_count

        score = (healthy_count / total_pages) * 100

        status = "healthy"
        if score < 50:
            status = "critical"
        elif score < 75:
            status = "warning"
        elif score < 90:
            status = "good"

        return {
            "score": round(score, 2),
            "status": status,
            "total_pages": total_pages,
            "healthy_pages": healthy_count,
            "stale_pages": stale_count,
            "stale_details": stale[:5],
        }

    def schedule_healing(
        self, repo_path: str, entities: List[dict], batch_size: int = 10
    ) -> Dict[str, Any]:
        """Schedule healing in batches for efficiency"""
        stale = self.detect_stale_pages(repo_path, entities)

        batches = []
        for i in range(0, len(stale), batch_size):
            batch = stale[i : i + batch_size]
            batches.append([p["page"] for p in batch])

        return {
            "total_pages_to_heal": len(stale),
            "batches": len(batches),
            "batch_size": batch_size,
            "batch_list": batches,
        }

    def get_change_impact(
        self, changed_files: List[str], entities: List[dict]
    ) -> Dict[str, Any]:
        """Analyze impact of file changes on wiki"""
        affected_pages = []

        for file_path in changed_files:
            page_name = self._path_to_page_name(file_path)
            if page_name in self.pages:
                affected_pages.append(page_name)

        cross_refs = []
        for page in affected_pages:
            links = self.links.get(page, [])
            cross_refs.extend([l for l in links if l not in affected_pages])

        return {
            "changed_files": changed_files,
            "affected_pages": affected_pages,
            "cross_references_affected": list(set(cross_refs)),
            "total_impact_score": len(affected_pages) + len(set(cross_refs)),
        }


# Standalone functions
def compile_wiki(
    repo_path: str,
    entities: List[dict],
    file_tree: List[dict],
    wiki_path: str = "./wiki",
) -> dict:
    """Main entry point for wiki compilation"""
    engine = WikiEngine(wiki_path)
    return engine.compile(repo_path, entities, file_tree)


def query_wiki(question: str, wiki_path: str = "./wiki") -> dict:
    """Query the compiled wiki"""
    engine = WikiEngine(wiki_path)
    return engine.query(question)


async def generate_llm_wiki_content(
    file_path: str,
    code: str,
    entities: List[dict],
) -> str:
    """Generate enhanced wiki content using LLM"""
    if not LLM_AVAILABLE:
        return "LLM not available - using basic wiki generation"

    try:
        content = await llm.generate_wiki_content(file_path, code, entities)
        return content
    except Exception as e:
        print(f"LLM wiki generation failed: {e}")
        return f"LLM generation failed: {str(e)}"


async def query_with_llm(
    question: str,
    wiki_path: str = "./wiki",
) -> str:
    """Query the wiki using LLM for enhanced answers"""
    if not LLM_AVAILABLE:
        return "LLM not available"

    engine = WikiEngine(wiki_path)
    relevant = engine._find_relevant_pages(question)

    context = []
    for page_name in relevant[:5]:
        content = engine.get_page(page_name)
        if content:
            context.append(
                {
                    "source": page_name,
                    "content": content[:1000],
                }
            )

    try:
        answer = await llm.query_codebase(question, context)
        return answer
    except Exception as e:
        return f"Query failed: {str(e)}"
