import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HERO_BOX, HERO_SIZES } from "@/components/sections/Hero";
import {
  BOXES as INTRO_BOXES,
  SIZES as INTRO_SIZES,
} from "@/components/sections/ChapterIntro";
import { BOXES as LODGE_BOXES, SIZES as LODGE_SIZES } from "@/components/sections/LodgeCards";
import { PLATE_FRAME, PLATE_SIZES } from "@/components/sections/PlateGrid";
import { BOXES as SPLIT_BOXES, SIZES as SPLIT_SIZES } from "@/components/sections/SplitFeature";
import {
  BOXES as TESTIMONIAL_BOXES,
  SIZES as TESTIMONIAL_SIZES,
} from "@/components/sections/Testimonials";
import {
  BOXES as COLLAGE_BOXES,
  SIZES as COLLAGE_SIZES,
} from "@/components/motion/PinnedCollage";
import { EMBLEM_SIZES } from "@/components/ui/BrandMark";
import { FULL_BLEED_SIZES } from "@/components/ui/FullBleed";
import { MEDIA } from "./media";
import {
  capDensity,
  type CoverBox,
  coverSizes,
  DENSITY_BUCKETS,
  DENSITY_CAP,
  splitTopLevel,
} from "./sizes";

/**
 * These tests guard the *strings*. Whether Chrome then picks the tier we intended
 * is a browser question and is measured on the real page by
 * `scripts/check_image_resolution.mjs`, which reports the effective density of
 * every photograph at DPR 1, 2 and 3 and fails below the cap; whether the result
 * looks sharp is measured by `scripts/measure_sharpness.mjs`. None of the three
 * substitutes for the others: this one cannot see a browser, the second cannot
 * see a photograph, and neither of those can run in CI without a build.
 */
describe("capDensity", () => {
  it("leaves the original list intact as the fallback tail", () => {
    const original = "(min-width: 1024px) 42vw, 100vw";
    expect(capDensity(original).endsWith(original)).toBe(true);
  });

  it("puts the densest bucket first, because the first match wins", () => {
    const out = capDensity("100vw");
    expect(out.indexOf("3.5x")).toBeLessThan(out.indexOf("2.5x"));
    expect(out.indexOf("2.5x")).toBeLessThan(out.lastIndexOf("100vw"));
  });

  it("scales a bare length", () => {
    expect(capDensity("100vw")).toBe(
      "(min-resolution: 3.5x) calc(0.5 * 100vw), (min-resolution: 2.5x) calc(0.667 * 100vw), 100vw",
    );
  });

  it("keeps each entry's own media condition and ands the resolution onto it", () => {
    const out = capDensity("(min-width: 1024px) 42vw, 100vw");
    expect(out).toContain("(min-width: 1024px) and (min-resolution: 2.5x) calc(0.667 * 42vw)");
    expect(out).toContain("(min-resolution: 2.5x) calc(0.667 * 100vw)");
  });

  it("unwraps an existing calc() rather than nesting one inside another", () => {
    const out = capDensity("calc((100vw - 72px) * 0.82)");
    expect(out).toContain("calc(0.667 * ((100vw - 72px) * 0.82))");
    expect(out).not.toContain("calc(0.667 * calc(");
  });

  it("does not split on a comma inside a function", () => {
    // No caller writes this today; one will. A naive split(",") turns it into
    // two entries the browser drops, and the photograph silently reverts to
    // 100vw — the exact class of failure `sizes` bugs belong to.
    const out = capDensity("min(50vw, 400px)");
    expect(out).toContain("calc(0.667 * min(50vw, 400px))");
    expect(splitTopLevel(out)).toHaveLength(3);
  });

  it("refuses a shape it cannot parse instead of quietly skipping the cap", () => {
    expect(() => capDensity("(min-width: 1024px)")).toThrow(/no length/);
    expect(() => capDensity("(min-width: 1024px 42vw")).toThrow(/unbalanced/);
    expect(() => capDensity("not all 42vw")).toThrow(/unsupported/);
  });

  it("the cap is 2 — the number the byte/sharpness trade was argued at", () => {
    expect(DENSITY_CAP).toBe(2);
  });
});

/**
 * Every `sizes` string the page actually serves, **imported from the components
 * that use them** rather than copied here.
 *
 * The copied version covered 8 of 15. The seven it missed included all three
 * `PLATE_SIZES` and both of `Testimonials`', and since `capDensity` *throws*, an
 * unparseable string among them would have been a 500 at request time rather
 * than a red test. Importing is what makes that impossible: a new key in any of
 * these objects is covered the moment it is written, with no second list to
 * remember.
 */
