# AHS 2026 - AI Onboarding Engineer

An intelligent codebase onboarding assistant that helps new engineers understand complex repositories by generating personalized learning paths, interactive tutorials, and hands-on coding tasks.

## 🚀 Overview

This project leverages Google's Vertex AI (Gemini) to analyze codebases, build dependency graphs, and act as an interactive tutor. It consists of:
- **Backend**: A Python-based service using FastAPI and Google AI ADK for code analysis and intelligence.
- **Frontend**: A modern React application for visualizing learning graphs and interacting with the AI tutor.

## 📂 Project Structure

- `backend/`: Python backend service (FastAPI, Vertex AI).
- `ai-onboarding-engineer/`: React frontend application (Vite, TailwindCSS).

## 🛠️ Prerequisites

- **Python** 3.9+
- **Node.js** 18+
- **Git**
- **Google Cloud Verification** (for Vertex AI API access)

## 🏁 Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\Activate
   # Unix/MacOS
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (see `backend/.env` configuration).
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ai-onboarding-engineer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables locally.
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

- **Ingestion Engine**: Clones and maps repositories.
- **Intelligence Layer**: Uses AST parsing and LLMs to understand code relationships.
- **Learning Graph**: Generates a directed graph of concepts to master.
- **Task Generator**: Creates coding exercises to validate understanding.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.
