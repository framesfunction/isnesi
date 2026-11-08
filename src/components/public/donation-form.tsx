"use client";

import { useActionState } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonationAction } from "@/app/(public)/donate/action";
import { formatCurrency } from "@/lib/format";

type DonationFormState = {
  status: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: { donationId: string; publicReference: string };
};

export function DonationForm({
  suggestedAmounts,
  defaultCurrency = "XAF",
}: {
  suggestedAmounts?: number[];
  defaultCurrency?: string;
}) {
  const [state, formAction, isPending] = useActionState<DonationFormState, FormData>(
    createDonationAction,
    { status: "idle" },
  );
  if (state.status === "success" && state.data) {
    return (
      <div className="rounded-3xl border-2 border-leaf/30 bg-leaf-soft p-8 text-center">
        <div className="mx-auto size-16 rounded-full bg-leaf flex items-center justify-center mb-4">
          <ArrowRight className="size-8 text-leaf-strong" />
        </div>
        <h2 className="text-2xl font-black text-brand">Donation created</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your donation reference <span className="font-mono font-bold text-brand">{state.data.publicReference}</span>
          has been created and is awaiting payment.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/donations/payment/${state.data.donationId}`}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-strong"
          >
            Complete payment
            <ArrowRight className="size-4 ml-2" />
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-6 py-2.5 text-sm font-bold text-brand hover:bg-brand-soft"
          >
            Create another
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
      noValidate
    >
      <h2 className="text-3xl font-black tracking-tight text-brand">
        Make a donation
      </h2>
      <p className="text-lg text-ink-muted max-w-2xl">
        Your gift helps children with disabilities learn, belong and thrive.
        Every contribution is recorded, receipted and used for the programmes
        you read about on this site.
      </p>

      {state.status === "error" && (
        <div className="rounded-xl border-2 border-coral/30 bg-white p-4 text-sm font-semibold text-coral-strong">
          {state.message}
          {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm text-ink-muted">
              {Object.entries(state.fieldErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amountMinor">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              XAF
            </span>
            <Input
              id="amountMinor"
              name="amountMinor"
              type="number"
              min="100"
              required
              autoComplete="off"
              aria-invalid={Boolean(state.fieldErrors?.amountMinor)}
              aria-describedby={state.fieldErrors?.amountMinor ? "amount-error" : undefined}
              className="min-h-11 pl-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />
            {state.fieldErrors?.amountMinor && (
              <p id="amount-error" className="mt-1 text-xs font-semibold text-destructive">
                {state.fieldErrors.amountMinor}
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {suggestedAmounts?.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  const input = document.getElementById("amountMinor") as HTMLInputElement | null;
                  if (input) input.value = String(amount);
                }}
                className="px-3 py-1.5 rounded-lg border border-line bg-white text-sm text-ink hover:bg-brand-soft hover:text-brand transition-colors"
              >
                {formatCurrency(amount, "XAF")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            type="text"
            defaultValue={defaultCurrency}
            readOnly
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payerPhone">Payer phone number</Label>
          <Input
            id="payerPhone"
            name="payerPhone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+237 6XX XXX XXX"
            aria-invalid={Boolean(state.fieldErrors?.payerPhone)}
            aria-describedby={state.fieldErrors?.payerPhone ? "phone-error" : undefined}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink"
          />
          {state.fieldErrors?.payerPhone && (
            <p id="phone-error" className="mt-1 text-xs font-semibold text-destructive">
              {state.fieldErrors.payerPhone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="donorName">Your name (optional)</Label>
          <Input
            id="donorName"
            name="donorName"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="donorEmail">Your email (optional)</Label>
          <Input
            id="donorEmail"
            name="donorEmail"
            type="email"
            autoComplete="email"
            placeholder="jane@example.org"
            aria-invalid={Boolean(state.fieldErrors?.donorEmail)}
            aria-describedby={state.fieldErrors?.donorEmail ? "email-error" : undefined}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm text-ink"
          />
          {state.fieldErrors?.donorEmail && (
            <p id="email-error" className="mt-1 text-xs font-semibold text-destructive">
              {state.fieldErrors.donorEmail}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="isAnonymous"
          name="isAnonymous"
          type="checkbox"
          className="form-checkbox h-5 w-5 text-brand"
        />
        <Label htmlFor="isAnonymous" className="text-sm text-ink">
          I wish to give anonymously
        </Label>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="bg-brand text-white"
        >
          {isPending ? (
            <>
              <CreditCard className="size-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="size-4 mr-2" />
              Create donation intent
            </>
          )}
        </Button>
        <p className="mt-3 text-xs text-ink-muted">
          Payments are confirmed only by the mobile money provider. You will
          receive a receipt once your donation settles.
        </p>
      </div>
    </form>
  );
}
