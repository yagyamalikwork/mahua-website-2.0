# Mahua Home Page — Plan 3: The Chapters Rebuild

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page as a dense, image-led journey in chapters — cream throughout, in the layout
language of [thesujanlife.com](https://thesujanlife.com/), carrying Mahua's own photography, copy and
field-guide idiom.

**Architecture:** The scroll-through-a-day colour system is retired. It sized bands by colour ratio rather
than content, which is the direct cause of the emptiness the client rejected. In its place: a fixed cream
palette and a **chapter rhythm** — full-bleed photographic screens alternating with compact cream content
screens, never two quiet screens consecutively. Sections size to their content. The journey comes from
chapter progression and image density, not from the background changing.

**Tech Stack:** Next.js 16 · TypeScript · Tailwind 4 · GSAP + ScrollTrigger · Lenis · Vitest

**Spec:** `docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md` (§3, §4.1 and §13 are superseded
by this plan — see Task 1)
**Reference:** `Brand&Design-Guidelines/mahua-brand-guidelines-v3-fieldguide.html`

## Client direction, 3 August 2026

Verbatim, because it overrides earlier decisions:

- The built page had **too few images, no perceptible scroll animation, too much empty space**, and no
  resemblance to the reference.
- **Take heavy inspiration from the Sujan homepage** — its layout, its scroll behaviour, its image and text
  placement. Map Mahua's content onto that structure.
- **Present the experience as a journey in chapters**, as the v3 fieldguide guidelines do.
- **Use the existing mahuaresorts.com text and images** — both are available and were under-used.
- **Creative freedom over the guidelines**: keep what is good, rework what is not, invent where neither the
  guidelines nor the reference serve us. Not line-by-line compliance.
- **Retire the day-arc.** Cream throughout.

## Global Constraints

- **Cream is the page.** Base `#F1E9D7`, second surface `#E9DFC8`, ink `#31402C`, dim `#5A5240`, gold
  `#BB8F2E`. No dark sections except photographs and their overlays.
- **Every screen must carry weight.** No section may render more than ~30% empty space at 1440×900. If a
  section cannot be filled, it is cut or merged — not padded.
- **Alternate the rhythm.** Never two consecutive text-only screens. A full-bleed photograph or an
  image-led block must sit between them.
- **Photography rules** (guidelines §07): natural or lantern light only; our own wildlife; texture — mud,
  clay, kilim, canopy. Never stock, never watermarked.
- **Type:** Gilda Display (display/headings), Cinzel (letter-spaced caps labels and chapter numbers),
  Crimson Pro (body). British spelling throughout.
- **All copy in `content/`.** No user-facing strings in components.
- **Every animation has a still state under `prefers-reduced-motion`.**
- **Contrast ≥ 4.5:1** for body text, ≥ 3:1 for large display text over photographs — enforced by test.
- **Budgets:** largest image < 200 KB; total page transfer < 1.5 MB; LCP < 2.5s on simulated 4G.
- **Two properties only** — Mahua Vann (Pench) and Mahua Tola (Tadoba).

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/palette.ts` | *Rewritten* — a flat cream palette. No light states, no timeline. |
| `content/chapters.ts` | The chapter sequence: id, number, kind, and which media it carries. |
| `content/home.ts` | *Rewritten* — every word, sourced from the live site and the brand record. |
| `lib/media.ts` + `lib/media-manifest.ts` | *Regenerated* — ~35 images, not 14. |
| `components/sections/Hero.tsx` | Full-bleed photograph, headline bottom-left. |
| `components/sections/FullBleedQuote.tsx` | Photograph with a pull-quote laid over it. |
| `components/sections/ChapterIntro.tsx` | Centred serif headline with a two-tone word, floating offset images. |
| `components/sections/SplitFeature.tsx` | Left copy / right imagery, or mirrored. |
| `components/sections/PlateGrid.tsx` | 3- or 4-up captioned plates. |
| `components/sections/LodgeCards.tsx` | The two properties. |
| `components/sections/Testimonials.tsx` | TripAdvisor rating and guest quotes. |
| `components/sections/Invitation.tsx` | Closing full-bleed and call to action. |
| `components/motion/` | *Extended* — `Reveal`, `Parallax` kept; add `ImageReveal`, `SplitLines`, `StickyScene`. |
| `app/page.tsx` | *Rewritten* — composes the chapters. |

**To be deleted in Task 1:** `lib/timeline.ts`, `lib/timeline.test.ts`, `lib/day-surface.ts`,
`lib/day-surface.test.ts`, `lib/band-height.ts`, `lib/band-height.test.ts`,
`components/motion/DaySurface.tsx`, `components/movements/`, `content/movements.ts`,
`content/movements.test.ts`, `app/preview/light-states/`.

---

### Task 1: Retire the day-arc

**Files:**
- Delete: the eleven paths listed above
- Modify: `lib/palette.ts`, `lib/palette.test.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Test: `lib/palette.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type PaletteToken = "paper" | "paperDeep" | "ink" | "dim" | "gold" | "goldText" | "overlay"`
  - `const PALETTE: Record<PaletteToken, string>`
  - `contrastRatio` from `lib/contrast.ts` is **kept** — it still guards the new palette

Deleting ~1,900 lines is the point of this task. The day-arc's machinery is what forced content-blind
section heights; nothing new can be built cleanly on top of it.

`app/page.tsx` becomes a placeholder rendering only a heading — Task 7 composes the real page. The site
must build and the suite must pass at the end of this task, just with far less in it.

- [ ] **Step 1: Write the failing test**

Replace `lib/palette.test.ts` entirely:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb } from "./contrast";
import { PALETTE } from "./palette";

