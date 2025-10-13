@echo off
echo Starting ASGI server for WebSocket support...
cd /d "%~dp0"
set DJANGO_SETTINGS_MODULE=core.settings
python -m daphne -b 127.0.0.1 -p 8000 core.asgi:application
pause
