
import os
import sys
import inspect

sys.stdout.reconfigure(encoding='utf-8')

print("Starting import...", flush=True)

try:
    from google.adk.agents.llm_agent import Agent
    print("Import successful!", flush=True)
    
    print("Agent methods:", flush=True)
    # Check for likely run methods
    methods = [m for m in dir(Agent) if not m.startswith("_")]
    print(methods, flush=True)
    
    if "run" in methods:
        print("Run method found.", flush=True)
        print(inspect.signature(Agent.run))
    if "invoke" in methods:
        print("Invoke method found.", flush=True)
    if "chat" in methods:
        print("Chat method found.", flush=True)

except ImportError as e:
    print(f"ImportError: {e}", flush=True)
except Exception as e:
    print(f"Error: {e}", flush=True)
