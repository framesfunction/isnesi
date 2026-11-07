import { describe, expect, it } from "vitest";

import {
  saveDonationCampaignSchema,
  toggleDonationCampaignSchema,
  requestDonationRefundSchema,
  approveDonationRefundSchema,
  saveReconciliationSchema,
  createDonationIntentSchema,
} from "@/lib/validation/finance";

const validUuid = "00000000-0000-0000-0000-000000000000";

describe("saveDonationCampaignSchema", () => {
  it("accepts a well-formed campaign", () => {
    expect(
      saveDonationCampaignSchema.safeParse({
        key: "emergency-appeal-2026",
        title: "Emergency Appeal 2026",
        description: "Funds for urgent relief.",
        isActive: true,
        startsAt: "2026-01-01",
        endsAt: "2026-12-31",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid campaign key", () => {
    expect(
      saveDonationCampaignSchema.safeParse({
        key: "Invalid Key!",
        title: "Test",
        description: "",
        isActive: true,
      }).success,
    ).toBe(false);
  });

  it("rejects a missing title", () => {
    expect(
      saveDonationCampaignSchema.safeParse({
        key: "test-campaign",
        title: "",
        description: "",
        isActive: true,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid start date", () => {
    expect(
      saveDonationCampaignSchema.safeParse({
        key: "test-campaign",
        title: "Test",
        description: "",
        isActive: true,
        startsAt: "not-a-date",
      }).success,
    ).toBe(false);
  });
});

describe("toggleDonationCampaignSchema", () => {
  it("accepts a valid toggle", () => {
    expect(
      toggleDonationCampaignSchema.safeParse({ campaignId: validUuid, isActive: true }).success,
    ).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(
      toggleDonationCampaignSchema.safeParse({ campaignId: "not-a-uuid", isActive: true }).success,
    ).toBe(false);
  });
});

describe("requestDonationRefundSchema", () => {
  it("accepts a well-formed refund request", () => {
    expect(
      requestDonationRefundSchema.safeParse({
        donationId: validUuid,
        amountMinor: 5000,
        reason: "Donor requested a refund within the cooling-off period.",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(
      requestDonationRefundSchema.safeParse({
        donationId: validUuid,
        amountMinor: 0,
        reason: "Test",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing reason", () => {
    expect(
      requestDonationRefundSchema.safeParse({
        donationId: validUuid,
        amountMinor: 5000,
        reason: "",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid donation ID", () => {
    expect(
      requestDonationRefundSchema.safeParse({
        donationId: "not-a-uuid",
        amountMinor: 5000,
        reason: "Test",
      }).success,
    ).toBe(false);
  });
});

describe("approveDonationRefundSchema", () => {
  it("accepts a valid refund ID", () => {
    expect(
      approveDonationRefundSchema.safeParse({ refundId: validUuid }).success,
    ).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(
      approveDonationRefundSchema.safeParse({ refundId: "not-a-uuid" }).success,
    ).toBe(false);
  });
});

describe("saveReconciliationSchema", () => {
  it("accepts a well-formed reconciliation", () => {
    expect(
      saveReconciliationSchema.safeParse({
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        totalMinor: 100000,
        currency: "XAF",
        status: "open",
        notes: "January settlement.",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid date format", () => {
    expect(
      saveReconciliationSchema.safeParse({
        periodStart: "01/01/2026",
        periodEnd: "2026-01-31",
        totalMinor: 100000,
        currency: "XAF",
        status: "open",
      }).success,
    ).toBe(false);
  });

  it("rejects a negative total", () => {
    expect(
      saveReconciliationSchema.safeParse({
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        totalMinor: -100,
        currency: "XAF",
        status: "open",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid status", () => {
    expect(
      saveReconciliationSchema.safeParse({
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
        totalMinor: 100000,
        currency: "XAF",
        status: "invalid",
      }).success,
    ).toBe(false);
  });
});

describe("createDonationIntentSchema", () => {
  it("accepts a well-formed intent", () => {
    expect(
      createDonationIntentSchema.safeParse({
        donationId: validUuid,
        amountMinor: 5000,
        currency: "XAF",
        payerPhone: "+237 670 123 456",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(
      createDonationIntentSchema.safeParse({
        donationId: validUuid,
        amountMinor: 0,
        currency: "XAF",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid donation ID", () => {
    expect(
      createDonationIntentSchema.safeParse({
        donationId: "not-a-uuid",
        amountMinor: 5000,
        currency: "XAF",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing payer phone", () => {
    expect(
      createDonationIntentSchema.safeParse({
        donationId: validUuid,
        amountMinor: 5000,
        currency: "XAF",
      }).success,
    ).toBe(false);
  });

  it("rejects a payer phone with letters", () => {
    expect(
      createDonationIntentSchema.safeParse({
        donationId: validUuid,
        amountMinor: 5000,
        currency: "XAF",
        payerPhone: "06XX-ABC",
      }).success,
    ).toBe(false);
  });
});
