#!/bin/zsh
# Local verification harness for the Phase 3 migrations.
# Creates minimal stand-ins for the Supabase-managed schemas, replays both
# migrations in order, then exercises the security guarantees.

set -e
PGBIN=/opt/homebrew/opt/postgresql@16/bin
ROOT="/Users/jyotishkumar/Desktop/Hostel & Mess Service Management Platform"
cd "$ROOT"

run() { $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -v ON_ERROR_STOP=1 "$@"; }
q()   { $PGBIN/psql -h /tmp/kilo -p 55432 -U postgres -At -c "$1"; }

echo "### 1. Supabase schema stubs"
run -q <<'SQL'
-- Supabase provisions these three roles; the policies grant to them by name.
create role authenticated;
create role anon;
create role service_role;

create schema auth;
create schema storage;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

create function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text not null,
  owner uuid
);

create function storage.foldername(name text) returns text[]
  language sql immutable as $$
    select string_to_array(regexp_replace(name, '/[^/]*$', ''), '/')
  $$;

-- Real Supabase enables RLS on storage.objects; without this the storage
-- policies created by migration 0002 would be inert and the tests meaningless.
alter table storage.objects enable row level security;

-- Supabase grants schema USAGE and default table privileges to these roles at
-- the project level. Reproduced here so RLS is the only thing being tested.
grant usage on schema public, storage, auth to authenticated, anon, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
SQL

echo "### 2. Replay migration 0001"
run -q -f supabase/migrations/0001_phase2_profiles.sql
echo "    0001 ok"

echo "### 3. Replay migration 0002"
run -q -f supabase/migrations/0002_phase3_complaints.sql
echo "    0002 ok"