type Slot = { readonly name: string; readonly sizes: string; readonly box?: CoverBox };

const LIVE_SLOTS: readonly Slot[] = [
  { name: "Hero", sizes: HERO_SIZES, box: HERO_BOX },
  // `FullBleed`'s box height varies with `heightVh`; every use on the page is
  // 100, which oversizes to ~127.6vh for the parallax buffer.
  { name: "FullBleed", sizes: FULL_BLEED_SIZES, box: { viewportHeightVh: 127.6 } },
  // The header emblem. No `box`: it is `object-fit` nothing — a transparent mark
  // drawn at its own aspect inside an auto-width slot, so the box IS the drawn
  // content and there is no cover crop to correct for.
  { name: "BrandMark", sizes: EMBLEM_SIZES },
  ...(["solo", "pairTop", "pairLower"] as const).map((k) => ({
    name: `ChapterIntro.${k}`,
    sizes: INTRO_SIZES[k],
    box: INTRO_BOXES[k] as CoverBox,
  })),
  // Same three widths as `ChapterIntro` — the same columns, laid out the same
  // way — but shallower boxes, so the crop factor and therefore the file served
  // are different. Sharing a `sizes` string does not share a `sizes` *outcome*,
  // which is why these three are their own slots and not a comment saying "as
  // above".
  ...(["solo", "pairTop", "pairLower"] as const).map((k) => ({
    name: `PinnedCollage.${k}`,
    sizes: COLLAGE_SIZES[k],
    box: COLLAGE_BOXES[k] as CoverBox,
  })),
  ...(["primary", "secondary"] as const).map((k) => ({
    name: `LodgeCards.${k}`,
    sizes: LODGE_SIZES[k],
    box: LODGE_BOXES[k] as CoverBox,
  })),
  { name: "SplitFeature.wide (band 1)", sizes: SPLIT_SIZES.wide, box: SPLIT_BOXES.wideStacked },
  { name: "SplitFeature.wide (band 2)", sizes: SPLIT_SIZES.wide, box: SPLIT_BOXES.wide },
  { name: "SplitFeature.inlayWide", sizes: SPLIT_SIZES.inlayWide, box: SPLIT_BOXES.inlayWide },
  { name: "SplitFeature.inlayTall", sizes: SPLIT_SIZES.inlayTall, box: SPLIT_BOXES.inlayTall },
  { name: "SplitFeature.aside", sizes: SPLIT_SIZES.aside, box: SPLIT_BOXES.aside },
  { name: "SplitFeature.sticky", sizes: SPLIT_SIZES.sticky, box: SPLIT_BOXES.sticky },
  // An unframed plate is `h-auto`, so nothing is cropped and there is no box to
  // describe. A grid whose plates disagree about their shape imposes one on all
  // of them, and then there is — every frame against every plate width, since
  // which frame a grid picks depends on the photographs it happens to carry.
  ...Object.entries(PLATE_SIZES).flatMap(([k, v]) => [
    { name: `PlateGrid.${k}-up`, sizes: v },
    ...Object.entries(PLATE_FRAME).map(([f, frame]) => ({
      name: `PlateGrid.${k}-up framed ${f}`,
      sizes: v,
      box: frame.ratio as CoverBox,
    })),
  ]),
  ...(["wide", "tall"] as const).map((k) => ({
    name: `Testimonials.${k}`,
    sizes: TESTIMONIAL_SIZES[k],
    box: TESTIMONIAL_BOXES[k] as CoverBox,
  })),
];

