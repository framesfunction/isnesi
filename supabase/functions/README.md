# Supabase Edge Functions

This directory holds the Deno Edge Functions that run with the Supabase **service
role key**. They are the only place privileged data may be read or written.

Nothing is deployed yet. The functions below are specified here so their contract
is fixed before implementation.

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

## Planned functions

| Function | Callers | Responsibility |
|---|---|---|
| `enquiry-intake` | Public (anon) | Rate-limited general enquiry intake as an alternative to the public insert path. Never accepts referrals. |
| `newsletter-subscribe` | Public (anon) | Double opt-in: create `pending` subscriber, record consent, send confirmation. |
| `newsletter-confirm` | Public (link) | Confirm the opt-in token, set `subscribed`, record consent evidence. |
| `newsletter-unsubscribe` | Public (link) | One-click unsubscribe with token verification and suppression. |
| `safeguarding-list-cases` | Safeguarding officers | List assigned cases only; logs `case_access_events`. |
| `safeguarding-get-case` | Safeguarding officers | Read one case with assignment check; logs access before returning. |
| `safeguarding-update-case` | Safeguarding officers/leads | Status, severity, assignment; logs access and change. |
| `safeguarding-add-note` | Safeguarding officers | Encrypted case note; logs access. |
| `donation-create-intent` | Public (anon) | Create a `created` donation and a provider payment intent. Amount validated server-side. |
| `payment-webhook` | Payment provider | Signature verification, idempotency on `payment_events(provider_key, provider_event_id)`, status transition. |
| `donation-refund` | Finance officers | Authorised refund with audit record. |

## Environment

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only secret>
SUPABASE_ANON_KEY=<public key>
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