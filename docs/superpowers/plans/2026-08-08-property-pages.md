# Property Pages (Mahua Vann + Mahua Tola) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/mahua-vann` and `/mahua-tola`, two dedicated property pages extending the finished home page in Sujan's manner — a chapter-idiom story register, then a denser "field notes" register for rooms, getting-there and booking.

**Architecture:** Reuse `Hero`, `ChapterIntro`, `PlateGrid` and `FullBleedQuote` as-is (after a small, backward-compatible prop addition — see Task 1); add two new section components (`RoomsIndex`, `FieldNotes`); add a shared property-chapter renderer used by both routes; add two content dials (`content/mahua-vann.ts`, `content/mahua-tola.ts`) following `content/home.ts`'s pattern; extend the existing image pipeline with freshly-fetched per-property photography.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind, Vitest, Playwright (verification rigs), `sharp` (image pipeline).

## Global Constraints

- Cream throughout; no component hard-codes a colour, duration or string — colour comes from `lib/palette.ts` (via CSS vars already wired in `app/globals.css`), timing from `lib/motion.ts`, copy from `content/*.ts`.
- No section may exceed 45% empty space at 1440×900 (`scripts/measure_density.mjs`).
- Only images ≥1400px wide may go full-bleed (`fullBleedSafe: true`, non-negotiable #11).
- British spelling; no invented facts or quotes; every hard number either sourced or explicitly flagged for client confirmation.
- Gold (`--accent`, `#BB8F2E`) is decorative only, never text; `--accent-text` (`goldText`) for legible gold-toned text/links.
- `npm test`, `npm run build`, `npm run lint` must stay green before any commit claiming a task complete. `npm run verify:budget` must pass before the final task.
- Restraint: nothing bounces, no permanent peripheral motion, one entrance curve (`ENTER.ease`).
- Never invent a distinct photograph where none exists — a shared photo across two content entries must say so in its caption (see Task 6/8's `note` field).

---

## File structure

| File | Responsibility |
|---|---|
| `components/sections/Hero.tsx`, `ChapterIntro.tsx`, `PlateGrid.tsx`, `FullBleedQuote.tsx` | **Modified** — accept an optional `copy` prop (Task 1), zero behaviour change for existing callers |
| `components/ui/ChapterMenu.tsx`, `components/ui/SiteHeader.tsx` | **Modified** — accept optional `chapters`/`nav`/`ctaLabel` props (Task 2), default to the home page's own values |
| `components/sections/RoomsIndex.tsx` | **New** — the rooms grid: photo, name, size, bed, view, honest shared-photo captioning |
| `components/sections/FieldNotes.tsx` | **New** — getting there, address, Book + Enquire, sister-property link |
| `content/property-chapters.ts` | **New** — `PropertyChapterKind`, `PropertyChapter` types shared by both properties |
| `components/property/PropertyPage.tsx` | **New** — the shared kind-to-component dispatcher both routes render through |
| `scripts/build_images.mjs` | **Modified** — `CURATION` array gains the new property photographs |
| `content/mahua-vann.ts`, `content/mahua-vann.test.ts` | **New** — Vann's chapter spine + copy dial + tests |
| `content/mahua-tola.ts`, `content/mahua-tola.test.ts` | **New** — Tola's chapter spine + copy dial + tests |
| `app/mahua-vann/page.tsx`, `app/mahua-tola/page.tsx` | **New** — the two routes |
| `content/home.ts`, `components/sections/LodgeCards.tsx` | **Modified** — internal links once both routes exist (Task 12) |

---

### Task 1: Let `Hero`, `ChapterIntro`, `PlateGrid` and `FullBleedQuote` take copy as a prop — and a chapter shape both pages can pass

**Why this is needed:** all four currently call `chapterCopy(chapter.id as ChapterCopyKey)` from `@/content/home` *internally* — they are not presentation-only, they self-fetch from the home page's single global copy dial. A property page's chapters have no entry in `HOME.chapters`, so these components cannot render property content without this change. The fix is additive only: `copy` becomes an optional prop whose **default value is the exact expression the component already runs**, so every existing call site (`app/page.tsx`) needs no change at all and behaves identically.

**A second, smaller problem needs the same visit:** all four type their `chapter` prop as `Chapter` from `@/content/chapters`, whose `kind` field is `ChapterKind` — a closed union of the home page's nine section kinds. Task 6 introduces `PropertyChapter`, whose `kind` is a *different* closed union (`PropertyChapterKind`) that includes `"roomsIndex"` and `"fieldNotes"`, neither of which exists in `ChapterKind`. A `PropertyChapter` is therefore not assignable to `Chapter` — passing one to any of these four components would fail to compile. None of the four ever reads `chapter.kind`, so the fix is to type them against the narrower shape they actually use, defined once in `content/chapters.ts` so both `content/chapters.ts` and `content/property-chapters.ts` (Task 6) can satisfy it without importing each other.

**Files:**
- Modify: `content/chapters.ts` (add one exported type)
- Modify: `components/sections/Hero.tsx`
- Modify: `components/sections/ChapterIntro.tsx`
- Modify: `components/sections/PlateGrid.tsx`
- Modify: `components/sections/FullBleedQuote.tsx`

**Interfaces:**
- Produces: `ChapterLike` (from `content/chapters.ts`), `HeroCopy`, `IntroCopy` (exported as `ChapterIntroCopy`), `PlateGridCopy`, `QuoteCopy` (exported as `FullBleedQuoteCopy`) — all now exported, consumed by Task 6/7/9's content dials and renderer.

- [ ] **Step 1: Add the shared minimal chapter shape**

In `content/chapters.ts`, add this export (near the `Chapter` type, after it):

```ts
/**
 * The shape a chapter *section component* actually reads — id, its optional
 * number/label, and the photographs it carries. Every one of `Hero`,
 * `ChapterIntro`, `PlateGrid` and `FullBleedQuote` types its `chapter` prop
 * against this rather than the full `Chapter`, because none of them reads
 * `kind` — and `content/property-chapters.ts`'s `PropertyChapter` has a
 * different, non-overlapping `kind` union, so it could never satisfy `Chapter`
 * itself. Both `Chapter` and `PropertyChapter` satisfy `ChapterLike`
 * structurally, with no import relationship needed between the two files.
 */
export type ChapterLike = {
  id: string;
  number?: string;
  label?: string;
  media: readonly MediaId[];
};
```

- [ ] **Step 2: Export and widen `Hero`'s copy type, retype `chapter`, make `copy` an optional prop**

In `components/sections/Hero.tsx`, change the import:

```tsx
import type { Chapter } from "@/content/chapters";
```

to:

```tsx
import type { ChapterLike } from "@/content/chapters";
```

Then change:

```tsx
type HeroCopy = {
  readonly headline: string;
  readonly sub: string;
  readonly scrollCue: string;
};
```

to:

```tsx
export type HeroCopy = {
  readonly headline: string;
  readonly sub: string;
  readonly scrollCue: string;
};
```

Then change the function signature and body:

```tsx
export function Hero({ chapter, copy }: { chapter: ChapterLike; copy?: HeroCopy }) {
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as HeroCopy);
  const heroImage = media(chapter.media[0]);
```

and replace every remaining `copy.headline` / `copy.sub` / `copy.scrollCue` in the function body with `resolvedCopy.headline` / `resolvedCopy.sub` / `resolvedCopy.scrollCue`.

- [ ] **Step 3: Same change in `ChapterIntro.tsx`**

Change the import the same way (`Chapter` → `ChapterLike`). Export `IntroCopy` as `ChapterIntroCopy`:

```tsx
export type ChapterIntroCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};
```

Add `copy` to the props type and resolve it the same way:

```tsx
export function ChapterIntro({
  chapter,
  copy,
  mirrored = false,
  surface = false,
  footer,
  hanging,
}: {
  chapter: ChapterLike;
  copy?: ChapterIntroCopy;
  mirrored?: boolean;
  surface?: boolean;
  hanging?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as ChapterIntroCopy);
  const [solo, pairTop, pairLower] = chapter.media;
```

Replace the two remaining `copy.heading` / `copy.body` references in the body with `resolvedCopy.heading` / `resolvedCopy.body`.

- [ ] **Step 4: Same change in `PlateGrid.tsx`**

Change the import the same way. Export the existing `PlateGridCopy` type (it is already named `PlateGridCopy` at the top of the file — just add `export`):

```tsx
export type PlateGridCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly plates: readonly PlateCopy[];
};
```

Update the signature:

```tsx
export function PlateGrid({
  chapter,
  copy,
  surface = false,
}: {
  chapter: ChapterLike;
  copy?: PlateGridCopy;
  surface?: boolean;
}) {
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as PlateGridCopy);
  const { plates } = resolvedCopy;
```

Replace the remaining `copy.heading` / `copy.intro` in the body with `resolvedCopy.heading` / `resolvedCopy.intro`.

- [ ] **Step 5: Same change in `FullBleedQuote.tsx`**

Change the import the same way.

```tsx
export type FullBleedQuoteCopy = { readonly quote: string };

export function FullBleedQuote({
  chapter,
  copy,
  scrim,
}: {
  chapter: ChapterLike;
  copy?: FullBleedQuoteCopy;
  scrim: ScrimStrength;
}) {
  const resolvedCopy = copy ?? (chapterCopy(chapter.id as ChapterCopyKey) as FullBleedQuoteCopy);
```

Replace `{copy.quote}` in the JSX with `{resolvedCopy.quote}`.

- [ ] **Step 6: Verify nothing on the home page changed behaviourally**

Run: `npm test`
Expected: all existing suites pass unchanged (280 tests), because every call site in `app/page.tsx` omits `copy` and gets the exact same `chapterCopy(...)` lookup as before.

Run: `npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 7: Commit**

```bash
git add content/chapters.ts components/sections/Hero.tsx components/sections/ChapterIntro.tsx components/sections/PlateGrid.tsx components/sections/FullBleedQuote.tsx
git commit -m "refactor: let Hero, ChapterIntro, PlateGrid and FullBleedQuote take copy as a prop

Additive only — copy defaults to the exact chapterCopy() lookup each
component already ran, so app/page.tsx needs no change. Also retypes
their chapter prop to the new ChapterLike (id/number/label/media only,
no kind), so a PropertyChapter — whose kind union doesn't overlap
ChapterKind's — can be passed to any of them without a type error."
```

---

### Task 2: Let `SiteHeader` and `ChapterMenu` take their chapter list and nav copy as props

**Files:**
- Modify: `components/ui/ChapterMenu.tsx`
- Modify: `components/ui/SiteHeader.tsx`

**Interfaces:**
- Produces: `ChapterMenu({ chapters?, nav? })`, `SiteHeader({ ctaHref, ctaLabel?, chapters?, nav? })` — both default to the home page's own `CHAPTERS`/`HOME.nav`, so `app/page.tsx`'s existing `<SiteHeader ctaHref={...} />` call needs no change.

- [ ] **Step 1: Widen `ChapterMenu`'s props, default to home's own values**

In `components/ui/ChapterMenu.tsx`, change:

```tsx
export function ChapterMenu() {
```

to:

```tsx
type MenuChapter = { readonly id: string; readonly number?: string; readonly label?: string };
type MenuNav = {
  readonly menu: string;
  readonly menuTitle: string;
  readonly menuClose: string;
  readonly menuHint: string;
};

export function ChapterMenu({
  chapters = CHAPTERS,
  nav = HOME.nav,
}: {
  chapters?: readonly MenuChapter[];
  nav?: MenuNav;
}) {
```

Then replace every remaining `CHAPTERS` in the function body with `chapters`, and every `HOME.nav.menu` / `HOME.nav.menuTitle` / `HOME.nav.menuClose` / `HOME.nav.menuHint` with `nav.menu` / `nav.menuTitle` / `nav.menuClose` / `nav.menuHint`. The `numbered` filter stays `chapters.filter((c) => c.number && c.label)`.

- [ ] **Step 2: Widen `SiteHeader`'s props the same way**

In `components/ui/SiteHeader.tsx`, change the import and signature:

```tsx
import { CHAPTERS, type Chapter } from "@/content/chapters";
```

to keep `CHAPTERS` as the default and add the new params:

```tsx
export function SiteHeader({
  ctaHref,
  ctaLabel = HOME.nav.cta,
  chapters = CHAPTERS,
  nav = HOME.nav,
}: {
  ctaHref: string;
  ctaLabel?: string;
  chapters?: React.ComponentProps<typeof ChapterMenu>["chapters"];
  nav?: React.ComponentProps<typeof ChapterMenu>["nav"];
}) {
  const hero = chapters.find((chapter) => chapter.kind === "hero");
```

Note: `chapters.find((chapter) => chapter.kind === "hero")` only works if every element carries `kind` — `CHAPTERS` does. Property pages will pass their own `PropertyChapter[]` (Task 4), which also carries `kind`, so the type stays compatible; the `React.ComponentProps<typeof ChapterMenu>["chapters"]` type only requires `{id, number?, label?}`, so widen the local `hero` lookup instead to take a chapters array typed loosely enough for both. Concretely, keep `SiteHeader`'s own chapters parameter typed as `readonly ({ id: string; kind?: string; number?: string; label?: string })[]` so both `Chapter[]` and `PropertyChapter[]` satisfy it, and pass it through to `ChapterMenu`:

```tsx
type HeaderChapter = {
  readonly id: string;
  readonly kind?: string;
  readonly number?: string;
  readonly label?: string;
};

export function SiteHeader({
  ctaHref,
  ctaLabel = HOME.nav.cta,
  chapters = CHAPTERS,
  nav = HOME.nav,
}: {
  ctaHref: string;
  ctaLabel?: string;
  chapters?: readonly HeaderChapter[];
  nav?: { menu: string; menuTitle: string; menuClose: string; menuHint: string };
}) {
  const hero = chapters.find((chapter) => chapter.kind === "hero");
  if (!hero) throw new Error("The page has no hero chapter for the header to watch.");

  return (
    <StickyHeader heroId={hero.id}>
      <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 md:px-12 md:py-8">
        <ChapterMenu chapters={chapters} nav={nav} />

        <BrandMark className="justify-self-center" />

        <div data-contrast="header-pill" className="pointer-events-auto justify-self-end">
          <PillButton href={ctaHref}>{ctaLabel}</PillButton>
        </div>
      </div>
    </StickyHeader>
  );
}
```

- [ ] **Step 3: Verify home page unaffected**

Run: `npm test`
Expected: all tests pass. `StickyHeader.test.tsx` and any test importing `SiteHeader`/`ChapterMenu` directly must still pass with no changes to their own test code, since both new prop sets default to the exact values previously hard-imported.

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/ui/ChapterMenu.tsx components/ui/SiteHeader.tsx
git commit -m "refactor: let SiteHeader and ChapterMenu take chapters/nav as props

Defaults to CHAPTERS/HOME.nav, so app/page.tsx is unchanged.
Property pages will pass their own short chapter list and nav copy."
```

---

### Task 3: Fetch the property photography the crawler missed

**Why:** `reference/wp-pages/resorts_mahua-{vann,tola}.html` reference per-room and per-experience photographs (e.g. `Mahua-Website-Images_Pench_Deluxe.jpg`) via a `data-image` lazy-load attribute on a `<div>`, not a plain `<img src>`. `scripts/fetch_wp_media.py` and `scripts/crawl_site.py` only harvest `<img>` sources, so none of these files exist in `reference/wp-media/` despite being referenced there. Confirmed still live on `mahuaresorts.com` (HTTP 200) on 8 Aug 2026. Also confirmed: every large usable file already in `reference/wp-media/` (`Cottage-with-deck-2-scaled.jpg`, `RAG1474-scaled.jpg`, `TWD5223-scaled.jpg`, `DSC00063/170-scaled.jpg`, `DSC09540-scaled.jpg`, `vcccc-scaled.jpg`, etc.) is **already claimed by the home page's own `CURATION` list** in `scripts/build_images.mjs` — reusing one of those files' bytes under a second id would risk tripping `lib/media.test.ts`'s perceptual-hash duplicate guard, so property-page photography needs its own, freshly-fetched files.

**Files:**
- Create: `reference/wp-media/property-pages/` (new subfolder, keeps the fetched set visually separate from the crawler's own harvest)
- Create: `scripts/fetch_property_media.mjs`

- [ ] **Step 1: Write the fetch script**

```js
// One-off fetch for property-page photography the crawler's <img>-only
// harvest missed — these are loaded via a `data-image` lazy-load attribute
// WordPress puts on a <div>, not a real <img src>. Confirmed live 8 Aug 2026.
//
// Run: node scripts/fetch_property_media.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "reference", "wp-media", "property-pages");
const BASE = "https://mahuaresorts.com/wp-content/uploads/2024/09/";

const FILES = [
  // Vann
  "JAS05303-HDR-scaled.jpg",
  "Mahua-Website-Images_Pench_Deluxe.jpg",
  "Mahua-Website-Images_Pench_Jungle-Safari.jpg",
  "Mahua-Website-Images_Pench_Kohka-Lake.jpg",
  "Mahua-Website-Images_Pench_Potters-Village.jpg",
  "Mahua-Website-Images_Pench_Dining.jpg",
  "Mahua-Website-Images_Pench_Bird-Watching.jpg",
  "Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg",
  // Tola
  "TWD5337-scaled.jpg",
  "Mahua-Website-Images_Tadoba_Deluxe-room.jpg",
  "Mahua-Website-Images_Tadoba_Suite-room.jpg",
  "Mahua-Website-Images_Tadoba_Camping-hut.jpg",
  "Mahua-Website-Images_Tadoba_Tiger-safari.jpg",
  "Mahua-Website-Images_Tadoba_River-Walk.jpg",
  "Mahua-Website-Images_Tadoba_Experiences.jpg",
  "Mahua-Website-Images_Tadoba_Swimming.jpg",
  "Mahua-Website-Images_Tadoba_Wildlife-documentaries.jpg",
  "DSC00044-scaled.jpg",
  "DSC00091-scaled.jpg",
  "DSC00097-scaled.jpg",
  "DSC00122-scaled.jpg",
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const file of FILES) {
    const dest = path.join(OUT_DIR, file);
    const res = await fetch(BASE + file);
    if (!res.ok) {
      console.error(`FAILED ${res.status} ${file} — this file may need a different path or is no longer live.`);
      continue;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, bytes);
    console.log(`${file} — ${bytes.length} bytes`);
  }
}

main();
```

- [ ] **Step 2: Run it and confirm every file landed**

Run: `node scripts/fetch_property_media.mjs`
Expected: one line per file with a byte count > 0. Any `FAILED` line means that specific URL is no longer live — note it and pick a substitute from the same live page's other real `<img>` sources (already present in `reference/wp-media/`) rather than blocking the task on one missing file.

- [ ] **Step 3: Look at every fetched file by eye before curating it**

Open each file in `reference/wp-media/property-pages/` (an image viewer, or `node -e` with `sharp(...).metadata()` for dimensions plus a visual check). Confirm: it shows what its filename claims, its resolution is usable (expect most WordPress `-scaled.jpg` and `Mahua-Website-Images_*` files to land between 1080px and 2560px wide — verify per-file, do not assume), and it is not a near-duplicate of something already in `lib/media-manifest.ts`. This is the same discipline `scripts/build_images.mjs`'s own `CURATION` comment describes for the original 34 — filenames are not evidence.

For the four generic `DSC000xx-scaled.jpg` Tola frames (no filename tells you what's in them): note in a short comment above the fetch list which one shows the dining area (used in Task 8 as Tola's dining plate) and which is the most useful full-bleed candidate for the guest-quote chapter (must measure ≥1400px wide — expect the `-scaled` files to clear this, confirm with `sharp`).

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch_property_media.mjs reference/wp-media/property-pages/
git commit -m "feat: fetch the property photography the wp-media crawl missed

The live pages load per-room and per-experience images via a data-image
lazy-load attribute the <img>-only crawler never caught. Fetched
directly from mahuaresorts.com, confirmed live 8 Aug 2026."
```

---

### Task 4: Curate the fetched photography into the image pipeline

**Files:**
- Modify: `scripts/build_images.mjs` (append to `CURATION`)
- Modify: `lib/media-manifest.ts` (generated — do not hand-edit; regenerated by Step 2)

- [ ] **Step 1: Append the new entries to `CURATION`**

Add this block to the end of the `CURATION` array in `scripts/build_images.mjs`, immediately before its closing `];`. Confirm each `orientation` and `fullBleedSafe` against what Task 3 Step 3 actually measured — the values below are the expected defaults for images of this size class and must be corrected if any file's real dimensions differ:

```js
  // ---- Property pages: Mahua Vann ----
  {
    id: "vann-hero",
    src: "reference/wp-media/property-pages/JAS05303-HDR-scaled.jpg",
    alt: "Mahua Vann's lodge grounds under the Pench forest canopy.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "vann-room-deluxe",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Deluxe.jpg",
    alt: "A Deluxe room at Mahua Vann, garden and jungle view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-room-cottage",
    src: "reference/wp-media/Cottage-with-deck-2-scaled.jpg",
    alt: "A cottage with a private deck over the seasonal river at Mahua Vann.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "vann-safari",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Jungle-Safari.jpg",
    alt: "An open safari vehicle on a morning game drive at Pench.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-kohka-lake",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Kohka-Lake.jpg",
    alt: "Kohka Lake near Mahua Vann, still water at the forest's edge.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-potters-village",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Potters-Village.jpg",
    alt: "A potter at work in Pachdhar, the village of Kumhar families beside Pench.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-dining",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Dining.jpg",
    alt: "A table laid at Mahua Vann, seasonal dishes under the open sky.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-bird-watching",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Bird-Watching.jpg",
    alt: "Birdwatching in Mahua Vann's private eco park.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-evening",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg",
    alt: "An evening gathering at Mahua Vann after the day's safari.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },

  // ---- Property pages: Mahua Tola ----
  {
    id: "tola-hero",
    src: "reference/wp-media/property-pages/TWD5337-scaled.jpg",
    alt: "Mahua Tola's lodge grounds on the edge of Tadoba-Andhari Tiger Reserve.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "tola-room-deluxe",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Deluxe-room.jpg",
    alt: "A Deluxe room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-suite",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Suite-room.jpg",
    alt: "A Suite room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-camping",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Camping-hut.jpg",
    alt: "The camping hut at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-tiger-safari",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Tiger-safari.jpg",
    alt: "A tiger safari vehicle in Tadoba-Andhari Tiger Reserve.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-river-walk",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_River-Walk.jpg",
    alt: "The Hattinala river near Mahua Tola.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-experiences",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Experiences.jpg",
    alt: "Guests exploring near Mahua Tola.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Confirm in Task 3 Step 3 which DSC000xx frame actually shows dining and
    // substitute its real filename here before running Step 2 below.
    id: "tola-dining",
    src: "reference/wp-media/property-pages/DSC00044-scaled.jpg",
    alt: "Dining at Mahua Tola.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "tola-guest-word",
    src: "reference/wp-media/property-pages/DSC00091-scaled.jpg",
    alt: "Evening light over Mahua Tola.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "tola-swimming",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Swimming.jpg",
    alt: "The pool at Mahua Tola.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-evening",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Wildlife-documentaries.jpg",
    alt: "An evening gathering at Mahua Tola after the day's safari.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
```

- [ ] **Step 2: Regenerate the manifest**

Run: `node scripts/build_images.mjs`
Expected: console output confirming the new ids were encoded (mirrors output for the existing 34), `lib/media-manifest.ts` regenerated with 34 + 19 = 53 entries, `public/media/` gains the new derivatives.

- [ ] **Step 3: Verify distinctness and budget**

Run: `npm test`
Expected: `lib/media.test.ts` passes — including its perceptual-hash duplicate check. **If `vann-room-cottage` is flagged as a near-duplicate of whatever id the home page gave `Cottage-with-deck-2-scaled.jpg`, that is a true positive on identical bytes, not a false alarm.** Do not exempt the guard. Resolve it by either dropping `vann-room-cottage` as its own manifest entry and having Task 6's Vann rooms copy reference the home page's existing id directly (if `lib/media.ts`'s `MediaId` union already contains it — check `scripts/build_images.mjs`'s existing entries for its id), or by sourcing a genuinely different cottage photograph before proceeding.

Run: `node scripts/build_images.mjs && npx tsc --noEmit`
Expected: no type errors — `MediaId` now includes the new ids.

- [ ] **Step 4: Commit**

```bash
git add scripts/build_images.mjs lib/media-manifest.ts public/media/
git commit -m "feat: curate the fetched property photography into the image pipeline

19 new entries — hero, rooms, place and experience photography for
both Mahua Vann and Mahua Tola, at the same four widths and budget
discipline as the existing 34."
```

---

### Task 5: Build `RoomsIndex` and `FieldNotes`

**Files:**
- Create: `components/sections/RoomsIndex.tsx`
- Create: `components/sections/FieldNotes.tsx`

**Interfaces:**
- Produces: `RoomsIndexCopy`, `RoomEntryCopy`, `FieldNotesCopy` — consumed by Task 6/8's content dials.
- Consumes: `ChapterMark`, `ChapterSurface`, `TwoToneHeading`, `Photo`, `Enter`, `ImageReveal`, `PillButton` (all existing, unmodified).

- [ ] **Step 1: Write `RoomsIndex`**

```tsx
import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type RoomEntryCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  readonly size: string;
  readonly bed: string;
  readonly view: string;
  /**
   * Set only when this room type shares a photograph with another entry in
   * the same list — the honest alternative to implying a distinct image that
   * does not exist. E.g. "Shown: Cottage with Deck".
   */
  readonly note?: string;
};

export type RoomsIndexCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly rooms: readonly RoomEntryCopy[];
};

const SIZES: Record<number, string> = {
  2: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
  3: "(min-width: 1600px) 480px, (min-width: 1024px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

/**
 * The rooms index — the field notes register's first beat. A compact grid
 * built to be scanned, not lingered over: photo, name, then the facts a
 * planner is actually looking for, in one line each.
 */
export function RoomsIndex({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomsIndexCopy;
  surface?: boolean;
}) {
  const columns = copy.rooms.length >= 4 ? 3 : 2;
  const sizes = SIZES[columns] ?? SIZES[2];

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            <p
              className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </div>
        </Enter>

        <div
          className={`mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-12 sm:grid-cols-2 ${
            columns === 3 ? "lg:grid-cols-3" : ""
          }`}
        >
          {copy.rooms.map((room, i) => (
            <Enter key={room.name} delay={ENTER.stagger * (i % columns)}>
              <article>
                <ImageReveal className="block aspect-[4/3] w-full">
                  <Photo
                    id={room.mediaId}
                    sizes={sizes}
                    box={4 / 3}
                    pictureClassName="block h-full w-full"
                    className="h-full w-full object-cover"
                  />
                </ImageReveal>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-light leading-tight text-[color:var(--text)]">
                  {room.name}
                </h3>
                <ul className="mt-2 space-y-1 font-[family-name:var(--font-body)] text-sm leading-relaxed" style={{ color: "var(--dim)" }}>
                  <li>{room.size}</li>
                  <li>{room.bed}</li>
                  <li>{room.view}</li>
                </ul>
                {room.note && (
                  <p className="mt-2 font-[family-name:var(--font-body)] text-xs italic" style={{ color: "var(--dim)" }}>
                    {room.note}
                  </p>
                )}
              </article>
            </Enter>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 2: Write `FieldNotes`**

```tsx
import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { PillButton } from "@/components/ui/PillButton";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type FieldNotesCopy = {
  readonly heading: TwoTone;
  readonly gettingThere: readonly { readonly label: string; readonly value: string }[];
  readonly address: string;
  readonly bookLabel: string;
  readonly enquireLabel: string;
  readonly siblingLabel: string;
};

/**
 * The field notes register's close — getting there, the address, and the
 * one quiet ask of the whole page. No photography: this band is built to be
 * scanned, and the gear-change from the story above it is legibility and
 * density, not colour or motion.
 */
export function FieldNotes({
  chapter,
  copy,
  bookHref,
  enquireHref,
  siblingHref,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: FieldNotesCopy;
  bookHref: string;
  enquireHref: string;
  siblingHref: string;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-20">
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            <dl className="mt-8 space-y-4">
              {copy.gettingThere.map((fact) => (
                <div key={fact.label} className="border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                  <dt
                    className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.2em]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {fact.label}
                  </dt>
                  <dd
                    className="mt-1 font-[family-name:var(--font-body)] text-[1.02rem]"
                    style={{ color: "var(--text)" }}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 font-[family-name:var(--font-body)] text-sm" style={{ color: "var(--dim)" }}>
              {copy.address}
            </p>
          </div>
        </Enter>

        <Enter delay={ENTER.stagger}>
          <div className="flex flex-col items-start gap-6 lg:justify-center">
            <div className="flex flex-wrap items-center gap-4">
              <PillButton href={bookHref} size="large" external>
                {copy.bookLabel}
              </PillButton>
              <PillButton href={enquireHref} size="large">
                {copy.enquireLabel}
              </PillButton>
            </div>
            <a
              href={siblingHref}
              className="rule-in rule-in--rest inline-block pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
              style={{ color: "var(--accent-text)" }}
            >
              {copy.siblingLabel}
            </a>
          </div>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: fails here — `@/content/property-chapters` does not exist yet. That is expected; Task 6 creates it. Proceed.

- [ ] **Step 4: Commit**

```bash
git add components/sections/RoomsIndex.tsx components/sections/FieldNotes.tsx
git commit -m "feat: add RoomsIndex and FieldNotes, the property pages' field-notes components

Two new components in the same visual language as the home page —
denser, built to be scanned. Type-checks once content/property-chapters.ts lands (next task)."
```

---

### Task 6: `content/property-chapters.ts` and `components/property/PropertyPage.tsx`

**Files:**
- Create: `content/property-chapters.ts`
- Create: `components/property/PropertyPage.tsx`

**Interfaces:**
- Produces: `PropertyChapterKind`, `PropertyChapter`, `PROPERTY_IMAGE_LED_KINDS`, `PROPERTY_FULL_BLEED_KINDS`, `PropertyPage` component.
- Consumes: `Hero`, `ChapterIntro`, `PlateGrid`, `FullBleedQuote` (Task 1), `RoomsIndex`, `FieldNotes` (Task 5), `SiteHeader` (Task 2).

- [ ] **Step 1: Write `content/property-chapters.ts`**

```ts
import type { MediaId } from "@/lib/media";

/**
 * The kinds a property page's spine may use. A deliberately small subset of
 * the home page's `ChapterKind` — property pages do not carry the home
 * page's signature interactions (the lantern, the two films, the pinned
 * collage), so those kinds have no equivalent here.
 */
export type PropertyChapterKind =
  | "hero"
  | "chapterIntro"
  | "plateGrid"
  | "fullBleedQuote"
  | "roomsIndex"
  | "fieldNotes";

export type PropertyChapter = {
  id: string;
  number?: string;
  label?: string;
  kind: PropertyChapterKind;
  media: readonly MediaId[];
};

/**
 * The kinds that count as carrying a screen on their photography, for the
 * rhythm-alternation test each property's own test file runs.
 *
 * `roomsIndex` is counted image-led here, unlike the home page's
 * (deliberately conservative) treatment of visually similar layouts —
 * every entry in it is a real photograph of a real room, which is closer in
 * spirit to `plateGrid`'s specimen board than to `chapterIntro`'s prose
 * column with photographs at the margins.
 */
export const PROPERTY_IMAGE_LED_KINDS: readonly PropertyChapterKind[] = [
  "hero",
  "plateGrid",
  "fullBleedQuote",
  "roomsIndex",
];

/** Mirrors `FULL_BLEED_KINDS` in `content/chapters.ts` — CLAUDE.md non-negotiable #11. */
export const PROPERTY_FULL_BLEED_KINDS: readonly PropertyChapterKind[] = ["hero", "fullBleedQuote"];
```

- [ ] **Step 2: Write the shared `PropertyPage` renderer**

```tsx
import { ChapterIntro, type ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import { FieldNotes, type FieldNotesCopy } from "@/components/sections/FieldNotes";
import { FullBleedQuote, type FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import { Hero, type HeroCopy } from "@/components/sections/Hero";
import { PlateGrid, type PlateGridCopy } from "@/components/sections/PlateGrid";
import { RoomsIndex, type RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import { SiteHeader } from "@/components/ui/SiteHeader";
import type { ScrimStrength } from "@/components/ui/Scrim";
import type { PropertyChapter, PropertyChapterKind } from "@/content/property-chapters";

/** The chapters that render on cream rather than on a photograph — mirrors `CREAM_KINDS` in `app/page.tsx`. */
const CREAM_KINDS: readonly PropertyChapterKind[] = ["chapterIntro", "plateGrid", "roomsIndex", "fieldNotes"];

export type PropertyPageCopy = {
  readonly heroCopy?: HeroCopy;
  readonly chapterIntroCopy?: Record<string, ChapterIntroCopy>;
  readonly plateGridCopy?: Record<string, PlateGridCopy>;
  readonly fullBleedQuoteCopy?: Record<string, FullBleedQuoteCopy>;
  readonly roomsIndexCopy?: Record<string, RoomsIndexCopy>;
  readonly fieldNotesCopy?: Record<string, FieldNotesCopy>;
};

/**
 * The property pages' spine, rendered. Mirrors `app/page.tsx`'s `renderChapter`
 * + `Home`, generalised over which property is being shown — the two routes
 * differ only in the chapters and copy they pass in.
 *
 * Kept separate from `app/page.tsx`'s own dispatcher rather than merged with
 * it: the home page's switch carries home-only decorations (the lantern, the
 * two films' footers, the pinned-collage branch) that have no meaning here,
 * and folding both into one generic dispatcher would mean every kind
 * threading props neither page needs.
 */
export function PropertyPage({
  chapters,
  copy,
  scrim,
  bookHref,
  bookLabel,
  enquireHref,
  siblingHref,
  nav,
}: {
  chapters: readonly PropertyChapter[];
  copy: PropertyPageCopy;
  /** Per-chapter scrim for `fullBleedQuote` chapters — mirrors `QUOTE_SCRIM` in `app/page.tsx`. */
  scrim: Record<string, ScrimStrength>;
  bookHref: string;
  /**
   * The header pill's label. An explicit prop rather than derived from
   * `copy.fieldNotesCopy` with a fallback string: every other content lookup
   * on this page (`chapterCopy`, `media`, `chapter`) throws on a miss rather
   * than silently substituting a value, and a hard-coded "Book" fallback
   * here would be the one exception — never actually exercised, since both
   * properties' copy always supplies it, and a maintenance trap if that ever
   * stops being true.
   */
  bookLabel: string;
  enquireHref: string;
  siblingHref: string;
  nav: { menu: string; menuTitle: string; menuClose: string; menuHint: string };
}) {
  let cream = 0;

  return (
    <>
      <SiteHeader
        ctaHref={`#${chapters[chapters.length - 1].id}`}
        ctaLabel={bookLabel}
        chapters={chapters}
        nav={nav}
      />
      <main>
        {chapters.map((chapter) => {
          const surface = CREAM_KINDS.includes(chapter.kind) ? cream++ % 2 === 1 : false;

          switch (chapter.kind) {
            case "hero":
              return <Hero key={chapter.id} chapter={chapter} copy={copy.heroCopy} />;
            case "chapterIntro":
              return (
                <ChapterIntro
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.chapterIntroCopy?.[chapter.id]}
                  surface={surface}
                />
              );
            case "plateGrid":
              return (
                <PlateGrid
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.plateGridCopy?.[chapter.id]}
                  surface={surface}
                />
              );
            case "fullBleedQuote":
              return (
                <FullBleedQuote
                  key={chapter.id}
                  chapter={chapter}
                  copy={copy.fullBleedQuoteCopy?.[chapter.id]}
                  scrim={scrim[chapter.id] ?? { flat: 0.4, centre: 0.4 }}
                />
              );
            case "roomsIndex": {
              const roomsCopy = copy.roomsIndexCopy?.[chapter.id];
              if (!roomsCopy) throw new Error(`No roomsIndex copy for "${chapter.id}"`);
              return <RoomsIndex key={chapter.id} chapter={chapter} copy={roomsCopy} surface={surface} />;
            }
            case "fieldNotes": {
              const notesCopy = copy.fieldNotesCopy?.[chapter.id];
              if (!notesCopy) throw new Error(`No fieldNotes copy for "${chapter.id}"`);
              return (
                <FieldNotes
                  key={chapter.id}
                  chapter={chapter}
                  copy={notesCopy}
                  bookHref={bookHref}
                  enquireHref={enquireHref}
                  siblingHref={siblingHref}
                  surface={surface}
                />
              );
            }
            default: {
              const unhandled: never = chapter.kind;
              throw new Error(`No section component for property chapter kind: ${String(unhandled)}`);
            }
          }
        })}
      </main>
    </>
  );
}
```

Note: `Hero`, `ChapterIntro`, `PlateGrid`, `FullBleedQuote` all take `chapter: ChapterLike` as of Task 1 — the minimal shape (`id`/`number?`/`label?`/`media`) that both `Chapter` and `PropertyChapter` satisfy structurally, with no import relationship needed between `content/chapters.ts` and `content/property-chapters.ts`. That is why Task 1 added `ChapterLike` rather than leaving these four typed against `Chapter` directly.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add content/property-chapters.ts components/property/PropertyPage.tsx
git commit -m "feat: add the shared property-chapter spine type and page renderer

PropertyChapterKind is a deliberately small subset of the home page's
ChapterKind — property pages carry none of its signature interactions.
PropertyPage mirrors app/page.tsx's dispatcher, kept separate because
the home page's carries home-only decoration this has no use for."
```

---

### Task 7: Mahua Vann — content dial, spine and tests

**Files:**
- Create: `content/mahua-vann.ts`
- Create: `content/mahua-vann.test.ts`

**Interfaces:**
- Produces: `VANN_CHAPTERS: readonly PropertyChapter[]`, `VANN_COPY: PropertyPageCopy`, `VANN_NAV`.
- Consumes: `PropertyChapter`, `PROPERTY_IMAGE_LED_KINDS`, `PROPERTY_FULL_BLEED_KINDS` (Task 6).

- [ ] **Step 1: Write the chapter spine**

```ts
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Vann's spine. Six chapters: hero, place, dining, experiences, the
 * rooms index, then field notes — no guest quote yet (none of the harvested
 * Tripadvisor reviews name Pench or Vann specifically, and this page does
 * not invent one). Rhythm holds without it: `chapterIntro` is the only
 * "quiet" kind here and it sits between two image-led ones on both sides.
 */
export const VANN_CHAPTERS: readonly PropertyChapter[] = [
  { id: "vann-hero", kind: "hero", media: ["vann-hero"] },
  {
    id: "vann-place",
    number: "01",
    label: "The Place",
    kind: "chapterIntro",
    media: ["vann-safari", "vann-kohka-lake", "vann-potters-village"],
  },
  {
    id: "vann-dining",
    number: "02",
    label: "Dining",
    kind: "plateGrid",
    media: ["vann-dining"],
  },
  {
    id: "vann-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["vann-bird-watching", "vann-evening"],
  },
  {
    id: "vann-rooms",
    kind: "roomsIndex",
    media: ["vann-room-deluxe", "vann-room-cottage"],
  },
  {
    id: "vann-field-notes",
    kind: "fieldNotes",
    media: [],
  },
] as const satisfies readonly PropertyChapter[];
```

- [ ] **Step 2: Write the copy dial**

```ts
import type { ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import type { FieldNotesCopy } from "@/components/sections/FieldNotes";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PlateGridCopy } from "@/components/sections/PlateGrid";
import type { RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";

/**
 * Mahua Vann's copy. Adapted from `reference/site-copy.md`'s Mahua Vann
 * section and `../Mahua_Resorts_Master_Brand_Record.md`, in the established
 * brand voice — British spelling, specificity over adjectives.
 *
 * The room count (26, split 13 Deluxe / 5 Cottage without Deck / 8 Cottage
 * with Deck) is the live site's own structured total and cross-checks
 * against the brand record. Nagpur's distance is deliberately omitted — the
 * live site says 80 km, the brand record 104-112 km, and neither is trusted
 * (see docs/copy-provenance.md, same standard the home page already holds).
 */
export const VANN_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Pench, at the hour the forest wakes",
    sub: "Mahua Vann — five kilometres from Turia Gate, among the first vehicles through it at dawn.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  chapterIntroCopy: {
    "vann-place": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      body: [
        "Mahua Vann sits in the heart of Pench National Park, close enough to Turia Gate to be " +
          "among the first vehicles through it. Mornings begin on a jeep safari through forest " +
          "Kipling wrote into the Jungle Book without ever visiting; afternoons slow down at " +
          "Kohka Lake, where the birds come to the water and the day comes down with them.",
        "A short drive away, more than a hundred Kumhar families in the village of Pachdhar have " +
          "kept the potter's wheel turning for generations. Guests are welcome to sit down at one.",
      ],
    } satisfies ChapterIntroCopy,
  },

  plateGridCopy: {
    "vann-dining": {
      heading: { text: "What the season gives", dim: "gives" },
      intro:
        "Regional dishes built from what is local and in season — Chulai ki Bhaaji, Mahua Kheer — " +
        "beside international favourites, served under the open sky, by the river, or in the " +
        "privacy of a cottage.",
      plates: [
        {
          mediaId: "vann-dining",
          plate: "I",
          caption: "A table laid under the open sky at Mahua Vann.",
        },
      ],
    } satisfies PlateGridCopy,
    "vann-experiences": {
      heading: { text: "The day at Vann", dim: "day" },
      intro:
        "Morning and evening game drives, birdwatching in the lodge's own private eco park, and a " +
        "quieter afternoon at Kohka Lake or the Pachdhar potters' wheel.",
      plates: [
        {
          mediaId: "vann-bird-watching",
          plate: "I",
          caption: "Birdwatching in Mahua Vann's own private eco park.",
        },
        {
          mediaId: "vann-evening",
          plate: "II",
          caption: "An evening gathering after the day's safari, the naturalist's stories still going.",
        },
      ],
    } satisfies PlateGridCopy,
  },

  roomsIndexCopy: {
    "vann-rooms": {
      heading: { text: "Twenty-six rooms, three shapes", dim: "shapes" },
      intro:
        "Deluxe rooms, cottages without a deck and cottages with one over the seasonal river — all " +
        "handmade in mud and local wood, with air conditioning, a tea and coffee maker and a " +
        "private vanity area.",
      rooms: [
        {
          mediaId: "vann-room-deluxe",
          name: "Deluxe",
          size: "225 sq. ft.",
          bed: "Queen bed",
          view: "Garden and jungle view",
        },
        {
          mediaId: "vann-room-cottage",
          name: "Cottage with Deck",
          size: "324 sq. ft.",
          bed: "King bed, private sit-out",
          view: "Jungle and seasonal river view",
        },
        {
          mediaId: "vann-room-cottage",
          name: "Cottage without Deck",
          size: "324 sq. ft.",
          bed: "King bed, private sit-out",
          view: "Jungle view",
          note: "Shown: Cottage with Deck.",
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "vann-field-notes": {
      heading: { text: "Getting to Mahua Vann", dim: "Vann" },
      gettingThere: [
        { label: "By road", value: "Khawasa Bus Stop, 8 km" },
        { label: "From the gate", value: "Five kilometres from Turia Gate" },
      ],
      address: "Village Kuppitola, Khawasa, Madhya Pradesh 480881",
      bookLabel: "Book Mahua Vann",
      enquireLabel: "Enquire",
      siblingLabel: "Looking for Tadoba instead? Mahua Tola →",
    } satisfies FieldNotesCopy,
  },
};

export const VANN_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
```

- [ ] **Step 3: Write the tests, mirroring `content/chapters.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { media } from "@/lib/media";
import { PROPERTY_FULL_BLEED_KINDS, PROPERTY_IMAGE_LED_KINDS, type PropertyChapterKind } from "./property-chapters";
import { VANN_CHAPTERS } from "./mahua-vann";

const MIN_MEDIA = {
  hero: 1,
  chapterIntro: 3,
  plateGrid: 1,
  fullBleedQuote: 1,
  roomsIndex: 1,
  fieldNotes: 0,
} satisfies Record<PropertyChapterKind, number>;

describe("VANN_CHAPTERS", () => {
  it("opens on the hero and closes on field notes", () => {
    expect(VANN_CHAPTERS[0].kind).toBe("hero");
    expect(VANN_CHAPTERS[VANN_CHAPTERS.length - 1].kind).toBe("fieldNotes");
  });

  it("has unique ids", () => {
    expect(new Set(VANN_CHAPTERS.map((c) => c.id)).size).toBe(VANN_CHAPTERS.length);
  });

  it("never runs two quiet screens back to back", () => {
    for (let i = 0; i < VANN_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_KINDS.includes(VANN_CHAPTERS[i].kind);
      const b = PROPERTY_IMAGE_LED_KINDS.includes(VANN_CHAPTERS[i + 1].kind);
      expect(a || b, `"${VANN_CHAPTERS[i].id}" and "${VANN_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("carries enough photographs in each chapter for its layout", () => {
    for (const c of VANN_CHAPTERS) {
      expect(c.media.length, `"${c.id}" is a ${c.kind} with ${c.media.length} image(s)`).toBeGreaterThanOrEqual(
        MIN_MEDIA[c.kind],
      );
    }
  });

  it("only uses full-bleed-safe images where the layout is full-bleed", () => {
    for (const c of VANN_CHAPTERS) {
      if (!PROPERTY_FULL_BLEED_KINDS.includes(c.kind)) continue;
      for (const id of c.media) {
        const m = media(id);
        expect(m.fullBleedSafe, `${id} is only ${m.width}px wide`).toBe(true);
      }
    }
  });

  it("references only real images", () => {
    for (const c of VANN_CHAPTERS) for (const id of c.media) expect(() => media(id)).not.toThrow();
  });

  it("numbers its chapters 01, 02, 03 … with no gaps or repeats", () => {
    const numbered = VANN_CHAPTERS.filter((c) => c.number);
    expect(numbered.map((c) => Number(c.number))).toEqual(numbered.map((_, i) => i + 1));
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run content/mahua-vann.test.ts`
Expected: all pass. If "never runs two quiet screens" fails, re-check the `kind` sequence in Step 1 against `PROPERTY_IMAGE_LED_KINDS` — do not weaken the test to make it pass.

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add content/mahua-vann.ts content/mahua-vann.test.ts
git commit -m "feat: Mahua Vann's content dial — spine, copy, tests"
```

---

### Task 8: `app/mahua-vann/page.tsx` and first browser verification

**Files:**
- Create: `app/mahua-vann/page.tsx`

- [ ] **Step 1: Write the route**

```tsx
import type { Metadata } from "next";
import { PropertyPage } from "@/components/property/PropertyPage";
import { VANN_CHAPTERS, VANN_COPY, VANN_NAV } from "@/content/mahua-vann";

export const metadata: Metadata = {
  title: "Mahua Vann, Pench — Mahua Resorts",
  description:
    "Mahua Vann: five kilometres from Turia Gate at Pench National Park. Rooms, dining, safaris and how to reach us.",
};

export default function MahuaVannPage() {
  return (
    <PropertyPage
      chapters={VANN_CHAPTERS}
      copy={VANN_COPY}
      scrim={{}}
      bookHref="https://asiatech.in/booking_engine/index3?token=ODM1MQ=="
      bookLabel={VANN_COPY.fieldNotesCopy!["vann-field-notes"].bookLabel}
      enquireHref="mailto:sales@mahuaresorts.com?subject=Enquiry%20—%20Mahua%20Vann"
      siblingHref="/mahua-tola"
      nav={VANN_NAV}
    />
  );
}
```

`sales@mahuaresorts.com` is real, not guessed — it appears on every crawled page of the live site, including both current property pages (`reference/wp-pages/resorts_mahua-{vann,tola}.html`), so it is already the address the brand publishes for exactly this purpose.

- [ ] **Step 2: Run the dev server and look at the real page**

Run: `npm run dev`, then open `http://localhost:3000/mahua-vann` at 390, 768, 1440 and 1920px.
Expected: hero photograph, "The Place" with three flanking photographs, "Dining", "Experiences", the rooms grid (three cards, the two cottage entries showing the same photograph with its "Shown: Cottage with Deck" note visible), then Getting There / Book / Enquire / the Tola link. Header menu opens and lists Vann's own four numbered/labelled chapters (place, dining, experiences — field notes carries no number so `ChapterMenu`'s `numbered` filter correctly excludes it and the rooms index, which is also unnumbered).

If anything looks structurally broken (a section colliding with another, an image cropped wrong), fix it before proceeding — this is the same "verify by running the page" discipline the rest of the project holds to.

- [ ] **Step 3: Run the full test suite and build**

Run: `npm test && npm run build && npm run lint`
Expected: all green. Test count should be the prior total (280) plus the new `mahua-vann.test.ts` assertions.

- [ ] **Step 4: Run the browser verification rigs against the new route**

With the production build running (`npx next start -p 3100` in one terminal), in another:

```bash
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-08-property-pages/vann-density.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-08-property-pages/vann-page.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-08-property-pages/vann-rule-in.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-08-property-pages/vann-contrast.json
```

Expected: `measure_density.mjs` reports every screen under the 45% ceiling (non-negotiable #8) — if any screen fails, the fix is width/height taken back from the offending section, not padding added elsewhere (CLAUDE.md's own rule for this exact situation). `check_rule_in.mjs` confirms every link on the page (including `FieldNotes`'s sibling link, which explicitly carries `rule-in rule-in--rest`) has either the hairline or an explicit `data-rule="none"` opt-out (the two `PillButton`s already carry that opt-out).

- [ ] **Step 5: Commit**

```bash
git add app/mahua-vann/ docs/reviews/2026-08-08-property-pages/
git commit -m "feat: ship /mahua-vann

Six chapters — hero, the place, dining, experiences, the rooms
index, field notes. Verified against the density, rule-in and
contrast rigs at the real route."
```

---

### Task 9: Mahua Tola — content dial, spine and tests

**Files:**
- Create: `content/mahua-tola.ts`
- Create: `content/mahua-tola.test.ts`

**This mirrors Task 7.** Two differences worth calling out explicitly:

1. **The room count is the open question flagged in the spec.** The live site's own structured room list totals **twelve** across five types; the brand record says fourteen, "growing," with three new machaan rooms under construction. This task uses the twelve confirmed by the live site's own structured data, because that is the only version with real per-type facts (size/bed/view) to put in a rooms index — and flags the fourteen/machaan claim as unconfirmed rather than inventing three machaan room entries with no sourced facts.
2. **It carries a guest's word** — Vedant's 2019 Tripadvisor review ("One of the best forests for seeing tigers and one of the best resorts to stay in Tadoba"), already verbatim and attributed on the home page (`content/home.ts`'s `guests.quotes[1]`), and explicitly about Tadoba. Reused verbatim, not reworded — the same discipline `content/home.test.ts`'s "attributes every guest quote" test already enforces for the home page.

- [ ] **Step 1: Write the chapter spine**

```ts
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Tola's spine. Seven chapters — one more than Vann's, because a
 * genuine, attributed guest quote exists for this property (Vedant, 2019,
 * names Tadoba directly) and Vann's does not.
 */
export const TOLA_CHAPTERS: readonly PropertyChapter[] = [
  { id: "tola-hero", kind: "hero", media: ["tola-hero"] },
  {
    id: "tola-place",
    number: "01",
    label: "The Place",
    kind: "chapterIntro",
    media: ["tola-tiger-safari", "tola-river-walk", "tola-experiences"],
  },
  {
    id: "tola-guest-word",
    kind: "fullBleedQuote",
    media: ["tola-guest-word"],
  },
  {
    id: "tola-dining",
    number: "02",
    label: "Dining",
    kind: "plateGrid",
    media: ["tola-dining"],
  },
  {
    id: "tola-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["tola-swimming", "tola-evening"],
  },
  {
    id: "tola-rooms",
    kind: "roomsIndex",
    media: ["tola-room-deluxe", "tola-room-suite", "tola-room-camping"],
  },
  {
    id: "tola-field-notes",
    kind: "fieldNotes",
    media: [],
  },
] as const satisfies readonly PropertyChapter[];
```

- [ ] **Step 2: Write the copy dial**

```ts
import type { ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import type { FieldNotesCopy } from "@/components/sections/FieldNotes";
import type { FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PlateGridCopy } from "@/components/sections/PlateGrid";
import type { RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";

/**
 * Mahua Tola's copy. Adapted from `reference/site-copy.md`'s Mahua Tola
 * section and `../Mahua_Resorts_Master_Brand_Record.md`.
 *
 * **Room count: twelve, not fourteen.** The live site's own structured room
 * list (5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite + 1
 * Camping Hut = 12) is what has real per-type facts. The brand record's
 * "growing to 14" refers to three new river-facing machaan rooms still under
 * construction, with no published size/bed/view for them yet — needs client
 * confirmation before those are added as their own entries (docs/copy-provenance.md,
 * docs/superpowers/specs/2026-08-08-property-pages-design.md §8).
 *
 * **Tiger density is stated comparatively, not as the live site's specific
 * count.** The live site says "115 tigers" and "highest Sighting Rating Index
 * in the country" — the home page's own copy already softened this same claim
 * for the same reason (a number that will date); this page follows that
 * precedent rather than reintroducing the harder claim in new copy.
 */
export const TOLA_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Tadoba, raw and close to the gate",
    sub: "Mahua Tola — five kilometres from Kolara Gate, on the Hattinala river.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  chapterIntroCopy: {
    "tola-place": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      body: [
        "Mahua Tola sits at the edge of the Tadoba-Andhari Tiger Reserve, close enough to Kolara " +
          "Gate to be among the first vehicles through it. Tadoba carries one of the highest tiger " +
          "densities anywhere in the country, and the drives here are guided by trackers who know " +
          "this forest's cats by name.",
        "The Hattinala river runs along the property — flowing water, birdsong, and a walk with " +
          "nothing scheduled on it.",
      ],
    } satisfies ChapterIntroCopy,
  },

  fullBleedQuoteCopy: {
    "tola-guest-word": {
      quote: "One of the best forests for seeing tigers, and one of the best resorts to stay in Tadoba.",
    } satisfies FullBleedQuoteCopy,
  },

  plateGridCopy: {
    "tola-dining": {
      heading: { text: "What the kitchen keeps", dim: "keeps" },
      intro:
        "Maharashtrian specialties beside global favourites, cooked from what is fresh and local — " +
        "a meal to the sound of the jungle, or a candlelit dinner by the river.",
      plates: [
        {
          mediaId: "tola-dining",
          plate: "I",
          caption: "Dining at Mahua Tola, to the sound of the forest.",
        },
      ],
    } satisfies PlateGridCopy,
    "tola-experiences": {
      heading: { text: "The day at Tola", dim: "day" },
      intro:
        "Tiger safaris at dawn and dusk, an afternoon along the Hattinala, and a pool to come back " +
          "to once the light goes.",
      plates: [
        {
          mediaId: "tola-swimming",
          plate: "I",
          caption: "The pool at Mahua Tola, between drives.",
        },
        {
          mediaId: "tola-evening",
          plate: "II",
          caption: "An evening gathering after the day's safari.",
        },
      ],
    } satisfies PlateGridCopy,
  },

  roomsIndexCopy: {
    "tola-rooms": {
      heading: { text: "Twelve rooms, five shapes", dim: "shapes" },
      intro:
        "Deluxe rooms, suites, super deluxe cottages, a family suite and a camping hut, all with a " +
        "forest view.",
      rooms: [
        {
          mediaId: "tola-room-deluxe",
          name: "Deluxe",
          size: "220 sq. ft.",
          bed: "Twin beds",
          view: "Forest view",
        },
        {
          mediaId: "tola-room-suite",
          name: "Suite",
          size: "270 sq. ft.",
          bed: "Queen bed",
          view: "Forest view",
        },
        {
          mediaId: "tola-room-suite",
          name: "Super Deluxe Cottage",
          size: "300 sq. ft.",
          bed: "King bed",
          view: "Forest view",
          note: "Shown: Suite.",
        },
        {
          mediaId: "tola-room-suite",
          name: "Family Suite",
          size: "450 sq. ft., two interconnected rooms",
          bed: "Queen and king bed",
          view: "Forest view",
          note: "Shown: Suite.",
        },
        {
          mediaId: "tola-room-camping",
          name: "Camping Hut",
          size: "500 sq. ft.",
          bed: "Four cemented single beds",
          view: "Forest view",
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "tola-field-notes": {
      heading: { text: "Getting to Mahua Tola", dim: "Tola" },
      gettingThere: [
        { label: "By road", value: "Chimur, 17 km" },
        { label: "From the gate", value: "Five kilometres from Kolara Gate" },
      ],
      address: "Village – Adegaon Tehsil – Chimur TATR, Maharashtra 442904",
      bookLabel: "Book Mahua Tola",
      enquireLabel: "Enquire",
      siblingLabel: "Looking for Pench instead? Mahua Vann →",
    } satisfies FieldNotesCopy,
  },
};

export const TOLA_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
```

- [ ] **Step 3: Write the tests**

Same shape as `content/mahua-vann.test.ts` (Task 7 Step 3), importing `TOLA_CHAPTERS` in place of `VANN_CHAPTERS` and updating the "opens/closes" assertion's ids (`tola-hero`, `tola-field-notes`). Additionally guard the guest quote against drifting from its source — `FullBleedQuoteCopy` here is just `{ quote: string }`, with no name/source/year fields to check the way `content/home.test.ts`'s "attributes every guest quote" test does for `GuestQuote`, so the guard this test file can actually make is that the reused text stays byte-identical to the attributed original in `content/home.ts`, rather than silently diverging from the review it was verified under:

```ts
import { HOME } from "@/content/home";
import { TOLA_COPY } from "./mahua-tola";

// ...

  it("reuses its guest quote byte-identical to the attributed original in content/home.ts", () => {
    // FullBleedQuoteCopy carries only `quote` — there is nowhere on a
    // full-bleed photograph to set a name, source and year in the display
    // serif the home page uses for pull-quotes. So this page's attribution
    // lives one level up: "tola-guest-word" is Vedant, 2019, Tripadvisor —
    // content/home.ts's own guests.quotes[1], which content/home.test.ts's
    // "attributes every guest quote" test already holds to a name, a source
    // and a year. This test is what keeps the two copies from silently
    // diverging — an edit to one without the other would otherwise ship
    // unattributed words with nothing to catch it.
    const original = HOME.chapters.guests.quotes.find((q) => q.name === "Vedant");
    expect(original, "content/home.ts no longer carries Vedant's quote").toBeDefined();
    expect(TOLA_COPY.fullBleedQuoteCopy?.["tola-guest-word"]?.quote).toBe(original?.quote);
  });
```

- [ ] **Step 4: Run tests, type-check, lint**

Run: `npx vitest run content/mahua-tola.test.ts && npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add content/mahua-tola.ts content/mahua-tola.test.ts
git commit -m "feat: Mahua Tola's content dial — spine, copy, tests

Room count uses the live site's own structured twelve, not the brand
record's unconfirmed fourteen — flagged for client confirmation, not
guessed. Guest quote reused verbatim from content/home.ts, the one
Tripadvisor review that names Tadoba directly."
```

---

### Task 10: `app/mahua-tola/page.tsx` and browser verification

**Files:**
- Create: `app/mahua-tola/page.tsx`

- [ ] **Step 1: Write the route**

```tsx
import type { Metadata } from "next";
import { PropertyPage } from "@/components/property/PropertyPage";
import { TOLA_CHAPTERS, TOLA_COPY, TOLA_NAV } from "@/content/mahua-tola";

export const metadata: Metadata = {
  title: "Mahua Tola, Tadoba — Mahua Resorts",
  description:
    "Mahua Tola: five kilometres from Kolara Gate at Tadoba-Andhari Tiger Reserve. Rooms, dining, safaris and how to reach us.",
};

export default function MahuaTolaPage() {
  return (
    <PropertyPage
      chapters={TOLA_CHAPTERS}
      copy={TOLA_COPY}
      scrim={{ "tola-guest-word": { flat: 0.36, centre: 0.42 } }}
      bookHref="https://asiatech.in/booking_engine/index3?token=ODM1MA=="
      bookLabel={TOLA_COPY.fieldNotesCopy!["tola-field-notes"].bookLabel}
      enquireHref="mailto:sales@mahuaresorts.com?subject=Enquiry%20—%20Mahua%20Tola"
      siblingHref="/mahua-vann"
      nav={TOLA_NAV}
    />
  );
}
```

The `scrim` value for `tola-guest-word` is a starting point, not a final figure — Step 3 below measures the actual worst-pixel contrast under the rendered type and this must be raised if it falls short, exactly as `docs/reviews/2026-08-04-task-7/` did for the home page's two pull-quotes. Do not guess past that measurement.

- [ ] **Step 2: Run the dev server and look at the real page**

Run: `npm run dev`, open `http://localhost:3000/mahua-tola` at 390, 768, 1440, 1920px. Confirm the full-bleed guest quote renders legibly over its photograph, the rooms grid shows five entries with the two shared-photo notes visible, and the Vann sibling link at the foot works.

- [ ] **Step 3: Verification rigs, including the contrast check this page specifically needs**

```bash
npm test && npm run build && npm run lint
npx next start -p 3100 &
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-08-property-pages/tola-density.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-08-property-pages/tola-page.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-08-property-pages/tola-rule-in.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-08-property-pages/tola-contrast.json
```

Expected: `check_contrast_over_photos.mjs` reports the guest quote at ≥4.5:1 worst-pixel. If it does not, raise `scrim.flat`/`scrim.centre` in `app/mahua-tola/page.tsx` and re-run — this is exactly the loop `docs/reviews/2026-08-04-task-7/` already went through for `why-you-came` and `after-dark`.

- [ ] **Step 4: Commit**

```bash
git add app/mahua-tola/ docs/reviews/2026-08-08-property-pages/
git commit -m "feat: ship /mahua-tola

Seven chapters — hero, the place, a guest's word, dining,
experiences, the rooms index, field notes. Scrim on the guest quote
measured against the rendered page, not assumed."
```

---

### Task 11: Point the home page at the new routes

**Files:**
- Modify: `content/home.ts`
- Modify: `content/home.test.ts` (add one assertion)

**Why this is last:** both routes must exist before their links can be internal — doing this earlier would leave one property linking internally and the other still pointing at the live WordPress site, an inconsistent intermediate state.

- [ ] **Step 1: Update the two lodge links**

In `content/home.ts`, change:

```ts
          cta: "Discover Mahua Vann",
          href: "https://mahuaresorts.com/resorts/mahua-vann/",
```

to:

```ts
          cta: "Discover Mahua Vann",
          href: "/mahua-vann",
```

and:

```ts
          cta: "Discover Mahua Tola",
          href: "https://mahuaresorts.com/resorts/mahua-tola/",
```

to:

```ts
          cta: "Discover Mahua Tola",
          href: "/mahua-tola",
```

- [ ] **Step 2: Drop the external-link attributes in `LodgeCards`**

In `components/sections/LodgeCards.tsx`, find:

```tsx
                    <a
                      href={lodge.href}
                      target="_blank"
                      rel="noreferrer noopener"
```

and remove the `target`/`rel` attributes, leaving:

```tsx
                    <a
                      href={lodge.href}
```

Also update the comment two lines below it that says "either to the closing chapter or out to the property's own site" (in `PillButton.tsx`'s doc comment, unrelated — leave that one, it still describes `Invitation`'s external link correctly) — only the comment directly above the edited `<a>` in `LodgeCards.tsx`, if any, needs adjusting to reflect that this link is now internal.

- [ ] **Step 3: Add a test asserting the links are internal**

In `content/home.test.ts`, add:

```ts
  it("links to the two property pages internally, not out to the live WordPress site", () => {
    for (const lodge of HOME.chapters.lodges.lodges) {
      expect(lodge.href.startsWith("/"), `${lodge.name} links externally: ${lodge.href}`).toBe(true);
    }
  });
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/`, scroll to "The Lodges", click "Discover Mahua Vann". Expected: navigates to `/mahua-vann` in the same tab (no new tab, since `target="_blank"` is gone). Same for Tola.

- [ ] **Step 5: Run full suite**

Run: `npm test && npm run build && npm run lint`
Expected: all green, including the new test from Step 3.

- [ ] **Step 6: Commit**

```bash
git add content/home.ts content/home.test.ts components/sections/LodgeCards.tsx
git commit -m "feat: point the home page's lodge cards at the new property pages

Both /mahua-vann and /mahua-tola now exist, so these links become
internal — the external-link chrome (target=_blank, rel) comes off."
```

---

### Task 12: Whole-branch verification

**Files:** none created — this task runs the project's standard final gate and captures evidence.

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: every suite green, including all new ones from Tasks 7, 9 and 11.

- [ ] **Step 2: Build, lint, budget**

Run: `npm run build && npm run lint && npm run verify:budget`
Expected: all pass. `verify:budget` in particular confirms the new routes have not dragged anything unexpected into the first-load JS budget — property pages import none of the home page's signature-interaction components (`SignatureFilm`, `HangingLantern`, `PinnedCollage`), so first-load JS for `/mahua-vann` and `/mahua-tola` should be at or below the home page's own figure.

- [ ] **Step 3: Measure transfer weight on both new routes**

```bash
npx next start -p 3100 &
node scripts/measure_js_budget.mjs --port 3100 --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-08-property-pages/vann-js-budget.json
node scripts/measure_js_budget.mjs --port 3100 --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-08-property-pages/tola-js-budget.json
```

Expected: both under the same first-load budget the home page holds to. Record the actual figures in the evidence README (Step 5).

- [ ] **Step 4: Screenshot both pages at four widths**

Using Playwright directly or the dev server plus a manual screenshot pass, capture `/mahua-vann` and `/mahua-tola` at 390, 768, 1440 and 1920px into `docs/reviews/2026-08-08-property-pages/`. Look at every one of them — do not claim the pages are done from the automated rigs alone (CLAUDE.md's own standing rule: "Automated tests cannot judge whether a page feels expensive").

- [ ] **Step 5: Write the evidence README**

Create `docs/reviews/2026-08-08-property-pages/README.md` summarising: the density figures for both pages (mean/worst screen), the JS budget figures, the one open item carried forward (Tola's room count needing client confirmation — twelve, sourced from the live site's own structured room list, vs. the brand record's unconfirmed fourteen), and links to every JSON artefact and screenshot produced in this task.

- [ ] **Step 6: Update the project's durable docs**

Add a short entry to `docs/PROJECT-STATE.md`'s status area noting both property pages are live, and add a line to `docs/DECISIONS.md` §1's ruling table for "8 Aug — property pages shipped as `/mahua-vann` and `/mahua-tola`, Vann's photography fetched directly from the live site (crawler missed `data-image`-loaded assets), Tola's room count follows the live site's confirmed twelve pending the client's word on fourteen."

- [ ] **Step 7: Final commit**

```bash
git add docs/reviews/2026-08-08-property-pages/ docs/PROJECT-STATE.md docs/DECISIONS.md
git commit -m "docs: close out the property pages with evidence and a state update

Both /mahua-vann and /mahua-tola verified — density, JS budget,
contrast, rule-in — against real routes, not assumed from the home
page's existing rigs. Two items carried forward: Tola's room count
and the enquiry address, both flagged rather than guessed."
```

---

## What this plan deliberately does not do

- **Does not touch `SplitFeature`.** Its six-photograph, three-band structure was designed for the home page's much larger library; the property pages' real, freshly-sourced photo count (7-11 per property) does not support it, and `PlateGrid` (1-4 flexible plates) is the better fit. `SplitFeature` is left completely unmodified.
- **Does not build a hand-drawn map**, a "need to know" accordion, or any packing-list/weather content — none of it is sourced, and the approved spec (D2, D8) explicitly excludes it.
- **Does not wire Tripadvisor live**, restyle booking, or touch the SEO redirect map — all separately out of scope per CLAUDE.md.
- **Does not resolve Tola's room count** — twelve is used, sourced from the live site's own structured room list; the brand record's fourteen (three machaans "under construction") is flagged, not guessed, and is the client's to confirm (spec §6, §8).
