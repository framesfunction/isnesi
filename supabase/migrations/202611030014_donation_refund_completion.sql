begin;

-- completion timestamp on refunds so finance can see when a refund was
-- finalised by the provider (not just when it was approved by staff)
alter table public.donation_refunds
  add column if not exists completed_at timestamptz;

-- storage reference for a receipt document (PDF) once one is generated.
-- kept on the donation row so a single source of truth holds the receipt.
alter table public.donations
  add column if not exists document_storage_key text;

comment on column public.donation_refunds.completed_at is
  'Timestamp when the provider confirmed the refund was completed (null until then).';

comment on column public.donations.document_storage_key is
  'Storage key of the issued receipt document (PDF), if one has been generated.';

-- refunds can now be inserted/updated by authenticated staff with donations.manage
grant select,insert,update on public.donation_refunds to authenticated;

commit;
