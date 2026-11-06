import { describe, expect, it } from "vitest";

import {
  buildGetInvolvedJsonLd,
  enquiryTypeLabel,
  enquiryTypeOptions,
} from "@/features/enquiries/helpers";

describe("enquiryTypeLabel", () => {
  it("labels every known enquiry type", () => {
    expect(enquiryTypeLabel("volunteer")).toBe("I would like to volunteer");
    expect(enquiryTypeLabel("partnership")).toBe("Partnership enquiry");
    expect(enquiryTypeLabel("contact")).toBe("General question");
    expect(enquiryTypeLabel("media")).toBe("Media or press enquiry");
    expect(enquiryTypeLabel("other")).toBe("Something else");
  });

  it("falls back to a neutral label for an unknown type", () => {
    expect(enquiryTypeLabel("safeguarding")).toBe("Enquiry");
  });
});

describe("enquiryTypeOptions", () => {
  it("keeps the order the caller asked for", () => {
    const options = enquiryTypeOptions(["volunteer", "partnership", "other"]);
    expect(options.map((option) => option.value)).toEqual(["volunteer", "partnership", "other"]);
    expect(options[0].label).toBe("I would like to volunteer");
  });

  it("returns an empty list when no kinds are offered", () => {
    expect(enquiryTypeOptions([])).toEqual([]);
  });
});

describe("buildGetInvolvedJsonLd", () => {
  const base = {
    baseUrl: "https://isnesi.example/",
    path: "get-involved",
    name: "Get involved",
    description: "Volunteer, partner or fundraise with ISNESI.",
    siteName: "ISNESI",
  };

  it("builds a ContactPage plus a matching breadcrumb", () => {
    const [page, breadcrumb] = buildGetInvolvedJsonLd(base);

    expect(page["@type"]).toBe("ContactPage");
    expect(page.url).toBe("https://isnesi.example/get-involved");
    expect(page.inLanguage).toBe("en");

    const items = breadcrumb.itemListElement as { position: number; item: string }[];
    expect(items.map((item) => item.position)).toEqual([1, 2]);
    expect(items[1].item).toBe("https://isnesi.example/get-involved");
  });

  it("serialises to valid, markup-free JSON", () => {
    const serialised = JSON.stringify(buildGetInvolvedJsonLd(base));
    expect(serialised).not.toContain("</script>");
    expect(JSON.parse(serialised)).toHaveLength(2);
  });
});
