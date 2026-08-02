# Mahua Home Page — Plan 2: Page Structure, Light Anchoring & Imagery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved Plan 1 foundation into the real home page at `/` — seven movements of genuine
height, real optimised photography, and a light system anchored to the page's actual sections so the two
light↔dark crossings land in bands that carry no text.

**Architecture:** Plan 1 mapped scroll progress to light states in six equal sixths, which only worked
because every preview panel was the same height. Real movements differ wildly in height, and spec §13
requires the crossings to fall where no text is on screen. Both are solved by the same change: replace the
equal-sixths mapping with an explicit **timeline of stops** — `{ at, state }` pairs — where consecutive
stops sharing a state *hold* the colour still, and colour only moves between differing stops. Crossings are
then positioned deliberately, inside full-bleed image bands.

**Tech Stack:** Next.js 16 · TypeScript · Tailwind 4 · GSAP + Lenis · Vitest · sharp (build-time image pipeline)

**Spec:** `docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`
**Builds on:** `docs/superpowers/plans/2026-08-01-foundation-and-light-states.md` (complete, merged into `feat/foundation-light-states`)

## Global Constraints

Copied verbatim from the spec. Every task inherits these.

- **No component may hard-code a colour, a duration, or a string of copy.** They come from `lib/palette.ts`,
  `lib/motion.ts`, `content/home.ts`. (spec §6.2)
- **The palette must stay warm.** Cream is the home key, ~80% of page height. Dark is punctuation only,
  always warm-toned, never cold blue-black. (spec §9 — client correction, non-negotiable)
- **Text must clear 4.5:1 contrast against the *blended* background at every scroll position.** Never test
  the seven states as static endpoints alone — that is how a 1.85:1 stretch shipped in Plan 1. (spec §11, §13)
- **The two light↔dark crossings must fall where no text is on screen.** (spec §13, decision D13)
- **Nothing bounces.** Reveals run 800–1400ms. Parallax caps at 15%. (spec §4.3)
- **Every animation has a defined still state under `prefers-reduced-motion`.** (spec §11)
- **British spelling in all copy.** (spec §4.2)
- **Existing imagery only** — no new photography is assumed. (spec D10)
- **Budgets: hero < 200 KB, first load < 2.5s on 4G.** Currently breached at 404 KB with no images at all;
  this plan must bring it back under. If an effect cannot hit budget, the effect loses. (spec §11)
