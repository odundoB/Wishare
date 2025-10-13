@echo off
echo Starting WIOSHARE Backend Server...
cd /d C:\Users\user\Desktop\WIOSHARE\backend
call venv\Scripts\activate.bat
set DJANGO_SETTINGS_MODULE=core.settings
python manage.py runserver 8001
pause
