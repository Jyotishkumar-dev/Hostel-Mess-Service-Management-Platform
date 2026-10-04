-- ============================================================================
-- Phase 4 + 5: staff resolution workflow, assignment, analytics readiness
-- ============================================================================
-- 0003 only migrates forwards. It never rewrites columns that students have
-- already filled in Phase 3, so existing feedback survives unchanged.
-- Apply with: supabase db reset   or   supabase migration up
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Resolution columns
-- ---------------------------------------------------------------------------
-- Phase 3 reserved `resolution_note`; these three complete the set so the
-- Phase 5 resolution form can record *what* and *who* and *when*.
alter table public.complaints
  add column if not exists resolution_image_path text,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Staff helper
-- ---------------------------------------------------------------------------
-- Mirrors `is_admin` (Phase 2). Used by the assignment function so an admin can
-- validate a staff id without trusting a role string from the client.
create or replace function public.is_staff(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = user_id and p.role = 'staff');
$$;

-- ---------------------------------------------------------------------------
-- Index for the staff worklist
-- ---------------------------------------------------------------------------
-- Staff load "my assigned issues", newest first. `assigned_staff_id` is nullable,
-- so the partial index keeps it small and serves exactly that query.
create index complaints_assigned_created_idx
  on public.complaints (assigned_staff_id, created_at desc)
  where assigned_staff_id is not null;

