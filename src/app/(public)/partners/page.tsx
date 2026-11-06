import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

import { CtaBand } from "@/components/public/cta-band";
import { EmptyNote } from "@/components/public/empty-note";
import { PageHero, Section } from "@/components/public/page-hero";
import { listPublicPartners, type PublicPartner } from "@/features/partners/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Organisations working alongside ISNESI. Only approved partners with recorded consent are shown publicly.",
};

/** Monogram stands in when a partner has not supplied a logo yet. */
function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className="grid size-14 place-items-center rounded-xl bg-brand-soft font-display text-xl font-black text-brand ring-1 ring-line"
    >
      {initials || "•"}
    </span>
  );
}

function PartnerLogoSlot({ partner }: { partner: PublicPartner }) {
  return (
    <div className="grid h-24 place-items-center rounded-2xl bg-cream ring-1 ring-line">
      {partner.logoUrl ? (
        <Image
          src={partner.logoUrl}
          alt=""
          width={200}
          height={64}
          className="max-h-14 w-auto max-w-[80%] object-contain"
        />
      ) : (
        <Monogram name={partner.name} />
      )}
    </div>
  );
}

function PartnerCard({ partner }: { partner: PublicPartner }) {
  return (
    <li className="flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1">
      <PartnerLogoSlot partner={partner} />
      <h3 className="mt-5 font-display text-lg font-black text-brand">{partner.name}</h3>
      {partner.relationshipType ? (
        <p className="mt-1.5">
          <span className="rounded-full bg-leaf-soft px-3 py-1 text-xs font-bold text-leaf-strong">
            {partner.relationshipType}
          </span>
        </p>
      ) : null}
      {partner.description ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">{partner.description}</p>
      ) : null}
      {partner.websiteUrl ? (
        <a
          href={partner.websiteUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand hover:text-leaf-strong"
        >
          Visit website
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </a>
      ) : null}
    </li>
  );
}

export default async function PartnersPage() {
  const partners = await listPublicPartners();

  return (
    <>
      <PageHero
        eyebrow="Relationships"
        title="Working together for every child"
        description="We publish a partner's name, logo or description only after approval has been recorded in the admin panel."
      />

      <Section
        title={partners.length > 0 ? "Our partners" : "Partner directory"}
        description={
          partners.length > 0
            ? partners.length === 1
              ? "One organisation has recorded approval and public visibility."
              : `${partners.length} organisations have recorded approval and public visibility.`
            : undefined
        }
      >
        {partners.length === 0 ? (
          <EmptyNote title="No partners published">
            Partner profiles appear here once an administrator records approval and switches on public
            visibility. Nothing is shown by default, so a relationship is never implied without
            consent.
          </EmptyNote>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </ul>
        )}
      </Section>

      <CtaBand
        eyebrow="Partnerships"
        title="Could your organisation be our next partner?"
        description="Whether you bring classrooms, expertise, equipment or funding, we start every relationship with a conversation."
        actions={[
          { label: "Start a partnership enquiry", href: "/get-involved" },
          { label: "Questions first? Contact the team", href: "/contact" },
        ]}
        footer="A partnership is only published after both sides record their approval."
      />
    </>
  );
}
