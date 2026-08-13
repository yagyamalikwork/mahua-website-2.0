# Image Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plate boards reflow to fewer, larger plates instead of shrinking; every room card goes
side-by-side with the photo side alternating; a zero-JavaScript click-to-expand gallery with arrows.

**Architecture:** Three independent strands from
[`docs/superpowers/specs/2026-08-13-image-sizing-design.md`](../specs/2026-08-13-image-sizing-design.md)
(read it first — it carries the client's three rulings verbatim). Strand 1 is one breakpoint move in
`PlateGrid` plus a continuous-sweep rig. Strand 2 crops four photographs in the pipeline, retires the
aspect-derived card layout, and solves the crop bound per card. Strand 3 is native HTML popovers —
server-rendered markup, no `"use client"`, no listener.

**Tech Stack:** Next 16 / React 19 (which supports `popover`, `popoverTarget`,
`popoverTargetAction` as props), Tailwind 4 (`@custom-variant`), sharp, vitest + Testing Library,
Playwright rigs in `scripts/`.

## Global Constraints

Every task implicitly includes all of these. Copy them into your head before starting any task.

- **Branch `feat/image-sizing` only.** Never commit to `feat/chapters-rebuild` (another session owns
  it). **Never modify `components/ui/Plate.tsx` or `components/ui/Photo.tsx`** — that session is
  editing both.
- `npm test -- --run`, `npx tsc --noEmit`, `npm run lint` green before any commit claiming a task
  complete. `npm run build` must pass before any commit that touches components or CSS.
- No hard-coded colour, duration or user-facing copy in components: colours `lib/palette.ts`,
  numbers with motion meaning `lib/motion.ts`, words `content/`. British spelling in copy.
- JS budget: first-load is 172,209 bytes brotli against a 175 KB ceiling. Target for this whole
  plan: **delta 0** (`npm run verify:budget`).
- Density: `vann-rooms` may not exceed 31.5% mean / 42.1% worst; `tola-rooms` may not exceed
  33.8% / 44.3%; every chapter on all three routes stays inside 45% (non-negotiable #8).
- `scripts/check_card_stack.mjs` must pass all 8 assertions on both routes at every shape plus the
  `--no-recede` arm. **Never weaken an assertion to make the page pass.**
- Browser rigs run against a **production build** (`npm run build && npx next start -p 3100`), never
  the dev server. Every new assertion is **watched failing against a deliberately broken build**
  before it is trusted to pass.
- `short:`/`tall:` compact type and padding only; `pocket:`/`roomy:` are the geometry pair
  (CLAUDE.md; `DECISIONS.md` §2 #44–45). Never size a photograph with `short:`.
- Read `docs/DECISIONS.md` §17 before touching `RoomCard`, `RoomCardStack`, `ROOM_STACK`,
  `.room-slot` or `.room-stack`. The load-bearing facts you must not break: cards and slots are
  **sibling** direct children of `ol.room-stack` (the rig selects `ol.room-stack > li.room-card`
  directly); the slot's height/negative-margin pair must stay equal-and-opposite; the card's
  `:first-child` must remain the photo wrapper and `children[1]` the words block (assertion 8 reads
  `card.children[1]`); `data-room-card-last` stays a prop-driven attribute, not `:last-child`.

---

### Task 1: PlateGrid reflow — the 3-column tier moves to `xl`

**Files:**
- Modify: `components/sections/PlateGrid.tsx` (the `columnClass` ternary ~line 169; `PLATE_SIZES[3]`
  ~line 36; the plates grid `<div>` ~line 214)
- Create: `components/sections/PlateGrid.test.tsx`

**Interfaces:**
- Consumes: `CHAPTERS` from `content/chapters` (find the chapter with `id === "forest"`), existing
  `PlateGrid` props.
- Produces: a `data-plate-grid={chapter.id}` attribute on the plates grid container — **Task 2's rig
  selects `[data-plate-grid]`**. `PLATE_SIZES[3]` becomes
  `"(min-width: 1600px) 480px, (min-width: 1280px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)"`.

- [ ] **Step 1: Write the failing test**

```tsx
// components/sections/PlateGrid.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHAPTERS } from "@/content/chapters";
import { PLATE_SIZES, PlateGrid } from "./PlateGrid";

// The forest chapter: three portrait plates, the one board whose three-column
// tier is under test. Chosen from the real content so the test cannot drift
// from what the page actually renders. (If the spine's list export is not
// named CHAPTERS, read content/chapters.ts and use its actual export — do not
// build a synthetic chapter.)
const forest = CHAPTERS.find((c) => c.id === "forest");
if (!forest) throw new Error("content/chapters no longer carries a forest chapter");

describe("PlateGrid column reflow (spec 2026-08-13-image-sizing §1)", () => {
  it("holds a three-column board to two columns until xl, so plates keep their size", () => {
    const { container } = render(<PlateGrid chapter={forest} />);
    const grid = container.querySelector("[data-plate-grid]");
    expect(grid).not.toBeNull();
    // 3-across begins at 1280 (xl), not 1024 (lg): at 1024 a Forest plate is
    // 283px three-up against 421px at 1440 — 67% of its size, the client's
    // "images just get smaller". Two-up at 1024 is 444px.
    expect(grid!.className).toContain("xl:grid-cols-3");
    expect(grid!.className).not.toContain("lg:grid-cols-3");
  });

  it("serves the widened 1024-1279 band from the 50vw tier, not 34vw", () => {
    // A 2-column plate at 1024-1279 is ~0.5vw - 68px; a `(min-width: 1024px) 34vw`
    // tier would under-state it by ~30% and re-create §2 #6.
    expect(PLATE_SIZES[3]).toBe(
      "(min-width: 1600px) 480px, (min-width: 1280px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
    );
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `npx vitest run components/sections/PlateGrid.test.tsx`
Expected: FAIL — `data-plate-grid` matches nothing (attribute doesn't exist yet), and the sizes
string still says `(min-width: 1024px) 34vw`.

- [ ] **Step 3: Make the three edits in `PlateGrid.tsx`**

(a) `columnClass`, the `columns === 3` branch only:

```tsx
        : columns === 3
          ? "sm:grid-cols-2 xl:grid-cols-3"
```

(b) `PLATE_SIZES[3]`:

```tsx
  3: "(min-width: 1600px) 480px, (min-width: 1280px) 34vw, (min-width: 640px) 50vw, calc(100vw - 48px)",
```

Update the comment above `PLATE_SIZES` to note the 13 Aug 2026 change: the 3-up tier begins at `xl`
now (spec `2026-08-13-image-sizing-design.md` §1 — a plate may not render below 85% of its
1440-reference width unless the board is at its minimum column count), so the `34vw` tier moves with
it and the 1024–1279 band is honestly a 2-column band served by `50vw`.

(c) The plates grid `<div>` (the one whose className starts `mt-10 grid grid-cols-1 gap-y-12`)
gains a data hook for Task 2's rig — an attribute, not a structural selector (§2 #10/#33):

```tsx
        <div
          data-plate-grid={chapter.id}
          className={`mt-10 grid grid-cols-1 gap-y-12 md:mt-12 ${COLUMN_GAP[columns] ?? COLUMN_GAP[2]} ${columnClass}`}
        >
```

Do NOT touch the `columns === 4` branch (`xl:grid-cols-4` — the client-accepted *Details* board),
the `columns === 2` branch (the *Rooms* board is at its minimum count; its 68%-of-reference worst
case at 1024 is recorded as accepted in the spec), or `plateFrame`/`PLATE_FRAME`.

- [ ] **Step 4: Run the test again — PASS. Then the whole suite, tsc, lint, build**

Run: `npm test -- --run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green. (`lib/sizes.test.ts` counts *distinct* sizes strings — `PLATE_SIZES[3]`
changed in place, so the count stays 24 and nothing there should fire. If it does, read its
comment before touching the number.)

- [ ] **Step 5: Commit**

```bash
git add components/sections/PlateGrid.tsx components/sections/PlateGrid.test.tsx
git commit -m "feat: a three-up board holds two columns until 1280, so plates keep their size"
```

---

### Task 2: `check_plates.mjs` — the continuous-sweep rig, watched failing first

**Files:**
- Create: `scripts/check_plates.mjs`
- Create: `docs/reviews/2026-08-13-image-sizing/` (the rig writes `plates.json` there)

**Interfaces:**
- Consumes: `[data-plate-grid]` from Task 1; production server on `--port` (default 3100).
- Produces: exit code 0/1; `docs/reviews/2026-08-13-image-sizing/plates.json`.

- [ ] **Step 1: Write the rig**

Model the boilerplate (arg parsing, `chromium` launch, `note()` failure collection, JSON output,
exit code) on `scripts/check_card_stack.mjs` — same house style, same flags (`--port`, `--url`,
`--out`). The rig's own logic:

```js
// The plate boards, swept CONTINUOUSLY — not at four fixed shapes. The last
// three defects on this project all lived between fixed sample points
// (docs/DECISIONS.md §2 #45), and this board's own history is the proof: the
// 230% squeeze fired at 1366x768 and no rig sampled any short-and-normal-width
// viewport at all.
//
// Three assertions, per plate, per sample (spec 2026-08-13-image-sizing §1):
//   1. Distortion = 0. If the img's computed object-fit is "cover" the crop is
//      the deliberate plateFrame ("framed" — plate-squeeze README) and passes;
//      otherwise the rendered box's aspect must equal the img's natural aspect
//      within 2%.
//   2. The floor. At samples >=1024 wide that compute to roomy:, each plate's
//      rendered width must be >= 0.85 x that same plate's width at 1440x900 —
//      measured live at the start of the run, never hard-coded. ONE exemption,
//      from the spec: a board rendering 2 columns at BOTH 1440 and the sample
//      (i.e. a board already at its minimum count — the home Rooms board) uses
//      floor 0.65; its measured worst is 444/652 = 0.68 at 1024.
//   3. The pocket cap. Samples computing to pocket: (height <= 800 AND
//      width/height >= 2 — a sweep at height 768 legitimately crosses 2:1 past
//      1536px wide) instead assert every plate's height <= 24% of the viewport
//      + 2px, and its natural aspect intact.
//
// Sweep: widths 900..1920 step 16, at heights 900 and 768; plus the named
// shapes from docs/reviews/2026-08-12-plate-squeeze/README.md:
//   1920x1080, 1512x945, 1440x900, 1440x801, 1440x800, 1366x768, 1280x720,
//   1024x768, 1180x820, 1152x720, 960x600, 844x390, 932x430.
// Routes: /, /mahua-vann, /mahua-tola — every [data-plate-grid] on each.
```

Implementation notes the engineer needs:

- Use one page per route with `reducedMotion: "reduce"` in the context (entrances off — rects are
  stable; this is the sanctioned use, see CLAUDE.md "Verification").
- On first load, scroll the full page once so every lazy plate `<img>` loads, then wait for
  `document.querySelectorAll("[data-plate-grid] img")` to all have `naturalWidth > 0`.
- Resize with `page.setViewportSize({ width, height })` per sample — no reload needed; re-measure
  after `requestAnimationFrame` settles (two rAFs via `page.evaluate`).
- Per sample, collect per board (`[data-plate-grid]`, keyed by its attribute value) and per img:
  `getBoundingClientRect()` width/height, `naturalWidth/naturalHeight`, computed `object-fit`.
  Column count per board = number of distinct rounded `rect.left` values among its plates.
- Reference pass first: 1440×900, record each board's per-plate widths and column count into a map
  keyed `route → boardId → imgIndex`.
- Mode: `pocket = height <= 800 && width / height >= 2`, else roomy. (Matches
  `app/globals.css`'s `@custom-variant` definitions — and the rig must compute it from the numbers,
  not read the CSS back.)
- Write the JSON artefact: per-route worst distortion, worst floor ratio per board, sample count,
  failures.

- [ ] **Step 2: Build, start the server, watch the rig PASS on the fixed build**

```bash
npm run build && npx next start -p 3100 &
node scripts/check_plates.mjs --port 3100
```
Expected: exit 0. Forest board floor ratio ≥0.85 everywhere ≥1024 roomy; Rooms board ≥0.65.

- [ ] **Step 3: Watch it FAIL against the broken state (both arms)**

(a) Revert Task 1's breakpoint in the working tree only — in `PlateGrid.tsx` change
`"sm:grid-cols-2 xl:grid-cols-3"` back to `"sm:grid-cols-2 lg:grid-cols-3"` — rebuild, rerun.
Expected: floor failures naming the forest board between 1024 and 1279 (283–368px against a
~358px floor). If the rig stays green here, **the rig is wrong — stop and fix it.**

(b) Restore the fix. Then break the distortion check's target once: in `components/ui/Plate.tsx`…
**no — that file is off-limits.** Instead add a temporary `style={{ width: "100%", height: "200px" }}`
to the plate cell `<div>` in `PlateGrid.tsx` (the one carrying `--stagger`), rebuild, and confirm
the distortion assertion fires on every unframed plate. Remove the sabotage, rebuild, confirm green.

- [ ] **Step 4: Save evidence and commit**

Keep the passing `plates.json` in `docs/reviews/2026-08-13-image-sizing/`, and note both watched
failures (with one line of their output) in the JSON's own `watchedFailing` field or a sibling
`plates-notes.md`.

```bash
git add scripts/check_plates.mjs docs/reviews/2026-08-13-image-sizing/
git commit -m "feat: a rig that sweeps the plate boards continuously, watched failing both ways"
```

---

### Task 3: Crop the room photographs in the pipeline

**Files:**
- Modify: `scripts/build_images.mjs` (`buildOne` ~line 802; the five CURATION entries; the
  perceptual-hash guard runs automatically)
- Modify: `lib/media-manifest.ts` (regenerated — **never hand-edit**)
- Modify: `lib/room-card.test.ts` (only if its layout-branch fixtures reference the cropped ids —
  see Step 6)
- Modify: `content/mahua-tola.ts` (the super-deluxe `line`'s comment, and the line itself if it no
  longer matches the fuller frame)
- Create: `docs/reviews/2026-08-13-image-sizing/crops/` (before/after strips)

**Interfaces:**
- Consumes: source files under `reference/` (measured 13 Aug: `Pench_Deluxe` 1163×508,
  `Tadoba_Deluxe-room` 1163×508, `Tadoba_Suite-room` 1163×508, `Mahua-Website-Images_TC` 1931×789,
  `Super-Delux-Cottage.jpg` 1500×1000 — the uncropped original kept on disk for exactly this day).
- Produces: manifest entries whose `width/height` give aspects ≤1.51 for every landscape room photo.
  **Task 4's `roomCardAspect` reads these; its population guard asserts ≤1.6.**

- [ ] **Step 1: Add crop support to `buildOne`**

A per-entry `crop` window in **source pixels**, applied before anything else, so every derivative
(tiers, JPG fallback, blur placeholder) and the manifest's dimensions all come from the same pixels:

```js
async function buildOne(entry) {
  const srcPath = path.join(ROOT, entry.src);
  const srcBuffer = await readFile(srcPath);
  const srcMeta = await sharp(srcBuffer).metadata();
  if (!srcMeta.width || !srcMeta.height) {
    throw new Error(`${entry.id}: could not read dimensions of ${entry.src}`);
  }

  // An editorial crop, in SOURCE pixels, applied before every derivative —
  // tiers, JPG fallback and blur all come from the same window, and the
  // manifest's width/height are the window's, so everything downstream that
  // reads an aspect (RoomCard's solved crop bound, the orientation field,
  // `sizes` math) sees the crop as the photograph. Client ruling 13 Aug 2026:
  // "You can crop and zoom into them to fit their half" — the spec's §2 table
  // says which entries and why.
  let baseBuffer = srcBuffer;
  let baseMeta = srcMeta;
  if (entry.crop) {
    const { left, top, width, height } = entry.crop;
    if (left + width > srcMeta.width || top + height > srcMeta.height || left < 0 || top < 0) {
      throw new Error(
        `${entry.id}: crop ${JSON.stringify(entry.crop)} exceeds the ${srcMeta.width}x${srcMeta.height} source`,
      );
    }
    baseBuffer = await sharp(srcBuffer).extract(entry.crop).toBuffer();
    baseMeta = { ...srcMeta, width, height };
  }
  ...
```

Then, in the remainder of `buildOne`, replace every later `srcBuffer` with `baseBuffer` and every
later `srcMeta.width`/`srcMeta.height` with `baseMeta.width`/`baseMeta.height` (the tier ceiling,
the JPG fallback, the blur pipeline, and the manifest write). Check with
`grep -n "srcBuffer\|srcMeta" scripts/build_images.mjs` that the only remaining uses are the three
lines above.

- [ ] **Step 2: The five entries**

Centred windows first — art direction comes in Step 4 by eye.

- `vann-room-deluxe`: add `crop: { left: 200, top: 0, width: 762, height: 508 },`
- `tola-room-deluxe`: add `crop: { left: 200, top: 0, width: 762, height: 508 },`
- `tola-room-suite`: add `crop: { left: 200, top: 0, width: 762, height: 508 },`
- `vann-room-cottage-plain`: add `crop: { left: 373, top: 0, width: 1184, height: 789 },`
- `tola-room-super-deluxe`: change `src` to `"reference/client-photos/Super-Delux-Cottage.jpg"`,
  no crop. **Append to (do not delete) its long comment**: the beside composition arrived 13 Aug
  2026 and the uncropped 1500×1000 original — kept beside the 2.29 file for exactly this day, per
  the comment's own last paragraph — is now what ships; the 2.29 threshold reasoning above is
  history (the derivation it fed retires in `lib/room-card.ts` the same day).

Each of the four cropped entries gets a one-line comment: `// 3:2 window per the 13 Aug 2026 ruling
("crop and zoom to fit their half"); offset chosen by eye — see docs/reviews/2026-08-13-image-sizing/crops/.`

- [ ] **Step 3: Run the pipeline**

Run: `node scripts/build_images.mjs`
Expected: completes; the perceptual-hash distinctness guard stays green (three crops share a window
geometry but come from different photographs); `lib/media-manifest.ts` regenerates with
`vann-room-deluxe`/`tola-room-deluxe`/`tola-room-suite` at 762×508, `vann-room-cottage-plain` at
1184×789, `tola-room-super-deluxe` at 1500×1000.

- [ ] **Step 4: LOOK at every result, then art-direct**

Open each emitted JPG under `public/media/` (the Read tool renders images). For each of the five:
does the window keep the bed and the room's one distinctive feature (the Gond painting, the window
onto bamboo, the cane sit-out)? No recognisable face may appear (two photographs have already been
rejected on those grounds — CLAUDE.md). Adjust `left`/`top` per photo and re-run the pipeline until
each frame is right. Then build the before/after strips:

```bash
node -e "
const sharp = require('sharp');
const jobs = [
  ['vann-room-deluxe', 'reference/wp-media/property-pages/Mahua-Website-Images_Pench_Deluxe.jpg'],
  ['vann-room-cottage-plain', 'reference/wp-media/property-pages/Mahua-Website-Images_TC.jpg'],
  ['tola-room-deluxe', 'reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Deluxe-room.jpg'],
  ['tola-room-suite', 'reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Suite-room.jpg'],
  ['tola-room-super-deluxe', 'reference/client-photos/Super-Delux-Cottage.jpg'],
];
(async () => {
  for (const [id, src] of jobs) {
    const before = await sharp(src).resize({ height: 400 }).toBuffer();
    const after = await sharp(\`public/media/\${id}-fallback.jpg\`).resize({ height: 400 }).toBuffer();
    // If the fallback's filename differs, list public/media for the id's actual files first.
    const bw = (await sharp(before).metadata()).width, aw = (await sharp(after).metadata()).width;
    await sharp({ create: { width: bw + aw + 24, height: 400, channels: 3, background: '#F1E9D7' } })
      .composite([{ input: before, left: 0, top: 0 }, { input: after, left: bw + 24, top: 0 }])
      .jpeg({ quality: 82 })
      .toFile(\`docs/reviews/2026-08-13-image-sizing/crops/\${id}-before-after.jpg\`);
  }
})();
"
```

(Adjust the fallback filename pattern to whatever `public/media/` actually contains for each id —
list the directory first.)

- [ ] **Step 5: The super-deluxe copy line**

Open the new `tola-room-super-deluxe` image and re-read its `line` and `alt` in
`content/mahua-tola.ts` / `scripts/build_images.mjs` against the fuller 3:2 frame. The comment on
the `line` says it describes the shipped 2.29 crop; if the taller frame now shows something the
line ignores (or vice versa), adjust the words — British spelling, the brand's specificity rule —
and update the comment either way to date the re-read.

- [ ] **Step 6: Suite green at this commit**

Run: `npm test -- --run`
`lib/room-card.test.ts` still tests the (not-yet-retired) `roomCardLayout`: its threshold maths
survives this task — 1.5 clears `1.9` by 0.4 (> the 0.35 clearance its own test demands) — **but**
if its "wide photograph → stacked" fixtures name any of the five cropped ids, repoint those
fixtures at any manifest id still ≥1.9 (e.g. a 2:1+ landscape from the home page — check with
`node -e` against the manifest). The derivation itself retires in Task 4; this step only keeps the
intermediate commit green. Then `npx tsc --noEmit && npm run lint && npm run build`.

- [ ] **Step 7: Commit**

```bash
git add scripts/build_images.mjs lib/media-manifest.ts public/media content/mahua-tola.ts lib/room-card.test.ts docs/reviews/2026-08-13-image-sizing/crops
git commit -m "feat: the wide room photographs cropped to the card's own shape, in the pipeline"
```

---

### Task 4: RoomCard — all beside, alternating, with the crop bound solved per card

**Files:**
- Modify: `components/sections/RoomCard.tsx` (rewrite the layout machinery; keep the words block)
- Modify: `lib/room-card.ts` (retire `roomCardLayout`/`ROOM_CARD_ASPECT_THRESHOLD`; keep
  `roomCardAspect`)
- Modify: `lib/room-card.test.ts` (population guard replaces the threshold guard)
- Modify: `components/sections/RoomCard.test.tsx` (alternation replaces the two-composition tests)
- Modify: `app/globals.css` (delete the stacked ceiling; two disjoint `cqw` blocks for the cap)
- Modify: `lib/motion.ts` (delete `ROOM_STACK.textReserve`)
- Modify: `app/layout.tsx` (delete the `--room-text-reserve` line)
- Modify: `lib/sizes.test.ts` (one `RoomCard.beside` row; distinct-count 24 → 23)

**Interfaces:**
- Consumes: `roomCardAspect(mediaId): number` (kept, unchanged signature); manifest aspects from
  Task 3 (landscape rooms ≤1.51, `tola-room-family` 0.67).
- Produces, for later tasks:
  - `RoomCard` props gain **`galleryId?: string`** — optional; when absent (this task) the photo is
    not a button. Task 6 wires it.
  - `export const ROOM_CARD_SIZES = "(min-width: 1600px) 978px, (min-width: 1280px) 65vw, (min-width: 1024px) 60vw, calc(100vw - 48px)"`
    (a single string now, not a record).
  - `export const ROOM_CARD_MIN_BOX = 1.25` and `export const ROOM_PHOTO_KEEP = 0.75`.
  - Every card renders `data-card-layout="beside"` (the rig and the CSS cap target it), photo
    wrapper stays the card's `:first-child`, words stay `children[1]`, odd cards carry
    `lg:flex-row-reverse`.

- [ ] **Step 1: Failing unit tests first**

Rewrite `components/sections/RoomCard.test.tsx`'s two composition tests (keep the index,
words, note, `data-room-card-last` and paper tests as they are — they still hold):

```tsx
  it("stands every photograph beside the words — the client's 13 Aug composition", () => {
    // vann-room-deluxe was the canonical STACKED card until the 13 Aug ruling.
    const { container } = render(
      <RoomCard room={{ ...ROOM, mediaId: "vann-room-deluxe" }} index={0} onSurface={false} />,
    );
    expect(container.querySelector("[data-card-layout]")?.getAttribute("data-card-layout")).toBe("beside");
  });

  it("alternates the photo's side: even cards left, odd cards right", () => {
    const even = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    const odd = render(<RoomCard room={ROOM} index={1} onSurface={false} />);
    expect(even.container.querySelector(".room-card")?.className).not.toContain("lg:flex-row-reverse");
    expect(odd.container.querySelector(".room-card")?.className).toContain("lg:flex-row-reverse");
  });

  it("solves the crop bound from the photograph itself, not from a hand-picked box", () => {
    const { container } = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    const wrapper = container.querySelector(".room-card > :first-child") as HTMLElement;
    const aspect = roomCardAspect(ROOM.mediaId);
    // Below lg the wrapper shows the photo whole (landscape) or the 1.25 floor
    // (portrait); at lg+ the cap reads 0.75 x natural via --room-photo-aspect.
    expect(wrapper.style.aspectRatio).toBe(String(Math.max(aspect, 1.25)));
    expect(wrapper.style.getPropertyValue("--room-photo-aspect")).toBe(String(0.75 * aspect));
  });

  it("renders no gallery trigger when no galleryId is given", () => {
    const { container } = render(<RoomCard room={ROOM} index={0} onSurface={false} />);
    expect(container.querySelector("button")).toBeNull();
  });
```

(`ROOM` is the file's existing fixture; import `roomCardAspect` from `@/lib/room-card`.)

Rewrite `lib/room-card.test.ts` around what survives:

```ts
import { describe, expect, it } from "vitest";
import { roomCardAspect } from "./room-card";
// Keep this file's existing imports that enumerate every room in both content
// files — the retiring test "covers every room in both content files" already
// has the plumbing; reuse it.

describe("roomCardAspect", () => {
  it("reports the photograph's real aspect, not the card's", () => {
    expect(roomCardAspect("tola-room-family")).toBeCloseTo(1707 / 2560, 3);
  });
  it("throws on an unknown id rather than defaulting", () => {
    expect(() => roomCardAspect("no-such-photo" as never)).toThrow(/Unknown media id/);
  });
});

describe("the beside population", () => {
  // The composition is the client's own ruling (13 Aug 2026) and no longer
  // derived from the photograph — but the geometry still assumes no room
  // photograph reads wide. The solved bound keeps the CROP legal at any
  // aspect; what it cannot do is stop a 2.3:1 letterbox floating in a band of
  // cream inside its half (the exact look the ruling replaced). §2 #46 is the
  // history: a like-for-like photo swap silently reshaping a chapter. 1.6 is
  // 1.50 (the widest current room, cottage-plain's 1184/789) plus margin.
  it("keeps every room photograph at or under 1.6:1, in both content files", () => {
    for (const id of EVERY_ROOM_MEDIA_ID) {
      expect(roomCardAspect(id), id).toBeLessThanOrEqual(1.6);
    }
  });
});
```

(`EVERY_ROOM_MEDIA_ID`: lift the collection loop from the retiring "covers every room" test.)

- [ ] **Step 2: Run both files, watch them fail**

Run: `npx vitest run lib/room-card.test.ts components/sections/RoomCard.test.tsx`
Expected: FAIL — `roomCardLayout` still exists and `RoomCard` still branches on it.

- [ ] **Step 3: Implement**

`lib/room-card.ts` — delete `RoomCardLayout`, `ROOM_CARD_ASPECT_THRESHOLD`, `roomCardLayout`.
Keep `roomCardAspect` and rewrite the header comment: composition is the client's 13 Aug 2026
ruling (side-by-side, alternating); this module now only reads the photograph's aspect for the
solved crop bound; the derivation's history lives in `docs/DECISIONS.md` §17/§18.

`components/sections/RoomCard.tsx` — the new shape (words block, slot `<li>`, and every
`ROOM_STACK`-related style stay exactly as they are):

```tsx
import { Photo } from "@/components/ui/Photo";
import { roomCardAspect } from "@/lib/room-card";
import type { RoomEntryCopy } from "./RoomShowcase.types";

/** Exported for `lib/sizes.test.ts`. One string now: every card is `beside`
 * (client ruling, 13 Aug 2026). 60% of the card at lg, 65% at xl — named
 * breakpoints in ascending order, never arbitrary `min-[...]` variants
 * (`docs/DECISIONS.md` §2 #23); 978px is 65% of the 1504px container cap.
 * The share appears in three places that must move together: here, the
 * `lg:w-[60%] xl:w-[65%]` classes below, and the `60cqw`/`65cqw` blocks in
 * `app/globals.css`. */
export const ROOM_CARD_SIZES =
  "(min-width: 1600px) 978px, (min-width: 1280px) 65vw, (min-width: 1024px) 60vw, calc(100vw - 48px)";

/** Below `lg` the card is a column and the wrapper's `aspect-ratio` is its only
 * definite axis: a landscape photograph shows whole (its own aspect), and the
 * one portrait is held to this floor so the words keep their room on a phone —
 * a height crop, unbounded by design (every documented crop constraint on this
 * page is about width). */
export const ROOM_CARD_MIN_BOX = 1.25;

/** The 25% width-crop bound (`check_card_stack.mjs` assertion 6), as the
 * fraction of a photograph's width that must survive. `--room-photo-aspect` is
 * SOLVED per card as `ROOM_PHOTO_KEEP x the photo's own aspect`, so the
 * `max-height` cap in `app/globals.css` holds the bound at every viewport
 * shape by construction — the 1024x1366 class of failure (§2 #42) cannot be
 * re-created by a new photograph or a new screen shape. A hand-picked
 * per-layout number is exactly what §2 #42 shipped. */
export const ROOM_PHOTO_KEEP = 0.75;

export function RoomCard({
  room,
  index,
  onSurface,
  isLast = false,
  galleryId,
}: {
  room: RoomEntryCopy;
  index: number;
  onSurface: boolean;
  isLast?: boolean;
  /** The id of this room's gallery panel (`RoomCardStack` composes it). When
   * given, the photo becomes the panel's declarative popover trigger; when
   * absent the photo is just a photo. No listener either way. */
  galleryId?: string;
}) {
  const aspect = roomCardAspect(room.mediaId);
  const slotTimelineName = `--room-slot-${index}`;

  const photo = (
    <Photo
      id={room.mediaId}
      sizes={ROOM_CARD_SIZES}
      box={Math.max(aspect, ROOM_CARD_MIN_BOX)}
      pictureClassName="block h-full w-full"
      className="h-full w-full object-cover"
    />
  );

  return (
    <>
      <li /* ... the slot <li>, UNCHANGED from today ... */ />
      <li
        className={`room-card flex flex-col overflow-hidden lg:flex-row lg:items-stretch${
          index % 2 === 1 ? " lg:flex-row-reverse" : ""
        }`}
        data-card-layout="beside"
        data-room-card-last={isLast ? "" : undefined}
        style={/* ... UNCHANGED: --i, animationTimeline, backgroundColor ... */}
      >
        <div
          className="min-h-0 flex-none lg:w-[60%] xl:w-[65%]"
          style={
            {
              aspectRatio: String(Math.max(aspect, ROOM_CARD_MIN_BOX)),
              "--room-photo-aspect": String(ROOM_PHOTO_KEEP * aspect),
            } as React.CSSProperties
          }
        >
          {/* Task 6 wraps `photo` in the gallery's popover-trigger button when
              `galleryId` is given (the copy for its aria-label arrives with
              `SITE.roomGallery` in the same task). In THIS task, render the
              photo bare — `galleryId` is never passed yet: */}
          {photo}
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-3 px-6 py-6 md:px-10 lg:flex-1">
          {/* ... the words block, UNCHANGED apart from dropping lg:gap-2 lg:py-4
              (the textReserve pairing it belonged to is gone) ... */}
        </div>
      </li>
    </>
  );
}
```

Carry over, verbatim, the existing comments on `min-h-0` (§2 #41 — still load-bearing), the slot,
and `data-room-card-last`. Delete the `ROOM_CARD_BOXES` export and its comment; rewrite the
`flex-none` comment to describe the new per-card solved values. The `galleryId` prop lands now,
unused, so the interface is fixed; the trigger button and its copy are Task 6's (no user-facing
string may appear in this component, so the button cannot arrive before `SITE.roomGallery` does).

`app/globals.css`:
- Delete the `.room-card[data-card-layout="stacked"] > :first-child` rule and its comment block.
- Replace the single `@media (min-width: 1024px)` beside-cap block with two **disjoint** intervals
  (the project's own §2 #23 discipline), keeping the long mechanism comment and appending the 13
  Aug change note:

```css
@media (min-width: 1024px) and (max-width: 1279.98px) {
  .room-card[data-card-layout="beside"] {
    container-type: inline-size;
  }
  .room-card[data-card-layout="beside"] > :first-child {
    max-height: calc(60cqw / var(--room-photo-aspect, 1.125));
  }
}
@media (min-width: 1280px) {
  .room-card[data-card-layout="beside"] {
    container-type: inline-size;
  }
  .room-card[data-card-layout="beside"] > :first-child {
    max-height: calc(65cqw / var(--room-photo-aspect, 1.125));
  }
}
```

(60/65 mirror `lg:w-[60%] xl:w-[65%]`; `--room-photo-aspect` is now per-card solved — note in the
comment that the fallback 1.125 is `0.75 × 1.5`, the population guard's own worst case.)

`lib/motion.ts`: delete `textReserve` and its comment from `ROOM_STACK` (its mechanism — the
stacked photo ceiling — no longer exists). `app/layout.tsx`: delete the `--room-text-reserve` line.

`lib/sizes.test.ts`: replace the two-row rooms block with:

```ts
  // Every room card is `beside` since the client's 13 Aug 2026 ruling — one
  // composition, one string. The box column carries the widest current room
  // photograph (~1.50, rounded up to 1.51) rather than a layout constant: the
  // rendered box is the card's own solved geometry now, and the widest photo
  // is the worst case `sizes` must cover under `cover`.
  { name: "RoomCard.beside", sizes: ROOM_CARD_SIZES, box: 1.51 as CoverBox },
```

and update the tripwire: run the suite, read the failure's actual count, set it (expected 23 —
`stacked` and the old `beside` go out, the new `beside` comes in), and append one entry to the
ledger comment explaining the 24 → 23 step, per that test's own instruction not to guess.

- [ ] **Step 4: Run everything**

Run: `npm test -- --run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green. `tsc` is what proves nothing else imported `roomCardLayout`,
`ROOM_CARD_BOXES` or `ROOM_STACK.textReserve` — if it names a file this plan missed, fix that
import the same way (the only known consumers are the ones listed above).

- [ ] **Step 5: Commit**

```bash
git add components/sections/RoomCard.tsx components/sections/RoomCard.test.tsx lib/room-card.ts lib/room-card.test.ts app/globals.css lib/motion.ts app/layout.tsx lib/sizes.test.ts
git commit -m "feat: every room card beside and alternating, the crop bound solved per photograph"
```

---

### Task 5: Assertion 9 in `check_card_stack.mjs`, and the full stack pass

**Files:**
- Modify: `scripts/check_card_stack.mjs` (new assertion; update any internals that *assume* a
  stacked layout exists — update readings, never bounds)
- Create: `docs/reviews/2026-08-13-image-sizing/card-stack.json` (+ `-no-recede`)

**Interfaces:**
- Consumes: `ol.room-stack > li.room-card` geometry (unchanged by Task 4 — that was a Global
  Constraint); `data-card-layout="beside"` on every card.
- Produces: the rig's contract for Task 8's sweep — 9 assertions + `--no-recede`.

- [ ] **Step 1: Add assertion 9**

In the per-shape flow, after the geometry collection (read the file top to bottom first — the
header comment explains each assertion's shape; add a `9.` entry to it):

```js
    // --------------------------------------------------- assertion 9: alternation
    // (spec 2026-08-13-image-sizing §2) At `lg` and up the photo stands BESIDE
    // the words and the side alternates: even cards photo-left, odd photo-right
    // — the client's own composition, verbatim ("room 1 image left / info
    // right, room 2 image right / info left, and so on"). Measured off each
    // card's rendered boxes, not off the class list: a class check would pass
    // with the flex direction overridden by anything else in the cascade.
    if (width >= 1024) {
      const sides = await page.evaluate(() =>
        [...document.querySelectorAll("ol.room-stack > li.room-card")].map((card) => {
          const photo = card.firstElementChild.getBoundingClientRect();
          const box = card.getBoundingClientRect();
          return photo.left + photo.width / 2 < box.left + box.width / 2 ? "left" : "right";
        }),
      );
      sides.forEach((side, i) => {
        const expected = i % 2 === 0 ? "left" : "right";
        if (side !== expected) {
          note(label, `assertion 9: card ${i}'s photo sits ${side} of centre, expected ${expected}`);
        }
      });
    }
