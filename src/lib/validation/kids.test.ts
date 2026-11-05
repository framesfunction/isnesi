import { describe, expect, it } from "vitest";

import {
  saveKidsResourceSchema,
  kidsResourceReviewSchema,
  kidsResourceToggleSchema,
  deleteKidsResourceSchema,
  accessibilitySettingsSchema,
  accessibilityReviewSchema,
  KIDS_RESOURCE_TYPES,
} from "@/lib/validation/kids";

const validUuid = "00000000-0000-0000-0000-000000000000";

describe("saveKidsResourceSchema", () => {
  it("accepts a well-formed resource", () => {
    expect(
      saveKidsResourceSchema.safeParse({
        resourceType: "story",
        title: "My First Story",
        description: "A lovely story for children.",
        minAge: 3,
        maxAge: 8,
        featured: false,
      }).success,
    ).toBe(true);
  });

  it("rejects a missing title", () => {
    expect(
      saveKidsResourceSchema.safeParse({
        resourceType: "story",
        title: "",
        featured: false,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid resource type", () => {
    expect(
      saveKidsResourceSchema.safeParse({
        resourceType: "podcast",
        title: "Test",
        featured: false,
      }).success,
    ).toBe(false);
  });

  it("rejects a negative minimum age", () => {
    expect(
      saveKidsResourceSchema.safeParse({
        resourceType: "story",
        title: "Test",
        minAge: -1,
        maxAge: 8,
        featured: false,
      }).success,
    ).toBe(false);
  });

  it("covers all known resource types", () => {
    for (const type of KIDS_RESOURCE_TYPES) {
      expect(
        saveKidsResourceSchema.safeParse({
          resourceType: type,
          title: "Test",
          featured: false,
        }).success,
      ).toBe(true);
    }
  });
});

describe("kidsResourceReviewSchema", () => {
  it("accepts an approval", () => {
    expect(
      kidsResourceReviewSchema.safeParse({
        resourceId: validUuid,
        decision: "approve",
        note: "Safeguarding concerns resolved.",
      }).success,
    ).toBe(true);
  });

  it("accepts a rejection", () => {
    expect(
      kidsResourceReviewSchema.safeParse({
        resourceId: validUuid,
        decision: "reject",
        note: "Content not suitable for children.",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid decision", () => {
    expect(
      kidsResourceReviewSchema.safeParse({
        resourceId: validUuid,
        decision: "maybe",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid resource ID", () => {
    expect(
      kidsResourceReviewSchema.safeParse({
        resourceId: "not-a-uuid",
        decision: "approve",
      }).success,
    ).toBe(false);
  });
});

describe("kidsResourceToggleSchema", () => {
  it("accepts a featured toggle", () => {
    expect(
      kidsResourceToggleSchema.safeParse({
        resourceId: validUuid,
        featured: true,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid resource ID", () => {
    expect(
      kidsResourceToggleSchema.safeParse({
        resourceId: "not-a-uuid",
        featured: true,
      }).success,
    ).toBe(false);
  });
});

describe("deleteKidsResourceSchema", () => {
  it("accepts a valid resource ID", () => {
    expect(
      deleteKidsResourceSchema.safeParse({ resourceId: validUuid }).success,
    ).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(
      deleteKidsResourceSchema.safeParse({ resourceId: "not-a-uuid" }).success,
    ).toBe(false);
  });
});

describe("accessibilitySettingsSchema", () => {
  it("accepts all preferences", () => {
    expect(
      accessibilitySettingsSchema.safeParse({
        reducedMotion: true,
        highContrast: false,
        largeText: true,
        dyslexicFont: false,
      }).success,
    ).toBe(true);
  });

  it("accepts empty settings", () => {
    expect(accessibilitySettingsSchema.safeParse({}).success).toBe(true);
  });
});

describe("accessibilityReviewSchema", () => {
  it("accepts a passing review", () => {
    expect(
      accessibilityReviewSchema.safeParse({
        entityType: "page",
        entityId: validUuid,
        wcagLevel: "AA",
        passed: true,
        issues: "None found.",
        notes: "Reviewed on 2026-01-15.",
      }).success,
    ).toBe(true);
  });

  it("accepts a failing review", () => {
    expect(
      accessibilityReviewSchema.safeParse({
        entityType: "story",
        entityId: validUuid,
        wcagLevel: "AA",
        passed: false,
        issues: "Missing alt text on hero image.",
        notes: "Add alt text before publishing.",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid WCAG level", () => {
    expect(
      accessibilityReviewSchema.safeParse({
        entityType: "page",
        entityId: validUuid,
        wcagLevel: "AAA+",
        passed: true,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid entity type", () => {
    expect(
      accessibilityReviewSchema.safeParse({
        entityType: "video",
        entityId: validUuid,
        wcagLevel: "AA",
        passed: true,
      }).success,
    ).toBe(false);
  });
});
