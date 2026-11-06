import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { getPublicPage, type PublicPageContent } from "@/features/pages/queries";

const SUPPORTED_FALLBACKS: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  privacy: {
    eyebrow: "Your information",
    title: "Privacy notice",
    description: "How ISNESI handles information submitted through this website and shared with our team.",
  },
  terms: {
    eyebrow: "Website terms",
    title: "Terms of use",
    description: "The terms that apply when you browse and use the ISNESI website.",
  },
  accessibility: {
    eyebrow: "Accessibility",
    title: "Our accessibility commitment",
    description: "How we aim to make this website usable for everyone, and how to ask for information in another format.",
  },
  safeguarding: {
    eyebrow: "Child protection",
    title: "Safeguarding statement",
    description: "ISNESI's commitment to protecting children and vulnerable adults who take part in our work.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  const fallback = SUPPORTED_FALLBACKS[slug];
  if (!page && !fallback) return {};

  return {
    title: page?.seoTitle ?? page?.title ?? fallback?.title,
    description: page?.seoDescription ?? page?.excerpt ?? fallback?.description,
  };
}

function fallbackSections(slug: string) {
  if (slug === "accessibility") {
    return [
      {
        heading: "Using this website",
        text: "We aim for clear language, keyboard access, visible focus states, readable contrast and layouts that work across screen sizes. If you cannot access any part of this site, contact us and we will help provide the information in a different format.",
      },
      {
        heading: "Request a different format",
        text: "Tell the team what you need, which page or document is involved, and the format that works for you. We will review the request and respond through the enquiry channel.",
      },
    ];
  }

  if (slug === "privacy") {
    return [
      {
        heading: "Information we collect",
        text: "Information submitted through our forms may include your name, contact details, organisation, enquiry and consent choices. We use it only to respond, administer the relevant activity and meet legal or safeguarding obligations.",
      },
      {
        heading: "Your choices",
        text: "You may ask about the personal information we hold, request a correction, or ask us to limit a non-essential use where applicable law allows. Do not include sensitive case details in a general enquiry.",
      },
    ];
  }

  if (slug === "safeguarding") {
    return [
      {
        heading: "Keeping children safe",
        text: "Safeguarding applies to all ISNESI work with children. Staff, volunteers and partners are expected to follow agreed boundaries, report concerns and never publish information or images about a child without the required consent and review.",
      },
      {
        heading: "If a child is in immediate danger",
        text: "Contact local emergency or child-protection services first. Do not use website enquiry forms to report an immediate safeguarding concern.",
      },
    ];
  }

  return [
    {
      heading: "Using the ISNESI website",
      text: "Use of this website is subject to applicable law and these reasonable-use principles: do not interfere with the service, submit misleading information, attempt unauthorised access, or use published material in a way that harms children, programme participants or staff.",
    },
    {
      heading: "Information and availability",
      text: "We aim to keep information accurate and available, but programme details and organisational services may change. Contact the team before relying on information when a decision or contribution depends on it.",
    },
  ];
}

export default async function CmsPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  const fallback = SUPPORTED_FALLBACKS[slug];
  if (!page && !fallback) notFound();

  const cmsPage: PublicPageContent | null = page;

  return (
    <>
      <PageHero
        eyebrow={fallback?.eyebrow ?? "ISNESI"}
        title={cmsPage?.title ?? fallback!.title}
        description={cmsPage?.excerpt ?? fallback!.description}
      />
      <Section>
        {cmsPage && cmsPage.sections.length > 0 ? (
          <div className="grid gap-10">
            <PageSections sections={cmsPage.sections} />
          </div>
        ) : (
          <div className="grid gap-10">
            {fallbackSections(slug).map((section) => (
              <section key={section.heading} aria-labelledby={`${slug}-${section.heading}`}>
                <h2
                  id={`${slug}-${section.heading}`}
                  className="text-2xl font-black tracking-tight text-brand"
                >
                  {section.heading}
                </h2>
                <p className="mt-3 max-w-2xl leading-7 text-ink-muted">{section.text}</p>
              </section>
            ))}
          </div>
        )}
        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white p-6">
          <div>
            <p className="font-display text-lg font-black text-brand">Need clarification?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Ask the ISNESI team before making a decision based on policy or programme information.
            </p>
          </div>
          <Link
            href="/contact"
            className="ml-auto inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-black text-white"
          >
            Contact ISNESI
          </Link>
        </div>
      </Section>
    </>
  );
}
