
import sys
import os
import json

# Ensure we can import app
sys.path.append(os.getcwd())

from app.services.ingestion import IngestionService
from app.services.intelligence import CodeIntelligenceService
from app.services.learning_graph import LearningGraphService
from app.services.task_generation import TaskGenerationService

def run_verify():
    print("Starting verification...")
    
    # 1. Ingestion
    print("1. Ingestion...")
    ingest = IngestionService()
    # Use current directory
    target_path = os.getcwd()
    file_tree = ingest.parse_file_tree(target_path)
    print(f"   Found {len(file_tree)} files.")
    
    # 2. Intelligence
    print("2. Intelligence...")
    intel = CodeIntelligenceService()
    code_graph = intel.build_dependency_graph(file_tree, target_path)
    print(f"   Graph: {len(code_graph.nodes)} nodes, {len(code_graph.edges)} edges.")
    
    # 3. Learning Graph
    print("3. Learning Graph...")
    learn = LearningGraphService()
    l_path = learn.construct_learning_path(code_graph)
    print(f"   Learning Path: {len(l_path.nodes)} concepts.")
    
    # 4. Tasks
    print("4. Tasks...")
    tasks = TaskGenerationService()
    generated_tasks = tasks.generate_tasks(code_graph)
    print(f"   Tasks: {len(generated_tasks)} tasks.")
    
    # Check if we have any beginner safe nodes
    safe_nodes = [n for n in l_path.nodes if "Beginner Safe" in n.description]
    print(f"   Beginner Safe Concepts: {len(safe_nodes)}")
    
    if len(file_tree) > 0 and len(code_graph.nodes) > 0:
        print("SUCCESS: Pipeline verified.")
    else:
        print("FAILURE: Pipeline is empty.")

if __name__ == "__main__":
    run_verify()
