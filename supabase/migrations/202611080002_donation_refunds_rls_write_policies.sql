begin;

-- Migration 202611030014 granted insert/update on public.donation_refunds to
-- authenticated but RLS (enabled in 202611030003) had no write policies,
-- default-denying every authenticated write and breaking the refund workflow.
-- Add least-privilege write policies gated on donations.manage.

create policy donation_refunds_insert on public.donation_refunds for insert to authenticated
  with check (app_private.has_permission('donations.manage'));

create policy donation_refunds_update on public.donation_refunds for update to authenticated
  using (app_private.has_permission('donations.manage'))
  with check (app_private.has_permission('donations.manage'));

create policy donation_refunds_delete on public.donation_refunds for delete to authenticated
  using (app_private.has_permission('donations.manage'));

commit;
