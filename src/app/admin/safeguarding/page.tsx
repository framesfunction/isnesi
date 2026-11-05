import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callSafeguardingFunction } from "@/features/safeguarding/edge-client";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Safeguarding" };
export const dynamic = "force-dynamic";

type SafeguardingList = {
  cases: Array<{
    id: string;
    referenceCode: string;
    status: string;
    severity: string;
    assignedTo: string | null;
    receivedAt: string;
  }>;
};

export default async function SafeguardingPage() {
  const { allowed } = await requirePermission(
    "safeguarding.access",
    "/admin/safeguarding",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have safeguarding casework access."
      />
    );
  }

  const result = await callSafeguardingFunction<SafeguardingList>("safeguarding-list-cases");

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Restricted casework"
        title="Safeguarding"
        description="Assigned safeguarding cases are accessed only through audited server functions."
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {result.ok ? `Cases (${result.data.cases.length})` : "Cases unavailable"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result.ok ? (
            <EmptyState
              title="Restricted casework is not available."
              description={
                result.reason === "not_deployed"
                  ? "Deploy the safeguarding Edge Functions and configure the encryption key."
                  : "Safeguarding access could not be verified."
              }
            />
          ) : result.data.cases.length === 0 ? (
            <EmptyState title="No assigned cases are available." />
          ) : (
            <ul className="divide-y divide-line">
              {result.data.cases.map((caseRow) => (
                <li key={caseRow.id} className="py-3">
                  <p className="font-bold text-ink">{caseRow.referenceCode}</p>
                  <p className="text-xs text-ink-muted">
                    {caseRow.status} - {caseRow.severity}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
