#!/usr/bin/env python
"""
Working ASGI server startup script
"""
import os
import sys
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import the ASGI application
from core.asgi import application

if __name__ == "__main__":
    print("Starting ASGI server with Daphne...")
    print("This server supports both HTTP and WebSocket connections")
    print("Server will be available at: http://127.0.0.1:8000")
    print("WebSocket endpoint: ws://127.0.0.1:8000/ws/notifications/")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        from daphne.cli import CommandLineInterface
        CommandLineInterface().run([
            '--bind', '127.0.0.1',
            '--port', '8000',
            'core.asgi:application'
        ])
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Trying alternative method...")
        
        # Alternative: Use uvicorn if available
        try:
            import uvicorn
            uvicorn.run(application, host="127.0.0.1", port=8000, log_level="info")
        except ImportError:
            print("Neither Daphne nor Uvicorn available. Please install one of them.")
            sys.exit(1)