```

Then sweep the rig's own internals for `stacked` (`grep -n "stacked" scripts/check_card_stack.mjs`):
any branch that *only ran* for stacked cards now never fires — leave assertion logic intact, update
comments/labels that claim two compositions exist. If assertion 6's crop maths branches on
`data-card-layout`, confirm the `beside` branch is the one measuring box-vs-natural aspect and let
it run for every card. **Do not change the 25% number, the ≥6px strip, the 0.98 opacity, or any
other bound.**

- [ ] **Step 2: Watch assertion 9 fail, then pass**

Sabotage: in `RoomCard.tsx`, temporarily drop the `lg:flex-row-reverse` ternary (all photos left).
`npm run build && npx next start -p 3100`, run `node scripts/check_card_stack.mjs --port 3100`.
Expected: assertion 9 failures naming every odd card at 1024/1280/1440/1920 on both routes. Restore,
rebuild, rerun: **all 9 assertions green on both routes, all six shapes.** Then the second arm:
`node scripts/check_card_stack.mjs --port 3100 --no-recede` — green.

If assertions 1–8 surface real regressions from Task 4 (most likely 8 — the words block beside a
photo at new widths — or 2 at the 1024×1366 shape), fix them in `RoomCard.tsx`/`globals.css` under
this task, re-running the rig; the levers are the same three the density contingency names (photo
share, words padding, `ROOM_STACK.heightMax`), and any lever pulled here must be re-checked against
density in Task 8.

- [ ] **Step 3: Save evidence, update the rig's `OUT` default**

Point `OUT`'s default at `docs/reviews/2026-08-13-image-sizing/card-stack.json` (the rig's results
now describe this plan's build; the old path stays in git history with the old evidence).

- [ ] **Step 4: Full suite + commit**

Run: `npm test -- --run && npx tsc --noEmit && npm run lint`

```bash
git add scripts/check_card_stack.mjs docs/reviews/2026-08-13-image-sizing/
git commit -m "feat: assertion 9 — the photo's side alternates, measured off the rendered boxes"
```

---

### Task 6: The gallery — panels, triggers, arrows; zero JavaScript

**Files:**
- Modify: `content/site.ts` (the `roomGallery` copy group)
- Modify: `components/sections/RoomCardStack.tsx` (panels after the `</ol>`; `roomGalleryId`;
  `GALLERY_SIZES`; pass `galleryId` to each card)
- Modify: `components/sections/RoomCard.tsx` (the trigger-button branch from Task 4's sketch, now
  with real copy)
- Modify: `app/globals.css` (`.room-gallery` + `::backdrop`)
- Modify: `components/sections/RoomCardStack.test.tsx`, `components/sections/RoomCard.test.tsx`
- Modify: `lib/sizes.test.ts` (the `GALLERY_SIZES` row; count 23 → 24)

**Interfaces:**
- Consumes: `galleryId?: string` on `RoomCard` (Task 4); `SITE` from `content/site.ts`.
- Produces:
  - `export function roomGalleryId(chapterId: string, index: number): string` in
    `RoomCardStack.tsx`, returning `` `room-gallery-${chapterId}-${index}` `` — **Task 7's rigs
    select `.room-gallery` and match these ids.**
  - `export const GALLERY_SIZES = "(min-width: 768px) 80vw, calc(100vw - 32px)"`.
  - `SITE.roomGallery = { open, previous, next, close }` (all strings).

- [ ] **Step 1: Failing tests first**

Append to `RoomCardStack.test.tsx` (reuse its existing render fixture):

```tsx
  it("renders one gallery panel per room, as a native popover dialog", () => {
    const panels = container.querySelectorAll(".room-gallery");
    expect(panels.length).toBe(COPY.rooms.length);
    panels.forEach((p, i) => {
      expect(p.getAttribute("popover")).toBe("auto");
      expect(p.getAttribute("role")).toBe("dialog");
      expect(p.id).toBe(roomGalleryId(CHAPTER.id, i));
      // Panels live OUTSIDE the <ol>: the stack's children stay slot,card,...
      expect(p.closest("ol")).toBeNull();
    });
  });

  it("wires every card's photo as its own panel's declarative trigger", () => {
    const triggers = container.querySelectorAll("ol.room-stack button[popovertarget]");
    expect(triggers.length).toBe(COPY.rooms.length);
    triggers.forEach((t, i) => {
      expect(t.getAttribute("popovertarget")).toBe(roomGalleryId(CHAPTER.id, i));
    });
  });

  it("steps through the rooms with arrows that wrap at both ends", () => {
    const n = COPY.rooms.length;
    const panels = [...container.querySelectorAll(".room-gallery")];
    panels.forEach((p, i) => {
      const [prev, next, close] = [...p.querySelectorAll("button")];
      expect(prev.getAttribute("popovertarget")).toBe(roomGalleryId(CHAPTER.id, (i + n - 1) % n));
      expect(next.getAttribute("popovertarget")).toBe(roomGalleryId(CHAPTER.id, (i + 1) % n));
      expect(close.getAttribute("popovertarget")).toBe(roomGalleryId(CHAPTER.id, i));
      expect(close.getAttribute("popovertargetaction")).toBe("hide");
    });
  });
