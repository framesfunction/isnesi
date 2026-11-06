import { describe, expect, it } from "vitest";

import {
  buildImpactFigures,
  buildImpactFiguresFromMetrics,
  buildImpactJsonLd,
  formatMetricValue,
  toMetricNumber,
} from "@/features/impact/helpers";

describe("buildImpactFigures", () => {
  it("returns the three fallback metrics in a stable order", () => {
    const figures = buildImpactFigures({ programmesCount: 6, partnersCount: 4, storyCount: 12 });

    expect(figures.map((figure) => figure.key)).toEqual(["programmes", "partners", "stories"]);
    expect(figures.map((figure) => figure.value)).toEqual([6, 4, 12]);
    expect(figures.every((figure) => figure.unit === "count")).toBe(true);
  });

  it("never reports a negative, fractional or non-finite count", () => {
    const figures = buildImpactFigures({
      programmesCount: -3,
      partnersCount: 2.9,
      storyCount: Number.NaN,
    });

    expect(figures.map((figure) => figure.value)).toEqual([0, 2, 0]);
  });

  it("links each fallback figure to the page that evidences it", () => {
    const figures = buildImpactFigures({ programmesCount: 1, partnersCount: 1, storyCount: 1 });

    const links = Object.fromEntries(figures.map((figure) => [figure.key, figure.href]));
    expect(links).toEqual({
      programmes: "/programmes",
      partners: "/partners",
      stories: "/stories",
    });
  });

  it("gives every figure a label, display value, description and link label", () => {
    for (const figure of buildImpactFigures({
      programmesCount: 1200,
      partnersCount: 1,
      storyCount: 1,
    })) {
      expect(figure.label.length).toBeGreaterThan(0);
      expect(figure.description.length).toBeGreaterThan(0);
      expect(figure.display.length).toBeGreaterThan(0);
      expect(figure.linkLabel?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("groups large fallback counts", () => {
    const [programmes] = buildImpactFigures({
      programmesCount: 1200,
      partnersCount: 0,
      storyCount: 0,
    });
    expect(programmes.display).toBe("1,200");
  });
});

describe("formatMetricValue", () => {
  it("groups counts", () => {
    expect(formatMetricValue(2500, "count", null)).toBe("2,500");
  });

  it("formats percentages with one decimal", () => {
    expect(formatMetricValue(42.5, "percentage", null)).toBe("42.5%");
  });

  it("formats currency using the real ISO code (XAF has no minor unit)", () => {
    expect(formatMetricValue(2_500_000, "currency", "XAF")).toContain("2,500,000");
  });

  it("falls back to XAF when the currency code is unusable", () => {
    expect(formatMetricValue(1000, "currency", "!!")).toContain("1,000");
  });

  it("never renders a negative or non-finite value", () => {
    expect(formatMetricValue(-5, "count", null)).toBe("0");
    expect(formatMetricValue(Number.NaN, "percentage", null)).toBe("0%");
  });
});

describe("buildImpactFiguresFromMetrics", () => {
  it("preserves admin order and maps each row to a figure", () => {
    const figures = buildImpactFiguresFromMetrics([
      {
        key: "children-reached",
        label: "Children reached",
        value: 1250,
        unit: "count",
        currency: null,
        description: "Verified from programme registers.",
        evidenceUrl: "https://isnesi.example/reports/2026",
      },
      {
        key: "attendance",
        label: "Attendance rate",
        value: 87.5,
        unit: "percentage",
        currency: null,
        description: null,
        evidenceUrl: null,
      },
    ]);

    expect(figures.map((figure) => figure.key)).toEqual(["children-reached", "attendance"]);
    expect(figures[0].display).toBe("1,250");
    expect(figures[0].href).toBe("https://isnesi.example/reports/2026");
    expect(figures[0].linkLabel).toBe("View the evidence");
    expect(figures[1].display).toBe("87.5%");
    expect(figures[1].description).toBe("");
    expect(figures[1].href).toBeNull();
    expect(figures[1].linkLabel).toBeNull();
  });
});

describe("toMetricNumber", () => {
  it("coerces the numeric strings Postgres returns", () => {
    expect(toMetricNumber("1250")).toBe(1250);
    expect(toMetricNumber(42)).toBe(42);
  });

  it("returns zero for anything that is not a finite number", () => {
    expect(toMetricNumber("not-a-number")).toBe(0);
    expect(toMetricNumber(null)).toBe(0);
    expect(toMetricNumber(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("buildImpactJsonLd", () => {
  it("builds a WebPage plus a matching BreadcrumbList", () => {
    const [page, breadcrumb] = buildImpactJsonLd({
      baseUrl: "https://isnesi.example",
      path: "/impact",
      name: "Impact",
      description: "What our work changes.",
      siteName: "ISNESI",
    });

    expect(page["@type"]).toBe("WebPage");
    expect(page.url).toBe("https://isnesi.example/impact");
    expect(page.inLanguage).toBe("en");

    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    const items = breadcrumb.itemListElement as { position: number; item: string }[];
    expect(items.map((item) => item.position)).toEqual([1, 2]);
    expect(items[0].item).toBe("https://isnesi.example");
    expect(items[1].item).toBe("https://isnesi.example/impact");
  });

  it("normalises trailing slashes in the base url and the path", () => {
    const [page] = buildImpactJsonLd({
      baseUrl: "https://isnesi.example/",
      path: "impact/",
      name: "Impact",
      description: "x",
      siteName: "ISNESI",
    });

    expect(page.url).toBe("https://isnesi.example/impact");
  });

  it("serialises to valid, markup-free JSON", () => {
    const data = buildImpactJsonLd({
      baseUrl: "https://isnesi.example",
      path: "/impact",
      name: "Impact",
      description: "What our work changes.",
      siteName: "ISNESI",
    });

    const serialised = JSON.stringify(data);
    expect(serialised).not.toContain("</script>");
    expect(JSON.parse(serialised)).toHaveLength(2);
  });
});