-- ============================================================================
-- Phase 6: AI smart feedback processing
-- ============================================================================
-- Adds an AI analysis table (1:1 with complaints) that stores Gemini
-- suggestions separately from admin-confirmed values, plus an admin-only
-- SECURITY DEFINER function for confirming an AI suggestion onto the
-- complaint row.
--
-- The AI API key and processing are handled in the Next.js app layer
-- (lib/ai); this migration only owns the storage + permission model.
-- Apply with: supabase migration up
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Processing status
-- ---------------------------------------------------------------------------
create type public.ai_processing_status as enum
  ('pending', 'processing', 'completed', 'failed');

-- ---------------------------------------------------------------------------
-- AI analysis table (1:1 with complaints)
-- ---------------------------------------------------------------------------
-- Separate from `complaints` so AI suggestions are never confused with the
-- admin-confirmed `category`/`priority` that the rest of the app already owns.
create table public.complaint_ai_analysis (
  complaint_id        uuid primary key references public.complaints(id) on delete cascade,
  ai_category         text,
  ai_priority         public.complaint_priority,
  ai_summary          text,
  ai_department       text,
  ai_duplicate_candidate boolean default false,
  ai_duplicate_complaint_id uuid references public.complaints(id) on delete set null,
  ai_duplicate_reason text,
  ai_confidence       double precision check (ai_confidence >= 0 and ai_confidence <= 1),
  ai_processing_status public.ai_processing_status default 'pending',
  ai_processed_at     timestamptz,
  -- Whether an admin has accepted the AI category/priority suggestion.
  ai_confirmed        boolean default false,
  ai_reviewed_by      uuid references public.profiles(id) on delete set null,
  ai_reviewed_at      timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Keep the FK target index warm for the join policies below.
create index if not exists complaint_ai_analysis_complaint_idx
  on public.complaint_ai_analysis (complaint_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Students must never read AI analysis details (§31). Admins read everything.
-- Staff read the analysis for an issue they are currently working on, so the
-- suggestion helps them resolve it — and nothing more.
alter table public.complaint_ai_analysis enable row level security;

create policy "ai_select_admin" on public.complaint_ai_analysis
  for select to authenticated
  using ((select public.is_admin((select auth.uid()))));

create policy "ai_select_staff_assigned" on public.complaint_ai_analysis
  for select to authenticated
  using (
    (select public.is_admin((select auth.uid()))) is false
    and exists (
      select 1 from public.complaints c
      where c.id = complaint_ai_analysis.complaint_id
        and c.assigned_staff_id = (select auth.uid())
        and c.status <> 'resolved'
    )
  );

-- A complaint owner (or an admin) may write their own analysis row. The row
-- is authored server-side by the AI action, never by the student directly.
create policy "ai_insert_owner_or_admin" on public.complaint_ai_analysis
  for insert to authenticated
  with check (
    exists (
      select 1 from public.complaints c
      where c.id = NEW.complaint_id
        and (c.user_id = (select auth.uid())
             or (select public.is_admin((select auth.uid()))))
    )
  );

create policy "ai_update_owner_or_admin" on public.complaint_ai_analysis
  for update to authenticated
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_ai_analysis.complaint_id
        and (c.user_id = (select auth.uid())
             or (select public.is_admin((select auth.uid()))))
    )
  );

-- No delete policy: analysis rows are immutable in their lifecycle; a failed
-- re-run overwrites via upsert instead.

-- Grants: authenticated can run the analysis action (insert/update via the
-- function below); the table itself is gated by the policies above.
grant select, insert, update on public.complaint_ai_analysis to authenticated;
grant usage on schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Admin confirm: writes AI suggestions onto the confirmed complaint columns
-- ---------------------------------------------------------------------------
-- `category` is NOT in the authenticated UPDATE grant on `complaints` (only
-- `priority` and `image_path` are, by migration 0003), so a SECURITY DEFINER
-- function is the only safe way for an admin to confirm the AI suggestion.
-- `priority` goes through it too so the decision is a single audited write.
create or replace function public.apply_ai_suggestion_admin(
  p_complaint_id uuid,
  p_category public.complaint_category,
  p_priority public.complaint_priority
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := (select auth.uid());
begin
  if not (select public.is_admin(caller)) then
    return false;
  end if;

  update public.complaints
     set category = p_category,
         priority = p_priority
   where id = p_complaint_id;

  update public.complaint_ai_analysis
     set ai_confirmed = true,
         ai_reviewed_by = caller,
         ai_reviewed_at = now(),
         updated_at = now()
   where complaint_id = p_complaint_id;

  return found;
end;
$$;

revoke all on function public.apply_ai_suggestion_admin(uuid, public.complaint_category, public.complaint_priority) from public;
grant execute on function public.apply_ai_suggestion_admin(uuid, public.complaint_category, public.complaint_priority) to authenticated;

-- ============================================================================
-- Notes for future phases
-- ============================================================================
-- * Phase 7 (verification): the student verification step will read
--   ai_duplicate_* only for their own complaints via a future select policy.
-- * Phase 8 (analytics): aggregate AI metrics (processed/failed/duplicate
--   counts) can be added as views here without touching the tables.
-- ============================================================================
