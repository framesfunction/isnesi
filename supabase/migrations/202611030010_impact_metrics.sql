begin;

-- ---------------------------------------------------------------------------
-- Impact metrics
--
-- A small, English-only table of approved impact figures the public Impact page
-- may publish. There is deliberately NO translation table: the project supports
-- English only, so a metric carries one label and one description.
--
-- Honesty is enforced by the schema, not by convention:
--   * a metric is public only when `is_published` is true AND `approved_at` is
--     set (the check constraint refuses any other combination);
--   * `source_note` and `evidence_url` record where a figure comes from, so a
--     visitor can verify it;
--   * the admin publishes by setting `approved_at` and unpublishes by clearing
--     it, which keeps the guard constraint satisfied at all times.
-- ---------------------------------------------------------------------------

create table public.impact_metrics (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  value numeric not null check (value >= 0),
  unit text not null default 'count' check (unit in ('count','percentage','currency')),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  description text,
  source_note text,
  evidence_url text check (evidence_url is null or evidence_url ~* '^https?://'),
  reporting_period text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_metrics_key_format check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint impact_metrics_currency_required check (unit <> 'currency' or currency is not null),
  constraint impact_metrics_publication_guard check (not is_published or approved_at is not null)
);

create index impact_metrics_published_idx
  on public.impact_metrics(is_published, sort_order);

create trigger impact_metrics_updated_at
  before update on public.impact_metrics
  for each row execute function app_private.set_updated_at();

-- RLS: anonymous visitors read only published, approved metrics; staff manage
-- the table through `pages.manage`, the permission that governs public pages.
alter table public.impact_metrics enable row level security;
revoke all on public.impact_metrics from anon,authenticated;

grant select on public.impact_metrics to anon,authenticated;
grant select,insert,update,delete on public.impact_metrics to authenticated;

create policy public_impact_metrics on public.impact_metrics for select to anon,authenticated
using(is_published and approved_at is not null);
create policy cms_admin_impact_metrics on public.impact_metrics for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));

-- Metric changes are audited like every other public-content table.
drop trigger if exists audit_impact_metrics on public.impact_metrics;
create trigger audit_impact_metrics
  after insert or update or delete on public.impact_metrics
  for each row execute function app_private.audit_row_change();

commit;