begin;

alter table public.donation_refunds
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists provider_status text;

alter table public.donations
  add column if not exists receipt_issued_at timestamptz;

comment on column public.donations.receipt_number is
  'Unique receipt identifier issued only after a signature-verified successful webhook.';

grant select,insert on public.donation_refunds to authenticated;
grant select,insert on public.finance_reconciliations to authenticated;

commit;