```

And to `RoomCard.test.tsx`:

```tsx
  it("renders the photo as the panel's trigger when given a galleryId", () => {
    const { container } = render(
      <RoomCard room={ROOM} index={0} onSurface={false} galleryId="room-gallery-test-0" />,
    );
    const button = container.querySelector(".room-card > :first-child > button");
    expect(button?.getAttribute("popovertarget")).toBe("room-gallery-test-0");
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.querySelector("img")).not.toBeNull();
  });
```

Run: `npx vitest run components/sections/RoomCardStack.test.tsx components/sections/RoomCard.test.tsx`
Expected: FAIL (no panels, no triggers).

- [ ] **Step 2: The copy dial**

In `content/site.ts`, inside `SITE` (sibling of `nav`/`footer`), with the file's comment style:

```ts
  /** The room gallery — the click-to-expand the client asked for on 13 Aug
   * 2026 ("gallery-style"), with arrows. Labels only; the mechanism is the
   * browser's own popover machinery and carries no script. */
  roomGallery: {
    open: "View larger",
    previous: "Previous room",
    next: "Next room",
    close: "Close",
  },
```

- [ ] **Step 3: Panels in `RoomCardStack.tsx`**

```tsx
/** One id shape, composed in exactly one place. Task 7's rigs and the tests
 * both re-derive it; a card's trigger and its panel can never disagree. */
