# Deployment

Verified 2026-11-09 against commit `63a801a`. The honest answer first:

**There is no deployment pipeline in this repository.** No `.github/workflows`,
no `vercel.json`, no Dockerfile, no secret store configuration, no deploy
scripts beyond the Supabase DB tooling. What follows is the manual sequence
the codebase implies, and the decisions that are still open.

## What the deployment consists of

1. **Next.js application** (public site + admin) — stateless; needs
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SITE_URL` and server-side `SUPABASE_SERVICE_ROLE_KEY` +
   `CRON_SECRET` (see [CONFIGURATION.md](CONFIGURATION.md)).
2. **Supabase project** — Postgres (migrations), Auth (invite-only staff),
   Storage (`public-media`), Edge Functions + their secrets.
3. **Edge Functions** — 13 functions plus `_shared` modules; deploy with the
   Supabase CLI.

## Sequence today (manual)

### Database
```
npm run db:push            # applies supabase/migrations/<file>.sql files in order
npm run db:types           # regenerate src/types/database.gen.ts afterwards
npm run db:seed            # optional: dummy reference rows + sample media
```
Reads `.env.local` for `SUPABASE_DB_PASSWORD` etc. Uses the AWS session pooler
(host DB host is IPv6-only); region defaults to `aws-0-eu-west-1`, override
with `SUPABASE_POOLER_REGION`.

### Edge Functions
```
npx supabase login
npx supabase link --project-ref <ref>
npx supabase functions deploy <name>        # per function, or deploy all
npx supabase secrets set KEY=value ...      # configure secrets (see below)
```
Function secrets (none of them are in the repo):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, the `MOMO_*` set,
`MOMO_COUNTRY_CODE`, `PAYMENT_WEBHOOK_SECRET`, `NEWSLETTER_PROVIDER` +
provider credentials (`RESEND_*`/`MAILGUN_*`/`BREVO_*`),
`SAFEGUARDING_ENCRYPTION_KEY`. Full list with ownership:
[supabase/functions/README.md](../supabase/functions/README.md).

First run must also execute the rate-limit RPC migration
(`202611090001_rate_limit_buckets.sql`) — it ships in `db:push` order, so a
plain `db:push`-first flow covers both.

### Application
Nothing provisions a host. When one is chosen, the required env matrix is in
[CONFIGURATION.md](CONFIGURATION.md). The cron endpoint needs an external
scheduler — set whatever the host offers (`/api/cron/publish-scheduled`
+ `Authorization: Bearer <CRON_SECRET>`, POST).

## Environment differences

- Local dev runs without any Supabase config: pages render empty states,
  admin login fails at "Database not connected".
- Hosted dev/staging/prod differ only in env values and deployed functions;
  the code asserts fail-closed behavior for missing secrets, so under-declared
  config degrades rather than crashes.

## Verification before calling it deployed

1. `GET /api/health` returns 200 with `database: "ok"`.
2. `supabase functions deploy` output lists all 13 functions with no errors.
3. Vault: secrets visible in `supabase secrets list` minus the app key names.
4. One smoke run: publish a scheduled content item via the cron endpoint with
   the real bearer token.

## Rollback

- Application: redeploy the previous build (no artifact registry maintained
  here); pin the git SHA you deployed with.
- Database: there are no down-migrations. Fix forward with a corrective
  migration.
- Edge Functions: redeploy a known-good commit.

## Open deployment decisions (owner)

- Hosting platform and cron scheduler choice.
- Whether Edge Functions should run in project region matching the database.
- Backups/PITR tier plus restore-drill evidence.
- Environment names (staging/prod), access controls on the Supabase dashboard,
  and who performs deploys.
