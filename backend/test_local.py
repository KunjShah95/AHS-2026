import os
import sys
import json
from app.services.ingestion import IngestionService
from app.services.intelligence import CodeIntelligenceService
from app.services.learning_graph import LearningGraphService
from app.services.task_generation import TaskGenerationService

# Mock file content creation for testing
def create_dummy_repo(target_dir):
    os.makedirs(target_dir, exist_ok=True)
    
    main_py = os.path.join(target_dir, "main.py")
    with open(main_py, "w") as f:
        f.write("""
import utils
from core import engine

def main():
    data = utils.load_data()
    engine.process(data)

if __name__ == "__main__":
    main()
""")

    utils_py = os.path.join(target_dir, "utils.py")
    with open(utils_py, "w") as f:
        f.write("""
def load_data():
    return [1, 2, 3]
""")

    core_dir = os.path.join(target_dir, "core")
    os.makedirs(core_dir, exist_ok=True)
    engine_py = os.path.join(core_dir, "engine.py")
    with open(engine_py, "w") as f:
        f.write("""
def process(data):
    print(f"Processing {len(data)} items")
""")

def run_test():
    print("--- Starting Backend Logic Test ---")
    test_repo = os.path.join(os.getcwd(), "test_repo_output")
    create_dummy_repo(test_repo)
    print(f"Created dummy repo at {test_repo}")

    # 1. Ingestion
    print("\n1. Running IngestionService...")
    ingest = IngestionService()
    file_tree = ingest.parse_file_tree(test_repo)
    print(f"Found {len(file_tree)} files.")

    # 2. Intelligence
    print("\n2. Running CodeIntelligenceService...")
    intel = CodeIntelligenceService()
    code_graph = intel.build_dependency_graph(file_tree, test_repo)
    print(f"Graph Nodes: {len(code_graph.nodes)}")
    print(f"Graph Edges: {len(code_graph.edges)}")

    # 3. Learning Graph
    print("\n3. Running LearningGraphService...")
    learn = LearningGraphService()
    l_path = learn.construct_learning_path(code_graph)
    print(f"Learning Concepts: {len(l_path.nodes)}")
    print(f"Dependencies: {len(l_path.edges)}")
    for node in l_path.nodes:
        print(f" - {node.concept_name} (Diff: {node.difficulty}, Load: {node.cognitive_load})")

    # 4. Tasks
    print("\n4. Running TaskGenerationService...")
    task_gen = TaskGenerationService()
    tasks = task_gen.generate_tasks(code_graph)
    print(f"Generated {len(tasks)} tasks.")
    for t in tasks[:2]:
        print(f" - Task: {t['title']}")

    print("\n--- Test Complete ---")

if __name__ == "__main__":
    run_test()
