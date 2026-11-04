# ISNESI — public website and administration panel

Production foundation for the ISNESI public website and staff admin panel: a single
Next.js application backed by Supabase (PostgreSQL, Auth, Row Level Security and
Storage), with an installable PWA shell for the public site.

This is **not** the HTML prototype connected to a database. The prototype and the
specification live in [`docs/reference/`](docs/reference) and are treated as design
input; the application below is the rebuild.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, React 19, Server Components, Server Actions) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4 + ISNESI design tokens |
| UI | shadcn/ui component set in `src/components/ui` (Base UI/RSC-safe variants) |
| Data | Supabase: Postgres, Auth, RLS, Storage, Edge Functions |
| Forms | React Hook Form + Zod (client) and Zod again on the server |
| Icons | lucide-react |
| Tests | Vitest |

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the Supabase values
npm run dev                    # http://localhost:3000
```

The app starts without Supabase configured: public pages render their real
(empty) states and the dashboard shows "Database not connected". Nothing is faked.

### Connecting Supabase

1. Create a project (or run the stack locally — Docker Desktop required):

   ```bash
   npx supabase start      # local Postgres, Auth, Storage, Studio
   npx supabase db reset   # applies supabase/migrations + supabase/seed.sql
   ```

2. Put the project URL and **anon** key in `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Add the service role key to **server-side environment only**
   (`SUPABASE_SERVICE_ROLE_KEY`). Never expose it with a `NEXT_PUBLIC_` prefix.

4. Create the first administrator (see `supabase/README.md`) and assign
   `super_admin`. Staff accounts are invite-only; public sign-up is disabled in
   `supabase/config.toml`.

5. Regenerate database types once the database is reachable:

   ```bash
   npm run db:types    # writes src/types/database.gen.ts
   ```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (flat config, Next core-web-vitals + TS) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:start` / `db:reset` / `db:push` | Supabase CLI wrappers (local stack) |
| `npm run db:types` | Generate `Database` types from the hosted project into `src/types/database.gen.ts` (reads `SUPABASE_DB_PASSWORD`; see `.env.example`) |

## Supabase CLI on Windows

The `supabase` npm wrapper ships platform binaries as optional dependencies, and on
constrained networks that download can fail or arrive corrupted — every command then
dies with `No matching Supabase CLI binary package found for win32-x64`. The local
wrapper at `npm run supabase` handles this: if an official release binary exists at
`.tools/supabase.exe` (git-ignored) it is used via the CLI's documented
`SUPABASE_CLI_BINARY_OVERRIDE` escape hatch. Bootstrap it once:

```bash
node scripts/supabase.mjs install
```

## Database operations against the hosted project

The default database host (`db.<ref>.supabase.co`) resolves IPv6-only, so DB
operations target the **session pooler**. With `SUPABASE_DB_PASSWORD` set in
`.env.local`:

```bash
# 1. Probe the session pooler until "select 1" succeeds — that region is the project's.
#    User = postgres.<project-ref>; replace <urlencoded-password> accordingly.
#    A wrong region reports "tenant/user postgres.<ref> not found".
npm run supabase -- db query --remote "postgresql://postgres.<ref>:<urlencoded-password>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" --read-only "select 1"

# 2. Push migrations
npm run supabase -- db push --remote <pooler-url> --yes

# 3. Generate types (no manual URL needed)
npm run db:types
```

`npm run db:types` always runs against the hosted project (reads
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_DB_PASSWORD`, optional
`SUPABASE_POOLER_REGION` or a full `SUPABASE_DB_URL` override from `.env.local`)
and writes `src/types/database.gen.ts`; `src/types/database.ts` re-exports it and
must never be edited by hand. Migrations are applied with `db push`; seed data is
applied per statement (`db query -f supabase/seed.sql` accepts only one statement
per call).

## Repository layout

```
src/
├── app/
│   ├── (public)/          # public website (ISR, 5-minute revalidate)
│   ├── (auth)/            # sign-in, standalone layout
│   ├── admin/             # admin application: dashboard + module routes
│   ├── api/health/        # operational health endpoint
│   ├── auth/callback/     # Supabase PKCE callback
│   ├── manifest.ts        # PWA manifest
│   ├── robots.ts, sitemap.ts, error.tsx, not-found.tsx
│   └── globals.css        # design tokens + base layer
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── public/            # header, footer, CMS renderers, enquiry form
│   ├── admin/             # shell, navigation, module scaffold
│   └── shared/            # brand mark, service worker registration
├── features/              # one folder per domain: queries, actions, state
├── lib/
│   ├── supabase/          # browser, server, public (stateless), admin, session refresh
│   ├── auth/              # session resolution + route guards
│   ├── permissions/       # permission catalogue, pure checks, admin module map
│   ├── validation/        # Zod schemas shared by client and server
│   ├── security/          # rate limiting
│   └── env.ts, site.ts, format.ts, utils.ts
├── types/database.ts      # typed model of the public schema
└── proxy.ts               # Next 16 proxy (formerly middleware)

supabase/                  # migrations, seed, tests, config, Edge Function docs
docs/reference/            # original prototype HTML and specification
public/                    # icons, brand assets, service worker, offline page
```

## Architecture decisions

**One application, two surfaces.** The public website and admin panel share a
codebase, design tokens and database, but not their shells: `(public)` renders the
marketing chrome, `admin` renders the staff shell, and the two never share a
layout. Separation is enforced by route groups, guards and RLS rather than by
deploying two apps.

**Server-first data access.** Reads happen in Server Components; mutations happen
in Server Actions (`"use server"`). There is no hand-written REST layer to keep in
sync — with the deliberate exception of `/api/health` and the auth callback.

