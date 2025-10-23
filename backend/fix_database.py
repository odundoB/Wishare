#!/usr/bin/env python
"""
Database Schema Repair Script
This script fixes common Django migration issues by cleaning up corrupted schema state.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def fix_database_schema():
    cursor = connection.cursor()
    
    print("🔧 Starting database schema repair...")
    
    try:
        # 1. Fix django_content_type table if it's missing the 'name' column
        print("1. Checking django_content_type table structure...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'django_content_type' 
            AND column_name = 'name'
        """)
        
        if not cursor.fetchone():
            print("   Adding missing 'name' column to django_content_type...")
            cursor.execute("""
                ALTER TABLE django_content_type 
                ADD COLUMN name VARCHAR(100) DEFAULT 'unknown'
            """)
            print("   ✅ Added 'name' column")
        else:
            print("   ✅ 'name' column already exists")
            
        # 2. Clear migration state for problematic apps
        print("2. Clearing migration state...")
        cursor.execute("DELETE FROM django_migrations WHERE app IN ('contenttypes', 'auth', 'admin')")
        print("   ✅ Cleared Django core migration records")
        
        # 3. Mark initial migrations as applied
        print("3. Marking initial migrations as applied...")
        initial_migrations = [
            ('contenttypes', '0001_initial'),
            ('contenttypes', '0002_remove_content_type_name'),
            ('auth', '0001_initial'),
            ('auth', '0002_alter_permission_name_max_length'),
            ('auth', '0003_alter_user_email_max_length'),
            ('auth', '0004_alter_user_username_opts'),
            ('auth', '0005_alter_user_last_login_null'),
            ('auth', '0006_require_contenttypes_0002'),
            ('auth', '0007_alter_validators_add_error_messages'),
            ('auth', '0008_alter_user_username_max_length'),
            ('auth', '0009_alter_user_last_name_max_length'),
            ('auth', '0010_alter_group_name_max_length'),
            ('auth', '0011_update_proxy_permissions'),
            ('auth', '0012_alter_user_first_name_max_length'),
            ('admin', '0001_initial'),
            ('admin', '0002_logentry_remove_auto_add'),
            ('admin', '0003_logentry_add_action_flag_choices'),
        ]
        
        for app, migration in initial_migrations:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES (%s, %s, NOW()) 
                ON CONFLICT DO NOTHING
            """, [app, migration])
        
        print("   ✅ Marked core migrations as applied")
        
        print("🎉 Database schema repair completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during schema repair: {e}")
        return False

if __name__ == "__main__":
    success = fix_database_schema()
    if success:
        print("\n🚀 Now run: python manage.py migrate")
        print("This should complete without errors.")
    else:
        print("\n💥 Schema repair failed. Manual intervention may be needed.")