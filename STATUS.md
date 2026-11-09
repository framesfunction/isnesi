# Status

Last verified: 2026-11-09 against head `bf2ba10` (branch `audit-remediation`;
the application code last changed at `735b16f` — later commits are
documentation only). All checks below were re-run on that tree: `npm test`,
`npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --omit=dev`,
plus a fresh-clone walkthrough of every command in docs/SETUP.md (install,
copy env, dev server start, typecheck, tests, lint) in a separate worktree.

## Feature table

A table is worth little without knowing how each status is defined:

- **DONE** — implemented, reachable, and covered by a test that asserts the key behavior, or exercised directly during this verification.
- **PARTIAL** — implemented but with a specific, stated incompleteness.
- **NOT DONE** — planned or stubbed only.
- **BROKEN** — exists but fails as written; evidence given.
- **UNKNOWN** — could not be verified, with reason.

| Feature | Status | Evidence | Notes |
|---|---|---|---|
| Next.js app scaffolding, strict TypeScript, Tailwind v4 tokens, shadcn/ui | DONE | `npm run typecheck` 0 errors; `tsconfig.json` strict; runs on Next 16.4.4 / React 19.3.0 | — |
| Public website pages (home, about, programmes, impact, stories & news, get involved, donate, partners, kids' corner, contact, CMS `[slug]`, 404/error) | DONE | `src/app/(public)/**`; build produced the route list; each page fetches through `src/lib/supabase/public.ts` with `revalidate = 300` | Render empty (honest) states when Supabase unconfigured; verified in dev |
| Public enquiry form → Edge Function intake | PARTIAL | `src/app/(public)/contact`, `supabase/functions/enquiry-intake/index.ts` | Function is implemented and rate-limited but none of the Edge Functions are deployed to a Supabase project in this repo's control; deployment is manual (`docs/DEPLOYMENT.md`) |
| Auth: sign-in/out, PKCE callback, proxy session refresh, admin gate, no-access state | PARTIAL | `src/app/(auth)/login`, `src/app/auth/callback/route.ts`, `src/proxy.ts`, `src/lib/auth/session.ts` | Implemented end to end but not exercised against a real Supabase Auth instance during this documentation pass (no hosted project was reachable in this environment) |
| Database-backed RBAC (permissions from DB, not token; expired grants and inactive profiles denied) | DONE | `src/lib/permissions/can.ts`, `src/lib/auth/session.ts`, migrated `user_roles`/`role_permissions`; 9 unit tests in `src/lib/permissions/can.test.ts` | Server-side; Edge Function side covered by `supabase/functions/_shared/caller.test.ts` |
| Admin shell with permission-filtered navigation | DONE | `src/components/admin/`; `src/lib/permissions/admin-nav.ts` declares 20 modules; sidebar tests via `can`/`safeguarding` suites | — |
| Admin module: Pages & sections CRUD | PARTIAL | `src/app/admin/pages/**`, `src/features/pages/` | Works against Supabase; publication safety checks and navigation-link repair asserted in code; no automated test touches the pages feature |
| Admin module: Programmes (bilingual, full content model) | PARTIAL | `src/app/admin/programmes/**`, `src/features/programmes/` | Zod schema covered by `src/lib/validation/validation.test.ts`; CRUD itself untested |
| Admin module: Stories & news editorial workflow (draft → review → approval → scheduled/published, revisions, re-approval) | PARTIAL | `src/features/editorial/`, helpers tested in `src/features/editorial/helpers.test.ts` (15 tests) | The state machine is implemented in code; the end-to-end flow has no test |
| Admin module: Media library (Storage upload/rights/delete) | PARTIAL | `src/features/media/`; helpers tested (10 tests in `src/features/media/helpers.test.ts`) | Upload path depends on Storage; not exercised live |
| Admin module: Partners approval + visibility gate | PARTIAL | `src/features/partners/` | No automated test |
| Admin module: Navigation (menus, nesting, cycle guard, broken-link detection) | DONE | `src/features/navigation/` with 7 tests in `src/features/navigation/helpers.test.ts` covering the link-resolution rule | CRUD actions untested, rules tested |
| Admin module: Impact metrics (approval-gated public figures) | PARTIAL | `src/features/impact/` (16 tests: figures, metric values, JSON-LD) | — |
| Admin module: Taxonomies (categories, tags, usage counts) | PARTIAL | `src/features/taxonomy/`; schema tests in validation suite | CRUD untested |
| Admin module: Enquiries inbox | PARTIAL | `src/features/enquiries/` (6 tests on helpers) | — |
| Admin module: Donations (campaigns, transactions, refunds, reconciliation) | DONE | `src/app/admin/donations/**`, `src/features/finance/**`; partial-refund status logic unit-tested in `src/features/finance/actions.test.ts` (ISN-009 block) | Build blocker from `5f41b3a` (non-async export in a `"use server"` module) was fixed in `746225f`; full build now passes |
| Mobile-money donation flow (create/pay intents, webhook re-verification, refunds, receipts) | PARTIAL | `supabase/functions/donation-*`, `payment-webhook`, `_shared/momo.ts` | Implemented against MTN MoMo Collections; tests in `supabase/functions/donation-pay-intent.test.ts` (5) and `_shared/caller.test.ts` (6) cover auth and amount validation, but no live provider call has ever been made from this repo |
| Scheduled publishing (cron) | DONE | `src/app/api/cron/publish-scheduled/route.ts` — 405 on GET, 503 if `CRON_SECRET` unset, `timingSafeEqual` check, 30/h per-IP limit; `src/lib/security/timing-safe.test.ts` (6) plus auth-actions rate-limit tests | Not exercised live (needs a scheduled article + deployed environment) |
| Newsletter double opt-in (subscribe/confirm/unsubscribe Edge Functions) | PARTIAL | `supabase/functions/newsletter-*`; rate limits 5–10/h per IP; tokens are credentials | Implemented; not deployed or exercised live |
| Newsletter delivery (send function + provider adapters) | PARTIAL | `supabase/functions/newsletter-send/index.ts` paginated batches of 500, idempotent, fail-closed 502 without `NEWSLETTER_PROVIDER`; adapters for resend/brevo/mailgun/smtp in `_shared/providers/`; `src/lib/supabase/newsletter-send.test.ts` (10) | No provider configured in this repo; no real e-mail has been sent from these adapters; WhatsApp "ready" means rendered-text + copy-parts UI exists (`src/features/newsletter/whatsapp.test.ts`, 7 tests), not API delivery |
| Safeguarding: private schema + Edge Function casework UI | PARTIAL | `src/features/safeguarding/edge-client.ts` fails closed while functions are undeployed; 16 access-matrix tests; AES-256-GCM note encryption in `_shared/encrypted.ts` | Whole flow depends on deployed functions + `SAFEGUARDING_ENCRYPTION_KEY`; has never run against a live project from this repo |
| PWA (manifest, service worker, offline page, icon set) | PARTIAL | `src/app/manifest.ts`, `public/sw.js`, `public/offline.html` | Production-only registration; install/offline behavior not verified on real devices by this repo's owner |
| SEO (metadata, robots, sitemap, JSON-LD builders) | DONE | `robots.ts`, `sitemap.ts`, JSON-LD builders tested in editorial/enquiries/impact suites | — |
| Security headers (HSTS, nosniff, DENY, referrer, permissions policy) + nonce CSP | DONE | `next.config.ts`, `src/proxy.ts` (CSP now includes `object-src 'none'`) | Verified by reading the builders; header emission exercised in the build's Proxy output |
| Audit trail (append-only, DB triggers) | DONE | `supabase/migrations/202611030005_storage_audit_hardening.sql` + audit feature read-only admin page (`src/app/admin/audit`) | Database-level enforcement; not exercised live in this pass |
| Rate limiting (in-app + Edge Functions) | DONE (with stated fallback) | `src/lib/security/rate-limit.ts` (6 tests) for login (5/h/IP) and cron (30/h); Edge Functions use the DB-backed distributed limiter `enforceRateLimit` (`supabase/functions/_shared/caller.ts`, 4 tests) against `app_private.consume_rate_limit` (migration `202611090001`); Next.js sign-in and cron now also use `src/lib/security/distributed-rate-limit.ts` with the same RPC, falling back to the per-instance in-memory bucket when the privileged env or RPC is unavailable | DB-backed counts are shared across instances/isolates; if the limiter RPC is unavailable both sides degrade to per-instance in-memory instead of failing requests. |
| Dependency health | PARTIAL | `npm audit --omit=dev` result recorded in this file's verification log | See Verification log below |
| CI/CD pipeline | PARTIAL (CI exists; no deployment) | `.github/workflows/ci.yml` runs lint, typecheck, tests, `next build`, `npm audit` on every push. No host configuration or deploy script exists; deployment is manual (docs/DEPLOYMENT.md). | The build gate would have caught the `5f41b3a` regression; deployment itself needs credentials and a platform choice. |
| Deployment | NOT DONE | No deployment target is wired in this repo; `docs/DEPLOYMENT.md` states what exists (nothing automated) | — |
| Integration / end-to-end tests (payments, browser flows, RLS live) | NOT DONE | `supabase/tests/rls_smoke_tests.sql` exists to be run manually against a live instance; no automated integration suite | — |

## Verification log (2026-11-09, commit `63a801a`)

| Check | Result |
|---|---|
| `npm test` | 258 tests passing in 26 files (Vitest) |
| `npm run typecheck` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run build` | PASS — all routes build (verified after a one-time `.next` cache clear; see Known Gaps 10 for the regression lesson) |
| `npm audit --omit=dev` | 0 vulnerabilities |

## Test reality

258 Vitest unit tests in 26 files. They cover:

- Pure permission logic, including inactive-profile and expired-grant denial (9 tests) and the safeguarding access matrix (16 tests).
- Zod validation schemas (enquiry, newsletter, impact metric, programme, category, tag, content taxonomy, users, kids, finance/donations — 88 tests across the validation suite).
- The rate limiter and timing-safe comparison primitives (12 tests), plus the DB-backed distributed limiter and its fallback behavior (8 tests across Edge Functions and Next.js).
- Helper/builder logic for stories, enquiries, impact figures, media, navigation links, newsletter email/WhatsApp rendering (65+ tests).
- Server-action units: auth sign-in rate limiting, refund status computation (`src/features/finance/refund-status.ts`), admin donation queries (15 tests).
- Edge Function entry behavior: `donation-pay-intent` auth and amount checks (5 tests), shared permission caller `is_active`/`expires_at` handling (6 tests), `enforceRateLimit` RPC and fallback paths (4 tests).

Everything mocked is a Supabase client, network fetch, or provider HTTP call. Not tested:

- Anything that talks to a real Supabase instance (RLS policies are only smoke-tested by the SQL in `supabase/tests/rls_smoke_tests.sql`, which must be run manually against a live database — not run during this verification).
- Payment flows, refund approval or newsletter sends end-to-end.
- Any browser/E2E behavior — no Playwright/Cypress suite exists.
- The production build had no CI gate until the `5f41b3a` regression slipped
  through with green tests (fixed in `746225f`); CI now runs `next build` on
  every push (`.github/workflows/ci.yml`), so that class of regression is
  guarded.

## Known gaps

1. **Nothing is deployed.** No Supabase Edge Functions are running on a project
   this repo controls, no database migrations have been pushed against a live
   project by this repo's process, and no host configuration (Vercel or
   otherwise) exists. A CI pipeline now runs lint, typecheck, tests, build and
   dependency audit on every push (`.github/workflows/ci.yml`), but deployment
   itself requires credentials and a platform choice that are not in this repo.
   Every "works when deployed" claim is an inference from code, not evidence.
   The migration `202611090001_rate_limit_buckets.sql` (distributed rate
   limiting) and all other migrations are included.
2. **No integration/E2E tests for money, safeguarding, or RLS-under-JWT.**
   The riskiest paths have zero black-box coverage; RLS policies are only
   smoke-checked by the manual SQL in `supabase/tests/rls_smoke_tests.sql`,
   which nobody has recorded running.
3. **No provider traffic has ever been exercised.** MTN MoMo request-to-pay
   and all newsletter adapters exist only as code; token caching in
   `_shared/momo.ts`, refunds and delivery flows are unproven against the real
   provider (sandbox included).
4. **Edge Function sources are outside the TypeScript check boundary.** The two
   latent compile breaks found during ISN-003 (missing imports in
   `newsletter-unsubscribe`, non-existent imports in the safeguarding
   functions) were fixed in `f873211`. The functions are lint-parsed and their
   entry points are unit-tested, but `supabase/functions/**` is not type-checked
   by `tsc` (Deno globals) — folding it into a compiled check is on the
   backlog (see REMEDIATION_TRACKER).
5. **Backups, retention schedules, MFA policy, transactional e-mail and payment
   provider selection are organizational decisions never closed** (see
   `supabase/README.md` "follow-up hardening"). No documented or executable
   backup/restore procedure exists in this repo.
6. **Dark mode is not offered to visitors** (tokens are wired for it; no
   toggle). A theme toggle is a product/UI decision, not yet taken.

Resolved during this pass (historic detail in REMEDIATION_TRACKER.md):
- `src/lib/env.ts` `readRaw()` did not read `CRON_SECRET` although
  `serverEnvSchema` requires it, so `getServerEnv()`, `isServiceRoleConfigured()`
  and `isAdminClientAvailable()` always failed — the cron route could never
  publish and the service-role client could never be constructed. Fixed by
  reading `CRON_SECRET` in `readRaw()`.
- Distributed rate limiting on the Next.js side: sign-in (`signInAction`) and
  the publishing cron now consume `app_private.consume_rate_limit()` via the
  service-role client (`src/lib/security/distributed-rate-limit.ts`), falling
  back to the per-instance in-memory bucket when the privileged env or the RPC
  is unavailable — the request is never failed by the limiter.
- `ses` newsletter provider implemented (`supabase/functions/_shared/providers/ses.ts`,
  AWS SigV4 via `fetch`, structurally unit-tested; not exercised against live
  AWS — no credentials in this environment) and registered in `ProviderName`.
- Newsletter-send rate limit is now configurable via
  `NEWSLETTER_SEND_RATE_LIMIT` / `NEWSLETTER_SEND_RATE_WINDOW_MS` (defaults 5/h
  and 1 hour).
- CI pipeline (`.github/workflows/ci.yml`) runs lint, typecheck, tests,
  `next build` and `npm audit` on every push — the build gate that would have
  caught the `5f41b3a` regression.
- `5f41b3a` "use server" build break (ISN-014, fixed in `746225f`); per-isolate
  Edge Function rate limiting (ISN-003, fixed in `f873211`); the unused
  unauthenticated donor-PII endpoint `/api/donations/[donationId]` (ISN-015,
  removed in `735b16f`); missing `object-src` in CSP (ISN-016, fixed in
  `735b16f`); two latent Edge Function import breaks (fixed in `f873211`); a
  duplicate untracked ISN-004 migration artifact and the unused SMTP import
  (cleaned in `6d7346e`).

## Not suitable for

Until the gaps above are addressed, ISNESI as it stands in this repo should not be used as:

- A live public donation platform: the payment code has never exchanged a real request with the provider.
- A live child-safeguarding records tool: the private-schema/Edge-Function access path is sound by design and unit-tested, but has never been exercised in a deployed environment.
- A production CMS serving traffic without any CI, monitoring, or automated backup procedure.
- Any deployment whose stored data has not undergone a successful test restore.

## Open Questions for the owner

- TODO(owner): which license applies? No LICENSE file and no package.json license field exist.
- TODO(owner): what is the security/contact alias for vulnerability reports? (SECURITY.md has a placeholder until answered.)
- TODO(owner): what is the production deployment platform when one is chosen? The repo currently specifies none, while code references Infer Supabase-hosted assumptions (session pooler region default `aws-0-eu-west-1`).
- TODO(owner): can `docs/reference/` (the prototype HTML + 1.0 spec) be retired from the repo, or must it remain available for design provenance?
- TODO(owner): which backup/PITR tier is the hosted Supabase project on, and when was a restore last proven?
- TODO(owner): which region is the production Supabase project in (scripts default to `aws-0-eu-west-1`)? Confirm or override via `SUPABASE_POOLER_REGION`.
