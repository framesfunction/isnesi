import { MapPin, Phone, Mail, Globe, Clock } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyNote } from "@/components/public/empty-note";
import { PageHero, Section } from "@/components/public/page-hero";
import { listPublicCenters, type PublicCenter } from "@/features/centers/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Centers",
  description:
    "Visit an ISNESI center near you. Addresses, phone numbers, opening hours and directions for each location.",
};

function CenterCard({ center }: { center: PublicCenter }) {
  return (
    <li className="flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1">
      {center.logoUrl ? (
        <Image
          src={center.logoUrl}
          alt={`${center.name} logo`}
          width={200}
          height={64}
          unoptimized
          loading="lazy"
          className="max-h-16 w-auto max-w-full object-contain mb-4"
        />
      ) : (
        <div className="grid size-14 place-items-center rounded-xl bg-brand-soft font-display text-xl font-black text-brand ring-1 ring-line mb-4">
          {center.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]!.toUpperCase())
            .join("") || "•"}
        </div>
      )}
      <h3 className="font-display text-lg font-black text-brand">{center.name}</h3>
      <address className="mt-3 text-sm leading-6 text-ink-muted font-normal">
        {center.address}
        {center.city ? `, ${center.city}` : ""}
      </address>
      {center.phone ? (
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted">
          <Phone className="size-4 shrink-0" />
          <a
            href={`tel:${center.phone}`}
            className="font-bold text-brand hover:underline"
          >
            {center.phone}
          </a>
        </p>
      ) : null}
      {center.email ? (
        <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-muted">
          <Mail className="size-4 shrink-0" />
          <a
            href={`mailto:${center.email}`}
            className="font-bold text-brand hover:underline"
          >
            {center.email}
          </a>
        </p>
      ) : null}
      {center.websiteUrl ? (
        <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-muted">
          <Globe className="size-4 shrink-0" />
          <a
            href={center.websiteUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-bold text-brand hover:underline"
          >
            Visit website
          </a>
        </p>
      ) : null}
      {center.openingHours ? (
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-muted">
          <Clock className="size-4 shrink-0" />
          <span className="font-bold text-ink">{center.openingHours}</span>
        </p>
      ) : null}
      {center.description ? (
        <p className="mt-4 text-sm leading-6 text-ink-muted">{center.description}</p>
      ) : null}
    </li>
  );
}

export default async function CentersPage() {
  const centers = await listPublicCenters();

  return (
    <>
      <PageHero
        eyebrow="Visit us"
        title="Our centers"
        description="Find an ISNESI center near you. Opening hours, phone numbers and directions for each location."
      />

      <Section
        title={centers.length > 0 ? "Our centers" : "Centers"}
        description={
          centers.length > 0
            ? centers.length === 1
              ? "One center is open to the public."
              : `${centers.length} centers welcome children and families.`
            : undefined
        }
      >
        {centers.length === 0 ? (
          <EmptyNote title="No centers published">
            Center locations appear here once an administrator adds them in the
            admin panel.
          </EmptyNote>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </ul>
        )}
      </Section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <p className="text-center text-xs text-ink-muted">
          Need help finding a center?{" "}
          <Link href="/contact" className="font-bold text-brand hover:underline">
            Contact the team
          </Link>
          .
        </p>
      </section>
    </>
  );
}
