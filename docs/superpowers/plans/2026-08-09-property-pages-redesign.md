# Property Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/mahua-vann` and `/mahua-tola` so they read as quiet luxury rather than as a WordPress template — a shape vocabulary that cannot repeat itself, the client's own park maps redrawn in cream, the rooms as showcases instead of spec tables, six experiences given real space, and a booking ask that is always reachable.

**Architecture:** The page spine gains a `shape` field, and a test forbids two adjacent moments from sharing one — that single mechanical rule is the fix for the "templaty" complaint. Seven small section components each render one shape. The maps are traced from the client's artwork by a build script into generated modules, in the same swap-point pattern as the leaf, the lantern and the welcome logo. A fixed bar carrying Book and a tap-to-call sits outside the chapter flow.

**Scope change, 9 Aug, after this plan was first written.** The client removed the enquiry form: *"we don't need an enquiry form, for the enquiries we can just share the contact details in the Website Directory section when we build it later."* Task 10 is now `PropertyContact`; Tasks 8 and 9 consume it in place of the form's trigger. No third-party service, no signup, no environment variable, and nothing on these pages that can be pressed to no effect.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Tailwind v4, Vitest, Playwright (verification rigs), `sharp` + `potrace` (map pipeline).

## Global Constraints

Every task's requirements implicitly include these. They are copied from the spec and from CLAUDE.md's non-negotiables.

- **Cream throughout.** Base `#F1E9D7`, second surface `#E9DFC8`, ink `#31402C`, dim `#5A5240`. No dark sections except photographs and their overlays.
- **No component hard-codes a colour, a duration or a string.** Colour from `lib/palette.ts` via the CSS vars in `app/globals.css`; timing from `lib/motion.ts`; copy from `content/*.ts`.
- **Gold (`--accent`, `#BB8F2E`) is decorative only and never carries text.** `--accent-text` (`goldText`, `#7A5C18`) is the legible sibling.
- **No section may exceed 45% empty space at 1440×900** (`scripts/measure_density.mjs`).
- **Only images ≥1400px wide may go full-bleed** (`fullBleedSafe: true`).
- **British spelling.** No invented facts, no invented quotes; every hard number either sourced or explicitly flagged for the client.
- **Restraint:** nothing bounces, no permanent peripheral motion, one entrance curve (`ENTER.ease`). If you notice the animation it is too fast.
- **Never hand-edit a generated `lib/*-art.ts` module.** Change the source artwork or the build script.
- **`npm test`, `npm run build`, `npm run lint` must be green before any commit claiming a task complete.** Read exit codes; never eyeball piped output.
- **Every new guard must be watched failing against a deliberately broken build before its pass is trusted.** `docs/DECISIONS.md` §2 has twenty-seven instances of why.
- **Kill any stale server by port before measuring.** A `next start` left on 3100 has produced two rounds of fictional numbers on this project.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/build_map.mjs` | **New.** Traces the client's park-map artwork into generated modules |
| `lib/vann-map-art.ts`, `lib/tola-map-art.ts` | **New, generated.** Region path data + viewBox |
| `lib/map-art.test.ts` | **New.** Holds any regenerated map to the guarantees `PropertyMap` depends on |
| `content/property-chapters.ts` | **Modified.** `PropertyShape` replaces `PropertyChapterKind`; adds the R1 helper |
| `components/sections/OpeningColumn.tsx` | **New.** The `column` shape |
| `components/sections/PropertyMap.tsx` | **New.** The `map` shape — art, labels, legend, getting-there |
| `components/sections/RoomShowcase.tsx` | **New.** The `showcase` shape; replaces `RoomsIndex` |
| `components/sections/ExperiencePair.tsx` | **New.** The `pair` shape |
| `components/sections/PressBand.tsx` | **New.** The `press` shape |
| `components/property/PropertyInvitation.tsx` | **New.** The `invitation` shape |
| `components/property/PropertyBar.tsx` | **New.** The persistent bar |
| `components/property/PropertyContact.tsx` | **New.** The lodge's phone, email and address |
| `components/property/PropertyPage.tsx` | **Modified.** Dispatches shapes; mounts the bar |
| `content/mahua-vann.ts`, `content/mahua-tola.ts` | **Rewritten.** New spines, full copy |
| `content/mahua-vann.test.ts`, `content/mahua-tola.test.ts` | **Modified.** R1 + rhythm + join tests |
| `scripts/build_images.mjs` | **Modified.** The newly-found photography |
| `app/mahua-vann/page.tsx`, `app/mahua-tola/page.tsx` | **Modified.** New props |
| `components/sections/RoomsIndex.tsx`, `components/sections/FieldNotes.tsx` | **Deleted** in Task 14 |

---

### Task 1: The map build script

**Why first:** it carries the most unknowns and the most visual risk. The spec (§5) says plainly that if the map cannot be made to look expensive, the design should be reconsidered before the rest is built around it.

**Files:**
- Create: `scripts/build_map.mjs`
- Create (generated): `lib/vann-map-art.ts`, `lib/tola-map-art.ts`
- Create: `lib/map-art.test.ts`

**Interfaces:**
- Produces: `VANN_MAP_ART` / `TOLA_MAP_ART`, each `{ viewBox: { width: number; height: number }, regions: { park: string; core: string; water: string; road: string } }` where every `regions` value is SVG path data. Consumed by Task 3's `PropertyMap`.

- [ ] **Step 1: Write the failing test**

Create `lib/map-art.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TOLA_MAP_ART } from "./tola-map-art";
import { VANN_MAP_ART } from "./vann-map-art";

/**
 * These hold any *regenerated* map to the guarantees `PropertyMap` depends on.
 * They are not a check that tracing "ran" — a build that emitted four empty
 * strings would satisfy that, and render an empty cream rectangle with every
 * test green. Each assertion below is about the artwork's content.
 */
const MAPS = [
  ["Vann", VANN_MAP_ART],
  ["Tola", TOLA_MAP_ART],
] as const;

/** Every `M` starts a new subpath; a broken region traces as many. */
const subpaths = (d: string) => (d.match(/M/gi) ?? []).length;

