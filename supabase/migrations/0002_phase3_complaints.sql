-- ============================================================================
-- Phase 3: Complaints table, status history, RLS, and complaint image storage
-- ============================================================================
-- This migration turns the Phase 1 mock complaint UI into real, persisted data.
-- Apply with: supabase db reset   or   supabase migration up
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.service_area as enum ('hostel', 'mess');

create type public.complaint_status as enum (
  'reported',
  'assigned',
  'in_progress',
  'resolved',
  'reopened'
);

create type public.complaint_priority as enum ('low', 'medium', 'high', 'critical');

-- SECURITY NOTE: categories are a single flat enum so the column type stays
-- simple, but the allowed set is constrained per service_area by the
-- `complaints_category_matches_service_type` check below. A "taste" category on
-- a hostel complaint is therefore rejected by the database itself.
create type public.complaint_category as enum (
  -- hostel
  'water',
  'electricity',
  'internet',
  'cleaning',
  'room_maintenance',
  'furniture',
  'washroom',
  'security',
  'laundry',
  'common_area',
  -- mess
  'food_quality',
  'taste',
  'hygiene',
  'quantity',
  'menu',
  'timing',
  'variety',
  'cleanliness',
  'staff_service',
  -- either
  'other'
);

-- ---------------------------------------------------------------------------
-- Human readable reference numbers (CMP-0001, CMP-0002, ...)
-- ---------------------------------------------------------------------------
-- A sequence is used rather than the row count so references stay unique even
-- when rows are deleted.
create sequence public.complaint_reference_seq;

-- ---------------------------------------------------------------------------
-- Category must belong to the chosen service area
-- ---------------------------------------------------------------------------
create or replace function public.category_allowed(
  area public.service_area,
  category public.complaint_category
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case area
    when 'hostel' then category = any (array[
      'water', 'electricity', 'internet', 'cleaning', 'room_maintenance',
      'furniture', 'washroom', 'security', 'laundry', 'common_area', 'other'
    ]::public.complaint_category[])
    when 'mess' then category = any (array[
      'food_quality', 'taste', 'hygiene', 'quantity', 'menu', 'timing',
      'variety', 'cleanliness', 'staff_service', 'other'
    ]::public.complaint_category[])
  end;
$$;

-- ---------------------------------------------------------------------------
-- Complaints table
-- ---------------------------------------------------------------------------
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'CMP-' || lpad(nextval('public.complaint_reference_seq')::text, 4, '0')
  ),

  -- Owner. Always the authenticated student in Phase 3.
  user_id uuid not null references public.profiles(id) on delete cascade,

  service_type public.service_area not null,
  category public.complaint_category not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 20 and 2000),
  location text not null check (char_length(location) between 1 and 120),

  -- Storage object path inside the `complaint-images` bucket, not a public URL.
  image_path text,

  -- Lifecycle. Both are forced to their defaults on insert (see trigger below)
  -- and are only ever changed by the admin/staff workflows in later phases.
  status public.complaint_status not null default 'reported',
  priority public.complaint_priority not null default 'medium',

  -- Added now so the Phase 4/5 columns already exist; unused in Phase 3.
  assigned_staff_id uuid references public.profiles(id) on delete set null,
  resolution_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint complaints_category_matches_service_type
    check (public.category_allowed(service_type, category))
);

-- The primary student query is "my complaints, newest first", so user_id and
-- created_at are indexed together rather than separately (a standalone
-- user_id index would be redundant as the leftmost prefix of this one).
create index complaints_user_created_idx
  on public.complaints (user_id, created_at desc);

-- Supports the admin queue and staff worklist built in later phases.
create index complaints_status_created_idx
  on public.complaints (status, created_at desc);

-- Supports area and category filtering on the complaints list.
create index complaints_service_type_idx
  on public.complaints (service_type);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses the Phase 2 helper)
-- ---------------------------------------------------------------------------
create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Status history
-- ---------------------------------------------------------------------------
-- One row per status change. Phase 3 only ever writes the opening `reported`
-- row; the admin and staff workflows append to this same table later, so the
-- timeline is real data rather than a hardcoded illustration.
create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status public.complaint_status not null,
  note text not null default '',
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  created_at timestamptz not null default now()
);

