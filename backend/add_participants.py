#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from notifications.models import ChatRoom, RoomParticipant
from users.models import User

# Add users as participants to the first room for testing
room = ChatRoom.objects.first()
users = User.objects.all()

if room:
    for user in users:
        participant, created = RoomParticipant.objects.get_or_create(
            room=room, 
            user=user, 
            defaults={'is_active': True}
        )
        if created:
            print(f'Added {user.username} to {room.name}')
        else:
            print(f'{user.username} already in {room.name}')
    
    print(f'Total participants in {room.name}: {room.participant_count}')
else:
    print('No rooms found')