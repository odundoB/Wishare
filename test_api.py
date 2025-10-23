#!/usr/bin/env python3
"""
Test script to check the chat API and see if rooms are being returned correctly.
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

def test_user_rooms(username, password, role_name):
    print(f"\n=== Testing {role_name} ({username}) ===")
    
    # Login
    token = login_and_get_token(username, password)
    if not token:
        print(f"❌ Failed to login as {username}")
        return False
    
    print(f"✅ Got token for {username}")
    
    # Get rooms
    rooms = get_rooms(token)
    if rooms is None:
        print(f"❌ Failed to get rooms for {username}")
        return False
        
    if isinstance(rooms, dict) and 'results' in rooms:
        results = rooms['results']
        print(f"✅ {username} can see {len(results)} rooms (total: {rooms['count']}):")
        for i, room in enumerate(results[:3], 1):  # Show first 3 rooms
            print(f"   {i}. {room['name']} (Host: {room['host']['username']}, Active: {room['is_active']})")
        return True
    else:
        print(f"❌ Unexpected room data format for {username}")
        return False

def main():
    print("🧪 Testing Chat API - Room Visibility for All Users")
    print("=" * 60)
    
    # Test both teacher and student
    teacher_success = test_user_rooms("teacher", "password123", "Teacher")
    student_success = test_user_rooms("student1", "password123", "Student")
    
    print("\n" + "=" * 60)
    print("📋 SUMMARY:")
    print(f"   Teacher can see rooms: {'✅ YES' if teacher_success else '❌ NO'}")
    print(f"   Student can see rooms: {'✅ YES' if student_success else '❌ NO'}")
    
    if teacher_success and student_success:
        print("🎉 SUCCESS: Both teachers and students can see created rooms!")
        print("   The frontend should now display all rooms for both user types.")
    else:
        print("❌ ISSUE: Some users cannot see rooms - check authentication or API.")

if __name__ == "__main__":
    main()