-- ---------------------------------------------------------------------------
-- Assigning a complaint to staff
-- ---------------------------------------------------------------------------
-- SECURITY CRITICAL. This is the only write path that changes `assigned_staff_id`:
-- it is SECURITY DEFINER so it bypasses RLS (a direct `update()` on the column
-- would succeed for any authenticated role that held an UPDATE policy, with no
-- audit trail and no transition rule).
--
-- Admin-only: `p_staff_id` must be a profile whose role is `staff`.
create or replace function public.assign_complaint(
  p_complaint_id uuid,
  p_staff_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Authorisation: only an admin may assign.
  if not (select public.is_admin((select auth.uid()))) then
    return false;
  end if;

  -- The target must actually be a staff member.
  if not (select public.is_staff(p_staff_id)) then
    return false;
  end if;

  update public.complaints
     set assigned_staff_id = p_staff_id,
         status = 'assigned'
   where id = p_complaint_id;

  -- Audit trail: log the hand-off so the timeline shows who got it.
  if found then
    insert into public.complaint_events (complaint_id, status, note, actor_id, actor_name)
    values (
      p_complaint_id,
      'assigned',
      'Assigned to ' || coalesce(
        (select p.full_name from public.profiles p where p.id = p_staff_id),
        p_staff_id::text
      ),
      (select auth.uid()),
      coalesce(
        (select p.full_name from public.profiles p where p.id = (select auth.uid())),
        'Admin'
      )
    );
    return true;
  end if;

  return false;
end;
$$;

revoke all on function public.assign_complaint(uuid, uuid) from public;
grant execute on function public.assign_complaint(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Status transitions
-- ---------------------------------------------------------------------------
-- The single, audited state machine for moving a complaint forward. Used by the
-- staff workflow (Assigned -> In Progress -> Resolved) and open to an admin who
-- needs to push one of their reviews.
--
-- Returns false on any authorisation or transition failure; the caller treats a
-- false result as "operation rejected" and surfaces a friendly error.
create or replace function public.advance_complaint(
  p_complaint_id uuid,
  p_new_status public.complaint_status,
  p_note text default '',
  p_resolution_image_path text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  current_status public.complaint_status;
  allowed boolean;
begin
  -- Authorisation: an admin, or the staff the complaint is assigned to.
  if not ((select public.is_admin(caller)) or
          (select assigned_staff_id = caller from public.complaints where id = p_complaint_id)) then
    return false;
  end if;

  select status into current_status
  from public.complaints
  where id = p_complaint_id
  for update;                          -- lock the row against concurrent transitions

  if not found then
    return false;                     -- unknown complaint
  end if;

  -- The transition graph. Anything not listed here is rejected.
  allowed :=
      (current_status = 'assigned' and p_new_status = 'in_progress')
   or (current_status = 'in_progress' and p_new_status = 'resolved')
   or (current_status = 'reported' and p_new_status = 'in_progress')
   or (current_status = 'reopened' and p_new_status = 'in_progress');

  if not allowed then
    return false;
  end if;

  update public.complaints
     set status = p_new_status,
         resolution_note = case when p_new_status = 'resolved' then p_note else resolution_note end,
         resolution_image_path = case when p_new_status = 'resolved' then p_resolution_image_path else resolution_image_path end,
         resolved_at = case when p_new_status = 'resolved' then now() else resolved_at end,
         resolved_by = case when p_new_status = 'resolved' then caller else resolved_by end
   where id = p_complaint_id;

  insert into public.complaint_events (complaint_id, status, note, actor_id, actor_name)
  values (
    p_complaint_id,
    p_new_status,
    p_note,
    caller,
    coalesce(
      (select full_name from public.profiles where id = caller),
      'Staff'
    )
  );

  return true;
end;
$$;

revoke all on function public.advance_complaint(uuid, public.complaint_status, text, text) from public;
grant execute on function public.advance_complaint(uuid, public.complaint_status, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Reopen — prepares the Phase 7 student verification step
-- ---------------------------------------------------------------------------
-- When a student reports "still broken", the status flips to `reopened` and the
-- staff workflow picks it back up. Admin-only for now: there is no student
-- action yet, and the transition back into the flow lives here so Phase 7 only
-- has to expose it.
create or replace function public.reopen_complaint(p_complaint_id uuid, p_note text default '')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
begin
  -- Authorisation: an admin, or the staff the complaint is assigned to.
  if not ((select public.is_admin(caller)) or
          (select assigned_staff_id = caller from public.complaints where id = p_complaint_id)) then
    return false;
  end if;

  -- Only a resolved complaint can be reopened.
  if (select status from public.complaints where id = p_complaint_id) <> 'resolved' then
    return false;
  end if;

  update public.complaints
     set status = 'reopened'
   where id = p_complaint_id;

  insert into public.complaint_events (complaint_id, status, note, actor_id, actor_name)
  values (
    p_complaint_id,
    'reopened',
    p_note,
    caller,
    coalesce(
      (select full_name from public.profiles where id = caller),
      'Admin'
    )
  );

  return true;
end;
$$;

revoke all on function public.reopen_complaint(uuid, text) from public;
grant execute on function public.reopen_complaint(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Column-level privileges for the Phase 4 / 5 writes
-- ---------------------------------------------------------------------------
-- The transition graph and assignment are enforced by the SECURITY DEFINER
-- functions above, not by row/column privileges, so the broad UPDATE grant from
-- Phase 3 is tightened here: a direct `update` may only change `priority` (which
-- the admin sets from the detail form) and the student's own `image_path`
-- (already handled by `attach_complaint_image`). Everything else — status,
-- assignment, resolution, who-resolved — is reachable only through a function.
revoke update on public.complaints from authenticated;
grant update (priority, image_path) on public.complaints to authenticated;

-- Resolution images share the bucket but a separate path namespace so the
-- student-evidence policies never apply to them, and staff only ever touch
-- their own.
--
-- Path: resolution/{staff_id}/{complaint_id}/{file}

create policy "complaint_images_insert_resolution" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = 'resolution'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "complaint_images_select_resolution" on storage.objects
for select to authenticated
using (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = 'resolution'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "complaint_images_delete_resolution" on storage.objects
for delete to authenticated
using (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = 'resolution'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

-- ---------------------------------------------------------------------------
-- Notes for future phases
-- ---------------------------------------------------------------------------
-- * Phase 6 (priority): replace the 'medium' default in `protect_complaint_on_insert`
--   with a call to a classification function. No schema change needed.
-- * Phase 7 (verification): add a `student_confirmed` column and let the owning
--   student flip `reopened -> reported` or call `reopen_complaint()` themselves,
--   gated by a student policy added here.
-- * Phase 8 (analytics): the aggregate queries below can be added as
--   `pg_timestamptz`/date_bucket views without touching the tables.
-- ============================================================================
