begin;

-- This schema is deliberately NOT in Supabase's exposed API schemas.
create schema if not exists safeguarding;
revoke all on schema safeguarding from public,anon,authenticated;
grant usage on schema safeguarding to service_role;

create table safeguarding.cases (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('SAFE-'||to_char(now(),'YYYY')||'-'||upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  status text not null default 'received'
    check(status in ('received','triage','assigned','action_required','monitoring','closed','referred')),
  severity text not null default 'unassessed'
    check(severity in ('unassessed','low','medium','high','urgent')),
  received_at timestamptz not null default now(),
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  retention_review_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table safeguarding.subjects (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references safeguarding.cases(id) on delete cascade,
  subject_role text not null check(subject_role in ('child','parent_guardian','reporter','other')),
  display_name text,
  date_of_birth date,
  contact_details jsonb not null default '{}'::jsonb,
  identifying_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table safeguarding.intake_details (
  case_id uuid primary key references safeguarding.cases(id) on delete cascade,
  narrative_encrypted bytea,
  concern_type text,
  location_general text,
  immediate_risk boolean not null default false,
  safe_contact_instructions text,
  consent_or_legal_basis text,
  created_at timestamptz not null default now()
);

create table safeguarding.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references safeguarding.cases(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  note_encrypted bytea not null,
  note_type text not null default 'case_note',
  created_at timestamptz not null default now()
);

create table safeguarding.case_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references safeguarding.cases(id) on delete cascade,
  bucket_id text not null default 'safeguarding-private',
  object_path text not null unique,
  original_filename text,
  mime_type text,
  byte_size bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table safeguarding.case_access_events (
  id bigint generated always as identity primary key,
  case_id uuid references safeguarding.cases(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  purpose text,
  created_at timestamptz not null default now()
);

create table safeguarding.case_consents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references safeguarding.cases(id) on delete cascade,
  consent_type text not null,
  status public.consent_status not null,
  recorded_by uuid references auth.users(id) on delete set null,
  evidence_reference text,
  recorded_at timestamptz not null default now()
);

create index safeguarding_cases_status_idx on safeguarding.cases(status,severity,received_at desc);
create index safeguarding_cases_assignee_idx on safeguarding.cases(assigned_to,status);
create index safeguarding_access_case_idx on safeguarding.case_access_events(case_id,created_at desc);

-- No RLS policy and no table grants for anon/authenticated. The browser must never query
-- this schema directly. Use a server-side Edge Function with service_role, verify the caller's
-- JWT, check safeguarding role/assignment, write an access event, and return only needed fields.
revoke all on all tables in schema safeguarding from public,anon,authenticated;
revoke all on all sequences in schema safeguarding from public,anon,authenticated;
grant select,insert,update,delete on all tables in schema safeguarding to service_role;
grant usage,select on all sequences in schema safeguarding to service_role;

commit;
