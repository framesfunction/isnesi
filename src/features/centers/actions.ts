"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { saveCenterSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "center";
}

function revalidateCenters(): void {
  revalidatePath("/admin/centers");
  revalidatePath("/centers");
  revalidatePath("/");
}

export async function saveCenterAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ centerId: string }>> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveCenterSchema.safeParse({
    centerId: optionalId(formData.get("centerId")),
    slug: formData.get("slug"),
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    websiteUrl: formData.get("websiteUrl"),
    openingHours: formData.get("openingHours"),
    descriptionEn: formData.get("description"),
    logoMediaId: formData.get("logoMediaId"),
    mapMediaId: formData.get("mapMediaId"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const slug = input.slug ?? slugify(input.name);

  const supabase = await createClient();

  const itemValues = {
    name: input.name,
    slug,
    address: input.address,
    city: input.city,
    phone: input.phone,
    email: input.email,
    website_url: input.websiteUrl,
    opening_hours: input.openingHours,
    description: input.descriptionEn,
    logo_media_id: input.logoMediaId,
    map_media_id: input.mapMediaId,
  };

  let centerId: string;
  if (input.centerId) {
    const { data, error } = await supabase
      .from("centers")
      .update(itemValues)
      .eq("id", input.centerId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "center update");
    if (!data) return actionForbidden();
    centerId = data.id;
  } else {
    const { data, error } = await supabase
      .from("centers")
      .insert(itemValues)
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "center create");
    centerId = data.id;
  }

  const { error } = await supabase.from("center_translations").upsert(
    {
      center_id: centerId,
      locale: "en",
      description: input.descriptionEn,
    },
    { onConflict: "center_id,locale" },
  );
  if (error) return dbErrorMessage(error, "center translation save");

  revalidateCenters();
  return actionOk("Center saved.", { centerId });
}

export async function deleteCenterAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const centerId = z.uuid().safeParse(formData.get("centerId"));
  if (!centerId.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("centers").delete().eq("id", centerId.data);
  if (error) {
    if (error.code === "23503") {
      return actionError("This center still has references and cannot be deleted.");
    }
    return dbErrorMessage(error, "center delete");
  }

  revalidateCenters();
  return actionOk("Center deleted.");
}
