/**
 * How much pixel density this site is willing to pay for.
 *
 * ## Why there is a cap at all
 *
 * A `srcset` with `w` descriptors and a correct `sizes` does exactly what it is
 * told: it multiplies the CSS box by the device's pixel ratio and fetches a file
 * at least that wide. That is right, and until 4 Aug 2026 nobody had measured
 * what it costs, because every performance figure this project had ever
 * committed was taken at `deviceScaleFactor: 1` — which is not a phone.
 *
 * Measured on the production build, 390x844, Slow 4G (1.6 Mbps / 150 ms RTT /
 * 4x CPU), before this file existed:
 *
 * | DPR | first-fold images | first screen visually complete |
 * |-----|-------------------|--------------------------------|
 * | 1   | 84 KB             | 1,802 ms                       |
 * | 1.75| 223 KB            | 2,998 ms                       |
 * | 3   | **595 KB**        | **4,779 ms**                   |
 *
 * The hero alone was the 1440px file, 191.5 KB, `responseEnd` 4,730 ms. Most of
 * this site's traffic is Indian mobile, where DPR 2.6-3 is the norm, so the
 * 4,779 ms row is the one real visitors were getting.
 *
 * The perceptual return above roughly 2x is small — it is the difference
 * between "sharp" and "sharp"; the byte cost is not: 1440 -> 960 is 191.5 KB ->
 * 97.7 KB for the hero, and the same halving repeats across every photograph on
 * the screen. CLAUDE.md non-negotiable #6 is explicit that when a beautiful
 * effect cannot hit budget, the effect loses. This is the smallest version of
 * losing: one notch of oversampling on dense screens, no photograph removed, no
 * layout changed.
 *
 * ## How it is expressed
 *
 * There is no way to read `devicePixelRatio` from a `sizes` attribute, and no
 * need to: a `sizes` entry may carry any media condition, and `resolution` is a
 * media feature. So the cap is stated declaratively as extra, higher-priority
 * entries at the front of the list — the browser evaluates left to right and
 * takes the first match, so the dense-screen entries must lead.
 *
 * Verified in Chrome against the real `<picture>` at 390px wide
 * (`scripts/check_image_resolution.mjs` re-checks this on the live page):
 *
 * | DPR   | uncapped | capped |
 * |-------|----------|--------|
 * | 1     | 400      | 400    |
 * | 1.75  | 960      | 960    |
 * | 2     | 960      | 960    |
 * | 2.625 | **1440** | 960    |
 * | 3     | **1440** | 960    |
 * | 4     | 1440     | 1440   |
 *
 * Nothing below 2.5x is touched, which is why this changes no byte of what
 * Lighthouse's mobile emulation (DPR 1.75) downloads. It is aimed at handsets,
 * not at the score.
 */
export const DENSITY_CAP = 2;

/**
 * Bucket boundaries. A `sizes` entry cannot know the exact ratio, only which
 * side of a threshold it is on, so each bucket scales by the factor that keeps
 * the *worst* ratio in that bucket at or under `DENSITY_CAP` while never asking
 * for less than roughly 1.7x:
 *
 * - 2.5x-3.5x scaled by 2/3 -> asks for 1.67x-2.33x
 * - 3.5x and above scaled by 1/2 -> asks for 1.75x and up
 *
 * Listed densest-first, because the first matching entry wins.
 */
export const DENSITY_BUCKETS: readonly { readonly minResolution: string; readonly factor: number }[] =
  [
    { minResolution: "3.5x", factor: 0.5 },
    { minResolution: "2.5x", factor: 2 / 3 },
  ];

/**
 * Splits a `sizes` list on its top-level commas. Commas inside `calc()` are not
 * separators — `calc((100vw - 72px) * 0.82)` has none today, but `min()` and
 * `clamp()` do, and a naive `split(",")` would quietly corrupt them into two
 * broken entries that the browser drops, leaving the photograph at 100vw and
 * nobody any the wiser.
 *
 * Exported for `sizes.test.ts`, which needs to count an output list's entries
 * and previously carried its own regex approximation of this — a second,
 * *different* splitter inside the test guarding the first one.
 */
