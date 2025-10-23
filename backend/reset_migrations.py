#!/usr/bin/env python
"""
Complete Django Migration Reset Script
This script completely resets the migration state and rebuilds it properly.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def complete_migration_reset():
    cursor = connection.cursor()
    
    print("🔧 Starting complete migration reset...")
    
    try:
        # 1. Clear ALL migration records
        print("1. Clearing all migration records...")
        cursor.execute("DELETE FROM django_migrations")
        print("   ✅ All migration records cleared")
        
        # 2. Mark all existing migrations as applied in correct order
        print("2. Rebuilding migration history in correct order...")
        
        # Core Django apps first (in dependency order)
        core_migrations = [
            # Contenttypes (base for everything)
            ('contenttypes', '0001_initial'),
            ('contenttypes', '0002_remove_content_type_name'),
            
            # Auth (depends on contenttypes)
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
            
            # Sessions
            ('sessions', '0001_initial'),
            
            # Admin (depends on auth and contenttypes)
            ('admin', '0001_initial'),
            ('admin', '0002_logentry_remove_auto_add'),
            ('admin', '0003_logentry_add_action_flag_choices'),
            
            # Token blacklist
            ('token_blacklist', '0001_initial'),
            ('token_blacklist', '0002_outstandingtoken_jti_hex'),
            ('token_blacklist', '0003_auto_20171017_2007'),
            ('token_blacklist', '0004_auto_20171017_2013'),
            ('token_blacklist', '0005_remove_outstandingtoken_jti'),
            ('token_blacklist', '0006_auto_20171017_2113'),
            ('token_blacklist', '0007_auto_20171017_2214'),
            ('token_blacklist', '0008_migrate_to_bigautofield'),
            ('token_blacklist', '0010_fix_migrate_to_bigautofield'),
            ('token_blacklist', '0011_linearizes_history'),
            ('token_blacklist', '0012_alter_outstandingtoken_user'),
        ]
        
        # Your custom apps (depend on users/auth)
        custom_migrations = [
            # Users first (extends auth)
            ('users', '0001_initial'),
            
            # Other apps that depend on users
            ('events', '0001_initial'),
            ('events', '0002_initial'),
            ('notifications', '0001_initial'),
            ('notifications', '0002_initial'),
            ('resources', '0001_initial'),
            ('resources', '0002_initial'),
            ('chat', '0001_initial'),
            ('chat', '0002_initial'),
        ]
        
        all_migrations = core_migrations + custom_migrations
        
        for app, migration in all_migrations:
            try:
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied) 
                    VALUES (%s, %s, NOW())
                """, [app, migration])
                print(f"   ✅ {app}.{migration}")
            except Exception as e:
                print(f"   ⚠️  {app}.{migration} - {e}")
        
        print("🎉 Migration reset completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error during migration reset: {e}")
        return False

if __name__ == "__main__":
    success = complete_migration_reset()
    if success:
        print("\n🚀 Migration state rebuilt successfully!")
        print("Your Django app should now work without migration errors.")
    else:
        print("\n💥 Migration reset failed. Check the error above.")