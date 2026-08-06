import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LANTERN_FIT, LANTERN_SIZES } from "@/components/signature/lantern/HangingLantern";
import { LANTERN } from "./lantern-art";
import { LANTERN as SWING } from "./motion";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/**
 * The client's watercolour lantern, hung out of `after-dark` into
 * `06 · The Lantern Hour`.
 *
 * These hold any replacement artwork to the guarantees the component depends on.
 * None of them can tell you whether the drawing is *good*, or whether it hangs
 * where it should — that is `scripts/check_lantern.mjs`, in a browser, and the
 * frames under `docs/reviews/2026-08-07-lantern/`.
 */
describe("the lantern that hangs into The Lantern Hour", () => {
  it("ships every width it advertises", () => {
    for (const w of LANTERN.widths) {
      const file = path.join(ROOT, "public", "brand", `lantern-${w}.webp`);
      expect(() => statSync(file), `public/brand/lantern-${w}.webp is missing`).not.toThrow();
      expect(statSync(file).size).toBeGreaterThan(2000);
    }
  });

  it("carries enough resolution for the largest size it is drawn at, on a 2x screen", () => {
    // 200px is the widest `LANTERN_FIT` draws it. Half the resolution of that on
    // a retina laptop is the failure that shipped a blurred hero in August.
    expect(Math.max(...LANTERN.widths)).toBeGreaterThanOrEqual(200 * 2);
  });

  it("pivots from the top of the chain, not the middle of the box", () => {
    // The component turns this into `transform-origin`. A pivot near the centre
    // would make the lantern a picture being rotated, and the browser rig's
    // swing measurements would all still pass while measuring the wrong motion.
    expect(LANTERN.pivot.y).toBeLessThan(0.05);
    // Not the horizontal centre either — the chain in this drawing is off to one
    // side, and hard-coding 0.5 is the thing the build script exists to avoid.
    expect(LANTERN.pivot.x).toBeGreaterThan(0.1);
    expect(LANTERN.pivot.x).toBeLessThan(0.9);
  });

  it("keeps a portrait aspect, so the lantern hangs rather than lies down", () => {
    expect(LANTERN.height).toBeGreaterThan(LANTERN.width);
    expect(LANTERN.height / LANTERN.width).toBeLessThan(2.5);
  });

  /**
   * The source is a white-background PNG whose alpha channel is entirely opaque.
   * Every tool reports it as having transparency; dropping it on the page as-is
   * puts a white square on cream. `build_lantern.mjs` cuts it — and this is the
   * check that the cut still happened, because the *generated* module looks
   * identical either way.
   */
  it("was encoded from artwork whose white ground is actually cut", () => {
    const script = read("scripts/build_lantern.mjs");
    expect(script).toMatch(/flood fill|cleared\[/i);
    // The script throws rather than shipping a white box if the fill stops
    // finding a background — that guard is the thing worth having, so assert it
    // exists rather than that a comment mentions it.
    expect(script).toContain("would ship a white box");
  });

  it("draws no larger than the artwork it has", () => {
    expect(Math.max(...LANTERN.widths)).toBeLessThanOrEqual(LANTERN.width);
  });
});

/**
 * `LANTERN_SIZES` tells the browser how wide the lantern will be; `LANTERN_FIT`
 * decides how wide it actually is. Two hand-written lists describing one
 * geometry is how they drift apart, and a `sizes` that disagrees with the layout
 * fetches the wrong file — exactly the cover-box defect that shipped a blurred
 * hero and a blurred tiger (`lib/sizes.test.ts`).
 */
describe("the lantern's declared widths match the ones it is drawn at", () => {
  /** `(min-width: N) Mpx` pairs, plus the trailing default. */
  const declared = LANTERN_SIZES.split(",").map((entry) => {
    const min = entry.match(/min-width:\s*(\d+)px/);
    const px = entry.match(/(\d+)px\s*$/);
    return { from: min ? Number(min[1]) : 0, width: Number(px?.[1]) };
  });

  /** What `LANTERN_FIT` actually applies, read off the class list. */
  const drawn = (() => {
    const out: { from: number; to: number; width: number | null }[] = [];
    const base = LANTERN_FIT.match(/(?:^|\s)w-\[(\d+)px\]/);
    for (const [, from, to, w] of LANTERN_FIT.matchAll(
      /\[@media\(min-width:(\d+)px\)_and_\(max-width:(\d+)px\)\]:(?:w-\[(\d+)px\]|hidden)/g,
    )) {
      out.push({ from: Number(from), to: Number(to), width: w ? Number(w) : null });
    }
    for (const [, from, w] of LANTERN_FIT.matchAll(/\[@media\(min-width:(\d+)px\)\]:w-\[(\d+)px\]/g)) {
      out.push({ from: Number(from), to: Infinity, width: Number(w) });
    }
    out.push({ from: 0, to: Math.min(...out.map((o) => o.from)) - 1, width: Number(base?.[1]) });
    return out.sort((a, b) => a.from - b.from);
  })();

  it("reads a fit for every band, including the hidden one", () => {
    expect(drawn.length).toBeGreaterThanOrEqual(4);
    expect(drawn.some((d) => d.width === null)).toBe(true);
  });

  it("covers the width axis with no gap and no overlap", () => {
    // Overlapping min-width rules only work if you can predict how Tailwind
    // sorts them, and on 7 Aug 2026 it sorted an arbitrary `min-[1440px]:` ahead
    // of a named `xl:` — so the lantern shipped 128px wide at 1920 where 200 was
    // meant, with every other check green.
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i].from, `band starting ${drawn[i].from} does not butt the one before it`).toBe(
        drawn[i - 1].to + 1,
      );
    }
    expect(drawn[0].from).toBe(0);
    expect(drawn[drawn.length - 1].to).toBe(Infinity);
  });

  it.each([390, 768, 1024, 1280, 1440, 1920, 2560])(
    "declares at %ipx the width it draws there",
    (width) => {
      const band = drawn.find((d) => width >= d.from && width <= d.to);
      expect(band, `no band covers ${width}px`).toBeDefined();
      // Where it is hidden nothing is fetched, so `sizes` is free to say anything.
      if (band?.width === null) return;
      const entry = declared.find((d) => width >= d.from);
      expect(entry?.width, `sizes promises ${entry?.width}px at ${width}px`).toBe(band?.width);
    },
  );
});