const HEX = /^#[0-9A-F]{6}$/;

describe("PALETTE", () => {
  it("uses uppercase 6-digit hex for every token", () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).toMatch(HEX);
    }
  });

  it("stays warm — red is never below blue", () => {
    // The client's standing constraint. A cold value anywhere drains the warmth
    // the whole brand rests on.
    for (const [name, value] of Object.entries(PALETTE)) {
      const [r, , b] = hexToRgb(value);
      expect(r, `${name} (${value}) is cold`).toBeGreaterThanOrEqual(b);
    }
  });

  it("clears 4.5:1 for body text and links on both paper surfaces", () => {
    for (const surface of [PALETTE.paper, PALETTE.paperDeep]) {
      expect(contrastRatio(PALETTE.ink, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(PALETTE.goldText, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for dim secondary text on the base paper", () => {
    expect(contrastRatio(PALETTE.dim, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps gold decorative — it is not required to pass as text", () => {
    // `gold` is for rules, ornaments and the emblem. `goldText` is the legible
    // sibling. Asserting gold passes would be wrong; asserting the pair differ
    // stops someone collapsing them later.
    expect(PALETTE.gold).not.toBe(PALETTE.goldText);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/palette.test.ts` → FAIL, `PALETTE` is not exported.

- [ ] **Step 3: Delete the day-arc**

```bash
git rm -r lib/timeline.ts lib/timeline.test.ts lib/day-surface.ts lib/day-surface.test.ts \
          lib/band-height.ts lib/band-height.test.ts components/motion/DaySurface.tsx \
          components/movements content/movements.ts content/movements.test.ts \
          app/preview/light-states
```

- [ ] **Step 4: Rewrite `lib/palette.ts`**

```ts
/**
 * The palette. One cream surface, not a scroll-driven sequence.
 *
 * The previous design moved the background through seven states as you scrolled.
 * It was retired on 3 Aug 2026: section heights had to be sized by colour ratio
 * rather than by content, which left the page sparse, and it pulled against both
 * the brand guidelines and the reference site, which are cream throughout.
 *
 * `gold` is decorative only — rules, ornaments, the emblem. It measures about
 * 2.5:1 on cream and must never carry text. `goldText` is the legible sibling.
 */
export type PaletteToken =
  | "paper" | "paperDeep" | "ink" | "dim" | "gold" | "goldText" | "overlay";

export const PALETTE: Record<PaletteToken, string> = {
  paper: "#F1E9D7",
  paperDeep: "#E9DFC8",
  ink: "#31402C",
  dim: "#5A5240",
  gold: "#BB8F2E",
  goldText: "#7A5C18",
  overlay: "#232B21",
} as const;
```

If a contrast assertion fails, darken the offending token until it passes. Never weaken the test.

- [ ] **Step 5: Simplify `app/layout.tsx` and `app/globals.css`**

The CSS variables become static values written once from `PALETTE`, not mutated on scroll. Remove
`DaySurface` from the tree. Keep `SmoothScroll` and `Grain`.

- [ ] **Step 6: Reduce `app/page.tsx` to a placeholder**

A single `<h1>` from `HOME.hero.headline`. Task 7 builds the real page.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`
Expected: all clean. Test count will drop substantially — report the new number.

```bash
git add -A && git commit -m "refactor: retire the day-arc for a flat cream palette"
```

---

### Task 2: Harvest the live site's copy

**Files:**
- Create: `scripts/extract_site_copy.py`, `reference/site-copy.md`

**Interfaces:**
- Consumes: `reference/wp-pages/*.html` (regenerate with `scripts/crawl_site.py` if absent)
- Produces: a readable markdown transcript of every heading and paragraph on the live site, per page

The client said the existing site's text can be used and has been under-used. Before any copy is written,
it must be readable in one place.

- [ ] **Step 1: Write the extractor**

Parse each crawled page. For each, emit its title, then every `h1`–`h4` and `p` in document order, stripped
of markup and de-duplicated. Skip nav, footer and cookie boilerplate. Output to
`reference/site-copy.md` grouped by page.

- [ ] **Step 2: Run it and read the output**

```bash
python scripts/crawl_site.py   # only if reference/wp-pages/ is missing
python scripts/extract_site_copy.py
```

Read `reference/site-copy.md` in full. In your report, quote the **ten strongest lines** you found — the
ones with specific nouns, real detail, or genuine voice — and name the pages they came from. These become
raw material for Task 6.

- [ ] **Step 3: Commit**

```bash
git add scripts/extract_site_copy.py reference/site-copy.md
git commit -m "chore: extract the live site's copy for reuse"
```

---

### Task 3: Expand the image library

**Files:**
- Modify: `scripts/build_images.mjs`, `lib/media-manifest.ts`, `lib/media.ts`, `lib/media.test.ts`
- Create: many files under `public/media/`

**Interfaces:**
- Consumes: `reference/mockup-media/`, `reference/wp-media/`
- Produces: `MEDIA` and `media(id)` as before, with `MediaId` covering **28–40 images**

Fourteen images across a long page is the single biggest cause of the sparseness. This task roughly triples
the library.

**Curation rules:**
- Both source folders are in play. The live site's images were previously dismissed as weaker; at inset and
  grid sizes many are perfectly good, and the client has explicitly asked for them to be used.
- **Still excluded:** anything with text baked into the pixels (`Mahua-Website-Images_Homepage-Banner-*`,
  `*_About-us*`), and anything showing a guest's face recognisably (a consent question, not a quality one —
  one such image was already identified in `reference/mockup-media/`).
- Tag each image with a **category** from the guidelines: `lanternHour`, `forest`, `lodgeLife`, `details`.
  The page composition in Task 7 draws on these.
- Record `orientation` (`landscape` | `portrait` | `square`) — the layouts need it.

**Full-bleed eligibility is a hard rule:** only images ≥ 1400px wide may be used full-bleed. There are
currently two. Mark every entry with `fullBleedSafe: boolean` and have a test assert that any image below
1400px has it `false`.

- [ ] **Step 1: Extend the test**

Add to `lib/media.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/media.test.ts` → FAIL on count and on the missing `category` field.

- [ ] **Step 3: Extend the curation list and regenerate**

Add `category`, `orientation` and `fullBleedSafe` to each entry in `scripts/build_images.mjs`. **Look at
every candidate image before adding it.** Write British-English alt text by hand for each new one.

```bash
node scripts/build_images.mjs
du -sh public/media
```

The largest single derivative must stay under 200 KB. Report total size — with ~35 images it will grow, and
Task 8 gates on total page transfer, not library size, since no page loads all of them above the fold.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run lib/media.test.ts` → PASS.

```bash
git add scripts/build_images.mjs lib/media*.ts public/media
git commit -m "feat: expand the curated image library to fill a dense page"
```

---

### Task 4: The chapter sequence

**Files:**
- Create: `content/chapters.ts`, `content/chapters.test.ts`

**Interfaces:**
- Consumes: `MediaId` from `lib/media.ts`
- Produces:
  - `type ChapterKind = "hero" | "fullBleedQuote" | "chapterIntro" | "splitFeature" | "plateGrid" | "lodgeCards" | "testimonials" | "invitation"`
  - `type Chapter = { id: string; number?: string; label?: string; kind: ChapterKind; media: readonly MediaId[] }`
  - `const CHAPTERS: readonly Chapter[]`

This is the page's spine, and the place the alternating rhythm is enforced mechanically rather than by
good intentions.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { CHAPTERS } from "./chapters";

const IMAGE_LED = ["hero", "fullBleedQuote", "plateGrid", "invitation"];

describe("CHAPTERS", () => {
  it("opens on the hero and closes on the invitation", () => {
    expect(CHAPTERS[0].kind).toBe("hero");
    expect(CHAPTERS[CHAPTERS.length - 1].kind).toBe("invitation");
  });

  it("has unique ids", () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
  });

  it("never runs two quiet screens back to back", () => {
    // The rhythm rule. Two consecutive text-led sections is exactly the
    // sparseness the client rejected.
    for (let i = 0; i < CHAPTERS.length - 1; i++) {
      const a = IMAGE_LED.includes(CHAPTERS[i].kind);
      const b = IMAGE_LED.includes(CHAPTERS[i + 1].kind);
      expect(a || b, `"${CHAPTERS[i].id}" and "${CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of CHAPTERS) {
      if (c.kind !== "hero" && c.kind !== "fullBleedQuote" && c.kind !== "invitation") continue;
      for (const id of c.media) {
        expect(media(id).fullBleedSafe, `${id} is not wide enough for ${c.id}`).toBe(true);
      }
    }
  });

  it("references only real images", () => {
    for (const c of CHAPTERS) for (const id of c.media) expect(() => media(id)).not.toThrow();
  });

  it("numbers its chapters in order where numbered", () => {
    const numbered = CHAPTERS.filter((c) => c.number).map((c) => Number(c.number));
    expect(numbered).toEqual([...numbered].sort((a, b) => a - b));
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run content/chapters.test.ts` → FAIL, cannot resolve `./chapters`.

- [ ] **Step 3: Write `content/chapters.ts`**

Compose 11–13 chapters following the reference's rhythm. A worked starting sequence — adjust as the imagery
and copy demand, but keep the alternation:

```
hero            — full-bleed, headline over photograph
lodgeCards      — 01 · The Lodges — the two properties
fullBleedQuote  — a line from the brand record over a wide photograph
chapterIntro    — 02 · Rooted like the mahua — centred, two-tone word, floating images
plateGrid       — 03 · The Forest — wildlife as captioned plates
splitFeature    — 04 · Days in the Field — safaris, walks, the table
fullBleedQuote  — the lantern hour
chapterIntro    — 05 · The Lantern Hour — full-moon ritual, wellness
plateGrid       — 06 · Details — clay, flowers, hands
testimonials    — real ratings and guest lines
invitation      — full-bleed close and call to action
```

If the "no two quiet screens" test fails, the sequence is wrong — reorder or insert an image-led chapter.
Do not weaken the test.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run content/chapters.test.ts` → PASS.

```bash
git add content/chapters.ts content/chapters.test.ts
git commit -m "feat: define the chapter sequence and its rhythm rule"
```

---

### Task 5: Scroll choreography

**Files:**
- Create: `components/motion/ImageReveal.tsx`, `components/motion/SplitLines.tsx`, `components/motion/StickyScene.tsx`
- Modify: `lib/motion.ts`, `lib/motion.test.ts`

**Interfaces:**
- Consumes: `DURATION`, `EASE`, `PARALLAX_MAX`, `prefersReducedMotion` from `lib/motion.ts`
- Produces:
  - `<ImageReveal>{children}</ImageReveal>` — a mask wipes upward off the image as it enters, while the image itself settles from 1.08 scale
  - `<SplitLines as?: "h1" | "h2" | "p">{text}</SplitLines>` — headline lines rise from behind a mask, staggered
  - `<StickyScene height?: number>{children}</StickyScene>` — pins a section while its contents advance

"No perceptible scroll animation" was a specific complaint. The existing `Reveal` fades at 96% scale, which
is too subtle to register. These three are the vocabulary the reference actually uses.

**The motion laws still hold** — nothing bounces, nothing slides in laterally, and everything has a still
state under reduced motion. Richer is not the same as busier.

Add to `lib/motion.ts`:

```ts
export const DURATION = {
  reveal: 1.0,
  revealSlow: 1.4,
  imageMask: 1.2,
  lineStagger: 0.09,
  stagger: 0.06,
  logoRotation: 75,
} as const;

export const IMAGE_FROM = { scale: 1.08 } as const;
```

- [ ] **Step 1: Extend `lib/motion.test.ts`**

```ts
  it("keeps the image mask within the reveal range", () => {
    expect(DURATION.imageMask).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.imageMask).toBeLessThanOrEqual(1.4);
  });

  it("staggers headline lines slowly enough to read as one movement", () => {
    expect(DURATION.lineStagger).toBeGreaterThan(0.04);
    expect(DURATION.lineStagger).toBeLessThan(0.15);
  });

  it("settles images downward in scale, never upward", () => {
    // Scaling up on entry reads as a zoom-in gimmick; settling down reads as
    // the image coming to rest.
    expect(IMAGE_FROM.scale).toBeGreaterThan(1);
    expect(IMAGE_FROM.scale).toBeLessThanOrEqual(1.12);
  });
```

- [ ] **Step 2: Run it and watch it fail, then implement**

Run: `npx vitest run lib/motion.test.ts` → FAIL on the missing tokens. Add them, then build the three
components.

`SplitLines` must degrade safely: if the text cannot be split (no JavaScript, or reduced motion), it renders
as ordinary text at full opacity. **Never leave text hidden behind a mask that never lifts.**

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`

```bash
git add lib/motion.ts lib/motion.test.ts components/motion/
git commit -m "feat: add image-mask, line-split and sticky scroll primitives"
```

---

### Task 6: The copy

**Files:**
- Rewrite: `content/home.ts`
- Modify: `content/home.test.ts`

**Interfaces:**
- Consumes: `reference/site-copy.md` (Task 2), `../Mahua_Resorts_Master_Brand_Record.md`
- Produces: `HOME` with a keyed entry per chapter id from `CHAPTERS`

Every word the visitor reads. Drawn from the live site's existing copy where it is good, and from the brand
record where the live site is thin.

**Voice:** name a gate, a tigress, a tree, a dish. Specificity is the luxury. The audit's finding stands —
the live site's copy is keyword-stuffed in places and must be rewritten rather than pasted, but its
*facts and detail* are the raw material.

**The house-style tests already reject** American spellings and the phrase "boutique nature resorts in
India". Keep both.

- [ ] **Step 1: Add a coverage test**

```ts
  it("gives every chapter its copy", () => {
    for (const c of CHAPTERS) {
      const entry = HOME.chapters[c.id as keyof typeof HOME.chapters];
      expect(entry, `no copy for chapter "${c.id}"`).toBeTruthy();
    }
  });

  it("keeps headings short enough to sit over a photograph", () => {
    for (const [id, entry] of Object.entries(HOME.chapters)) {
      if (!("heading" in entry)) continue;
      expect((entry as { heading: string }).heading.length, `${id} heading`).toBeLessThanOrEqual(70);
    }
  });
```

- [ ] **Step 2: Run it, watch it fail, then write the copy**

Draft every chapter. Report the source of each — live site, brand record, or newly written — so the client
can see what was reused versus invented.

- [ ] **Step 3: Verify and commit**

```bash
git add content/home.ts content/home.test.ts
git commit -m "feat: write the chapter copy from the live site and brand record"
```

---

### Task 7: Build the sections and compose the page

**Files:**
- Create: the eight files under `components/sections/`
- Rewrite: `app/page.tsx`

**Interfaces:**
- Consumes: `CHAPTERS`, `HOME`, `media`, all motion primitives, `PALETTE`
- Produces: the real `/`

One component per `ChapterKind`. `app/page.tsx` maps over `CHAPTERS` and dispatches on `kind`.

**Layout notes drawn from the reference — follow the spirit, not a pixel copy:**
- **Hero:** photograph fills the viewport; headline bottom-left, white, large display serif; minimal header
  (menu left, emblem centre, a gold "Plan your stay" pill right).
- **FullBleedQuote:** photograph fills the viewport; a short line in white display serif, generously spaced.
  A dark scrim behind the text where the photograph is bright — verified by contrast test, not by eye.
- **ChapterIntro:** centred display headline with **one word in `dim` rather than `ink`**; centred body at
  ~56ch; a solid pill CTA; and **two or three images floating asymmetrically at the margins**, partially
  cropped by the viewport edge. This is the reference's signature move and the page should use it more than
  once.
- **PlateGrid:** 3- or 4-up captioned plates, with the guidelines' bordered plate treatment and
  `Plate I. —` style captions.
- **SplitFeature:** copy one side, imagery the other; alternate sides between instances.

**Sections size to their content.** No section sets a height that its content does not fill.

- [ ] **Step 1: Build the eight section components**
- [ ] **Step 2: Rewrite `app/page.tsx` to map over `CHAPTERS`**
- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm test && npm run build && npm run lint`
- [ ] **Step 4: View it in a browser at 1440×900 and scroll the whole page.** Screenshot every chapter.
  **Judge honestly whether any screen looks empty** — if one does, fix it before committing rather than
  deferring.
- [ ] **Step 5: Commit**

```bash
git add components/sections app/page.tsx
git commit -m "feat: build the chapter sections and compose the page"
```

---

### Task 8: Verify against the client's complaints

**Files:** none created — this task produces evidence in `docs/reviews/2026-08-03-chapters/`.

The four complaints were: too few images, no scroll animation, too much empty space, no resemblance to the
reference. Each gets a measurement.

- [ ] **Step 1: Image density**

Count distinct images rendered on `/`. Report the count and images-per-screen. **Target: at least 20
distinct images, and at least 2 per screen of scroll.**

- [ ] **Step 2: Empty space**

At 1440×900, for each chapter, measure the fraction of its area occupied by text or imagery.
**No chapter may exceed ~30% empty.** Report the table; name any that fail.

- [ ] **Step 3: Motion**

Capture a chapter mid-reveal at three scroll offsets and show the mask and line-stagger are visibly in
progress — not a still frame that could pass for no animation.

- [ ] **Step 4: Screenshots at 390 / 768 / 1440 / 1920**

Per chapter, using `window.scrollTo` and normal viewport captures.

- [ ] **Step 5: Lighthouse against the production build**

Report all four scores, total transfer, largest asset, and LCP against the budgets in Global Constraints.

- [ ] **Step 6: Contrast**

Every text-over-photograph instance measured. Body ≥ 4.5:1, large display ≥ 3:1. Name any failure.

- [ ] **Step 7: Reduced motion** — every section visible and readable, nothing stuck behind a mask.

- [ ] **Step 8: Commit the evidence and report**

---

## What follows this plan

| Plan | Contents |
|---|---|
| **4** | The signature interactions — the spinning mahua emblem, the leaf cursor, and the ink tiger |
| **5** | Performance hardening, the targeted shot list, the SEO redirect map, Sanity wiring |

---

## Self-Review

**Client complaints covered.** Too few images → Tasks 3, 8 (measured). No scroll animation → Task 5, 8
(measured mid-reveal). Empty space → Task 4's rhythm rule, Task 7's "sections size to content", Task 8's
≤30% measurement. No resemblance to the reference → Tasks 4, 7 follow its structure and layout moves.
Use the live site's text and images → Tasks 2, 3. Chapters → Task 4. Creative freedom over the guidelines →
stated in the direction block and exercised in Task 7's layout notes.

**Placeholder scan.** No TBD/TODO. Task 4's chapter sequence is a worked starting point with an explicit
instruction to adjust against real imagery and copy, and a test that fails if the rhythm breaks — not a
vague "compose something". Task 6's copy is drafted from named sources rather than left to invention.

**Type consistency.** `PALETTE`/`PaletteToken` defined Task 1, consumed Task 7. `MediaId`, `category`,
`orientation`, `fullBleedSafe` defined Task 3, consumed Tasks 4, 7. `Chapter`/`ChapterKind`/`CHAPTERS`
defined Task 4, consumed Tasks 6, 7. `DURATION.imageMask`, `DURATION.lineStagger`, `IMAGE_FROM` defined
Task 5, consumed Task 7. `HOME.chapters` keyed by `Chapter.id` — the coverage test in Task 6 enforces the
join.
