"use server";

import { revalidatePath } from "next/cache";

import { callSafeguardingFunction } from "@/features/safeguarding/edge-client";

export async function updateSafeguardingCaseAction(formData: FormData) {
  const result = await callSafeguardingFunction<{ ok: true }>(
    "safeguarding-update-case",
    {
      caseId: formData.get("caseId"),
      status: formData.get("status"),
      severity: formData.get("severity"),
      assignedTo: formData.get("assignedTo") || undefined,
    },
  );
  revalidatePath("/admin/safeguarding");
  return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
}

export async function addSafeguardingNoteAction(formData: FormData) {
  const note = String(formData.get("note") ?? "");
  const result = await callSafeguardingFunction<{ ok: true }>(
    "safeguarding-add-note",
    {
      caseId: formData.get("caseId"),
      note,
      noteType: formData.get("noteType") || "case_note",
    },
  );
  revalidatePath("/admin/safeguarding");
  return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
}
