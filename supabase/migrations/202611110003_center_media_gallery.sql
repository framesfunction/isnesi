begin;

-- A center can have many images and videos. Each entry links a center to a
-- media asset with a caption, sort order, and an optional cover flag.
create table public.center_media (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null references public.centers(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  caption text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  media_type text not null default 'image'
    check(media_type in ('image','video')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(center_id, media_asset_id)
);

create index center_media_center_idx on public.center_media(center_id, sort_order);
create index center_media_cover_idx on public.center_media(center_id) where is_cover;

create trigger center_media_updated_at before update on public.center_media
for each row execute function app_private.set_updated_at();

-- RLS
alter table public.center_media enable row level security;
revoke all on public.center_media from anon,authenticated;

grant select on public.center_media to anon,authenticated;
grant select,insert,update,delete on public.center_media to authenticated;

create policy public_center_media on public.center_media for select to anon,authenticated
  using(exists(select 1 from public.centers c where c.id=center_id and c.public_visible));

create policy cms_admin_center_media on public.center_media for all to authenticated
  using(app_private.has_permission('centers.manage'))
  with check(app_private.has_permission('centers.manage'));

commit;
