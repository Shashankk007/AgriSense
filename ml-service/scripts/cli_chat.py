import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()  # picks up ML_ADMIN_KEY from ml-service/.env

# URL where your FastAPI server is running
API_URL = "http://localhost:8000/chat"

def main():
    print("=========================================")
    print("🌾 Welcome to AgriSense AI Terminal Chat 🌾")
    print("=========================================")
    print("Type 'exit' or 'quit' to stop the chat.\n")
    
    # We use a fixed user ID for this terminal session to maintain memory
    user_id = "terminal_user_001"

    while True:
        try:
            user_input = input("\nYou: ")
            
            if user_input.lower() in ['exit', 'quit']:
                print("AgriSense AI: Goodbye! Happy farming! 🚜")
                break
                
            if not user_input.strip():
                continue
                
            payload = {
                "user_id": user_id,
                "message": user_input
            }
            
            # Send request to your FastAPI backend
            response = requests.post(API_URL, json=payload, headers={"X-Admin-Key": os.environ.get("ML_ADMIN_KEY", "")})
            
            if response.status_code == 200:
                data = response.json()
                bot_reply = data.get("response", "Error: No response field")
                print(f"\nAgriSense AI: {bot_reply}")
            else:
                print(f"\n[Error {response.status_code}]: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("\n[Error]: Could not connect to the server. Is FastAPI running on port 8000?")
            break
        except KeyboardInterrupt:
            print("\nAgriSense AI: Goodbye! 🚜")
            break

if __name__ == "__main__":
    main()
