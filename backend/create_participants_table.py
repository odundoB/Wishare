#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from chat.models import Room

# Get the SQL to create the many-to-many table
cursor = connection.cursor()

# Create the many-to-many table manually
sql = """
CREATE TABLE chat_room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES chat_room(id) DEFERRABLE INITIALLY DEFERRED,
    user_id BIGINT NOT NULL REFERENCES users_user(id) DEFERRABLE INITIALLY DEFERRED,
    UNIQUE(room_id, user_id)
);

CREATE INDEX chat_room_participants_room_id_idx ON chat_room_participants(room_id);
CREATE INDEX chat_room_participants_user_id_idx ON chat_room_participants(user_id);
"""

try:
    cursor.execute(sql)
    print("Successfully created chat_room_participants table!")
except Exception as e:
    print(f"Error: {e}")