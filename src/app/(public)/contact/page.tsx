import type { Metadata } from "next";

import { EnquiryForm } from "@/components/public/enquiry-form";
import { PageHero, Section } from "@/components/public/page-hero";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ISNESI about programmes, partnerships, media enquiries or general questions.",
};

const expectations = [
  {
    title: "What happens next",
    body: "Your message is stored in the enquiries queue. A staff member triages it, assigns an owner and replies using the contact details you provide.",
  },
  {
    title: "Your information",
    body: "We only ask for what we need to reply. Enquiries are kept separate from safeguarding casework and are never published.",
  },
  {
    title: "Accessibility",
    body: "If any part of this site is difficult to use, tell us and we will provide the information in another format.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the ISNESI team"
        description="Questions about our work, a partnership idea, or a media request — send us a message."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <EnquiryForm kinds={["contact", "media", "other"]} title="Contact ISNESI" />

          <div className="grid content-start gap-4">
            {expectations.map((item) => (
              <div key={item.title} className="rounded-2xl border-2 border-line bg-white p-5">
                <h2 className="font-display text-base font-extrabold text-brand">{item.title}</h2>
                <p className="mt-2 text-sm text-ink-muted">{item.body}</p>
              </div>
            ))}

            <div className="rounded-2xl border-2 border-coral/40 bg-white p-5">
              <h2 className="font-display text-base font-extrabold text-brand">
                Reporting a concern about a child
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Do not use this form. Contact local emergency or child-protection services
                immediately. ISNESI handles referrals through a separate, restricted channel with
                authorised safeguarding officers.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}