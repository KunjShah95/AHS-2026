
import google.adk
print("Imported google.adk")
print(dir(google.adk))
try:
    import google.adk.agents
    print("Imported google.adk.agents")
    print(dir(google.adk.agents))
except ImportError as e:
    print(f"Error importing agents: {e}")