**Two Supabase clients for two jobs.** Public content is read with a *stateless*
anonymous client (no cookies) so pages stay cacheable with ISR. Anything
user-scoped uses the cookie-bound server client, so RLS sees the real caller. The
service-role client exists but is guarded by a runtime check that refuses to run
in a browser.

**Permissions come from the database, not the token.** `getCurrentUser()` resolves
roles and permissions from `user_roles → role_permissions → permissions`, honours
expired grants and the active-profile rule, and is memoised per request. The
sidebar is filtered by permission, and every page re-checks before rendering data.

**One module map.** `src/lib/permissions/admin-nav.ts` declares every admin module
with its route, permission, tables, capabilities and non-negotiable controls. The
sidebar, route guards and scaffold pages all read from it, so a module cannot be
added without stating what it may touch.

## Security model

These are enforced in code, not just documented:

- **`safeguarding` is a private schema.** It is absent from the exposed API
  schemas and grants nothing to `anon`/`authenticated`. The admin UI reaches it
  only through server-side Edge Functions (`src/features/safeguarding/edge-client.ts`
  fails closed while they are undeployed).
- **Public enquiry intake cannot escalate.** The insert omits `status`,
  `assigned_to` and `reference_code`; the RLS policy requires
  `consent_to_contact = true`, `status = 'new'` and `assigned_to is null`.
- **The service worker never sees private data.** `/admin`, `/api`, `/auth` and
  `/login` are bypassed entirely, cross-origin (Supabase) requests are never
  intercepted, and responses marked `private`/`no-store` or carrying `Set-Cookie`
  are never cached.
- **Auth redirects cannot be weaponised.** `safeRedirectPath()` rejects
  protocol-relative, absolute and backslash paths, so `?next=` is not an open
  redirect.
- **Sign-in failures are uniform.** The login action returns one message for any
  credential failure, preventing account enumeration.
- **Security headers** are set in `next.config.ts` (nosniff, frame denial,
  referrer policy, permissions policy, HSTS) and private routes are marked
  `no-store`. A nonce-based CSP is the remaining hardening step.
- **Audit trail.** The database makes `audit_events` append-only and attaches audit
  triggers to the important tables; the application never writes audit rows by hand.

## Progressive web app

- `src/app/manifest.ts` → `/manifest.webmanifest`, installable, public-site only.
- `public/sw.js` → network-first for navigations, cache-first for static assets,
  an offline fallback, and the bypass rules above. Registered in production only.
- `public/offline.html` → self-contained offline screen.
- Icons are generated from the brand logo (`public/icons/`), including a maskable
  variant and an Apple touch icon.

## What is implemented now

- Foundation: Next.js, TypeScript strict, Tailwind v4 tokens, shadcn/ui, ESLint,
  Vitest, environment validation, security headers.
- Data layer: five migrations applied to the hosted project in order, generated
  schema types (`npm run db:types` → `src/types/database.gen.ts`), seed data,
  RLS smoke-test SQL.
- Auth: sign-in/out, PKCE callback, session refresh in the proxy, database-backed
  permission resolution, admin gate and `no-access` handling.
- Admin: permission-aware shell, live dashboard metrics, and every module route
  with guards and documented contracts. Working CRUD is implemented for Pages &
  sections (with publication safety checks and automatic navigation-link
  repair), the Media library (Supabase Storage upload/rights/delete),
  Programmes (bilingual translations, ordering, activation), Stories & news
  (full editorial workflow: draft → review → approval → scheduled/published,
  immutable revisions, independent approvals, re-approval on material change),
  Partners (approval workflow, visibility gate) and Navigation (menus, items,
  nesting, cycle guard).
- Public: home (live programmes, stories, partners), programmes, stories list and
  detail with a safe structured-content renderer, partners, Kids' Corner, donate
  (settings-driven, honest about the missing provider), contact and get-involved
  enquiry flows, CMS-driven About/Impact, 404 and error states.
- PWA, SEO metadata, robots, sitemap, health endpoint.

## What is deliberately not built yet

| Area | State |
|---|---|
| Module CRUD screens | All six website modules are built; remaining modules (users, settings, enquiries, safeguarding, donations, kids-corner, accessibility, audit) still render their documented contract. |
| Scheduled publishing cron | Items can be parked in `scheduled`; a cron job to flip them live is still to come. |
| Edge Functions | Specified in `supabase/functions/README.md`; not deployed. |
| Payments | Tables and provider-neutral fields exist; **no** provider adapter, so no money can move. |
| Newsletter delivery | Signup routes to `newsletter-subscribe`, which does not exist yet, so it fails closed. |
| Safeguarding UI | Blocked on the Edge Functions + an access-matrix test. |
| French UI | Schema supports `en`/`fr`; only English copy is written. |
| CSP | Needs nonce wiring; headers are otherwise in place. |

## Verification

```bash
npm run typecheck   # clean
npm run lint        # clean
npm test            # 46 tests passing
npm run build       # all routes build successfully
```

Tests cover the pure permission logic (including inactive and missing subjects),
the rate limiter and its key derivation, currency/date formatting, the Zod
schemas plus redirect sanitiser, and the media-library path/URL helpers. Security-critical decisions such as "an inactive
profile satisfies no permission" are asserted, not assumed.

## Decisions still open with the organisation

Payment provider, newsletter provider, transactional email, retention schedule,
MFA enforcement policy, backup budget and the French-first content strategy. The
architecture accommodates each without a rebuild; see
`docs/reference/specifications.md` §14.