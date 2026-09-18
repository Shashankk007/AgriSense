import json
import os

import requests

base_url = "http://localhost:8000"
# Admin endpoints (/memory/*, /knowledge/upload) need ML_ADMIN_KEY from ml-service/.env
admin = {"X-Admin-Key": os.environ.get("ML_ADMIN_KEY", "")}

print("--- Testing Health Check ---")
res = requests.get(f"{base_url}/")
print(res.json())

print("\n--- Testing Memory Store ---")
payload = {
    "user_id": "test_user_123",
    "fact": "I am a farmer from Punjab and I grow wheat on 10 acres of land."
}
res = requests.post(f"{base_url}/memory/store", json=payload, headers=admin)
print(res.status_code, res.json())

print("\n--- Testing Knowledge Upload ---")
payload = {
    "content": "Wheat needs well-drained loamy soil. It is a Rabi crop sown in October-November and harvested in April-May. It requires 50-100 cm of rainfall.",
    "source": "AgriSense Wheat Guide",
    "category": "crop"
}
res = requests.post(f"{base_url}/knowledge/upload", json=payload, headers=admin)
print(res.status_code, res.json())

print("\n--- Testing Chat (RAG) ---")
payload = {
    "user_id": "test_user_123",
    "message": "When should I harvest my crop? Also, what type of soil does it need?"
}
res = requests.post(f"{base_url}/chat", json=payload)
print(res.status_code, json.dumps(res.json(), indent=2))