- **Two properties only** — Mahua Vann (Pench) and Mahua Tola (Tadoba). (spec D1)

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/build_images.mjs` | Build-time: curate → resize → AVIF/WebP → manifest. Run once, output committed. |
| `public/media/` | Optimised responsive derivatives. Committed. |
| `lib/media.ts` | Typed manifest accessor. One entry per photograph, with alt text. |
| `lib/timeline.ts` | The stops timeline + `stopsAt`, replacing equal-sixths `segmentAt`. Pure, unit-tested. |
| `lib/day-surface.ts` | *Modified* — consumes `lib/timeline.ts` instead of computing sixths itself. |
| `content/movements.ts` | The seven movements + two crossing bands as data: id, light state, weight, whether it carries text. |
| `components/ui/Plate.tsx` | A captioned photograph in the field-guide idiom. |
| `components/ui/ChapterLabel.tsx` | The letter-spaced chapter eyebrow. |
| `components/ui/FullBleed.tsx` | Edge-to-edge image band. Used for the two crossing bands. |
| `components/movements/*.tsx` | One file per movement. Seven files. |
| `app/page.tsx` | *Replaced* — composes the movements. |

---

### Task 1: Image pipeline

**Files:**
- Create: `scripts/build_images.mjs`, `lib/media.ts`, `lib/media.test.ts`
- Create (generated, committed): `public/media/*`, `lib/media-manifest.json`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type MediaId` — a string union of the curated image ids
  - `type MediaEntry = { id: MediaId; alt: string; width: number; height: number; avif: string; webp: string; jpg: string; blur: string }`
  - `media(id: MediaId): MediaEntry` — throws on unknown id
  - `MEDIA: readonly MediaEntry[]`

**Curation.** 75 photographs exist across `reference/mockup-media/` and `reference/wp-media/`. Most are not
good enough. Select **no more than 14**, preferring `reference/mockup-media/` — those were curated for the
earlier design and are markedly better than the live site's. Known-strong candidates, verified by eye:

| Intended use | Source file |
|---|---|
| Hero / pre-dawn | `mockup-media/lantern-lit-wooden-bridge-at-mahua-vann-at-dusk-*.jpg` |
| Crossing band 1 | `mockup-media/a-bengal-tiger-moving-through-tall-golden-grass-*.jpg` |
| The residents | `mockup-media/tiger-yawning-in-the-undergrowth-*.jpg`, `leopard-resting-on-a-rock-among-trees-*.jpg`, `melanistic-leopard-in-a-tree-*.jpg` |
| Mahua Vann | `mockup-media/mud-walled-room-with-tiled-roof-and-forest-view-at-mahu-*.jpg` |
| Mahua Tola | `mockup-media/family-suite-with-terracotta-roof-and-jungle-textiles-a-*.jpg` |
| Dusk / ritual | `mockup-media/bonfire-dinner-under-lantern-lit-trees-*.jpg`, `lantern-lit-veranda-walkway-at-dusk-*.jpg` |
| Crossing band 2 | `mockup-media/the-pool-at-mahua-tola-lit-by-lanterns-at-dusk-*.jpg` |

**Do NOT use** `wp-media/Mahua-Website-Images_Homepage-Banner-*.jpg` — they have marketing text baked into
the pixels and cannot be used at any size.

**Missing asset, do not fake it:** the hand-drawn Pench location map (praised in the client's own audit as
"one of the best elements on the whole site") is **not** in the downloaded media library. Movement 4 must be
built without it. Record it in the report as an asset to request from the client.

- [ ] **Step 1: Write the failing test**

`lib/media.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MEDIA, media } from "./media";

describe("MEDIA", () => {
  it("curates a small set, not the whole library", () => {
    expect(MEDIA.length).toBeGreaterThan(0);
    expect(MEDIA.length).toBeLessThanOrEqual(14);
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
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/media.test.ts` → FAIL, cannot resolve `./media`.

- [ ] **Step 3: Write `scripts/build_images.mjs`**

Reads a curation list at the top of the file (id → source path → alt text), and for each source emits
`public/media/<id>-{960,1440,1920}.{avif,webp}` plus a 1920 `.jpg` fallback and a tiny base64 blur
placeholder. Uses `sharp`, already installed. Writes `lib/media-manifest.json`.

Quality settings: AVIF quality 55, WebP quality 72. Re-encode from the source, never upscale — if a source
is narrower than a target width, skip that width.

**Alt text is written by hand in the curation list, in British English, describing what is in the frame.**
The client's audit found 22 of 27 live-site images had none; this is where that gets fixed.

- [ ] **Step 4: Run the pipeline and check the budget**

```bash
node scripts/build_images.mjs
du -sh public/media
```

Expected: every derivative present. **The largest single 1920 AVIF must be under 200 KB** — that is the
spec's hero budget. If any exceeds it, lower quality for that image and re-run before continuing.

- [ ] **Step 5: Write `lib/media.ts`**

Imports the generated JSON, derives `MediaId` from it, exports `MEDIA` and `media(id)`. `media` throws
`new Error(\`Unknown media id: ${id}\`)` on a miss.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/media.test.ts` → PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/build_images.mjs lib/media.ts lib/media.test.ts lib/media-manifest.json public/media
git commit -m "feat: add build-time image pipeline and curated media manifest"
```

---

### Task 2: The movements timeline

**Files:**
- Create: `content/movements.ts`, `content/movements.test.ts`

**Interfaces:**
- Consumes: `LightStateId` from `lib/palette.ts`, `MediaId` from `lib/media.ts`
- Produces:
  - `type Band = { id: string; state: LightStateId; weight: number; carriesText: boolean; image?: MediaId }`
  - `const BANDS: readonly Band[]` — the seven movements plus two crossing bands, in scroll order

This is the data both the page layout and the light system read, so they cannot disagree.

`weight` is relative scroll height (unitless). `carriesText: false` marks a **crossing band** — a full-bleed
photograph with no words on it, which is where a light↔dark transition is allowed to happen.

- [ ] **Step 1: Write the failing test**

`content/movements.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hexToRgb, relativeLuminance } from "@/lib/contrast";
import { lightState } from "@/lib/palette";
import { BANDS } from "./movements";

const lum = (id: string) => relativeLuminance(hexToRgb(lightState(id as never).bg));

describe("BANDS", () => {
  it("runs dawn to night", () => {
    expect(BANDS[0].state).toBe("dawn");
    expect(BANDS[BANDS.length - 1].state).toBe("night");
  });

  it("gives every band a positive weight and a unique id", () => {
    for (const b of BANDS) expect(b.weight, b.id).toBeGreaterThan(0);
    expect(new Set(BANDS.map((b) => b.id)).size).toBe(BANDS.length);
  });

  it("keeps cream the home key — light bands are at least 70% of scroll height", () => {
    // spec section 9. The Plan 1 preview was only 57% light because every panel
    // was the same height; real movements are not.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    const light = BANDS.filter((b) => lum(b.state) > 0.5).reduce((n, b) => n + b.weight, 0);
    expect(light / total).toBeGreaterThanOrEqual(0.7);
  });

  it("puts every light/dark crossing in a band that carries no text", () => {
    // spec section 13 / decision D13 — the whole point of this plan.
    for (let i = 0; i < BANDS.length - 1; i++) {
      const crosses = Math.abs(lum(BANDS[i].state) - lum(BANDS[i + 1].state)) > 0.3;
      if (!crosses) continue;
      const crossingBand = BANDS[i + 1];
      expect(
        crossingBand.carriesText,
        `light crosses into "${crossingBand.id}", which carries text — spec section 13 forbids this`,
      ).toBe(false);
    }
  });

  it("gives every text-free crossing band an image, so it is not a blank screen", () => {
    for (const b of BANDS.filter((x) => !x.carriesText)) {
      expect(b.image, `${b.id} carries no text and no image`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run content/movements.test.ts` → FAIL, cannot resolve `./movements`.

- [ ] **Step 3: Write `content/movements.ts`**

Nine bands. Weights are relative; tune them so the "at least 70% light" test passes — the cream movements
carry the most content and should be much taller than the two dark bookends.

```ts
import type { MediaId } from "@/lib/media";
import type { LightStateId } from "@/lib/palette";

/**
 * The page as a sequence of bands, in scroll order. Both the layout and the light
 * timeline read this, so they cannot disagree about where a movement starts.
 *
 * `carriesText: false` marks a crossing band: a full-bleed photograph with no words
 * on it. Spec section 13 requires the two light/dark crossings to happen here and
 * nowhere else, because no warm text colour can stay legible against a background
 * halfway between forest green and cream.
 */
