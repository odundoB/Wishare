#!/usr/bin/env python3
"""
Simple API test to verify the join request endpoint works after database fix.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_api_join_request():
    """Test the join request API endpoint"""
    print("=== Testing Join Request API ===")
    
    # First, let's login as a student
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    print("1. Logging in as student...")
    login_response = requests.post(f"{BASE_URL}/users/login/", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
        return False
    
    token = login_response.json().get('access')
    print("✅ Login successful")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get available rooms
    print("2. Getting available rooms...")
    rooms_response = requests.get(f"{BASE_URL}/chat/rooms/", headers=headers)
    
    if rooms_response.status_code != 200:
        print(f"❌ Failed to get rooms: {rooms_response.status_code}")
        return False
    
    rooms_data = rooms_response.json()
    print(f"✅ Found {rooms_data.get('count', 0)} rooms")
    
    # Find a room to join
    if not rooms_data.get('results'):
        print("❌ No rooms available to test")
        return False
    
    test_room = rooms_data['results'][0]
    room_id = test_room['id']
    print(f"3. Testing join request for room: {test_room['name']} (ID: {room_id})")
    
    # Send join request
    join_response = requests.post(f"{BASE_URL}/chat/{room_id}/join/", headers=headers)
    
    print(f"4. Join request response: {join_response.status_code}")
    print(f"   Response body: {join_response.text}")
    
    if join_response.status_code == 201:
        print("✅ Join request successful!")
        return True
    elif join_response.status_code == 400:
        response_data = join_response.json()
        if "already requested" in response_data.get('error', '').lower():
            print("✅ Join request already exists (expected behavior)")
            return True
        else:
            print(f"❌ Bad request: {response_data}")
            return False
    else:
        print(f"❌ Join request failed: {join_response.status_code}")
        return False

if __name__ == "__main__":
    print("Testing Join Request API Endpoint")
    print("=" * 40)
    
    # Wait a moment for server to start
    time.sleep(2)
    
    try:
        success = test_api_join_request()
        print("\n" + "=" * 40)
        if success:
            print("🎉 API JOIN REQUEST TEST PASSED!")
        else:
            print("❌ API join request test failed")
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")