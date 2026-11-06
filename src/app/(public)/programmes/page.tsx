// app/(public)/programmes/page.tsx
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { EmptyNote } from "@/components/public/empty-note";
import { PageHero, Section } from "@/components/public/page-hero";
import { listProgrammes } from "@/features/programmes/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Programmes",
  description:
    "ISNESI programme areas: inclusive education, special needs support, social innovation, capacity building, advocacy and partnerships.",
};

export default async function ProgrammesPage() {
  const programmes = await listProgrammes();

  return (
    <>
      <PageHero
        eyebrow="Our work"
        title="Programmes that make participation possible"
        description="Explore the programme areas ISNESI delivers, each designed around inclusion, participation and community-led support."
      />

      <Section>
        {programmes.length === 0 ? (
          <EmptyNote title="No programmes published">
            Programme information is loaded from the database. Publish or activate programmes from
            Admin &rarr; Programmes and they will appear here within a few minutes.
          </EmptyNote>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme, index) => (
              <li
                key={programme.id}
                className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-6 -top-6 size-20 rounded-full bg-brand-soft transition-colors group-hover:bg-brand"
                />
                <div className="relative flex items-center gap-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-soft text-2xl leading-none shadow-sm">
                    {programme.icon ?? programme.title.charAt(0)}
                  </span>
                  <span className="font-display text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="mt-5 font-display text-xl font-black text-brand">
                  {programme.title}
                </h2>
                {programme.summary ? (
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{programme.summary}</p>
                ) : null}
                <Link
                  href={`/programmes/${programme.key}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand"
                >
                  Learn more
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
