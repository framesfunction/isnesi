begin;

-- ---------------------------------------------------------------------------
-- Programmes: complete the content model from spec section 2.3.
--
-- Adds the structured programme fields the admin now manages and the public
-- detail page renders. Visibility stays governed by `is_active` and the RLS
-- policies created in the CMS migration; no policy changes are required.
-- ---------------------------------------------------------------------------

alter table public.programmes
  add column if not exists featured_image_id uuid references public.media_assets(id) on delete set null,
  add column if not exists objectives jsonb not null default '[]'::jsonb,
  add column if not exists activities jsonb not null default '[]'::jsonb,
  add column if not exists target_beneficiaries text,
  add column if not exists geographic_coverage text;

create index if not exists programmes_featured_image_idx
  on public.programmes(featured_image_id);

-- Programme SEO metadata lives with the translation, like pages and stories.
alter table public.programme_translations
  add column if not exists seo_title text,
  add column if not exists seo_description text;

commit;
