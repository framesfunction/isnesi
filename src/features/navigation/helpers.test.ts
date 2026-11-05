import { describe, expect, it } from "vitest";

import {
  isExternalHref,
  isResolvableInternalHref,
  normaliseInternalPath,
} from "@/features/navigation/helpers";

describe("isExternalHref", () => {
  it("recognises http(s) links only", () => {
    expect(isExternalHref("https://example.org")).toBe(true);
    expect(isExternalHref("http://example.org")).toBe(true);
    expect(isExternalHref("/about")).toBe(false);
    expect(isExternalHref("mailto:hello@isnesi.org")).toBe(false);
  });
});

describe("normaliseInternalPath", () => {
  it("drops query strings, hashes and trailing slashes", () => {
    expect(normaliseInternalPath("/about/")).toBe("/about");
    expect(normaliseInternalPath("/about?x=1")).toBe("/about");
    expect(normaliseInternalPath("/stories#latest")).toBe("/stories");
  });

  it("adds a leading slash and keeps the root", () => {
    expect(normaliseInternalPath("about")).toBe("/about");
    expect(normaliseInternalPath("/")).toBe("/");
  });
});

describe("isResolvableInternalHref", () => {
  const published = ["how-we-work", "annual-report"];

  it("accepts external links and the site root", () => {
    expect(isResolvableInternalHref("https://example.org", published)).toBe(true);
    expect(isResolvableInternalHref("/", published)).toBe(true);
  });

  it("accepts known static routes", () => {
    expect(isResolvableInternalHref("/about", published)).toBe(true);
    expect(isResolvableInternalHref("/programmes/", published)).toBe(true);
  });

  it("accepts published page slugs", () => {
    expect(isResolvableInternalHref("/how-we-work", published)).toBe(true);
  });

  it("rejects links to pages that are not published", () => {
    expect(isResolvableInternalHref("/retired-page", published)).toBe(false);
    expect(isResolvableInternalHref("/how-we-work/extra", published)).toBe(false);
  });
});