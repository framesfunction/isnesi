import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared call-to-action band.
 *
 * One brand treatment for every page that ends on a call to action, so the
 * button pair, radius, shadow and hover step stay identical across the site.
 * Use at most two actions; the first action is the primary one.
 */
export type CtaBandAction = {
  label: string;
  href: string;
  emphasis?: "primary" | "secondary";
};

type CtaBandProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions: CtaBandAction[];
  footer?: ReactNode;
};

export function CtaBand({ eyebrow, title, description, actions, footer }: CtaBandProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="relative isolate overflow-hidden rounded-4xl bg-brand p-8 text-white sm:p-12">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-16 size-56 rounded-full border-24 border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 right-10 size-44 rounded-full bg-sun/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-14 top-10 hidden size-24 rounded-full border-14 border-leaf/30 sm:block"
        />
        {eyebrow ? (
          <p className="relative text-xs font-black uppercase tracking-[0.16em] text-sun">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="relative mt-3 max-w-2xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="relative mt-4 max-w-2xl text-white/80">{description}</p>
        ) : null}
        <div className="relative mt-8 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={
                action.emphasis === "secondary"
                  ? "inline-flex min-h-12 items-center rounded-full border-2 border-white px-7 text-sm font-black text-white transition-colors hover:bg-white/10"
                  : "inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-7 text-sm font-black text-ink shadow-[0_5px_0_rgb(203_150_0/0.6)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
        {footer ? <div className="relative mt-6 text-sm text-white/70">{footer}</div> : null}
      </div>
    </section>
  );
}
