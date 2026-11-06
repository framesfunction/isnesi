import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { HelpCallout } from "@/components/admin/help-callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Help & guide" };

type GuideItem = {
  name: string;
  what: string;
  when: string;
  href?: string;
};

type GuideGroup = {
  key: string;
  title: string;
  items: GuideItem[];
};

const GROUP_START: GuideGroup[] = [
  {
    key: "start",
    title: "Start here",
    items: [
      {
        name: "Dashboard",
        what: "A quick operational home screen for counts, workload and shortcuts to work that needs attention.",
        when: "Look at it first when you sign in, then open a specific module to act.",
        href: "/admin",
      },
      {
        name: "Business intelligence",
        what: "Management indicators for website health, public demand, communications, editorial output and fundraising.",
        when: "At management reviews, planning meetings or whenever you need to identify an organisation-wide priority.",
        href: "/admin/intelligence",
      },
      {
        name: "Help & guide",
        what: "This page. Plain-language explanations of every screen.",
        when: "Any time a word or a button is unclear.",
        href: "/admin/help",
      },
    ],
  },
];

const GROUP_WEBSITE: GuideGroup[] = [
  {
    key: "website",
    title: "Website content",
    items: [
      {
        name: "Pages & sections",
        what: "The pages that make up your website, such as About and Contact, plus any page you add yourself.",
        when: "When the text on a page needs to change, or you genuinely need a brand-new page.",
        href: "/admin/pages",
      },
      {
        name: "Programmes",
        what: "The areas of work you run, shown on the Programmes page.",
        when: "When you start, pause or change a programme.",
        href: "/admin/programmes",
      },
      {
        name: "Stories & news",
        what: "Articles, news, announcements and event write-ups.",
        when: "When there is something new to tell the public.",
        href: "/admin/stories",
      },
      {
        name: "Media library",
        what: "The photos, logos and files you are allowed to use, each with its usage rights recorded.",
        when: "Before you use a new image anywhere: upload it here first.",
        href: "/admin/media",
      },
      {
        name: "Partners",
        what: "The organisations you work with and how they are shown publicly.",
        when: "When a partnership starts, changes or ends.",
        href: "/admin/partners",
      },
      {
        name: "Navigation & footer",
        what: "The links in the top menu and the footer of the public site.",
        when: "Rarely. Change this only when a menu link must move or disappear.",
        href: "/admin/navigation",
      },
      {
        name: "Impact metrics",
        what: "The approved numbers shown on the Impact page, each with a source.",
        when: "When reporting figures are signed off. Never publish a number without a source.",
        href: "/admin/impact-metrics",
      },
      {
        name: "Categories & tags",
        what: "Labels used to group stories and news.",
        when: "Only when a genuinely new label is needed; reuse existing ones where you can.",
        href: "/admin/taxonomies",
      },
    ],
  },
];

const GROUP_ENGAGEMENT: GuideGroup[] = [
  {
    key: "engagement",
    title: "People & engagement",
    items: [
      {
        name: "Enquiries",
        what: "Messages people send through the website forms.",
        when: "Check daily and reply. This is the public's main way to reach you.",
        href: "/admin/enquiries",
      },
      {
        name: "Donations",
        what: "Gift records, receipts and reconciliation against the payment provider.",
        when: "When confirming, receipting or reconciling money received.",
        href: "/admin/donations",
      },
      {
        name: "Newsletter",
        what: "The people who signed up for emails, and the campaigns you send.",
        when: "When you send an update, or when someone asks about their subscription.",
        href: "/admin/newsletter",
      },
      {
        name: "Kids' Corner",
        what: "Child-friendly learning resources.",
        when: "When adding a new resource. Publication waits until a safeguarding review is recorded.",
        href: "/admin/kids-corner",
      },
      {
        name: "Safeguarding",
        what: "Restricted child-referral casework. Separate from ordinary enquiries and limited to named officers.",
        when: "Only if you are a trained safeguarding officer. Contact the lead first if unsure.",
        href: "/admin/safeguarding",
      },
    ],
  },
];

