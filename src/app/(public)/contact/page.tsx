import { Accessibility, Clock, Lock, TriangleAlert } from "lucide-react";
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
    icon: Clock,
    title: "What happens next",
    body: "Your message is stored in the enquiries queue. A staff member triages it, assigns an owner and replies using the contact details you provide.",
  },
  {
    icon: Lock,
    title: "Your information",
    body: "We only ask for what we need to reply. Enquiries are kept separate from safeguarding casework and are never published.",
  },
  {
    icon: Accessibility,
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
            {expectations.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft"
                  >
                    <Icon className="size-5 text-brand" />
                  </span>
                  <h2 className="font-display text-base font-extrabold text-brand">{title}</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{body}</p>
              </div>
            ))}

            <div className="rounded-[1.75rem] border border-coral/40 bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-coral/15"
                >
                  <TriangleAlert aria-hidden="true" className="size-5 text-coral-strong" />
                </span>
                <h2 className="font-display text-base font-extrabold text-brand">
                  Reporting a concern about a child
                </h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
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
