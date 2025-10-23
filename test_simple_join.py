#!/usr/bin/env python3
"""
Simple test for join request API functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_join_request():
    print("🧪 Testing Join Request with Simple API Call")
    print("=" * 50)
    
    # Login as student1
    print("1. Logging in as student1...")
    login_response = requests.post(f"{BASE_URL}/users/login/", json={
        "username": "student1",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
        
    token = login_response.json().get('access')
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("✅ Login successful")
    
    # Get a room to join (room ID 1 - should exist)
    room_id = 38  # From our earlier test, this room exists
    
    # Test join request  
    print(f"\n2. Testing join request for room {room_id}...")
    join_response = requests.post(f"{BASE_URL}/chat/{room_id}/join/", headers=headers)
    
    print(f"Status: {join_response.status_code}")
    print(f"Response: {join_response.text}")
    
    if join_response.status_code in [200, 201]:
        print("✅ Join request successful!")
        result = join_response.json()
        if result.get('status') == 'approved':
            print("   → Automatically joined room")
        else:
            print("   → Join request sent, host will be notified")
    else:
        print(f"❌ Join request failed")

if __name__ == "__main__":
    test_join_request()