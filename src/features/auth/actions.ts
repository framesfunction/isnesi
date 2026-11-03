"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath, signInSchema } from "@/lib/validation/auth";
import type { SignInState } from "@/features/auth/state";

/**
 * Staff sign-in.
 *
 * - Validates on the server before touching Supabase Auth.
 * - Returns a single generic message for any credential failure so the form
 *   cannot be used for account enumeration.
 * - Only same-origin paths are accepted as the post-login destination.
 */
export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Authentication is not configured for this environment yet.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter your work email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "Those credentials were not accepted. Check your details and try again.",
    };
  }

  const destination = safeRedirectPath(parsed.data.next, "/admin");
  revalidatePath("/", "layout");
  redirect(destination);
}

/** Sign out and clear the session cookies. */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login?signedOut=1");
}