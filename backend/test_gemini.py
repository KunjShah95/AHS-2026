import os
import time
from dotenv import load_dotenv
load_dotenv()

print("Loading google.generativeai...")
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {'Yes' if api_key else 'No'} (Length: {len(api_key) if api_key else 0})")

if api_key:
    genai.configure(api_key=api_key)
    print("Configured. generating content...")
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Hello, are you working?")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("No API Key.")
