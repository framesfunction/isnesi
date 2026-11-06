// app/(public)/programmes/[key]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { ContentBlocks } from "@/components/public/content-blocks";
import { PageHero, Section } from "@/components/public/page-hero";
import { getProgrammeByKey } from "@/features/programmes/queries";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const programme = await getProgrammeByKey(key);
  if (!programme) return { title: "Programme not found" };

  return {
    title: programme.seoTitle ?? programme.title,
    description: programme.seoDescription ?? programme.summary ?? undefined,
  };
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-leaf">{title}</h2>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-leaf" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const programme = await getProgrammeByKey(key);
  if (!programme) notFound();

  const facts = [
    programme.targetBeneficiaries
      ? { label: "Who we serve", value: programme.targetBeneficiaries }
      : null,
    programme.geographicCoverage
      ? { label: "Where we work", value: programme.geographicCoverage }
      : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  return (
    <>
      <PageHero
        eyebrow="Programme"
        title={programme.title}
        description={programme.summary ?? undefined}
      />

      <Section>
        <Link href="/programmes" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
          ← All programmes
        </Link>

        {programme.featuredImageUrl ? (
          <Image
            src={programme.featuredImageUrl}
            alt=""
            width={1200}
            height={640}
            unoptimized
            className="mt-6 h-auto w-full rounded-3xl border border-line object-cover"
          />
        ) : null}

        {facts.length > 0 ? (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-line bg-white p-5">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <ContentBlocks body={programme.body} />

          <aside className="grid gap-5">
            <BulletList title="Objectives" items={programme.objectives} />
            <BulletList title="Activities" items={programme.activities} />
            <div className="rounded-3xl bg-brand p-6 text-white">
              <h2 className="font-display text-xl font-black">Be part of this work</h2>
              <p className="mt-2 text-sm text-white/80">
                Volunteer, partner or give what you can to support this programme.
              </p>
              <Link
                href="/get-involved"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-sun px-6 text-sm font-black text-ink"
              >
                Get involved
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
