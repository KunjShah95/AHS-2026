# Codebase Intelligence Layer

This is the backend service for the AI-driven codebase onboarding system. It provides APIs to ingest repositories, build dependency graphs, construct learning paths, and generate educational tasks.

## Setup

1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

- **POST /ingestion/process**: Helper endpoint to run the full pipeline (Ingest -> Intelligence -> Learning -> Tasks).
- **POST /tutor/ask**: Context-aware Q&A (Stubbed).
- **GET /learning**: (Placeholder)
- **GET /analytics**: (Placeholder)

## Architecture

- **IngestionService**: Clones repos and parses file trees.
- **CodeIntelligenceService**: Builds AST-based dependency graphs (currently supports Python).
- **LearningGraphService**: Maps code dependencies to learning concepts.
- **TaskGenerationService**: Creates safe, verifiable tasks for users.
