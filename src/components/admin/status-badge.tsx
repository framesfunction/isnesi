import { Badge } from "@/components/ui/badge";

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  rejected: "Changes requested",
  archived: "Archived",
};

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral" | "outline";

export const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  draft: "neutral",
  in_review: "warning",
  approved: "success",
  scheduled: "warning",
  published: "success",
  rejected: "danger",
  archived: "outline",
  // Approval + media-rights tokens share the same visual language.
  pending: "warning",
  owned: "success",
  licensed: "success",
  permission_recorded: "success",
  restricted: "danger",
  expired: "danger",
};

export const RIGHTS_LABELS: Record<string, string> = {
  pending: "Rights pending",
  owned: "ISNESI-owned",
  licensed: "Licensed",
  permission_recorded: "Permission recorded",
  restricted: "Restricted",
  expired: "Expired",
};

export const APPROVAL_LABELS: Record<string, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Approval expired",
};

function variantFor(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "neutral";
}

/** Consistent status pill for any content-like workflow state. */
export function StatusBadge({
  status,
  labels = CONTENT_STATUS_LABELS,
}: {
  status: string;
  labels?: Record<string, string>;
}) {
  return (
    <Badge variant={variantFor(status)}>
      {labels[status] ?? status}
    </Badge>
  );
}
