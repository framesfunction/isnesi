import type { Metadata } from "next";

import { CmsPageView } from "@/components/public/cms-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description:
    "Who ISNESI is, why we exist, and how we work with families, schools and communities to leave no child behind.",
};

export default function AboutPage() {
  return (
    <CmsPageView
      slug="about"
      eyebrow="About ISNESI"
      fallbackTitle="Who we are"
      fallbackDescription="ISNESI exists so that children with disabilities can learn, belong and thrive in their own communities."
      placeholderSummary="This page presents ISNESI's mission, story, values, leadership and approach to inclusive education."
      placeholderSteps={[
        "An editor creates the page with the slug \"about\" and adds sections.",
        "Sections are ordered, translated and previewed.",
        "A reviewer approves and publishes; the public site then renders the published sections.",
      ]}
    />
  );
}