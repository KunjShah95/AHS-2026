"""
Cross-Repo Graph Store

Merges entity graphs across multiple repositories with repo-prefixed node IDs
to enable cross-repo queries and pattern discovery.
"""

import json
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field, asdict
from datetime import datetime
from collections import defaultdict

import networkx as nx


@dataclass
class CrossRepoEntity:
    """Entity that spans across repositories."""

    repo_id: str
    entity_id: str
    entity_name: str
    entity_type: str
    file_path: str
    purpose: str = ""
    similar_entities: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "repo_id": self.repo_id,
            "entity_id": self.entity_id,
            "entity_name": self.entity_name,
            "entity_type": self.entity_type,
            "file_path": self.file_path,
            "purpose": self.purpose,
            "similar_entities": self.similar_entities,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class CrossRepoQueryResult:
    """Result from cross-repo query."""

    entities: List[dict]
    total_count: int
    repos_queried: List[str]
    query_time_ms: float


class CrossRepoGraphStore:
    """
    Unified graph across all analyzed repositories.

    Features:
    - Merge entity graphs with repo-prefixed node IDs
    - Cross-repo entity queries
    - Pattern-based entity matching
    - Similar entity discovery
    """

    def __init__(self, storage_path: str = "./.codegenome/cross_graph"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.graph = nx.DiGraph()
        self.repo_index: Dict[str, Set[str]] = defaultdict(set)
        self.entity_metadata: Dict[str, dict] = {}

        self._load()

    def _get_storage_file(self) -> Path:
        return self.storage_path / "cross_graph.json"

    def _load(self):
        """Load cross-repo graph from storage."""
        storage_file = self._get_storage_file()
        if storage_file.exists():
            try:
                with open(storage_file, "r") as f:
                    data = json.load(f)

                    # Load graph
                    if "nodes" in data:
                        for node_id, node_data in data["nodes"].items():
                            self.graph.add_node(node_id, **node_data)

                    # Load edges
                    if "edges" in data:
                        for edge in data["edges"]:
                            self.graph.add_edge(
                                edge["source"],
                                edge["target"],
                                **edge.get("attributes", {}),
                            )

                    # Load repo index
                    if "repo_index" in data:
                        for repo_id, nodes in data["repo_index"].items():
                            self.repo_index[repo_id] = set(nodes)

                    # Load metadata
                    if "metadata" in data:
                        self.entity_metadata = data["metadata"]

            except Exception:
                pass

    def _save(self):
        """Save cross-repo graph to storage."""
        data = {
            "nodes": dict(self.graph.nodes(data=True)),
            "edges": [
                {"source": u, "target": v, "attributes": d}
                for u, v, d in self.graph.edges(data=True)
            ],
            "repo_index": {
                repo_id: list(nodes) for repo_id, nodes in self.repo_index.items()
            },
            "metadata": self.entity_metadata,
        }

        with open(self._get_storage_file(), "w") as f:
            json.dump(data, f, indent=2)

    def _generate_node_id(self, repo_id: str, file_path: str, entity_name: str) -> str:
        """Generate unique cross-repo node ID."""
        return f"{repo_id}:{file_path}:{entity_name}"

    async def merge_repo_graph(
        self, repo_id: str, entity_graph, repo_metadata: Optional[dict] = None
    ):
        """
        Merge a repository's entity graph into the cross-repo graph.

        Args:
            repo_id: Repository identifier (owner/name)
            entity_graph: EntityGraph instance from entities.py
            repo_metadata: Optional metadata about the repo
        """
        # Track nodes added for this repo
        added_nodes = set()

        # Add all nodes with repo prefix
        for node_id, node_data in entity_graph.graph.nodes(data=True):
            cross_repo_id = self._generate_node_id(
                repo_id, node_data.get("file", ""), node_data.get("name", "")
            )

            # Add node with repo metadata
            self.graph.add_node(
                cross_repo_id,
                **node_data,
                repo_id=repo_id,
                original_node_id=node_id,
            )

            added_nodes.add(cross_repo_id)
            self.entity_metadata[cross_repo_id] = {
                "repo_id": repo_id,
                "merged_at": datetime.now().isoformat(),
            }

        # Add edges with repo context
        for source, target, edge_data in entity_graph.graph.edges(data=True):
            source_cross = self._generate_node_id(
                repo_id,
                entity_graph.graph.nodes[source].get("file", ""),
                entity_graph.graph.nodes[source].get("name", ""),
            )
            target_cross = self._generate_node_id(
                repo_id,
                entity_graph.graph.nodes[target].get("file", ""),
                entity_graph.graph.nodes[target].get("name", ""),
            )

            self.graph.add_edge(
                source_cross, target_cross, **edge_data, repo_id=repo_id
            )

        # Update repo index
        self.repo_index[repo_id] = added_nodes

        # Add repo metadata if provided
        if repo_metadata:
            self.entity_metadata[f"repo:{repo_id}"] = repo_metadata

        self._save()

    async def query_cross_repo(
        self,
        entity_type: Optional[str] = None,
        pattern: Optional[str] = None,
        repos: Optional[List[str]] = None,
        limit: int = 100,
    ) -> CrossRepoQueryResult:
        """
        Query entities across repositories.

        Args:
            entity_type: Filter by entity type (function, class, etc.)
            pattern: Search pattern in entity name
            repos: List of repo IDs to search (None = all)
            limit: Maximum results

        Returns:
            CrossRepoQueryResult with matching entities
        """
        import time

        start_time = time.time()

        results = []
        repos_queried = []

        # Determine which repos to query
        if repos:
            repo_set = set(repos)
        else:
            repo_set = set(self.repo_index.keys())

        repos_queried = list(repo_set)

        # Search nodes
        for node_id, node_data in self.graph.nodes(data=True):
            # Filter by repo
            node_repo = node_data.get("repo_id", "")
            if repos and node_repo not in repo_set:
                continue

            # Filter by type
            if entity_type and node_data.get("type") != entity_type:
                continue

            # Filter by pattern
            if pattern:
                name = node_data.get("name", "").lower()
                if pattern.lower() not in name:
                    continue

            results.append({"node_id": node_id, "repo_id": node_repo, **node_data})

            if len(results) >= limit:
                break

        query_time = (time.time() - start_time) * 1000

        return CrossRepoQueryResult(
            entities=results,
            total_count=len(results),
            repos_queried=repos_queried,
            query_time_ms=query_time,
        )

    async def find_related_across_repos(
        self,
        entity_id: str,
        repo_id: Optional[str] = None,
        max_results: int = 20,
    ) -> List[CrossRepoEntity]:
        """
        Find related entities across repositories.

        Looks for:
        - Entities with similar names
        - Entities of same type
        - Entities in similar file paths
        """
        # Find the source entity
        source_node = None
        if entity_id in self.graph.nodes:
            source_node = self.graph.nodes[entity_id]
        else:
            # Try to find by name pattern
            for node_id, node_data in self.graph.nodes(data=True):
                if node_data.get("name") == entity_id:
                    source_node = node_data
                    entity_id = node_id
                    break

        if not source_node:
            return []

        related = []
        source_type = source_node.get("type", "")
        source_name = source_node.get("name", "").lower()

        # Find similar entities
        for node_id, node_data in self.graph.nodes(data=True):
            if node_id == entity_id:
                continue

            # Skip same repo if specified
            if repo_id and node_data.get("repo_id") == repo_id:
                continue

            score = 0
            reasons = []

            # Same type
            if node_data.get("type") == source_type:
                score += 2
                reasons.append("same_type")

            # Similar name (simple fuzzy)
            target_name = node_data.get("name", "").lower()
            if source_name in target_name or target_name in source_name:
                score += 3
                reasons.append("similar_name")

            # Similar file path pattern
            source_file = source_node.get("file", "")
            target_file = node_data.get("file", "")
            if self._path_similarity(source_file, target_file) > 0.5:
                score += 1
                reasons.append("similar_path")

            if score > 0:
                related.append(
                    CrossRepoEntity(
                        repo_id=node_data.get("repo_id", ""),
                        entity_id=node_id,
                        entity_name=node_data.get("name", ""),
                        entity_type=node_data.get("type", ""),
                        file_path=node_data.get("file", ""),
                        similar_entities=reasons,
                    )
                )

        # Sort by score and limit
        related.sort(key=lambda x: len(x.similar_entities), reverse=True)
        return related[:max_results]

    def _path_similarity(self, path1: str, path2: str) -> float:
        """Calculate simple path similarity."""
        parts1 = set(path1.split("/"))
        parts2 = set(path2.split("/"))

        if not parts1 or not parts2:
            return 0.0

        intersection = len(parts1 & parts2)
        union = len(parts1 | parts2)

        return intersection / union if union > 0 else 0.0

    async def get_merged_graph(
        self,
        repos: Optional[List[str]] = None,
        include_edges: bool = True,
    ) -> dict:
        """
        Get the full merged cross-repo graph.

        Args:
            repos: Optional list of repos to include
            include_edges: Whether to include edge data

        Returns:
            Graph data suitable for visualization
        """
        nodes = []
        edges = []

        for node_id, node_data in self.graph.nodes(data=True):
            # Filter by repo if specified
            if repos and node_data.get("repo_id") not in repos:
                continue

            nodes.append(
                {
                    "id": node_id,
                    "repo_id": node_data.get("repo_id", ""),
                    "name": node_data.get("name", ""),
                    "type": node_data.get("type", ""),
                    "file": node_data.get("file", ""),
                }
            )

        if include_edges:
            for source, target, edge_data in self.graph.edges(data=True):
                if repos:
                    source_repo = self.graph.nodes[source].get("repo_id", "")
                    target_repo = self.graph.nodes[target].get("repo_id", "")
                    if source_repo not in repos or target_repo not in repos:
                        continue

                edges.append(
                    {
                        "source": source,
                        "target": target,
                        "type": edge_data.get("type", "related"),
                    }
                )

        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "repos": list(set(n.get("repo_id", "") for n in nodes)),
            },
        }

    def get_indexed_repos(self) -> List[str]:
        """Get list of all indexed repositories."""
        return list(self.repo_index.keys())

    def get_repo_stats(self, repo_id: str) -> dict:
        """Get statistics for a specific repo in the cross-graph."""
        if repo_id not in self.repo_index:
            return {"error": "Repository not indexed"}

        nodes = self.repo_index[repo_id]

        type_counts = defaultdict(int)
        for node_id in nodes:
            node_data = self.graph.nodes.get(node_id, {})
            type_counts[node_data.get("type", "unknown")] += 1

        return {
            "repo_id": repo_id,
            "total_nodes": len(nodes),
            "by_type": dict(type_counts),
        }


# Standalone functions


def create_cross_repo_graph(storage_path: str = "./.codegenome/cross_graph"):
    """Create a new cross-repo graph store."""
    return CrossRepoGraphStore(storage_path)


async def merge_entities_to_cross_graph(
    repo_id: str,
    entity_graph,
    storage_path: str = "./.codegenome/cross_graph",
    metadata: Optional[dict] = None,
):
    """Convenience function to merge entities into cross-graph."""
    store = CrossRepoGraphStore(storage_path)
    await store.merge_repo_graph(repo_id, entity_graph, metadata)
    return store
