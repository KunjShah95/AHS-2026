import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai
import traceback

print("Testing Gemini Key...")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No Key!")
    exit(1)

genai.configure(api_key=api_key)
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    # Use a very short prompt
    resp = model.generate_content("Hi")
    print("SUCCESS")
    print(resp.text)
except Exception:
    print("FAILED")
    print(traceback.format_exc())