export type Band = {
  readonly id: string;
  readonly state: LightStateId;
  readonly weight: number;
  readonly carriesText: boolean;
  readonly image?: MediaId;
};

export const BANDS: readonly Band[] = [
  { id: "mahua-falls",   state: "dawn",          weight: 10, carriesText: true },
  { id: "the-gate",      state: "firstLight",    weight: 10, carriesText: true },
  { id: "into-the-day",  state: "midMorning",    weight:  7, carriesText: false, image: "tiger-in-grass" },
  { id: "the-residents", state: "midMorning",    weight: 16, carriesText: true },
  { id: "the-lodges",    state: "afternoon",     weight: 22, carriesText: true },
  { id: "rooted",        state: "lateAfternoon", weight: 16, carriesText: true },
  { id: "the-ritual",    state: "dusk",          weight: 16, carriesText: true },
  { id: "into-the-dark", state: "night",         weight:  7, carriesText: false, image: "tola-pool-dusk" },
  { id: "the-sky",       state: "night",         weight: 10, carriesText: true },
] as const;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run content/movements.test.ts` → PASS, 5 tests. If the 70%-light assertion fails, increase
the cream bands' weights — do not weaken the test.

- [ ] **Step 5: Commit**

```bash
git add content/movements.ts content/movements.test.ts
git commit -m "feat: describe the page as bands, with crossings in text-free zones"
```

---

### Task 3: The stops timeline

**Files:**
- Create: `lib/timeline.ts`, `lib/timeline.test.ts`

**Interfaces:**
- Consumes: `BANDS` from `content/movements.ts`, `LightStateId` from `lib/palette.ts`
- Produces:
  - `type Stop = { at: number; state: LightStateId }`
  - `STOPS: readonly Stop[]`
  - `stopsAt(progress: number): { from: LightStateId; to: LightStateId; t: number }`
  - `carriesTextAt(progress: number): boolean`

**The idea.** Each band contributes two stops: one at its start and one at its end, both naming that band's
state. Consecutive stops with the same state therefore **hold** the colour still for that band's whole
height, and colour only moves across the boundary *between* two bands. Because a crossing band's neighbours
differ in state, the movement happens inside that band — which carries no text.

- [ ] **Step 1: Write the failing test**

`lib/timeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BANDS } from "@/content/movements";
import { carriesTextAt, stopsAt } from "./timeline";

