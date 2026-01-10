
import os
import inspect
from dotenv import load_dotenv

load_dotenv()

try:
    from google.adk.agents.llm_agent import Agent
    print("SUCCESS: Imported google.adk.agents.llm_agent.Agent")
    
    # Inspect methods
    print("\nMethods of Agent class:")
    for name, _ in inspect.getmembers(Agent, predicate=inspect.isfunction):
        if not name.startswith("_"):
            print(f"- {name}")
            
except ImportError as e:
    print(f"FAILURE: Could not import Agent: {e}")
except Exception as e:
    print(f"ERROR: {e}")
