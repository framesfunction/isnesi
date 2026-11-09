# Setup

Development setup from a clean machine. Verified 2026-11-09 (commit `5f41b3a`)
on Windows 11 PowerShell with Node 24/npm 10 available; `npm install`,
`npm run dev`, `npm test`, `npm run typecheck`, and the Supabase CLI shim were
executed during verification. Node version numbers below are the floor for what
Next 16 documents; the exact Node version used here was not pinned in the repo.

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 18.x or newer (repo developed on Node 24) | Runs Next 16.4.4, Vitest 5, npm scripts |
| npm | 10.x or newer | Lockfile compatibility |
| Docker Desktop | any recent | **Only** for the local Supabase stack (`npm run db:start` / `db:reset`). Everything else runs without Docker. |
| Git | any recent | Repo access |

Optional but used by `db:*` scripts against a hosted project:
`SUPABASE_DB_PASSWORD` (docs/CONFIGURATION.md).

## Install

```
npm install
```

This installs Next 16.4.4, React 19.3, Tailwind v4, Vitest 5.1, ESLint 9 and
the `supabase` CLI 3.0 wrapper. Nothing is installed globally.

## Configure

```
cp .env.example .env.local      # PowerShell: Copy-Item .env.example .env.local
```

Minimum useful values:

```
NEXT_PUBLIC_SUPABASE_URL=...    # http://127.0.0.1:54321 for local Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The app runs correctly with `.env.local` empty: public pages show honest empty
states, the admin dashboard shows "Database not connected". Required/optional
matrix: [CONFIGURATION.md](CONFIGURATION.md). The `.env.example` file is kept
in sync with everything read from code.

## Run

```
npm run dev          # http://localhost:3000
```

- The public site lives on `/`; the admin on `/admin` (redirects to `/login`
  until you authenticate as staff).
- Dev server port is not overridden anywhere in the repo, so it is the default
  Next.js port 3000.

## Connect Supabase

Two supported paths.

### Path A — local stack (Docker Desktop required)

```
npm run db:start     # boots local Postgres, Auth, Storage, Studio
npm run db:reset     # applies supabase/migrations + supabase/seed.sql
```

Then set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `npm run supabase -- status` or Studio>
```

Both scripts go through `scripts/supabase.mjs`, the CLI shim described in the
root README's "Supabase CLI on Windows" section.

### Path B — hosted project (works without Docker)

1. Create/link a project (see `supabase/README.md` "Deployment").
2. In `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_DB_PASSWORD=<db password>        # for db:push / db:types / db:seed
```

3. Push migrations and optionally seed:

```
npm run db:push             # add -- --dry-run to preview
npm run db:seed             # reference rows + sample media; idempotent
```

Hosted database hosts are IPv6-only, so these scripts target the AWS session
pooler; region defaults to `aws-0-eu-west-1` and is overridden with
`SUPABASE_POOLER_REGION`.

## Create the first administrator

Public sign-up is disabled in `supabase/config.toml`: staff accounts are
invite-only. Create an invited user, then run in Supabase Studio / SQL editor:

```sql
insert into public.user_roles(user_id, role_id, assigned_by)
select '<auth-user-uuid>', r.id, '<auth-user-uuid>'
from public.roles r
where r.key = 'super_admin'
on conflict do nothing;
```

This is a server-side manual step by design.

## Regenerate database types

After every migration:

```
npm run db:types     # writes src/types/database.gen.ts
```

`src/types/database.ts` re-exports the generated file and must never be
hand-edited.

## Run checks

| Command | Expectation |
|---|---|
| `npm run lint` | No errors, no warnings |
| `npm run typecheck` | 0 errors |
| `npm test` | All tests passing (251 in 24 files at verification time) |
| `npm run build` | All routes build (verified at commit `63a801a`) |

## Troubleshooting (only actually observed problems)

- If `next build` fails right after an app route is deleted with a
  "Cannot find module ... .next/dev/types/validator.ts" error, clear the
  `.next` directory and rebuild: the generated dev type cache is
  per-route and keeps stale references.

- `No matching Supabase CLI binary package found for win32-x64` — the npm
  wrapper's platform binary download failed. Fix: `node scripts/supabase.mjs
  install` (places a real binary into the git-ignored `.tools/` folder); all
  `db:*` scripts then use it.
- `tenant/user postgres.<ref> not found` during pooler probes — wrong region.
  Set the correct `SUPABASE_POOLER_REGION` or a full `SUPABASE_DB_URL`.
- Next.js 16 removed `middleware` in favor of `proxy.ts` — if you are
  migrating an older branch, session/cookie/CSP logic lives in `src/proxy.ts`.
