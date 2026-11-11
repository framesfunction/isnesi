begin;

create table public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  city text,
  phone text,
  email text,
  website_url text,
  opening_hours text,
  description text,
  logo_media_id uuid references public.media_assets(id) on delete set null,
  map_media_id uuid references public.media_assets(id) on delete set null,
  public_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.center_translations (
  center_id uuid not null references public.centers(id) on delete cascade,
  locale text not null,
  description text,
  primary key(center_id,locale)
);

create index centers_slug_idx on public.centers(slug);
create index centers_public_idx on public.centers(public_visible);

create trigger centers_updated_at before update on public.centers
for each row execute function app_private.set_updated_at();

-- RLS: centers are immediately public (no approval workflow). Anyone can read
-- visible centers; authenticated staff with centers.manage can write.
do $$
declare t text;
begin
  foreach t in array array['centers','center_translations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
  end loop;
end $$;

grant select on public.centers, public.center_translations to anon,authenticated;
grant select,insert,update,delete on public.centers, public.center_translations to authenticated;

create policy public_centers on public.centers for select to anon,authenticated
  using(public_visible);
create policy public_center_translations on public.center_translations for select to anon,authenticated
  using(exists(select 1 from public.centers c where c.id=center_id and c.public_visible));

create policy cms_admin_centers on public.centers for all to authenticated
  using(app_private.has_permission('centers.manage'))
  with check(app_private.has_permission('centers.manage'));
create policy cms_admin_center_translations on public.center_translations for all to authenticated
  using(app_private.has_permission('centers.manage'))
  with check(app_private.has_permission('centers.manage'));

commit;
