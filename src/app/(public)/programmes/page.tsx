// app/(public)/programmes/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
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
            {programmes.map((programme) => (
              <li
                key={programme.id}
                className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1"
              >
                <div className="relative h-48 w-full overflow-hidden rounded-[1.75rem] bg-muted mb-4 group-hover:scale-105 transition-transform duration-300">
                  {programme.featuredImageUrl ? (
                    <Image
                      src={programme.featuredImageUrl}
                      alt={programme.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-xs text-ink-muted">
                      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-soft text-2xl leading-none shadow-sm">
                        {programme.icon ?? programme.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="mt-3 font-display text-xl font-black text-brand">
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
