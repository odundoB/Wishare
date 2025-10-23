#!/usr/bin/env python3

import requests
import json

# Test authentication and API access
def test_chat_api():
    base_url = "http://localhost:8000"
    
    # Step 1: Login to get token
    print("🔑 Testing login...")
    login_data = {
        "username": "teacher",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/token/", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access']
            print("✅ Login successful!")
            
            # Step 2: Test chat endpoint
            print("\n📱 Testing chat endpoint...")
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            chat_response = requests.get(f"{base_url}/api/chat/", headers=headers)
            print(f"Chat API response status: {chat_response.status_code}")
            
            if chat_response.status_code == 200:
                rooms = chat_response.json()
                print(f"✅ Successfully retrieved {len(rooms) if isinstance(rooms, list) else 'N/A'} rooms")
                print("📋 Room data structure:")
                if isinstance(rooms, list) and len(rooms) > 0:
                    print(json.dumps(rooms[0], indent=2))
                elif isinstance(rooms, dict):
                    print(json.dumps(rooms, indent=2))
                else:
                    print("No rooms found or unexpected format")
            else:
                print(f"❌ Chat API failed: {chat_response.text}")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_chat_api()