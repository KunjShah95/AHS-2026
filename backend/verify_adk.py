
import os
import sys
from dotenv import load_dotenv

load_dotenv()

try:
    from app.core.adk import get_adk_client
except ImportError as e:
    # Fix path
    sys.path.append(os.getcwd())
    from app.core.adk import get_adk_client

def check():
    client = get_adk_client()
    print(f"ADK Client Mode: {client.mode}")
    
    if client.mode == "adk":
        print("SUCCESS: Running in REAL ADK mode.")
        if client.agent:
            print(f"Agent Model: {client.agent.model}")
    else:
        print("WARNING: Running in MOCK mode.")

if __name__ == "__main__":
    check()