describe("stopsAt", () => {
  it("starts at dawn and ends at night", () => {
    expect(stopsAt(0).from).toBe("dawn");
    expect(stopsAt(1).to).toBe("night");
  });

  it("holds the colour still through a band that carries text", () => {
    // Mid-way through "the-lodges" the colour must not be moving: from and to
    // are the same state, so any t produces that state's exact background.
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (const b of BANDS) {
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      if (!b.carriesText) continue;
      const s = stopsAt(mid);
      expect(s.from, `${b.id} is moving mid-band`).toBe(s.to);
    }
  });

  it("clamps outside 0..1", () => {
    expect(stopsAt(-1).from).toBe("dawn");
    expect(stopsAt(2).to).toBe("night");
  });
});

describe("carriesTextAt", () => {
  it("is false inside the crossing bands and true inside the movements", () => {
    const total = BANDS.reduce((n, b) => n + b.weight, 0);
    let acc = 0;
    for (const b of BANDS) {
      const mid = (acc + b.weight / 2) / total;
      acc += b.weight;
      expect(carriesTextAt(mid), b.id).toBe(b.carriesText);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/timeline.test.ts` → FAIL, cannot resolve `./timeline`.

- [ ] **Step 3: Write `lib/timeline.ts`**

```ts
import { BANDS } from "@/content/movements";
import type { LightStateId } from "./palette";

export type Stop = { readonly at: number; readonly state: LightStateId };

const TOTAL = BANDS.reduce((n, b) => n + b.weight, 0);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Two stops per band, both naming that band's own state. Identical consecutive
 * states hold the colour still for the band's full height; the colour therefore
 * only moves across a band boundary — and the two light/dark boundaries are
 * bracketed by crossing bands that carry no text (spec section 13).
 */
export const STOPS: readonly Stop[] = BANDS.flatMap((band, i) => {
  const start = BANDS.slice(0, i).reduce((n, b) => n + b.weight, 0) / TOTAL;
  const end = start + band.weight / TOTAL;
  return [
    { at: start, state: band.state },
    { at: end, state: band.state },
  ];
});

export function stopsAt(progress: number): { from: LightStateId; to: LightStateId; t: number } {
  const p = clamp01(progress);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const span = b.at - a.at;
      return { from: a.state, to: b.state, t: span === 0 ? 0 : (p - a.at) / span };
    }
  }
  const last = STOPS[STOPS.length - 1];
  return { from: last.state, to: last.state, t: 1 };
}

export function carriesTextAt(progress: number): boolean {
  const p = clamp01(progress);
  let acc = 0;
  for (const band of BANDS) {
    const end = (acc + band.weight) / TOTAL;
    if (p <= end) return band.carriesText;
    acc += band.weight;
  }
  return BANDS[BANDS.length - 1].carriesText;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/timeline.test.ts` → PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/timeline.ts lib/timeline.test.ts
git commit -m "feat: anchor the light timeline to the page's bands"
```

---

### Task 4: Retire the black/white fallback

**Files:**
- Modify: `lib/day-surface.ts`, `lib/day-surface.test.ts`, `lib/palette.ts`

**Interfaces:**
- Consumes: `stopsAt`, `carriesTextAt` from `lib/timeline.ts`
- Produces: `surfaceAt`, `backgroundAt`, `textAt` — same signatures as today, new internals

This is the payoff. With crossings confined to text-free bands, **no warm colour ever has to survive a
mid-luminance background while text is on screen**, so `CROSSING_TEXT` (pure black and white — currently
16.6% of the scroll) can be deleted entirely.

- [ ] **Step 1: Replace the sweep test with one that only judges where text exists**

In `lib/day-surface.test.ts`, replace the existing 1,001-sample legibility sweep with:

```ts
  it("keeps text legible wherever text is actually on screen", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      if (!carriesTextAt(p)) continue; // crossing bands carry no words
      const ratio = contrastRatio(textAt(p), backgroundAt(p));
      expect(ratio, `progress ${p.toFixed(3)}: ${textAt(p)} on ${backgroundAt(p)}`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it("never falls back to a cold colour, because it never needs to", () => {
    // spec section 9. Plan 1 needed pure black/white through the crossings;
    // moving the crossings into text-free bands removes that need entirely.
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      if (!carriesTextAt(p)) continue;
      const [r, , b] = hexToRgb(textAt(p));
      expect(r, `progress ${p.toFixed(3)} used cold text ${textAt(p)}`).toBeGreaterThanOrEqual(b);
    }
  });
```

Import `carriesTextAt` from `@/lib/timeline` and `hexToRgb` from `./contrast`.

- [ ] **Step 2: Run it and watch the warmth test fail**

Run: `npx vitest run lib/day-surface.test.ts`
Expected: the legibility sweep passes, the **warmth test FAILS** — `CROSSING_TEXT` is still wired in and
still returns `#000000`. That failure is the point: it proves the test detects the thing being removed.

- [ ] **Step 3: Rewrite `lib/day-surface.ts` to use the timeline**

`segmentAt` is replaced by `stopsAt`. `backgroundAt` interpolates between `stopsAt(p).from` and `.to` in
sRGB as before. `surfaceAt` still picks text by measured contrast between the two bracketing states' own
designed colours (`bestAgainst`), but the `legibleAgainst` fallback tier and its `CROSSING_TEXT` import are
deleted. Remove `CROSSING_TEXT` from `lib/palette.ts` and its entry from `lib/palette.test.ts`.

Keep `segmentAt` exported only if something still imports it; otherwise delete it and update callers.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: all pass, including both new assertions. If the legibility sweep now fails somewhere, a crossing
is still landing on a text band — fix `content/movements.ts`, not the test.

- [ ] **Step 5: Commit**

```bash
git add lib/day-surface.ts lib/day-surface.test.ts lib/palette.ts lib/palette.test.ts
git commit -m "feat: retire the black/white fallback now crossings are text-free"
```

---

### Task 5: Shared field-guide primitives

**Files:**
- Create: `components/ui/ChapterLabel.tsx`, `components/ui/Plate.tsx`, `components/ui/FullBleed.tsx`

**Interfaces:**
- Consumes: `media` from `lib/media.ts`, `Reveal`/`Parallax` from `components/motion/`
- Produces:
  - `<ChapterLabel>{children}</ChapterLabel>` — Cinzel, letter-spaced, uses `var(--accent-text)`
  - `<Plate id={MediaId} caption?: string plate?: string />` — a captioned photograph
  - `<FullBleed id={MediaId} />` — edge-to-edge, viewport-height, `role="presentation"`

`Plate` renders `<picture>` with AVIF → WebP → JPEG sources and the manifest's `width`/`height` so no layout
shift occurs. All three read colours only from CSS variables.

- [ ] **Step 1: Write the three components**

Each is small. `Plate` wraps its image in `<Reveal>`; `FullBleed` wraps its image in `<Parallax>` and
carries **no text**, since it is what the crossing bands render.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint` → clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui
git commit -m "feat: add field-guide UI primitives"
```

---

### Task 6: The nine bands rendered

**Files:**
- Create: `components/movements/` — one file per band that carries text (seven files)
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `BANDS`, all UI primitives, `HOME` copy, `media`
- Produces: the real `/` route

Each band component sets its own height from its `weight` (e.g. `min-h-[calc(var(--band-weight)*1vh)]` or a
simple `min-h-screen` multiple) so the rendered heights match the weights the timeline assumes. **If layout
height and timeline weight disagree, the light will drift out of step with the content** — they must be
derived from the same `BANDS` data, not typed twice.

Copy for this plan is provisional: use `HOME.hero` for the opening and short placeholder prose elsewhere,
drawn from the spec's §3 movement descriptions. Final copy is Plan 3.

- [ ] **Step 1: Build the seven text bands and the two `FullBleed` crossing bands**
- [ ] **Step 2: Replace `app/page.tsx` to map over `BANDS` and render the matching component**
- [ ] **Step 3: Verify** — `npx tsc --noEmit`, `npm run build`, `npm test`, `npm run lint` all clean
- [ ] **Step 4: Commit**

```bash
git add components/movements app/page.tsx
git commit -m "feat: render the nine bands as the home page"
```

---

### Task 7: Verification against the budgets

**Files:** none created — this task produces evidence in `docs/reviews/2026-08-02-page-structure/`.

- [ ] **Step 1: Screenshot `/` at 390 / 768 / 1440 / 1920 px**

Use Playwright with `window.scrollTo` and normal viewport captures — **full-page capture does not fire
scroll events and freezes the background at the dawn colour.** Capture each band at each width.

- [ ] **Step 2: Lighthouse against the production build**

```bash
npm run build && npm start
npx lighthouse http://localhost:3000/ --output html \
  --output-path docs/reviews/2026-08-02-page-structure/lighthouse.html --chrome-flags="--headless=new"
```

**The budgets are now a gate, not a note.** Accessibility ≥ 95. **Total transfer must be under 2.5s LCP on
Lighthouse's simulated mobile**, and the largest single image under 200 KB. Plan 1 finished at 404 KB with
*no* images; if adding photography has not been offset by the image pipeline, report exactly which asset
blew it.

- [ ] **Step 3: Confirm the crossings are text-free in reality, not just in data**

Scroll to the middle of each crossing band and screenshot. Expected: a full-bleed photograph, no words. This
is the visual proof of spec §13 — the data test asserts it, this confirms the rendered page agrees.

- [ ] **Step 4: Reduced-motion pass** — emulate `prefers-reduced-motion: reduce`, reload, confirm every band
  is visible and readable with no animation.

- [ ] **Step 5: Commit the evidence, then STOP for client review**

Present: the screenshots, the Lighthouse scores against the budgets, and the crossing-band captures. Ask
whether the page's rhythm and proportions feel right before Plan 3 writes final copy into it.

---

## What follows this plan

| Plan | Contents |
|---|---|
| **3** | Final copy for all seven movements from the Master Brand Record; field-guide craft (plate numbers, specimen captions, marginalia); the signature interactions — logo bloom, leaf cursor, the tiger |
| **4** | Performance and accessibility hardening; the targeted shot list (spec §7); the SEO redirect map (spec §10) |

---

## Self-Review

**Spec coverage.** §3 movements → Tasks 2, 6 (structure; copy is Plan 3). §4.1 palette → unchanged from
Plan 1, re-anchored in Task 3. §6.2 dials → preserved; `content/movements.ts` is a new one. §7 imagery →
Task 1, including the honest record that the hand-drawn map is missing. §9 warmth ≥70% → enforced by test in
Task 2. §11 budgets → Task 7 gates on them. §13 crossings → Tasks 2, 3, 4, and visually confirmed in Task 7.
**Deferred by design:** final copy, signature interactions (Plan 3); shot list, redirect map (Plan 4).

**Placeholder scan.** No TBD/TODO. Task 6's copy is explicitly provisional with Plan 3 named as its owner,
rather than left vague. The missing hand-drawn map is stated as a fact with a defined consequence, not a
gap to fill in later.

**Type consistency.** `Band`/`BANDS` defined Task 2, consumed Tasks 3, 6. `Stop`/`stopsAt`/`carriesTextAt`
defined Task 3, consumed Tasks 4, 6. `MediaId`/`MediaEntry`/`media`/`MEDIA` defined Task 1, consumed Tasks
2, 5, 6. `surfaceAt`/`backgroundAt`/`textAt` keep their Plan 1 signatures through Task 4. `CROSSING_TEXT` is
deleted in Task 4 and referenced nowhere afterwards.
