# Remediation Tracker

Permanent record of the vertical red-team audit and every remediation applied
after it. This document supersedes and replaces the earlier point-in-time
artifacts (`AUDIT_REPORT.md`, `REMEDIATION_PLAN.md`,
`REMEDIATION_REPORT.md`), whose verified facts have been folded in here.

Status values: TODO / IN PROGRESS / FIXED / FALSE POSITIVE / BLOCKED / NEEDS HUMAN / REMOVED.

Last updated: 2026-11-09 · Branch `audit-remediation` · Head at last verification: `735b16f`.

## Baseline (clean main, before remediation)

| Check | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| `eslint` | FAIL | 1 error: `supabase/functions/newsletter-send/index.ts` parsing error (tampered base64 file — ISN-001 confirmed) |
| `vitest` | PASS | 205 passed, 17 files |
| `npm audit --omit=dev` | UNKNOWN | WSL environment blocked npm; earlier run showed 0 vulnerabilities |
| `next build` | NOT RUN | Environment could not complete the build during the audit |

## Final Verification (after all fixes)

| Check | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| `eslint` | PASS | 0 errors, 0 warnings |
| `vitest` | PASS | 251 tests, 24 files (up from 205: ISN-005, ISN-006, ISN-009, ISN-003 additions) |
| `npm audit --omit=dev` | PASS | 0 vulnerabilities |
| `next build` | **PASS** | All routes build (previously unverified, then broken by ISN-014; both now resolved). Required one `.next` cache clear after route removal — stale generated dev type validator referenced the deleted route |

## Findings — Final Status

| ID | Severity | Category | Location | Status | Commit | Test |
|:---|:---|:---|:---|:---|:---|:---|
| ISN-001 | 🔴 CRITICAL | Supply chain / Code integrity | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-002 | 🔴 CRITICAL | AuthZ / Broken access control | `supabase/functions/_shared/caller.ts`, `_shared/safeguarding.ts` | FIXED | ed1481f | caller.test.ts |
| ISN-003 | 🟠 HIGH | Rate limiting / DoS | `supabase/functions/_shared/caller.ts` + all 13 function call sites | **FIXED (late)** | f873211 | caller.test.ts (ISN-003 block, 4 tests) |
| ISN-004 | 🟠 HIGH | Data integrity / AuthZ | `supabase/migrations/202611080002_donation_refunds_rls_write_policies.sql` | FIXED | ce6ff36 | donation-refund-rls.test.ts |
| ISN-005 | 🟠 HIGH | IDOR / Payment hijack | `supabase/functions/donation-pay-intent/index.ts` | FIXED | bbe45e8 | donation-pay-intent.test.ts |
| ISN-006 | 🟡 MEDIUM | Auth / Brute force | `src/features/auth/actions.ts` | FIXED | eabd5d5 | actions.test.ts |
| ISN-007 | 🟡 MEDIUM | Crypto / Timing | `payment-webhook`, `api/cron/publish-scheduled`, `src/lib/security/timing-safe.ts` | FIXED | 72541cf | timing-safe.test.ts |
| ISN-008 | 🟡 MEDIUM | Reliability / DoS | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-009 | 🟡 MEDIUM | Correctness / Payments | `src/features/finance/actions.ts` → `src/features/finance/refund-status.ts` | FIXED | 5f41b3a, 746225f | actions.test.ts (ISN-009 block) |
| ISN-010 | 🟡 MEDIUM | Correctness | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-011 | 🔵 LOW | Code quality | `supabase/functions/_shared/*`, newsletter-*, enquiry-intake, safeguarding-* | FIXED | 2c492fd, f873211 | per-function tests |
| ISN-012 | 🔵 LOW | AuthZ / Session | `src/lib/auth/session.ts` | DOCUMENTED | | — |
| ISN-013 | ℹ️ INFO | Observability | — | DOCUMENTED | | — |
| ISN-014 *(new)* | 🟠 HIGH | Build / Ship-blocker | `src/features/finance/actions.ts` | FIXED | 746225f | vitest + `next build` green |
| ISN-015 *(new)* | 🟡 MEDIUM | Unauthenticated PII endpoint | `src/app/api/donations/[donationId]/route.ts` | **REMOVED** | 735b16f | — (endpoint deleted) |
| ISN-016 *(new)* | 🔵 LOW | CSP hardening | `src/proxy.ts` | FIXED | 735b16f | eslint/typecheck |

## Post-fix findings detail (not part of the original audit)

