import type { ReactNode } from "react";

/**
 * One small, plain-language hint shown under a form field label.
 *
 * Field labels are uppercase and technical by default; this sits beneath them in
 * sentence case to explain, in everyday words, what to type and why. It is
 * purely presentational.
 */
export function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-ink-muted">
      {children}
    </span>
  );
}
