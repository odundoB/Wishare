#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

# Clear migration records for our apps
cursor = connection.cursor()
cursor.execute("DELETE FROM django_migrations WHERE app IN ('chat', 'events', 'notifications', 'resources', 'users')")
print("Migration records cleared successfully!")