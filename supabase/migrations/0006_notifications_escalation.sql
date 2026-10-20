-- Phase 9: Notifications and escalation
create type notification_type as enum (
  'complaint_created',
  'complaint_assigned',
  'complaint_in_progress',
  'complaint_resolved',
  'verification_required',
  'complaint_reopened',
  'complaint_escalated',
  'critical_complaint'
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  related_complaint_id uuid references public.complaints(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at);
create index if not exists idx_notifications_related on public.notifications(related_complaint_id);

alter table public.complaints
  add column if not exists escalation_status text not null default 'normal',
  add column if not exists escalated_at timestamptz,
  add column if not exists escalation_reason text;

alter table public.notifications enable row level security;
alter table public.complaints enable row level security;

-- RLS for notifications
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id);

create policy notifications_insert_service on public.notifications
  for insert with check (true);

create policy notifications_delete_own on public.notifications
  for delete using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

-- Notification helper function
create or replace function public.create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_complaint_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, message, related_complaint_id)
  values (p_user_id, p_type, p_title, p_message, p_complaint_id)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_notification(uuid, notification_type, text, text, uuid) from public;
grant execute on function public.create_notification(uuid, notification_type, text, text, uuid) to authenticated;
grant execute on function public.create_notification(uuid, notification_type, text, text, uuid) to service_role;
