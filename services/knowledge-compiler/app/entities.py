import networkx as nx
from typing import Dict, List, Optional
from collections import defaultdict


class EntityGraph:
    """Builds and manages the knowledge graph of code entities"""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.entities_by_file = defaultdict(list)
        self.entities_by_type = defaultdict(list)

    def add_entity(self, entity: dict):
        """Add an entity to the graph"""
        node_id = f"{entity['file']}:{entity['name']}"

        self.graph.add_node(node_id, **entity)

        self.entities_by_file[entity["file"]].append(entity)
        self.entities_by_type[entity["type"]].append(entity)

    def build_relationships(self):
        """Build relationships between entities based on code structure"""

        # File-level relationships
        for file_path, entities in self.entities_by_file.items():
            # Classes and functions in same file are related
            classes = [e for e in entities if e["type"] == "class"]
            funcs = [e for e in entities if e["type"] in ["function", "async_function"]]

            for cls in classes:
                cls_id = f"{cls['file']}:{cls['name']}"
                for func in funcs:
                    func_id = f"{func['file']}:{func['name']}"
                    # Method relationship
                    if func.get("name") in cls.get("children", []):
                        self.graph.add_edge(func_id, cls_id, type="method_of")
                        self.graph.add_edge(cls_id, func_id, type="contains")
                    else:
                        self.graph.add_edge(cls_id, func_id, type="contains")

        # Module relationships
        all_modules = self.entities_by_type.get("module", [])
        for module in all_modules:
            module_id = f"{module['file']}:{module['name']}"

            # Find imports (simple heuristic)
            file_content = module.get("content", "")
            if file_content:
                # This would need more sophisticated import detection
                pass

    def get_file_dependencies(self, file_path: str) -> List[str]:
        """Get files that this file depends on"""
        entities = self.entities_by_file.get(file_path, [])
        deps = set()

        for entity in entities:
            # Look for imports in docstring or content
            # This is simplified - real implementation would parse imports
            pass

        return list(deps)

    def get_module_hierarchy(self) -> dict:
        """Build module hierarchy from file structure"""
        hierarchy = {}

        for file_path in self.entities_by_file.keys():
            parts = file_path.split("/")
            current = hierarchy

            for i, part in enumerate(parts):
                if part not in current:
                    current[part] = {}

                if i == len(parts) - 1:
                    current[part]["_entities"] = self.entities_by_file.get(
                        file_path, []
                    )

                current = current[part]

        return hierarchy

    def get_summary(self) -> dict:
        """Get graph summary statistics"""
        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "files": len(self.entities_by_file),
            "by_type": {
                entity_type: len(entities)
                for entity_type, entities in self.entities_by_type.items()
            },
            "top_files": sorted(
                [(f, len(es)) for f, es in self.entities_by_file.items()],
                key=lambda x: x[1],
                reverse=True,
            )[:10],
        }


# Standalone functions
def build_entity_graph(files: list, entities_map: dict) -> EntityGraph:
    """Build entity graph from parsed files"""
    graph = EntityGraph()

    for file_path, entities in entities_map.items():
        for entity in entities:
            graph.add_entity(entity)

    graph.build_relationships()
    return graph


def get_entity_by_id(graph: EntityGraph, file_path: str, name: str) -> Optional[dict]:
    """Get specific entity from graph"""
    node_id = f"{file_path}:{name}"
    return graph.graph.nodes.get(node_id)


def get_related_entities(graph: EntityGraph, file_path: str, name: str) -> dict:
    """Get related entities for a given entity"""
    node_id = f"{file_path}:{name}"

    if node_id not in graph.graph:
        return {}

    related = {"incoming": [], "outgoing": []}

    for pred in graph.graph.predecessors(node_id):
        related["incoming"].append(graph.graph.nodes[pred])

    for succ in graph.graph.successors(node_id):
        related["outgoing"].append(graph.graph.nodes[succ])

    return related
