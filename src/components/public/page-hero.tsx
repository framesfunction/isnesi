import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

/** Consistent page introduction for every public page. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="border-b-2 border-line/70 bg-brand-soft/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16">
        {eyebrow ? (
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="max-w-3xl text-balance text-4xl font-black leading-[1.1] tracking-tight text-brand sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-lg text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div> : null}
      </div>
    </section>
  );
}

type SectionProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Vertical rhythm wrapper for public page sections. */
export function Section({ id, title, description, action, children, className }: SectionProps) {
  return (
    <section id={id} className={["mx-auto w-full max-w-6xl px-5 py-14", className].filter(Boolean).join(" ")}>
      {title || description || action ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-3xl font-black tracking-tight text-brand">{title}</h2>
            ) : null}
            {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}