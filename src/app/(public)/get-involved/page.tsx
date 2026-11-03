import type { Metadata } from "next";

import { EnquiryForm } from "@/components/public/enquiry-form";
import { PageHero, Section } from "@/components/public/page-hero";

export const metadata: Metadata = {
  title: "Get involved",
  description:
    "Volunteer, partner or fundraise with ISNESI and help every child learn, belong and thrive.",
};

const ways = [
  {
    title: "Volunteer",
    body: "Share professional skills, support inclusive classrooms or help at community events.",
  },
  {
    title: "Partner with us",
    body: "Schools, clinics, NGOs and businesses can deliver programmes together with ISNESI.",
  },
  {
    title: "Fundraise",
    body: "Organise a collection at your school, workplace or faith community and direct it to a programme.",
  },
];

export default function GetInvolvedPage() {
  return (
    <>
      <PageHero
        eyebrow="Get involved"
        title="Stand with every child"
        description="There are many ways to contribute. Tell us what you have in mind and the right person will reply."
      />

      <Section>
        <ul className="grid gap-4 sm:grid-cols-3">
          {ways.map((way) => (
            <li key={way.title} className="rounded-3xl border-2 border-line bg-white p-6">
              <h2 className="font-display text-lg font-extrabold text-brand">{way.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{way.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <EnquiryForm
            kinds={["volunteer", "partnership", "other"]}
            title="Tell us how you would like to help"
            description="Choose what fits best and add a short note about your skills, organisation or idea."
          />
          <div className="grid content-start gap-4">
            <div className="rounded-2xl bg-brand-soft p-6">
              <h2 className="font-display text-base font-extrabold text-brand">
                What we ask of volunteers
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-ink-muted">
                <li>Respect child safeguarding and consent requirements.</li>
                <li>Never publish or share images of children without recorded consent.</li>
                <li>Work within the agreement for your role and report concerns promptly.</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-line bg-white p-6">
              <h2 className="font-display text-base font-extrabold text-brand">
                Partner due diligence
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Partnerships are recorded with an approval status. A partner only appears on the
                public website after approval is documented, so no relationship is ever implied.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}