describe.each(MAPS)("%s map art", (_name, art) => {
  it("has a real viewBox", () => {
    expect(art.viewBox.width).toBeGreaterThan(400);
    expect(art.viewBox.height).toBeGreaterThan(200);
  });

  it("traced every region to real path data", () => {
    for (const [region, d] of Object.entries(art.regions)) {
      expect(d.length, `${region} traced to nothing`).toBeGreaterThan(200);
      expect(d.startsWith("M"), `${region} is not path data`).toBe(true);
    }
  });

  it("keeps the road continuous", () => {
    // The single assertion this file exists for. The labels and village dots
    // sit ON the yellow road in the client's artwork, so a colour mask is
    // perforated by them; the morphological close in build_map.mjs is what
    // bridges those gaps. With the close removed the road shatters into a
    // dozen fragments, and a road with holes in it must not ship.
    expect(subpaths(art.regions.road)).toBeLessThanOrEqual(3);
  });

  it("nests the regions the way the geography does", () => {
    // The core zone sits inside the park's extent, so it cannot be the larger
    // shape. Catches a mask whose colour test has drifted onto the wrong band.
    expect(art.regions.core.length).toBeLessThan(art.regions.park.length * 2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/map-art.test.ts`
Expected: FAIL — `Cannot find module './vann-map-art'`.

- [ ] **Step 3: Write the build script**

Create `scripts/build_map.mjs`:

```js
// The two park maps, redrawn in the cream palette from the client's own
// artwork. Run: node scripts/build_map.mjs
//
// The geography is theirs and is TRACED, never hand-drawn: DECISIONS.md §8
// records three hand-authored tigers failing because hand-written bezier
// coordinates are slightly wrong everywhere, which is what reads as cheap.
// Only the colour and the type change, and the type is not here at all — every
// label lives in content/, because it is copy.
//
// Four things were learned by looking at the output of this pipeline rather
// than by reasoning about it (spec §5), and each is load-bearing:
//
//   1. potrace fills the DARK areas. A white-on-black mask traces the
//      inverse — the first run produced a solid gold rectangle. Hence
//      `.negate()` before tracing.
//   2. The place names sit ON the regions, so a colour mask is perforated by
//      its own type. `close()` below is a real morphological close (dilate,
//      then erode) which fills them. A plain blur+threshold is a dilation
//      only and leaves the shape permanently fattened.
//   3. The legend and compass must be cropped off or their swatches trace as
//      stray specks out in the paper.
//   4. The park's extent is recovered as "not paper and not road", NOT by
//      matching green — matching green re-introduces (2) at the outline,
//      where it is most visible.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import potrace from "potrace";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * `mapRight` crops the legend and compass off by x, in source pixels. Read it
 * off the artwork: it is the left edge of the legend's colour swatches.
 */
const MAPS = [
  {
    name: "vann",
    src: "reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg",
    out: "lib/vann-map-art.ts",
    constant: "VANN_MAP_ART",
    mapRight: 800,
  },
  {
    name: "tola",
    src: "reference/wp-media/property-pages/Mahua-website_Tola-tadoba-map2.jpg",
    out: "lib/tola-map-art.ts",
    constant: "TOLA_MAP_ART",
    mapRight: 640,
  },
];

const isPaper = (r, g, b) => r > 235 && g > 235 && b > 235;
const isRoad = (r, g, b) => r > 200 && g > 170 && b < 150;
const isCore = (r, g, b) => g > 110 && g < 205 && r < g - 35 && b < g - 55;
const isWater = (r, g, b) => b > 140 && b > r + 40 && g < b - 15;

/**
 * A true morphological close: dilate by `radius`, then erode by the same.
 *
 * `blur().threshold(low)` alone is a dilation, and leaves every region
 * permanently fatter than the geography. Doing both halves puts the boundary
 * back where it started while keeping the holes filled.
 */
async function close(mask, { width, height }, radius) {
  const dilated = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(radius)
    .threshold(40)
    .raw()
    .toBuffer();
  return sharp(dilated, { raw: { width, height, channels: 1 } })
    .blur(radius)
    .threshold(215)
    .negate() // potrace fills the dark; the region must be black on white.
    .png()
    .toBuffer();
}

function trace(png) {
  return new Promise((res, rej) =>
    potrace.trace(png, { turdSize: 40, optCurve: true, alphaMax: 1, threshold: 128 }, (e, svg) =>
      e ? rej(e) : res(/ d="([^"]*)"/.exec(svg)?.[1] ?? /d="([^"]*)"/.exec(svg)?.[1] ?? ""),
    ),
  );
}

async function region(data, info, mapRight, test, radius) {
  const mask = Buffer.alloc(info.width * info.height);
  for (let p = 0; p < mask.length; p++) {
    const i = p * info.channels;
    const inMap = p % info.width < mapRight;
    mask[p] = inMap && test(data[i], data[i + 1], data[i + 2]) ? 255 : 0;
  }
  return trace(await close(mask, info, radius));
}

async function build(map) {
  const src = path.join(ROOT, map.src);
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });

  const regions = {
    // "Not paper and not road" — swallows the labels, the callout and the
    // water, so the outline comes back whole rather than perforated.
    park: await region(data, info, map.mapRight, (r, g, b) => !isPaper(r, g, b) && !isRoad(r, g, b), 5),
    core: await region(data, info, map.mapRight, isCore, 5),
    water: await region(data, info, map.mapRight, isWater, 2),
    // The largest radius on the page: the village dots and their labels sit
    // directly on the road, and bridging them is what keeps it continuous.
    road: await region(data, info, map.mapRight, isRoad, 9),
  };

  for (const [name, d] of Object.entries(regions)) {
    if (!d || d.length < 200) {
      throw new Error(
        `${map.name}: "${name}" traced to ${d.length} chars. A region that fails to trace must fail ` +
          `the build loudly, not render an empty cream rectangle.`,
      );
    }
  }

  const body = `// GENERATED FILE — do not edit by hand.
// Produced by scripts/build_map.mjs from ${map.src}.
// Run \`node scripts/build_map.mjs\` to regenerate.
//
// Region outlines only. Every label, gate, village and legend entry is copy
// and lives in content/, per CLAUDE.md's architecture rule.

export const ${map.constant} = {
  viewBox: { width: ${map.mapRight}, height: ${info.height} },
  regions: {
${Object.entries(regions)
  .map(([k, d]) => `    ${k}: ${JSON.stringify(d)},`)
  .join("\n")}
  },
} as const;
`;

  await writeFile(path.join(ROOT, map.out), body, "utf8");
  console.log(
    `${map.name}: ${Object.entries(regions)
      .map(([k, d]) => `${k} ${d.length}c`)
      .join(", ")}  ->  ${map.out}`,
  );
}

for (const map of MAPS) await build(map);
```

- [ ] **Step 4: Run it and read `mapRight` off the Tadoba artwork before trusting the default**

Run: `node scripts/build_map.mjs`
Expected: two lines of region character counts, both files written.

**`mapRight: 640` for Tadoba is an estimate and must be checked.** Open `reference/wp-media/property-pages/Mahua-website_Tola-tadoba-map2.jpg` and find the x of the legend's leftmost swatch; set `mapRight` just below it. If the traced Tadoba artwork contains round specks out to the right of the park, the crop is too wide.

- [ ] **Step 5: Run the test**

Run: `npx vitest run lib/map-art.test.ts`
Expected: PASS.

- [ ] **Step 6: Watch the road guard fail, before trusting it**

Temporarily change the `road` region's radius from `9` to `0`, run `node scripts/build_map.mjs && npx vitest run lib/map-art.test.ts`.
Expected: the "keeps the road continuous" test FAILS with a subpath count well above 3. Restore `9`, rebuild, confirm green again. A guard nobody has watched fail is not a guard.

- [ ] **Step 7: Look at the result**

Render a preview to the scratchpad and open it:

```bash
node -e "const {VANN_MAP_ART:a}=await import('./lib/vann-map-art.ts');" 2>/dev/null || true
```

That will not run — `lib/*.ts` is TypeScript. Instead write a throwaway preview inside the project (delete it afterwards):

```js
// preview-map.tmp.mjs — DELETE after looking.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
for (const n of ["vann", "tola"]) {
  const src = await readFile(`lib/${n}-map-art.ts`, "utf8");
  const w = +/width: (\d+)/.exec(src)[1];
  const h = +/height: (\d+)/.exec(src)[1];
  const d = (k) => new RegExp(`${k}: "((?:[^"\\\\]|\\\\.)*)"`).exec(src)[1].replace(/\\\\"/g, '"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <rect width="100%" height="100%" fill="#F1E9D7"/>
    <path fill="#31402C" fill-opacity="0.10" d="${d("park")}"/>
    <path fill="#31402C" fill-opacity="0.20" d="${d("core")}"/>
    <path fill="#31402C" fill-opacity="0.34" stroke="#31402C" stroke-opacity="0.5" stroke-width="1.2" d="${d("water")}"/>
    <path fill="#BB8F2E" fill-opacity="0.95" d="${d("road")}"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`preview-${n}.png`);
}
```

Run: `node preview-map.tmp.mjs`, then open `preview-vann.png` and `preview-tola.png`.
Expected: recognisable park geography in cream, a continuous gold road, water reading clearly against the core zone. **If it does not look expensive, stop and say so — that is this task's real purpose.** Delete `preview-map.tmp.mjs`, `preview-vann.png` and `preview-tola.png` before committing.

- [ ] **Step 8: Commit**

```bash
git add scripts/build_map.mjs lib/vann-map-art.ts lib/tola-map-art.ts lib/map-art.test.ts
git commit -m "feat: trace the client's park maps into cream field-guide artwork

Region outlines traced from the client's own Pench and Tadoba maps with
potrace, in the same swap-point pattern as the leaf, the lantern and the
welcome logo: drop in new artwork, run one script. Labels are not here —
they are copy and live in content/.

The morphological close is load-bearing, not tidying: the place names and
village dots sit ON the regions in the source, so a colour mask is
perforated by its own type, and the road in particular shatters without
it. Guarded by a subpath count that has been watched failing."
```

---

### Task 2: The shape vocabulary

**Files:**
- Modify: `content/property-chapters.ts`
- Create: `content/property-chapters.test.ts`

**Interfaces:**
- Produces: `PropertyShape`, `PropertyChapter` (now carrying `shape`), `PROPERTY_IMAGE_LED_SHAPES`, `PROPERTY_FULL_BLEED_SHAPES`, and `findRepeatedShape(chapters)`. Consumed by every later task.

- [ ] **Step 1: Write the failing test**

Create `content/property-chapters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findRepeatedShape, type PropertyChapter } from "./property-chapters";

const chapter = (id: string, shape: PropertyChapter["shape"]): PropertyChapter => ({
  id,
  shape,
  media: [],
});

describe("findRepeatedShape", () => {
  it("finds nothing in a spine that never repeats itself", () => {
    expect(
      findRepeatedShape([chapter("a", "fullBleed"), chapter("b", "column"), chapter("c", "map")]),
    ).toBeUndefined();
  });

  it("names both offenders when two adjacent moments share a shape", () => {
    // The whole anti-template rule. This is the failure the redesign exists
    // to make impossible: /mahua-vann shipped on 9 Aug with three consecutive
    // sections opening on the identical eyebrow-heading-paragraph-grid move.
    expect(
      findRepeatedShape([
        chapter("a", "fullBleed"),
        chapter("b", "showcase"),
        chapter("c", "showcase"),
      ]),
    ).toEqual({ first: "b", second: "c", shape: "showcase" });
  });

  it("allows a shape to return once something else has intervened", () => {
    expect(
      findRepeatedShape([
        chapter("a", "fullBleed"),
        chapter("b", "column"),
        chapter("c", "fullBleed"),
      ]),
    ).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run content/property-chapters.test.ts`
Expected: FAIL — `findRepeatedShape` is not exported.

- [ ] **Step 3: Rewrite `content/property-chapters.ts`**

Replace the whole file:

```ts
import type { MediaId } from "@/lib/media";

/**
 * The shapes a property page's spine may use.
 *
 * A *shape*, not a *kind*: the field exists so that two adjacent moments can
 * be forbidden from looking alike. The pages this replaced shipped with three
 * consecutive sections opening on the identical eyebrow-heading-paragraph-grid
 * move, and the client's word for the result was "templaty" — which is exactly
 * what one section component applied down a page produces. See
 * `findRepeatedShape` below; it is the fix, and it is mechanical.
 */
export type PropertyShape =
  | "fullBleed"
  | "column"
  | "map"
  | "showcase"
  | "pair"
  | "press"
  | "invitation";

export type PropertyChapter = {
  id: string;
  number?: string;
  label?: string;
  shape: PropertyShape;
  media: readonly MediaId[];
};

/**
 * The shapes that carry a screen on their photography.
 *
 * `press` is deliberately absent: it is a band of publication wordmarks and
 * type, which is quiet in the eye however much information it holds. That is
 * why `invitation` carries the sister lodge's photograph — on Mahua Vann the
 * two sit adjacent, and a type-led band followed by a type-led close would
 * satisfy the no-repeated-shape rule while breaking the older rhythm rule
 * (CLAUDE.md non-negotiable #10). The two rules are independent and both bind.
 */
export const PROPERTY_IMAGE_LED_SHAPES: readonly PropertyShape[] = [
  "fullBleed",
  "map",
  "showcase",
  "pair",
  "invitation",
];

/** Mirrors `FULL_BLEED_KINDS` in `content/chapters.ts` — non-negotiable #11. */
export const PROPERTY_FULL_BLEED_SHAPES: readonly PropertyShape[] = ["fullBleed"];

/**
 * The first place two adjacent moments share a shape, or `undefined`.
 *
 * Returns the offenders rather than a boolean so the failure message can name
 * them: a test that says only "false is not true" costs a reader ten minutes
 * of counting sections by hand.
 */
export function findRepeatedShape(
  chapters: readonly PropertyChapter[],
): { first: string; second: string; shape: PropertyShape } | undefined {
  for (let i = 0; i < chapters.length - 1; i++) {
    if (chapters[i].shape === chapters[i + 1].shape) {
      return { first: chapters[i].id, second: chapters[i + 1].id, shape: chapters[i].shape };
    }
  }
  return undefined;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run content/property-chapters.test.ts`
Expected: PASS.

Note: `npx tsc --noEmit` will now fail across `RoomsIndex`, `FieldNotes`, `PropertyPage` and both content dials, which still speak the old `kind` vocabulary. That is expected and is repaired by Tasks 3–14. Do not "fix" it by keeping the old type alongside the new one.

- [ ] **Step 5: Commit**

```bash
git add content/property-chapters.ts content/property-chapters.test.ts
git commit -m "feat: give the property spine a shape, and forbid it repeating

A shape rather than a kind, because the field exists to make two adjacent
moments looking alike a test failure. That repetition is what the client
called templaty, and it is the one thing on these pages that good
photography cannot rescue."
```

---

### Task 3: `PropertyMap`

**Files:**
- Create: `components/sections/PropertyMap.tsx`
- Create: `components/sections/PropertyMap.test.tsx`

**Interfaces:**
- Consumes: `VANN_MAP_ART` / `TOLA_MAP_ART` (Task 1), `PropertyChapter` (Task 2), `ChapterSurface`, `ChapterMark`, `TwoToneHeading`, `Enter`.
- Produces: `PropertyMap`, and the copy types `MapLabelCopy`, `MapLegendEntryCopy`, `PropertyMapCopy` — consumed by Tasks 12 and 13.

- [ ] **Step 1: Write the failing test**

Create `components/sections/PropertyMap.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import { PropertyMap, type PropertyMapCopy } from "./PropertyMap";

const COPY: PropertyMapCopy = {
  heading: { text: "Where it is", dim: "is" },
  art: "vann",
  labels: [
    { text: "Turia Gate", x: 0.5, y: 0.62, kind: "gate" },
    { text: "Pench Reservoir", x: 0.36, y: 0.6, kind: "water" },
  ],
  lodge: { text: "Mahua Vann", x: 0.58, y: 0.63 },
  legend: [{ swatch: "core", text: "Core area" }],
  gettingThere: [{ label: "From the gate", value: "Five kilometres from Turia Gate" }],
};

describe("PropertyMap", () => {
  it("draws every region the artwork carries", () => {
    const { container } = render(
      <PropertyMap chapter={{ id: "vann-map", shape: "map", media: [] }} copy={COPY} />,
    );
    // Four regions, one path each. A map that silently drops one is a map
    // with no road or no water on it, and nothing else would notice.
    expect(container.querySelectorAll("svg path")).toHaveLength(4);
  });

  it("places every label inside the artwork's own box", () => {
    // Fractional coordinates are transcribed by eye from the source artwork,
    // which is exactly the kind of data entry that produces a 1.2 or a -0.3
    // and puts a village out in the margin where nobody looks.
    for (const l of [...COPY.labels, COPY.lodge]) {
      expect(l.x, `${l.text} is off the map horizontally`).toBeGreaterThanOrEqual(0);
      expect(l.x, `${l.text} is off the map horizontally`).toBeLessThanOrEqual(1);
      expect(l.y, `${l.text} is off the map vertically`).toBeGreaterThanOrEqual(0);
      expect(l.y, `${l.text} is off the map vertically`).toBeLessThanOrEqual(1);
    }
  });

  it("renders the lodge's name and the getting-there facts", () => {
    const { getByText } = render(
      <PropertyMap chapter={{ id: "vann-map", shape: "map", media: [] }} copy={COPY} />,
    );
    expect(getByText("Mahua Vann")).toBeTruthy();
    expect(getByText("Five kilometres from Turia Gate")).toBeTruthy();
  });

  it("uses the real artwork, not a placeholder box", () => {
    expect(VANN_MAP_ART.regions.road.length).toBeGreaterThan(200);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/PropertyMap.test.tsx`
Expected: FAIL — `./PropertyMap` does not exist.

- [ ] **Step 3: Write the component**

Create `components/sections/PropertyMap.tsx`:

```tsx
import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { TOLA_MAP_ART } from "@/lib/tola-map-art";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import { ENTER } from "@/lib/motion";

const ART = { vann: VANN_MAP_ART, tola: TOLA_MAP_ART } as const;

/** What a mark on the map is, which decides how it is drawn and set. */
export type MapLabelKind = "gate" | "village" | "water" | "zone" | "road";

export type MapLabelCopy = {
  readonly text: string;
  /** Fractional position in the artwork's own box, 0–1. Transcribed by eye. */
  readonly x: number;
  readonly y: number;
  readonly kind: MapLabelKind;
};

export type MapLegendEntryCopy = {
  readonly swatch: "core" | "park" | "water" | "road" | "gate";
  readonly text: string;
};

export type PropertyMapCopy = {
  readonly heading: TwoTone;
  readonly art: keyof typeof ART;
  readonly labels: readonly MapLabelCopy[];
  /** The lodge itself — drawn as the brand's flower, not as a village dot. */
  readonly lodge: { readonly text: string; readonly x: number; readonly y: number };
  readonly legend: readonly MapLegendEntryCopy[];
  readonly gettingThere: readonly { readonly label: string; readonly value: string }[];
};

/** Region fills, in the cream palette. Gold carries no text — non-negotiable #7. */
const REGION = [
  { key: "park", fill: "var(--text)", opacity: 0.1 },
  { key: "core", fill: "var(--text)", opacity: 0.2 },
  { key: "water", fill: "var(--text)", opacity: 0.34 },
  { key: "road", fill: "var(--accent)", opacity: 0.95 },
] as const;

const SWATCH: Record<MapLegendEntryCopy["swatch"], { fill: string; opacity: number }> = {
  park: { fill: "var(--text)", opacity: 0.1 },
  core: { fill: "var(--text)", opacity: 0.2 },
  water: { fill: "var(--text)", opacity: 0.34 },
  road: { fill: "var(--accent)", opacity: 0.95 },
  gate: { fill: "var(--accent)", opacity: 0.95 },
};

/**
 * The park, drawn in the page's own ink.
 *
 * It answers "five kilometres from Turia Gate" the way the sentence cannot,
 * and it is the strongest thing distinguishing the two property pages from
 * each other — two different forests, drawn.
 *
 * **Static by construction.** No animation, so nothing to disable under
 * `prefers-reduced-motion`, and it renders identically with scripting off.
 * The region paths come from `lib/*-map-art.ts`, generated from the client's
 * artwork; every word on it comes from `content/`.
 */
export function PropertyMap({
  chapter,
  copy,
  surface = true,
}: {
  chapter: PropertyChapter;
  copy: PropertyMapCopy;
  surface?: boolean;
}) {
  const art = ART[copy.art];
  const { width, height } = art.viewBox;

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[14ch]" />
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
              <ul className="mt-8 space-y-2">
                {copy.legend.map((entry) => (
                  <li key={entry.text} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SWATCH[entry.swatch].fill, opacity: SWATCH[entry.swatch].opacity }}
                    />
                    <span
                      className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.18em]"
                      style={{ color: "var(--dim)" }}
                    >
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-8">
          <Enter delay={ENTER.stagger}>
            <figure>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`Map of ${copy.lodge.text} and the reserve around it`}
              >
                {REGION.map((r) => (
                  <path
                    key={r.key}
                    d={art.regions[r.key]}
                    fill={r.fill}
                    fillOpacity={r.opacity}
                    {...(r.key === "water"
                      ? { stroke: "var(--text)", strokeOpacity: 0.5, strokeWidth: 1.2 }
                      : {})}
                  />
                ))}

                {copy.labels.map((l) => (
                  <g key={`${l.text}-${l.x}`} transform={`translate(${l.x * width} ${l.y * height})`}>
                    {l.kind === "village" && <circle r="3" fill="var(--text)" />}
                    {l.kind === "gate" && <rect x="-4" y="-4" width="8" height="8" fill="var(--accent)" />}
                    {l.kind === "zone" && (
                      <rect x="-6" y="-6" width="12" height="12" fill="var(--accent)" fillOpacity="0.9" />
                    )}
                    <text
                      x={l.kind === "water" || l.kind === "road" ? 0 : 8}
                      y={l.kind === "water" || l.kind === "road" ? 0 : 4}
                      className="font-[family-name:var(--font-label)]"
                      fontSize={l.kind === "gate" ? 11 : 10}
                      letterSpacing="0.08em"
                      fill={l.kind === "water" ? "var(--dim)" : "var(--text)"}
                      fontStyle={l.kind === "water" ? "italic" : undefined}
                    >
                      {l.text}
                    </text>
                  </g>
                ))}

                {/* The lodge: a hairline ring where the client's artwork had an
                    orange callout. The mark is drawn, not the emblem raster —
                    at this size a 40px PNG would be the only bitmap on an
                    otherwise resolution-independent drawing. */}
                <g transform={`translate(${copy.lodge.x * width} ${copy.lodge.y * height})`}>
                  <circle r="13" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
                  <circle r="4.5" fill="var(--accent)" />
                  <text
                    x="19"
                    y="4"
                    className="font-[family-name:var(--font-label)]"
                    fontSize="12"
                    letterSpacing="0.14em"
                    fill="var(--text)"
                  >
                    {copy.lodge.text}
                  </text>
                </g>

                {/* North. A single hairline arrow, not a compass rose. */}
                <g transform={`translate(${width - 34} 30)`} stroke="var(--accent)" strokeWidth="1.2" fill="none">
                  <path d="M0 20 L0 -8 M-5 -2 L0 -8 L5 -2" />
                  <text
                    x="0"
                    y="34"
                    textAnchor="middle"
                    className="font-[family-name:var(--font-label)]"
                    fontSize="10"
                    letterSpacing="0.16em"
                    fill="var(--accent-text)"
                    stroke="none"
                  >
                    N
                  </text>
                </g>
              </svg>
            </figure>
          </Enter>
        </div>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/sections/PropertyMap.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/sections/PropertyMap.tsx components/sections/PropertyMap.test.tsx
git commit -m "feat: the park map band, drawn in the page's own ink

Region paths from the generated artwork; every label, gate, lake and
legend entry is copy passed in from content/. Static SVG, so it has no
motion to disable and renders identically with no JavaScript."
```

---

### Task 4: `OpeningColumn`

**Files:**
- Create: `components/sections/OpeningColumn.tsx`
- Create: `components/sections/OpeningColumn.test.tsx`

**Interfaces:**
- Produces: `OpeningColumn`, `OpeningColumnCopy` — consumed by Tasks 12, 13, 14.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpeningColumn, type OpeningColumnCopy } from "./OpeningColumn";

const COPY: OpeningColumnCopy = {
  heading: { text: "The forest Kipling never saw", dim: "never" },
  body: ["First paragraph.", "Second paragraph."],
};

describe("OpeningColumn", () => {
  it("sets every paragraph it is given", () => {
    const { getByText } = render(
      <OpeningColumn chapter={{ id: "vann-forest", shape: "column", media: [] }} copy={COPY} />,
    );
    expect(getByText("First paragraph.")).toBeTruthy();
    expect(getByText("Second paragraph.")).toBeTruthy();
  });

  it("carries no photograph at all", () => {
    // The point of the shape. It is the page's one held breath, and an image
    // creeping into it turns it into another ChapterIntro — which is the
    // section the redesign exists to stop repeating.
    const { container } = render(
      <OpeningColumn chapter={{ id: "vann-forest", shape: "column", media: [] }} copy={COPY} />,
    );
    expect(container.querySelectorAll("img, picture, svg")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/OpeningColumn.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type OpeningColumnCopy = {
  readonly heading: TwoTone;
  readonly body: readonly string[];
};

/**
 * One screen, bare cream, nothing but type.
 *
 * The page's one held breath, and what buys the right to be dense everywhere
 * else — restraint is a requirement here, not a preference (non-negotiable
 * #4). It carries no photograph on purpose: an image would make it a second
 * `ChapterIntro`, and a second anything is how these pages came to read as a
 * template.
 *
 * It is a quiet screen, so the rhythm rule (non-negotiable #10) requires
 * image-led shapes on both sides of it. Each spine places it between the
 * full-bleed hero and the map.
 */
export function OpeningColumn({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: OpeningColumnCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="mx-auto max-w-[62ch] text-center">
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} align="centre" />
            )}
            <TwoToneHeading heading={copy.heading} align="centre" className="mx-auto mt-7 max-w-[22ch]" />
          </div>
        </Enter>
        <Enter delay={ENTER.stagger}>
          <div className="mt-9 space-y-6">
            {copy.body.map((p) => (
              <p
                key={p.slice(0, 32)}
                className="font-[family-name:var(--font-body)] text-[1.08rem] leading-[1.8] md:text-lg"
                style={{ color: "var(--dim)" }}
              >
                {p}
              </p>
            ))}
          </div>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/sections/OpeningColumn.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/sections/OpeningColumn.tsx components/sections/OpeningColumn.test.tsx
git commit -m "feat: the opening column — one screen, bare cream, type only"
```

---

### Task 5: `RoomShowcase`

**Files:**
- Create: `components/sections/RoomShowcase.tsx`
- Create: `components/sections/RoomShowcase.test.tsx`
- Modify: `lib/sizes.test.ts`

**Interfaces:**
- Produces: `RoomShowcase`, `RoomShowcaseCopy`, `RoomEntryCopy`, `ROOM_SIZES`, `ROOM_BOXES` — consumed by Tasks 12, 13, 14.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomShowcase, type RoomShowcaseCopy } from "./RoomShowcase";

const COPY: RoomShowcaseCopy = {
  heading: { text: "Twenty-six rooms, three shapes", dim: "shapes" },
  intro: "All handmade in mud and local wood.",
  rooms: [
    { mediaId: "vann-room-deluxe", name: "Deluxe", line: "Thirteen of them.", facts: ["225 sq ft", "Queen", "Garden"], scale: "wide" },
    { mediaId: "suite-tiger-painting", name: "Cottage with Deck", line: "Eight, over the river.", facts: ["324 sq ft", "King", "River"], scale: "offsetRight" },
  ],
};

const chapter = { id: "vann-rooms", shape: "showcase", media: [] } as const;

describe("RoomShowcase", () => {
  it("sets each room's facts as one caption line, not a table", () => {
    // The specific defect this replaces: RoomsIndex drew Size/Bed/View as
    // three ruled <dt>/<dd> rows per room, four rooms deep. A datasheet is
    // not how a lodge sells a room.
    const { container, getByText } = render(<RoomShowcase chapter={chapter} copy={COPY} />);
    expect(container.querySelectorAll("dl, dt, dd")).toHaveLength(0);
    expect(getByText(/225 sq ft/)).toBeTruthy();
  });

  it("gives consecutive rooms different scales", () => {
    // Three photographs at one scale, mirrored left and right, is the
    // alternating band this replaces. The composition has to change.
    const scales = COPY.rooms.map((r) => r.scale);
    for (let i = 0; i < scales.length - 1; i++) {
      expect(scales[i], `rooms ${i} and ${i + 1} share a scale`).not.toBe(scales[i + 1]);
    }
  });

  it("names every room it is given", () => {
    const { getByText } = render(<RoomShowcase chapter={chapter} copy={COPY} />);
    expect(getByText("Deluxe")).toBeTruthy();
    expect(getByText("Cottage with Deck")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/RoomShowcase.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

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

/**
 * How much of the row a room's photograph claims.
 *
 * Three scales, not two, and no mirroring: the layout this replaces alternated
 * one band left and right and read as a ledger. Changing the *size* of the
 * photograph is what makes three rooms read as a composition.
 */
export type RoomScale = "wide" | "offsetRight" | "offsetLeft";

export type RoomEntryCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  /** One sentence. Not a description of the furniture. */
  readonly line: string;
  /** Set as a single letterspaced caption, joined by middots. */
  readonly facts: readonly string[];
  readonly scale: RoomScale;
  /** Only when this room shares a photograph with another — "Shown: Suite." */
  readonly note?: string;
};

export type RoomShowcaseCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly rooms: readonly RoomEntryCopy[];
};

/** Exported for `lib/sizes.test.ts`, like every other section's. */
export const ROOM_SIZES: Record<RoomScale, string> = {
  wide: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  offsetRight: "(min-width: 1600px) 860px, (min-width: 1024px) 56vw, calc(100vw - 48px)",
  offsetLeft: "(min-width: 1600px) 990px, (min-width: 1024px) 64vw, calc(100vw - 48px)",
};

export const ROOM_BOXES: Record<RoomScale, number> = {
  wide: 21 / 9,
  offsetRight: 4 / 3,
  offsetLeft: 3 / 2,
};

const FRAME: Record<RoomScale, string> = {
  wide: "aspect-[21/9]",
  offsetRight: "aspect-[4/3]",
  offsetLeft: "aspect-[3/2]",
};

/** Where the photograph and its words sit, per scale. */
const LAYOUT: Record<RoomScale, { photo: string; text: string }> = {
  wide: { photo: "lg:col-span-12", text: "lg:col-span-8" },
  offsetRight: { photo: "lg:col-span-7 lg:col-start-6 lg:order-2", text: "lg:col-span-4 lg:row-start-1" },
  offsetLeft: { photo: "lg:col-span-8", text: "lg:col-span-3 lg:col-start-10" },
};

/**
 * The rooms, shown rather than tabulated.
 *
 * `RoomsIndex`, which this replaces, drew Size / Bed / View as three ruled
 * rows per room type and repeated the band down the page. It measured 60.3%
 * and 53% empty against the 45% ceiling *and* read as a datasheet — the two
 * failures had one cause, which is that a table is neither dense nor
 * seductive. Here each room is a photograph at its own scale, one sentence,
 * and its facts as a single caption line.
 */
export function RoomShowcase({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: RoomShowcaseCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        <div className="mt-10 space-y-14 md:mt-12 lg:space-y-20">
          {copy.rooms.map((room) => (
            <div
              key={room.name}
              className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:items-end lg:gap-x-10"
            >
              <div className={LAYOUT[room.scale].photo}>
                <Enter>
                  <ImageReveal className={`block w-full ${FRAME[room.scale]}`}>
                    <Photo
                      id={room.mediaId}
                      sizes={ROOM_SIZES[room.scale]}
                      box={ROOM_BOXES[room.scale]}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                </Enter>
              </div>

              <div className={LAYOUT[room.scale].text}>
                <Enter delay={ENTER.stagger}>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-3xl">
                      {room.name}
                    </h3>
                    <p
                      className="mt-3 max-w-[42ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.7]"
                      style={{ color: "var(--dim)" }}
                    >
                      {room.line}
                    </p>
                    <p
                      className="mt-4 border-t pt-3 font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                      style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
                    >
                      {room.facts.join(" · ")}
                    </p>
                    {room.note && (
                      <p
                        className="mt-3 font-[family-name:var(--font-body)] text-xs italic"
                        style={{ color: "var(--dim)" }}
                      >
                        {room.note}
                      </p>
                    )}
                  </div>
                </Enter>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Register the new `sizes` strings**

In `lib/sizes.test.ts`, replace the `RoomsIndex` import and slot with:

```ts
import { ROOM_BOXES, ROOM_SIZES, type RoomScale } from "@/components/sections/RoomShowcase";
```

and, in `LIVE_SLOTS`, replace the `RoomsIndex.band` entry with:

```ts
  ...(["wide", "offsetRight", "offsetLeft"] as const).map((k: RoomScale) => ({
    name: `RoomShowcase.${k}`,
    sizes: ROOM_SIZES[k],
    box: ROOM_BOXES[k] as CoverBox,
  })),
```

Then run the suite and **set the distinct-string count to whatever it actually reports**, with a comment saying why it moved. Do not guess the number: `ROOM_SIZES.wide` repeats `PLATE_SIZES[1]` verbatim, so it adds a row and no distinct string, while the two offsets are new.

Add `components/sections/RoomShowcase.tsx` to the `CASES` list in the "cover boxes match the markup they describe" block, declaring `ROOM_BOXES`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/sections/RoomShowcase.test.tsx lib/sizes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/sections/RoomShowcase.tsx components/sections/RoomShowcase.test.tsx lib/sizes.test.ts
git commit -m "feat: show the rooms instead of tabulating them

Each room is a photograph at its own scale, one sentence, and its facts
as a single letterspaced caption. The three-ruled-rows-per-room table
this replaces measured 60% empty AND read as a datasheet; both failures
had the same cause."
```

---

### Task 6: `ExperiencePair`

**Files:**
- Create: `components/sections/ExperiencePair.tsx`
- Create: `components/sections/ExperiencePair.test.tsx`
- Modify: `lib/sizes.test.ts`

**Interfaces:**
- Produces: `ExperiencePair`, `ExperiencePairCopy`, `ExperienceCopy`, `EXPERIENCE_SIZES`, `EXPERIENCE_BOXES` — consumed by Tasks 12, 13, 14.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperiencePair, type ExperiencePairCopy } from "./ExperiencePair";

const COPY: ExperiencePairCopy = {
  heading: { text: "The day at Vann", dim: "day" },
  intro: "Morning and evening game drives.",
  experiences: [
    { mediaId: "vann-tiger", name: "Jungle Safari", line: "Open vehicles, before dawn.", weight: "hero" },
    { mediaId: "vann-kohka-lake", name: "Kohka Lake", line: "Still water at the forest's edge.", weight: "quiet" },
  ],
  alsoLine: "Also: cycling, swimming, karaoke, and a conference hall that seats forty.",
};

const chapter = { id: "vann-day", shape: "pair", media: [] } as const;

describe("ExperiencePair", () => {
  it("names every experience and sets its line", () => {
    const { getByText } = render(<ExperiencePair chapter={chapter} copy={COPY} />);
    expect(getByText("Jungle Safari")).toBeTruthy();
    expect(getByText("Still water at the forest's edge.")).toBeTruthy();
  });

  it("carries the also-line, so nothing is hidden from a planner", () => {
    // The client's ruling: the six that carry the brand get real space, and
    // karaoke and the conference hall are named honestly rather than deleted.
    const { getByText } = render(<ExperiencePair chapter={chapter} copy={COPY} />);
    expect(getByText(/conference hall that seats forty/)).toBeTruthy();
  });

  it("omits the also-line entirely when there is nothing left to name", () => {
    const { container } = render(
      <ExperiencePair chapter={chapter} copy={{ ...COPY, alsoLine: undefined }} />,
    );
    expect(container.textContent).not.toContain("Also:");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/ExperiencePair.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

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

/** `hero` takes the row; `quiet` sits in a pair with air around it. */
export type ExperienceWeight = "hero" | "quiet";

export type ExperienceCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  readonly line: string;
  readonly weight: ExperienceWeight;
};

export type ExperiencePairCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly experiences: readonly ExperienceCopy[];
  /**
   * The offerings that are real but do not set the tone — karaoke, the
   * conference hall, indoor games. Client's ruling, 9 Aug: name them
   * honestly, in one quiet line, rather than either promoting or deleting
   * them. Omitted entirely when a property has nothing left over.
   */
  readonly alsoLine?: string;
};

export const EXPERIENCE_SIZES: Record<ExperienceWeight, string> = {
  hero: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)",
  quiet: "(min-width: 1600px) 736px, (min-width: 640px) 50vw, calc(100vw - 48px)",
};

export const EXPERIENCE_BOXES: Record<ExperienceWeight, number> = { hero: 2 / 1, quiet: 4 / 5 };

const FRAME: Record<ExperienceWeight, string> = { hero: "aspect-[2/1]", quiet: "aspect-[4/5]" };

/**
 * The day, as six experiences at two weights.
 *
 * The two most cinematic take a full row; the rest sit in pairs, portrait, at
 * half the width. Two weights rather than one is the whole point — a grid of
 * six equal thumbnails is the live WordPress site's own tab widget, which is
 * what these pages are replacing.
 */
export function ExperiencePair({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: ExperiencePairCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
            </div>
          </Enter>
          <Enter delay={ENTER.stagger}>
            <p
              className="max-w-[58ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
              style={{ color: "var(--dim)" }}
            >
              {copy.intro}
            </p>
          </Enter>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-12 sm:grid-cols-2">
          {copy.experiences.map((e, i) => (
            <div key={e.name} className={e.weight === "hero" ? "sm:col-span-2" : ""}>
              <Enter delay={ENTER.stagger * (i % 2)}>
                <article>
                  <ImageReveal className={`block w-full ${FRAME[e.weight]}`}>
                    <Photo
                      id={e.mediaId}
                      sizes={EXPERIENCE_SIZES[e.weight]}
                      box={EXPERIENCE_BOXES[e.weight]}
                      pictureClassName="block h-full w-full"
                      className="h-full w-full object-cover"
                    />
                  </ImageReveal>
                  <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-light leading-tight text-[color:var(--text)] md:text-2xl">
                    {e.name}
                  </h3>
                  <p
                    className="mt-2 max-w-[46ch] font-[family-name:var(--font-body)] text-[1rem] leading-[1.7]"
                    style={{ color: "var(--dim)" }}
                  >
                    {e.line}
                  </p>
                </article>
              </Enter>
            </div>
          ))}
        </div>

        {copy.alsoLine && (
          <Enter>
            <p
              className="mt-12 max-w-[70ch] border-t pt-5 font-[family-name:var(--font-body)] text-sm italic"
              style={{ borderColor: "var(--accent)", color: "var(--dim)" }}
            >
              {copy.alsoLine}
            </p>
          </Enter>
        )}
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Register the new `sizes` strings**

Add to `lib/sizes.test.ts`'s imports and `LIVE_SLOTS` exactly as Task 5 did, with `EXPERIENCE_SIZES` / `EXPERIENCE_BOXES`, and add `components/sections/ExperiencePair.tsx` to the `CASES` list. Re-run and update the distinct-string count to what the suite reports, with a comment.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/sections/ExperiencePair.test.tsx lib/sizes.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/sections/ExperiencePair.tsx components/sections/ExperiencePair.test.tsx lib/sizes.test.ts
git commit -m "feat: the day, as six experiences at two weights

Two cinematic ones take a full row; the rest pair up portrait at half
width. Six equal thumbnails would be the live site's own tab widget.
The also-line names karaoke and the conference hall honestly without
letting them set the tone."
```

---

### Task 7: `PressBand`

**Files:**
- Create: `components/sections/PressBand.tsx`
- Create: `components/sections/PressBand.test.tsx`

**Interfaces:**
- Produces: `PressBand`, `PressBandCopy`, `PressArticleCopy` — consumed by Tasks 12, 14.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PressBand, type PressBandCopy } from "./PressBand";

const COPY: PressBandCopy = {
  heading: { text: "Written about", dim: "about" },
  articles: [
    {
      publication: "Condé Nast Traveller",
      headline: "Where to stay in Pench",
      standfirst: "From outdoor machans to luxury tents.",
      href: "https://www.cntraveller.in/story/where-to-stay-in-pench-national-park",
      linkLabel: "Read the article",
    },
  ],
};

describe("PressBand", () => {
  it("links out in a new tab, because it is somebody else's site", () => {
    const { container } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    const a = container.querySelector("a[href^='https://www.cntraveller.in']");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toContain("noreferrer");
  });

  it("carries the sliding hairline every link on this site carries", () => {
    // scripts/check_rule_in.mjs fails any link with neither `rule-in` nor an
    // explicit data-rule opt-out. Catching it here costs a second; catching
    // it in the browser rig costs a build and a server.
    const { container } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    for (const a of container.querySelectorAll("a[href]")) {
      expect(a.classList.contains("rule-in") || a.querySelector(".rule-in") !== null).toBe(true);
    }
  });

  it("names the publication and sets the headline", () => {
    const { getByText } = render(
      <PressBand chapter={{ id: "vann-press", shape: "press", media: [] }} copy={COPY} />,
    );
    expect(getByText("Condé Nast Traveller")).toBeTruthy();
    expect(getByText("Where to stay in Pench")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/PressBand.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";

export type PressArticleCopy = {
  readonly publication: string;
  readonly headline: string;
  readonly standfirst: string;
  readonly href: string;
  readonly linkLabel: string;
};

export type PressBandCopy = {
  readonly heading: TwoTone;
  readonly articles: readonly PressArticleCopy[];
};

/**
 * What other people have written, set quietly.
 *
 * The most credible thing on the page and it was not there at all until this
 * redesign — the live site carries three for Mahua Vann and the crawl had
 * them all along. Publication names are set as type rather than as logo
 * images: three foreign wordmarks in three foreign typefaces is the one thing
 * that would make a cream page look like a press kit.
 *
 * This shape is type-led and therefore counts as a *quiet* screen for the
 * rhythm rule — see `PROPERTY_IMAGE_LED_SHAPES`.
 */
export function PressBand({
  chapter,
  copy,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: PressBandCopy;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div>
        <Enter>
          <div>
            {chapter.number && chapter.label && (
              <ChapterMark number={chapter.number} label={chapter.label} />
            )}
            <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[16ch]" />
          </div>
        </Enter>

        <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:mt-12 lg:grid-cols-3">
          {copy.articles.map((article, i) => (
            <Enter key={article.href} delay={ENTER.stagger * i}>
              <article className="border-t pt-5" style={{ borderColor: "var(--accent)" }}>
                <p
                  className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
                  style={{ color: "var(--accent-text)" }}
                >
                  {article.publication}
                </p>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-light leading-snug text-[color:var(--text)]">
                  {article.headline}
                </h3>
                <p
                  className="mt-3 max-w-[44ch] font-[family-name:var(--font-body)] text-[0.98rem] leading-[1.7]"
                  style={{ color: "var(--dim)" }}
                >
                  {article.standfirst}
                </p>
                <a
                  href={article.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rule-in mt-5 inline-block pb-1 font-[family-name:var(--font-label)] text-[0.68rem] uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                  style={{ color: "var(--accent-text)" }}
                >
                  {article.linkLabel}
                </a>
              </article>
            </Enter>
          ))}
        </div>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/sections/PressBand.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/sections/PressBand.tsx components/sections/PressBand.test.tsx
git commit -m "feat: the press band — Condé Nast, Travel + Leisure, The Guardian

The most credible thing on the page, and it was in the crawl all along."
```

---

### Task 8: `PropertyInvitation`

**Files:**
- Create: `components/property/PropertyInvitation.tsx`
- Create: `components/property/PropertyInvitation.test.tsx`
- Modify: `lib/sizes.test.ts`

**Interfaces:**
- Produces: `PropertyInvitation`, `PropertyInvitationCopy`, `INVITATION_SIZES`, `INVITATION_BOX` — consumed by Tasks 12, 13, 14.

**Note:** this is a distinct file from `components/sections/Invitation.tsx`, which belongs to the home page and is neither modified nor reused.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PropertyInvitation, type PropertyInvitationCopy } from "./PropertyInvitation";

const COPY: PropertyInvitationCopy = {
  heading: { text: "Come and see it", dim: "see" },
  line: "Rooms from the river, and the gate five minutes away.",
  bookLabel: "Book Mahua Vann",
  contact: {
    phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
    email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
    address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
  },
  sibling: { mediaId: "tola-candlelit-dinner", label: "Looking for Tadoba instead? Mahua Tola" },
};

const props = {
  chapter: { id: "vann-invitation", shape: "invitation", media: ["tola-candlelit-dinner"] } as const,
  copy: COPY,
  bookHref: "https://asiatech.in/booking_engine/index3?token=ODM1MQ==",
  siblingHref: "/mahua-tola",
};

describe("PropertyInvitation", () => {
  it("carries a photograph, so it is not a second quiet screen", () => {
    // On Mahua Vann this sits directly after the type-led press band. Two
    // quiet screens in a row breaks the rhythm rule (non-negotiable #10),
    // which binds independently of the no-repeated-shape rule.
    const { container } = render(<PropertyInvitation {...props} />);
    expect(container.querySelectorAll("picture, img").length).toBeGreaterThan(0);
  });

  it("offers the booking and a way to reach a person", () => {
    const { getByText, container } = render(<PropertyInvitation {...props} />);
    expect(getByText("Book Mahua Vann")).toBeTruthy();
    // A real tel: link, not type that looks like a number — the whole reason
    // the client chose details over a form is that details cannot fail.
    expect(container.querySelector("a[href='tel:+918744867278']")).not.toBeNull();
  });

  it("sends Book out to the real engine, in a new tab", () => {
    const { container } = render(<PropertyInvitation {...props} />);
    const book = container.querySelector("a[href^='https://asiatech.in']");
    expect(book?.getAttribute("target")).toBe("_blank");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/property/PropertyInvitation.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
import { Enter } from "@/components/motion/Enter";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ContactBlock, type PropertyContactCopy } from "@/components/property/PropertyContact";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { Photo } from "@/components/ui/Photo";
import { PillButton } from "@/components/ui/PillButton";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import type { MediaId } from "@/lib/media";
import { ENTER } from "@/lib/motion";

export type PropertyInvitationCopy = {
  readonly heading: TwoTone;
  readonly line: string;
  readonly bookLabel: string;
  /** Phone, email and address — the enquiry route since the form was dropped. */
  readonly contact: PropertyContactCopy;
  /** The other lodge. A visitor leaving this page is choosing, not leaving. */
  readonly sibling: { readonly mediaId: MediaId; readonly label: string };
};

/** Exported for `lib/sizes.test.ts`. Full container width, 21:9. */
export const INVITATION_SIZES =
  "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)";
export const INVITATION_BOX = 21 / 9;

/**
 * The page's close, and its one unhurried ask.
 *
 * **It carries the sister lodge's photograph on purpose.** On Mahua Vann it
 * follows the type-led press band, and a quiet close after a quiet band would
 * break the rhythm rule while satisfying the shape rule — the two are
 * independent and both bind (see `content/property-chapters.ts`).
 *
 * Distinct from `components/sections/Invitation.tsx`, which closes the home
 * page and is not touched by this work.
 */
export function PropertyInvitation({
  chapter,
  copy,
  bookHref,
  siblingHref,
  surface = false,
}: {
  chapter: PropertyChapter;
  copy: PropertyInvitationCopy;
  bookHref: string;
  siblingHref: string;
  surface?: boolean;
}) {
  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <div className="lg:col-span-6">
          <Enter>
            <div>
              <TwoToneHeading heading={copy.heading} className="max-w-[14ch]" />
              <p
                className="mt-6 max-w-[46ch] font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.72] md:text-lg"
                style={{ color: "var(--dim)" }}
              >
                {copy.line}
              </p>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Enter delay={ENTER.stagger}>
            <div>
              <PillButton href={bookHref} size="large" external>
                {copy.bookLabel}
              </PillButton>
              <div className="mt-9">
                <ContactBlock copy={copy.contact} />
              </div>
            </div>
          </Enter>
        </div>
      </div>

      <div className="mt-12 md:mt-14">
        <Enter>
          <a
            href={siblingHref}
            className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
          >
            <ImageReveal className="block aspect-[21/9] w-full">
              <Photo
                id={copy.sibling.mediaId}
                sizes={INVITATION_SIZES}
                box={INVITATION_BOX}
                pictureClassName="block h-full w-full"
                className="h-full w-full object-cover"
              />
            </ImageReveal>
            <span
              className="rule-in rule-in--rest mt-5 inline-block pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em]"
              style={{ color: "var(--accent-text)" }}
            >
              {copy.sibling.label}
            </span>
          </a>
        </Enter>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Register the `sizes` string**

Add `INVITATION_SIZES` / `INVITATION_BOX` to `lib/sizes.test.ts`'s imports and `LIVE_SLOTS`, and add `components/property/PropertyInvitation.tsx` to `CASES`. Re-run and set the distinct-string count to what the suite reports. `INVITATION_SIZES` repeats `PLATE_SIZES[1]`, so expect a new row and no new distinct string.

Note that `lib/sizes.test.ts`'s "imports from every component that passes a sizes prop" test walks `components/` recursively, so `components/property/` is already covered by it.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run components/property/PropertyInvitation.test.tsx lib/sizes.test.ts`
Expected: FAIL on the missing `PropertyContact` module — that is Task 10. Write Task 10 next if executing in order, or accept the red until then. **Do not stub `ContactBlock`**; a stub that renders a phone number as inert text is exactly the silent failure the client chose real contact details to avoid.

- [ ] **Step 6: Commit after Task 10 is green**

```bash
git add components/property/PropertyInvitation.tsx components/property/PropertyInvitation.test.tsx lib/sizes.test.ts
git commit -m "feat: the property pages' closing invitation

Book, then the lodge's phone, email and address, then the sister lodge.
The photograph is not decoration: this follows the type-led press band
on Vann, and the rhythm rule forbids two quiet screens in a row
independently of the shape rule."
```

---

### Task 9: `PropertyBar`

**Files:**
- Create: `components/property/PropertyBar.tsx`
- Create: `components/property/PropertyBar.test.tsx`

**Interfaces:**
- Consumes: `ContactLine`, `PropertyContactCopy` (Task 10).
- Produces: `PropertyBar` — consumed by Task 14.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PropertyBar } from "./PropertyBar";

const props = {
  name: "Mahua Vann · Pench",
  bookHref: "https://asiatech.in/booking_engine/index3?token=ODM1MQ==",
  bookLabel: "Book",
  contact: {
    phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
    email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
    address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
  },
  heroId: "vann-hero",
  invitationId: "vann-invitation",
};

describe("PropertyBar", () => {
  it("does not exist until script says so", () => {
    // Fail towards absent — the welcome screen's contract (DECISIONS.md §14),
    // and the reason the same rule binds here: this is fixed chrome over the
    // page's content, so with no JavaScript, a thrown error, or a browser with
    // no IntersectionObserver it must be NOT THERE rather than permanently
    // parked over the copy.
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<PropertyBar {...props} />);
    expect(container.querySelector("[data-property-bar]")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("carries the property's name, the booking and the phone once shown", () => {
    const { getByText, container } = render(<PropertyBar {...props} shown />);
    expect(getByText("Mahua Vann · Pench")).toBeTruthy();
    expect(getByText("Book")).toBeTruthy();
    expect(container.querySelector("a[href='tel:+918744867278']")).not.toBeNull();
  });

  it("steps aside once the closing invitation is on screen", () => {
    // The ask must never be on screen twice at once. Driven here through the
    // observer callbacks rather than by scrolling, because jsdom has no
    // layout — the browser half of this is Task 15's own check.
    const observers: Array<(entries: { isIntersecting: boolean }[]) => void> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    // Both targets must exist for the component to observe them.
    document.body.innerHTML = `<div id="vann-hero"></div><div id="vann-invitation"></div>`;
    const { container } = render(<PropertyBar {...props} />);

    // Hero has left the viewport: the bar arrives.
    act(() => observers[0]([{ isIntersecting: false }]));
    expect(container.querySelector("[data-property-bar]")).not.toBeNull();

    // The invitation comes into view: the bar leaves again.
    act(() => observers[1]([{ isIntersecting: true }]));
    expect(container.querySelector("[data-property-bar]")).toBeNull();
  });
});
```

Import `act` from `react` alongside the testing-library imports.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/property/PropertyBar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ContactLine, type PropertyContactCopy } from "@/components/property/PropertyContact";
import { PillButton } from "@/components/ui/PillButton";

/**
 * The quiet, always-reachable ask.
 *
 * Client's ruling, 9 Aug: a visitor on a property page has already chosen a
 * lodge, so asking is fair here — "seduce, not convert" (non-negotiable #2)
 * governs the home page, which is where a visitor is still deciding.
 *
 * **It fails towards absent.** With no JavaScript, no `IntersectionObserver`,
 * or a thrown error, nothing renders at all. That is the welcome screen's
 * contract (`docs/DECISIONS.md` §14) and it binds anything fixed over the
 * page's content: a bar that cannot be dismissed and cannot be scrolled past
 * is a wall, and the failure mode of a wall must be non-existence.
 *
 * It steps aside over the closing invitation so the ask is never on screen
 * twice at once.
 *
 * `shown` is a test seam only — production always drives it from the two
 * observers below.
 */
export function PropertyBar({
  name,
  bookHref,
  bookLabel,
  contact,
  heroId,
  invitationId,
  shown,
}: {
  name: string;
  bookHref: string;
  bookLabel: string;
  contact: PropertyContactCopy;
  heroId: string;
  invitationId: string;
  shown?: boolean;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [atInvitation, setAtInvitation] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const watch = (id: string, set: (v: boolean) => void, whenVisible: boolean) => {
      const el = document.getElementById(id);
      if (!el) return () => {};
      const o = new IntersectionObserver(([e]) => set(e.isIntersecting === whenVisible), {
        threshold: 0,
      });
      o.observe(el);
      return () => o.disconnect();
    };
    const stopHero = watch(heroId, setPastHero, false);
    const stopInvitation = watch(invitationId, setAtInvitation, true);
    return () => {
      stopHero();
      stopInvitation();
    };
  }, [heroId, invitationId]);

  const visible = shown ?? (pastHero && !atInvitation);
  if (!visible) return null;

  return (
    <div
      data-property-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t"
      style={{ backgroundColor: "var(--bg)", borderColor: "var(--accent)" }}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3.5 md:px-12">
        <span
          className="truncate font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.22em]"
          style={{ color: "var(--dim)" }}
        >
          {name}
        </span>
        <div className="flex shrink-0 items-center gap-5">
          <ContactLine copy={contact} />
          <PillButton href={bookHref} external>
            {bookLabel}
          </PillButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/property/PropertyBar.test.tsx`
Expected: FAIL on the missing `PropertyContact` until Task 10 lands; PASS after.

- [ ] **Step 5: Commit after Task 10 is green**

```bash
git add components/property/PropertyBar.tsx components/property/PropertyBar.test.tsx
git commit -m "feat: the quiet persistent bar

Slides in past the hero, steps aside over the closing invitation, and
renders nothing at all without JavaScript — fixed chrome over content
must fail towards absent, the welcome screen's own contract."
```

---

### Task 10: `PropertyContact`

**Files:**
- Create: `components/property/PropertyContact.tsx`
- Create: `components/property/PropertyContact.test.tsx`

**Interfaces:**
- Produces: `ContactLine` (for the bar), `ContactBlock` (for the closing band), and `PropertyContactCopy` — consumed by Tasks 8, 9, 12, 13.

**Why this replaces the enquiry form.** The client removed the form on 9 Aug: *"we don't need an enquiry form, for the enquiries we can just share the contact details in the Website Directory section when we build it later."* The original problem is unchanged and still solved — a bare `mailto:` does nothing at all on a phone with no mail client configured, and the visitor believes they have written to us. A phone number shown as text always works. Nothing on these pages is now a control that can be pressed to no effect.

**Everything here is server-rendered and carries no JavaScript.** There is no state, no effect and no `"use client"`. That is the point: a `tel:` link works with scripting off, on every device, forever.

- [ ] **Step 1: Write the failing test**

Create `components/property/PropertyContact.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactBlock, ContactLine, type PropertyContactCopy } from "./PropertyContact";

const COPY: PropertyContactCopy = {
  phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
  email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
  address: { label: "Find us", value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881" },
};

describe("ContactLine", () => {
  it("is a real tel: link, not type that looks like one", () => {
    // The whole reason details were chosen over a form: they cannot fail. A
    // number rendered as inert text would look identical in a screenshot and
    // be useless on the device most visitors are holding.
    const { container } = render(<ContactLine copy={COPY} />);
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("tel:+918744867278");
    expect(a?.textContent).toContain("+91 87448 67278");
  });
});

describe("ContactBlock", () => {
  it("gives the phone and the email working links", () => {
    const { container } = render(<ContactBlock copy={COPY} />);
    expect(container.querySelector("a[href^='tel:']")).not.toBeNull();
    expect(container.querySelector("a[href^='mailto:']")).not.toBeNull();
  });

  it("sets the address as text, because an address is not a link", () => {
    const { getByText, container } = render(<ContactBlock copy={COPY} />);
    const address = getByText(/Village Kuppitola/);
    expect(address.closest("a")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(2);
  });

  it("labels every row, so the block scans without punctuation", () => {
    const { getByText } = render(<ContactBlock copy={COPY} />);
    expect(getByText("Speak to us")).toBeTruthy();
    expect(getByText("Write")).toBeTruthy();
    expect(getByText("Find us")).toBeTruthy();
  });

  it("carries the sliding hairline on every link it renders", () => {
    // scripts/check_rule_in.mjs fails any link carrying neither `rule-in` nor
    // an explicit data-rule opt-out. Catching it here costs a second; catching
    // it in the browser rig costs a build and a server.
    const { container } = render(<ContactBlock copy={COPY} />);
    for (const a of container.querySelectorAll("a[href]")) {
      expect(
        a.classList.contains("rule-in") || a.querySelector(".rule-in") !== null,
        `${a.getAttribute("href")} carries no rule`,
      ).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/property/PropertyContact.test.tsx`
Expected: FAIL — `./PropertyContact` does not exist.

- [ ] **Step 3: Write the component**

Create `components/property/PropertyContact.tsx`:

```tsx
import type { ReactNode } from "react";

export type ContactEntry = {
  readonly label: string;
  readonly value: string;
  /** Absent for the address: a postal address is not a link. */
  readonly href?: string;
};

export type PropertyContactCopy = {
  readonly phone: ContactEntry;
  readonly email: ContactEntry;
  readonly address: ContactEntry;
};

/**
 * The lodge's own details, shown plainly.
 *
 * This is what the enquiry form became when the client removed it on 9 Aug —
 * and it solves the original problem better than the form would have. The
 * defect being fixed was a bare `mailto:` that does nothing on a phone with
 * no mail client, leaving the visitor believing they had written to us. A
 * phone number that is a real `tel:` link works on every device, with
 * scripting off, with no third party involved and with nothing to sign up
 * for.
 *
 * No `"use client"`, no state, no effect. Deliberately.
 */
const LINK_CLASS =
  "rule-in inline-block pb-0.5 font-[family-name:var(--font-body)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]";

function Row({ entry }: { entry: ContactEntry }) {
  const body: ReactNode = entry.href ? (
    <a href={entry.href} className={LINK_CLASS} style={{ color: "var(--accent-text)" }}>
      {entry.value}
    </a>
  ) : (
    <span className="font-[family-name:var(--font-body)]" style={{ color: "var(--text)" }}>
      {entry.value}
    </span>
  );

  return (
    <div
      className="grid grid-cols-1 gap-x-6 border-t py-3 sm:grid-cols-[8rem_minmax(0,1fr)]"
      style={{ borderColor: "var(--accent)" }}
    >
      <span
        className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
        style={{ color: "var(--accent-text)" }}
      >
        {entry.label}
      </span>
      <span className="mt-1 text-[1.02rem] leading-relaxed sm:mt-0">{body}</span>
    </div>
  );
}

/** The closing band's contact set: phone, email, address. */
export function ContactBlock({ copy }: { copy: PropertyContactCopy }) {
  return (
    <div>
      <Row entry={copy.phone} />
      <Row entry={copy.email} />
      <Row entry={copy.address} />
    </div>
  );
}

/**
 * The bar's one line — the phone number, tappable.
 *
 * On an Indian phone this is the shortest route there is from wanting to stay
 * to speaking to somebody, which is why it sits beside Book rather than
 * behind anything.
 */
export function ContactLine({ copy }: { copy: PropertyContactCopy }) {
  return (
    <a
      href={copy.phone.href}
      className="rule-in hidden whitespace-nowrap pb-0.5 font-[family-name:var(--font-body)] text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)] sm:inline-block"
      style={{ color: "var(--accent-text)" }}
    >
      {copy.phone.value}
    </a>
  );
}
```

Note `hidden … sm:inline-block` on `ContactLine`: at 390px the bar carries the property's name and the booking pill already, and a third item turns it into two lines. The number is a tap away in the closing band on a phone, and the bar's job there is Book.

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/property/PropertyContact.test.tsx`
Expected: PASS, all five.

- [ ] **Step 5: Run the whole suite, build, lint**

Run: `npm test && npm run build && npm run lint`
Expected: all green. Tasks 8 and 9 can now be committed.

- [ ] **Step 6: Commit**

```bash
git add components/property/PropertyContact.tsx components/property/PropertyContact.test.tsx
git commit -m "feat: the lodge's contact details, which cannot fail

Replaces the enquiry form the client removed. The defect being fixed is
unchanged — a bare mailto: does nothing on a phone with no mail client
and the visitor believes they have written to us — and details solve it
better than a form would: a real tel: link works on every device, with
scripting off, with no third party and nothing to sign up for.

Server-rendered, no state, no effect, no 'use client'. Deliberately."
```

### Task 11: The newly-found photography

**Files:**
- Modify: `scripts/build_images.mjs`
- Modify (generated): `lib/media-manifest.ts`

- [ ] **Step 1: Look at every candidate before curating it**

Open each of these and write down what is actually in the frame:

- `reference/wp-media/property-pages/Mahua-Website-Images_TC.jpg` — the live site's own **Cottage without Deck** image. Its existence disproves the previous spec's claim that this room type had no photograph, and our shipped page says "Shown: Cottage with Deck" because of that claim.
- `reference/wp-media/property-pages/Mahua-Website-Images_Pench_Conference.jpg`

Filenames are not evidence: five alt texts on this branch described photographs they were not, and four "distinct" images turned out to be one photograph. This step is the guard.

- [ ] **Step 2: Append the entries to `CURATION`**

Add to the end of the `CURATION` array in `scripts/build_images.mjs`, correcting `orientation` and `fullBleedSafe` against what Step 1 actually measured:

```js
  {
    // The live Vann page's own Cottage-without-Deck tab image, found 9 Aug
    // 2026 in the same data-image attributes the first fetch read. The
    // previous spec recorded this room type as having no photograph
    // anywhere in the harvest; it does, and the page said "Shown: Cottage
    // with Deck" for a fortnight because nobody looked.
    id: "vann-room-cottage-plain",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_TC.jpg",
    alt: "A cottage at Mahua Vann — mud walls, a cane chair on the deck, and the forest through the glass.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
```

- [ ] **Step 3: Regenerate and check distinctness**

Run: `node scripts/build_images.mjs && npx vitest run lib/media.test.ts`
Expected: the new id encoded; the perceptual-hash duplicate guard passes. **If it flags `vann-room-cottage-plain` against an existing id, that is a true positive on real bytes** — drop the entry and keep the shared-photograph note rather than exempting the guard.

- [ ] **Step 4: Commit**

```bash
git add scripts/build_images.mjs lib/media-manifest.ts public/media/
git commit -m "feat: curate the Cottage without Deck photograph that existed all along

Found in the live page's own data-image attributes. The previous spec
recorded this room as having no photograph and the page carried a
'Shown: Cottage with Deck' note because of it."
```

---

### Task 12: Mahua Vann — spine, copy, tests

**Files:**
- Rewrite: `content/mahua-vann.ts`
- Rewrite: `content/mahua-vann.test.ts`

**Interfaces:**
- Produces: `VANN_CHAPTERS`, `VANN_COPY`, `VANN_NAV`, `VANN_BAR` — consumed by Task 14.
- Consumes: every copy type from Tasks 3–8.

- [ ] **Step 1: Write the spine**

Eight moments, in this order and with these shapes — the order is the spec's and the shapes must not repeat adjacently:

| id | number/label | shape | media |
|---|---|---|---|
| `vann-hero` | — | `fullBleed` | `["vann-hero"]` |
| `vann-forest` | 01 · The Forest | `column` | `[]` |
| `vann-where` | 02 · Where It Is | `map` | `[]` |
| `vann-rooms` | 03 · The Rooms | `showcase` | the three room photographs |
| `vann-table` | 04 · The Table | `fullBleed` | `["vann-dining"]` |
| `vann-day` | 05 · The Day | `pair` | the six experience photographs |
| `vann-press` | 06 · Written About | `press` | `[]` |
| `vann-invitation` | — | `invitation` | `["tola-candlelit-dinner"]` |

Check the shape sequence by hand before running anything: `fullBleed, column, map, showcase, fullBleed, pair, press, invitation` — no two adjacent alike, and `column` and `press` (the two quiet shapes) are each flanked by image-led ones.

- [ ] **Step 2: Write the copy**

Carry over verbatim from the current `content/mahua-vann.ts` where the words already work — the Kipling/Kohka/Pachdhar paragraphs, the dining intro naming Chulai ki Bhaaji and Mahua Kheer, the rooms intro. New copy needed for:

- **The six experiences**, adapted from `reference/site-copy.md`'s Vann section into one sentence each: Jungle Safari, Visit to Kohka Lake, Bird Watching (name the **37-acre private eco park** — specificity is the brand's luxury), Candle Light Bush Dinner, Visit to Potter's Village (name **Pachdhar** and the **100+ Kumhar families**), Serene Nature Walk.
- **The also-line**, naming cycling, swimming, indoor and outdoor games, karaoke, and the conference hall.
- **The three press entries**, with the real headlines, standfirsts and URLs from `reference/wp-pages/resorts_mahua-vann.html` — Condé Nast Traveller, Travel + Leisure, The Guardian.
- **The map's labels**, transcribed from `reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg` by the method in Task 13 Step 2 (identical procedure; it is written out there).
- **The invitation's line and the bar's labels.**

Two rules that bind this copy specifically:

- **Nagpur's distance is not claimed.** The live site says 80 km, the brand record 104–112. The getting-there row reads `{ label: "By air or train", value: "Nagpur, then by road to Khawasa" }`.
- **The room facts arrays** carry the live site's own figures: Deluxe `["225 sq ft", "Queen bed", "Garden and jungle view"]`, Cottage without Deck and Cottage with Deck both `["324 sq ft", "King bed, private sit-out", …]` with their own views.

The shape of the new copy, written out so there is nothing to infer — the six
experiences and the map follow this exactly:

```ts
export const VANN_COPY: PropertyPageCopy = {
  // …heroCopy and columnCopy carried over…

  mapCopy: {
    "vann-where": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      art: "vann",
      // x and y are fractions of the artwork's own box, transcribed from
      // reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg by
      // the method in Task 13 Step 2. Every one is checked by test.
      labels: [
        { text: "Turia Gate", x: 0.61, y: 0.63, kind: "gate" },
        { text: "Karmajhiri Gate", x: 0.62, y: 0.42, kind: "gate" },
        { text: "Jamtara Gate", x: 0.4, y: 0.36, kind: "gate" },
        { text: "Pench Reservoir", x: 0.36, y: 0.6, kind: "water" },
        { text: "Pench River", x: 0.53, y: 0.11, kind: "water" },
        // …the villages, as kind: "village"; the road destinations as "road"…
      ],
      lodge: { text: "Mahua Vann", x: 0.69, y: 0.63 },
      legend: [
        { swatch: "core", text: "Core area" },
        { swatch: "park", text: "Buffer zone" },
        { swatch: "water", text: "Water" },
        { swatch: "road", text: "Main road" },
        { swatch: "gate", text: "Park entry gate" },
      ],
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Khawasa" },
        { label: "By road", value: "Khawasa Bus Stop, 8 km" },
        { label: "From the gate", value: "Five kilometres from Turia Gate" },
      ],
    },
  },

  pairCopy: {
    "vann-day": {
      heading: { text: "The day at Vann", dim: "day" },
      intro:
        "Morning and evening game drives, birdwatching in the lodge's own private eco park, " +
        "and a quieter afternoon at Kohka Lake or the Pachdhar potters' wheel.",
      experiences: [
        {
          mediaId: "vann-tiger",
          name: "Jungle Safari",
          line: "Open vehicles through Turia Gate at first light, with the naturalists who know this forest.",
          weight: "hero",
        },
        {
          mediaId: "vann-kohka-lake",
          name: "Kohka Lake",
          line: "Still water at the forest's edge, where the birds come down as the day does.",
          weight: "quiet",
        },
        {
          mediaId: "vann-bird-watching",
          name: "Bird Watching",
          line: "Thirty-seven acres of private eco park, and a guide who can name what is calling.",
          weight: "quiet",
        },
        {
          mediaId: "vann-dining",
          name: "Candlelight Bush Dinner",
          line: "A table laid in an open space in the forest, and the stars coming out over it.",
          weight: "hero",
        },
        {
          mediaId: "vann-potters-village",
          name: "The Potters of Pachdhar",
          line: "More than a hundred Kumhar families have kept the wheel turning here. Sit down at one.",
          weight: "quiet",
        },
        {
          mediaId: "vann-pool",
          name: "Serene Nature Walk",
          line: "No vehicle, no schedule — earthy air, dappled light, and whatever the woods are saying.",
          weight: "quiet",
        },
      ],
      alsoLine:
        "Also: cycling the estate's trails, swimming, table tennis and carrom, karaoke, " +
        "and a conference hall that seats forty.",
    },
  },

  pressCopy: {
    "vann-press": {
      heading: { text: "Written about", dim: "about" },
      articles: [
        {
          publication: "Condé Nast Traveller",
          headline: "Where to stay in Pench",
          standfirst: "From outdoor machans to luxury tents, the best properties to explore the wilderness.",
          href: "https://www.cntraveller.in/story/where-to-stay-in-pench-national-park-baghvan-taj-safari-jamatara-to",
          linkLabel: "Read the article",
        },
        // …Travel + Leisure and The Guardian, headlines/standfirsts/URLs
        //   copied verbatim from reference/wp-pages/resorts_mahua-vann.html…
      ],
    },
  },
};
```

**The `vann-pool` id against "Serene Nature Walk" above is a stand-in and must be
checked.** The live site pairs that experience with `RAG1474-scaled.jpg`. Either
curate that file in Task 11 or pick a photograph that honestly shows a walk —
do not caption the pool as a forest path. Five alt texts on this branch already
described photographs they were not.

Also export the bar's copy and the lodge's contact details. **The phone number's
`href` must be the digits with no spaces** — `tel:+918744867278` — while its
`value` is the readable form; a `tel:` with spaces in it fails silently on some
Android dialers, which is precisely the failure mode this replaced a form to
avoid.

```ts
export const VANN_CONTACT: PropertyContactCopy = {
  phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
  email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
  address: {
    label: "Find us",
    value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881",
  },
};

export const VANN_BAR = {
  name: "Mahua Vann · Pench",
  bookLabel: "Book",
};
```

`VANN_COPY.invitationCopy["vann-invitation"].contact` takes `VANN_CONTACT`, and
so does the bar — one definition, two places, so the number can never disagree
with itself.

- [ ] **Step 3: Write the tests**

Rewrite `content/mahua-vann.test.ts` keeping every existing assertion that still applies (unique ids, real images, full-bleed safety, chapter numbering, the copy-to-spine join, the shared-photo note rule) and **replacing the kind-based ones with shape-based ones**. Add these two:

```ts
import { findRepeatedShape, PROPERTY_IMAGE_LED_SHAPES } from "./property-chapters";

  it("never runs two moments of the same shape back to back", () => {
    // The rule the whole redesign turns on. The pages this replaced opened
    // three consecutive sections with the identical move, and the client's
    // word for the result was "templaty".
    const repeat = findRepeatedShape(VANN_CHAPTERS);
    expect(
      repeat && `"${repeat.first}" and "${repeat.second}" are both ${repeat.shape}`,
    ).toBeUndefined();
  });

  it("never runs two quiet screens back to back", () => {
    // Independent of the rule above and equally binding: `column` and `press`
    // are both type-led, so a spine could satisfy the shape rule and still
    // put two silent screens together.
    for (let i = 0; i < VANN_CHAPTERS.length - 1; i++) {
      const a = PROPERTY_IMAGE_LED_SHAPES.includes(VANN_CHAPTERS[i].shape);
      const b = PROPERTY_IMAGE_LED_SHAPES.includes(VANN_CHAPTERS[i + 1].shape);
      expect(a || b, `"${VANN_CHAPTERS[i].id}" and "${VANN_CHAPTERS[i + 1].id}" are both quiet`).toBe(true);
    }
  });

  it("places every map label inside the artwork", () => {
    const map = VANN_COPY.mapCopy?.["vann-where"];
    expect(map, "no map copy").toBeDefined();
    for (const l of [...(map?.labels ?? []), map!.lodge]) {
      expect(l.x, `${l.text} x`).toBeGreaterThanOrEqual(0);
      expect(l.x, `${l.text} x`).toBeLessThanOrEqual(1);
      expect(l.y, `${l.text} y`).toBeGreaterThanOrEqual(0);
      expect(l.y, `${l.text} y`).toBeLessThanOrEqual(1);
    }
  });
```

- [ ] **Step 4: Watch the shape rule fail**

Temporarily change `vann-table`'s shape from `fullBleed` to `showcase` (making it adjacent to `vann-rooms`). Run `npx vitest run content/mahua-vann.test.ts`.
Expected: FAIL, naming `"vann-rooms" and "vann-table" are both showcase`. Restore `fullBleed` and confirm green.

- [ ] **Step 5: Run tests, type-check, lint**

Run: `npx vitest run content/ && npx tsc --noEmit && npm run lint`
Expected: `tsc` still fails on `PropertyPage` and the routes until Task 14. Vitest and lint clean.

- [ ] **Step 6: Commit**

```bash
git add content/mahua-vann.ts content/mahua-vann.test.ts
git commit -m "feat: Mahua Vann's spine and copy, in the new shape vocabulary

Eight moments, no two adjacent alike, guarded by a test that has been
watched failing. Six named experiences with the eco park's 37 acres and
Pachdhar's hundred potter families; the three press mentions; the map's
labels. Nagpur is named and its distance is not claimed."
```

---

### Task 13: Mahua Tola — spine, copy, tests

**Files:**
- Rewrite: `content/mahua-tola.ts`
- Rewrite: `content/mahua-tola.test.ts`

**Interfaces:**
- Produces: `TOLA_CHAPTERS`, `TOLA_COPY`, `TOLA_NAV`, `TOLA_BAR`, `TOLA_CONTACT` — consumed by Task 14.

- [ ] **Step 1: Write the spine — deliberately not Vann's**

| id | number/label | shape | media |
|---|---|---|---|
| `tola-hero` | — | `fullBleed` | `["tola-hero"]` |
| `tola-reserve` | 01 · The Reserve | `column` | `[]` |
| `tola-where` | 02 · Where It Is | `map` | `[]` |
| `tola-guest-word` | — | `fullBleed` | `["tola-guest-word"]` |
| `tola-rooms` | 03 · The Rooms | `showcase` | the room photographs |
| `tola-table` | 04 · The Table | `fullBleed` | `["tola-dining"]` |
| `tola-day` | 05 · The Day | `pair` | the six experience photographs |
| `tola-invitation` | — | `invitation` | `["vann-hero"]` |

Check the sequence: `fullBleed, column, map, fullBleed, showcase, fullBleed, pair, invitation` — no adjacent repeats. **No press band**: Tola has no press mentions and inventing parity would be inventing content.

**`01 · The Reserve` must not reuse Vann's headline.** Both pages shipped with "Five kilometres from the gate" as chapter 01, which is the single clearest evidence a visitor has that they are looking at a template. Tola's opens on Tadoba's density and the Hattinala.

- [ ] **Step 2: Transcribe the map's labels**

Open `reference/wp-media/property-pages/Mahua-website_Tola-tadoba-map2.jpg` at 1:1. For each mark, read the pixel coordinate of its anchor point and divide: `x = px / mapRight`, `y = py / height`, using the same `mapRight` set in `scripts/build_map.mjs` and the artwork's full height. Record as `{ text, x, y, kind }`.

Transcribe, at minimum: the gates the artwork marks in bold beside a gate glyph; **Tadoba, Jamni, Teliya and Pandharpauni lakes** and the **Irai Dam Backwaters** as `kind: "water"`; the four numbered safari zones as `kind: "zone"`; and the road destinations (Chimur, Umred, Nagpur, Chandrapur) as `kind: "road"`. The lodge sits beside Kolara — that is where the artwork's "We're here!" callout points.

**Read the names off the artwork, not from memory.** Village and gate names in Tadoba are easy to half-remember wrongly, and a misspelled village on a map that exists to prove local knowledge is worse than no map.

Do the same for Vann in Task 12 if it was deferred: Turia, Karmajhiri and Jamtara gates, the Pench River and Pench Reservoir, Totladoh Dam, and the villages.

- [ ] **Step 3: Write the copy**

Carry over what works from the current file. New copy for the six experiences — Tiger Safari, River Walk (the Hattinala), Village Walk & Bamboo Crafts Market, Bonfire, Candle Light Dinner, Swimming — one sentence each, and an also-line naming wildlife documentaries and indoor/outdoor games.

Three rules bind this copy:

- **Room count stays twelve**, the live site's own structured list, with the brand record's fourteen flagged in a comment as unconfirmed. Do not guess.
- **Tiger density stays comparative.** The live site's "115 tigers" and "highest Sighting Rating Index in the country" are numbers that will date; the home page already softened the same claim.
- **The guest quote stays byte-identical** to `content/home.ts`'s Vedant entry, and its test comes across unchanged.

Export `TOLA_BAR` in the same shape as `VANN_BAR`, with `name: "Mahua Tola · Tadoba"`, and `TOLA_CONTACT` in the same shape as `VANN_CONTACT` — the same phone and email (the brand publishes one of each), with Tola's own address: `Village – Adegaon Tehsil – Chimur TATR, Maharashtra 442904`.

- [ ] **Step 4: Write the tests**

Same set as Task 12 Step 3, against `TOLA_CHAPTERS` / `TOLA_COPY`, plus the existing guest-quote test carried over verbatim, plus:

```ts
  it("does not reuse Mahua Vann's opening headline", () => {
    // Both pages shipped on 9 Aug with "Five kilometres from the gate" as
    // chapter 01. Nothing tells a visitor they are reading a template faster
    // than two properties introducing themselves in the same words.
    expect(TOLA_COPY.columnCopy?.["tola-reserve"]?.heading.text).not.toBe(
      VANN_COPY.columnCopy?.["vann-forest"]?.heading.text,
    );
  });
```

- [ ] **Step 5: Run tests, type-check, lint**

Run: `npx vitest run content/ && npm run lint`
Expected: green. `npx tsc --noEmit` still fails on `PropertyPage` and the routes until Task 14.

- [ ] **Step 6: Commit**

```bash
git add content/mahua-tola.ts content/mahua-tola.test.ts
git commit -m "feat: Mahua Tola's spine and copy — a different page, not a mirror

Eight moments in a different order from Vann's: a guest's word where
Vann has a press band, and its own opening headline. Both pages shipped
with the same chapter 01 heading, which is the clearest evidence a
visitor could have that they were reading a template.

Room count stays at the live site's twelve; the brand record's fourteen
is flagged, not guessed."
```

---

### Task 14: The dispatcher, the routes, and the retirement

**Files:**
- Rewrite: `components/property/PropertyPage.tsx`
- Modify: `app/mahua-vann/page.tsx`, `app/mahua-tola/page.tsx`
- Delete: `components/sections/RoomsIndex.tsx`, `components/sections/FieldNotes.tsx`

- [ ] **Step 1: Rewrite the dispatcher**

`PropertyPage` takes `chapters`, `copy`, `scrim`, `bookHref`, `bar`, `nav`, `siblingHref`, and dispatches on `chapter.shape` with an exhaustive `switch` whose `default` branch assigns to `const unhandled: never = chapter.shape` — so a new shape added to the union without a renderer is a compile error, not a runtime one.

`copy` becomes:

```ts
export type PropertyPageCopy = {
  readonly heroCopy?: HeroCopy;
  readonly columnCopy?: Record<string, OpeningColumnCopy>;
  readonly mapCopy?: Record<string, PropertyMapCopy>;
  readonly showcaseCopy?: Record<string, RoomShowcaseCopy>;
  readonly pairCopy?: Record<string, ExperiencePairCopy>;
  readonly pressCopy?: Record<string, PressBandCopy>;
  readonly quoteCopy?: Record<string, FullBleedQuoteCopy>;
  readonly invitationCopy?: Record<string, PropertyInvitationCopy>;
};
```

`fullBleed` covers two different jobs — the hero and a quote over a photograph. Dispatch on whether `quoteCopy` has an entry for the chapter id: with one it renders `FullBleedQuote`, without one and at index 0 it renders `Hero`, and otherwise a `FullBleed` photograph with the chapter's own heading. Every branch that finds no copy must `throw` naming the chapter id, exactly as the current dispatcher does — no silent fallbacks.

Mount `PropertyBar` after `</main>`, passing `heroId={chapters[0].id}`, `invitationId` = the last chapter's id, and the property's `contact` copy.

Keep the existing cream-alternation counter, but count only shapes that sit on cream: `column`, `map`, `showcase`, `pair`, `press`, `invitation`.

- [ ] **Step 2: Update both routes**

Each route passes its own `chapters`, `copy`, `scrim`, `bookHref`, `bar`, `nav`, `siblingHref`. Keep the measured hero scrims exactly as they are — `{ top: 0.92, bottom: 0.78, corner: 0.88 }` for Vann, `{ top: 0.92, bottom: 0.6, corner: 0.85, flat: 0.12 }` and the quote's `{ flat: 0.36, centre: 0.42 }` for Tola — and re-measure them in Task 15 rather than assuming they survive the new compositions.

- [ ] **Step 3: Delete the retired components**

```bash
git rm components/sections/RoomsIndex.tsx components/sections/FieldNotes.tsx
```

Confirm by build, not by assumption, that nothing else imported them:

Run: `npx tsc --noEmit`
Expected: clean. Any error naming those modules is a real remaining importer.

- [ ] **Step 4: Full gate**

Run: `npm test && npm run build && npm run lint`
Expected: all green.

- [ ] **Step 5: Look at the real pages**

Run `npm run dev`, open `/mahua-vann` and `/mahua-tola` at 390, 768, 1440 and 1920px. Confirm: the bar appears after the hero and disappears over the invitation; `Enquire` opens the panel in place and `Escape` closes it; the maps render with continuous roads and labels inside the artwork; no section repeats the shape above it.

- [ ] **Step 6: Commit**

```bash
git add -A components/property app/mahua-vann app/mahua-tola components/sections
git commit -m "feat: render both property pages from the shape vocabulary

The dispatcher switches on shape with an exhaustive never-check, so a
shape without a renderer is a compile error. RoomsIndex and FieldNotes
are retired; nothing else imported them and the build proves it."
```

---

### Task 15: Whole-branch verification and evidence

**Files:**
- Create: `docs/reviews/2026-08-09-property-redesign/` (JSON artefacts, screenshots, README)
- Modify: `docs/PROJECT-STATE.md`, `docs/DECISIONS.md`, `CLAUDE.md`

- [ ] **Step 1: Add the new contrast probes**

`scripts/check_contrast_over_photos.mjs` is route-aware already. Update each property route's probe set for the new section ids (`#vann-where` in place of `#vann-rooms` as the scrolled-header anchor is not required — pick a chapter where the header sits over a photograph if one exists, and say plainly in a comment if it does not), and add a probe for any type now set over a photograph.

- [ ] **Step 2: Build, serve, measure**

```bash
npm run build
npx next start -p 3100 &
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-density.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-density.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-contrast.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-contrast.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-rule-in.json
node scripts/check_rule_in.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-rule-in.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-page.json
node scripts/measure_page.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-page.json
node scripts/measure_js_budget.mjs --port 3100 --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-09-property-redesign/vann-js-budget.json
node scripts/measure_js_budget.mjs --port 3100 --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-09-property-redesign/tola-js-budget.json
```

**Kill any process already holding 3100 first**, and restart the server after every rebuild — a stale `next start` has produced two rounds of fictional numbers on this project, most recently on 9 Aug when identical-to-the-pixel contrast figures gave it away.

Expected: every chapter inside the 45% ceiling; every contrast probe passing; rule-in passing; first-load JS inside 175 KB. **The enquiry panel and the bar are client components — confirm they have not pushed the first load over.** If density fails, take width and height back from the offending section; never pad.

- [ ] **Step 3: Regression-check the home page**

```bash
node scripts/check_pinned_collage.mjs --port 3100
node scripts/check_entrances.mjs --port 3100
node scripts/measure_js_budget.mjs --port 3100
```

Expected: all pass, unchanged. This work must not have touched the home page.

- [ ] **Step 4: Screenshot and look**

Run: `node scripts/capture_property_pages.mjs --port 3100 --out docs/reviews/2026-08-09-property-redesign`
Then open all eight. Automated rigs cannot judge whether a page feels expensive; this step is the one that can.

- [ ] **Step 5: Write the evidence README**

`docs/reviews/2026-08-09-property-redesign/README.md`: the density figures for both pages, the contrast figures, transfer and JS budget, links to every artefact and screenshot, and the items still open with the client (Tola's room count and the Nagpur distance).

- [ ] **Step 6: Update the durable record**

- `docs/DECISIONS.md` §1: a row for 9 Aug — the redesign, why, and the three client rulings (persistent bar, six experiences with an also-line, a real enquiry form).
- `docs/DECISIONS.md` §2: any new instance the build found of a check confirming a mechanism rather than a behaviour.
- `docs/PROJECT-STATE.md`: Plan 7 complete, the new component inventory, what is owed.
- `CLAUDE.md`: the status table, the test count, and `node scripts/build_map.mjs` in the commands list.

- [ ] **Step 7: Final commit**

```bash
git add docs/ CLAUDE.md scripts/check_contrast_over_photos.mjs
git commit -m "docs: close out the property pages redesign with evidence

Density, contrast, rule-in, transfer and JS budget re-derived at both
real routes, plus home-page regression checks proving the pin and the
entrances are untouched. Eight screenshots, all looked at."
```

---

## What this plan deliberately does not do

- **Does not touch the home page.** Its components, spine and copy are unchanged; Task 15 Step 3 proves it.
- **Does not build the India locator map.** Fetched and available, but a second map on one page is repetition of the kind this redesign removes (spec §11).
- **Does not wire Tripadvisor, restyle the booking engine, or touch the SEO redirect map** — all still out of scope.
- **Does not resolve Tola's room count or the Nagpur distance.** Both are flagged in copy comments and in the evidence README, for the client to settle.
