import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/validation/auth";
import { saveProgrammeSchema } from "@/lib/validation/cms";
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
  it("accepts a well-formed subscription", () => {
    expect(
      newsletterSubscribeSchema.safeParse({
        email: "reader@example.org",
        consent: true,
      }).success,
    ).toBe(true);
  });

  it("rejects without consent", () => {
    expect(
      newsletterSubscribeSchema.safeParse({
        email: "reader@example.org",
        consent: false,
      }).success,
    ).toBe(false);
  });

  it("defaults the subscriber locale to the site default", () => {
    const parsed = newsletterSubscribeSchema.safeParse({
      email: "reader@example.org",
      consent: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.locale).toBe("en");
    }
  });

  it("keeps a supplied subscriber locale", () => {
    const parsed = newsletterSubscribeSchema.safeParse({
      email: "reader@example.org",
      consent: true,
      locale: "fr",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.locale).toBe("fr");
    }
  });
});

describe("saveProgrammeSchema", () => {
  const base = {
    key: "inclusive-education",
    icon: "",
    sortOrder: "1",
    isActive: true,
    featuredImageId: "",
    objectives: ["Reach more children"],
    activities: ["Teacher coaching"],
    targetBeneficiaries: "Children with disabilities",
    geographicCoverage: "Cameroon",
    titleEn: "Inclusive Education",
    summaryEn: "Equal access to quality education.",
    seoTitleEn: "",
    seoDescriptionEn: "",
    bodyEnBlocks: [{ type: "paragraph", text: "Programme description" }],
  };

  it("accepts a complete programme and coerces its fields", () => {
    const parsed = saveProgrammeSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sortOrder).toBe(1);
      expect(parsed.data.objectives).toEqual(["Reach more children"]);
      expect(parsed.data.featuredImageId).toBeNull();
      expect(parsed.data.seoTitleEn).toBeNull();
    }
  });

  it("rejects a malformed key", () => {
    expect(saveProgrammeSchema.safeParse({ ...base, key: "Not A Slug" }).success).toBe(false);
  });

  it("rejects an invalid featured image reference", () => {
    expect(saveProgrammeSchema.safeParse({ ...base, featuredImageId: "123" }).success).toBe(false);
  });

  it("requires at least one body block", () => {
    expect(saveProgrammeSchema.safeParse({ ...base, bodyEnBlocks: [] }).success).toBe(false);
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