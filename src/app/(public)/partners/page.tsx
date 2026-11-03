import type { Metadata } from "next";

import { PageHero, Section } from "@/components/public/page-hero";
import { listPublicPartners } from "@/features/partners/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Organisations working alongside ISNESI. Only approved partners with recorded consent are shown publicly.",
};

export default async function PartnersPage() {
  const partners = await listPublicPartners();

  return (
    <>
      <PageHero
        eyebrow="Relationships"
        title="Working together for every child"
        description="We publish a partner's name, logo or description only after approval has been recorded in the admin panel."
      />

      <Section>
        {partners.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white p-8">
            <h2 className="text-xl font-black text-brand">No partners published</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Partner profiles appear here once an administrator records approval and switches on
              public visibility. Nothing is shown by default, so a relationship is never implied
              without consent.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <li key={partner.id} className="rounded-3xl border-2 border-line bg-white p-6">
                <h2 className="font-display text-lg font-extrabold text-brand">{partner.name}</h2>
                {partner.relationshipType ? (
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-leaf">
                    {partner.relationshipType}
                  </p>
                ) : null}
                {partner.description ? (
                  <p className="mt-3 text-sm text-ink-muted">{partner.description}</p>
                ) : null}
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-block text-sm font-bold text-brand hover:underline"
                  >
                    Visit website
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}