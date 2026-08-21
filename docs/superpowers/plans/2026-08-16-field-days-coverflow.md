# `04 · Days in the Field` as a coverflow — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace `field-days`' three static bands with a pinned coverflow — six activity cards advancing on
the visitor's own scroll, the neighbours behind and to either side — at zero added JavaScript, and leave the
chapter denser and shorter than it is today.

**Architecture:** A tall, non-sticky wrapper carries the reserved scroll and *declares* a named
`view-timeline`; its sticky child is the stage that holds still. Each card reads that named timeline through
`timeline-scope` and runs one keyframe set (off-right → behind-right → centre → behind-left → off-left) over
its own `animation-range` window, offset by index. Arrows are `<a href="#…">` to zero-size targets placed at
the scroll offsets where each card is centred, so arrows and scrolling drive **one** mechanism rather than
competing for a position. Every part is CSS.

**Tech Stack:** Next.js 16 (React 19, server components), Tailwind v4, CSS scroll-driven animations
(`view-timeline-name` / `timeline-scope` / `animation-range`), vitest, Playwright-driven measurement rigs.

**Spec:** [`docs/superpowers/specs/2026-08-16-field-days-coverflow-design.md`](../specs/2026-08-16-field-days-coverflow-design.md)
— approved by the client 16 Aug 2026.

---

## Two corrections to the approved spec, made before any code

Both were found reading the code the spec describes. Neither changes what the client approved; both change
what the implementer must do.

### A. "Six photographs and six activities, one-to-one" is a count match, not a semantic one

The spec's §1 says the material is already right. It is not, in two places, and a coverflow exposes it in a
way three prose bands did not: today the six photographs sit *near* the index of activities, and nothing
claims any particular photograph *is* any particular activity. A card puts a photograph and an activity's
name in one box, so the pairing becomes a claim.

Two of the six activities name a specific place that the chapter's own photographs contradict:

| Activity | Nearest existing frame | Problem |
|---|---|---|
| **Kohka Lake** — "an hour at the water near Pench" | `pool-daylight-forest` | That is the lodge's swimming pool. Captioning it "Kohka Lake" is a false claim about a named place. |
| **Pachdhar, the potters' village** — "more than a hundred Kumhar families" | none | No frame in this chapter is of a village or a potter. `potters-hands` exists but belongs to `02 · Rooted`, so reusing it duplicates a photograph *within* the home page. |

The library already holds exact frames — `vann-kohka-lake`, `vann-potters-village`, `vann-bird-watching` —
curated, encoded and in `lib/media-manifest.ts` today. They cost no new bytes and no new curation. **They are
already used on `/mahua-vann`**, so the home page would repeat three photographs the property page also
shows. That is the trade, and it is the client's to confirm; it does not block the build.

**The pairing this plan implements** (Task 3 writes it into `content/home.ts`):

| # | Activity | Photograph | Source |
|---|---|---|---|
| 1 | Jungle safari | `tiger-crossing-track` | already in the chapter |
| 2 | Bird watching | `vann-bird-watching` | **new to the home page** |
| 3 | Kohka Lake | `vann-kohka-lake` | **new to the home page** |
| 4 | The river walk | `forest-boardwalk-daylight` | already in the chapter |
| 5 | Pachdhar, the potters' village | `vann-potters-village` | **new to the home page** |
| 6 | Walks and cycling | `forest-trail-canopy` | already in the chapter |

The three frames the cards no longer use — `guide-sunrise`, `hammocks-shade`, `pool-daylight-forest` — **stay
in the chapter**, in the header band above the stage. They carry the chapter's two written beats (the dawn
gate, and "then the day slows right down"), which are the client's own copy and must not be dropped to make
room for a carousel. The chapter goes from six photographs to nine.

**Settled by the client, 16 Aug 2026:** he chose the right photographs and accepted the repeat. Build the
pairing above. The review still records the trade — three frames now appear on both the home page and
`/mahua-vann` — as a decision taken, not as a question outstanding.

### C. The card is a photograph with its words on it — client, 16 Aug 2026

*"Can we make them like section between the 01-The Lodges and 02-Rooted Like The Mahua, where we have an
image with text on it with 3D effect."*

That section is `why-you-came` — `components/sections/FullBleedQuote.tsx`. **This supersedes spec §5's
photo-above-text card**, which was never built. Spec §5a records it and why it is the better shape. Two
consequences run through this plan:

1. **Every card needs its own solved `ScrimStrength`.** Six photographs, six exposures, six figures — each
   raised until the *worst single pixel* under the type clears its floor, and each with its own run in
   `scripts/check_contrast_over_photos.mjs`. That rig's `RUNS` table is hand-written; it discovers nothing.
   A card absent from it is a card nobody has checked. The figures live in `components/sections/Coverflow.tsx`
   keyed by `MediaId` — **not in `content/`**, which holds copy, and not in `lib/coverflow.ts`, which imports
   nothing from `components/`.
2. **A neighbour recedes by veil, not by opacity.** `COVERFLOW.sideDim` is gone. Dimming a card whose text
   sits on its own photograph lowers that text's contrast against the frame beneath it — the depth cue would
   be fighting the legibility floor. `COVERFLOW.sideVeil` adds scrim to a neighbour instead, which recedes
   the photograph and *raises* cream type's contrast. Scale and shift are unchanged.

### B. The tiger cannot go inside the sticky stage

