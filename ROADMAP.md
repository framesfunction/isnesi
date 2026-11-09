# Roadmap

These are explicitly **not built**. No dates and no promises: each item needs
an owner decision before work starts. Facts, not aspiration.

## Operations and delivery

- **CI pipeline — DONE.** `.github/workflows/ci.yml` runs lint, typecheck,
  Vitest, `next build` and `npm audit` on every push. Remaining backlog: bring
  `supabase/functions/**` under a compiled check (tsc) — blocked today because
  Edge Function sources use Deno globals (`Deno.env`).
- **Deployment target.** No `vercel.json`, Dockerfile, or deploy script exists.
  TODO(owner): choose the host.
- **Pre-deploy integrity checks for Edge Function source** (commit signing or
  file-hash verification in the deploy step) — raised after the ISN-001
  tampering incident.
- **Backups/PITR proof, restore drills, retention schedules.** No backup story
  exists in the repo. TODO(owner): plan tier and restore cadences.
- **Monitoring/alerting** beyond `GET /api/health`: wire the health endpoint to
  real alerting; add cron job monitoring for `publish-scheduled`.

## Verification depth

- **Integration/E2E tests** for payments, refunds, safeguarding casework, and
  RLS-under-JWT. The SQL in `supabase/tests/rls_smoke_tests.sql` needs to be
  converted from manual SQL to an automated harness against a live instance.
- **Provider soak tests**: MTN MoMo sandbox round-trips (token, requesttopay,
  status, refund) and one newsletter adapter.

## Deferred code work

- **Real SMTP adapter** inside Edge Functions (`_shared/providers/smtp.ts` is
  a documented stub that fails closed with a message).
- **Dark-mode toggle for visitors** — the tokens are wired; no UI exists.
- **Removal of `docs/reference/`** after design provenance is no longer
  needed. TODO(owner): decide.

## Open organizational decisions (not engineering)

- Payment provider instance/environment in production, and its legal setup.
- Newsletter sending provider and sender domain warm-up.
- MFA enforcement policy for staff accounts.
- Legal review: privacy notices, child-safeguarding procedures, data-protection
  obligations with qualified local counsel (`supabase/README.md`).
- Security reporting alias (see [SECURITY.md](SECURITY.md) TODO).

Historical audit backlog that is now resolved lives with its fix commits in
[REMEDIATION_TRACKER.md](REMEDIATION_TRACKER.md).
