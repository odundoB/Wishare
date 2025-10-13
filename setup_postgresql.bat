@echo off
echo ========================================
echo PostgreSQL Setup for WIOSHARE
echo ========================================
echo.

echo Please ensure PostgreSQL is installed and running.
echo If not installed, download from: https://www.postgresql.org/download/windows/
echo.

echo Step 1: Open PostgreSQL command line (psql) as administrator
echo Step 2: Run the following commands:
echo.
echo CREATE DATABASE wisharedb;
echo CREATE USER white WITH PASSWORD 'leakey001';
echo GRANT ALL PRIVILEGES ON DATABASE wisharedb TO white;
echo \c wisharedb
echo GRANT ALL ON SCHEMA public TO white;
echo GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO white;
echo GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO white;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO white;
echo ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO white;
echo ALTER USER white CREATEDB;
echo.

echo Step 3: After running the above commands, press any key to continue...
pause

echo.
echo Step 4: Testing database connection...
python manage.py check --database default

echo.
echo Step 5: Running migrations...
python manage.py migrate

echo.
echo ========================================
echo PostgreSQL setup completed!
echo ========================================
pause