export function splitTopLevel(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      out.push(list.slice(start, i));
      start = i + 1;
    }
  }
  out.push(list.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Separates an entry's media condition from its length.
 *
 * A `<source-size>` is `<media-condition>? <source-size-value>`, and the two are
 * told apart by a rule that happens to be exact for CSS: a media condition
 * begins with `(` or with `not`/`only`, while a length begins with a number or
 * with a function *name* (`calc`, `min`, `clamp`) — an identifier — so `calc(`
 * can never be mistaken for a condition.
 *
 * Anything this cannot parse **throws**. A `sizes` string is invisible in review
 * and invisible in a snapshot test; silently returning it uncapped would mean a
 * future author writes a shape this does not understand and simply never gets
 * the cap, with no signal anywhere. Failing the build is the only version of
 * this that stays true.
 */
function splitEntry(entry: string): { condition: string | null; value: string } {
  if (!entry.startsWith("(")) {
    if (/^(not|only)\b/.test(entry)) {
      throw new Error(`sizes: unsupported media condition in ${JSON.stringify(entry)}`);
    }
    return { condition: null, value: entry };
  }

  let depth = 0;
  let i = 0;
  for (; i < entry.length; i++) {
    if (entry[i] === "(") depth++;
    else if (entry[i] === ")") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  if (depth !== 0) throw new Error(`sizes: unbalanced parentheses in ${JSON.stringify(entry)}`);

  let rest = entry.slice(i).trim();
  // `(a) and (b) 42vw` — keep absorbing combinators.
  while (/^(and|or)\b/.test(rest)) {
    const combinator = /^(and|or)\b/.exec(rest)![1];
    rest = rest.slice(combinator.length).trim();
    if (!rest.startsWith("(")) {
      throw new Error(`sizes: ${combinator} not followed by a condition in ${JSON.stringify(entry)}`);
    }
    depth = 0;
    let j = 0;
    for (; j < rest.length; j++) {
      if (rest[j] === "(") depth++;
      else if (rest[j] === ")") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    rest = rest.slice(j).trim();
  }

  const condition = entry.slice(0, entry.length - rest.length).trim();
  if (!rest) throw new Error(`sizes: no length after the media condition in ${JSON.stringify(entry)}`);
  return { condition, value: rest };
}

/**
 * Wraps a length in a scaling `calc()`. An existing `calc(...)` is unwrapped
 * into a plain parenthesised group first — `calc(0.67 * (X))` rather than
 * `calc(0.67 * calc(X))`, which is legal but which no one should have to
 * squint at in DevTools.
 */
function scale(value: string, factor: number): string {
  const rounded = Math.round(factor * 1000) / 1000;
  const inner = /^calc\(([\s\S]*)\)$/.exec(value.trim());
  return inner ? `calc(${rounded} * (${inner[1]}))` : `calc(${rounded} * ${value})`;
}

/**
 * Rewrites a `sizes` list so that screens denser than `DENSITY_CAP` are served
 * roughly `DENSITY_CAP` device pixels per CSS pixel instead of their own ratio.
 *
 * The original list is preserved verbatim as the tail, so every screen below the
 * threshold — which is every desktop, and Lighthouse's mobile emulation —
 * resolves exactly as it did before this existed.
 */
export function capDensity(sizes: string): string {
  const entries = splitTopLevel(sizes).map(splitEntry);
  if (entries.length === 0) throw new Error("sizes: empty");

  const capped: string[] = [];
  for (const bucket of DENSITY_BUCKETS) {
    for (const { condition, value } of entries) {
      const resolution = `(min-resolution: ${bucket.minResolution})`;
      capped.push(
        `${condition ? `${condition} and ${resolution}` : resolution} ${scale(value, bucket.factor)}`,
      );
    }
  }
  return [...capped, sizes.trim()].join(", ");
}

/* ------------------------------------------------------------------------- *
 * `object-fit: cover`, and the pixels it draws that are not in the box
 * ------------------------------------------------------------------------- */

/**
 * `sizes` describes the element's **box**. Almost every photograph on this page
 * is `object-fit: cover` inside a box of a different shape, and `cover` scales
 * the picture until it covers *both* axes, then crops the overflow. So a 3:2
 * photograph in a portrait box is drawn far wider than the box, and the browser
 * decodes, scales and paints every one of those pixels — the visible middle of
 * them at whatever resolution the file it fetched can supply.
 *
 * Written as a box measurement, `sizes="100vw"` on the four full-screen
 * photographs asked a 390x844 phone for a 400-wide file to fill a picture the
 * browser then drew 1,266-1,622 CSS px wide: **0.25-0.32 source pixels per CSS
 * pixel**, which is a visible smear, not a rounding error. Fixed 5 Aug 2026; the
 * measurements are in `docs/reviews/2026-08-05-cover-sizes/`.
 *
 * The multiplier is exact and needs no judgement:
 *
 *     drawn width = max(box width, box height x image aspect ratio)
 *                 = box width x max(1, image aspect / box aspect)
 *
 * so all this file needs is the box's aspect ratio, which is written in the CSS
 * beside the `sizes` string, and the photograph's own, which `media()` already
 * carries. Nothing is hand-tuned per image.
 */
export type CoverBox =
  /** One aspect ratio (width / height) at every viewport width. */
  | number
  /**
   * A ratio that changes at breakpoints, as `[minWidth, ratio]` ordered
   * widest-first with a final `[0, ratio]` — the same shape, and the same order,
   * as the `sizes` list beside it and the `lg:aspect-[7/9]` class above it.
   */
  | readonly (readonly [minWidth: number, ratio: number])[]
  /**
   * The box is the full viewport width and `heightVh` vh tall — the hero and the
   * three full-bleed screens. Its aspect ratio is therefore the *viewport's*,
   * divided by `heightVh / 100`, and it cannot be known at build time; the
   * returned list carries `(max-aspect-ratio: ...)` conditions instead.
   */
  | { readonly viewportHeightVh: number };

/**
 * Aspect-ratio buckets for a viewport-sized box, listed narrowest-first because
 * the first matching `sizes` entry wins and the conditions nest — anything that
 * matches `(max-aspect-ratio: 1/2)` also matches every looser bucket below it.
 *
 * Each bucket is costed at its own **floor**, the worst case inside it, so no
 * viewport in the bucket is ever under-served. `0.4` is the floor of the bottom
 * bucket and of the ladder: the tallest shipping phone aspect is about 0.43
 * (21:9), and the usual 19.5:9 is 0.46, so 0.4 is below every real device
 * without being so low that the over-statement costs a tier.
 */
const VIEWPORT_ASPECT_BUCKETS: readonly { readonly upper: string | null; readonly floor: number }[] =
  [
    { upper: "1/2", floor: 0.4 },
    { upper: "2/3", floor: 0.5 },
    { upper: "1/1", floor: 2 / 3 },
    { upper: "3/2", floor: 1 },
    { upper: null, floor: 1.5 },
  ];

/** The `(min-width: Npx)` a `sizes` entry's condition turns on, or 0 for the default. */
function minWidthOf(condition: string | null): number {
  if (!condition) return 0;
  const m = /\(\s*min-width:\s*([\d.]+)px\s*\)/.exec(condition);
  if (!m) {
    throw new Error(
      `sizes: cover scaling can only read a (min-width: Npx) condition, got ${JSON.stringify(condition)}`,
    );
  }
  return Number(m[1]);
}

/** `120%` of `value`, or `value` itself when the crop draws nothing extra. */
function grow(value: string, factor: number): string {
  return factor <= 1.005 ? value : scale(value, factor);
}

function viewportCoverSizes(imageAspect: number, heightVh: number): string {
  const boxHeightInViewports = heightVh / 100;
  const entries = VIEWPORT_ASPECT_BUCKETS.map((bucket) => {
    const factor = Math.max(1, (imageAspect * boxHeightInViewports) / bucket.floor);
    return { upper: bucket.upper, value: `${Math.round(factor * 1000) / 10}vw` };
  });

  // Collapse a bucket into the looser one below it when they ask for the same
  // width — safe precisely because the conditions nest, so anything that would
  // have matched the dropped entry matches its successor. Portrait photographs
  // in a viewport box are never cropped horizontally and would otherwise emit
  // five identical `100vw` entries.
  const kept = entries.filter((e, i) => i === entries.length - 1 || e.value !== entries[i + 1].value);
  return kept.map((e) => (e.upper ? `(max-aspect-ratio: ${e.upper}) ${e.value}` : e.value)).join(", ");
}

/**
 * Rewrites a `sizes` list that describes a **box** into one that describes the
 * **pixels drawn inside it** under `object-fit: cover`.
 *
 * Each entry is scaled by the worst (largest) crop factor that can apply over
 * the range of viewport widths that entry covers, so a box whose ratio changes
 * at a breakpoint the width list does not share is still never under-served.
 *
 * `imageAspect` is the photograph's own width / height. Callers pass their box
 * and nothing else; no call site multiplies anything by hand.
 */
export function coverSizes(sizes: string, box: CoverBox | undefined, imageAspect: number): string {
  if (box === undefined) return sizes;
  if (!(imageAspect > 0)) throw new Error(`sizes: image aspect must be positive, got ${imageAspect}`);

  if (typeof box === "object" && !Array.isArray(box)) {
    return viewportCoverSizes(imageAspect, (box as { viewportHeightVh: number }).viewportHeightVh);
  }

  const ratios = (typeof box === "number" ? [[0, box] as const] : box) as readonly (readonly [
    number,
    number,
  ])[];
  if (ratios.length === 0) throw new Error("sizes: cover box has no ratios");

  const entries = splitTopLevel(sizes).map(splitEntry);
  const out = entries.map(({ condition, value }, i) => {
    // First match wins, so this entry owns [its own min-width, the previous
    // entry's min-width).
    const lo = minWidthOf(condition);
    const hi = i === 0 ? Number.POSITIVE_INFINITY : minWidthOf(entries[i - 1].condition);

    let worst = Number.POSITIVE_INFINITY;
    for (let r = 0; r < ratios.length; r++) {
      const rLo = ratios[r][0];
      const rHi = r === 0 ? Number.POSITIVE_INFINITY : ratios[r - 1][0];
      if (rLo < hi && lo < rHi) worst = Math.min(worst, ratios[r][1]);
    }
    if (!Number.isFinite(worst)) throw new Error(`sizes: no box ratio covers widths ${lo}-${hi}`);

    return `${condition ? `${condition} ` : ""}${grow(value, Math.max(1, imageAspect / worst))}`;
  });

  return out.join(", ");
}
