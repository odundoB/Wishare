-- PostgreSQL Setup Script for WIOSHARE
-- Run this script as a PostgreSQL superuser (postgres)

-- Create the database
CREATE DATABASE wishare_db;

-- Create the user
CREATE USER white WITH PASSWORD 'leakey001';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE wishare_db TO white;

-- Connect to the database and grant schema privileges
\c wishare_db;

-- Grant all privileges on the public schema
GRANT ALL ON SCHEMA public TO white;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO white;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO white;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO white;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO white;

-- Verify the setup
\du white
\l wishare_db