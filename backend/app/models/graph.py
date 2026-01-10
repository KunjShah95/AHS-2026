from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from enum import Enum

class NodeType(str, Enum):
    MODULE = "module"
    CLASS = "class"
    FUNCTION = "function"
    CONCEPT = "concept"

class EdgeType(str, Enum):
    IMPORTS = "imports"
    CALLS = "calls"
    DEFINES = "defines"
    DEPENDS_ON = "depends_on"  # Prerequisite for learning

class CodeNode(BaseModel):
    id: str
    type: NodeType
    name: str
    path: str
    metadata: Dict[str, Any] = {}

class LearningNode(BaseModel):
    id: str
    concept_name: str
    difficulty: int  # 1-10
    cognitive_load: int # 1-10 estimation
    description: str
    related_code_nodes: List[str] # IDs of CodeNodes

class GraphEdge(BaseModel):
    source: str
    target: str
    type: EdgeType
    weight: float = 1.0

class CodeGraph(BaseModel):
    nodes: List[CodeNode]
    edges: List[GraphEdge]

class LearningPath(BaseModel):
    nodes: List[LearningNode]
    edges: List[GraphEdge]
    entry_points: List[str]
