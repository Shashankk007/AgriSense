import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    sys.exit("Set GOOGLE_API_KEY in ml-service/.env (never hardcode it here).")

response = requests.get(
    "https://generativelanguage.googleapis.com/v1beta/models",
    headers={"x-goog-api-key": api_key},
    timeout=30,
)
if response.status_code == 200:
    print("Available models (name -> supported methods):")
    for m in response.json().get("models", []):
        print(f" - {m['name']}  ->  {', '.join(m.get('supportedGenerationMethods', []))}")
else:
    print(f"Error {response.status_code}: {response.text}")
