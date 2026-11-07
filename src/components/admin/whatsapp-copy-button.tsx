"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * Copy-to-clipboard button for WhatsApp campaign parts. Distribution is
 * manual until a WhatsApp Business API provider is connected, so the admin
 * copies each part in order into a Broadcast list, Status or group.
 */
export function WhatsAppCopyButton({
  text,
  label = "Copy",
  disabled = false,
  className = "",
}: {
  text: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-line bg-white px-3 text-xs font-black text-brand transition-colors hover:bg-brand-soft disabled:opacity-40 ${className}`}
    >
      {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
