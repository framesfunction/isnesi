# ISNESI — Supabase database implementation

This repository is a first deployable database baseline for the ISNESI public website and admin panel.

## Included

- Supabase Auth profile bootstrap and database-backed RBAC.
- CMS pages, reusable sections, translations, navigation and settings.
- Editorial content, immutable revision snapshots, approvals, categories and tags.
- Programmes, partners, media metadata and rights/consent references.
- General enquiries, donations/payment events/refunds/reconciliation.
- Newsletter subscribers/consent/campaign/event records.
- Kids' Corner resources with safeguarding approval.
- Separate `safeguarding` schema for restricted child referrals and casework.
- Audit events and Storage buckets/policies.

## Important security architecture

1. `public` is the API schema. Every application table has RLS enabled and explicit grants/policies.
2. `safeguarding` is intentionally not in `supabase/config.toml`'s exposed API schemas and has no grants for `anon` or `authenticated`. Do not add it to exposed schemas.
3. Safeguarding UI must call server-side Supabase Edge Functions. Those functions must verify the caller's JWT, check the user's safeguarding role and case assignment/authority, log each access in `safeguarding.case_access_events`, and only then read/write case data using a server-only secret key.
4. Never put the Supabase `service_role` / secret key in browser code, public HTML, mobile apps, or client environment variables.
5. Payment creation and webhook processing must happen server-side. Verify provider signatures, use the provider event ID for idempotency, and never accept a browser's claim that a payment succeeded.
6. Newsletter subscription should use a rate-limited Edge Function with double opt-in and a one-click unsubscribe mechanism. Direct public insert is intentionally not granted.
7. Do not put child medical details, referral narratives, or safeguarding attachments in `general_enquiries`, `public.media_assets`, or ordinary content records.
8. `public-media` is public. Only upload assets cleared for public distribution. Use private buckets for restricted documents.

## Deployment

Requirements: Docker Desktop (for local Supabase), Node.js, and Supabase CLI.

The Supabase CLI is already a dev dependency of this repository, and the
migrations, seed and config live at the repository root in `supabase/`:

```bash
npm run db:start     # npx supabase start
npm run db:reset     # applies supabase/migrations + supabase/seed.sql
```

Inspect the local database in Supabase Studio. Run the verification SQL in `supabase/tests/rls_smoke_tests.sql` and test the application with anon, authenticated, and service-role contexts.

For a hosted project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Do not use the production SQL editor for ad-hoc schema changes once migrations are in use. Commit each migration to version control. Supabase's documented workflow is local migrations, test, then `db push` to the linked project.

## First administrator

Sign up / invite the first administrator using Supabase Auth Dashboard. Then, in the SQL editor or a trusted server-side administrative session, assign the `super_admin` role:

```sql
insert into public.user_roles(user_id, role_id, assigned_by)
select 'AUTH_USER_UUID', r.id, 'AUTH_USER_UUID'
from public.roles r
where r.key = 'super_admin'
on conflict do nothing;
```

Do not expose role assignment to the browser. The production admin UI should call a server-side function that verifies the actor has `users.manage`, records the change, and prevents self-escalation.

## Important implementation notes / follow-up hardening

This is a strong initial database baseline, not a complete production certification. Before opening public forms or processing money:

- Add rate-limited Edge Functions for public enquiry intake, newsletter double opt-in, donation intent creation, payment webhooks, and unsubscribe.
- Add server-side safeguarding functions and a tested case-access authorization matrix.
- Configure Auth email templates, SMTP, allowed redirect URLs, MFA policy, CAPTCHA/anti-abuse, and account recovery.
- Decide retention schedules and implement controlled retention/deletion jobs with legal review.
- Add provider-specific payment adapter after choosing the provider (e.g. Mobile Money/card gateway); provider-neutral tables are ready.
- Add backups/PITR appropriate to the selected Supabase plan and test restores.
- Add explicit locale content for French; the schema supports `en` and `fr`, but translations are not fabricated.
- Review all legal text, privacy notices, child safeguarding procedures and data-protection obligations with qualified local counsel.

## Schema overview

| Area | Main tables |
|---|---|
| Identity & RBAC | profiles, roles, permissions, role_permissions, user_roles |
| CMS | pages, page_translations, page_sections, site_settings, navigation_* |
| Editorial | content_items, content_translations, content_revisions, content_approvals, categories, tags |
| Programmes & partners | programmes, programme_translations, partners, partner_translations |
| Media | media_assets, media_usage, Storage buckets |
| General enquiries | general_enquiries, enquiry_notes |
| Finance | donation_campaigns, donations, payment_events, donation_refunds, finance_reconciliations |
| Newsletter | newsletter_subscribers, newsletter_consents, newsletter_campaigns, newsletter_events |
| Kids' Corner | kids_resources, kids_resource_translations |
| Safeguarding (private schema) | safeguarding.cases, subjects, intake_details, case_notes, case_attachments, case_access_events, case_consents |
| Compliance | audit_events |

## Known boundary

The SQL migrations establish the database structures and baseline authorization.
The Next.js application in `src/` is wired to Supabase Auth and this schema:
public pages read published rows with the anonymous key, the admin application
resolves permissions from the RBAC tables, and public enquiry intake inserts
through the narrow RLS policy.

What remains is privileged workflow code: the Edge Functions listed in
`supabase/functions/README.md` (safeguarding casework, newsletter double opt-in,
payment webhooks). Until those exist, the corresponding UI fails closed rather
than bypassing the security model.
