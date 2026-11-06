begin;

-- Allow video alongside images and documents, and raise the public-media size
-- limit so editors can upload short embedded videos without leaving the library.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'application/pdf',
      'video/mp4',
      'video/webm'
    ]
where id = 'public-media';

-- Focal point (crop) stored as normalized { x, y } in [0, 1], so editors can
-- choose the part of an image that must stay visible when it is cropped to a
-- responsive box on the public site.
alter table public.media_assets
add column if not exists crop jsonb;

comment on column public.media_assets.crop is
  'Focal point for responsive cropping: { x: number, y: number } in [0, 1].';

commit;
