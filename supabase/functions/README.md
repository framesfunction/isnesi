# Supabase Edge Functions

This directory holds the Deno Edge Functions that run with the Supabase **service
role** key. They are the only place privileged data may be read or written.

All functions listed below are implemented in this directory. None of them is
deployed to a Supabase project from this repository — deployment is a manual
step (see docs/DEPLOYMENT.md), and until it happens the corresponding UI fails
closed rather than bypassing the security model.

## Rules that apply to every function

1. **Verify the caller first.** Read the `Authorization` header, validate the JWT
   with Supabase Auth, and resolve the caller's permissions from
   `user_roles → role_permissions → permissions` (mirroring
   `app_private.has_permission()`).
2. **The service role key never leaves the function.** It comes from the function
   environment (`Deno.env.get`), never from a request body or query string.
3. **Validate and bound input.** Reject unknown fields, cap size, and rate limit
   per caller/IP before touching the database.
4. **Write an audit record before returning sensitive data.**
5. **Return the minimum.** No full rows, no `select *`, no internal identifiers
   that the caller does not need.
6. **Fail closed.** If the caller, the permission or the audit write cannot be
   verified, return 401/403 and do nothing else.

## Implemented functions

| Function | Callers | Responsibility |
|---|---|---|
| `enquiry-intake` | Public (anon) | Implemented. Rate-limited general enquiry intake as an alternative to the public insert path. Never accepts referrals. |
| `newsletter-subscribe` | Public (anon) | Implemented. Double opt-in: create `pending` subscriber, record consent, send confirmation link. |
| `newsletter-confirm` | Public (link) | Implemented. Confirm the opt-in token, set `subscribed`, record consent evidence. |
| `newsletter-unsubscribe` | Public (link) | Implemented. One-click unsubscribe with token verification and suppression. |
| `newsletter-send` | Staff (newsletter.manage) | Implemented. Queue per-recipient `queued` delivery events and flip the campaign to `sent` once the provider adapter reports delivery. Fails closed (502) until `NEWSLETTER_PROVIDER` is set and an adapter is wired. |
| `safeguarding-list-cases` | Safeguarding officers | Implemented. List assigned cases (all cases for leads); logs `case_access_events`. |
| `safeguarding-get-case` | Safeguarding officers | Implemented. Read one case with assignment check; logs access before returning. |
| `safeguarding-update-case` | Safeguarding officers/leads | Implemented. Status, severity, assignment; logs access and change. |
| `safeguarding-add-note` | Safeguarding officers | Implemented. Encrypted case note (`SAFEGUARDING_ENCRYPTION_KEY`); logs access. |
| `donation-create-intent` | Staff (donations.manage) | Implemented. MTN MoMo Collections requesttopay intent for a `created` donation; payer approves on their phone. |
| `payment-webhook` | Payment provider | Implemented. Signature-free MoMo: status is re-verified against the provider before any transition; idempotent via `payment_events`. Issues receipt numbers on success. |
| `donation-refund` | Finance officers | Implemented. Authorised refund with audit record. Rate limit 20/h. |

## Environment

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only secret>
SUPABASE_ANON_KEY=<public key>

# Mobile money (donation-create-intent / payment-webhook)
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com   # or https://proxy.momoapi.mtn.com
MOMO_SUBSCRIPTION_KEY=<server-only secret>
MOMO_API_USER=<server-only secret>
MOMO_API_KEY=<server-only secret>
MOMO_TARGET_ENV=sandbox
MOMO_CURRENCY=XAF
MOMO_COUNTRY_CODE=237

# Newsletter (newsletter-send)
NEWSLETTER_PROVIDER=<resend|brevo|mailgun|smtp — ses is not implemented>

# Edge Function rate limiting (all privileged functions)
# Counts live in app_private.rate_limit_buckets via app_private.consume_rate_limit
# (migration 202611090001). No extra secret is required; the RPC runs with the
# service role.

# Safeguarding (safeguarding-*-* functions)
SAFEGUARDING_ENCRYPTION_KEY=<base64-encoded 256-bit key, server-only secret>

# Payment webhook verification (set the callback URL with this secret)
PAYMENT_WEBHOOK_SECRET=<server-only secret>
```

Function secrets are configured with `supabase secrets set` and are never
committed to this repository.

## Local development

Docker Desktop is required for the local Supabase stack:

```bash
npx supabase start
npx supabase functions serve safeguarding-get-case --env-file supabase/.env.local
```

## Safeguarding specifics

- The `safeguarding` schema is intentionally **not** in the exposed API schemas
  (`supabase/config.toml`) and grants nothing to `anon` or `authenticated`.
- Do not add it to the exposed schemas, and do not create client RLS policies for
  it.
- Every access must append to `safeguarding.case_access_events` with the actor,
  case, action and purpose.
- Case content must never be included in notifications, logs, error messages or
  audit before/after payloads.
- Case notes are encrypted at rest with `SAFEGUARDING_ENCRYPTION_KEY` (a
  base64-encoded 256-bit key) before being written as `bytea`; the key is a
  function secret and is never stored by the application.