const GROUP_ADMINISTRATION: GuideGroup[] = [
  {
    key: "administration",
    title: "Administration",
    items: [
      {
        name: "Users & permissions",
        what: "Staff accounts and what each person is allowed to do.",
        when: "When someone joins, changes role or leaves.",
        href: "/admin/users",
      },
      {
        name: "Site settings",
        what: "Organisation details and technical configuration. Advanced, and rarely changed.",
        when: "Only with guidance from the website administrator.",
        href: "/admin/settings",
      },
      {
        name: "Accessibility",
        what: "Accessibility preferences and the review checklist for the public site.",
        when: "During an accessibility review.",
        href: "/admin/accessibility",
      },
      {
        name: "Audit log",
        what: "A permanent record of who changed what, and when.",
        when: "When investigating a change or answering a compliance question.",
        href: "/admin/audit",
      },
    ],
  },
];

const GROUPS: GuideGroup[] = [
  ...GROUP_START,
  ...GROUP_WEBSITE,
  ...GROUP_ENGAGEMENT,
  ...GROUP_ADMINISTRATION,
];

const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "Page", meaning: "A single screen of the public website, for example About or Contact." },
  {
    term: "Section",
    meaning: "A band of content inside a page: a paragraph, a heading, a list or a highlight.",
  },
  { term: "Draft", meaning: "Saved work that visitors cannot see yet. Safe to edit freely." },
  { term: "Published", meaning: "Live on the public website. Visitors can see it right now." },
  {
    term: "Slug / key",
    meaning: "The short web address of a page, such as /about. It is made for you from the title.",
  },
  { term: "Programme", meaning: "An area of your work, such as Inclusive Education." },
  { term: "Story", meaning: "An article, news item or announcement." },
  { term: "Media asset", meaning: "An image, logo or file stored in the Media library." },
];

const ROLE_GUIDE: { role: string; bestFor: string; note: string }[] = [
  {
    role: "Super Administrator",
    bestFor: "The technical owner responsible for the whole admin system.",
    note: "Use sparingly. This role has broad system access and can manage staff.",
  },
  {
    role: "Website Administrator",
    bestFor: "Day-to-day ownership of the website, users and settings.",
    note: "The usual admin role when someone needs to manage most website areas.",
  },
  {
    role: "Content Editor",
    bestFor: "Writing, reviewing and publishing website stories.",
    note: "Requires an approved publishing arrangement for independent review.",
  },
  {
    role: "Content Contributor",
    bestFor: "Drafting stories and other content without publishing.",
    note: "Work remains a draft until a reviewer takes action.",
  },
  {
    role: "Communications Officer",
    bestFor: "Stories, newsletters, enquiries and public updates.",
    note: "The right role for routine communication work.",
  },
  {
    role: "Finance Officer",
    bestFor: "Donation records, receipts and reconciliation.",
    note: "Should not receive website editing permissions unless the role also requires them.",
  },
  {
    role: "Media Manager",
    bestFor: "Uploading and organising images, documents and their rights records.",
    note: "Keep consent and safeguarding details accurate when using media.",
  },
  {
    role: "Programme Manager",
    bestFor: "Maintaining programme information and programme changes.",
    note: "Usually does not need broad user or settings access.",
  },
  {
    role: "Auditor / Compliance Reviewer",
    bestFor: "Reading audit records and reviewing activity.",
    note: "Typically read-only and should not receive publishing access.",
  },
];

