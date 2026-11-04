import { describe, expect, it } from "vitest";

import {
  buildObjectPath,
  extensionFor,
  formatBytes,
  isImageMime,
  publicObjectUrl,
  safeFileName,
} from "@/features/media/helpers";

describe("safeFileName", () => {
  it("lowercases and dash-separates spaces", () => {
    expect(safeFileName("Team Photo 2026.JPG")).toBe("team-photo-2026.jpg");
  });

  it("strips directory traversal and separators", () => {
    expect(safeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(safeFileName("a/b\\c")).toBe("a-b-c");
  });

  it("never returns an empty name", () => {
    expect(safeFileName("   ")).toBe("asset");
    expect(safeFileName("!!!")).toBe("asset");
  });
});

describe("extensionFor", () => {
  it("maps trusted mime types", () => {
    expect(extensionFor("image/jpeg", "photo.png")).toBe("jpg");
    expect(extensionFor("application/pdf", "report.docx")).toBe("pdf");
  });

  it("falls back to the file name extension, then bin", () => {
    expect(extensionFor("image/tiff", "scan.tiff")).toBe("tiff");
    expect(extensionFor("application/octet-stream", "archive")).toBe("bin");
  });
});

describe("buildObjectPath", () => {
  it("builds a namespaced path with a single extension", () => {
    expect(buildObjectPath("Team Photo 2026.JPG", "image/jpeg", "abc123")).toBe(
      "media/team-photo-2026-abc123.jpg",
    );
  });

  it("keeps two same-named uploads apart via the unique id", () => {
    const first = buildObjectPath("logo.png", "image/png", "id-1");
    const second = buildObjectPath("logo.png", "image/png", "id-2");
    expect(first).not.toBe(second);
  });
});

describe("publicObjectUrl", () => {
  it("encodes each path segment and trims a trailing slash on the base", () => {
    expect(publicObjectUrl("https://x.supabase.co/", "public-media", "media/a b.png")).toBe(
      "https://x.supabase.co/storage/v1/object/public/public-media/media/a%20b.png",
    );
  });
});

describe("isImageMime", () => {
  it("is true only for image mime types", () => {
    expect(isImageMime("image/png")).toBe(true);
    expect(isImageMime("application/pdf")).toBe(false);
    expect(isImageMime(null)).toBe(false);
  });
});

describe("formatBytes", () => {
  it("formats across units", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
