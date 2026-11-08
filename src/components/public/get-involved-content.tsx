import { ArrowRight, Check, Gift, HandHeart, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";

import { CtaBand } from "@/components/public/cta-band";
import { Section } from "@/components/public/page-hero";

/**
 * Designed Get Involved page sections.
 *
 * Follows the same rules as the rest of the public site: one card treatment, one
 * icon chip, one hover step, real links only. Nothing here promises a response
 * time or a role that the organisation has not agreed to.
 */

const CARD = "rounded-[1.75rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,36,67,0.06)]";
const CARD_HOVER = "transition-transform hover:-translate-y-1 focus-within:-translate-y-1";

const WAYS = [
  {
    icon: HandHeart,
    tone: "bg-brand-soft text-brand",
    title: "Volunteer your time",
    body: "Share professional skills, support an inclusive classroom or help at a community event.",
    anchor: "#enquiry",
    cta: "Start a volunteering enquiry",
  },
  {
    icon: HeartHandshake,
    tone: "bg-leaf-soft text-leaf-strong",
    title: "Partner with us",
    body: "Schools, clinics, non-governmental organizations, organizations of persons with disabilities and businesses can deliver programmes together with ISNESI.",
    anchor: "#enquiry",
    cta: "Start a partnership enquiry",
  },
  {
    icon: Sparkles,
    tone: "bg-sun-soft text-ink",
    title: "Fundraise",
    body: "Organise a collection at your school, workplace or faith community and direct it to a programme.",
    anchor: "#enquiry",
    cta: "Tell us about your fundraiser",
  },
  {
    icon: Gift,
    tone: "bg-coral/15 text-coral-strong",
    title: "Give what you can",
    body: "Every contribution opens a door: books, transport, therapy, assistive tools and access.",
    anchor: "/donate",
    cta: "Go to donations",
  },
] as const;

/** Four ways to help, each pointing at the form or the donations page. */
export function WaysToHelp() {
  return (
    <Section
      title="Four ways to help"
      description="Choose what fits you. Every route starts with a short conversation, not a commitment."
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WAYS.map(({ icon: Icon, tone, title, body, anchor, cta }) => {
          const linkClass = "mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline";
          const arrow = (
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          );

          return (
            <li key={title} className={`${CARD} ${CARD_HOVER} group flex flex-col p-6`}>
              <span
                aria-hidden="true"
                className={`inline-grid size-12 place-items-center rounded-2xl ${tone}`}
              >
                <Icon className="size-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-brand">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">{body}</p>
              {anchor.startsWith("#") ? (
                <a href={anchor} className={linkClass}>
                  {cta}
                  {arrow}
                </a>
              ) : (
                <Link href={anchor} className={linkClass}>
                  {cta}
                  {arrow}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

const STEPS = [
  {
    title: "Tell us what you have in mind",
    body: "Use the form below. A short note about your skills, organisation or idea is enough.",
  },
  {
    title: "We match you to a programme",
    body: "The right person reads your message and suggests where you fit best.",
  },
  {
    title: "We agree the terms and safeguards",
    body: "Roles, expectations and safeguarding rules are written down before anything starts.",
  },
  {
    title: "You start, with support",
    body: "You get a named contact and a clear way to raise anything that comes up.",
  },
] as const;

/** What happens between a message and a first day. */
export function HowItWorks() {
  return (
    <Section
      title="What happens next"
      description="Four steps between your message and your first day."
      className="border-y border-line/70 bg-white"
    >
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ title, body }, index) => (
          <li key={title} className={`${CARD} flex flex-col bg-cream p-6`}>
            <span
              aria-hidden="true"
              className="font-display text-5xl font-black leading-none text-brand/15"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-lg font-black text-brand">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const VOLUNTEER_EXPECTATIONS = [
  "Respect child safeguarding and consent requirements.",
  "Never publish or share images of children without recorded consent.",
  "Work within the agreed role and report concerns promptly.",
] as const;

const PARTNER_SAFEGUARDS = [
  "Every partnership is recorded with an approval status.",
  "A partner is listed publicly only once that approval is documented.",
  "Media consent references are recorded before anything is published.",
] as const;

/** Safeguarding expectations and how partnerships are protected. */
export function SafeguardingPanels() {
  return (
    <Section
      title="Safety comes first"
      description="What we ask of everyone who helps, and how partnerships are protected."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-line bg-leaf-soft p-7">
          <h3 className="font-display text-lg font-black text-brand">
            What we ask of everyone who helps
          </h3>
          <ul className="mt-4 grid gap-3">
            {VOLUNTEER_EXPECTATIONS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-leaf text-white"
                >
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.75rem] border border-line bg-sun-soft p-7">
          <h3 className="font-display text-lg font-black text-brand">How we protect partnerships</h3>
          <ul className="mt-4 grid gap-3">
            {PARTNER_SAFEGUARDS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-leaf text-white"
                >
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-xs text-ink-muted">
        The enquiry form is for general enquiries only. Do not use it to report a child at risk:
        contact local emergency or child-protection services immediately, then tell the ISNESI team
        directly.
      </p>
    </Section>
  );
}

const FAQS = [
  {
    question: "Do I need previous experience?",
    answer:
      "No. Roles range from one-off event support to skilled work, and we explain exactly what a role involves before you agree to it.",
  },
  {
    question: "Can I work directly with children?",
    answer:
      "Some roles do involve children. Those roles need safeguarding clearance and recorded consent before you start, and we tell you what that requires.",
  },
  {
    question: "How quickly will I hear back?",
    answer:
      "We usually reply within a few working days. If your message needs a specialist, it is passed to that person rather than left unanswered.",
  },
  {
    question: "Can I report a safeguarding concern here?",
    answer:
      "No. This form is for general enquiries. Contact local emergency or child-protection services immediately, then tell the ISNESI team directly so it can be handled through the safeguarding process.",
  },
] as const;

/** Short, honest answers, using native disclosure elements so it needs no script. */
export function GetInvolvedFaq() {
  return (
    <Section
      title="Before you write to us"
      description="Short, honest answers to the questions we are asked most."
      className="border-y border-line/70 bg-white"
    >
      <ul className="grid gap-3">
        {FAQS.map((faq) => (
          <li key={faq.question}>
            <details className="group rounded-[1.25rem] border border-line bg-cream p-5 open:bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-extrabold text-brand">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl leading-none text-ink-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{faq.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Closing call to action. */
export function GetInvolvedCta() {
  return (
    <CtaBand
      eyebrow="Every contribution counts"
      title="Not sure where you fit? Ask us."
      description="Send a general question and we will point you to the role or programme that suits you."
      actions={[
        { label: "Donate", href: "/donate", emphasis: "primary" },
        { label: "Contact the team", href: "/contact", emphasis: "secondary" },
      ]}
    />
  );
}