export default async function AdminHelpPage() {
  await requireAdmin("/admin/help");

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Guide"
        title="How to use the admin panel"
        description="A plain-language guide to what every screen does. Nothing here changes your website; it is here to answer questions before you click."
      />

      <div className="mb-6">
        <HelpCallout title="The three rules that keep the website safe">
          <ul className="grid gap-2">
            <li>
              <strong className="text-ink">Nothing is public until you publish it.</strong> Saving a
              change does not put it on the website. Draft work stays hidden.
            </li>
            <li>
              <strong className="text-ink">Most things can be undone.</strong> Unpublishing hides a
              page; deleting removes it for good. Prefer hiding over deleting.
            </li>
            <li>
              <strong className="text-ink">Only change what you understand.</strong> If a word or a
              button is unclear, read this guide or ask the website administrator.
            </li>
          </ul>
        </HelpCallout>
      </div>

      <div className="space-y-6">
        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Your first 10 minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 text-sm text-ink-muted sm:grid-cols-2">
              <li className="rounded-2xl bg-muted p-4">
                <span className="mb-1 block font-black text-brand">1. Check the Dashboard</span>
                Open the Dashboard to see counts and items waiting for attention. Do not make
                changes from a dashboard summary without opening the underlying item first.
              </li>
              <li className="rounded-2xl bg-muted p-4">
                <span className="mb-1 block font-black text-brand">2. Open only one task</span>
                Use the menu on the left or the visible section on small screens. Saving one item
                before moving on prevents accidental changes being missed.
              </li>
              <li className="rounded-2xl bg-muted p-4">
                <span className="mb-1 block font-black text-brand">3. Search before creating</span>
                Check whether the page, programme, story, media asset or partner already exists.
                Creating a duplicate makes the website harder to manage.
              </li>
              <li className="rounded-2xl bg-muted p-4">
                <span className="mb-1 block font-black text-brand">4. Review before leaving</span>
                Use Save, then check the preview, status and important fields. Publish only after the
                item has been checked.
              </li>
            </ol>
          </CardContent>
        </Card>

        {GROUPS.map((group) => (
          <Card key={group.key} className="border border-line">
            <CardHeader>
              <CardTitle className="font-display text-base font-extrabold text-brand">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-4">
                {group.items.map((item) => (
                  <li key={item.name} className="rounded-2xl border border-line p-4">
                    <p className="font-bold text-ink">
                      {item.href ? (
                        <Link href={item.href} className="text-brand hover:underline">
                          {item.name}
                        </Link>
                      ) : (
                        item.name
                      )}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      <span className="font-bold text-ink">What it is: </span>
                      {item.what}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      <span className="font-bold text-ink">When to use it: </span>
                      {item.when}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Common tasks: exactly what to do
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-ink-muted lg:grid-cols-2">
            <div className="rounded-2xl border border-line p-4">
              <p className="font-bold text-ink">Add a staff member</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>The person signs in or creates their account through the normal sign-in process.</li>
                <li>Open <Link href="/admin/users" className="font-bold text-brand hover:underline">Users &amp; permissions</Link>.</li>
                <li>Find the person using Search, then choose the smallest role needed for their work.</li>
                <li>Confirm the roles in the person&apos;s row, and keep the account Active only while they should have access.</li>
                <li>Ask the person to sign out and back in if their menu does not update immediately.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-line p-4">
              <p className="font-bold text-ink">Remove staff access</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Open the person&apos;s account in Users &amp; permissions.</li>
                <li>For temporary absence, keep the account but remove tasks that must wait.</li>
                <li>For a leaver, remove unnecessary roles first, then choose Deactivate.</li>
                <li>Check the Audit log if you need to confirm when the change happened.</li>
              </ol>
              <p className="mt-2 text-coral-strong">Deactivation blocks sign-in and revokes active sessions; it does not delete the audit history.</p>
            </div>
            <div className="rounded-2xl border border-line p-4">
              <p className="font-bold text-ink">Publish a story safely</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Upload or choose the correct rights-cleared media.</li>
                <li>Complete the title, body, category, tags and summary, then Save.</li>
                <li>Check the preview for spelling, names, links, image text alternatives and child-safeguarding concerns.</li>
                <li>Ask a reviewer if approval is required, then Publish from the story editor.</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-line p-4">
              <p className="font-bold text-ink">Respond to a website enquiry</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Open Enquiries and select the oldest unread item that belongs to your area.</li>
                <li>Read it in full and record its outcome through the available status or assignment controls.</li>
                <li>Reply using the organisation&apos;s approved email or contact process.</li>
                <li>Do not copy personal details into an unrelated story, note or public page.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Choose the right staff role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HelpCallout title="Give the least access needed">
              <p>
                A role is a bundle of permissions. It is safer to give someone one role that matches
                their work than to guess which individual technical permissions they need. Never add
                Super Administrator access for routine website editing.
              </p>
            </HelpCallout>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {ROLE_GUIDE.map((entry) => (
                <div key={entry.role} className="rounded-2xl border border-line p-4">
                  <dt className="font-bold text-ink">{entry.role}</dt>
                  <dd className="mt-1 text-ink-muted">
                    <span className="font-bold text-ink">Use for: </span>{entry.bestFor}
                  </dd>
                  <dd className="mt-1 text-ink-muted">{entry.note}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              What happens when you click…
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted">
            <dl className="grid gap-3">
              <div>
                <dt className="font-bold text-ink">Save</dt>
                <dd>Your change is stored. Draft work stays hidden from the public.</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">Publish</dt>
                <dd>The item becomes live on the public website within a few minutes.</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">Unpublish</dt>
                <dd>The item is hidden from the public again. Nothing is lost.</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">Archive</dt>
                <dd>
                  Removed from the public site and any menu links to it are hidden. It is kept, not
                  deleted.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-ink">Delete</dt>
                <dd className="text-coral-strong">Permanent. This cannot be undone.</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              About creating a new page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-ink-muted">
            <HelpCallout tone="caution" title="Most pages already exist">
              <p>
                Home, About, Programmes, Impact, Stories, Get Involved, Partners, Contact, Donate and
                Kids&apos; Corner are already built. Only create a page when you truly need a brand-new
                one; editing an existing page is almost always the right choice.
              </p>
            </HelpCallout>
            <div>
              <p className="font-bold text-ink">When it is necessary</p>
              <ul className="mt-1 grid gap-1">
                <li>• A new policy or legal document, such as a privacy or cookie policy.</li>
                <li>• A one-off campaign or resource page that does not fit an existing page.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-ink">What happens when you create one</p>
              <ul className="mt-1 grid gap-1">
                <li>1. The page is added as a draft. It is not visible to anyone yet.</li>
                <li>2. You add sections (headings, paragraphs, lists) to build its content.</li>
                <li>3. When it is complete, publish it. It then appears on the public site.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="rounded-xl bg-muted p-4">
                <dt className="font-bold text-ink">A menu item is missing</dt>
                <dd className="mt-1 text-ink-muted">The account has not been given that permission or role. Ask an administrator to verify the assignment; access is restricted by role.</dd>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <dt className="font-bold text-ink">A Save or Publish button is unavailable</dt>
                <dd className="mt-1 text-ink-muted">The item may be incomplete, the account may lack approval permissions, or another required field may need attention. Correct the visible validation message or ask for the required role.</dd>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <dt className="font-bold text-ink">A change is not visible yet</dt>
                <dd className="mt-1 text-ink-muted">Confirm it has been published, refresh the public page, and allow a few minutes for caching. A saved draft is still private even when it looks complete.</dd>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <dt className="font-bold text-ink">An error appears after submitting</dt>
                <dd className="mt-1 text-ink-muted">Do not submit repeatedly. Copy the message, check whether the item was saved, and contact the website administrator with the screen name and time of the error.</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Words you will see
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {GLOSSARY.map((entry) => (
                <div key={entry.term}>
                  <dt className="font-bold text-ink">{entry.term}</dt>
                  <dd className="text-ink-muted">{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <HelpCallout title="Who to ask">
          <p>
            Access, role changes and anything you are unsure about are handled by the website
            administrator. Ask a colleague first, then an administrator. Access is only ever granted
            from inside the admin panel, never from the public website.
          </p>
        </HelpCallout>

      </div>
    </div>
  );
}
