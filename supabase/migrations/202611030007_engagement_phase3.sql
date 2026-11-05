begin;

-- ---------------------------------------------------------------------------
-- Phase 3 (Engagement): enquiry assignment + response history, newsletter
-- consent/segment/campaign fields, and transactional notification tables.
-- Spec sections 2.8, 2.10, 3.7, 3.10 and 7.3.
-- ---------------------------------------------------------------------------

-- Enquiry assignment audit trail: who moved an enquiry to whom, when, why.
create table public.enquiry_assignments (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.general_enquiries(id) on delete cascade,
  assigned_from uuid references auth.users(id) on delete set null,
  assigned_to uuid not null references auth.users(id) on delete restrict,
  reason text,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);
create index enquiry_assignments_enquiry_idx
  on public.enquiry_assignments(enquiry_id, assigned_at desc);

-- Response history: outbound and inbound contact records per enquiry.
create table public.enquiry_messages (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.general_enquiries(id) on delete cascade,
  direction text not null check(direction in ('outbound','inbound')),
  channel text not null default 'email' check(channel in ('email','phone','post','in_person')),
  message_reference text,
  body text,
  delivery_status text not null default 'queued'
    check(delivery_status in ('queued','sent','delivered','failed')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now()
);
create index enquiry_messages_enquiry_idx on public.enquiry_messages(enquiry_id, sent_at);

-- Newsletter: provider reference and lifecycle timestamps (spec 3.10).
alter table public.newsletter_subscribers
  add column if not exists provider_contact_reference text,
  add column if not exists subscribed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create trigger newsletter_subscribers_updated_at before update on public.newsletter_subscribers
  for each row execute function app_private.set_updated_at();

-- Consent evidence: withdrawal timestamp and evidence pointer.
alter table public.newsletter_consents
  add column if not exists revoked_at timestamptz,
  add column if not exists evidence_reference text;

-- Audience segmentation.
create table public.newsletter_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status text not null default 'active' check(status in ('active','retired')),
  created_at timestamptz not null default now()
);
create table public.newsletter_segment_members (
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  segment_id uuid not null references public.newsletter_segments(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key(subscriber_id, segment_id)
);

-- Campaign approval trail and provider reference.
alter table public.newsletter_campaigns
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists provider_campaign_reference text;

-- Transactional notifications (spec 7.3): they point staff at the secure
-- application; sensitive case content never travels through them.
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  channel text not null check(channel in ('email','in_app')),
  language_code text not null default 'en',
  subject text not null,
  body_template text not null,
  status text not null default 'active' check(status in ('active','retired')),
  unique(template_key, channel, language_code)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  channel text not null check(channel in ('email','in_app')),
  template_id uuid references public.notification_templates(id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  delivery_status text not null default 'pending'
    check(delivery_status in ('pending','sent','failed','skipped')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.notification_delivery_attempts (
  id bigint generated always as identity primary key,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  provider_reference text,
  attempt_number integer not null default 1,
  result text not null check(result in ('success','failure')),
  error_code text,
  attempted_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
 foreach t in array array[
  'enquiry_assignments','enquiry_messages','newsletter_segments',
  'newsletter_segment_members','notification_templates','notifications',
  'notification_delivery_attempts'
 ] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;

grant select,insert on public.enquiry_assignments to authenticated;
grant select,insert,update on public.enquiry_messages to authenticated;
grant select,insert,update,delete on public.newsletter_segments,public.newsletter_segment_members to authenticated;
grant select on public.notification_templates to authenticated;
grant select,insert,update on public.notifications to authenticated;
grant select,insert on public.notification_delivery_attempts to authenticated;

create policy enquiry_assignments_staff on public.enquiry_assignments for all to authenticated
  using(app_private.has_permission('enquiries.manage'))
  with check(app_private.has_permission('enquiries.manage'));
create policy enquiry_messages_staff on public.enquiry_messages for all to authenticated
  using(app_private.has_permission('enquiries.manage'))
  with check(app_private.has_permission('enquiries.manage'));

create policy newsletter_segments_admin on public.newsletter_segments for all to authenticated
  using(app_private.has_permission('newsletter.manage'))
  with check(app_private.has_permission('newsletter.manage'));
create policy newsletter_segment_members_admin on public.newsletter_segment_members for all to authenticated
  using(app_private.has_permission('newsletter.manage'))
  with check(app_private.has_permission('newsletter.manage'));

-- A staff member always sees their own notifications; user administrators see all.
create policy notifications_read on public.notifications for select to authenticated
  using(recipient_user_id = (select auth.uid()) or app_private.has_permission('users.manage'));
create policy notifications_staff_write on public.notifications for insert to authenticated
  with check(app_private.has_permission('enquiries.manage') or app_private.has_permission('newsletter.manage'));
create policy notifications_status_update on public.notifications for update to authenticated
  using(recipient_user_id = (select auth.uid()) or app_private.has_permission('users.manage'))
  with check(recipient_user_id = (select auth.uid()) or app_private.has_permission('users.manage'));
create policy notification_attempts_read on public.notification_delivery_attempts for select to authenticated
  using(exists(select 1 from public.notifications n where n.id = notification_id
    and (n.recipient_user_id = (select auth.uid()) or app_private.has_permission('users.manage'))));
create policy notification_attempts_write on public.notification_delivery_attempts for insert to authenticated
  with check(exists(select 1 from public.notifications n where n.id = notification_id
    and (n.recipient_user_id = (select auth.uid()) or app_private.has_permission('enquiries.manage')
      or app_private.has_permission('newsletter.manage'))));

commit;
