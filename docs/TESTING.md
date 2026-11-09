# Testing

Verified 2026-11-09 against commit `63a801a`: 251 tests in 24 files, all
passing, all runnable with `npm test` — no database, Docker, or network
needed.

## How to run

| Task | Command |
|---|---|
| Full unit suite | `npm test` |
| Watch mode | `npm run test:watch` |
| A single file | `npx vitest run src/features/finance/refund-status.ts` (Vitest accepts path filters) |
| Live RLS guarantees | NOT automated — run `supabase/tests/rls_smoke_tests.sql` manually against a real Supabase instance (SQL editor or `supabase db query`) |

Discovery comes from `vitest.config.ts`: `src/**/*.test.{ts,tsx}` and
`supabase/functions/**/*.test.ts`, node environment, mocks restored between
tests, `@` aliased to `./src`.

## What the suites cover

| Area | Files | What is asserted |
|---|---|---|
| Permission matrix (server) | `src/lib/permissions/can.test.ts` (9) | `can()` least-privilege rules, inactive/missing subjects |
| Safeguarding access matrix | `src/lib/permissions/safeguarding.test.ts` (16) | role/lead/assignment rules |
| Zod schemas | `src/lib/validation/validation.test.ts` (32), `users.test.ts` (16), `kids.test.ts` (19), `finance.test.ts` (21), `donation-refund-rls.test.ts` (5) | enquiry/newsletter/programme/impact/category/tag/taxonomy/user/kid/donation schemas; the refund RLS migration's SQL text is statically asserted (ISN-004) |
| Rate limiting | `src/lib/security/rate-limit.test.ts` (6) | windowed buckets, key derivation |
| Timing-safe compare | `src/lib/security/timing-safe.test.ts` (6) | constant-time secret comparison (ISN-007) |
| Newsletter send logic | `src/lib/supabase/newsletter-send.test.ts` (10) | batching, fail-closed provider gate (ISN-008/010) |
| Formatting | `src/lib/format.test.ts` (10) | currency/date rendering |
| Auth actions | `src/features/auth/actions.test.ts` (3) | sign-in rate limiting (ISN-006) |
| Editorial/enquiry/impact/media/navigation helpers | `editorial/helpers.test.ts` (15), `enquiries/helpers.test.ts` (6), `impact/helpers.test.ts` (16), `media/helpers.test.ts` (10), `navigation/helpers.test.ts` (7) | story types/reading time/JSON-LD builders, enquiry helpers, impact figures, media path/URL helpers, nav link-resolution rule |
| Finance | `src/features/finance/refund-status.ts` tested via `actions.test.ts` (7) and `admin-queries.test.ts` (5) | partial vs full refund status computation (ISN-009); admin metric queries |
| Newsletter rendering | `src/features/newsletter/email.test.ts` (5), `whatsapp.test.ts` (7) | email/WhatsApp adapter text rendering |
| Public component | `src/components/public/story-card.test.tsx` (5) | mark-up/accessibility of the story card |
| Edge Function caller | `supabase/functions/_shared/caller.test.ts` (10) | `is_active`/`expires_at` authorization (ISN-002); DB-backed rate limiter + fallback (ISN-003) |
| Edge Function donation-pay-intent | `supabase/functions/donation-pay-intent.test.ts` (5) | 401 on bad token; 422 amount mismatch; refusal to overwrite `provider_transaction_id` (ISN-005) |

## What is mocked

Every network boundary: Supabase REST/auth endpoints, provider HTTPS calls
(MTN MoMo), `Deno.env`, and Next.js React caches where relevant. That means
the suites prove logic and wiring, not connectivity — by design, so the suite
runs anywhere.

## What is not tested (the honest list)

- Anything against a real Supabase instance. RLS policies have no automated
  equivalent — `supabase/tests/rls_smoke_tests.sql` is the manual proof and
  has no CI hook.
- End-to-end flows: donation→MoMo approve→webhook→receipt; newsletter
  subscribe→confirm→send→deliver; safeguarding case lifecycle.
- Browser behavior: no Playwright/Cypress/E2E layer exists.
- The Edge Functions as module graphs: beyond the tested entry points,
  `supabase/functions/**` is only parsed by ESLint, never type-checked — which
  is how two latent import breaks survived all green checks until the ISN-003
  work surfaced them (STATUS.md Known Gap 4).
- Visual/accessible rendering of the public admin surface beyond the
  StoryCard component test.
