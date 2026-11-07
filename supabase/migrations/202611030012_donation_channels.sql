begin;

-- Mobile Money donation intents need the payer phone number that was prompted.
alter table public.donations
  add column if not exists payer_phone text;

comment on column public.donations.payer_phone is
  'Phone number the payment prompt was sent to (mobile money provider), as entered by staff.';

-- WhatsApp is a first-class distribution channel for campaigns. Email stays the
-- default; a WhatsApp campaign renders its body as copy-ready plain text in the
-- admin because WhatsApp sending is manual (Broadcast lists / Status / groups)
-- until a WhatsApp Business API provider is connected.
alter table public.newsletter_campaigns
  add column if not exists channel text not null default 'email';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'newsletter_campaigns_channel_check'
  ) then
    alter table public.newsletter_campaigns
      add constraint newsletter_campaigns_channel_check
      check (channel in ('email', 'whatsapp'));
  end if;
end $$;

commit;
