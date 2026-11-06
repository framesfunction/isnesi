/**
 * Pure support code for the public Get Involved page.
 *
 * Kept free of network access so the enquiry wording (shared by the page copy
 * and the form control) and the structured data the page exposes can be unit
 * tested.
 */

import type { EnquiryTypeInput } from "@/lib/validation/enquiry";

/** Human wording for each enquiry type. One source for form and page copy. */
export const ENQUIRY_TYPE_LABELS: Record<EnquiryTypeInput, string> = {
  volunteer: "I would like to volunteer",
  partnership: "Partnership enquiry",
  contact: "General question",
  media: "Media or press enquiry",
  other: "Something else",
};

export function enquiryTypeLabel(value: string): string {
  return (ENQUIRY_TYPE_LABELS as Record<string, string>)[value] ?? "Enquiry";
}

/** Options for the enquiry type control, in the order the page asks for them. */
export function enquiryTypeOptions(
  kinds: readonly EnquiryTypeInput[],
): { value: EnquiryTypeInput; label: string }[] {
  return kinds.map((value) => ({ value, label: ENQUIRY_TYPE_LABELS[value] }));
}

export type GetInvolvedJsonLdInput = {
  baseUrl: string;
  path: string;
  name: string;
  description: string;
  siteName: string;
};

function normaliseBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function normalisePath(path: string): string {
  const trimmed = path.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, "");
  return withoutTrailing.length === 0 ? "/" : withoutTrailing;
}

/**
 * JSON-LD for the page: a `ContactPage` describing it plus a `BreadcrumbList`
 * matching the on-page breadcrumb. Values are plain strings, so the serialised
 * output cannot carry markup.
 */
export function buildGetInvolvedJsonLd(
  input: GetInvolvedJsonLdInput,
): Record<string, unknown>[] {
  const base = normaliseBaseUrl(input.baseUrl);
  const path = normalisePath(input.path);
  const url = `${base}${path}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: input.name,
      description: input.description,
      url,
      inLanguage: "en",
      isPartOf: {
        "@type": "WebSite",
        name: input.siteName,
        url: base,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Get involved", item: url },
      ],
    },
  ];
}