export function roomGalleryId(chapterId: string, index: number) {
  return `room-gallery-${chapterId}-${index}`;
}

/** Exported for `lib/sizes.test.ts`. The enlarged photo is `object-contain`
 * inside ~88vw x ~78svh, so its drawn width is min(88vw, 78svh x aspect) —
 * ~80vw for the 3:2 rooms on a 1440x900 screen, less for the portrait; 80vw
 * over-states the portrait's need, which is the safe direction (`ui/Photo.tsx`
 * says which way to round). */
export const GALLERY_SIZES = "(min-width: 768px) 80vw, calc(100vw - 32px)";
```

In the JSX: pass `galleryId={roomGalleryId(chapter.id, i)}` to each `RoomCard`, and after the
`</ol>` (inside the same wrapper `<div>`):

```tsx
        {/* The gallery: one native-popover panel per room, in the top layer, so
            no card's overflow/transform can clip it. `popover="auto"` gives
            open/close, Esc, click-outside light-dismiss AND at-most-one-open —
            which is what makes the arrows navigation: opening the neighbour
            closes this panel. All user-agent behaviour; no script. The page can
            still scroll behind an open panel (Lenis bypasses CSS locks, §2 #9)
            — known, client-informed, accepted 13 Aug 2026. */}
        {copy.rooms.map((room, i) => {
          const n = copy.rooms.length;
          return (
            <div
              key={`gallery-${room.name}`}
              id={roomGalleryId(chapter.id, i)}
              popover="auto"
              role="dialog"
              aria-label={`${room.name} — ${SITE.roomGallery.open}`}
              className="room-gallery"
            >
              <figure>
                <Photo
                  id={room.mediaId}
                  sizes={GALLERY_SIZES}
                  pictureClassName="block"
                  className="mx-auto h-auto max-h-[78svh] w-auto max-w-[88vw]"
                />
                <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                  <span className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]">
                    {room.name}
                  </span>
                  <span
                    className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {room.facts.join(" · ")}
                  </span>
                </figcaption>
              </figure>
              <div className="mt-4 flex justify-between gap-6 border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                {n > 1 && (
                  <button type="button" popoverTarget={roomGalleryId(chapter.id, (i + n - 1) % n)} className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]">
                    {SITE.roomGallery.previous}
                  </button>
                )}
                {n > 1 && (
                  <button type="button" popoverTarget={roomGalleryId(chapter.id, (i + 1) % n)} className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]">
                    {SITE.roomGallery.next}
                  </button>
                )}
                <button type="button" popoverTarget={roomGalleryId(chapter.id, i)} popoverTargetAction="hide" className="rule-in font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.2em] text-[color:var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]">
                  {SITE.roomGallery.close}
                </button>
              </div>
            </div>
          );
        })}