describe("the sizes the page actually serves", () => {
  it("covers every distinct sizes string on the page", () => {
    // A deliberate tripwire, not a fact worth asserting for its own sake. This
    // list started as eight of the fifteen strings actually in use, and the
    // seven it missed would each have thrown at request time rather than failed
    // in CI. Adding a slot must be a decision, so adding one fails here until
    // the number is changed on purpose. The companion test below — which reads
    // the components off disk — is what stops a NEW component being forgotten
    // entirely; this one stops the table being edited carelessly.
    // 17 since 5 Aug 2026: `SplitFeature.aside`, the pool laid under band 2's
    // display line (`docs/reviews/2026-08-05-density/`). The plate frames added
    // in the same change reuse `PLATE_SIZES`' strings and so add no distinct one.
    // `PinnedCollage`'s three slots, added the same day, are three more entries
    // in the table and no more distinct strings: it lays its photographs out in
    // the same three columns at the same widths as `ChapterIntro`, so it reaches
    // for the same three strings deliberately. It is still worth its own rows —
    // its boxes differ, and every assertion below runs per slot, not per string.
    expect(new Set(LIVE_SLOTS.map((s) => s.sizes)).size).toBe(17);
  });

  it.each(LIVE_SLOTS.map((s) => [s.name, s.sizes] as const))(
    "%s survives capDensity's round trip",
    (_name, s) => {
      const out = capDensity(s);
      expect(out.endsWith(s)).toBe(true);

      // One capped entry per bucket per original entry, plus the original list —
      // which is what the comment here promised for two days while the assertion
      // beneath it was `expect(n).toBeGreaterThan(0)` on a value that cannot be
      // zero. Counted with the module's own splitter, not a regex approximation
      // of it living in the test.
      const original = splitTopLevel(s);
      const emitted = splitTopLevel(out);
      expect(emitted).toHaveLength(original.length * (DENSITY_BUCKETS.length + 1));
      for (const bucket of DENSITY_BUCKETS) {
        const marker = `(min-resolution: ${bucket.minResolution})`;
        expect(emitted.filter((e) => e.includes(marker))).toHaveLength(original.length);
      }
    },
  );

  it.each(LIVE_SLOTS.map((s) => [s.name, s] as const))(
    "%s stays parseable for every photograph in the library",
    (_name, slot) => {
      // `capDensity` throws rather than silently skipping the cap, and
      // `coverSizes` runs first and rewrites every entry — so a slot that is
      // fine for a 3:2 frame and broken for a 16:9 one would be a 500 at request
      // time on one chapter only. All 34 x every slot, in CI.
      for (const entry of MEDIA) {
        const out = coverSizes(slot.sizes, slot.box, entry.width / entry.height);
        expect(() => capDensity(out)).not.toThrow();
      }
    },
  );

  /**
   * The list above is only complete if no component has a `sizes` this file does
   * not import. Rather than trust that, read the components: any file passing a
   * `sizes` prop must be one this test imports from.
   */
  it("imports from every component that passes a sizes prop", () => {
    const root = path.resolve(import.meta.dirname, "..");
    const self = readFileSync(path.join(root, "lib", "sizes.test.ts"), "utf8");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory()
          ? walk(path.join(dir, d.name))
          : d.name.endsWith(".tsx")
            ? [path.join(dir, d.name)]
            : [],
      );

    const passers = walk(path.join(root, "components"))
      .filter((f) => /\bsizes=\{|\bsizes="/.test(readFileSync(f, "utf8")))
      // `ui/Photo.tsx` and `ui/Plate.tsx` forward the caller's `sizes`; they
      // originate none of their own.
      .filter((f) => !/[\\/]ui[\\/](Photo|Plate)\.tsx$/.test(f));

    expect(passers.length).toBeGreaterThan(0);
    for (const file of passers) {
      const specifier = `@/${path.relative(root, file).replace(/\\/g, "/").replace(/\.tsx$/, "")}`;
      expect(self, `${specifier} passes a sizes prop but nothing here imports it`).toContain(
        specifier,
      );
    }
  });
});

/**
 * The two halves of a cover crop, held together.
 *
 * A photograph in an `object-fit: cover` box is drawn wider than its box
 * whenever the box is taller than the photograph, and `sizes` has to describe
 * the *drawn* width or the browser fetches a file a quarter of the resolution it
 * needs. That was a Critical on this branch: the hero and the tiger shipped
 * visibly blurred on a phone, and the rig built to catch it measured the box too.
 *
 * The fix pairs a Tailwind `aspect-[a/b]` class in the markup with a ratio in a
 * `BOXES` constant, and **nothing connected the two**. A reviewer demonstrated
 * it precisely: deleting `box={HERO_BOX}` from `Hero.tsx`, and flattening
 * `ChapterIntro`'s `BOXES.solo` to a single ratio, each reintroduced the defect
 * with the whole suite still green. `BOXES` is a hand transcription of classes
 * written somewhere else in the same file, and only a browser rig — a build plus
 * a server, not `npm test` — ever compared them.
 *
 * These two tests are that comparison, in CI, on the source text.
 */
describe("cover boxes match the markup they describe", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

  /** Every distinct aspect ratio written as a Tailwind class in a file. */
  const ratiosInMarkup = (src: string): Set<number> => {
    const found = new Set<number>();
    for (const [, a, b] of src.matchAll(/aspect-\[(\d+)\/(\d+)\]/g)) {
      found.add(Number(a) / Number(b));
    }
    if (/aspect-square/.test(src)) found.add(1);
    return found;
  };

  /**
   * Every distinct aspect ratio a `BOXES`-style declaration resolves to.
   *
   * Walks the four shapes a box is written in rather than collecting every
   * number it can find. A blind walk picks up the `0` in a `[0, 3/2]` breakpoint
   * pair and the `100` in `{ viewportHeightVh: 100 }` and calls them aspect
   * ratios — which is how the first draft of this test failed three components
   * that were perfectly correct.
   */
  const ratiosDeclared = (box: unknown): Set<number> => {
    const found = new Set<number>();
    const walk = (v: unknown): void => {
      if (typeof v === "number") {
        found.add(v);
      } else if (Array.isArray(v)) {
        // A breakpoint list: `[minWidth, ratio]` pairs. Only the ratio is one.
        for (const entry of v) {
          if (Array.isArray(entry)) walk(entry[1]);
          else walk(entry);
        }
      } else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        // A viewport-height box describes a share of the screen, not a shape,
        // and produces no `aspect-*` class to compare against.
        if ("viewportHeightVh" in o) return;
        if ("ratio" in o) return void walk(o.ratio);
        Object.values(o).forEach(walk);
      }
    };
    walk(box);
    return found;
  };

  const CASES: readonly { file: string; declared: unknown }[] = [
    { file: "components/sections/Hero.tsx", declared: HERO_BOX },
    { file: "components/sections/ChapterIntro.tsx", declared: INTRO_BOXES },
    { file: "components/sections/LodgeCards.tsx", declared: LODGE_BOXES },
    { file: "components/sections/SplitFeature.tsx", declared: SPLIT_BOXES },
    { file: "components/sections/Testimonials.tsx", declared: TESTIMONIAL_BOXES },
    { file: "components/sections/PlateGrid.tsx", declared: PLATE_FRAME },
    { file: "components/motion/PinnedCollage.tsx", declared: COLLAGE_BOXES },
  ];

  it.each(CASES.map((c) => [c.file, c.declared] as const))(
    "%s declares exactly the ratios its markup uses",
    (file, declared) => {
      const inMarkup = [...ratiosInMarkup(read(file))].sort((a, b) => a - b);
      const inCode = [...ratiosDeclared(declared)].sort((a, b) => a - b);

      // Set equality, both directions on purpose. A ratio in the markup that
      // nothing declares is a photograph whose `sizes` never learns it is being
      // cropped; a declared ratio no class produces is a `sizes` describing a
      // box that does not exist.
      expect(inCode, `${file}: declared ratios do not match its aspect-* classes`).toEqual(inMarkup);
    },
  );

  it("passes a box to every Photo that sits in one", () => {
    // The other half. Set equality above cannot see a `box={...}` deleted from
    // the JSX while its constant stays declared and its class stays in the
    // markup — which is exactly what the reviewer did to `Hero.tsx`. Every
    // `<Photo` in these files is inside a cover box, so the counts must agree.
    for (const { file } of CASES) {
      const src = read(file);
      const photos = (src.match(/<Photo\b/g) ?? []).length;
      const boxes = (src.match(/\bbox=/g) ?? []).length;
      if (photos === 0) continue; // PlateGrid hands its frame to `ui/Plate.tsx`.
      expect(boxes, `${file}: ${photos} <Photo> but ${boxes} box= props`).toBe(photos);
    }
  });

  it("refuses a viewport-height box it cannot honour, rather than discarding the width", () => {
    // A `viewportHeightVh` box rebuilds the width list from the viewport's own
    // aspect, which is only correct for a full-width box. It used to ignore the
    // caller's list without saying so: "50vw" in, "375vw" out.
    expect(() => coverSizes("50vw", { viewportHeightVh: 100 }, 3 / 2)).toThrow(/only accepts "100vw"/);
    expect(() => coverSizes("100vw", { viewportHeightVh: 100 }, 3 / 2)).not.toThrow();
  });

  it("keeps ui/Plate.tsx forwarding its frame ratio to the photograph", () => {
    // PlateGrid is the one case the count check above skips, because its box
    // travels as `frame` through `ui/Plate.tsx`. If that forwarding is dropped,
    // three chapters' plates go back to being sized by their box.
    expect(read("components/ui/Plate.tsx"), "Plate no longer forwards frame.ratio to Photo").toMatch(
      /box=\{\s*frame\?\.\s*ratio\s*\}/,
    );
  });
});

