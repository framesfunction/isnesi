import { ContentPlaceholder } from "@/components/public/content-placeholder";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { getPublicPage } from "@/features/pages/queries";

type CmsPageViewProps = {
  /** CMS slug for this page, for example "about". */
  slug: string;
  eyebrow: string;
  /** Heading used until the CMS page is published. */
  fallbackTitle: string;
  fallbackDescription: string;
  /** What the finished page will present. */
  placeholderSummary: string;
  placeholderSteps?: string[];
};

/**
 * Shared view for CMS-driven public pages.
 *
 * Renders the published page when it exists; otherwise it explains, honestly,
 * that the page is CMS-managed and not yet published. No marketing copy is
 * fabricated in the fallback state.
 */
export async function CmsPageView({
  slug,
  eyebrow,
  fallbackTitle,
  fallbackDescription,
  placeholderSummary,
  placeholderSteps,
}: CmsPageViewProps) {
  const page = await getPublicPage(slug);

  if (!page) {
    return (
      <>
        <PageHero eyebrow={eyebrow} title={fallbackTitle} description={fallbackDescription} />
        <Section>
          <ContentPlaceholder
            cmsSlug={slug}
            summary={placeholderSummary}
            steps={placeholderSteps}
          />
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow={eyebrow} title={page.title} description={page.excerpt ?? undefined} />
      <Section>
        {page.sections.length === 0 ? (
          <ContentPlaceholder
            cmsSlug={slug}
            summary={placeholderSummary}
            steps={placeholderSteps}
          />
        ) : (
          <PageSections sections={page.sections} />
        )}
      </Section>
    </>
  );
}