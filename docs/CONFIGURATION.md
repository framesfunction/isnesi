# Configuration

Every environment variable and config knob the application can read, generated
from the code (grep of `process.env.*`, `Deno.env.get`, and the npm scripts).
No real secrets appear here. `.env.example` at the repo root mirrors the Next.js
app surface; Edge Function secrets live in Supabase's secret store, not in a
committed file.

Verified 2026-11-09 against commit `3b2bde5` (branch `impl-gaps`; application
code last changed at `3b2bde5`).

## Next.js application

### Public (embedded in the browser bundle)

| Variable | Purpose | Required | Default | Read in |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required (app runs degraded without it) | — | `src/lib/env.ts`, `src/proxy.ts` (CSP connect-src), `next.config.ts` (image remote pattern) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for the URL above | Required (same) | — | `src/lib/env.ts` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin used for metadata/SEO | Optional | `http://localhost:3000` | `src/lib/env.ts`; direct fallback reads in `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/layout.tsx`, stories/impact/get-involved pages |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Site locale | Optional, must be `en` if set | `en` | `src/lib/env.ts` (Zod literal `en`) |

### Server-only secrets

| Variable | Purpose | Required | Default | Read in |
|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for cron publishing and privileged actions. **Bypasses RLS.** | Required for cron publishing, the health privileged check, `db:seed` | — | `src/lib/env.ts` (`serverEnvSchema`); `scripts/db-seed.mjs` |
| `CRON_SECRET` | Bearer secret for `POST /api/cron/publish-scheduled`. Route fails closed (503) if unset | Required for the cron route | — | `src/app/api/cron/publish-scheduled/route.ts`, `src/lib/env.ts` |

### Feature gate read by the Next.js app directly

| Variable | Purpose | Required | Default | Read in |
|---|---|---|---|---|
| `MOMO_API_USER` | Read by the donate page only to decide whether online giving is open (`onlineGivingOpen`) | Optional | unset ⇒ online giving UI stays closed | `src/app/(public)/donate/page.tsx` |

Interaction to be aware of: the donate page gate is
`isServiceRoleConfigured() && !!process.env.MOMO_API_USER`, and
`isServiceRoleConfigured()` requires **both** `SUPABASE_SERVICE_ROLE_KEY` and
`CRON_SECRET` to be set. Online giving therefore only opens when three things
are configured together.

### npm DB operations (scripts, not runtime)

| Variable | Purpose | Required | Default | Read in |
|---|---|---|---|---|
| `SUPABASE_DB_PASSWORD` | Postgres password used by `db:push`, `db:types`, `db:seed` via the AWS session pooler | Required for those scripts | — | `scripts/db-push.mjs`, `scripts/db-types.mjs`, `scripts/db-seed.mjs` |
| `SUPABASE_POOLER_REGION` | Session-pooler region override | Optional | `aws-0-eu-west-1` | same scripts |
| `SUPABASE_DB_URL` | Full pooler URL override (bypasses region assembly) | Optional | — | same scripts |

## Supabase Edge Function secrets

Configured with `supabase secrets set`, never committed. Collected from
`Deno.env.get` reads (verified in `_shared/*.ts` and the function entry files).

| Secret | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | all Edge Functions | Usually `--no-verify` false; injected automatically by supabase CLI but read explicitly here |
| `SUPABASE_SERVICE_ROLE_KEY` | all Edge Functions | The only privileged DB credential in functions |
| `MOMO_BASE_URL` | donation-create-intent, donation-pay-intent, donation-refund, payment-webhook | `https://sandbox.momodeveloper.mtn.com` or `https://proxy.momoapi.mtn.com` |
| `MOMO_SUBSCRIPTION_KEY` | same | |
| `MOMO_API_USER` / `MOMO_API_KEY` | same | Basic-auth pair for the Collections token |
| `MOMO_TARGET_ENV` | same | Defaults `sandbox`; production env names like `mtnliberia` |
| `MOMO_CURRENCY` | same | Defaults `XAF` |
| `MOMO_COUNTRY_CODE` | donation-* | Defaults `237` (Cameroon); used to normalize phone numbers to MSISDN |
| `PAYMENT_WEBHOOK_SECRET` | payment-webhook | `x-webhook-secret` header compared timing-safe; 401 on mismatch |
| `NEWSLETTER_PROVIDER` | newsletter-send | `resend` / `brevo` / `mailgun` / `smtp` / `ses`. Unset ⇒ 502 fail-closed. (`ses` implemented but not exercised against live AWS — no credentials in this environment) |
| `NEWSLETTER_SEND_RATE_LIMIT` | newsletter-send (per-IP rate cap) | Optional; defaults `5` per hour |
| `NEWSLETTER_SEND_RATE_WINDOW_MS` | newsletter-send (rate window) | Optional; defaults `3600000` (1 hour) |
| `SES_REGION` | newsletter-send (ses adapter) | Optional; defaults `us-east-1` |
| `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY` | newsletter-send (ses adapter) | Required when `NEWSLETTER_PROVIDER=ses`; AWS credentials for Signature V4 signing |
| `SES_FROM` | newsletter-send (ses adapter) | Optional; defaults to the campaign's `from` |
| `RESEND_API_KEY`, `RESEND_FROM` | newsletter-send (adapter) | `RESEND_FROM` defaults to the campaign's `from` |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` | newsletter-send (adapter) | |
| `BREVO_API_KEY`, `BREVO_FROM_NAME`, `BREVO_FROM_EMAIL` | newsletter-send (adapter) | From-name defaults `ISNESI` |
| `SAFEGUARDING_ENCRYPTION_KEY` | safeguarding-* | Base64-encoded 256-bit AES-GCM key for case-note encryption |

## Non-env configuration

| File | Controls |
|---|---|
| `supabase/config.toml` | Local stack: exposed schemas (deliberately excludes `safeguarding`), auth settings (public sign-up disabled, invite-only staff) |
| `src/lib/permissions/admin-nav.ts` | The single admin module map (route, permission, tables) — a module must be declared here to appear in the sidebar |
| `src/proxy.ts` | CSP directives, session-refresh cookie handling, admin/login route behavior |
| `next.config.ts` | Security headers, `images.remotePatterns` (Supabase Storage host only), `/sw.js` caching, `no-store` on private routes |
| `src/app/(public)/layout.tsx` | Public ISR window: `revalidate = 300` (5 minutes) |
| `vitest.config.ts` | Test discovery: `src/**/*.test.{ts,tsx}` + `supabase/functions/**/*.test.ts`, node environment |

## Defaults behavior when unset

Understanding the intended behavior when config is missing:

- App boots with partial/zero configuration: public pages show real empty
  states; admin dashboard shows "Database not connected"; nothing is faked.
- `POST /api/cron/publish-scheduled` returns 503 while `CRON_SECRET` unset —
  by design it fails closed.
- The donate page keeps online giving closed until the MoMo configuration is
  detected as present.
- `newsletter-send` returns 502 until `NEWSLETTER_PROVIDER` is set.
- Safeguarding UI surfaces a fail-closed state while Edge Functions are not
  deployed/configured.
