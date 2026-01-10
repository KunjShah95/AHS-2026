import os
from dotenv import load_dotenv

load_dotenv()
import shutil
import asyncio
from app.agents.repository_ingestion import RepositoryIngestionAgent
from app.agents.code_intelligence import CodeIntelligenceAgent
from app.agents.learning_graph import LearningGraphContextAgent
from app.agents.task_generation import TaskGenerationAgent
from app.agents.interactive_tutor import InteractiveTutorAgent

# Mock file content creation for testing
def create_dummy_repo(target_dir):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)
    
    main_py = os.path.join(target_dir, "app.py")
    with open(main_py, "w") as f:
        f.write("""
import utils
from core import engine

def main():
    print("Starting App")
    data = utils.fetch_data()
    engine.run(data)

if __name__ == "__main__":
    main()
""")

    utils_py = os.path.join(target_dir, "utils.py")
    with open(utils_py, "w") as f:
        f.write("""
def fetch_data():
    return {"id": 1}
""")

    core_dir = os.path.join(target_dir, "core")
    os.makedirs(core_dir, exist_ok=True)
    engine_py = os.path.join(core_dir, "engine.py")
    with open(engine_py, "w") as f:
        f.write("""
def run(data):
    print(f"Running with {data}")
""")

async def run_agent_test():
    print("--- Starting Agent System Test ---")
    repo_path = os.path.join(os.getcwd(), "agent_test_repo")
    create_dummy_repo(repo_path)
    
    # 1. Ingestion Agent
    print("\n[Agent 1] Repository Ingestion...")
    ingest_agent = RepositoryIngestionAgent()
    file_tree = ingest_agent.parse_file_tree(repo_path)
    # Mock AI analysis
    file_tree = await ingest_agent.analyze_modules(file_tree)
    print(f"Files found: {len(file_tree)}")
    print(f"AI Summary for app.py: {next((f['ai_summary'] for f in file_tree if 'app.py' in f['path']), 'N/A')}")

    # 2. Intelligence Agent
    print("\n[Agent 2] Code Intelligence...")
    intel_agent = CodeIntelligenceAgent()
    code_graph = intel_agent.build_graph(file_tree, repo_path)
    print(f"Graph Nodes: {len(code_graph.nodes)}")
    print(f"Graph Edges: {len(code_graph.edges)}")

    # 3. Learning Graph Agent
    print("\n[Agent 3] Learning Graph...")
    learn_agent = LearningGraphContextAgent()
    learning_path = learn_agent.generate_roadmap(code_graph)
    print(f"Learning Concepts: {len(learning_path.nodes)}")

    # 4. Task Generation Agent
    print("\n[Agent 4] Task Generation...")
    task_agent = TaskGenerationAgent()
    tasks = task_agent.generate_tasks(code_graph)
    print(f"Tasks Generated: {len(tasks)}")
    if tasks:
        print(f"Sample Task: {tasks[0]['title']}")

    # 5. Interactive Tutor Agent
    print("\n[Agent 5] Interactive Tutor...")
    tutor_agent = InteractiveTutorAgent()
    answer = tutor_agent.answer("What does app.py do?", code_graph)
    print(f"Tutor Answer: {answer}")

    print("\n--- Agent Test Complete ---")

if __name__ == "__main__":
    asyncio.run(run_agent_test())
