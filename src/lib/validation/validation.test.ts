import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/validation/auth";
import { saveCategorySchema, saveContentSchema, saveImpactMetricSchema, saveProgrammeSchema, saveTagSchema } from "@/lib/validation/cms";
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

  it("rejects any locale other than English", () => {
    expect(
      newsletterSubscribeSchema.safeParse({
        email: "reader@example.org",
        consent: true,
        locale: "fr",
      }).success,
    ).toBe(false);
  });
});

describe("saveImpactMetricSchema", () => {
  const base = {
    key: "children-reached",
    label: "Children reached",
    value: "1250",
    unit: "count",
    currency: "",
    description: "",
    sourceNote: "Programme registers",
    evidenceUrl: "",
    reportingPeriod: "2026",
    sortOrder: "2",
    isPublished: false,
  };

  it("accepts a count metric and coerces its numbers", () => {
    const parsed = saveImpactMetricSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.value).toBe(1250);
      expect(parsed.data.sortOrder).toBe(2);
      expect(parsed.data.currency).toBeNull();
      expect(parsed.data.evidenceUrl).toBeNull();
    }
  });

  it("upper-cases and keeps a currency code for a currency figure", () => {
    const parsed = saveImpactMetricSchema.safeParse({
      ...base,
      unit: "currency",
      currency: "xaf",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.currency).toBe("XAF");
  });

  it("requires a currency for a currency figure", () => {
    expect(
      saveImpactMetricSchema.safeParse({ ...base, unit: "currency", currency: "" }).success,
    ).toBe(false);
  });

  it("rejects negative values", () => {
    expect(saveImpactMetricSchema.safeParse({ ...base, value: "-5" }).success).toBe(false);
  });

  it("rejects a malformed key", () => {
    expect(saveImpactMetricSchema.safeParse({ ...base, key: "Children Reached" }).success).toBe(
      false,
    );
  });

  it("rejects a non-http evidence URL", () => {
    expect(
      saveImpactMetricSchema.safeParse({ ...base, evidenceUrl: "isnesi.example" }).success,
    ).toBe(false);
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

describe("saveCategorySchema", () => {
  it("accepts a stable key and an English label", () => {
    expect(
      saveCategorySchema.safeParse({ key: "in-the-classroom", labelEn: "In the classroom" }).success,
    ).toBe(true);
  });

  it("rejects a malformed key", () => {
    expect(
      saveCategorySchema.safeParse({ key: "In The Classroom", labelEn: "In the classroom" }).success,
    ).toBe(false);
  });

  it("requires a non-blank label", () => {
    expect(saveCategorySchema.safeParse({ key: "in-the-classroom", labelEn: "   " }).success).toBe(
      false,
    );
  });

  it("accepts an existing id when editing", () => {
    const parsed = saveCategorySchema.safeParse({
      categoryId: "0f1b4d6a-9c1e-4f2b-8a3d-6c5e7f8a9b0c",
      key: "in-the-classroom",
      labelEn: "In the classroom",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("saveTagSchema", () => {
  it("accepts a stable key and an English label", () => {
    expect(saveTagSchema.safeParse({ key: "inclusion", labelEn: "Inclusion" }).success).toBe(true);
  });

  it("rejects an empty label", () => {
    expect(saveTagSchema.safeParse({ key: "inclusion", labelEn: "" }).success).toBe(false);
  });
});

describe("saveContentSchema taxonomy fields", () => {
  const base = {
    slug: "first-day",
    contentType: "story" as const,
    featured: false,
    scheduledAt: "",
    titleEn: "A first day",
    excerptEn: "",
    seoTitleEn: "",
    seoDescriptionEn: "",
    bodyEnBlocks: [{ type: "paragraph", text: "Hello" }],
  };

  it("defaults the taxonomy fields when the fieldset is absent", () => {
    const parsed = saveContentSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.taxonomyPresent).toBe(false);
      expect(parsed.data.categoryIds).toEqual([]);
      expect(parsed.data.tagIds).toEqual([]);
    }
  });

  it("accepts uuid categories and tags when the fieldset is present", () => {
    const parsed = saveContentSchema.safeParse({
      ...base,
      taxonomyPresent: true,
      categoryIds: ["0f1b4d6a-9c1e-4f2b-8a3d-6c5e7f8a9b0c"],
      tagIds: ["1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-uuid category id", () => {
    expect(saveContentSchema.safeParse({ ...base, categoryIds: ["not-a-uuid"] }).success).toBe(
      false,
    );
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