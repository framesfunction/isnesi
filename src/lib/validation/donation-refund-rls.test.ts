import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ISN-004: donation_refunds must have INSERT/UPDATE/DELETE RLS policies
 * gated on donations.manage. Migration 202611030014 granted privileges but
 * no policies, so RLS (enabled in 202611030003) default-denied all writes.
 *
 * These tests statically verify the new migration file contains the required
 * policies. Full RLS behaviour requires a live Supabase instance; this test
 * guards against the policy files being removed or emptied.
 */

const MIGRATION_PATH =
  "supabase/migrations/202611080002_donation_refunds_rls_write_policies.sql";

describe("ISN-004 donation_refunds RLS write policies", () => {
  let sql: string;

  it("migration file exists and is non-empty", () => {
    sql = readFileSync(MIGRATION_PATH, "utf8");
    expect(sql).toBeDefined();
    expect(sql.trim().length).toBeGreaterThan(0);
  });

  it("defines an INSERT policy gated on donations.manage", () => {
    expect(sql).toContain("donation_refunds_insert");
    expect(sql).toContain("for insert to authenticated");
    expect(sql).toContain("with check (app_private.has_permission('donations.manage'))");
  });

  it("defines an UPDATE policy gated on donations.manage", () => {
    expect(sql).toContain("donation_refunds_update");
    expect(sql).toContain("for update to authenticated");
    expect(sql).toContain("using (app_private.has_permission('donations.manage'))");
    expect(sql).toContain("with check (app_private.has_permission('donations.manage'))");
  });

  it("defines a DELETE policy gated on donations.manage", () => {
    expect(sql).toContain("donation_refunds_delete");
    expect(sql).toContain("for delete to authenticated");
    expect(sql).toContain("using (app_private.has_permission('donations.manage'))");
  });

  it("is wrapped in a transaction and committed", () => {
    expect(sql.trimStart().startsWith("begin;")).toBe(true);
    expect(sql.trimEnd().endsWith("commit;")).toBe(true);
  });
});
