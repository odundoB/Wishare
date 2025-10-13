#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import and run the ASGI application
from core.asgi import application

if __name__ == "__main__":
    try:
        import uvicorn
        print("Starting ASGI server with Uvicorn...")
        uvicorn.run(application, host="127.0.0.1", port=8000, log_level="info")
    except ImportError:
        print("Uvicorn not found. Trying Daphne...")
        try:
            from daphne.cli import CommandLineInterface
            CommandLineInterface().run([
                '--bind', '127.0.0.1',
                '--port', '8000',
                'core.asgi:application'
            ])
        except ImportError:
            print("Neither Uvicorn nor Daphne found. Please install one of them.")
            sys.exit(1)
