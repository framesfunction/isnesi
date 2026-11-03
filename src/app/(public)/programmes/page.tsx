import type { Metadata } from "next";

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
        description="Each programme is managed in the admin panel, with English and French translations supported by the database."
      />

      <Section>
        {programmes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white p-8">
            <h2 className="text-xl font-black text-brand">No programmes published</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Programme information is loaded from the database. Publish or activate programmes from
              Admin → Programmes and they will appear here within a few minutes.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <li key={programme.id} className="rounded-3xl border-2 border-line bg-white p-6">
                <span aria-hidden="true" className="text-3xl">
                  {programme.icon ?? "•"}
                </span>
                <h2 className="mt-3 font-display text-xl font-extrabold text-brand">
                  {programme.title}
                </h2>
                {programme.summary ? (
                  <p className="mt-2 text-sm text-ink-muted">{programme.summary}</p>
                ) : null}
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  Programme key: {programme.key}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}