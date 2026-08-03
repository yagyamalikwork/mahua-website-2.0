import { readFile, stat } from "node:fs/promises";
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

  it("holds no two entries that are the same photograph", async () => {
    // Unique ids are not unique pictures. Four pairs of these entries were the
    // same photograph under different names on 4 Aug 2026 — two of them
    // pixel-identical — because the mockup pack exported some images twice,
    // once descriptively and once as "mahua-brand-guidelines-v1-forest-NN".
    // Two of those pairs sat inside the *same* four-plate grid, so a chapter
    // would have shown one picture twice, side by side, under two captions.
    //
    // Nothing caught it: the rhythm rule in content/chapters.test.ts forbids
    // repeating a photograph, but it compared ids. This compares the pixels.
    //
    // A 16x16 average hash, so it survives the re-encoding and the differing
    // widths that defeat a byte-for-byte comparison. Distances observed at the
    // time: 0 for the identical pairs, 2 and 8 for the near-identical ones,
    // against 40+ for every genuinely distinct pair. 16 sits well clear of both.
    const MAX_DISTANCE = 16;

    const hashes = await Promise.all(
      MEDIA.map(async (m) => {
        const buf = await sharp(path.join(process.cwd(), "public", m.jpg))
          .grayscale()
          .resize(16, 16, { fit: "fill" })
          .raw()
          .toBuffer();
        const mean = buf.reduce((a, b) => a + b, 0) / buf.length;
        return { id: m.id, bits: Array.from(buf, (v): number => (v > mean ? 1 : 0)) };
      }),
    );

    for (let i = 0; i < hashes.length; i++) {
      for (let j = i + 1; j < hashes.length; j++) {
        const distance = hashes[i].bits.reduce(
          (n, bit, k) => n + (bit === hashes[j].bits[k] ? 0 : 1),
          0,
        );
        expect(
          distance,
          `"${hashes[i].id}" and "${hashes[j].id}" are the same photograph (distance ${distance}/256)`,
        ).toBeGreaterThan(MAX_DISTANCE);
      }
    }
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

  it("keeps every emitted derivative under the 200 KB budget", async () => {
    // The budget existed only as a console warning until now, so nothing in the
    // suite could catch an oversized file. That is how a 636 KB derivative and
    // an entirely unbudgeted JPEG encoder both shipped unnoticed. This reads the
    // real bytes off disk — the only check that cannot be fooled by the build
    // script's own bookkeeping.
    const MAX_BYTES = 200 * 1024;
    for (const m of MEDIA) {
      for (const rel of [m.avif, m.webp, m.jpg]) {
        const { size } = await stat(path.join(process.cwd(), "public", rel));
        expect(size, `${rel} is ${(size / 1024).toFixed(1)} KB`).toBeLessThanOrEqual(MAX_BYTES);
      }
    }
  });
});
