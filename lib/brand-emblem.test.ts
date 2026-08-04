import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { EMBLEM } from "./brand-emblem";

const asset = (rel: string) => path.join(process.cwd(), "public", "brand", rel);

describe("EMBLEM", () => {
  it("emits every width the header offers in its srcset", async () => {
    // `BrandMark` builds its srcset from `EMBLEM.widths`. A width listed here
    // with no file behind it is a 404 in the header of every page — and the
    // <picture> would fall back silently, so nothing else would notice.
    for (const w of EMBLEM.widths) {
      await expect(stat(asset(`emblem-${w}.webp`)), `emblem-${w}.webp is missing`).resolves.toBeTruthy();
    }
    await expect(
      stat(asset(`emblem-${EMBLEM.fallback}.png`)),
      "the <picture> fallback is missing",
    ).resolves.toBeTruthy();
  });

  it("keeps the header mark under 8 KB at every width", async () => {
    // The header is above the fold on every load, so this is paid by every
    // visitor on the slowest connection. The client's source lockup is a 127 KB
    // SVG; the whole point of scripts/build_brand.mjs is that it never ships.
    for (const w of EMBLEM.widths) {
      const { size } = await stat(asset(`emblem-${w}.webp`));
      expect(size, `emblem-${w}.webp is ${(size / 1024).toFixed(1)} KB`).toBeLessThanOrEqual(8 * 1024);
    }
  });

  it("records the true emitted width of each file, not the intended one", async () => {
    // The srcset descriptor is a promise to the browser about what it will get.
    // A `w` that lies makes the browser pick by the wrong number, which is a
    // wrong image at one viewport and not another — the exact defect this
    // project shipped once already on its photographs.
    for (const w of EMBLEM.widths) {
      const meta = await sharp(asset(`emblem-${w}.webp`)).metadata();
      expect(meta.width, `emblem-${w}.webp is actually ${meta.width}px`).toBe(w);
    }
  });

  it("describes the artwork's real proportions", async () => {
    // `BrandMark` sets width/height from these so the header reserves its box
    // before the image lands. The header sits over the LCP element; a box that
    // resolves late shifts the thing Lighthouse is timing.
    const meta = await sharp(asset(`emblem-${EMBLEM.fallback}.png`)).metadata();
    const emitted = (meta.width ?? 0) / (meta.height ?? 1);
    expect(emitted).toBeCloseTo(EMBLEM.aspectRatio, 2);
    expect(EMBLEM.width / EMBLEM.height).toBeCloseTo(EMBLEM.aspectRatio, 3);
  });
});