```

Imports: `Photo` from `@/components/ui/Photo`, `SITE` from `@/content/site`. (`RoomCardStack` is a
server component and stays one — `Photo`'s manifest weight is server-side; nothing here adds a
byte of client JS. The `.test.tsx` wraparound test pins the arrow maths.)

In `RoomCard.tsx`, replace the bare `{photo}` inside the photo wrapper with the trigger branch
(add `import { SITE } from "@/content/site";`):

```tsx
          {galleryId ? (
            <button
              type="button"
              popoverTarget={galleryId}
              aria-label={`${SITE.roomGallery.open}: ${room.name}`}
              className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
            >
              {photo}
            </button>
          ) : (
            photo
          )}
```

The wrapper `<div>` stays the card's `:first-child` and the button sits *inside* it, so the CSS
cap and the rig's `firstElementChild` reads are untouched.

- [ ] **Step 4: `.room-gallery` styles in `app/globals.css`**

```css
/*
 * The room gallery's panel — a native popover, so the open/close mechanics,
 * Esc, light-dismiss and the one-at-a-time rule are all user-agent behaviour
 * and cost no script. The panel is ink-on-paper (a popover carrying text never
 * sits on a translucent wash — the §16 lesson); the backdrop is the page dimmed
 * under a cream wash, decorative, carrying nothing.
 *
 * `::backdrop` inherits custom properties from the panel in current engines;
 * where an older one does not, the backdrop simply stays transparent and the
 * gallery is still a gallery — failure is absence.
 */
