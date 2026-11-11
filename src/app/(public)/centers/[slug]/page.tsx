import { MapPin, Phone, Mail, Globe, Clock, Play } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero, Section } from "@/components/public/page-hero";
import { getPublicCenterBySlug } from "@/features/centers/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const center = await getPublicCenterBySlug(slug);
  if (!center) return {};
  return {
    title: center.name,
    description:
      center.description ??
      `Visit ${center.name} — ${center.city ?? center.address}.`,
  };
}

function MediaCard({
  media,
  isCover,
}: {
  media: NonNullable<Awaited<ReturnType<typeof getPublicCenterBySlug>>>["media"][number];
  isCover: boolean;
}) {
  const isVideo = media.mediaType === "video";
  return (
    <div className="relative group rounded-xl border border-line overflow-hidden bg-white">
      {isCover ? (
        <span className="absolute top-3 left-3 rounded-full bg-leaf-soft px-2 py-0.5 text-[10px] font-bold text-leaf-strong">
          Cover
        </span>
      ) : null}
      {isVideo ? (
        <div className="relative h-48 w-full bg-muted">
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted">
            <Play className="size-5 mr-2" /> {media.fileName}
          </div>
        </div>
      ) : (
        media.publicUrl ? (
          <Image
            src={media.publicUrl}
            alt={media.fileName ?? "Center"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="h-48 w-full flex items-center justify-center text-xs text-ink-muted">
            Image
          </div>
        )
      )}
      {media.caption ? (
        <figcaption className="mt-2 px-3 text-xs text-ink-muted">
          {media.caption}
        </figcaption>
      ) : null}
    </div>
  );
}

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const center = await getPublicCenterBySlug(slug);
  if (!center) notFound();

  const coverMedia = center.media.find((m) => m.isCover);
  const galleryMedia = center.media.filter((m) => !m.isCover);

  return (
    <>
      <PageHero
        eyebrow="Visit us"
        title={center.name}
        description={center.description ?? `Find us at ${center.address}.`}
      />

      <Section title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Address
            </p>
            <address className="mt-2 text-sm leading-6 text-ink-muted font-normal">
              {center.address}
              {center.city ? `, ${center.city}` : ""}
            </address>
          </div>
          {center.phone ? (
            <div className="rounded-xl border border-line bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                Phone
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                <Phone className="size-4 shrink-0" />
                <a
                  href={`tel:${center.phone}`}
                  className="font-bold text-brand hover:underline"
                >
                  {center.phone}
                </a>
              </p>
            </div>
          ) : null}
          {center.email ? (
            <div className="rounded-xl border border-line bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                Email
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                <Mail className="size-4 shrink-0" />
                <a
                  href={`mailto:${center.email}`}
                  className="font-bold text-brand hover:underline"
                >
                  {center.email}
                </a>
              </p>
            </div>
          ) : null}
          {center.websiteUrl ? (
            <div className="rounded-xl border border-line bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                Website
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                <Globe className="size-4 shrink-0" />
                <a
                  href={center.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-bold text-brand hover:underline"
                >
                  {center.websiteUrl}
                </a>
              </p>
            </div>
          ) : null}
          {center.openingHours ? (
            <div className="rounded-xl border border-line bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                Opening hours
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                <Clock className="size-4 shrink-0" />
                <span className="font-bold text-ink">{center.openingHours}</span>
              </p>
            </div>
          ) : null}
        </div>
      </Section>

      {/* Hero cover image */}
      {coverMedia?.publicUrl && (
        <Section>
          <div className="relative h-96 w-full rounded-xl border border-line overflow-hidden bg-white">
            <Image
              src={coverMedia.publicUrl}
              alt={`${center.name} — ${coverMedia.caption ?? ""}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
            />
            {coverMedia.caption && (
              <figcaption className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-white/90 text-xs font-bold text-ink">
                {coverMedia.caption}
              </figcaption>
            )}
          </div>
        </Section>
      )}

      {/* Description */}
      {center.description && (
        <Section title="About this center">
          <p className="text-sm leading-7 text-ink-muted max-w-2xl">
            {center.description}
          </p>
        </Section>
      )}

      {/* Gallery */}
      {galleryMedia.length > 0 && (
        <Section title="Gallery">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {galleryMedia.map((media) => (
              <MediaCard key={media.id} media={media} isCover={false} />
            ))}
          </div>
        </Section>
      )}

      <Section className="mt-12">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 rounded-3xl border border-line bg-white p-6 text-center">
          <p className="font-display text-lg font-black text-brand">
            Need clarification?
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Ask the ISNESI team before making a decision based on centre
            information.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-black text-white"
          >
            Contact ISNESI
          </Link>
        </div>
      </Section>
    </>
  );
}
