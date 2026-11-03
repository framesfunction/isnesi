begin;

create table public.general_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('ENQ-'||to_char(now(),'YYYY')||'-'||upper(substr(encode(gen_random_bytes(5),'hex'),1,8))),
  enquiry_type text not null check(enquiry_type in ('volunteer','partnership','contact','media','other')),
  full_name text not null,
  email text,
  phone text,
  message text not null,
  status public.enquiry_status not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  source text not null default 'website',
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);
create index general_enquiries_status_idx on public.general_enquiries(status,created_at desc);
create index general_enquiries_assignee_idx on public.general_enquiries(assigned_to,status);

create table public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.general_enquiries(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.donation_campaign_translations (
  campaign_id uuid not null references public.donation_campaigns(id) on delete cascade,
  locale text not null,
  title text not null,
  description text,
  primary key(campaign_id,locale)
);
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default ('DON-'||to_char(now(),'YYYY')||'-'||upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  donor_name text,
  donor_email text,
  amount_minor bigint not null check(amount_minor>0),
  currency char(3) not null default 'XAF',
  donation_type text not null default 'one_time' check(donation_type in ('one_time','recurring')),
  campaign_id uuid references public.donation_campaigns(id) on delete set null,
  payment_status public.payment_status not null default 'created',
  provider_key text,
  provider_transaction_id text,
  is_anonymous boolean not null default false,
  receipt_number text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index donations_provider_txn_unique on public.donations(provider_key,provider_transaction_id)
where provider_transaction_id is not null;
create index donations_created_idx on public.donations(created_at desc);
create table public.payment_events (
  id bigint generated always as identity primary key,
  donation_id uuid references public.donations(id) on delete set null,
  provider_key text not null,
  provider_event_id text not null,
  event_type text not null,
  signature_valid boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider_key,provider_event_id)
);
create table public.donation_refunds (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete restrict,
  amount_minor bigint not null check(amount_minor>0),
  reason text,
  provider_refund_id text,
  status text not null default 'requested' check(status in ('requested','succeeded','failed')),
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.finance_reconciliations (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  provider_key text,
  statement_reference text,
  total_minor bigint not null default 0,
  currency char(3) not null default 'XAF',
  status text not null default 'open' check(status in ('open','in_review','reconciled','disputed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check(period_end>=period_start)
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  status text not null default 'pending' check(status in ('pending','subscribed','unsubscribed','suppressed')),
  locale text not null default 'en',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.newsletter_consents (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  status public.consent_status not null,
  source text not null,
  policy_version text,
  ip_hash text,
  user_agent text,
  recorded_at timestamptz not null default now()
);
create table public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check(status in ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.newsletter_events (
  id bigint generated always as identity primary key,
  campaign_id uuid references public.newsletter_campaigns(id) on delete set null,
  subscriber_id uuid references public.newsletter_subscribers(id) on delete set null,
  event_type text not null check(event_type in ('queued','sent','delivered','bounced','opened','clicked','unsubscribed')),
  provider_event_id text,
  occurred_at timestamptz not null default now()
);

create table public.kids_resources (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check(resource_type in ('story','activity','game','video','download')),
  status public.content_status not null default 'draft',
  min_age smallint,
  max_age smallint,
  is_featured boolean not null default false,
  safeguarding_approved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(min_age is null or min_age>=0),
  check(max_age is null or max_age>=0),
  check(min_age is null or max_age is null or max_age>=min_age)
);
create table public.kids_resource_translations (
  resource_id uuid not null references public.kids_resources(id) on delete cascade,
  locale text not null,
  title text not null,
  description text,
  content jsonb not null default '{}'::jsonb,
  primary key(resource_id,locale)
);

create trigger general_enquiries_updated_at before update on public.general_enquiries
for each row execute function app_private.set_updated_at();
create trigger kids_resources_updated_at before update on public.kids_resources
for each row execute function app_private.set_updated_at();

do $$
declare t text;
begin
 foreach t in array array[
 'general_enquiries','enquiry_notes','donation_campaigns','donation_campaign_translations',
 'donations','payment_events','donation_refunds','finance_reconciliations',
 'newsletter_subscribers','newsletter_consents','newsletter_campaigns','newsletter_events',
 'kids_resources','kids_resource_translations'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;

-- Public submission paths: narrow insert grants; no public read of submissions.
grant insert(enquiry_type,full_name,email,phone,message,source,consent_to_contact)
on public.general_enquiries to anon,authenticated;
grant select,update on public.general_enquiries to authenticated;
grant select,insert on public.enquiry_notes to authenticated;
grant select on public.donation_campaigns,public.donation_campaign_translations to anon,authenticated;
grant insert(donor_name,donor_email,amount_minor,currency,donation_type,campaign_id,is_anonymous)
on public.donations to anon,authenticated;
grant select on public.donations,public.payment_events,public.donation_refunds,public.finance_reconciliations to authenticated;
grant select on public.kids_resources,public.kids_resource_translations to anon,authenticated;
grant select,insert,update,delete on public.kids_resources,public.kids_resource_translations to authenticated;
grant select,insert,update,delete on public.newsletter_subscribers,public.newsletter_consents,
 public.newsletter_campaigns,public.newsletter_events to authenticated;

create policy enquiry_public_insert on public.general_enquiries for insert to anon,authenticated
with check(consent_to_contact=true and status='new' and assigned_to is null);
create policy enquiry_staff_read on public.general_enquiries for select to authenticated
using(app_private.has_permission('enquiries.manage'));
create policy enquiry_staff_update on public.general_enquiries for update to authenticated
using(app_private.has_permission('enquiries.manage')) with check(app_private.has_permission('enquiries.manage'));
create policy enquiry_notes_staff on public.enquiry_notes for all to authenticated
using(app_private.has_permission('enquiries.manage')) with check(app_private.has_permission('enquiries.manage'));

create policy public_active_campaigns on public.donation_campaigns for select to anon,authenticated using(is_active);
create policy public_campaign_translations on public.donation_campaign_translations for select to anon,authenticated
using(exists(select 1 from public.donation_campaigns c where c.id=campaign_id and c.is_active));
create policy donation_public_insert on public.donations for insert to anon,authenticated
with check(payment_status='created' and provider_transaction_id is null and paid_at is null);
create policy finance_read on public.donations for select to authenticated
using(app_private.has_permission('donations.read'));
create policy finance_payment_events on public.payment_events for select to authenticated
using(app_private.has_permission('donations.read'));
create policy finance_refunds on public.donation_refunds for select to authenticated
using(app_private.has_permission('donations.read'));
create policy finance_reconciliation on public.finance_reconciliations for select to authenticated
using(app_private.has_permission('donations.read'));
create policy finance_manage_reconciliation on public.finance_reconciliations for all to authenticated
using(app_private.has_permission('donations.manage')) with check(app_private.has_permission('donations.manage'));

create policy kids_public_resources on public.kids_resources for select to anon,authenticated
using(status='published' and safeguarding_approved);
create policy kids_public_translations on public.kids_resource_translations for select to anon,authenticated
using(exists(select 1 from public.kids_resources r where r.id=resource_id and r.status='published' and r.safeguarding_approved));
create policy kids_admin_resources on public.kids_resources for all to authenticated
using(app_private.has_permission('kids.manage')) with check(app_private.has_permission('kids.manage'));
create policy kids_admin_translations on public.kids_resource_translations for all to authenticated
using(app_private.has_permission('kids.manage')) with check(app_private.has_permission('kids.manage'));

create policy newsletter_admin_subscribers on public.newsletter_subscribers for all to authenticated
using(app_private.has_permission('newsletter.manage')) with check(app_private.has_permission('newsletter.manage'));
create policy newsletter_admin_consents on public.newsletter_consents for all to authenticated
using(app_private.has_permission('newsletter.manage')) with check(app_private.has_permission('newsletter.manage'));
create policy newsletter_admin_campaigns on public.newsletter_campaigns for all to authenticated
using(app_private.has_permission('newsletter.manage')) with check(app_private.has_permission('newsletter.manage'));
create policy newsletter_admin_events on public.newsletter_events for select to authenticated
using(app_private.has_permission('newsletter.manage'));

-- No public direct subscriber insert/update: use a rate-limited Edge Function that validates
-- double opt-in and writes with a server-only key. Do not expose service_role in a browser.

commit;
