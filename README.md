# ISNESI — public website and administration panel

ISNESI is a single Next.js application that provides the public ISNESI website
and the staff administration panel, backed by Supabase (PostgreSQL, Auth,
Row Level Security, Storage and Edge Functions). Staff manage content,
programmes, stories, media, partnerships, enquiries, donations, newsletters,
safeguarding cases, users and settings in `/admin`; public visitors browse
published content and submit enquiries, donations and newsletter sign-ups.

Current status: all code applications build and their unit test suite passes,
but nothing is deployed yet in this repository's control, no CI exists, and
integration points such as provider secrets and Edge Function deployment are
unconfigured. Details: [STATUS.md](STATUS.md).

## Quick start

*PowerShell:*

```powershell
npm install
Copy-Item .env.example .env.local   # then fill in the Supabase values
npm run dev                         # http://localhost:3000
```

*bash:*

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:3000
```

The app starts without Supabase configured: public pages render their real
(empty) states and the dashboard shows "Database not connected". Nothing is
faked. Minimum useful configuration is `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`; the full picture is in
[docs/CONFIGURATION.md](docs/CONFIGURATION.md).

Connecting a Supabase project (local with Docker, or hosted) and creating the
first administrator: [docs/SETUP.md](docs/SETUP.md).

## Stack

| Concern | Choice | Version in use |
|---|---|---|
| Framework | Next.js (App Router, Server Components, Server Actions) | 16.4.4 |
| UI runtime | React, react-dom | 19.3.0 |
| Language | TypeScript (`strict`) | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI kit | shadcn/ui primitives in `src/components/ui` | — |
| Data | Supabase (Postgres, Auth, RLS, Storage, Edge Functions) | supabase-js 2.118.x |
| Forms | React Hook Form + Zod (client) and Zod again server-side | — |
| Tests | Vitest | 5.1.0 |
| Lint | ESLint 9, `eslint-config-next` | 9.x |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (no database needed) |
| `npm run db:start` / `db:reset` | Local Supabase stack via Docker Desktop, through the CLI shim |
| `npm run db:push` | Apply pending migrations to the hosted project (reads `.env.local`) |
| `npm run db:types` | Generate `src/types/database.gen.ts` from the hosted project |
| `npm run db:seed` | Seed reference rows and sample media into the hosted project |

On Windows the `supabase` npm wrapper's platform binary download can fail; the
local shim (`node scripts/supabase.mjs install`) bootstraps a real CLI binary
into the git-ignored `.tools/` folder. All `db:*` scripts route through it.

## Documentation

- [STATUS.md](STATUS.md) — what actually works, what does not, known gaps.
- [REMEDIATION_TRACKER.md](REMEDIATION_TRACKER.md) — security audit findings and their final fix status.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components, data flow, trust boundaries.
- [docs/SETUP.md](docs/SETUP.md) — development setup from a clean machine.
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) — every environment variable, derived from the code.
- [docs/API.md](docs/API.md) — HTTP endpoints and Supabase Edge Functions.
- [docs/TESTING.md](docs/TESTING.md) — test architecture: what is covered, what is not.
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — runbook: health checks, cron, Edge Function deploy.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — how this deploys today (no automated pipeline exists).
- [docs/reference/](docs/reference) — the original prototype and 1.0 specification.
  Design input, not documentation of what was built.
- [supabase/README.md](supabase/README.md) — database migrations, RLS model, first administrator.
- [supabase/functions/README.md](supabase/functions/README.md) — Edge Function contracts and secrets.
- [CONTRIBUTING.md](CONTRIBUTING.md) — conventions used in this repo.
- [SECURITY.md](SECURITY.md) — security model, reporting, limits.
- [CHANGELOG.md](CHANGELOG.md) — built from git history.
- [ROADMAP.md](ROADMAP.md) — explicitly not built yet.
- [DESIGN.md](DESIGN.md) — the design system rules for public pages.

## License

No LICENSE file or license field exists in this repository. Unless an owner
adds one, all rights default to the copyright holder. See the Open Questions
section in [STATUS.md](STATUS.md).
