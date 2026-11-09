# Security

Verified 2026-11-09 against commit `63a801a`. This file states what the
security model is and where its limits are. It deliberately does not claim the
application is "secure".

## Reporting a vulnerability

TODO(owner): no security contact exists in the repository yet. Until an alias
(mailbox or issue channel) is provided, report anything sensitive in private
correspondence with the repository owner rather than a public issue. For
non-sensitive hardening questions, open an issue and link it to
[REMEDIATION_TRACKER.md](REMEDIATION_TRACKER.md).

## How to report

Include: affected file/route/Edge Function, commit hash, how to reproduce, and
(only if you can) a suggested fix. Do not test against data you do not own.

## Security model (what is enforced, and where)

- **Trust boundaries** are mapped in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Authorization is database-backed and re-verified at every layer.**
  Server Components/Actions resolve permissions per request from
  `user_roles → role_permissions → permissions` (expired grants and inactive
  profiles denied); every privileged Edge Function re-verifies the JWT against
  Supabase Auth and re-resolves permissions the same way from the database.
- **RLS is the last line of defense.** All `public` schema tables carry RLS;
  the `safeguarding` schema is excluded from exposed API schemas, grants
  nothing to `anon`/`authenticated`, and is only reachable via Edge Functions
  holding the service-role key.
- **Inputs are validated twice** (client Zod schemas and again inside every
  Server Action), rate-limited per caller, and never trusted to claim a
  payment or identity result.
- **Payment notifications** (`payment-webhook`) compare `x-webhook-secret`
  timing-safely and re-verify the actual request status with MTN MoMo before
  trusting any payload; provider event id makes the webhook idempotent.
- **Cron** (`/api/cron/publish-scheduled`) requires `CRON_SECRET` as a bearer
  token, fails closed when it is unset, and is rate-limited.
- **Rate limiting is distributed**: Edge Functions consume
  `app_private.consume_rate_limit` (shared across isolates) with a documented
  per-isolate fallback.
- **Headers/CSP**: `next.config.ts` sets nosniff, frame-deny, referrer and
  permissions policies plus HSTS; `src/proxy.ts` injects a per-request nonce
  CSP (`default-src 'self'`, nonce'd script/style, `object-src 'none'`,
  `frame-ancestors 'none'`, restricted `connect-src`).
- **The service worker never caches** `/admin`, `/api`, `/auth` or `/login`
  paths, and never intercepts cross-origin (Supabase) requests.
- **Auth redirects** are sanitized (`safeRedirectPath` rejects
  protocol-relative/absolute/backslash paths); sign-in failures return one
  uniform message (no account enumeration).
- **Audit trail** is append-only and maintained by database triggers.

## Known limits — stated plainly

- **Nothing here has been run against deployed infrastructure** from this
  repository. The DB-backed rate limiter migration, RLS policies, and Edge
  Function auth paths are unit-tested, not integration-tested.
- **No distributed rate limiting on the Next.js side.** Sign-in and the
  publishing cron now consume `app_private.consume_rate_limit()` via the
  service-role client (`src/lib/security/distributed-rate-limit.ts`), shared
  across server instances, with a per-instance in-memory fallback when the
  privileged env or the RPC is unavailable — the request is never failed by
  the limiter.
- **CI pipeline now runs on every push** (`.github/workflows/ci.yml`): lint,
  typecheck, Vitest, `next build`, `npm audit`. This is the build gate that
  would have caught the `5f41b3a` regression.
- **The donate page gate** opens online giving when `MOMO_API_USER` plus the
  service-role config are present; the payment capture details live in Edge
  Functions whose secrets must be set at deployment time.
- **No MFA enforcement, no CAPTCHA on public forms, no transactional-email
  provider decision.** These are documented organizational follow-ups in
  `supabase/README.md`.
- **No formal security review of legal/compliance text** has happened; before
  touching real child-safeguarding data, counsel review is a stated
  prerequisite.
- **Email deliverability/adapters** (resend/brevo/mailgun/smtp/ses) have a
  fail-closed contract. `ses` is implemented (AWS SES v2, Signature V4 via
  `fetch`, structurally unit-tested) but has not sent a live message — no AWS
  credentials exist in this environment.

See [STATUS.md](STATUS.md) Known Gaps and
[REMEDIATION_TRACKER.md](REMEDIATION_TRACKER.md) for the complete, current list
of open vulnerabilities and hardening backlog items, including severity and
fix commits.
