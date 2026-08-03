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

  it("records the true emitted dimensions of every derivative on disk, not the source file's", async () => {
    // sharp's .metadata() reads the input header and never runs the pixel
    // pipeline, so if the manifest is built by resizing-then-reading a
    // buffer's own .metadata(), it silently reports the *source's*
    // dimensions instead of what was actually encoded to disk. That
    // mismatch reintroduces client-side upscaling for anything that sets
    // <img width height> from the manifest, exactly what this pipeline was
    // built to avoid. Guard against it by reading the real emitted AVIF
    // back off disk and comparing.
    //
    // Widened on 4 Aug 2026 from "the largest derivative" to *every* tier. The
    // manifest now carries a `sources` array that `ui/Photo.tsx` renders as a
    // `srcset`, and a `srcset` width descriptor that lies is worse than no
    // srcset at all: the browser picks a candidate by the width it was
    // promised, so a wrong number there is a wrong *image*, silently, at one
    // viewport size and not another. Checking only the largest would have left
    // the three new tiers entirely unguarded.
    for (const m of MEDIA) {
      for (const s of m.sources) {
        const buffer = await readFile(path.join(process.cwd(), "public", s.avif));
        const meta = await sharp(buffer).metadata();
        expect(meta.width, `${s.avif}: manifest says ${s.width}px`).toBe(s.width);
        expect(meta.height, `${s.avif}: manifest says ${s.height}px`).toBe(s.height);
      }
    }
  });

  it("offers ascending, non-empty tiers whose largest is the canonical entry", async () => {
    // The canonical `width`/`height`/`avif`/`webp` fields are what `<img>` sets
    // its intrinsic box from and what full-bleed eligibility is judged on
    // (CLAUDE.md non-negotiable #10). They must stay the *largest* tier, not
    // merely one of them, or a 1440px entry could advertise itself as
    // fullBleedSafe while serving a 400px file as its fallback.
    for (const m of MEDIA) {
      expect(m.sources.length, `${m.id} has no sources`).toBeGreaterThan(0);

      const widths = m.sources.map((s) => s.width);
      expect(widths, `${m.id} tiers are not ascending`).toEqual([...widths].sort((a, b) => a - b));
      expect(new Set(widths).size, `${m.id} has duplicate tier widths`).toBe(widths.length);

      const largest = m.sources[m.sources.length - 1];
      expect(largest.width, `${m.id}: canonical width is not the largest tier`).toBe(m.width);
      expect(largest.height, `${m.id}: canonical height is not the largest tier`).toBe(m.height);
      expect(largest.avif, `${m.id}: canonical avif is not the largest tier`).toBe(m.avif);
      expect(largest.webp, `${m.id}: canonical webp is not the largest tier`).toBe(m.webp);
    }
  });

  it("serves every photograph small enough for a phone", async () => {
    // The whole point of the 4 Aug 2026 responsive-image work. Without a tier
    // at or under 640px, a 390px phone is handed the 960 or 1440 file however
    // good the `sizes` attribute is — which is exactly the state that put the
    // hero at 4,954 ms on Slow 4G. `<= 640` rather than `== 400` because a
    // source narrower than 400px would legitimately emit only its own width.
    for (const m of MEDIA) {
      expect(
        m.sources[0].width,
        `${m.id}'s smallest tier is ${m.sources[0].width}px — a phone has nothing small to pick`,
      ).toBeLessThanOrEqual(640);
    }
  });

  it("keeps every emitted derivative under the 200 KB budget", async () => {
    // The budget existed only as a console warning until now, so nothing in the
    // suite could catch an oversized file. That is how a 636 KB derivative and
    // an entirely unbudgeted JPEG encoder both shipped unnoticed. This reads the
    // real bytes off disk — the only check that cannot be fooled by the build
    // script's own bookkeeping.
    //
    // Covers every tier, not just the largest: the smaller ones are smaller by
    // construction today, but "by construction" is what the console.warn was
    // trusting too.
    const MAX_BYTES = 200 * 1024;
    for (const m of MEDIA) {
      const files = [m.jpg, ...m.sources.flatMap((s) => [s.avif, s.webp])];
      for (const rel of files) {
        const { size } = await stat(path.join(process.cwd(), "public", rel));
        expect(size, `${rel} is ${(size / 1024).toFixed(1)} KB`).toBeLessThanOrEqual(MAX_BYTES);
      }
    }
  });
});
