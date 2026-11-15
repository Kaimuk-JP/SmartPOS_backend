-- roles ที่ PostgREST/supabase-js ใช้
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator_pw';
GRANT anon, authenticated, service_role TO authenticator;

-- stub ของ storage schema เพื่อให้ database_master_setup.sql รันผ่านได้
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text, public boolean);
