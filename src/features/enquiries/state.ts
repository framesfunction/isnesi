/**
 * Form state shapes shared between the enquiry Server Action and its client form.
 *
 * These live outside the `"use server"` module because an action file may only
 * export async functions at runtime.
 */

export type EnquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialEnquiryState: EnquiryFormState = { status: "idle" };