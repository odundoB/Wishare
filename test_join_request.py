#!/usr/bin/env python3
"""
Test script to test join request functionality and identify errors.
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def login_and_get_token(username, password):
    """Login and get JWT token"""
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/users/login/", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get('access')
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def get_rooms(token):
    """Get rooms using the token"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/chat/", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Get rooms failed: {response.status_code} - {response.text}")
        return None

def join_room(token, room_id):
    """Test join room request"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(f"{BASE_URL}/chat/{room_id}/join/", headers=headers)
    print(f"Join request response ({response.status_code}): {response.text}")
    return response

def main():
    print("🧪 Testing Join Room Request Functionality")
    print("=" * 60)
    
    # Login as student
    print("\n1. Logging in as student...")
    token = login_and_get_token("student1", "password123")
    
    if not token:
        print("❌ Failed to get token for student")
        return
        
    print(f"✅ Got token for student1")
    
    # Get rooms
    print("\n2. Getting available rooms...")
    rooms = get_rooms(token)
    
    if not rooms or not isinstance(rooms, dict) or 'results' not in rooms:
        print("❌ Failed to get rooms")
        return
        
    available_rooms = rooms['results']
    print(f"✅ Found {len(available_rooms)} rooms")
    
    # Find a room that the student is not already in
    target_room = None
    for room in available_rooms[:3]:  # Check first 3 rooms
        print(f"   - {room['name']} (Host: {room['host']['username']}, Auto-approve: {room.get('auto_approve', False)})")
        # Check if student is not already a participant
        student_in_room = any(p['username'] == 'student1' for p in room.get('participants', []))
        if not student_in_room:
            target_room = room
            break
    
    if not target_room:
        print("❌ No available rooms to join (student already in all rooms or no rooms found)")
        return
    
    print(f"\n3. Testing join request for room: '{target_room['name']}'")
    print(f"   Room ID: {target_room['id']}")
    print(f"   Host: {target_room['host']['username']}")
    print(f"   Auto-approve: {target_room.get('auto_approve', False)}")
    
    # Test join request
    response = join_room(token, target_room['id'])
    
    print(f"\n4. Join request result:")
    if response.status_code in [200, 201]:
        print("✅ Join request successful!")
        result = response.json()
        if result.get('status') == 'approved':
            print("   → Automatically approved and joined")
        elif result.get('status') == 'pending':
            print("   → Request sent, waiting for host approval")
            print("   → Host should receive a notification")
    else:
        print(f"❌ Join request failed: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Error: {error_data}")
        except:
            print(f"   Raw error: {response.text}")

if __name__ == "__main__":
    main()