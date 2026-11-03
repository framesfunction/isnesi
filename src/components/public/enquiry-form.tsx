"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiryAction } from "@/features/enquiries/actions";
import { initialEnquiryState, type EnquiryFormState } from "@/features/enquiries/state";
import { ENQUIRY_TYPES, enquirySchema, type EnquiryTypeInput } from "@/lib/validation/enquiry";

type FormValues = z.input<typeof enquirySchema>;

const KIND_LABELS: Record<EnquiryTypeInput, string> = {
  volunteer: "I would like to volunteer",
  partnership: "Partnership enquiry",
  contact: "General question",
  media: "Media or press enquiry",
  other: "Something else",
};

type EnquiryFormProps = {
  /** Restrict the enquiry types offered on this page. */
  kinds?: EnquiryTypeInput[];
  title?: string;
  description?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  );
}

export function EnquiryForm({
  kinds = [...ENQUIRY_TYPES],
  title = "Send us a message",
  description = "Tell us how we can help. We usually reply within a few working days.",
}: EnquiryFormProps) {
  const [state, formAction] = useActionState<EnquiryFormState, FormData>(
    submitEnquiryAction,
    initialEnquiryState,
  );
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      enquiryType: kinds[0],
      fullName: "",
      email: "",
      phone: "",
      message: "",
      consentToContact: false,
      companyWebsite: "",
    },
  });

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.set("enquiryType", String(values.enquiryType));
    formData.set("fullName", values.fullName);
    formData.set("email", values.email ?? "");
    formData.set("phone", values.phone ?? "");
    formData.set("message", values.message);
    formData.set("consentToContact", values.consentToContact ? "true" : "false");
    formData.set("companyWebsite", values.companyWebsite ?? "");
    startTransition(() => formAction(formData));
  }

  const serverErrors = state.fieldErrors ?? {};
  const errorFor = (field: keyof FormValues): string | undefined =>
    errors[field]?.message ?? serverErrors[String(field)];

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-3xl border-2 border-leaf/30 bg-leaf-soft p-8 text-center">
        <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-leaf" />
        <h2 className="mt-4 text-2xl font-black text-brand">Message received</h2>
        <p className="mt-2 text-sm text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-3xl border-2 border-line bg-white p-6 sm:p-8"
    >
      <h2 className="text-2xl font-black tracking-tight text-brand">{title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{description}</p>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border-2 border-destructive/30 bg-white p-3 text-sm font-semibold text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="enquiryType">What is this about?</Label>
          <select
            id="enquiryType"
            {...register("enquiryType")}
            className="min-h-11 w-full rounded-xl border-2 border-input bg-white px-4 text-sm text-ink focus-visible:border-brand"
          >
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          <FieldError id="enquiryType-error" message={errorFor("enquiryType")} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errorFor("fullName"))}
            aria-describedby={errorFor("fullName") ? "fullName-error" : undefined}
            {...register("fullName")}
          />
          <FieldError id="fullName-error" message={errorFor("fullName")} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errorFor("email"))}
              aria-describedby={errorFor("email") ? "email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="email-error" message={errorFor("email")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errorFor("phone"))}
              aria-describedby={errorFor("phone") ? "phone-error" : undefined}
              {...register("phone")}
            />
            <FieldError id="phone-error" message={errorFor("phone")} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="message">How can we help?</Label>
          <Textarea
            id="message"
            rows={6}
            aria-invalid={Boolean(errorFor("message"))}
            aria-describedby={errorFor("message") ? "message-error" : undefined}
            {...register("message")}
          />
          <FieldError id="message-error" message={errorFor("message")} />
        </div>

        {/* Honeypot: hidden from users and assistive technology. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="companyWebsite">Company website</label>
          <input id="companyWebsite" tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
        </div>

        <div className="grid gap-2">
          <div className="flex items-start gap-3">
            <Checkbox id="consentToContact" {...register("consentToContact")} />
            <Label htmlFor="consentToContact" className="leading-snug">
              I agree that ISNESI may contact me about this enquiry.
            </Label>
          </div>
          <FieldError id="consentToContact-error" message={errorFor("consentToContact")} />
        </div>

        <div className="rounded-2xl bg-sun-soft p-4 text-xs text-ink">
          <strong className="font-black">Safeguarding:</strong> do not use this form to report a
          child at risk. Contact local emergency or child-protection services immediately. This form
          is for general enquiries only.
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            {isPending ? "Sending…" : "Send message"}
          </Button>
          <p className="text-xs text-ink-muted">We never share your details with third parties.</p>
        </div>
      </div>
    </form>
  );
}