-- Reading a timeline always starts with "everything for this complaint, oldest
-- first".
create index complaint_events_complaint_created_idx
  on public.complaint_events (complaint_id, created_at);

-- ---------------------------------------------------------------------------
-- Insert guard: force ownership and lifecycle defaults
-- ---------------------------------------------------------------------------
-- SECURITY CRITICAL.
-- RLS's `with check` alone would still let a student INSERT with somebody
-- else's user_id or with status = 'resolved'. This trigger runs after the RLS
-- check and rewrites those columns unconditionally, so a crafted request body
-- cannot forge them.
--
-- Calls made with the service_role key (or straight from the SQL editor) have
-- auth.uid() = null and keep full control of every column. That is how the
-- admin/staff phases, and the Phase 6 priority engine, will set these values.
create or replace function public.protect_complaint_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is not null then
    new.user_id  := caller;
    new.status   := 'reported';
    new.priority := 'medium';
  end if;

  return new;
end;
$$;

create trigger complaints_protect_on_insert
before insert on public.complaints
for each row execute function public.protect_complaint_on_insert();

-- ---------------------------------------------------------------------------
-- Opening timeline event
-- ---------------------------------------------------------------------------
-- Guarantees every complaint has a `reported` entry the moment it exists, so
-- the student timeline never has to guess what happened.
create or replace function public.log_complaint_opened()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.complaint_events (complaint_id, status, note, actor_id, actor_name)
  values (
    new.id,
    'reported',
    'Feedback submitted',
    new.user_id,
    coalesce(
      (select p.full_name from public.profiles p where p.id = new.user_id),
      'Student'
    )
  );

  return new;
end;
$$;

create trigger complaints_log_opened
after insert on public.complaints
for each row execute function public.log_complaint_opened();

-- ---------------------------------------------------------------------------
-- Row Level Security: complaints
-- ---------------------------------------------------------------------------
alter table public.complaints enable row level security;

