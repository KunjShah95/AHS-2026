import asyncio
from unittest.mock import MagicMock
from app.agents.task_generation import TaskGeneratorAgent

# Mock CodeGraph
class MockCodeNode:
    def __init__(self, path, name, type, risk):
        self.path = path
        self.name = name
        self.type = type
        self.metadata = {"risk_score": risk}

class MockCodeGraph:
    def __init__(self, nodes):
        self.nodes = nodes

async def test():
    print("Initializing Agent...")
    agent = TaskGeneratorAgent()
    
    # Mock behavior of Gemini client to avoid API calls
    agent.gemini = MagicMock()
    # Mock result matching the prompt output
    agent.gemini.generate_json.return_value = {
        "task_id": "test_id",
        "title": "Test Task",
        "type": "scavenger_hunt",
        "difficulty": 1,
        "estimated_minutes": 15,
        "objective": "Test Objective",
        "instructions": ["Step 1"],
        "files_involved": ["test.py"],
        "success_criteria": ["Done"],
        "hints": [],
        "follow_up_concepts": [],
        "xp_reward": 150  # Matches user need for generated score
    }
    
    nodes = [
        MockCodeNode("file1.py", "file1", "module", "low"),
        MockCodeNode("file2.py", "file2", "module", "critical")
    ]
    graph = MockCodeGraph(nodes)
    
    print("Calling generate_tasks...")
    tasks = await agent.generate_tasks(graph)
    
    print(f"Generated {len(tasks)} tasks.")
    for t in tasks:
        print(f"- {t.title} [XP: {t.xp_reward}] (TaskType: {t.task_type.value})")
        if t.xp_reward == 150:
             print("  SUCCESS: Uses assigned XP reward.")
        else:
             print(f"  FAILURE: Expected 150, got {t.xp_reward}")

if __name__ == "__main__":
    asyncio.run(test())
