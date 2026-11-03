import type { Metadata } from "next";

import { CmsPageView } from "@/components/public/cms-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Impact",
  description:
    "How ISNESI measures change: participation in inclusive education, support for families and community capacity.",
};

export default function ImpactPage() {
  return (
    <CmsPageView
      slug="impact"
      eyebrow="Our impact"
      fallbackTitle="What our work changes"
      fallbackDescription="We report what changed for children, families and schools — not only what we delivered."
      placeholderSummary="This page holds ISNESI's impact reporting: results by programme, monitoring approach, and the evidence behind published claims."
      placeholderSteps={[
        "An editor creates the page with the slug \"impact\".",
        "Results are added as structured sections, with review notes where required.",
        "Publication follows the same approval workflow as any other page.",
      ]}
    />
  );
}