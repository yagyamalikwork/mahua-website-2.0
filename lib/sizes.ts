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
const BUCKETS: readonly { readonly minResolution: string; readonly factor: number }[] = [
  { minResolution: "3.5x", factor: 0.5 },
  { minResolution: "2.5x", factor: 2 / 3 },
];

/**
 * Splits a `sizes` list on its top-level commas. Commas inside `calc()` are not
 * separators — `calc((100vw - 72px) * 0.82)` has none today, but `min()` and
 * `clamp()` do, and a naive `split(",")` would quietly corrupt them into two
 * broken entries that the browser drops, leaving the photograph at 100vw and
 * nobody any the wiser.
 */
function splitTopLevel(list: string): string[] {
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
    i += combinator.length + j + 2;
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
  for (const bucket of BUCKETS) {
    for (const { condition, value } of entries) {
      const resolution = `(min-resolution: ${bucket.minResolution})`;
      capped.push(
        `${condition ? `${condition} and ${resolution}` : resolution} ${scale(value, bucket.factor)}`,
      );
    }
  }
  return [...capped, sizes.trim()].join(", ");
}