.room-gallery {
  background: var(--paper);
  border: 1px solid var(--accent);
  padding: 1.5rem;
  max-width: min(92vw, 96rem);
}

.room-gallery::backdrop {
  background: color-mix(in srgb, var(--paper) 88%, transparent);
}
```

(The UA stylesheet already centres a popover — `position: fixed; inset: 0; margin: auto;
width/height: fit-content` — do not re-implement that.)

- [ ] **Step 5: `lib/sizes.test.ts`**

Add a row and bump the tripwire, per its own ledger discipline:

```ts
  // The room gallery's enlarged photograph (13 Aug 2026) — object-contain, so
  // the box column is the widest room photo again; a genuinely new width list
  // (nothing else on the page serves ~80vw).
  { name: "RoomCardStack.gallery", sizes: GALLERY_SIZES, box: 1.51 as CoverBox },
```

Count 23 → 24; append the ledger entry, reading the number off the suite's failure, not guessing.

- [ ] **Step 6: Run everything**

Run: `npm test -- --run && npx tsc --noEmit && npm run lint && npm run build`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add content/site.ts components/sections/RoomCardStack.tsx components/sections/RoomCardStack.test.tsx components/sections/RoomCard.tsx components/sections/RoomCard.test.tsx app/globals.css lib/sizes.test.ts
git commit -m "feat: the room gallery — native popovers, arrows that are navigation, zero script"
```

