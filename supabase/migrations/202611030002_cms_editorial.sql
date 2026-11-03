begin;

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  page_type text not null default 'standard',
  status public.content_status not null default 'draft',
  template_key text,
  show_in_navigation boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.page_translations (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  locale text not null,
  title text not null,
  excerpt text,
  seo_title text,
  seo_description text,
  canonical_url text,
  body jsonb not null default '{}'::jsonb,
  unique(page_id,locale)
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(page_id,section_key)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('story','news','announcement','policy')),
  slug text not null unique,
  status public.content_status not null default 'draft',
  author_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  scheduled_at timestamptz,
  featured boolean not null default false,
  allow_comments boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.content_translations (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  locale text not null,
  title text not null,
  excerpt text,
  body jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  unique(content_id,locale)
);

create table public.content_revisions (
  id bigint generated always as identity primary key,
  content_id uuid not null references public.content_items(id) on delete cascade,
  revision_no integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_note text,
  created_at timestamptz not null default now(),
  unique(content_id,revision_no)
);
create table public.content_approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  revision_id bigint not null references public.content_revisions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check(decision in ('approved','rejected','changes_requested')),
  note text,
  decided_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  created_at timestamptz not null default now()
);
create table public.category_translations (
  category_id uuid not null references public.categories(id) on delete cascade,
  locale text not null,
  label text not null,
  primary key(category_id,locale)
);
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique
);
create table public.tag_translations (
  tag_id uuid not null references public.tags(id) on delete cascade,
  locale text not null,
  label text not null,
  primary key(tag_id,locale)
);
create table public.content_categories (
  content_id uuid not null references public.content_items(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key(content_id,category_id)
);
create table public.content_tags (
  content_id uuid not null references public.content_items(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key(content_id,tag_id)
);
create table public.content_relationships (
  source_id uuid not null references public.content_items(id) on delete cascade,
  target_id uuid not null references public.content_items(id) on delete cascade,
  relationship text not null default 'related',
  primary key(source_id,target_id,relationship),
  check(source_id<>target_id)
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.programme_translations (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  locale text not null,
  title text not null,
  summary text,
  body jsonb not null default '{}'::jsonb,
  primary key(programme_id,locale)
);

create table public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null
);
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus(id) on delete cascade,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  open_new_tab boolean not null default false
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'public-media',
  object_path text not null unique,
  file_name text not null,
  mime_type text,
  byte_size bigint check(byte_size is null or byte_size>=0),
  width integer,
  height integer,
  alt_text text,
  caption text,
  credit text,
  rights_status text not null default 'pending'
    check(rights_status in ('pending','owned','licensed','permission_recorded','restricted','expired')),
  rights_reference text,
  consent_reference text,
  safeguarding_reviewed boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.media_usage (
  media_id uuid not null references public.media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  usage_role text not null default 'inline',
  primary key(media_id,entity_type,entity_id,usage_role)
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relationship_type text,
  website_url text,
  logo_media_id uuid references public.media_assets(id) on delete set null,
  approval_status text not null default 'pending'
    check(approval_status in ('pending','approved','rejected','expired')),
  public_visible boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.partner_translations (
  partner_id uuid not null references public.partners(id) on delete cascade,
  locale text not null,
  description text,
  primary key(partner_id,locale)
);

create index pages_status_idx on public.pages(status,sort_order);
create index content_status_published_idx on public.content_items(status,published_at desc);
create index content_author_idx on public.content_items(author_id,updated_at desc);
create index revisions_content_idx on public.content_revisions(content_id,revision_no desc);
create index media_rights_idx on public.media_assets(rights_status);
create index navigation_menu_order_idx on public.navigation_items(menu_id,sort_order);

create trigger pages_updated_at before update on public.pages
for each row execute function app_private.set_updated_at();
create trigger content_updated_at before update on public.content_items
for each row execute function app_private.set_updated_at();
create trigger programmes_updated_at before update on public.programmes
for each row execute function app_private.set_updated_at();
create trigger partners_updated_at before update on public.partners
for each row execute function app_private.set_updated_at();

-- Capture immutable content snapshots on insert/update.
create or replace function app_private.snapshot_content()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare n integer;
begin
  select coalesce(max(revision_no),0)+1 into n
  from public.content_revisions where content_id=new.id;
  insert into public.content_revisions(content_id,revision_no,snapshot,changed_by)
  values(new.id,n,to_jsonb(new),(select auth.uid()));
  return new;
end $$;
create trigger content_snapshot after insert or update on public.content_items
for each row execute function app_private.snapshot_content();

-- RLS: all CMS tables are protected; public reads are limited to published records.
do $$
declare t text;
begin
 foreach t in array array[
 'site_settings','pages','page_translations','page_sections','content_items',
 'content_translations','content_revisions','content_approvals','categories',
 'category_translations','tags','tag_translations','content_categories','content_tags',
 'content_relationships','programmes','programme_translations','navigation_menus',
 'navigation_items','media_assets','media_usage','partners','partner_translations'
 ] loop
   execute format('alter table public.%I enable row level security',t);
   execute format('revoke all on public.%I from anon,authenticated',t);
 end loop;
end $$;

grant select on public.pages,public.page_translations,public.page_sections,
 public.content_items,public.content_translations,public.categories,
 public.category_translations,public.tags,public.tag_translations,
 public.content_categories,public.content_tags,public.content_relationships,
 public.programmes,public.programme_translations,public.navigation_menus,
 public.navigation_items,public.media_assets,public.partners,public.partner_translations
to anon,authenticated;

grant select on public.site_settings to anon,authenticated;
grant select,insert,update,delete on public.site_settings,public.pages,
 public.page_translations,public.page_sections,public.content_items,
 public.content_translations,public.content_approvals,public.categories,
 public.category_translations,public.tags,public.tag_translations,
 public.content_categories,public.content_tags,public.content_relationships,
 public.programmes,public.programme_translations,public.navigation_menus,
 public.navigation_items,public.media_assets,public.media_usage,public.partners,
 public.partner_translations to authenticated;
grant select on public.content_revisions to authenticated;

create policy public_site_settings on public.site_settings for select to anon,authenticated
using(is_public);
create policy public_published_pages on public.pages for select to anon,authenticated
using(status='published');
create policy public_page_translations on public.page_translations for select to anon,authenticated
using(exists(select 1 from public.pages p where p.id=page_id and p.status='published'));
create policy public_page_sections on public.page_sections for select to anon,authenticated
using(is_enabled and exists(select 1 from public.pages p where p.id=page_id and p.status='published'));
create policy public_published_content on public.content_items for select to anon,authenticated
using(status='published' and published_at<=now());
create policy public_content_translations on public.content_translations for select to anon,authenticated
using(exists(select 1 from public.content_items c where c.id=content_id and c.status='published' and c.published_at<=now()));
create policy public_taxonomies on public.categories for select to anon,authenticated using(true);
create policy public_category_translations on public.category_translations for select to anon,authenticated using(true);
create policy public_tags on public.tags for select to anon,authenticated using(true);
create policy public_tag_translations on public.tag_translations for select to anon,authenticated using(true);
create policy public_content_categories on public.content_categories for select to anon,authenticated
using(exists(select 1 from public.content_items c where c.id=content_id and c.status='published'));
create policy public_content_tags on public.content_tags for select to anon,authenticated
using(exists(select 1 from public.content_items c where c.id=content_id and c.status='published'));
create policy public_content_relationships on public.content_relationships for select to anon,authenticated
using(exists(select 1 from public.content_items c where c.id=source_id and c.status='published'));
create policy public_active_programmes on public.programmes for select to anon,authenticated using(is_active);
create policy public_programme_translations on public.programme_translations for select to anon,authenticated
using(exists(select 1 from public.programmes p where p.id=programme_id and p.is_active));
create policy public_navigation on public.navigation_menus for select to anon,authenticated using(true);
create policy public_navigation_items on public.navigation_items for select to anon,authenticated using(is_visible);
create policy public_media_metadata on public.media_assets for select to anon,authenticated
using(rights_status in ('owned','licensed','permission_recorded'));
create policy public_partners on public.partners for select to anon,authenticated
using(public_visible and approval_status='approved');
create policy public_partner_translations on public.partner_translations for select to anon,authenticated
using(exists(select 1 from public.partners p where p.id=partner_id and p.public_visible and p.approval_status='approved'));

-- Admin policies.
create policy cms_admin_all_pages on public.pages for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));
create policy cms_admin_all_page_translations on public.page_translations for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));
create policy cms_admin_all_sections on public.page_sections for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));
create policy cms_admin_all_settings on public.site_settings for all to authenticated
using(app_private.has_permission('settings.manage')) with check(app_private.has_permission('settings.manage'));
create policy cms_admin_all_content on public.content_items for all to authenticated
using(app_private.has_permission('content.edit_any') or (author_id=(select auth.uid()) and app_private.has_permission('content.create')))
with check(app_private.has_permission('content.edit_any') or (author_id=(select auth.uid()) and app_private.has_permission('content.create')));
create policy cms_admin_all_content_translations on public.content_translations for all to authenticated
using(app_private.has_permission('content.edit_any') or exists(select 1 from public.content_items c where c.id=content_id and c.author_id=(select auth.uid())))
with check(app_private.has_permission('content.edit_any') or exists(select 1 from public.content_items c where c.id=content_id and c.author_id=(select auth.uid())));
create policy cms_admin_read_revisions on public.content_revisions for select to authenticated
using(app_private.has_permission('content.edit_any') or exists(select 1 from public.content_items c where c.id=content_id and c.author_id=(select auth.uid())));
create policy cms_admin_approvals on public.content_approvals for all to authenticated
using(app_private.has_permission('content.review')) with check(app_private.has_permission('content.review'));
create policy cms_admin_taxonomies on public.categories for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_category_translations on public.category_translations for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_tags on public.tags for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_tag_translations on public.tag_translations for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_content_categories on public.content_categories for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_content_tags on public.content_tags for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_relationships on public.content_relationships for all to authenticated
using(app_private.has_permission('content.edit_any')) with check(app_private.has_permission('content.edit_any'));
create policy cms_admin_programmes on public.programmes for all to authenticated
using(app_private.has_permission('programmes.manage')) with check(app_private.has_permission('programmes.manage'));
create policy cms_admin_programme_translations on public.programme_translations for all to authenticated
using(app_private.has_permission('programmes.manage')) with check(app_private.has_permission('programmes.manage'));
create policy cms_admin_navigation on public.navigation_menus for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));
create policy cms_admin_navigation_items on public.navigation_items for all to authenticated
using(app_private.has_permission('pages.manage')) with check(app_private.has_permission('pages.manage'));
create policy cms_admin_media on public.media_assets for all to authenticated
using(app_private.has_permission('media.manage')) with check(app_private.has_permission('media.manage'));
create policy cms_admin_media_usage on public.media_usage for all to authenticated
using(app_private.has_permission('media.manage')) with check(app_private.has_permission('media.manage'));
create policy cms_admin_partners on public.partners for all to authenticated
using(app_private.has_permission('partners.manage')) with check(app_private.has_permission('partners.manage'));
create policy cms_admin_partner_translations on public.partner_translations for all to authenticated
using(app_private.has_permission('partners.manage')) with check(app_private.has_permission('partners.manage'));

commit;