describe("the pendulum's dials", () => {
  it("swings at a period a hanging lantern would have", () => {
    const period = (2 * Math.PI) / Math.sqrt(SWING.stiffness);
    expect(period).toBeGreaterThan(1.2);
    expect(period).toBeLessThan(2.2);
  });

  it("is under-damped, so it oscillates rather than easing back", () => {
    // At ζ >= 1 the lantern would return to plumb without crossing it once,
    // which is a tween wearing a pendulum's name.
    const zeta = SWING.damping / (2 * Math.sqrt(SWING.stiffness));
    expect(zeta).toBeGreaterThan(0.05);
    expect(zeta).toBeLessThan(0.35);
  });

  it("comes to rest inside a few seconds", () => {
    // The amplitude envelope decays as e^(-ζωt). ζ was 0.1 for one build, which
    // is physically the honest figure and left the frame loop running for 13.5
    // seconds after a push — peripheral motion by another name.
    const zetaOmega = SWING.damping / 2;
    const settle = Math.log(SWING.maxAngleDeg / SWING.restDeg) / zetaOmega;
    expect(settle).toBeLessThan(9);
  });

  it("pairs its two rest thresholds so neither is the one that always fires", () => {
    // At an amplitude of `restDeg` this oscillator's peak velocity is
    // `restDeg * sqrt(stiffness)`. A `restVel` far above that would stop the
    // lantern mid-swing; far below it, the loop would run on at a standstill.
    const peakVelAtRestAngle = SWING.restDeg * Math.sqrt(SWING.stiffness);
    expect(SWING.restVel).toBeGreaterThan(peakVelAtRestAngle * 0.6);
    expect(SWING.restVel).toBeLessThan(peakVelAtRestAngle * 1.8);
  });

  it("clamps hard enough that a flick cannot spin it over its chain", () => {
    expect(SWING.maxAngleDeg).toBeLessThanOrEqual(20);
  });
});

describe("the lantern is decorative and inert", () => {
  const src = read("components/signature/lantern/HangingLantern.tsx");

  it("is hidden from assistive technology", () => {
    expect(src).toContain('aria-hidden="true"');
    expect(src).toMatch(/alt=""/);
  });

  it("takes no pointer events, so it cannot eat a click on the copy beneath it", () => {
    expect(src).toMatch(/pointerEvents:\s*"none"/);
  });

  it("is lazily loaded, being eight screens below the fold", () => {
    expect(src).toContain('loading="lazy"');
  });

  it("stands still under reduced motion and on a coarse pointer", () => {
    expect(src).toContain("prefers-reduced-motion: reduce");
    expect(src).toContain("(pointer: fine)");
  });

  it("integrates against real elapsed time rather than one frame", () => {
    // A fixed per-frame step swings at half speed on a 30Hz laptop and double on
    // a 120Hz display.
    expect(src).toMatch(/now - last/);
    expect(src).toContain("SWING.maxStep");
  });

  it("carries no Tailwind transform utility that could compose with its rotation", () => {
    // Tailwind v4 compiles `rotate-*` and `scale-*` to the `rotate`/`scale`
    // properties, which compose with `transform` rather than replacing it — the
    // trap that stranded an entrance half-staged on 5 Aug 2026.
    expect(LANTERN_FIT).not.toMatch(/(?:^|\s|:)(?:-?rotate-|-?scale-|-?translate-)/);
  });
});