### ISN-014: non-async export inside a `"use server"` module (HIGH — ship-blocker)
The ISN-009 fix (5f41b3a) introduced `export function computeRefundPaymentStatus(...)`
inside `src/features/finance/actions.ts`, which begins with `"use server"`.
Next 16 requires every export of a Server Actions module to be an async
function; Turbopack rejected the build ("Server Actions must be async
functions"). The unit tests still passed because Vitest does not enforce the
rule, which is exactly the kind of regression the yet-to-exist CI/build gate
should catch.
**Fix:** pure helper moved to `src/features/finance/refund-status.ts`; the
action imports it, and the test imports the new module. `npm run build` now
passes end-to-end (all routes).

### ISN-015: unused unauthenticated donor-PII endpoint (MEDIUM)
`GET /api/donations/[donationId]` had no caller anywhere in the codebase, no
handler-level auth, and returned donor PII (name, email, payer phone) gated
only by RLS. Removed outright as dead attack surface. Rebuild required a
single `.next` cache clear because a stale generated dev validator still
referenced the deleted route.

### ISN-016: missing `object-src` in the CSP (LOW)
Audit backlog item 5. `buildCsp` in `src/proxy.ts` now includes
`object-src 'none'`.

### Latent compile breaks surfaced while implementing ISN-003 (LOW)
Two Edge Functions could not have worked in a deployed environment, despite
lint/typecheck/test going green in the app:
1. `newsletter-unsubscribe/index.ts` had **no import statements at all** — it
   referenced `serviceRequest` unresolved.
2. The four `safeguarding-*` functions imported `clientIp, rateLimit` from
   `_shared/safeguarding.ts`, which never exported them.
Both were remnants of the ISN-011 consolidation. Fixed in f873211 by moving
the imports to `_shared/caller.ts` and converting every rate-limit guard to
`await enforceRateLimit(...)`. To catch this class of defect, Edge Function
sources should be included in the TypeScript check config — backlog.

## ISN-003 implementation note

`enforceRateLimit(key, limit, windowMs)` in `_shared/caller.ts`:
1. POSTs an atomic upsert to `app_private.consume_rate_limit` (new RPC in
   migration `202611090001_rate_limit_buckets.sql`) — the bucket is now shared
   across all isolates, making the documented per-hour limits global.
2. On any limiter failure (network error, RPC missing, env absent) it falls
   back to the old per-isolate in-memory bucket, so a limiter outage degrades
   gracefully instead of failing legitimate requests.

Count summary: CRITICAL 2/2 FIXED; HIGH 3/3 FIXED (ISN-003 via the late
complete fix); MEDIUM 6/6 resolved (incl. ISN-015 REMOVED); LOW 2/2
FIXED; DOCUMENTED 2; post-audit findings: 3, all resolved.

## Remaining backlog

1. Live-database verification: run `supabase/tests/rls_smoke_tests.sql` and an
   actual `db push` + `db reset` against a Supabase instance; nothing in this
   repo has ever run against deployed infrastructure (migration
   `202611090001` included).
2. Integration/E2E tests for payments, refunds, safeguarding, and RLS-with-JWT
   (ISN-013 follow-up; `ISN-003` only has unit coverage of the fallback path,
   not a live DB round-trip).
3. CI pipeline — lint, typecheck, Vitest, `next build`, `npm audit` now run on
   every push via `.github/workflows/ci.yml`. Remaining: bring
   `supabase/functions/**` under a compiled check (tsc) — blocked today
   because Edge Function sources use Deno globals (`Deno.env`).
4. Payment provider + newsletter provider go-live: secrets, sandbox
   verification, adapter soak test (no live traffic has ever been exercised).
5. Backups/PITR evidence, retention schedules, MFA policy (organizational items).
6. `ses` newsletter adapter — implemented (`supabase/functions/_shared/providers/ses.ts`,
   AWS SES v2, Signature V4 via `fetch`, structurally unit-tested) but not
   exercised against live AWS (no credentials in this environment).
7. Newsletter-send rate limit — now configurable via
   `NEWSLETTER_SEND_RATE_LIMIT` / `NEWSLETTER_SEND_RATE_WINDOW_MS` (defaults
   5/h and 1 hour).

## Post-tracker implementation notes

- `src/lib/env.ts` `readRaw()` did not read `CRON_SECRET` although
  `serverEnvSchema` requires it, so `getServerEnv()`,
  `isServiceRoleConfigured()` and `isAdminClientAvailable()` always failed:
  the cron route could never publish and the service-role client could never
  be constructed. Fixed by reading `CRON_SECRET` in `readRaw()`.
- Distributed rate limiting on the Next.js side: sign-in (`signInAction`) and
  the publishing cron now consume `app_private.consume_rate_limit()` via the
  service-role client (`src/lib/security/distributed-rate-limit.ts`), shared
  across server instances, with a per-instance in-memory fallback when the
  privileged env or the RPC is unavailable — the request is never failed by
  the limiter.

## Concurrency note

The audit, this tracker, and ISR/finance work were produced across overlapping
working sessions. All verification numbers above reflect the committed tree at
`735b16f` after a clean `npm run build`, `npm run typecheck`, `npm run lint`,
`npm test`, and `npm audit --omit=dev`, run 2026-11-09.

## Superseded artifacts

`AUDIT_REPORT.md`, `REMEDIATION_PLAN.md`, and `REMEDIATION_REPORT.md` were
point-in-time working documents. Their verified facts are captured in this
tracker's tables and notes; anything not verifiable against the code was
dropped. Notably, REMEDIATION_REPORT claimed that a `validateProductionEnv()`
build-time check had been integrated into `next.config.ts` — that was false
(there is no such call), and the ruled-out idea contradicts the documented
design rule in `src/lib/env.ts` that a missing variable must fail at the point
of use, never during `next build`.