describe("coverSizes", () => {
  it("leaves a box the photograph exactly fills alone", () => {
    expect(coverSizes("(min-width: 1024px) 42vw, 100vw", 3 / 2, 3 / 2)).toBe(
      "(min-width: 1024px) 42vw, 100vw",
    );
  });

  it("leaves a portrait photograph in a landscape box alone — cover crops the top and bottom", () => {
    // 2:3 in a 3:2 box scales to the box's width and overflows vertically. The
    // extra pixels are height, and `sizes` is a width.
    expect(coverSizes("50vw", 3 / 2, 2 / 3)).toBe("50vw");
  });

  it("scales a landscape photograph by exactly how far past the box it is drawn", () => {
    // 3:2 in a 4:5 box: 1.5 / 0.8 = 1.875.
    expect(coverSizes("40vw", 4 / 5, 3 / 2)).toBe("calc(1.875 * 40vw)");
  });

  it("uses the worst ratio over each entry's own range of widths", () => {
    // The box is 7:9 from 1024px and 3:2 below it; the width list breaks at 1024
    // and at 768. The 1024 entry sees only 7:9 (1.5/0.778 = 1.929); the other two
    // see only 3:2, which crops nothing.
    const out = coverSizes(
      "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
      [
        [1024, 7 / 9],
        [0, 3 / 2],
      ],
      3 / 2,
    );
    expect(out).toBe(
      "(min-width: 1024px) calc(1.929 * 42vw), (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
    );
  });

  it("takes the worst ratio when a box breakpoint falls inside one width entry", () => {
    // One entry covering everything below 1024px, a box that is 4:5 below 640px
    // and 16:9 above it. The 4:5 half is the one that must not be under-served.
    const out = coverSizes(
      "100vw",
      [
        [640, 16 / 9],
        [0, 4 / 5],
      ],
      3 / 2,
    );
    expect(out).toBe("calc(1.875 * 100vw)");
  });

  it("describes a viewport-sized box with aspect-ratio conditions, densest crop first", () => {
    const out = coverSizes("100vw", { viewportHeightVh: 100 }, 3 / 2);
    // 3:2 in a 0.4:1 box is drawn 3.75x the box's width; in a 1.5:1 box, exactly once.
    expect(out).toBe(
      "(max-aspect-ratio: 1/2) 375vw, (max-aspect-ratio: 2/3) 300vw, (max-aspect-ratio: 1/1) 225vw, (max-aspect-ratio: 3/2) 150vw, 100vw",
    );
  });

  it("accounts for a viewport box taller than the viewport", () => {
    // FullBleed oversizes its picture so parallax cannot uncover bare canvas; the
    // extra height is extra cover-crop and has to be paid for.
    const out = coverSizes("100vw", { viewportHeightVh: 127.6 }, 3 / 2);
    expect(out.startsWith("(max-aspect-ratio: 1/2) 478.5vw")).toBe(true);
  });

  it("collapses viewport buckets that ask for the same width", () => {
    // A 2:3 portrait is never cropped horizontally in a landscape-ish box, so
    // four of the five buckets would otherwise emit an identical `100vw`.
    const out = coverSizes("100vw", { viewportHeightVh: 100 }, 2 / 3);
    expect(splitTopLevel(out)).toEqual([
      "(max-aspect-ratio: 1/2) 166.7vw",
      "(max-aspect-ratio: 2/3) 133.3vw",
      "100vw",
    ]);
  });

  it("refuses a condition it cannot place on the width axis", () => {
    expect(() => coverSizes("(orientation: portrait) 50vw, 100vw", 1, 3 / 2)).toThrow(/min-width/);
  });

  it("is a no-op when no box is given, so an uncropped photograph is unaffected", () => {
    expect(coverSizes("(min-width: 640px) 50vw, 100vw", undefined, 3 / 2)).toBe(
      "(min-width: 640px) 50vw, 100vw",
    );
  });
});
