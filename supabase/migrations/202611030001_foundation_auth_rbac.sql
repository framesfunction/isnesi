begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create type public.content_status as enum
  ('draft','in_review','approved','scheduled','published','rejected','archived');
create type public.enquiry_status as enum
  ('new','triaged','assigned','in_progress','waiting','closed','spam');
create type public.payment_status as enum
  ('created','pending','succeeded','failed','cancelled','refunded','partially_refunded');
create type public.consent_status as enum ('granted','withdrawn','expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (user_id, role_id)
);

insert into public.roles(key,name,description) values
 ('super_admin','Super Administrator','Full system administration'),
 ('website_admin','Website Administrator','Website configuration and CMS administration'),
 ('content_editor','Content Editor','Review and publish approved content'),
 ('content_contributor','Content Contributor','Create and edit own drafts'),
 ('communications_officer','Communications Officer','Enquiries and newsletter operations'),
 ('finance_officer','Finance Officer','Donation records and finance reporting'),
 ('safeguarding_officer','Safeguarding Officer','Assigned safeguarding casework'),
 ('safeguarding_lead','Safeguarding Lead','Safeguarding oversight and escalation'),
 ('media_manager','Media Manager','Media assets and rights metadata'),
 ('programme_manager','Programme Manager','Programme information'),
 ('auditor','Auditor / Compliance Reviewer','Read-only compliance access')
on conflict (key) do nothing;

insert into public.permissions(key,description) values
 ('admin.access','Access admin application'),
 ('users.manage','Manage users and role assignments'),
 ('settings.manage','Manage site settings'),
 ('pages.manage','Create and manage pages'),
 ('content.create','Create content'),
 ('content.edit_any','Edit any content'),
 ('content.review','Review and approve content'),
 ('content.publish','Publish and unpublish content'),
 ('programmes.manage','Manage programmes'),
 ('media.manage','Manage media and rights'),
 ('partners.manage','Manage partner profiles'),
 ('enquiries.manage','Manage general enquiries'),
 ('donations.read','Read donation records'),
 ('donations.manage','Manage donations and reconciliation'),
 ('newsletter.manage','Manage subscribers and campaigns'),
 ('kids.manage','Manage Kids Corner resources'),
 ('safeguarding.access','Access safeguarding casework through approved server functions'),
 ('safeguarding.lead','Safeguarding lead permissions'),
 ('audit.read','Read audit logs')
on conflict (key) do nothing;

-- Assign least-privilege role bundles.
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on
 (r.key='super_admin')
 or (r.key='website_admin' and p.key in ('admin.access','settings.manage','pages.manage','content.create','content.edit_any','content.review','content.publish','programmes.manage','media.manage','partners.manage','kids.manage','audit.read'))
 or (r.key='content_editor' and p.key in ('admin.access','pages.manage','content.create','content.edit_any','content.review','content.publish','media.manage'))
 or (r.key='content_contributor' and p.key in ('admin.access','content.create'))
 or (r.key='communications_officer' and p.key in ('admin.access','enquiries.manage','newsletter.manage','content.create'))
 or (r.key='finance_officer' and p.key in ('admin.access','donations.read','donations.manage'))
 or (r.key='safeguarding_officer' and p.key in ('admin.access','safeguarding.access'))
 or (r.key='safeguarding_lead' and p.key in ('admin.access','safeguarding.access','safeguarding.lead','audit.read'))
 or (r.key='media_manager' and p.key in ('admin.access','media.manage'))
 or (r.key='programme_manager' and p.key in ('admin.access','programmes.manage','content.create'))
 or (r.key='auditor' and p.key in ('admin.access','donations.read','audit.read'))
on conflict do nothing;

create or replace function app_private.has_permission(permission_key text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pr on pr.id = ur.user_id and pr.is_active
    where ur.user_id = (select auth.uid())
      and (ur.expires_at is null or ur.expires_at > now())
      and p.key = permission_key
  );
$$;
revoke all on function app_private.has_permission(text) from public, anon;
grant execute on function app_private.has_permission(text) to authenticated;

create or replace function app_private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function app_private.audit_row_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  rec_id text;
  op text := tg_op;
begin
  if tg_op = 'DELETE' then rec_id := coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'slug', 'unknown');
  else rec_id := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'slug', 'unknown'); end if;
  insert into public.audit_events(actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), lower(op), tg_table_schema||'.'||tg_table_name, rec_id,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end);
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_created_at_idx on public.audit_events(created_at desc);
create index audit_events_actor_idx on public.audit_events(actor_id,created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles
for each row execute function app_private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.profiles,public.roles,public.permissions,public.role_permissions,public.user_roles,public.audit_events from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(display_name,phone,avatar_path) on public.profiles to authenticated;
grant select on public.roles,public.permissions,public.role_permissions to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.audit_events to authenticated;

create policy profile_self_read on public.profiles for select to authenticated
using (id=(select auth.uid()) or app_private.has_permission('users.manage'));
create policy profile_self_update on public.profiles for update to authenticated
using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy roles_admin_read on public.roles for select to authenticated
using (app_private.has_permission('users.manage') or app_private.has_permission('admin.access'));
create policy permissions_admin_read on public.permissions for select to authenticated
using (app_private.has_permission('users.manage') or app_private.has_permission('admin.access'));
create policy role_permissions_admin_read on public.role_permissions for select to authenticated
using (app_private.has_permission('users.manage') or app_private.has_permission('admin.access'));
create policy user_roles_self_or_admin_read on public.user_roles for select to authenticated
using (user_id=(select auth.uid()) or app_private.has_permission('users.manage'));
create policy audit_admin_read on public.audit_events for select to authenticated
using (app_private.has_permission('audit.read'));
-- No client-side write policy for roles, permissions, user_roles or audit_events.
commit;
