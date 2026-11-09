# Changelog

Built from the git history of this repository at commit `63a801a`
(branch `audit-remediation`). No release numbers have ever been tagged, so no
[new] version headings are invented; entries are grouped by the date the
commits landed. Keep a Changelog format; "Added/Changed/Fixed" items name
features and changes that actually shipped in those commits.

Dates span 2026-11-03 to 2026-11-09. The project has not made a public release.

## 2026-11-09 (audit hardening week)

**Fixed**

- ISN-003: Edge Function rate limiting moved from in-memory per-isolate
  buckets to a database-backed distributed counter
  (`app_private.consume_rate_limit`, migration `202611090001`) with automatic
  fallback to the old behavior when the limiter is unavailable. [`f873211`]
- ISN-014: production build could not compile — a pure helper was exported
  non-async from a `"use server"` module. Helper extracted to
  `src/features/finance/refund-status.ts`. [`5f41b3a`…`746225f`]
- ISN-009: approve-refund no longer marks a donation fully refunded when the
  refund was partial; payment status is recomputed from refunded sums. [`5f41b3a`]
- ISN-007: payment-webhook and the publishing cron compare secrets in constant
  time; the cron route fails closed (503) when `CRON_SECRET` is unset and is
  rate-limited. [`72541cf`]
- ISN-006: staff sign-in is rate-limited (5/h/IP) against brute force. [`eabd5d5`]
- ISN-005: `donation-pay-intent` requires an authenticated caller, validates
  the amount against the donation, and refuses to overwrite an existing
  provider transaction. [`bbe45e8`]
- ISN-004: `donation_refunds` gained INSERT/UPDATE/DELETE RLS policies gated on
  `donations.manage` (they had privileges but no policies, default-denying all
  writes). [`ce6ff36`]
- ISN-015: removed the unused, unauthenticated `/api/donations/[donationId]`
  endpoint that exposed donor PII gated only by RLS. [`735b16f`]
- ISN-016: CSP now includes `object-src 'none'`. [`735b16f`]
- ISN-011: duplicated `rateLimit`/`clientIp` logic consolidated into
  `_shared/caller.ts`; two latent compile breaks introduced by that
  consolidation (missing imports in `newsletter-unsubscribe`, imports of
  non-existent exports in the safeguarding functions) found and fixed. [`2c492fd`, `f873211`]
- ISN-001/008/010: the tampered `newsletter-send` Edge Function source was
  restored; sending is paginated (batches of 500), idempotent, and fails
  closed with 502 until `NEWSLETTER_PROVIDER` is configured. [`1f07cfc`]
- ISN-002: Edge Function authorization respects `profiles.is_active` and
  expired `user_roles.expires_at`, mirroring `app_private.has_permission()`. [`ed1481f`]

**Removed**

- Point-in-time audit documents (`AUDIT_REPORT.md`, `REMEDIATION_PLAN.md`,
  `REMEDIATION_REPORT.md`) folded into `REMEDIATION_TRACKER.md`. [`63a801a`]
- Duplicate untracked ISN-004 migration artifact and an unused SMTP import. [`6d7346e`]

## 2026-11-08

**Added**

- Complete money/donation system: campaigns, transactions, refunds and
  per-currency reconciliation in Admin → Donations. [`dd945ba`, `7c8e9d4`]
- Design polish across public and admin surfaces. [`2353140`]

## 2026-11-07

**Added**

- Nonce-based CSP wiring through `src/proxy.ts`; safeguarding access tests;
  newsletter Edge Functions (subscribe/confirm/unsubscribe/send);
  scheduled-publishing cron. [`083bf92`, `771f997`, `f1bb8e4`]
- Mobile-money payments (MTN MoMo Collections), per-currency finance tables and
  a WhatsApp-ready newsletter rendering track. [`799b1b6`]
- Removed the unreferenced broken `enquiry-intake` Edge Function from that
  revision (later restored in a different form). [`41fc175`]

## 2026-11-06

**Added**

- Professional media library and block-based editors; complete public site
  content and seeded sample media. [`2291303`, `9f3bfde`]
- Impact metrics and taxonomy admin modules; Kids' Corner; Partners; Contact,
  Donate, Get involved and Impact pages; stories pagination with honest
  counts; admin navigation polish; full data seeding with comprehensive admin
  delete capability; rich open media seed assets. [`b5339fd`, `1d762ea`, `01763c5`, `e2d285e`, `c96faa3`, `ce35232`, `50029db`, `91df794`, `d2a6eb0`]
- AA-safe strong token steps in the design system and DESIGN.md. [`5fd496c`, `57044c3`]

**Fixed**

- `db:push` behavior on Windows and pending-migration application. [`2ca4b3c`]
- parseEditorBlocks running on the server; admin sidebar hydration mismatch;
  whitespace text-node hydration errors; linked public-media rendering and
  source URL normalization; hosted seed reliability.
  [`0fac3df`, `64e03e8`, `57261d7`, `87ed45d`, `fe29807`, `07f306b`, `50029db`]

## 2026-11-05

**Added**

- Engagement, safeguarding, finance and kids' modules; About and Programmes
  end to end; Impact page end to end. [`8df1bf6`, `6318946`, `b5339fd`]

## 2026-11-04

**Added**

- Core CMS admin modules (pages, programmes, stories, media, partners,
  navigation). [`9b5dc5b`]

**Fixed**

- Server action directives. [`04fb129`]

## 2026-11-03

**Added**

- Scaffold: Next.js 16 + Supabase production foundation, hosted project
  connection, migrations and RBAC. [`f2711bb`, `8fe8f2d`]

[Unreleased]: none — no version tag has ever been cut in this repository.
