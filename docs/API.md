# API reference

Verified 2026-11-09 against commit `5f41b3a` by reading the route/function
source. No endpoint below was exercised against a live deployment during this
verification (no deployed environment was reachable); behaviors documented here
come from reading `src/` and `supabase/functions/` in full. Where something is
inferred rather than literally read from a code path, it is marked.

The core mutations are **Server Actions**, not HTTP endpoints — they are
summarized in brief at the end; the request/response contract of a Server
Action is Next.js-internal and not documented here. The verified commit for
this file is `63a801a` on branch `audit-remediation`; all listed Edge Functions
convert their rate-limit guards to the shared DB-backed limiter
(`enforceRateLimit`) with that commit.

## HTTP endpoints (Next.js)

### `GET /api/health`

`src/app/api/health/route.ts`. Public, `force-dynamic`, `cache-control: no-store`.

Response 200 (when Supabase is configured and reachable):

```json
{
  "status": "ok",
  "checks": {
    "supabase": "configured",
    "database": "ok",
    "privilegedWorkflows": "configured"
  },
  "timestamp": "2026-11-09T07:03:00.000Z"
}
```

503 with `"status": "degraded"` otherwise; `database` reports
`not_configured`/`unreachable`, `privilegedWorkflows` reports `not_configured`
(both `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are required to count as
configured). Exposes no keys, hosts, or counts. The database probe is a head
count on `site_settings`.

### `POST /api/cron/publish-scheduled`

`src/app/api/cron/publish-scheduled/route.ts`. `GET` → 405.

Publishes overdue content articles whose `status = scheduled` and
`scheduled_at <= now` (and not already published). Uses the service-role admin
client. Idempotent: items without `published_at` are chosen, then flipped to
`published` with `published_at = now`.

Auth: `Authorization: Bearer <CRON_SECRET>`.

| Condition | Result |
|---|---|
| `CRON_SECRET` not set in environment | `503` — fails closed, rate limit 30/h/IP applies first |
| Missing/wrong bearer secret | `401` (constant-time comparison via `src/lib/security/timing-safe.ts`) |
| Over limit | `429` |
| Admin client unavailable | `503` |
| Success | `200` — `{ "ok": true, "published": <count>, "at": "<ISO timestamp>" }` |

### ~~`GET /api/donations/[donationId]`~~ — removed

This endpoint existed at the time of the audit and was removed in commit
`735b16f`: it had no caller anywhere in the codebase, no handler-level auth,
and returned donor PII gated only by RLS (finding ISN-015 in
[REMEDIATION_TRACKER.md](../REMEDIATION_TRACKER.md)). The payment and receipt
pages read the donation server-side directly, so nothing depended on it.

### `GET /auth/callback`

`src/app/auth/callback/route.ts`. Supabase PKCE exchange for magic-link /
invite / recovery flows.

| Condition | Result |
|---|---|
| Successful code exchange | redirect `safeRedirectPath(next, default '/admin')`; protocol-relative/absolute/backslash paths rejected — open-redirect safe |
| Missing code, Supabase unconfigured, exchange failed | redirect `/login?error=callback` |

## Supabase Edge Functions

Deployed with `supabase functions deploy` (see docs/DEPLOYMENT.md). All are
`POST`-only (405 otherwise) and fail closed when required secrets are missing.
Rate limits below are per-isolate in-memory buckets — a Supabase Edge Function
limitation, not a global guarantee (`supabase/functions/_shared/caller.ts`).

| Function | Caller | Auth | Rate limit | Environment read |
|---|---|---|---|---|
| `enquiry-intake` | public (anon) | none | 5/h/IP | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `newsletter-subscribe` | public (anon) | none | 5/h/IP | same 2 |
| `newsletter-confirm` | public (link, token) | token = credential | 10/h/IP | same 2 |
| `newsletter-unsubscribe` | public (link, token) | token = credential | 10/h/IP | same 2 |
| `newsletter-send` | staff | `requirePermissionCaller` — JWT + `newsletter.manage` | 5/h per campaign and per IP (rate cap configurable via `NEWSLETTER_SEND_RATE_LIMIT` / `NEWSLETTER_SEND_RATE_WINDOW_MS` function secrets, defaults 5/h and 1 hour) | + `NEWSLETTER_PROVIDER` and provider secrets |
| `donation-create-intent` | staff | JWT + `donations.manage` | 20/h/IP | + MoMo set |
| `donation-pay-intent` | donor/staff (authenticated) | Bearer JWT, verified via Supabase Auth; amount must equal donation; donation must be `created`, XAF; will not overwrite an existing `provider_transaction_id` | 10/h per IP **and** per donation | + MoMo set |
| `donation-refund` | staff | JWT + `donations.manage` | 20/h/IP | + MoMo set |
| `payment-webhook` | provider | `x-webhook-secret === PAYMENT_WEBHOOK_SECRET` (timing-safe) | — | + `PAYMENT_WEBHOOK_SECRET`, MoMo set |
| `safeguarding-list-cases` | officers | JWT + `safeguarding.access` (lead sees all; others only assigned cases); writes `case_access_events` | 10/h/IP | + `SAFEGUARDING_ENCRYPTION_KEY` when used |
| `safeguarding-get-case` | officers | JWT + assignment or lead; logs access before returning | 10/h/IP | same |
| `safeguarding-update-case` | officers/leads | JWT; allowed-value validation for status/severity/assignee | 10/h/IP | same |
| `safeguarding-add-note` | officers | JWT; note encrypted AES-256-GCM before storage | 10/h/IP | same |

Notes applying to all Edge Functions:

- The `Authorization` header is the Supabase JWT (from the user session):
  validated against `${SUPABASE_URL}/auth/v1/user`, then permissions are
  resolved from `user_roles → role_permissions → permissions` with
  `profiles.is_active = true` and unexpired `user_roles.expires_at` enforced —
  same rules the Next.js side applies, implemented in
  `supabase/functions/_shared/caller.ts` and `_shared/safeguarding.ts`.
- Rate limits are enforced by `enforceRateLimit`, which consumes an atomic
  upsert against `app_private.consume_rate_limit` (migration
  `202611090001_rate_limit_buckets.sql`) so counts are shared across all
  Edge Function isolates. If the RPC cannot be reached, the limiter falls back
  to a per-isolate in-memory bucket rather than failing the request — meaning
  limits degrade to per-isolate during a database outage, which is the weakest
  mode documented.
- Unknown or unconfigured providers fail closed. Available providers:
  `resend`, `brevo`, `mailgun`, `smtp` (documented stub, fails closed), and
  `ses` (AWS SES v2 with Signature V4 signing via `fetch`; implemented and
  structurally unit-tested, not exercised against live AWS — no credentials in
  this environment).
- Unknown requests fail with 401/403/404 before any sensitive read; stated
  bundled rules: verify-then-act, minimum data returned, no secrets leaving the
  function environment.
- Error mapping: 401 missing/invalid credential, 403 valid caller without the
  required permission or not assigned (safeguarding), 404 not found/not allowed
  to know it exists, 400 validation failures, 422 state-conflict (e.g. refund
  already completed), 429 per-bucket rate limit, 502 provider
  unavailable/not configured, 503 service temporarily unavailable (database or
  secrets missing), 500 unexpected. (Verified while reading
  `donation-refund`, `safeguarding-get-case`, `enquiry-intake` and
  `payment-webhook`; other functions follow the same `_shared/caller.ts`
  conventions but their individual error branches were not enumerated one by
  one.)

## Server Actions (selected, representative)

Every action lives in its feature folder (`src/features/**/actions.ts`) and:
guards with `assertPermission` / role checks first, validates with the shared
Zod schemas (`src/lib/validation`), never trusts its client-supplied
identifiers blindly, uses the cookie-bound Supabase client so RLS constrains
it, and returns plain, non-enumerating error strings.

| Action family | Feature | Permission | Notable controls |
|---|---|---|---|
| Sign-in / sign-out | `features/auth` | none (rate limit 5/h/IP) | One message for any credential failure (no account enumeration) |
| Pages/sections CRUD | `features/pages` | `pages.manage` | Publication checks, navigation-link repair |
| Editorial workflow | `features/editorial` | `content.*` permissions per stage | Immutable revisions, independent approvals, re-approval on material change |
| Programmes | `features/programmes` | `programmes.manage` | Bilingual validation |
| Media | `features/media` | `media.manage` | Rights/consent tracking |
| Partners | `features/partners` | `partners.manage` | Approval + visibility gate |
| Navigation | `features/navigation` | `pages.manage` | Cycle guard, broken-link detection |
| Taxonomies | `features/taxonomy` | `content.edit_any` | Usage counts maintained |
| Enquiries | `features/enquiries` | `enquiries.manage` | — |
| Donations/refunds | `features/finance` | `donations.*` per action | Refund approval recomputes partial/full status |
| Newsletter campaigns | `features/newsletter` | `newsletter.manage` | Draft → approved → scheduled → sent; send via `newsletter-send` only |
| Users & roles | `features/users` | `users.manage` | Self-escalation prevention asserted in validation |
| Settings/accessibility | `features/settings` | `settings.manage` | Site settings key-value editing |
| Kids' resources | `features/kids` | `kids.manage` | Safeguarding approval gate |

The definitive catalog of which permission each admin page/action needs is
`src/lib/permissions/admin-nav.ts` (20 modules).