-- SELECT: a student may read only their own complaints.
-- SECURITY CRITICAL: this is the actual protection for Test 7 (Student A opening
-- Student B's complaint). The application never sees rows it is not allowed to
-- read, so no amount of URL guessing can leak another student's report.
create policy "complaints_select_own" on public.complaints
for select to authenticated
using ( (select auth.uid()) = user_id );

-- INSERT: a student may file a complaint, but only for themselves.
-- The trigger above rewrites user_id regardless, so a forged user_id in the
-- request body still lands on the caller's own row.
create policy "complaints_insert_own" on public.complaints
for insert to authenticated
with check ( (select auth.uid()) = user_id );

-- SECURITY CRITICAL: there is deliberately NO student UPDATE policy and NO
-- student DELETE policy in Phase 3.
--   * Editing is out of scope, so students cannot edit anything.
--   * Without an UPDATE policy, status / priority / assigned_staff_id /
--     resolution_note are unreachable no matter what the client sends.
--   * Complaints are never deleted, so a student cannot erase the history that
--     the admin and staff phases will later act on.
-- Phase 4 (admin) and Phase 5 (staff) add their own policies on top of this.

-- Forward-looking policies for the later phases. They grant no capability to a
-- student, and no UI calls them yet, but having them here means Phase 4 and
-- Phase 5 need no schema migration.
create policy "complaints_select_admin" on public.complaints
for select to authenticated
using ( (select public.is_admin((select auth.uid()))) );

create policy "complaints_update_admin" on public.complaints
for update to authenticated
using ( (select public.is_admin((select auth.uid()))) )
with check ( (select public.is_admin((select auth.uid()))) );

create policy "complaints_select_staff" on public.complaints
for select to authenticated
using (
  (select public.is_admin((select auth.uid())))
  or (assigned_staff_id is not null and assigned_staff_id = (select auth.uid()))
);

create policy "complaints_update_staff" on public.complaints
for update to authenticated
using (
  assigned_staff_id is not null and assigned_staff_id = (select auth.uid())
)
with check (
  assigned_staff_id is not null and assigned_staff_id = (select auth.uid())
);

-- Table privileges.
-- A policy only filters rows a role is already allowed to touch, so the grants
-- have to be here for the policies above to mean anything. Supabase grants these
-- to `authenticated` via project-level default privileges; stating them
-- explicitly keeps this migration self-contained and reviewable.
grant usage, select on sequence public.complaint_reference_seq to authenticated;
grant select, insert on public.complaints to authenticated;
grant select on public.complaint_events to authenticated;

-- Column-level privilege for the admin/staff update paths: ownership and the
-- opening reference can never be rewritten after creation.
revoke update on public.complaints from authenticated;
grant update (status, priority, assigned_staff_id, resolution_note, image_path)
  on public.complaints to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: complaint_events
-- ---------------------------------------------------------------------------
alter table public.complaint_events enable row level security;

-- A student may read the timeline of their own complaints and nothing else.
create policy "complaint_events_select_own" on public.complaint_events
for select to authenticated
using (
  exists (
    select 1
    from public.complaints c
    where c.id = complaint_id and c.user_id = (select auth.uid())
  )
);

-- Students never write events. Only the `log_complaint_opened` trigger does,
-- and it is SECURITY DEFINER so it bypasses RLS.
create policy "complaint_events_select_admin" on public.complaint_events
for select to authenticated
using ( (select public.is_admin((select auth.uid()))) );

-- ---------------------------------------------------------------------------
-- Attaching a photo to a complaint
-- ---------------------------------------------------------------------------
-- SECURITY: a student has no UPDATE policy on `complaints`, which is exactly
-- what keeps status, priority and assignment out of reach. It also blocks the
-- one write a student legitimately needs: linking the photo they just uploaded
-- to the complaint they just created.
--
-- This function is the narrow exception. It is SECURITY DEFINER so RLS does not
-- block it, but it can only touch `image_path`, only on a row the caller owns,
-- and only with a path inside the caller's own storage namespace. It cannot be
-- used to change status, priority or assignment.
create or replace function public.attach_complaint_image(
  target_complaint_id uuid,
  target_image_path text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The path must live in the caller's own folder, matching the storage RLS
  -- policies. Rejects anything like complaints/<someone-else>/...
  if target_image_path !~ ('^complaints/' || (select auth.uid())::text || '/') then
    return false;
  end if;

  update public.complaints
     set image_path = target_image_path
   where id = target_complaint_id
     and user_id = (select auth.uid());

  return found;
end;
$$;

revoke all on function public.attach_complaint_image(uuid, text) from public;
grant execute on function public.attach_complaint_image(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private complaint image bucket
-- ---------------------------------------------------------------------------
-- The bucket is PRIVATE (public = false). Images are never served from a
-- guessable URL; the detail page mints a short-lived signed URL instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-images',
  'complaint-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Object paths are always: complaints/{user_id}/{complaint_id}/{filename}
-- storage.foldername() returns [ 'complaints', '<user_id>', '<complaint_id>' ]
-- so position 2 must be the caller's own id.
--
-- INSERT: a student may upload only into their own namespace.
create policy "complaint_images_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = 'complaints'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- SELECT: a student may read only objects under their own namespace. Because
-- the bucket is private this policy is what authorises signed-URL downloads.
create policy "complaint_images_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- DELETE: limited to the caller's own namespace so a failed submission can be
-- cleaned up. A student can never delete another student's evidence.
create policy "complaint_images_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- ---------------------------------------------------------------------------
-- Notes for future phases
-- ---------------------------------------------------------------------------
-- * Phase 4 (admin): the `complaints_*_admin` policies already exist. Assignment
--   updates assigned_staff_id, priority, status and appends a complaint_events
--   row in the same transaction.
-- * Phase 5 (staff): the `complaints_*_staff` policies already exist and are
--   scoped to rows assigned to that staff member.
-- * Phase 6 (priority): replace the hardcoded 'medium' default with a
--   service-role classification call. The trigger leaves service_role writes
--   untouched, so no policy change is needed.
-- * Phase 7 (verification): add `resolved_at` / `verified_at` columns and let
--   the owning student update ONLY status, guarded by status = 'resolved'.
-- ============================================================================