import { describe, expect, it } from "vitest";

import { can, canAccessAdmin, canAny, canAll, type AccessSubject } from "@/lib/permissions/can";
import { visibleAdminModules, getAdminModule, type AdminModuleKey } from "@/lib/permissions/admin-nav";
import { PERMISSIONS, isPermissionKey } from "@/lib/permissions/permissions";

const safeguardingOfficer: AccessSubject = {
  isActive: true,
  permissions: ["admin.access", "safeguarding.access"],
};

const safeguardingLead: AccessSubject = {
  isActive: true,
  permissions: ["admin.access", "safeguarding.access", "safeguarding.lead", "audit.read"],
};

const inactiveSafeguardingOfficer: AccessSubject = {
  isActive: false,
  permissions: ["admin.access", "safeguarding.access"],
};

const ordinaryAdmin: AccessSubject = {
  isActive: true,
  permissions: ["admin.access", "pages.manage", "content.publish"],
};

describe("safeguarding access matrix", () => {
  describe("permission keys", () => {
    it("includes safeguarding.access and safeguarding.lead in the catalogue", () => {
      expect(isPermissionKey("safeguarding.access")).toBe(true);
      expect(isPermissionKey("safeguarding.lead")).toBe(true);
      expect(PERMISSIONS).toContain("safeguarding.access");
      expect(PERMISSIONS).toContain("safeguarding.lead");
    });
  });

  describe("can()", () => {
    it("grants safeguarding.access to an active safeguarding officer", () => {
      expect(can(safeguardingOfficer, "safeguarding.access")).toBe(true);
    });

    it("grants safeguarding.access and safeguarding.lead to an active safeguarding lead", () => {
      expect(can(safeguardingLead, "safeguarding.access")).toBe(true);
      expect(can(safeguardingLead, "safeguarding.lead")).toBe(true);
    });

    it("denies safeguarding.access to an ordinary admin without the permission", () => {
      expect(can(ordinaryAdmin, "safeguarding.access")).toBe(false);
      expect(can(ordinaryAdmin, "safeguarding.lead")).toBe(false);
    });

    it("denies everything for an inactive safeguarding officer", () => {
      expect(can(inactiveSafeguardingOfficer, "safeguarding.access")).toBe(false);
      expect(can(inactiveSafeguardingOfficer, "safeguarding.lead")).toBe(false);
      expect(canAccessAdmin(inactiveSafeguardingOfficer)).toBe(false);
    });

    it("denies everything when there is no subject", () => {
      expect(can(null, "safeguarding.access")).toBe(false);
      expect(can(undefined, "safeguarding.access")).toBe(false);
      expect(can(null, "safeguarding.lead")).toBe(false);
    });
  });

  describe("canAny / canAll", () => {
    it("canAny passes when one safeguarding permission matches", () => {
      expect(canAny(safeguardingOfficer, ["safeguarding.access", "donations.manage"])).toBe(true);
      expect(canAny(ordinaryAdmin, ["safeguarding.access", "donations.manage"])).toBe(false);
    });

    it("canAll requires both safeguarding permissions", () => {
      expect(canAll(safeguardingLead, ["safeguarding.access", "safeguarding.lead"])).toBe(true);
      expect(canAll(safeguardingOfficer, ["safeguarding.access", "safeguarding.lead"])).toBe(false);
    });
  });

  describe("module visibility", () => {
    it("safeguarding module requires safeguarding.access permission", () => {
      const mod = getAdminModule("safeguarding" as AdminModuleKey);
      expect(mod).toBeDefined();
      expect(mod?.permission).toBe("safeguarding.access");
    });

    it("visibleAdminModules includes safeguarding for officers with access", () => {
      const modules = visibleAdminModules(safeguardingOfficer);
      expect(modules.some((m) => m.key === "safeguarding")).toBe(true);
    });

    it("visibleAdminModules includes safeguarding for leads", () => {
      const modules = visibleAdminModules(safeguardingLead);
      expect(modules.some((m) => m.key === "safeguarding")).toBe(true);
    });

    it("visibleAdminModules excludes safeguarding for ordinary admins", () => {
      const modules = visibleAdminModules(ordinaryAdmin);
      expect(modules.some((m) => m.key === "safeguarding")).toBe(false);
    });

    it("visibleAdminModules excludes safeguarding for inactive officers", () => {
      const modules = visibleAdminModules(inactiveSafeguardingOfficer);
      expect(modules.some((m) => m.key === "safeguarding")).toBe(false);
    });

    it("visibleAdminModules returns nothing for inactive or missing subjects", () => {
      expect(visibleAdminModules(null)).toHaveLength(0);
      expect(visibleAdminModules(undefined)).toHaveLength(0);
      expect(
        visibleAdminModules(inactiveSafeguardingOfficer).some((m) => m.key === "safeguarding"),
      ).toBe(false);
    });
  });

  describe("security controls documented in module metadata", () => {
    it("safeguarding module documents access controls", () => {
      const mod = getAdminModule("safeguarding" as AdminModuleKey);
      expect(mod).toBeDefined();
      expect(mod?.security.length).toBeGreaterThan(0);
      expect(
        mod?.security.some((s) => s.toLowerCase().includes("case_access_events")),
      ).toBe(true);
      expect(mod?.security.some((s) => s.toLowerCase().includes("edge function"))).toBe(true);
    });

    it("safeguarding module lists the private schema tables", () => {
      const mod = getAdminModule("safeguarding" as AdminModuleKey);
      expect(mod?.tables).toContain("safeguarding.cases");
      expect(mod?.tables).toContain("safeguarding.case_access_events");
    });
  });
});
