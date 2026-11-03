Next.js + TypeScript + Tailwind CSS + shadcn/ui + Supabase is the right stack for ISNESI. I'd use this as the foundation for the real production application, not simply connect the current HTML prototype to a database.

I'd make a few deliberate architectural choices so we don't have to rebuild things later.

## 1. Recommended technology stack

[Next.js Logo Vector - Free Download](https://images.openai.com/static-rsc-4/a667tSbjNodvVwFZ85RoO22tN4iSYbCgLPJCHoiCNfx39y1gkO2XTBbQRC8owkqsQN_WIl0L1MCBLIcnALJtOuki5U5A_8rHK9UaY6RoRm2KMtWlypi5xrCC7Hb3HmjR1vHBUq-1bbnNBDMt9jgQkkMJsbnbfmMlkCLclzMOgNY?purpose=inline)

Next.js — App Router

React, TypeScript, server components, server actions and API routes.

Core

[Logo Tailwind CSS – Logos PNG](https://images.openai.com/static-rsc-4/ZZf-QszePmlq4-QIaarmmR53zQTRsn5GAlIXZ1RWR4HLS8Gnhykc50fjV7IuHlxj9b_0W8-ylfEaLrYAXMyM8U9go_7nC7x25kt8BCh7Gz3u-E-FaB4AYtgqA8Rm-pjvGTob1JyARF9WjMaxYTMXgfcKhUzZqLwPq4zvd_rAP3E?purpose=inline)

Tailwind CSS

Responsive styling, design tokens and consistent layouts.

[shadcn/ui | UILibraries on Sortabase](https://images.openai.com/static-rsc-4/E0kXhANNaclzXzeLrYYDcDeCH_aa5lj3YxB3OaY6M-GRvHAngDzCPRm7MLCR3jxbXXozoozh1o529bVjGgtPAppbZSOA12xTsGGUBGFijkD4o2K-OGLc4qPQF68aXXQTbeBDWKn5KM2UIDgde_xnDPwryZovP3jx1zQo-RUTThA?purpose=inline)

shadcn/ui

Accessible components, forms, dialogs, tables, dropdowns and navigation.

[Supabase - Review, Pricing & Alternatives | Delv](https://images.openai.com/static-rsc-4/Y5ZDSxXptYusc6H-LwOOaZr1NWv-6ygntImLJOKjpPj8gi7OO-ulh46sVJe68pAacXXvq-aTuWbHCQovewzGDpgVcsJzw4P2NDGIRmNGQr8cG17fL3q3QkbhUsuBD8Wjm_ApkkhY2VZF0beqJvbGpHfIjw9gN_44Snv9ComAw_I?purpose=inline)

Supabase

PostgreSQL, Auth, Row Level Security, Storage, database functions and Edge Functions.

Core

[How to Use Vercel - Getting Started Guide (2026) | Delv](https://images.openai.com/static-rsc-4/II9DBEprjDf0_Y2RIUGxgZ4bjOULzr-2p-vKNBRgqy7HlRqGOMqEpPcOwUNksEJ5cF_VNDkA9VOZEQMGM7tEd68wU6Qq1Ie8oBMWk56TuhpHeXCmYhRbaAIW1gPry2H2caHr25d3R9XsGDeBbGjL3gVZdw_ZqTY_kipySshbK7A?purpose=inline)

Vercel

Deployment, preview environments and hosting for Next.js.

[lucide CDN by jsDelivr - A CDN for npm and GitHub](https://images.openai.com/static-rsc-4/V1DZBJAzEjmQ29XIVfHh2RQbx5JiXE8rLTzg4bVkBEQTK510yudn06zTIl20og1JrY8J_GW7R8SS0i3BGBhVZIKpgU_W5vd3hw7waw_Q3OFxBFhNxzt6FXyGmzVBLd_euLpflsw0EB_ml0lP9VQhGnM8rWalKMg6VWydVHY-GLQ?purpose=inline)

Lucide + React Hook Form + Zod

Icons, form state, validation and type-safe input handling.

## 2. Application architecture

My recommendation is to start with one Next.js application containing both the public website and the administration panel.

That avoids maintaining two separate applications and makes shared content, authentication, design tokens and routing easier to manage.

```
ISNESI
│
├── Public Website
│   ├── Home
│   ├── About
│   ├── Programmes
│   ├── Impact
│   ├── Stories & News
│   ├── Get Involved
│   ├── Donate
│   ├── Partners
│   └── Contact
│
├── Admin Application (/admin)
│   ├── Dashboard
│   ├── Pages & Sections
│   ├── Programmes
│   ├── Stories & News
│   ├── Media Library
│   ├── Partners
│   ├── Navigation & Footer
│   ├── Enquiries
│   ├── Safeguarding
│   ├── Donations
│   ├── Newsletter
│   ├── Kids' Corner
│   ├── Users & Permissions
│   ├── Site Settings
│   ├── Accessibility
│   └── Audit Log
│
└── Supabase
    ├── PostgreSQL
    ├── Authentication
    ├── Row Level Security
    ├── Storage
    ├── Edge Functions
    └── Private Safeguarding Schema
```

## 3. PWA capabilities

Yes, let's make the application installable as a Progressive Web App.

| Feature               | Implementation                             |
| --------------------- | ------------------------------------------ |
| Web app manifest      | `app/manifest.ts`                          |
| Service worker        | Custom service worker                      |
| Install experience    | Browser-supported installation             |
| App icons             | ISNESI icon set                            |
| Offline support       | Cached application shell and static assets |
| Update management     | Version-aware service worker               |
| Responsive experience | Mobile, tablet and desktop                 |
| Push notifications    | Optional future capability                 |

Important security decision: The admin panel must not cache private records, authentication tokens, safeguarding information, donations or sensitive API responses in the service worker. Offline support should be limited to safe static resources and an appropriate offline screen.

## 4. Proposed project structure

```
isnesi/
├── public/
│   ├── icons/
│   ├── images/
│   ├── fonts/
│   ├── manifest.json
│   └── sw.js
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── manifest.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── public/
│   │   ├── admin/
│   │   └── shared/
│   │
│   ├── features/
│   │   ├── pages/
│   │   ├── programmes/
│   │   ├── editorial/
│   │   ├── media/
│   │   ├── partners/
│   │   ├── enquiries/
│   │   ├── safeguarding/
│   │   ├── donations/
│   │   ├── newsletter/
│   │   └── users/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   ├── validation/
│   │   └── utils/
│   │
│   └── types/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── tests/
│   └── seed.sql/
│
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 5. How we'll build it

I recommend this implementation sequence:

1. Foundation and project scaffolding

   Next.js, TypeScript, Tailwind, shadcn/ui, linting, environment configuration and application layouts.
2. Supabase connection

   Connect the existing database migrations, configure Supabase clients, authentication, sessions and protected routes.
3. RBAC and security

   Implement role-aware navigation, permissions, server-side authorization and RLS enforcement.
4. Admin dashboard and CMS

   Convert the existing admin design into real pages with working database-backed CRUD, validation and publishing workflows.
5. Public website integration

   Connect public pages to published CMS content, translations, programmes, media and navigation.
6. Sensitive workflows and integrations

   Safeguarding Edge Functions, enquiries, newsletter, donation processing, payment webhooks and audit logging.
7. PWA, testing and deployment

   Service worker, manifest, accessibility, security testing, production deployment and backup verification.

The Supabase SQL implementation we already prepared becomes our database foundation. It still needs to be applied to your actual Supabase project and tested; it has not yet been deployed.

## 6. One important decision before scaffolding

I recommend a single repository and a single Next.js application initially, with clean separation between the public website and admin features.