`field-days` closes with the tiger film (non-negotiable #5, `DECISIONS.md` §9), passed today through
`SplitFeature`'s `footer` slot. The film's white ground is removed by `mix-blend-mode: darken` against the
cream — `scripts/check_films.mjs` asserts it **as pixels**, and `DECISIONS.md` §14 records that a stacking
context between the film and the cream is what breaks it.

`position: sticky` creates a stacking context. So a film inside `.coverflow-stage` would blend against the
stage's own (transparent) backdrop rather than the section's cream, and the white box would come back.

**The tiger therefore hangs off the tall wrapper, not the stage** — absolutely positioned at the wrapper's
foot, so it costs no height (the same device that took `field-days` from 44.4% back to 41.5% when the film
first landed) and sits under no sticky ancestor. Task 6 owns this, and its gate is `check_films.mjs` passing
on pixels, not a reading of the markup.

---

## Global Constraints

Copied from the spec and CLAUDE.md. Every task's requirements implicitly include this section.

- **Zero added JavaScript is the target.** Headroom is **6,928 bytes** brotli (172,272 against a 179,200
  ceiling). No `"use client"` in anything this plan creates. If a part genuinely needs script, measure the
  cost and say so in the task's report — do not spend it quietly.
- **Non-negotiable #8: no chapter over 45% empty on its worst sampled screen.** `field-days` is **43.9% mean
  / 57.9% worst** today, over 2,637px (2.93 screens). The bar is *improvement*, not "no worse".
- **Non-negotiable #9: a pin must earn its scroll.** Report `imagesPerScreen` and the page mean before and
  after. `rooted`'s history: three screens was indefensible, two was break-even.
- **Non-negotiable #4: restraint.** Nothing bounces. No blur, no perspective flourish beyond what the client
  asked for: neighbours smaller, behind, and dimmed.
- **Non-negotiable #5:** nothing moves unless the visitor moves. **No autoplay, no timer, no infinite drift.**
  The client was offered autoplay and declined it once the conflict was named.
- **No copy changes.** The heading, both paragraphs and all six activity titles and bodies are the client's
  and already exist in `content/home.ts`.
- **British spelling.** All copy lives in `content/`; no user-facing strings in components.
- **Architecture rule:** no component hard-codes a colour, a duration or a string. Colours come from
  `lib/palette.ts` via CSS variables, every duration and number from `lib/motion.ts`, every word from
  `content/`.
- **Never hand-edit a generated module** (`lib/*-art.ts`, `lib/media-manifest.ts`).
- **`short:` must never size a photograph** — that is `pocket:` / `roomy:` (`DECISIONS.md` §2 #44–45).
- `npm test`, `npm run build` and `npm run lint` green before any commit claiming completion.

### Method this project requires

- **Watch every new assertion fail against a deliberately broken build before trusting it.** Not optional;
  it is the countermeasure to this project's one repeated defect (`DECISIONS.md` §2, which was at fifty-three instances when this plan was written).
- **Ask what a broken build would score** before believing a measurement.
- **Sweep widths continuously**, not at 390/768/1440/1920. The last four defects all lived between those
  fixed samples.
- **Open a 390px screenshot and read it.** No instrument on this project measures type over cream.
- Measure against a production build: `npm run build && npx next start -p 3100`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/coverflow.ts` | **Create.** Pure geometry and id shapes: the per-card animation window, the scroll offset of each target, the wraparound arrows' arithmetic, `coverflowTargetId()`. No React, no DOM — everything a unit test can hold. |
| `lib/coverflow.test.ts` | **Create.** Unit tests for the above. |
| `lib/motion.ts` | **Modify.** Add `COVERFLOW` — every number the effect uses. |
| `app/layout.tsx` | **Modify.** Publish `COVERFLOW` as `--coverflow-*` custom properties on `<html>`, the way `ENTER`/`FLOAT`/`ROOM_STACK` already are. |
| `components/sections/CoverflowCard.tsx` | **Create.** One card: photograph above words. Knows nothing about animation, position or its neighbours. |
| `components/sections/CoverflowCard.test.tsx` | **Create.** Renders a card, asserts its content and its `--i`. |
| `components/sections/Coverflow.tsx` | **Create.** The section: header band, tall wrapper, targets, sticky stage, the cards, the footer slot. Server component. |
| `app/globals.css` | **Modify.** The `.coverflow*` mechanics, behind `@supports`, plus the reduced-motion and no-timeline fallbacks. |
| `content/home.ts` | **Modify.** Add `mediaId` to `ExperienceCopy`; give each of the six activities its photograph. |
| `content/chapters.ts` | **Modify.** `"coverflow"` added to `ChapterKind` and `IMAGE_LED_KINDS`; `field-days` switched to it; its `media` grows to nine. |
| `content/chapters.test.ts` | **Modify.** `MIN_MEDIA.coverflow`. |
| `app/page.tsx` | **Modify.** A `case "coverflow"`, carrying the tiger. |
| `lib/sizes.test.ts` | **Modify.** Register the new `SIZES`/`BOXES`; drop `SplitFeature`'s when it is retired. |
| `components/sections/SplitFeature.tsx` | **Delete, in Task 8, only after the measurement says the coverflow ships.** `app/page.tsx` and `lib/sizes.test.ts` are its only consumers (verified by grep, 16 Aug 2026). |
| `scripts/check_coverflow.mjs` | **Create.** The rig. |

---

## Task 1: Settle the timeline construction in a real browser, before writing any component

**Why this is Task 1 and not a detail inside Task 5.** The rooms card stack was built twice in opposite
directions and shipped a third construction that was neither, because a sticky element's `view()` timeline
*freezes while it is stuck* — measured, not predicted (`DECISIONS.md` §17, `app/globals.css` above
`.room-stack`). This chapter's stage is sticky. The same class of surprise is waiting here, and the cost of
finding it in Task 5 is Task 5 plus every task after it.

**Files:**
- Create (throwaway): `<scratchpad>/coverflow-probe.html` and `<scratchpad>/coverflow-probe.mjs`
- Create: `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a written finding naming (a) which element must declare the timeline, (b) the exact
  `animation-range` expression that maps card *i* to its centred moment, (c) whether `animation-range`
  accepts `calc()` over a custom property, (d) the scroll offset an anchor target must sit at.
  **Task 5's CSS is written from this file, not from the hypothesis below.**

**The hypothesis to test** (state it, then try to break it):

```css
.coverflow {                       /* tall, NOT sticky */
  height: calc(var(--coverflow-screens) * 100svh);
  view-timeline-name: --coverflow-track;
  view-timeline-axis: block;
  timeline-scope: --coverflow-track;
}
.coverflow-stage { position: sticky; top: var(--header-height); height: 100svh; }
.coverflow-card {
  animation: coverflow-pass linear both;
  animation-timeline: --coverflow-track;
  animation-range: cover calc(var(--i) * var(--coverflow-step))
                   cover calc((var(--i) + 2) * var(--coverflow-step));
}
```

- [ ] **Step 1: Build the probe page**

A standalone HTML file — six numbered boxes, the structure above, `--coverflow-step: calc(100% / (var(--n) + 1))`,
`--n: 6`, and a keyframe that only translates on X so a reading is unambiguous. Include, in the same page, a
**second** stage whose timeline is declared on the *sticky stage itself* rather than the wrapper. That second
stage is the control: it is the construction that should freeze, and if it does not freeze, the finding is
that this page's sticky behaviour differs from the card stack's and Task 5's design assumption is wrong.

- [ ] **Step 2: Drive it and record what actually happens**

```js
// coverflow-probe.mjs — sample every 40px of scroll through the wrapper.
// For each sample, record for BOTH stages: scrollY, and each card's
// getBoundingClientRect().x and getComputedStyle().opacity.
```

Run: `node <scratchpad>/coverflow-probe.mjs`

**What a broken build would score, written down before running it** — if the timeline is frozen, every card's
`x` is identical at every sample inside the pin and only changes once the wrapper leaves. That is the exact
signature of the card stack's original defect, and it is what the control stage is there to reproduce. If
*both* stages produce it, the construction does not work at all and Task 5 needs a different one; report that
rather than proceeding.

- [ ] **Step 3: Establish the anchor-target offset empirically**

Add six zero-size `<a id>` targets, absolutely positioned inside the wrapper at `top: calc(var(--i) *
var(--coverflow-step-px))`. Click each in turn; after each, read `window.scrollY` **and** which card is
nearest x-centre. Record the relationship. Do not derive it on paper — `scroll-margin-top`, the sticky
header, and the wrapper's own offset all enter it, and one of them will be wrong.

- [ ] **Step 4: Test `calc()` in `animation-range`**

Read `getComputedStyle(card).animationRange` for a card and confirm the browser resolved the `calc()` rather
than dropping the declaration. A dropped declaration is silent and makes every card animate over the full
range — which *looks* like a working carousel running six times too fast, not like an error.

- [ ] **Step 5: Write the finding**

`docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md` — the sampled numbers, the working CSS, and any
of the four questions the probe could not settle. **If the hypothesis failed, this file says so and proposes
the construction that worked**; it is not a confirmation exercise.

- [ ] **Step 6: Commit**

```bash
git add docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md
git commit -m "docs: what a coverflow timeline actually does over a sticky stage"
```

---

## Task 2: `lib/coverflow.ts` — the geometry, tested without a browser

**Files:**
- Create: `lib/coverflow.ts`
- Test: `lib/coverflow.test.ts`

**Interfaces:**
- Consumes: `COVERFLOW` does not exist yet — this module takes counts and indices, not motion values.
- Produces:
  - `coverflowTargetId(chapterId: string, index: number): string`
  - `coverflowNeighbours(index: number, count: number): { previous: number; next: number }`
  - `coverflowWindow(index: number, count: number): { start: number; end: number }` — percentages of the
    timeline, as numbers

  > A `COVERFLOW_STEP_DENOMINATOR` export was listed here and defined nowhere — not in this task's test, not
  > in its module, and consumed by no later task. **Struck 16 Aug 2026 by Task 2's implementer, correctly**,
  > who declined to invent an export with no test and no caller. The quantity (`count + 1`) lives inside
  > `coverflowWindow`. If Task 6 or 7 needs it as its own CSS custom property, extract it *then*, with its
  > own test, so the two cannot drift.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { coverflowNeighbours, coverflowTargetId, coverflowWindow } from "./coverflow";

describe("coverflowNeighbours", () => {
  it("wraps both ways so the arrows can loop", () => {
    // The client asked for exactly this: "after 6 the 1 card comes back or visa-versa".
    expect(coverflowNeighbours(0, 6)).toEqual({ previous: 5, next: 1 });
    expect(coverflowNeighbours(5, 6)).toEqual({ previous: 4, next: 0 });
    expect(coverflowNeighbours(2, 6)).toEqual({ previous: 1, next: 3 });
  });

  it("is its own inverse — next then previous returns to where it started", () => {
    // Guards the modulo arithmetic against the classic `(i - 1) % n` sign bug,
    // which returns -1 for i = 0 in JavaScript and would point an arrow at no card.
    for (let i = 0; i < 6; i++) {
      const { next } = coverflowNeighbours(i, 6);
      expect(coverflowNeighbours(next, 6).previous).toBe(i);
    }
  });

  it("degenerates safely at a count of one", () => {
    expect(coverflowNeighbours(0, 1)).toEqual({ previous: 0, next: 0 });
  });
});

describe("coverflowWindow", () => {
  it("gives every card an equal window and the last one ends at the end", () => {
    const windows = Array.from({ length: 6 }, (_, i) => coverflowWindow(i, 6));
    const widths = windows.map((w) => w.end - w.start);
    for (const w of widths) expect(w).toBeCloseTo(widths[0], 10);
    expect(windows[0].start).toBe(0);
    expect(windows[5].end).toBe(100);
  });

  it("overlaps neighbours, because a card must be leaving while the next arrives", () => {
    // No overlap means a gap where nothing is centred — a blank stage mid-scroll.
    expect(coverflowWindow(1, 6).start).toBeLessThan(coverflowWindow(0, 6).end);
  });
});

describe("coverflowTargetId", () => {
  it("composes one id shape, so a link and its target can never disagree", () => {
    expect(coverflowTargetId("field-days", 0)).toBe("field-days-card-0");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/coverflow.test.ts`
Expected: FAIL — `Failed to resolve import "./coverflow"`.

- [ ] **Step 3: Write the module**

```ts
/**
 * The coverflow's arithmetic — `components/sections/Coverflow.tsx`.
 *
 * Here rather than in the component for the reason `lib/room-card.ts` exists:
 * the parts of a scroll effect that can be checked without a browser should be,
 * because the parts that cannot are expensive to check and this project has
 * learned that the hard way (`docs/DECISIONS.md` §17).
 */

/** One id shape, composed in exactly one place — an arrow and its target can never disagree. */
export function coverflowTargetId(chapterId: string, index: number) {
  return `${chapterId}-card-${index}`;
}

/**
 * Which cards the arrows on card `index` point at.
 *
 * `(index + count - 1) % count`, never `(index - 1) % count`: JavaScript's `%`
 * keeps the sign of the dividend, so the naive form returns `-1` at index 0 and
 * the previous arrow would point at an id no element carries — a link that
 * silently does nothing, in the tail of a carousel, where nobody looks.
 */
export function coverflowNeighbours(index: number, count: number) {
  return {
    previous: (index + count - 1) % count,
    next: (index + 1) % count,
  };
}

/**
 * The slice of the shared timeline over which card `index` travels from
 * off-right to off-left, as percentages.
 *
 * `count + 1` steps, not `count`: a card is centred at the MIDDLE of its own
 * window, so the first card needs half a window before it and the last one half
 * a window after. Windows deliberately overlap by one step — a card must be
 * leaving while its successor arrives, or there is a moment mid-scroll with
 * nothing centred and a stage of bare cream.
 */
export function coverflowWindow(index: number, count: number) {
  const step = 100 / (count + 1);
  return { start: index * step, end: (index + 2) * step };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/coverflow.test.ts`
Expected: PASS. If `coverflowWindow(5, 6).end` is not exactly 100, the step arithmetic is wrong — fix the
module, not the assertion.

- [ ] **Step 5: Commit**

```bash
git add lib/coverflow.ts lib/coverflow.test.ts
git commit -m "feat: the coverflow's arithmetic, where a test can reach it"
```

---

## Task 3: The content — each activity gets its photograph

**Files:**
- Modify: `content/home.ts` (the `ExperienceCopy` type, and `field-days`' six experiences)
- Modify: `content/chapters.ts` (`field-days`' `media`, `ChapterKind`, `IMAGE_LED_KINDS`)
- Modify: `content/chapters.test.ts` (`MIN_MEDIA`)
- Test: `content/chapters.test.ts`, plus a new case in `content/home.test.ts` if one exists (check first)

**Interfaces:**
- Consumes: `coverflowTargetId` is not needed here.
- Produces: `ExperienceCopy` gains `readonly mediaId: MediaId` — the string-literal union from `lib/media.ts`
  (`(typeof MANIFEST)[number]["id"]`; **not** a branded type, as an earlier draft of this line said, which
  matters because a genuine brand would stop the test's structural cast type-checking). Use it rather than
  `string` so a typo is a compile error instead of a `media()` throw at render. `ChapterKind` gains
  `"coverflow"`.

> **Read correction A at the top of this plan before starting.** Three of these six photographs are new to
> the home page and are already used on `/mahua-vann`. That is a real trade and it goes in the review for the
> client to confirm — it is not a detail to bury.

- [ ] **Step 1: Write the failing test**

Add to `content/chapters.test.ts`:

```ts
it("gives every coverflow activity a photograph the chapter actually carries", () => {
  // A card puts a photograph and an activity's name in one box, so the pairing
  // becomes a claim. This asserts the weaker, mechanical half of that: every
  // activity names a real id, and every id it names is in the chapter's own
  // media list, so a card can never reach for a photograph the chapter does not
  // declare (and that `measure_density.mjs` therefore does not count).
  for (const chapter of CHAPTERS.filter((c) => c.kind === "coverflow")) {
    const copy = chapterCopy(chapter.id as ChapterCopyKey) as { experiences: readonly ExperienceCopy[] };
    expect(copy.experiences.length).toBeGreaterThan(0);
    for (const experience of copy.experiences) {
      // `media` is a FUNCTION that throws on an unknown id, not a record — the
      // rest of this file already calls it that way (see line 92).
      expect(() => media(experience.mediaId), `${experience.title} names "${experience.mediaId}"`).not.toThrow();
      expect(
        chapter.media,
        `"${chapter.id}" must declare ${experience.mediaId} — ${experience.title} shows it`,
      ).toContain(experience.mediaId);
    }
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run content/chapters.test.ts`
Expected: FAIL — `Property 'mediaId' does not exist on type 'ExperienceCopy'` under `tsc`, and at runtime the
filter finds no `"coverflow"` chapter so the loop is empty and the test **passes vacuously**. That vacuous
pass is the thing to notice: run it again after Step 3's `kind` change and confirm it then fails for the real
reason. A test that passes because its subject does not exist yet is this project's own defect shape.

- [ ] **Step 3: Add the `mediaId` field and the pairing**

In `content/home.ts`, extend the type:

```ts
export type ExperienceCopy = {
  readonly title: string;
  readonly body: string;
  /**
   * The photograph this activity shows on its card.
   *
   * Added 16 Aug 2026 with the coverflow. Two of these are frames from
   * `/mahua-vann` rather than the chapter's original six, because the copy names
   * specific places the original photographs are not: "Kohka Lake" was over the
   * lodge's own swimming pool, and Pachdhar had no village or potter in the
   * chapter at all. A card makes the pairing a claim in a way three prose bands
   * did not. See the plan's correction A.
   */
  readonly mediaId: MediaId;
};
```

**The scrim does not go here.** A wash opacity is a rendering figure, not copy, and `content/` holds copy —
the architecture rule. `FullBleedQuote`'s own scrims live outside content for the same reason (they are
passed from `app/page.tsx`). The six figures live in `components/sections/Coverflow.tsx` as a
`Record<MediaId, ScrimStrength>` keyed by photograph, since what a scrim answers to is the *exposure of a
frame*, not the activity that happens to name it — Task 5 passes each card its own. `ScrimStrength` is
imported from `components/ui/Scrim`, which a component may do and `lib/coverflow.ts` deliberately may not.

`MediaId` comes from `@/lib/media` — `content/chapters.ts` already imports it for `Chapter.media`, so this is
an established direction, not a new dependency.

Then set each of `field-days`' six experiences: `tiger-crossing-track`, `vann-bird-watching`,
`vann-kohka-lake`, `forest-boardwalk-daylight`, `vann-potters-village`, `forest-trail-canopy` — in the order
the activities already appear. **Change no words.**

In `content/chapters.ts`, add the kind and grow the media list:

```ts
export type ChapterKind =
  // …existing…
  | "coverflow";

export const IMAGE_LED_KINDS: readonly ChapterKind[] = [
  // …existing…, plus:
  "coverflow",
];
```

and on `field-days`, `kind: "coverflow"` with:

```ts
    // Nine, from six, when the coverflow landed (16 Aug 2026). The first three
    // are the chapter's two written beats and stay in the header band above the
    // stage: the dawn gate, then "the day slows right down" — the client's own
    // copy, which a carousel of activities does not carry and must not drop.
    // The last six are one per activity, in the order `content/home.ts` lists
    // them, and `chapters.test.ts` asserts that correspondence rather than
    // trusting this comment.
    media: [
      "guide-sunrise",
      "hammocks-shade",
      "pool-daylight-forest",
      "tiger-crossing-track",
      "vann-bird-watching",
      "vann-kohka-lake",
      "forest-boardwalk-daylight",
      "vann-potters-village",
      "forest-trail-canopy",
    ],
```

In `content/chapters.test.ts`, add the floor:

```ts
  // Six activities, one card each. Below that it is not a carousel; the pin
  // reserves scroll for cards that are not there — non-negotiable #9.
  coverflow: 6,
```

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: PASS, and the new test now genuinely exercises a chapter.

> **`tsc --noEmit` CANNOT pass from here until Task 6, and that is by construction — not a defect to chase.**
> Recorded 16 Aug 2026 by Task 3's implementer, after this step originally claimed it should pass.
> `app/page.tsx` closes its `switch (kind)` with `const unhandled: never = kind;`, so the moment `"coverflow"`
> joins `ChapterKind` that file stops type-checking with:
>
> ```
> app/page.tsx(219,13): error TS2322: Type '"coverflow"' is not assignable to type 'never'.
> ```
>
> That exhaustiveness check is doing exactly its job: a new chapter kind with no component is meant to be a
> compile error rather than a blank patch of page. **Tasks 5 and 7 will both see this error and neither
> should try to fix it** — Task 6 adds the case arm and closes it. Verify your own files instead by
> type-checking them and their import graph under a tsconfig that excludes `app/page.tsx`.
>
> `MIN_MEDIA` is `satisfies Record<ChapterKind, number>`, so omitting the floor is a *separate* compile error,
> and that one is yours.

**Expect the rhythm test to still pass and check why.** `field-days`' neighbours are `forest` (a `plateGrid`)
and `rooms` (a `plateGrid`) — both image-led — so the alternation rule is satisfied by its neighbours and
would be satisfied even if `"coverflow"` had been left out of `IMAGE_LED_KINDS`. Adding it is still correct
(the chapter is now nine photographs and a carousel), but the suite will not catch its omission here. Note
that in the task report rather than reading the green as proof.

- [ ] **Step 5: Commit**

```bash
git add content/home.ts content/chapters.ts content/chapters.test.ts
git commit -m "feat: each activity carries the photograph it names"
```

---

## Task 4: `COVERFLOW` in `lib/motion.ts`, published to CSS

**Files:**
- Modify: `lib/motion.ts`
- Modify: `app/layout.tsx`
- Test: `lib/motion.test.ts` (check it exists; if not, add the assertions to `app/layout.test.tsx` or create
  `lib/motion.test.ts`)

**Interfaces:**
- Consumes: nothing.
- Produces: `COVERFLOW` — `{ screens, sideScale, sideShiftPct, sideVeil, cardMaxPx, stageGutterPx }`, and the
  matching `--coverflow-*` custom properties on `<html>`. (**`sideVeil`, never `sideDim`** — this line said
  `sideDim` until 16 Aug 2026, stale against correction C and against this task's own Step 3 code. Corrected
  by Task 4's implementer, who built the right one and reported the contradiction rather than picking one.)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { COVERFLOW, STICKY_SCREENS_MAX } from "./motion";

describe("COVERFLOW", () => {
  it("never reserves more scroll than the page's own pin ceiling", () => {
    // Non-negotiable #9. `StickyScene` clamps to this; a second pinned chapter
    // that quietly reserved four screens would be exactly the paid-for empty
    // scroll that rule exists to stop.
    expect(COVERFLOW.screens).toBeLessThanOrEqual(STICKY_SCREENS_MAX);
    expect(COVERFLOW.screens).toBeGreaterThanOrEqual(1);
  });

  it("recedes a neighbour without hiding it", () => {
    // The client asked for neighbours "out of focus … behind" — behind, not gone.
    // Past this veil the photograph is a dark rectangle, which loses the depth
    // the whole effect is for.
    expect(COVERFLOW.sideVeil).toBeGreaterThan(0);
    expect(COVERFLOW.sideVeil).toBeLessThanOrEqual(0.55);
    expect(COVERFLOW.sideScale).toBeGreaterThan(0.7);
    expect(COVERFLOW.sideScale).toBeLessThan(1);
  });

  it("recedes by veil and never by opacity", () => {
    // Correction C. A card's text sits ON its own photograph, so fading the card
    // fades the type against the frame beneath it and the depth cue starts
    // fighting the legibility floor. More scrim recedes the photograph AND
    // raises cream type's contrast. This asserts the dial cannot grow the old
    // lever back by accident.
    expect(COVERFLOW).not.toHaveProperty("sideDim");
    expect(COVERFLOW).not.toHaveProperty("sideOpacity");
  });

  it("shifts a neighbour far enough to be seen past the centre card", () => {
    // Less than half a card's width and the neighbour is entirely hidden behind
    // the centre one, which is a stack, not a coverflow.
    expect(COVERFLOW.sideShiftPct).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/motion.test.ts`
Expected: FAIL — `COVERFLOW` is not exported.

- [ ] **Step 3: Add the dial**

```ts
/**
 * The `04 · Days in the Field` coverflow — `components/sections/Coverflow.tsx`.
 *
 * Client request, 16 Aug 2026: *"the next and previous cards sit out of focus on
 * left and right respectively behind the center card."* So a neighbour is
 * smaller, shifted out past the centre card's edge, and veiled — three quiet
 * changes rather than one loud one, which is the same restraint `ROOM_STACK`'s
 * recede is built with.
 *
 * **`sideVeil` is scrim, not opacity, and the distinction is load-bearing.** A
 * card's type sits ON its own photograph (the client's second ruling the same
 * day — `FullBleedQuote`'s shape). Fading the whole card would fade that type
 * against the frame beneath it, so the depth cue would be working against the
 * contrast floor CLAUDE.md sets for text over a photograph. Adding scrim
 * recedes the photograph and RAISES cream type's contrast. Do not "simplify"
 * this back to an opacity.
 *
 * **No rotation and no blur.** A `rotateY` is the thing most coverflows reach
 * for and it is the thing this page cannot have: it is the tilt the client
 * explicitly did not want on the photographs a day earlier (`FLOAT`, above), and
 * a blur costs a compositor layer per card for an effect non-negotiable #4 would
 * call noticeable. Depth here is scale and dim, the way the deck's is.
 *
 * `screens` is the pin's length INCLUDING its own screen, matching
 * `StickyScene`'s `screens` so the two mean the same thing on this page. It is
 * chosen by measurement in the plan's Task 8, not by feel — `rooted`'s own
 * history is that three screens was indefensible and two was break-even
 * (non-negotiable #9).
 */
export const COVERFLOW = {
  /** Screens of scroll the chapter's stage occupies, including its own. */
  screens: 2,
  /** A neighbour's scale at full offset. */
  sideScale: 0.82,
  /** How far a neighbour sits from centre, as a percentage of a card's width. */
  sideShiftPct: 62,
  /** Extra `--overlay` wash over a neighbour at full offset. Never an opacity — see above. */
  sideVeil: 0.4,
  /** Past this a card stops reading as a card. Matches `ROOM_STACK.heightMax`'s reasoning. */
  cardMaxPx: 560,
  /** Breathing room between the stage's cards and the viewport edge. */
  stageGutterPx: 24,
} as const;
```

- [ ] **Step 4: Publish it to CSS**

In `app/layout.tsx`, alongside the existing `--enter-*` / `--float-*` / `--room-*` writes, add
`--coverflow-screens`, `--coverflow-side-scale`, `--coverflow-side-shift`, `--coverflow-side-veil`,
`--coverflow-card-max`, `--coverflow-gutter`. **Follow the file's existing pattern exactly** — read how
`ROOM_STACK` is written there and match it, units included. The point of this indirection is that no number
in `app/globals.css` can drift from the test that guards it.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts app/layout.tsx
git commit -m "feat: the coverflow's numbers, on the dial where they belong"
```

---

## Task 5: `CoverflowCard.tsx` — one card, in flow, no animation

**Files:**
- Create: `components/sections/CoverflowCard.tsx`
- Test: `components/sections/CoverflowCard.test.tsx`

**Interfaces:**
- Consumes: `ExperienceCopy` (Task 3), `coverflowTargetId` and `coverflowNeighbours` (Task 2).
- Produces: `CoverflowCard({ experience, scrim, index, count, chapterId, previousTitle, nextTitle })`, plus
  `export const CARD_SIZES: string` and `export const CARD_BOX: number` for `lib/sizes.test.ts`.

**Build it in flow first, deliberately.** A card that is correct as a plain block is a card whose failures in
Task 6 are certainly the animation's. `RoomCard` was debugged the other way round and it cost a fix round.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoverflowCard } from "./CoverflowCard";

const experience = {
  title: "Kohka Lake",
  body: "An hour at the water near Pench.",
  mediaId: "vann-kohka-lake",
} as const;

// The card takes its wash as a prop; the six real figures live in
// `Coverflow.tsx`, keyed by photograph. See correction C.
const scrim = { flat: 0.5 } as const;

describe("CoverflowCard", () => {
  it("carries its own index into CSS, because every card shares one stylesheet", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />,
    );
    const card = container.querySelector("li");
    expect(card?.style.getPropertyValue("--i")).toBe("2");
  });

  it("shows the activity's own words", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />);
    expect(screen.getByRole("heading", { name: "Kohka Lake" })).toBeInTheDocument();
    expect(screen.getByText(/An hour at the water/)).toBeInTheDocument();
  });

  it("points its arrows at its neighbours, and wraps at the ends", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />,
    );
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    // Card 0's "previous" is card 5 — the loop the client asked for, and the
    // whole reason the arrows are anchors rather than script.
    expect(links).toContain("#field-days-card-5");
    expect(links).toContain("#field-days-card-1");
  });

  it("names its arrows for a screen reader, since a chevron has no text", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />);
    // Six cards each carry a pair, so a bare "Previous" would be announced twelve
    // times with nothing to tell them apart.
    expect(screen.getByRole("link", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/CoverflowCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the card**

**A photograph with its words on it** — correction C, and spec §5a. The model is
`components/sections/FullBleedQuote.tsx`: the photograph fills the card, a `Scrim` sits over it, the type
sits over that in `var(--bg)` cream. Read that component before writing this one; the arrangement it settled
on (the box is the section with the photograph absolute *inside* it, not a photograph with text absolutely on
top) exists because the other way puts type through the bottom of the frame on a landscape phone.

```tsx
<li className="coverflow-card" style={{ "--i": String(index) } as React.CSSProperties}>
  <a id={coverflowTargetId(chapterId, index)} className="coverflow-anchor" aria-hidden="true" tabIndex={-1} />

  <div className="absolute inset-0 -z-10">
    <Photo id={experience.mediaId} sizes={CARD_SIZES} box={CARD_BOX} className="h-full w-full object-cover" … />
  </div>
  {/* The solved wash. Per card, because six photographs are six exposures. */}
  <div className="absolute inset-0 -z-10"><Scrim {...scrim} /></div>
  {/* The veil that recedes a neighbour — its opacity is keyframed, and it is a
      wash over the photograph, never an opacity on the card. Correction C. */}
  <div aria-hidden="true" className="coverflow-veil absolute inset-0 -z-10" />

  <p className="…">{String(index + 1).padStart(2, "0")}</p>
  <h3 className="…">{experience.title}</h3>
  <p className="…">{experience.body}</p>

  <nav className="coverflow-arrows">
    <a href={`#${coverflowTargetId(chapterId, previous)}`}>…</a>
    <a href={`#${coverflowTargetId(chapterId, next)}`}>…</a>
  </nav>
</li>
```

Rules this must follow:

- **All type is `var(--bg)` cream over the wash** — the same colour `FullBleedQuote` uses. `var(--text)` ink
  on a photograph is the failure that rule exists to prevent, and `--accent-text` gold is legible on cream
  and *only* on cream (non-negotiable #7).
- **`scrim` is a prop, and Task 8 solves the six real figures against the rendered page.** Ship Task 5 with a
  deliberately heavy placeholder (`{ flat: 0.5 }`) and a comment saying so — a *heavy* placeholder fails
  towards legible-but-muddy, which a reviewer sees, rather than towards illegible, which they may not.
- **The card is `overflow-hidden` with `isolate`** so the photograph, the scrim and the veil compose inside
  it. Do **not** give `.coverflow` (the outer wrapper) a `z-index` — the tiger blends against the cream
  through it (correction B).

- **Every colour through a CSS variable** — `var(--text)`, `var(--dim)`, `var(--accent)`,
  `var(--accent-text)`. Never a hex.
- **Arrow labels come from `content/`,** not from this file. Add a `coverflow: { previous, next }` block to
  `content/site.ts` next to `roomGallery`'s, and include the activity's own name in the accessible name so
  twelve arrows are distinguishable: `` `${SITE.coverflow.previous} — ${previousTitle}` ``. That means the
  card needs its neighbours' titles; pass the whole `experiences` array, or the two titles, rather than
  reaching into content from here.
- **`rule-in` and `focus-visible:outline-…`** on both arrows, copied from `RoomCardStack`'s gallery arrows —
  keyboard visibility is not optional and the pattern already exists.
- `CARD_SIZES` must be honest about the card's real drawn width at each breakpoint. Get it wrong in the
  *narrow* direction and the photograph ships soft; `ui/Photo.tsx`'s own comment states the rounding
  direction. Task 8's `check_image_resolution.mjs` is the gate.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run components/sections/CoverflowCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Register the new box in `lib/sizes.test.ts`**

Add `{ name: "Coverflow.card", sizes: CARD_SIZES, box: CARD_BOX }` to the table, and add the file to the
`declared` list at the foot. Leave `SplitFeature`'s entries alone — it is still mounted until Task 8.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/sections/CoverflowCard.tsx components/sections/CoverflowCard.test.tsx content/site.ts lib/sizes.test.ts
git commit -m "feat: one card, a photograph over an activity's own words"
```

---

## Task 6: `Coverflow.tsx` and the CSS — the pin, the stage, the passing cards

**Files:**
- Create: `components/sections/Coverflow.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `CoverflowCard` (Task 5), `COVERFLOW` (Task 4), `coverflowWindow` (Task 2), the timeline
  construction from **Task 1's finding file**.
- Produces: `Coverflow({ chapter, copy, surface, footer })` — the same `footer` slot shape `SplitFeature`
  has, so the tiger's wiring in `app/page.tsx` changes by one component name and nothing else.

> **Lift the CSS from `docs/reviews/2026-08-16-coverflow/task-1-timeline-probe.md` §11.7 — not from the
> hypothesis in Task 1, and not from that file's own §9, which §11.7 supersedes.** Read §11 before §9 or you
> will build the version that forces a six-screen pin. Where the probe and this plan disagree, the probe is
> right. Four things in it are load-bearing and each is measured:
>
> 1. **The range stays on `cover`.** `exit` and `contain` read as the more precise choice for a subject
>    taller than the viewport, and both freeze the carousel solid for its entire pin (~4,450px of flat) then
>    complete in one frame. That is the rooms card stack's own recorded defect, and §6 is where it actually
>    lives — **not** in `position: sticky`, which the probe's control arm proved does not freeze.
> 2. **The offsets are lengths anchored to the pinned window, not percentages of `cover`.** Percentages
>    force `screens ≥ card count` — six screens for six cards, against `STICKY_SCREENS_MAX` of 3 — because
>    `cover` includes a viewport of entry travel and a tail that no card should spend a step on.
> 3. **The stage clears the header out of its own height.** At a flat `100svh` the last card centres 11px
>    *after* the pin releases.
> 4. **No `timeline-scope`.** The cards are descendants of the declaring element, so the name already
>    reaches them; measured identical with and without over 1,100 samples. The plan's earlier hypothesis
>    carried it, and `Coverflow.tsx` must not.

- [ ] **Step 1: The fallback comes first, and it is the default**

Before any animation, the flow layout must be complete and readable: header band, then the six cards as a
plain vertical list, then the footer. Only then is the pinned construction added, **inside**:

```css
@supports (animation-timeline: view()) and (not (prefers-reduced-motion: reduce)) {
  /* …the pin, the absolute positioning, the stage… */
}
```

This ordering is load-bearing, not tidiness. The cards are `position: absolute` inside the stage in the
animated construction — if `animation-timeline` is unsupported (Safari, Firefox without the flag) they would
sit in one pile with five cards invisible under the sixth. Writing the effect as an *opt-in over* a working
list means an absent feature yields a plain list, which is this project's own rule: anything covering content
must fail into not existing.

Verify it: `node -e` a Playwright run with `--disable-blink-features=` is not a reliable way to remove the
feature. Instead, comment out the `@supports` block's contents, load the page, and confirm six readable
cards. Record that you did.

- [ ] **Step 2: Write the failing rig assertion first**

Add to `scripts/check_coverflow.mjs` (created fully in Task 7) a single assertion now, so this task has a
gate: **at every sampled scroll position inside the pin, exactly one card is within 8px of the stage's
horizontal centre, and exactly one card's arrows are hit-testable** (`document.elementFromPoint` at each
arrow's centre returns that arrow or a descendant).

Run it against the current build (no coverflow yet) and watch it fail. Then again after Step 3.

The hit-test half matters more than it looks: the arrows are keyframed to become interactive only on the
centred card, and a keyframed `pointer-events` that silently does not apply gives twelve overlapping links,
of which the browser picks by paint order. That failure is invisible to the eye and to a screenshot.

- [ ] **Step 3: The component and the mechanics**

`Coverflow.tsx` — a server component, no `"use client"`:

```tsx
<ChapterSurface id={chapter.id} surface={surface}>
  {/* Header band: the chapter mark, the heading, body[0], and the chapter's
      two written beats with their three photographs. This is what a carousel
      of activities does not carry. */}
  …
  <div
    className="coverflow"
    style={{
      "--n": String(copy.experiences.length),
      timelineScope: "--coverflow-track",
    } as React.CSSProperties}
  >
    <ul className="coverflow-stage-track">
      {copy.experiences.map((experience, i) => (
        <CoverflowCard key={experience.title} … index={i} count={copy.experiences.length} />
      ))}
    </ul>
    {footer}
  </div>
</ChapterSurface>
```

In `app/globals.css`, a `.coverflow` block carrying:

- The wrapper's height from `--coverflow-screens`, its `view-timeline-name`, and `timeline-scope`.
- The stage: `position: sticky; top: var(--header-height, 0px);`.
- `.coverflow-card` — `animation: coverflow-pass linear both; animation-timeline: --coverflow-track;` and
  `animation-range` from Task 2's window arithmetic, written as `calc()` over `--i` and `--n`.
- `@keyframes coverflow-pass` — five stops: off-right (invisible), behind-right, centre, behind-left,
  off-right (invisible). Transform is `translateX` + `scale` only. **No `rotateY`.**
- `@media (prefers-reduced-motion: reduce)` — the whole `.coverflow` collapses to `height: auto`, the stage
  to `position: static`, the cards to flow. Unlike `.room-card`, this drops the *pin* too: the pin here
  reserves scroll that only means something because cards move through it, which is `.sticky-scene`'s case,
  not the card stack's.
- **The tiger's own rule.** `footer` is `position: absolute` against `.coverflow` (which is not sticky and
  must not become a stacking context — do not give it a `z-index`), anchored to its foot. See correction B.

Write a comment above the block in this file's own idiom: what the construction is, what was measured, and
what a future editor would break. Cite the Task 1 finding by path.

- [ ] **Step 4: Mount it and prove the tiger still blends**

In `app/page.tsx`, add `case "coverflow"` carrying the same `SignatureFilm` the `splitFeature` case does.
Leave the `splitFeature` case in place — nothing routes to it now, and Task 8 removes it.

Then, against a production build:

```bash
npm run build && npx next start -p 3100
node scripts/check_films.mjs
```

Expected: PASS, **including its white-ground-gone pixel assertion.** If the tiger's white box is back, the
film has acquired a stacking-context ancestor — re-read correction B; do not weaken the assertion.

- [ ] **Step 5: Run everything**

Run: `npm test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add components/sections/Coverflow.tsx app/globals.css app/page.tsx scripts/check_coverflow.mjs
git commit -m "feat: the days in the field advance on the visitor's own scroll"
```

---

## Task 7: `scripts/check_coverflow.mjs` — the rig, watched failing

**Files:**
- Modify: `scripts/check_coverflow.mjs` (complete it)
- Modify: `CLAUDE.md` (the Commands list)

**Interfaces:**
- Consumes: a production build on `:3100`.
- Produces: a non-zero exit on failure, and `docs/reviews/2026-08-16-coverflow/coverflow.json`.

**Every assertion below must be watched failing against a deliberately broken build before it is trusted.**
Break it in the way the assertion is written to catch, not in some other way — a rig that passes against a
build broken *elsewhere* has proved nothing. Record which break was used for each.

- [ ] **Step 1: The assertions**

1. **The stage holds.** Across the pin, the stage's top edge stays within 2px of
   `header-height`. Break to test: remove `position: sticky`.
2. **Exactly one card is centred**, at every sample, and it changes monotonically 1 → 6 as the visitor
   scrolls forward. Break: delete the per-card `animation-range` so every card shares the full range.
3. **Neighbours are visible and behind, and veiled rather than faded.** At each sample the two adjacent cards
   are on screen and scaled below 1; their own computed `opacity` is **1** and their `.coverflow-veil` is
   above 0. Break two ways: set `sideVeil` to 0 (they stop receding), and move the recede back onto the
   card's `opacity` (assertion must fail — that is correction C's regression, and it is invisible to the eye
   at a glance because both look like depth).
4. **Exactly one card's arrows are hit-testable** (`elementFromPoint`). Break: remove the keyframed
   `pointer-events`.
5. **The arrows loop.** Click card 6's next; assert card 1 becomes the centred card. Click card 1's previous;
   assert card 6 does. Break: replace the wraparound with a clamp.
6. **No photograph is cropped past 25% of its width** at any sampled viewport — the same bound
   `check_card_stack.mjs` enforces, for the same reason.
7. **Continuous width sweep**, not four presets: step the viewport from 360 to 1920 in 20px increments and
   assert 1–6 hold throughout. The last four defects on this project all lived between the fixed samples.
8. **Reduced motion yields a readable list**: with the emulated setting on, the section's height is
   `auto`-shaped (no reserved screens), no card is `position: absolute`, and all six are non-overlapping.
9. **No JavaScript**: with scripting disabled, all six cards are in the document and readable.

- [ ] **Step 2: Watch each one fail**

Run each break, run the rig, record the failure text. Nine breaks, nine recorded failures, in
`docs/reviews/2026-08-16-coverflow/rig-failures.md`. Restore the build between each.

- [ ] **Step 3: Watch them all pass**

Run: `node scripts/check_coverflow.mjs`
Expected: PASS, exit 0, `coverflow.json` written.

- [ ] **Step 4: Add it to the Commands list in `CLAUDE.md`**

One line, in the browser-measurements block, in the existing idiom.

- [ ] **Step 5: Commit**

```bash
git add scripts/check_coverflow.mjs docs/reviews/2026-08-16-coverflow/ CLAUDE.md
git commit -m "test: the coverflow's rig, watched failing nine ways first"
```

---

## Task 8: Measure the pin, choose its length, retire `SplitFeature`, and read it by eye

**Files:**
- Modify: `lib/motion.ts` (`COVERFLOW.screens`, if the measurement says so)
- Delete: `components/sections/SplitFeature.tsx`
- Modify: `app/page.tsx`, `lib/sizes.test.ts`, `content/chapters.ts` (remove `"splitFeature"` from
  `ChapterKind`), `content/chapters.test.ts` (remove its `MIN_MEDIA` entry)
- Create: `docs/reviews/2026-08-16-coverflow/README.md`

- [ ] **Step 1: Measure the pin length on one build**

**`COVERFLOW.screens` is a continuous dial, not a choice of two** — Task 1 §11 measured it at 2, 2.5, 3, 3.6,
4 and 6 and the card count no longer constrains it. Run **2, 2.5 and 3**; 3 is `STICKY_SCREENS_MAX` and the
ceiling. The measured pace, at 1440×900, is the other half of the decision:

| `screens` | wrapper | pinned scroll | centre-to-centre | a card's whole arc |
|---|---|---|---|---|
| 2 | 1,800px | 977px | 139.6px | 279px |
| 2.5 | 2,250px | — | 203.8px | 408px |
| 3 | 2,700px | 1,877px | 268.1px | 536px |

The rooms card stack advances at roughly **700px per card**, so 3 screens is about 77% of that pace and 2 is
about 40%. `field-days` is **2,637px today**: two screens leaves 837px for the header band and still lands
shorter than today; three screens is 63px over *before* the band is added. Density decides it, pace informs
it, and both go in the review.

For each arm:

```bash
npm run build && npx next start -p 3100
node scripts/measure_density.mjs
```

Record, for each arm: `field-days` mean and worst empty, the chapter's height in screens, the page mean, and
**`imagesPerScreen`** — which is the figure non-negotiable #9 actually turns on, and the one that caught
`rooted`'s three-screen pin. Also record the `field-days / rooms` join, since it is the emptiest place on the
page today at 73.1% and a pin either side of it moves it.

**Choose from the numbers.** The bar is `field-days` under 45% *worst* (it is 57.9% today) and
`imagesPerScreen` not falling. If neither arm clears 45% worst, say so plainly and do not adjust the ceiling.

- [ ] **Step 1b: Solve the six scrims, and add six runs to the contrast rig**

Correction C. Six blocks of cream type on six photographs, each needing its own figure.

Add six entries to `RUNS` in `scripts/check_contrast_over_photos.mjs` — that table is hand-written and
discovers nothing, so a card missing from it is a card nobody has checked. Each run scrolls to that card's
own anchor (`at: "#field-days-card-N"`, which exists because the arrows need it) so the card being sampled
is the centred, unveiled one. Use the existing quote runs as the pattern, including their `min` and their
`[data-word]` selector convention.

Then **solve** each figure rather than picking it: raise the card's scrim until the worst single pixel under
its type clears the floor, and no further. Start from the placeholder Task 5 shipped and record the before
and after for all six. `Scrim`'s own comment is explicit that a flat wash heavy enough for the brightest
patch turns the whole photograph to mud, so prefer the shaped layers (`bottom`, `corner`) to `flat` where
the type sits in one part of the frame.

Run: `node scripts/check_contrast_over_photos.mjs`
Expected: PASS on all three routes, including the six new runs.

**Watch it fail first**: set one card's scrim to `{}` and confirm that card's run reports a real ratio below
its floor. A contrast rig that passes with no wash at all is measuring the wrong pixels.

- [ ] **Step 2: The rest of the measurements**

```bash
node scripts/check_coverflow.mjs
node scripts/check_image_resolution.mjs
node scripts/check_films.mjs
node scripts/check_contrast_over_photos.mjs
node scripts/check_plates.mjs
node scripts/check_card_stack.mjs
node scripts/measure_page.mjs
npm run verify:budget
```

`verify:budget` is the zero-JS claim's only real proof. **Report the delta, not the total** — the last plan's
JS reading was traced to a sibling commit and nearly recorded as its own.

- [ ] **Step 3: Read it with your eyes, at 390 and at 1440**

```bash
node scripts/capture_signature.mjs
```

Open the frames. **Read the type at 390** — no instrument on this project measures type over cream, and that
blind spot shipped a map with 4.3px labels through fifteen task reviews. Then open the real page and scroll
the chapter at 1440, and drag the window narrower while watching a card, the way the client found the plate
shrink.

- [ ] **Step 4: Retire `SplitFeature`**

Only now, and only if Step 1 chose to ship. Delete the component, remove the `splitFeature` case from
`app/page.tsx`, remove `"splitFeature"` from `ChapterKind`, its `MIN_MEDIA` entry, and its six rows plus the
`declared` entry from `lib/sizes.test.ts`. `tsc` will find anything missed — `MIN_MEDIA` is
`satisfies Record<ChapterKind, number>` and `app/page.tsx`'s switch is exhaustive by design.

Run: `npm test && npm run lint && npm run build`

- [ ] **Step 5: Write the review**

`docs/reviews/2026-08-16-coverflow/README.md` — the pin-length table with both arms, the density before and
after, the JS delta, the rig's nine failures and nine passes, the screenshots read by eye, and **two open
items for the client**:

1. **The three property-page photographs now on the home page** (correction A) — recorded as a decision he
   took on 16 Aug, with the six solved scrim figures beside them so he can see what each photograph cost in
   wash.
2. **What "repetitive scroll" actually got.** The arrows loop in both directions, which is what the client
   asked for and what the anchor-link mechanism gives for free. The *scroll* still runs 1 → 6 once and then
   releases the pin — a page cannot scroll forever, and making the scroll itself loop needs JavaScript that
   fights the visitor's own gesture. Say this to him rather than letting him find it.

- [ ] **Step 6: Update the documents and commit**

`CLAUDE.md`'s Phase row and its density figures, `docs/PROJECT-STATE.md`, `docs/DECISIONS.md` (a new §20 for
the construction and the two corrections above; §5 for the open items), and the test count.

```bash
git add -A
git commit -m "feat: the days in the field, as a carousel the visitor drives"
```

---

## Self-review of this plan

**Spec coverage.** §1 (why) → Task 8's measurement. §2 (what it becomes) → Tasks 5, 6. §3 (scroll-driven,
not autoplay) → Global Constraints, and Task 7 assertion 2 which would fail against a timer. §4 (mechanism,
no JS) → Tasks 1, 6, and `verify:budget` in Task 8. §5 (card shape, reduced motion) → Task 5 Step 3, Task 6
Step 3, Task 7 assertion 8. §6 (constraints) → Global Constraints, measured in Task 8. §7 (pin length,
`SplitFeature`) → Task 8 Steps 1 and 4. §8 (method) → Task 1, Task 7's nine breaks, Task 8 Step 3.

**Two things the spec asserted that this plan corrects rather than implements:** the one-to-one pairing
(correction A) and the tiger's placement (correction B). Both are stated at the top, both have an owning
task, and A carries a client question rather than a silent choice.

**Known soft spot.** Task 6's CSS is described, not written out, because Task 1 may correct it and a plan
that dictated the wrong `animation-range` in full would be followed rather than questioned. Task 1's finding
file is the real specification for that step, which is why it is a committed document and not a scratch note.
