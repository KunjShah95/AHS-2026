# Backend API Documentation

This backend service provides the intelligence layer for the AI Onboarding Engineer. It provides APIs to ingest repositories, analyze them, and generate learning paths and tasks.

## Base URL

`http://localhost:8000`

## Endpoints

### 1. Ingest and Process Repository

**POST** `/ingestion/process`

Analyzes a repository and returns the complete learning state (File Tree, Code Graph, Learning Path, Tasks).

**Request Body:**

```json
{
  "repo_path": "/path/to/local/repo",
  "github_url": "https://github.com/user/repo" 
}
```

*Note: If `github_url` is provided, it will clone to `repo_path`. If not, it analyzes `repo_path` directly.*

**Response:**

```json
{
  "status": "success",
  "metadata": {
    "file_count": 10,
    "node_count": 50,
    "learning_concept_count": 5,
    "task_count": 5
  },
  "file_tree": [...],
  "code_graph": {
    "nodes": [...],
    "edges": [...]
  },
  "learning_path": {
    "nodes": [
      {
         "id": "concept_app/services/auth.py",
         "concept_name": "Understanding auth.py",
         "difficulty": 3,
         "cognitive_load": 4,
         "description": "Learn about module...",
         "related_code_nodes": [...]
      }
    ],
    "edges": [...],
    "entry_points": [...]
  },
  "tasks": [...]
}
```

### 2. Interactive Tutor

**POST** `/tutor/ask`

Ask questions about the codebase. The backend uses the graph context to answer deterministically or via LLM (mocked in V0).

**Request Body:**

```json
{
  "question": "What is the responsibility of the auth module?",
  "context_graph": { ... } // The 'code_graph' object returned from /process
}
```

**Response:**

```json
{
  "answer": "Based on the code structure..."
}
```

### 3. Change Impact Analysis

**POST** `/analytics/impact`

Analyze the downstream impact of changing a specific module.

**Request Body:**

```json
{
  "changed_module": "app/services/base.py",
  "code_graph": { ... } // The 'code_graph' object
}
```

**Response:**

```json
{
  "affected_modules": ["app/services/derived.py", ...],
  "risk_score": 8
}
```

## Data Models

**Learning Node:**

- `difficulty` (1-10): Calculated based on LOC and complexity.
- `cognitive_load` (1-10): Calculated based on Fan-In/Fan-Out dependencies.
- `description`: Includes "Beginner Safe" tag if low risk.

## Setup

1. `pip install -r requirements.txt`
2. `uvicorn app.main:app --reload`
