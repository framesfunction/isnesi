-- Add confirmation_token to newsletter_subscribers for double opt-in flow.
-- Used by the newsletter-subscribe and newsletter-confirm Edge Functions.
alter table public.newsletter_subscribers
  add column if not exists confirmation_token text;

create index if not exists newsletter_subscribers_confirmation_token_idx
  on public.newsletter_subscribers(confirmation_token)
  where confirmation_token is not null;
