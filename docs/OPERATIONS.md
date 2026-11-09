# Operations runbook

Verified 2026-11-09 against commit `63a801a`. Scope: what an operator of a
deployed ISNESI instance can actually do with what this repo provides. Where
the repo provides nothing, that is stated.

## Health

`GET /api/health` (no auth, `no-store`):

- `200 {"status":"ok","checks":{"supabase":"configured","database":"ok","privilegedWorkflows":"configured"},"timestamp":...}` when Supabase is configured and the database answers a head count on `site_settings`.
- `503 {"status":"degraded",...}` otherwise; booleans only — no keys, hosts or counts are exposed.

`privilegedWorkflows` means both `SUPABASE_SERVICE_ROLE_KEY` and
`CRON_SECRET` are set in the server environment.

## Data stores and access

Everything lives in one Supabase project:

- Postgres `public` schema (content, finance, newsletter, audit) — read from
  the app via anon/cookie clients under RLS.
- Private `safeguarding` schema — reachable only by Edge Functions with the
  service-role key; never exposed via the API schemas.
- Storage buckets: `public-media` (cleared-for-public files only).

Database operations run through scripts that read `.env.local`:
`npm run db:push` (migrations), `npm run db:types` (regenerate TypeScript
schema types after migrations change), `npm run db:seed` (seed media/rows,
idempotent).

## Scheduled publishing

`POST /api/cron/publish-scheduled` with `Authorization: Bearer <CRON_SECRET>`.
Any external scheduler (hosting platform cron, GitHub Actions on a schedule, a
manual POST while testing) works — nothing in this repo provisions one.
Rate limit: 30/h per IP. Wrong/absent secret → 401; unset `CRON_SECRET` → 503
(no scheduling happens).

## Logs

Logs go to the runtime console of wherever the Next.js server runs (the
app has no explicit log shipping), and Edge Function logs to the Supabase
dashboard's function invocations view. There is no centralized logging,
revealing, retention, or alerting in this repo. If you need to trace the
business events, query the database directly:
`audit_events` (trigger-maintained, append-only) records changes to important
tables; safeguarding access is logged in `safeguarding.case_access_events`;
newsletter delivery events in `newsletter_events`; payment provider
interactions in `payment_events`.

## Backup and restore

**Nothing exists in this repo.** No backup script, no restore documentation,
no PITR evidence. `supabase/README.md` says to configure backups/PITR at the
Supabase plan level and test restores — treat that as TODO(owner). Until a
restore has been proven, treat all data as unrecoverable beyond point failures.

## Common failure modes (observed in the code)

| Symptom | Likely cause | Where enforced |
|---|---|---|
| Admin dashboard shows "Database not connected" | `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` missing or wrong | `src/lib/env.ts`; UI state |
| Public pages show empty states | Database reachable but no published rows (or anon RLS denies) | honest UI states; `src/lib/supabase/public.ts` guard |
| `/api/cron/publish-scheduled` → 503 | `CRON_SECRET` unset | fail-closed in the route |
| → 401 | bearer doesn't match `CRON_SECRET` | timing-safe compare |
| Cron request → 429 | more than 30/h from one IP | limiter |
| Donate page says giving is closed | `MOMO_*`/service-role config absent on deploy | `src/app/(public)/donate/page.tsx` gate |
| Newsletter send → 502 | `NEWSLETTER_PROVIDER` not set | fail-closed gate in the function |
| Newsletter send/other Edge Function → 503 | required Server secrets missing, or database unreachable | fail-closed reads of `Deno.env` |
| Safeguarding UI refuses everything | Edge Functions not deployed or `SAFEGUARDING_ENCRYPTION_KEY` unset | fail-closed client `src/features/safeguarding/edge-client.ts` |
| Typecheck/rebuild fails with "Cannot find module ... .next/dev/types/validator.ts" after removing a route | stale generated dev types | delete `.next`, rebuild |

## Rollback

Database: migrations are not down-migrating (no down steps are authored).
Rollback of a bad migration means authoring a corrective forward migration.
Application: redeploy the previous build artifact; there is no documented
build artifact retention or image registry in this repo. Edge Functions:
`supabase functions deploy` redeploys the current source; keep a known-good
commit pinned on a branch or tag to redeploy.
