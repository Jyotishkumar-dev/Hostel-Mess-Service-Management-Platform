-- ============================================================================
-- Phase 7: Student resolution verification + feedback loop
-- ============================================================================
-- Adds:
--   * `verified` to the complaint_status enum
--   * verification fields to complaints
--   * resolution feedback fields to complaints
--   * complaint_status_history table for full auditability
--   * SECURITY DEFINER functions for student verification/reopen
--   * RLS policies for the new fields
--
-- This closes the loop: staff marks resolved → student verifies → confirmed
-- or rejected (reopened).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extend complaint_status enum
-- ---------------------------------------------------------------------------
alter type public.complaint_status add value 'verified';

-- ---------------------------------------------------------------------------
-- Verification + feedback columns on complaints
-- ---------------------------------------------------------------------------
alter table public.complaints
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists reopen_reason text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by uuid references public.profiles(id) on delete set null,
  add column if not exists resolution_rating integer check (resolution_rating >= 1 and resolution_rating <= 5),
  add column if not exists resolution_feedback text check (char_length(resolution_feedback) <= 500);

-- ---------------------------------------------------------------------------
-- Complaint status history (for full auditability across reopen cycles)
-- ---------------------------------------------------------------------------
create table if not exists public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  status public.complaint_status not null,
  note text not null default '',
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists complaint_status_history_complaint_created_idx
  on public.complaint_status_history (complaint_id, created_at);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Student confirms resolution: resolved + pending → verified
create or replace function public.student_verify_resolution(
  p_complaint_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  current_status public.complaint_status;
  current_verification text;
begin
  -- Must be the owner
  select status, verification_status into current_status, current_verification
  from public.complaints
  where id = p_complaint_id;

  if not found then
    return false;
  end if;

  if (select user_id from public.complaints where id = p_complaint_id) != caller then
    return false;
  end if;

  if current_status != 'resolved' or current_verification != 'pending' then
    return false;
  end if;

  update public.complaints
     set status = 'verified',
         verification_status = 'confirmed',
         verified_at = now(),
         verified_by = caller
   where id = p_complaint_id;

  insert into public.complaint_status_history (complaint_id, status, note, actor_id, actor_name)
  values (
    p_complaint_id,
    'verified',
    'Student confirmed the resolution',
    caller,
    coalesce(
      (select p.full_name from public.profiles p where p.id = caller),
      'Student'
    )
  );

  return found;
end;
$$;

revoke all on function public.student_verify_resolution(uuid) from public;
grant execute on function public.student_verify_resolution(uuid) to authenticated;

-- Student rejects resolution: resolved + pending → reopened
create or replace function public.student_reject_resolution(
  p_complaint_id uuid,
  p_reopen_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
  current_status public.complaint_status;
  current_verification text;
begin
  if p_reopen_reason is null or char_length(trim(p_reopen_reason)) < 10 then
    return false;
  end if;

  select status, verification_status into current_status, current_verification
  from public.complaints
  where id = p_complaint_id;

  if not found then
    return false;
  end if;

  if (select user_id from public.complaints where id = p_complaint_id) != caller then
    return false;
  end if;

  if current_status != 'resolved' or current_verification != 'pending' then
    return false;
  end if;

  update public.complaints
     set status = 'reopened',
         verification_status = 'rejected',
         reopen_reason = trim(p_reopen_reason),
         reopened_at = now(),
         reopened_by = caller
   where id = p_complaint_id;

  insert into public.complaint_status_history (complaint_id, status, note, actor_id, actor_name)
  values (
    p_complaint_id,
    'reopened',
    trim(p_reopen_reason),
    caller,
    coalesce(
      (select p.full_name from public.profiles p where p.id = caller),
      'Student'
    )
  );

  return found;
end;
$$;

revoke all on function public.student_reject_resolution(uuid, text) from public;
grant execute on function public.student_reject_resolution(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.complaint_status_history enable row level security;

create policy "complaint_status_history_select_admin" on public.complaint_status_history
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "complaint_status_history_select_own" on public.complaint_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.user_id = (select auth.uid())
    )
  );

create policy "complaint_status_history_select_staff_assigned" on public.complaint_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.assigned_staff_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert on public.complaint_status_history to authenticated;
grant usage on sequence public.complaint_reference_seq to authenticated;

-- ============================================================================
-- Notes for future phases
-- ============================================================================
-- * Phase 8 (analytics): aggregate resolution_rating, reopen counts, and
--   verification funnel from complaint_status_history.
-- ============================================================================
