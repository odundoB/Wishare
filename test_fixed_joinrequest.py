#!/usr/bin/env python3
"""
Test script to verify join request functionality after database fix.
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from chat.models import JoinRequest, Room
from users.models import User
from notifications.models import Notification

def test_join_request_creation():
    """Test that JoinRequest can be created successfully"""
    print("=== Testing JoinRequest Creation ===")
    
    # Get first room and a different user
    room = Room.objects.first()
    users = User.objects.all()
    
    if not room:
        print("❌ No rooms found in database")
        return False
        
    if len(users) < 2:
        print("❌ Need at least 2 users in database")
        return False
    
    # Get a user who is not the host
    requester = None
    for user in users:
        if user != room.host:
            requester = user
            break
    
    if not requester:
        print("❌ Could not find a non-host user")
        return False
    
    print(f"Room: {room.name} (Host: {room.host})")
    print(f"Requester: {requester}")
    
    try:
        # Create join request
        join_request = JoinRequest.objects.create(
            room=room,
            requester=requester,
            status='pending'
        )
        print(f"✅ JoinRequest created successfully: {join_request}")
        
        # Test that it can be retrieved
        retrieved = JoinRequest.objects.get(id=join_request.id)
        print(f"✅ JoinRequest retrieved: {retrieved}")
        
        # Clean up
        join_request.delete()
        print("✅ JoinRequest cleaned up")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating JoinRequest: {e}")
        return False

def test_duplicate_join_request():
    """Test that duplicate join requests are prevented"""
    print("\n=== Testing Duplicate Prevention ===")
    
    room = Room.objects.first()
    users = User.objects.all()
    requester = None
    for user in users:
        if user != room.host:
            requester = user
            break
    
    if not room or not requester:
        print("❌ Missing room or requester")
        return False
    
    try:
        # Create first request
        jr1 = JoinRequest.objects.create(room=room, requester=requester)
        print(f"✅ First request created: {jr1}")
        
        # Try to create duplicate
        try:
            jr2 = JoinRequest.objects.create(room=room, requester=requester)
            print("❌ Duplicate request should have failed!")
            jr2.delete()
            jr1.delete()
            return False
        except Exception as e:
            print(f"✅ Duplicate correctly prevented: {e}")
            jr1.delete()
            return True
            
    except Exception as e:
        print(f"❌ Error in duplicate test: {e}")
        return False

def test_notification_creation():
    """Test that notifications are created properly"""
    print("\n=== Testing Notification Creation ===")
    
    # Import here to avoid circular imports
    from notifications.utils import NotificationManager
    
    room = Room.objects.first()
    users = User.objects.all()
    requester = None
    for user in users:
        if user != room.host:
            requester = user
            break
    
    if not room or not requester:
        print("❌ Missing room or requester")
        return False
    
    try:
        # Create join request
        join_request = JoinRequest.objects.create(room=room, requester=requester)
        
        # Create notification
        NotificationManager.notify_chat_join_request(room, requester)
        
        # Check if notification was created
        notification = Notification.objects.filter(
            recipient=room.host,
            notification_type='chat'
        ).first()
        
        if notification:
            print(f"✅ Notification created: {notification}")
            notification.delete()
            join_request.delete()
            return True
        else:
            print("❌ No notification found")
            join_request.delete()
            return False
            
    except Exception as e:
        print(f"❌ Error testing notifications: {e}")
        return False

if __name__ == "__main__":
    print("Testing Join Request System After Database Fix")
    print("=" * 50)
    
    # Run tests
    test1 = test_join_request_creation()
    test2 = test_duplicate_join_request()
    test3 = test_notification_creation()
    
    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    print(f"JoinRequest Creation: {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"Duplicate Prevention: {'✅ PASS' if test2 else '❌ FAIL'}")
    print(f"Notification Creation: {'✅ PASS' if test3 else '❌ FAIL'}")
    
    if all([test1, test2, test3]):
        print("\n🎉 ALL TESTS PASSED! Join Request system is working!")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")