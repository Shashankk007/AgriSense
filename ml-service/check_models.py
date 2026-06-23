import os
import requests

api_key = os.environ.get("GOOGLE_API_KEY", "AQ.Ab8RN6LEHuo_sSJPKt_NAU4UNw05xsdLiFOAJZzTjhbIA514-w")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

response = requests.get(url)
if response.status_code == 200:
    models = response.json().get("models", [])
    print("Available models:")
    for m in models:
        print(f" - {m['name']}")
else:
    print(f"Error {response.status_code}: {response.text}")
