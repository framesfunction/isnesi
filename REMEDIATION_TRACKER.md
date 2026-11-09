# Remediation Tracker

Source: AUDIT_REPORT.md (red-team audit). Status values: TODO / IN PROGRESS / FIXED / FALSE POSITIVE / BLOCKED / NEEDS HUMAN.

## Baseline (clean main, before remediation)

| Check | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| `eslint` | FAIL | 1 error: `supabase/functions/newsletter-send/index.ts` parsing error (tampered base64 file — ISN-001 confirmed) |
| `vitest` | PASS | 205 passed, 17 files |
| `npm audit --omit=dev` | UNKNOWN | WSL environment blocks npm; earlier run showed 0 vulnerabilities |

## Final Verification (after all fixes)

| Check | Result | Notes |
|---|---|---|
| `tsc --noEmit` | PASS | 0 errors |
| `eslint` | PASS | 0 errors (4 pre-existing warnings unrelated to findings) |
| `vitest` | PASS | 247 passed, 24 files |
| `npm audit --omit=dev` | UNKNOWN | WSL environment blocks npm; earlier run showed 0 vulnerabilities |

## Findings — Final Status

| ID | Severity | Category | Location | Status | Commit | Test |
|:---|:---|:---|:---|:---|:---|:---|
| ISN-001 | 🔴 CRITICAL | Supply chain / Code integrity | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-002 | 🔴 CRITICAL | AuthZ / Broken access control | `supabase/functions/_shared/caller.ts`, `_shared/safeguarding.ts` | FIXED | ed1481f | caller.test.ts |
| ISN-003 | 🟠 HIGH | Rate limiting / DoS | `supabase/functions/_shared/caller.ts` | PARTIAL | | |
| ISN-004 | 🟠 HIGH | Data integrity / AuthZ | `supabase/migrations/202611080002_donation_refunds_rls_write_policies.sql` | FIXED | ce6ff36 | donation-refund-rls.test.ts |
| ISN-005 | 🟠 HIGH | IDOR / Payment hijack | `supabase/functions/donation-pay-intent/index.ts` | FIXED | bbe45e8 | donation-pay-intent.test.ts |
| ISN-006 | 🟡 MEDIUM | Auth / Brute force | `src/features/auth/actions.ts` | FIXED | eabd5d5 | actions.test.ts |
| ISN-007 | 🟡 MEDIUM | Crypto / Timing | `supabase/functions/payment-webhook/index.ts`, `src/app/api/cron/publish-scheduled/route.ts`, `src/lib/security/timing-safe.ts` | FIXED | 72541cf | timing-safe.test.ts |
| ISN-008 | 🟡 MEDIUM | Reliability / DoS | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-009 | 🟡 MEDIUM | Correctness / Payments | `src/features/finance/actions.ts` | FIXED | 5f41b3a | actions.test.ts |
| ISN-010 | 🟡 MEDIUM | Correctness | `supabase/functions/newsletter-send/index.ts` | FIXED | 1f07cfc | newsletter-send.test.ts |
| ISN-011 | 🔵 LOW | Code quality | `supabase/functions/_shared/caller.ts`, newsletter-*, enquiry-intake, safeguarding-list-cases | FIXED | 2c492fd | (covered by per-function tests) |
| ISN-012 | 🔵 LOW | AuthZ / Session | `src/lib/auth/session.ts` | DOCUMENTED | | |
| ISN-013 | ℹ️ INFO | Observability | — | DOCUMENTED | | |

## Summary Counts

- CRITICAL: 2 found, 2 FIXED
- HIGH: 3 found, 2 FIXED, 1 PARTIAL (ISN-003 — code centralized; DB-backed distributed counter is backlog)
- MEDIUM: 5 found, 5 FIXED
- LOW: 1 found, 1 FIXED
- DOCUMENTED: 2 (ISN-012, ISN-013)

## Dependency Map

1. ISN-001 must be fixed first (blocked deploy; tampered file breaks ESLint/build)
2. ISN-002 (authz) is foundational — Edge Functions rely on it
3. ISN-004 (refund RLS) — independent migration
4. ISN-005 (pay-intent) — depends on ISN-002's shared caller pattern for auth
5. ISN-006 (login rate limit) — independent
6. ISN-007 (timing-safe + cron) — independent
7. ISN-008/010 (newsletter-send) — combined with ISN-001 fix
8. ISN-009 (refund status) — independent
9. ISN-011 (deduplication) — done after ISN-001/002/005

## Notes

- ISN-003 (HIGH): rateLimit/clientIp/UUID_RE are now centralized in `_shared/caller.ts` (one place to replace), but the bucket is still `globalThis.__isnesiRateBuckets` (per-isolate in-memory). A DB-backed `rate_limit_buckets` table with atomic increments is the proper fix — backlog item.
- ISN-012 (LOW): `getCurrentUser` per-request cache confirmed negligible — every Server Action re-calls `assertPermission` (fresh resolution), Edge Functions do fresh DB checks. No fix required.
- No live Supabase instance available; RLS and Edge Function auth fixes verified statically + via unit tests where possible.