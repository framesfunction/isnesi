# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Both equally: staff administering the site (content editors, finance, safeguarding officers, communications, media, programme managers, auditors) and public visitors (parents, donors, partners, community members). Staff work inside `/admin` to manage content, programmes, stories, media, partners, enquiries, donations, newsletters, kids' resources, users, settings, accessibility and audit. Public visitors browse the public website — home, about, programmes, impact, stories & news, get involved, donate, partners, kids' corner, contact — and submit enquiries.

## Product Purpose

ISNESI is the central management system for the public ISNESI website: a real content and operations management system, not a dashboard. Every important action connects to persistent backend data, enforces permissions, and produces an audit record. Authorised staff manage all public-facing content through the administration panel; public visitors consume published content and submit enquiries, donations and newsletter signups.

## Positioning

Inferred: a single Next.js application containing both the public website and the staff admin panel, sharing one codebase, design tokens and database, with separation enforced by route groups, guards and RLS rather than two deployed apps. Child safeguarding is a private schema isolated from ordinary enquiries and public content; permissions resolve from the database (`user_roles → role_permissions → permissions`), not from the auth token. Public content reads use a stateless anonymous client so pages stay cacheable with ISR; user-scoped actions use the cookie-bound server client so RLS sees the real caller.

## Operating Context

Staff workflows: create/edit/publish pages and sections; manage programmes (bilingual translations, ordering, activation); run an editorial workflow (draft → review → approval → scheduled/published, immutable revisions, independent approvals, re-approval on material change); moderate partners through an approval/visibility gate; manage navigation menus with cycle guard and broken-link detection; administer donations, transactions and reconciliation; draft/schedule/queue newsletter campaigns (delivery not yet connected); handle safeguarding cases through private Edge Functions; review access logs and audit events.

Public visitor flows: browse programmes, stories, impact metrics, partners and kids' resources; submit an honest safeguarding-first enquiry form; donate (online giving opens once MTN MoMo provider secrets are set); sign up for the newsletter (campaigns can be drafted, approved, scheduled and queued but not yet delivered).

Environments: local Supabase stack via Docker Desktop, or a hosted Supabase project targeted through the session pooler. Deployment target is inferred: Vercel (per `docs/reference/stack.md` §1).

## Capabilities and Constraints

- Confirmed: Next.js 16.4 App Router, React 19, TypeScript strict, Tailwind CSS v4 with ISNESI design tokens, shadcn/ui, Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions), React Hook Form + Zod, lucide-react, Vitest, PWA shell for the public site, ISR (5-minute revalidate) on public pages, nonce-based CSP implemented in `src/proxy.ts`, security headers in `next.config.ts`.
- Open with the organisation: payment provider, newsletter provider, transactional email, retention schedule, MFA enforcement policy, backup budget. The architecture accommodates each without a rebuild (`docs/reference/specifications.md` §14).
- Online giving stays closed until `MOMO_*` and `PAYMENT_WEBHOOK_SECRET` are set; the donate page is honest about the missing provider.
- WCAG 2.2 AA target, with manual testing in addition to automated checks.
- Currency: public-facing currency may be XAF, but financial tables retain an explicit currency code.
- Public sign-up is disabled; staff accounts are invite-only with `super_admin` for the first administrator.
- Privileged workflows (newsletter double opt-in/sending, donation intents, payment webhook, four `safeguarding-*` casework functions) are implemented as Supabase Edge Functions but await deployment and their secrets.

## Brand Commitments

- Name: ISNESI.
- Brand palette (from `src/app/globals.css`): brand `#1b3fa0` (deep blue), brand-strong `#142b69`, brand-soft `#f1f5ff`; cream `#fffdf5` page background; ink `#182443`, ink-muted `#4d5a72` text; line `#e6e8ef`; leaf `#2e9e4f` / leaf-strong `#1d6b35` / leaf-soft `#eaf7ef`; sun `#ffc83d` / sun-soft `#fff6de`; coral `#f47768` / coral-strong `#c43e46` / coral-strongest `#8f2119`.
- Fonts: Inter (sans), Nunito (display).
- Light-first palette; dark mode wired for shadcn/ui but not offered to visitors yet (a site-wide theme toggle is a later task).
- Visible amber focus outline `#a35a00`; skip link; reduced-motion preference respected.

## Evidence on Hand

- `README.md` — full product documentation (stack, scripts, repository layout, architecture decisions, security model, PWA, what is implemented / not built / open decisions, verification).
- `DESIGN.md` — incumbent design system (brand tokens, contrast rules, page shell, signature card, chips, buttons, empty states, lists/pagination, motion, copy rules).
- `docs/reference/stack.md` — original prototype HTML and stack recommendation.
- `docs/reference/specifications.md` — foundational functional requirements and backend architecture specification (v1.0).
- `supabase/migrations/` - ordered migrations (see the folder for the current count); `supabase/seed.sql` - seed data (dummy records).
- `src/types/database.gen.ts` — generated schema types; `src/lib/permissions/admin-nav.ts` — one module map for admin modules.
- `public/brand/` and `public/icons/` — brand assets and icon set.
- 205 tests passing; typecheck and lint clean; all routes build successfully.

## Product Principles

- One application, two surfaces: public website and admin panel share codebase, tokens and database, never share a layout.
- Server-first data access: reads in Server Components, mutations in Server Actions; no hand-written REST layer except `/api/health` and the auth callback.
- Two Supabase clients for two jobs: stateless anonymous client for cacheable public reads; cookie-bound server client for user-scoped actions under RLS; service-role client guarded against browser use.
- Permissions from the database, not the token; memoised per request; sidebar filtered by permission; every page re-checks before rendering data.
- One module map: every admin module declares route, permission, tables, capabilities and non-negotiable controls.
- Safeguarding is a private schema; absent from exposed API schemas; admin UI reaches it only through server-side Edge Functions that fail closed while undeployed.
- Public enquiry intake cannot escalate: insert omits `status`, `assigned_to`, `reference_code`; RLS requires `consent_to_contact = true`, `status = 'new'`, `assigned_to is null`.
- Sign-in failures are uniform (one message for any credential failure) to prevent account enumeration.
- Audit trail is append-only; the application never writes audit rows by hand.

## Accessibility & Inclusion

WCAG 2.2 AA target, with manual testing in addition to automated checks. Requirements include alternative text, keyboard accessibility, visible focus states, skip navigation, colour contrast, reduced motion support, captions and transcripts, form labels, accessible heading hierarchy, responsive layouts, and accessibility review records.
