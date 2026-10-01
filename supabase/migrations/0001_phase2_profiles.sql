-- ============================================================================
-- Phase 2: Profiles table, user roles, automatic profile creation, RLS
-- ============================================================================
-- This migration creates the core user profile infrastructure.
-- Apply with: supabase db reset   or   supabase migration up
-- ============================================================================

-- ---------------------------------------------------------------------------
-- User role enum
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'admin', 'staff');

-- ---------------------------------------------------------------------------
-- Profiles table
-- ---------------------------------------------------------------------------
-- The id references auth.users(id). Supabase Auth is the source of truth for
-- authentication. This table stores only application-level user information.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful index for role-based queries
create index profiles_role_idx on public.profiles(role);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Automatic profile creation on signup
-- ---------------------------------------------------------------------------
-- SECURITY CRITICAL: The role is HARDCODED to 'student'.
-- The trigger MUST NOT read role from raw_user_meta_data or any user input.
-- Admin/staff roles are assigned exclusively through controlled database
-- operations (service-role key / SQL editor) by an existing admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.email, ''),
    'student'  -- HARDCODED: no self-promotion possible via signup
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Helper: is the given user an admin?
-- SECURITY DEFINER + stable: runs as postgres owner, bypasses RLS.
-- This is the standard Supabase pattern to avoid RLS recursion.
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = user_id and p.role = 'admin');
$$;

-- Policy 1: Users can read their own profile.
create policy "profiles_select_own" on public.profiles
for select to authenticated
using ( (select auth.uid()) = id );

-- Policy 2: Admins can read all profiles (needed for staff directory, etc.).
create policy "profiles_select_admin" on public.profiles
for select to authenticated
using ( (select public.is_admin((select auth.uid()))) );

-- Policy 3: Users can update ONLY their own full_name.
-- Column-level GRANT is the primary enforcement; the policy restricts rows.
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- Column-level privilege: only full_name is updatable by authenticated users.
-- This prevents users from changing their own role, email, or id.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Notes for future phases
-- ---------------------------------------------------------------------------
-- * Complaints table will reference profiles(id) for student_id, assigned_staff_id
-- * Admin actions (role changes, staff assignments) use the service_role key
--   via Supabase dashboard / SQL editor / Edge Functions
-- * The 'is_admin' helper can be reused in other table policies
-- ============================================================================