---

### Task 7: The gallery's rigs — `check_room_gallery.mjs`, and the resolution rig learns to open it

**Files:**
- Create: `scripts/check_room_gallery.mjs`
- Modify: `scripts/check_image_resolution.mjs` (open the panels, the §2 #39 lesson)
- Create: `docs/reviews/2026-08-13-image-sizing/gallery.json`

**Interfaces:**
- Consumes: `.room-gallery` panels and `ol.room-stack button[popovertarget]` triggers from Task 6;
  production server on `--port`.
- Produces: exit codes + JSON evidence; the resolution rig's report grows by the panel images.

- [ ] **Step 1: Write `check_room_gallery.mjs`**

House boilerplate from `check_card_stack.mjs` (flags, `note()`, JSON out, exit code). Routes
`/mahua-vann` (3 rooms) and `/mahua-tola` (4), at 1440×900 and 390×844. Assertions, each labelled:

```js
// 1. Lazy until asked: after a full-page scroll (every card seen), every
//    `.room-gallery img` still has naturalWidth === 0 — a closed popover is
//    display:none, so a lazy image in one must never have STARTED loading.
//    Browser truth, not request attribution: a cached card-tier file would
//    make a network log lie in both directions.
// 2. Click opens: click the first card's trigger button; its panel matches
//    `:popover-open` and its img reaches naturalWidth > 0 and a rendered
//    width >= 40% of the viewport within 5s.
// 3. Arrows are navigation: click "next" in panel 0 → panel 1 open, panel 0
//    NOT open (popover="auto" guarantees at most one). From the LAST panel,
//    "next" wraps to panel 0. From panel 0, "previous" wraps to the last.
// 4. Esc closes: press Escape → no `.room-gallery:popover-open` anywhere.
// 5. Light dismiss: open panel 0, mouse-click at (8, viewportHeight/2) —
//    outside any panel — → none open.
// 6. Absence, not breakage, without JS: a context with javaScriptEnabled:
//    false renders both routes, the stack lays out, the trigger buttons exist;
//    no assertion that panels open (whether declarative invokers run without
//    scripting is the UA's business), only that nothing errors and the page
//    still scrolls.
```

Notes: use `page.keyboard.press("Escape")` and real `page.mouse.click(...)` — the UA's own
light-dismiss and Esc paths, not `hidePopover()` calls, are what a visitor exercises. For clicking
a trigger under the sticky header, `scrollIntoViewIfNeeded` on the card first.

- [ ] **Step 2: Watch each assertion fail**

Three sabotages, one at a time, rebuild between each (`npm run build`, restart server):
(a) Remove `popoverTarget={galleryId}` from `RoomCard`'s button → assertions 2/3 fail.
(b) Give the panel's `Photo` `priority` (eager) → assertion 1 fails (images load closed).
(c) Point every panel's "next" at panel 0 (drop the `% n` maths) → assertion 3's wraparound and
    panel-1 checks fail.
Restore after each. Record all three in the JSON's `watchedFailing` field. Then the clean run:
both routes, both shapes, exit 0.

- [ ] **Step 3: `check_image_resolution.mjs` opens the gallery**

After the existing menu-open block (read its comment — this is deliberately the same lesson,
§2 #39), add: on any route where `.room-gallery` panels exist, iterate them; for each, call
`el.showPopover()` in `page.evaluate` (deterministic, no scroll dance — invoker clicks are the
gallery rig's job, this rig only needs the images IN the layout), wait for its img to load,
collect its measurement with the same code path as every other image, then `el.hidePopover()`.
The report's image count rises by 3 on `/mahua-vann` and 4 on `/mahua-tola` — assert the expected
count the way the menu addition did.

Expected outcome on the current build: the three 762px crops (`vann-room-deluxe`,
`tola-room-deluxe`, `tola-room-suite`) show ratios below 1 at wide viewports **attributed to the
file library's own ceiling** (the rig already distinguishes a small source from an under-stated
`sizes` — read its header). If the rig FAILS on them: add a scoped exemption list
`CLIENT_ACCEPTED_SOFT = ["vann-room-deluxe", "tola-room-deluxe", "tola-room-suite"]` whose comment
quotes the client verbatim — *"if they still look blurry on large screen I'll let you [know] and we
can fix it then"*, 13 Aug 2026, originals ≳2000px the recorded fix — and which exempts **only** the
sizes-failure verdict for exactly those ids, so any other image regressing still fails. Never lower
the global bar.

- [ ] **Step 4: Run both rigs clean, save evidence, commit**

```bash
node scripts/check_room_gallery.mjs --port 3100
node scripts/check_image_resolution.mjs --port 3100
git add scripts/check_room_gallery.mjs scripts/check_image_resolution.mjs docs/reviews/2026-08-13-image-sizing/
git commit -m "feat: the gallery proven in a browser — lazy until asked, arrows that navigate, Esc that closes"
```

---

### Task 8: The whole-plan verification sweep, density, budget, and the record

**Files:**
- Create: `docs/reviews/2026-08-13-image-sizing/README.md`
- Modify: `docs/DECISIONS.md` (new §18), `docs/PROJECT-STATE.md`, `CLAUDE.md` (Status row: one
  sentence for the reflow + beside cards + gallery, pointing at §18)
- Possibly modify: `components/sections/RoomCard.tsx` / `app/globals.css` / `lib/motion.ts`
  (density levers — only if needed)

**Interfaces:**
- Consumes: everything above.
- Produces: the evidence record; the branch ready for review/merge.

- [ ] **Step 1: The full measured pass, in order, against one production build**

```bash
npm test -- --run && npx tsc --noEmit && npm run lint
npm run build && npx next start -p 3100 &
node scripts/check_plates.mjs --port 3100
node scripts/check_card_stack.mjs --port 3100
node scripts/check_card_stack.mjs --port 3100 --no-recede
node scripts/check_room_gallery.mjs --port 3100
node scripts/check_image_resolution.mjs --port 3100
node scripts/measure_density.mjs                 # home — chapters table
node scripts/measure_density.mjs --url /mahua-vann
node scripts/measure_density.mjs --url /mahua-tola
node scripts/measure_page.mjs                    # transfer + hero responseEnd
```

**`measure_page.mjs` is in this list because of a defect this plan's own review found.** Task 4's
`box` fix makes every room photograph request roughly 1.31× more width at `lg` and up — about 1.7×
the pixels — and nothing else in this plan measures bytes. The room photographs are below the fold,
so they land in *whole page scrolled* rather than *initial load*, which is the reading the client
ruled on 4 Aug; but CLAUDE.md publishes both figures per width and they are now stale for the two
property routes. Record the new numbers, and if **initial load** moved at either width, that is a
finding against non-negotiable #6, not a footnote.

(Confirm `measure_density.mjs`'s actual route flag by reading its header first — §2 #26/#28 are
both stories about a rig pointed at a route it wasn't built for.) Then, separately:
`npm run verify:budget -- --no-build` against the same `.next`.

- [ ] **Step 2: Judge density against the hard line**

`vann-rooms` ≤ 31.5 mean / 42.1 worst; `tola-rooms` ≤ 33.8 / 44.3; all chapters everywhere ≤45%.
The home boards' figures will move too (the 1024–1279 reflow lengthens `forest` slightly at those
widths — density is measured at 1440×900 where nothing changed, so movement should be ~0; if it
is not, understand why before accepting it).

If a rooms chapter is over its line, pull levers in this order, one at a time, re-measuring after
each: (1) confirm the `xl` share is 65% (imagery per card); (2) trim the words block's vertical
padding at `lg`+ (`py-6` → `py-5` → `py-4`, keeping assertion 8 green); (3) `ROOM_STACK.heightMax`
760 → 720 (shorter cards, less text-column cream — re-run the card-stack rig after, its geometry
depends on card height). **If the line still cannot be held, STOP: present the measured numbers to
the client** (his composition vs his density ceiling — spec §2's explicit contingency) via
AskUserQuestion, and record his ruling in `docs/DECISIONS.md` before shipping anything over the
line.

- [ ] **Step 3: Budget**

`verify:budget` delta must be 0 against 172,209 bytes brotli (the gallery is markup; Task 4 removed
code). Record the measured number. If it moved at all, explain why in the README with the rig's own
output — an unexplained delta is a finding, not a footnote.

- [ ] **Step 4: Look with eyes, not only rigs**

Screenshots into the review dir: both property rooms chapters and all three home boards at
390×844, 768×1024, 1024×768, 1280×800, 1366×768, 1440×900, 1920×1080; one gallery panel open at
1440 and at 390; the crop strips from Task 3. Then **open the 390 and 1024×768 screenshots and
read them** — every word legible, no photo band swallowing a card, the alternation actually
visible at `lg`+ (§2 #29: a suite of green rigs has had a shared blind spot before; the eye is the
instrument of record).

- [ ] **Step 5: Write the record**

- `docs/reviews/2026-08-13-image-sizing/README.md`: what changed and why; the client's three
  rulings; every measured number (plates floor worst-cases, card-stack 9/9 both arms, gallery
  4 rigs' verdicts, density before/after table, budget delta, resolution report incl. the three
  soft-serve ratios); the watched-failing notes for every new assertion; what was accepted
  (rooms board 68% floor case, scroll-behind-gallery, the three soft images and their fix path).
- `docs/DECISIONS.md` §18: the 13 Aug rulings verbatim (reflow, crop-and-fill + softness accepted,
  gallery with arrows); the retirement of aspect-derived layout (and that §17's stacked machinery —
  `textReserve`, the stacked ceiling — is gone with it); the per-card solved crop bound; the
  popover mechanism and why it costs nothing; the plate floor rule and the one exemption.
- `docs/PROJECT-STATE.md`: the strand summary and anything still owed (the client's hi-res
  originals for the three Deluxe/Suite photographs — an open item with his quoted ruling).
- `CLAUDE.md` Status row: one added sentence pointing at §18 and the new rigs
  (`check_plates.mjs`, `check_room_gallery.mjs`, card-stack assertion 9).

- [ ] **Step 6: Final commit**

```bash
npm test -- --run   # once more, after any Step-2 lever
git add docs/reviews/2026-08-13-image-sizing docs/DECISIONS.md docs/PROJECT-STATE.md CLAUDE.md
git commit -m "docs: the image-sizing evidence — reflow, beside cards, gallery, all measured"
```

Do **not** merge into `feat/chapters-rebuild` or `main`, and do not republish the demo — both are
the user's calls, made outside this plan.
