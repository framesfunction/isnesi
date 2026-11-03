import { describe, expect, it } from "vitest";

import { can, canAccessAdmin, canAll, canAny, type AccessSubject } from "@/lib/permissions/can";

const admin: AccessSubject = {
  isActive: true,
  permissions: ["admin.access", "pages.manage", "content.publish"],
};

const inactiveAdmin: AccessSubject = {
  isActive: false,
  permissions: ["admin.access", "pages.manage"],
};

const contributor: AccessSubject = {
  isActive: true,
  permissions: ["admin.access", "content.create"],
};

describe("can", () => {
  it("grants a permission the subject holds", () => {
    expect(can(admin, "pages.manage")).toBe(true);
  });

  it("denies a permission the subject does not hold", () => {
    expect(can(contributor, "pages.manage")).toBe(false);
  });

  it("denies everything for an inactive profile", () => {
    expect(can(inactiveAdmin, "admin.access")).toBe(false);
    expect(can(inactiveAdmin, "pages.manage")).toBe(false);
  });

  it("denies everything when there is no subject", () => {
    expect(can(null, "admin.access")).toBe(false);
    expect(can(undefined, "admin.access")).toBe(false);
  });
});

describe("canAny / canAll", () => {
  it("canAny passes when one permission matches", () => {
    expect(canAny(contributor, ["pages.manage", "content.create"])).toBe(true);
  });

  it("canAny fails when no permission matches", () => {
    expect(canAny(contributor, ["pages.manage", "donations.manage"])).toBe(false);
  });

  it("canAll requires every permission", () => {
    expect(canAll(admin, ["pages.manage", "content.publish"])).toBe(true);
    expect(canAll(contributor, ["content.create", "content.publish"])).toBe(false);
  });

  it("canAll on an empty list is true for an active subject only", () => {
    expect(canAll(admin, [])).toBe(true);
    expect(canAll(inactiveAdmin, [])).toBe(false);
  });
});

describe("canAccessAdmin", () => {
  it("requires admin.access", () => {
    expect(canAccessAdmin(admin)).toBe(true);
    expect(canAccessAdmin({ isActive: true, permissions: [] })).toBe(false);
  });
});