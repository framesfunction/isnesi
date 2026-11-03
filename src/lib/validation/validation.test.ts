import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/validation/auth";
import { enquirySchema, newsletterSubscribeSchema } from "@/lib/validation/enquiry";

const validEnquiry = {
  enquiryType: "volunteer" as const,
  fullName: "Amina Nkeng",
  email: "amina@example.org",
  phone: "+237 600 000 000",
  message: "I would like to help with inclusive education workshops in my district.",
  consentToContact: true,
  companyWebsite: "",
};

describe("enquirySchema", () => {
  it("accepts a well-formed enquiry", () => {
    expect(enquirySchema.safeParse(validEnquiry).success).toBe(true);
  });

  it("accepts an enquiry without email or phone", () => {
    expect(
      enquirySchema.safeParse({ ...validEnquiry, email: "", phone: "" }).success,
    ).toBe(true);
  });

  it("rejects a message shorter than 20 characters", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, message: "Help" }).success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an unknown enquiry type", () => {
    expect(enquirySchema.safeParse({ ...validEnquiry, enquiryType: "safeguarding" }).success).toBe(
      false,
    );
  });

  it("rejects a filled honeypot", () => {
    expect(
      enquirySchema.safeParse({ ...validEnquiry, companyWebsite: "https://spam.example" }).success,
    ).toBe(false);
  });
});

describe("newsletterSubscribeSchema", () => {
  it("defaults the locale to English", () => {
    const parsed = newsletterSubscribeSchema.parse({
      email: "reader@example.org",
      consent: true,
    });
    expect(parsed.locale).toBe("en");
  });

  it("rejects an unsupported locale", () => {
    expect(
      newsletterSubscribeSchema.safeParse({
        email: "reader@example.org",
        consent: true,
        locale: "de",
      }).success,
    ).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeRedirectPath("/admin/pages")).toBe("/admin/pages");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/admin");
    expect(safeRedirectPath("https://evil.example")).toBe("/admin");
    expect(safeRedirectPath("admin/pages")).toBe("/admin");
  });

  it("rejects backslash tricks and non-strings", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/admin");
    expect(safeRedirectPath(null)).toBe("/admin");
    expect(safeRedirectPath(42)).toBe("/admin");
  });
});