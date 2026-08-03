import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MEDIA, media } from "./media";

describe("MEDIA", () => {
  it("curates enough images to fill a long page", () => {
    expect(MEDIA.length).toBeGreaterThanOrEqual(28);
  });

  it("gives every image a category and an orientation", () => {
    const categories = ["lanternHour", "forest", "lodgeLife", "details"];
    const orientations = ["landscape", "portrait", "square"];
    for (const m of MEDIA) {
      expect(categories, `${m.id} category`).toContain(m.category);
      expect(orientations, `${m.id} orientation`).toContain(m.orientation);
    }
  });

  it("never marks an image under 1400px as safe for full-bleed", () => {
    for (const m of MEDIA) {
      if (m.width < 1400) {
        expect(m.fullBleedSafe, `${m.id} is ${m.width}px and cannot go full-bleed`).toBe(false);
      }
    }
  });

  it("has at least four images in each category", () => {
    for (const c of ["lanternHour", "forest", "lodgeLife", "details"]) {
      const n = MEDIA.filter((m) => m.category === c).length;
      expect(n, `only ${n} images in ${c}`).toBeGreaterThanOrEqual(4);
    }
  });

  it("gives every image real alt text", () => {
    for (const m of MEDIA) {
      expect(m.alt.length, `${m.id} has no alt text`).toBeGreaterThan(10);
      expect(m.alt, `${m.id} alt text must not start with "image of"`).not.toMatch(/^image of/i);
    }
  });

  it("has unique ids", () => {
    expect(new Set(MEDIA.map((m) => m.id)).size).toBe(MEDIA.length);
  });

  it("ships a modern format and a fallback for each", () => {
    for (const m of MEDIA) {
      expect(m.avif, m.id).toMatch(/^\/media\/.+\.avif$/);
      expect(m.webp, m.id).toMatch(/^\/media\/.+\.webp$/);
      expect(m.width, m.id).toBeGreaterThan(0);
      expect(m.height, m.id).toBeGreaterThan(0);
    }
  });

  it("throws on an unknown id rather than returning undefined", () => {
    // @ts-expect-error deliberately invalid id
    expect(() => media("no-such-image")).toThrow();
  });

  it("records the true emitted dimensions of the largest derivative on disk, not the source file's", async () => {
    // sharp's .metadata() reads the input header and never runs the pixel
    // pipeline, so if the manifest is built by resizing-then-reading a
    // buffer's own .metadata(), it silently reports the *source's*
    // dimensions instead of what was actually encoded to disk. That
    // mismatch reintroduces client-side upscaling for anything that sets
    // <img width height> from the manifest, exactly what this pipeline was
    // built to avoid. Guard against it by reading the real emitted AVIF
    // back off disk and comparing.
    for (const m of MEDIA) {
      const filePath = path.join(process.cwd(), "public", m.avif);
      const buffer = await readFile(filePath);
      const meta = await sharp(buffer).metadata();
      expect(meta.width, `${m.id}: manifest width ${m.width} does not match the emitted AVIF`).toBe(
        m.width,
      );
      expect(
        meta.height,
        `${m.id}: manifest height ${m.height} does not match the emitted AVIF`,
      ).toBe(m.height);
    }
  });
});
