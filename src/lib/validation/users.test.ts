import { describe, expect, it } from "vitest";

import {
  assignUserRoleSchema,
  revokeUserRoleSchema,
  setUserActiveSchema,
  updateUserProfileSchema,
  inviteUserSchema,
} from "@/lib/validation/users";
import {
  saveSiteSettingSchema,
} from "@/lib/validation/settings";

const validUuid = "00000000-0000-0000-0000-000000000000";

describe("assignUserRoleSchema", () => {
  it("accepts a well-formed role assignment", () => {
    expect(
      assignUserRoleSchema.safeParse({
        userId: validUuid,
        roleId: validUuid,
        expiresAt: "2026-12-31",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid user ID", () => {
    expect(
      assignUserRoleSchema.safeParse({
        userId: "not-a-uuid",
        roleId: validUuid,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid role ID", () => {
    expect(
      assignUserRoleSchema.safeParse({
        userId: validUuid,
        roleId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("accepts missing expiresAt", () => {
    expect(
      assignUserRoleSchema.safeParse({
        userId: validUuid,
        roleId: validUuid,
      }).success,
    ).toBe(true);
  });
});

describe("revokeUserRoleSchema", () => {
  it("accepts a well-formed revocation", () => {
    expect(
      revokeUserRoleSchema.safeParse({
        userId: validUuid,
        roleId: validUuid,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid IDs", () => {
    expect(
      revokeUserRoleSchema.safeParse({
        userId: "not-a-uuid",
        roleId: validUuid,
      }).success,
    ).toBe(false);
    expect(
      revokeUserRoleSchema.safeParse({
        userId: validUuid,
        roleId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("setUserActiveSchema", () => {
  it("accepts activate and deactivate", () => {
    expect(
      setUserActiveSchema.safeParse({ userId: validUuid, isActive: true }).success,
    ).toBe(true);
    expect(
      setUserActiveSchema.safeParse({ userId: validUuid, isActive: false }).success,
    ).toBe(true);
  });

  it("rejects an invalid user ID", () => {
    expect(
      setUserActiveSchema.safeParse({
        userId: "not-a-uuid",
        isActive: true,
      }).success,
    ).toBe(false);
  });
});

describe("updateUserProfileSchema", () => {
  it("accepts a well-formed profile update", () => {
    expect(
      updateUserProfileSchema.safeParse({
        userId: validUuid,
        displayName: "Jane Doe",
        phone: "+33 1 23 45 67 89",
      }).success,
    ).toBe(true);
  });

  it("accepts empty update", () => {
    expect(
      updateUserProfileSchema.safeParse({
        userId: validUuid,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid user ID", () => {
    expect(
      updateUserProfileSchema.safeParse({
        userId: "not-a-uuid",
        displayName: "Jane",
      }).success,
    ).toBe(false);
  });
});

describe("inviteUserSchema", () => {
  it("accepts a well-formed invitation", () => {
    expect(
      inviteUserSchema.safeParse({
        email: "jane@example.org",
        roleId: validUuid,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      inviteUserSchema.safeParse({
        email: "not-an-email",
        roleId: validUuid,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid role ID", () => {
    expect(
      inviteUserSchema.safeParse({
        email: "jane@example.org",
        roleId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("saveSiteSettingSchema", () => {
  it("accepts a well-formed setting", () => {
    expect(
      saveSiteSettingSchema.safeParse({
        key: "organisation.name",
        value: "ISNESI",
        isPublic: true,
      }).success,
    ).toBe(true);
  });

  it("rejects an empty key", () => {
    expect(
      saveSiteSettingSchema.safeParse({
        key: "",
        value: "test",
        isPublic: true,
      }).success,
    ).toBe(false);
  });
});
