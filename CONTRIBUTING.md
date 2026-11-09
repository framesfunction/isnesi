# Contributing

This describes how work actually happens in this repository, observed from the
git history — not an invented process. Verified 2026-11-09.

## Branches

- `main` — history runs directly on it; there has never been a PR workflow in
  this repo (no `.github/workflows`, no protected-branch configuration exists).
- Feature/fix work lands either directly or on short-lived branches such as
  `docs-reset` and `audit-remediation`.

## Commit messages

The history mixes two styles; both are accepted:

- Conventional commits used for the audit and feature work:
  `fix(ISN-005): require auth, amount validation...`, `feat: scheduled
  publishing cron`, `docs: codify the ISNESI design system`.
- Plain descriptive sentences for larger drops:
  `Implement complete money/donation system for ISNESI`.

When fixing a tracked audit finding, use the `fix(ISN-###)` form and explain
root cause, fix, and verification in the body, as `5f41b3a` did.

## Before you open a PR / push

Run the checks CI would run (CI does not exist yet — you are the CI):

```
npm run lint        # expect 0 errors, 0 warnings
npm run typecheck   # 0 errors
npm test            # all tests passing (251 as of 2026-11-09)
npm run build       # the build gate that would have caught the 5f41b3a regression
npm audit --omit=dev
```

If you touched Edge Functions, run their tests too (`npm test` includes them)
and remember that `supabase/functions/**` is not covered by `tsc` — see
STATUS.md Known Gap 4 — so syntax and import mistakes there only surface via
lint or deployment.

If you touched database schema, add a new migration file under
`supabase/migrations/` following the `<yyyymmdd###>_<name>.sql` naming; never
hand-edit earlier migrations (they have shipped to hosted projects). Apply with
`npm run db:push` (targeting a hosted project) or `npm run db:reset` (local
Docker stack).

## Layout conventions

- New admin modules must be declared in `src/lib/permissions/admin-nav.ts`
  (route + permission + tables) before they appear anywhere.
- Server mutations live in `src/features/<domain>/actions.ts` with
  `assertPermission` first and Zod validation from `src/lib/validation`.
- Publication rules for design: [DESIGN.md](DESIGN.md).
- Docs changes: keep facts verified against code; see the honest-docs rules in
  [STATUS.md](STATUS.md) (feature table + Known Gaps must stay current).
