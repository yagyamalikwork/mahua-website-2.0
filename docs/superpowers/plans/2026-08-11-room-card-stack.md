# The Rooms Card Stack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rooms chapter on `/mahua-vann` and `/mahua-tola` with a card stack — each room a card that sticks below the header while the next rises over it, covered cards receding slightly — adding zero bytes of JavaScript.

**Architecture:** A server-rendered `<ol>` whose `<li>` children ARE the cards, each `position: sticky` at a stepped offset so they pile up under the header, each running a recede off its own `view()` timeline. Card height is *calculated* from the measured slack between the sticky header and the booking bar, never hard-coded. Every dial (recede scale, dim, deck step) lives in `lib/motion.ts` and reaches CSS through `app/layout.tsx`, like every other number on this site.

**Tech Stack:** Next.js 16 (App Router, React 19 server components), Tailwind v4, plain CSS in `app/globals.css` for the stack mechanics, CSS scroll-driven animations (`view-timeline` / `animation-timeline`), Vitest + Testing Library for units, Playwright for the browser rig.

**Spec:** [`docs/superpowers/specs/2026-08-11-room-card-stack-design.md`](../specs/2026-08-11-room-card-stack-design.md). Read it before Task 1; this plan does not repeat its reasoning.

## Global Constraints

Copied from the spec and `CLAUDE.md`. Every task's requirements implicitly include all of these.

- **Zero JavaScript added.** No `"use client"`, no hook, no scroll listener, no new dependency. First-load JS must be byte-identical before and after. There is 3.7 KB of headroom on these routes against a 175 KB ceiling and this work is entitled to none of it.
- **No component hard-codes a colour, a duration or a string of copy.** Colours come from `lib/palette.ts`, motion values from `lib/motion.ts`, words from `content/`. New CSS custom properties are written once in `app/layout.tsx` from `lib/motion.ts`.
- **British spelling** in all copy. No copy changes in this work at all.
- **Gold (`#BB8F2E`) is decorative only** and must never carry text. `goldText` (`#7A5C18`) is the legible sibling.
- **No section may render more than 45% empty space at 1440×900.** `vann-rooms` is 40.1% and `tola-rooms` is 39.0% today; neither may get worse.
- **Contrast ≥ 4.5:1** for body text and links on both paper surfaces, checked by test not by eye.
- **Only images ≥ 1400px wide may go full-bleed.** Nothing here goes full-bleed.
- **Everything decorative is `aria-hidden`** and has a defined still state under `prefers-reduced-motion`.
- **Measure at 390 / 768 / 1440 / 1920.** Type over cream is measured nowhere by the existing rigs — open a 390px screenshot and read it before believing a task is done.
- **Run every new assertion against a deliberately broken build before trusting it to pass.** A guard nobody has watched fail is not a guard. This is non-negotiable and is a step in every task that adds one.
- **`npm test`, `npm run lint` and `npx tsc --noEmit` must all be green before any commit claiming completion.**

## File Structure

| File | Responsibility |
|---|---|
| `lib/motion.ts` | **Modify.** Add `ROOM_STACK` — the recede scale, the dim, the deck step, the card gutter, the max card height. The only place these numbers exist. |
| `app/layout.tsx` | **Modify.** Publish `ROOM_STACK` as CSS custom properties, beside the existing `--welcome-*` and `--lantern-*` blocks. |
| `app/globals.css` | **Modify.** `--property-bar-reserve`, the `.room-stack` / `.room-card` rules, the `room-recede` keyframes, and the reduced-motion switch-off. |
| `lib/room-card.ts` | **Create.** `roomCardLayout(aspect)` — the one function deciding whether a room is a `stacked` or `beside` card, from the photograph's own aspect ratio. Pure, no React, so it is unit-testable and reusable by the rig. |
| `lib/room-card.test.ts` | **Create.** The threshold rule, and that every room in both content files resolves to the intended layout. |
| `components/sections/RoomCard.tsx` | **Create.** One room as a card, in either composition. Owns `ROOM_CARD_SIZES` and `ROOM_CARD_BOXES`. |
| `components/sections/RoomCard.test.tsx` | **Create.** Both compositions, `--i`, the words, the optional note. |
| `components/sections/RoomCardStack.tsx` | **Create.** The section: heading block, then the `<ol>` of slots. Server component. |
| `components/sections/RoomCardStack.test.tsx` | **Create.** Structure: cards as direct `<li>` children, `--i` per card, `--room-count`, heading outside the stack. |
| `components/sections/RoomShowcase.tsx` | **Delete** in Task 7, with its test. |
| `components/property/PropertyPage.tsx` | **Modify.** The `showcase` branch renders `RoomCardStack`. |
| `components/sections/RoomShowcase.types.ts` | **Create** in Task 1 — `RoomEntryCopy` / `RoomShowcaseCopy` move here so the content files keep one import when `RoomShowcase.tsx` is deleted. |
| `content/mahua-vann.ts`, `content/mahua-tola.ts` | **Modify.** Drop the `scale` field from each room. No other change. |
| `lib/sizes.test.ts` | **Modify.** Swap the three `RoomShowcase` slots for `RoomCardStack`'s. |
| `scripts/check_card_stack.mjs` | **Create.** The browser rig — six assertions, all about behaviour. |
| `package.json` | Untouched. The rig is run by hand like its siblings. |

---

### Task 1: Lift the content types out of the component

Moving the types first means the content files and `PropertyPage` never import from a file that is about to be deleted, so no later task has to touch them twice.

**Files:**
- Create: `components/sections/RoomShowcase.types.ts`
- Modify: `components/sections/RoomShowcase.tsx` (re-export from the new file)
- Modify: `content/mahua-vann.ts`, `content/mahua-tola.ts` (import path only)
- Modify: `components/property/PropertyPage.tsx:7` (import path only)

**Interfaces:**
- Consumes: nothing.
- Produces: `RoomEntryCopy`, `RoomShowcaseCopy`, `RoomScale` from `@/components/sections/RoomShowcase.types`.

- [ ] **Step 1: Create the types file**

`components/sections/RoomShowcase.types.ts`:

```ts
import type { MediaId } from "@/lib/media";
import type { TwoTone } from "@/content/home";

/**
 * The rooms' content model, kept apart from whatever component renders it.
 *
 * It lives here because the renderer changed (a card stack replaced a stack of
 * bands, 11 Aug 2026) and the words did not. A content type that imports from
 * the component that happens to draw it today makes every such change a churn
 * of unrelated import lines across `content/`.
 */

/**
 * Retired 11 Aug 2026 and kept only as a type so a stale `scale:` in a content
 * file is a compile error naming this comment, rather than a silently ignored
 * property. Delete once both content files are clean — see Task 7.
 */
export type RoomScale = "wide" | "offsetRight" | "offsetLeft";

export type RoomEntryCopy = {
  readonly mediaId: MediaId;
  readonly name: string;
  /** One sentence. Not a description of the furniture. */
  readonly line: string;
  /** Set as a single letterspaced caption, joined by middots. */
  readonly facts: readonly string[];
  /** Only when this room shares a photograph with another — "Shown: Suite." */
  readonly note?: string;
};

export type RoomShowcaseCopy = {
  readonly heading: TwoTone;
  readonly intro: string;
  readonly rooms: readonly RoomEntryCopy[];
};
```

Note `RoomEntryCopy` no longer carries `scale`. That is deliberate and it will make Task 1 fail to typecheck until Step 2.

- [ ] **Step 2: Run the typecheck to see it fail**

Run: `npx tsc --noEmit`
Expected: FAIL — every room in `content/mahua-vann.ts` and `content/mahua-tola.ts` reports `Object literal may only specify known properties, and 'scale' does not exist in type 'RoomEntryCopy'`. Seven errors, three in Vann and four in Tola. This is the compiler finding every site Task 6 must clean.

- [ ] **Step 3: Delete the seven `scale:` lines**

In `content/mahua-vann.ts` and `content/mahua-tola.ts`, remove each `scale: "…"` property **and the comment block above it that explains the crop choice.** Those comments describe a decision this work reverses; leaving them would leave the next reader believing the page still crops that way. Their substance is preserved in the spec's §3 table.

- [ ] **Step 4: Point the old component and its consumers at the new types**

In `components/sections/RoomShowcase.tsx`, delete the local `RoomScale`, `RoomEntryCopy` and `RoomShowcaseCopy` declarations and replace them with:

```ts
import type { RoomEntryCopy, RoomScale, RoomShowcaseCopy } from "./RoomShowcase.types";

export type { RoomEntryCopy, RoomScale, RoomShowcaseCopy };
```

`RoomShowcase` reads `room.scale` in three places and it no longer exists on the type. Keep the component compiling by deriving the scale locally for now — it is deleted in Task 7 and this is scaffolding with a known lifetime:

```ts
/** Interim: `scale` left the content model in Task 1; this component dies in Task 7. */
const INTERIM_SCALE: RoomScale = "wide";
```

and use `INTERIM_SCALE` in place of `room.scale`.

In `components/property/PropertyPage.tsx`, change the type import on line 7 to:

```ts
import { RoomShowcase } from "@/components/sections/RoomShowcase";
import type { RoomShowcaseCopy } from "@/components/sections/RoomShowcase.types";
```

In both content files, change the `RoomShowcaseCopy` import to `@/components/sections/RoomShowcase.types`.

- [ ] **Step 5: Verify green**

Run: `npx tsc --noEmit && npm test -- --run && npm run lint`
Expected: all three pass. The rooms section still renders — every room now at `wide`, which looks wrong on the page and is expected; Task 5 replaces the renderer.

- [ ] **Step 6: Take the JavaScript baseline, before anything else lands**

On the clean tree, before committing:

```bash
npm run verify:budget -- --out docs/reviews/2026-08-11-card-stack/js-baseline.json
```

Record the `firstLoad.br` figure in the commit message below. **Task 7 asserts the final build is byte-identical to it.** Taking it now rather than quoting the 9 Aug evidence matters: other work has landed on this branch since, and a stale baseline would either charge this task with somebody else's bytes or hide its own.

- [ ] **Step 7: Commit**

```bash
git add docs/reviews/2026-08-11-card-stack/js-baseline.json components/sections/RoomShowcase.types.ts components/sections/RoomShowcase.tsx components/property/PropertyPage.tsx content/mahua-vann.ts content/mahua-tola.ts
git commit -m "refactor: lift the rooms content model out of its renderer

`scale` goes with it. Its three values encoded crop decisions that the
photographs state themselves — five of the seven room photographs are 2.29:1 or
wider and four were being cropped ~35% to reach a squarer box. Deleting the
field from the type first makes the compiler name all seven sites rather than
trusting a grep.

RoomShowcase is on an interim constant until the card stack replaces it.

First-load JS baselined at the firstLoad.br figure this step just measured —
paste it here as a number of bytes. Task 7 asserts the finished stack is
byte-identical to it."
```

---

### Task 2: `roomCardLayout` — the one place a card's shape is decided

**Files:**
- Create: `lib/room-card.ts`
- Test: `lib/room-card.test.ts`

**Interfaces:**
- Consumes: `MEDIA` from `@/lib/media`, `MediaId` type.
- Produces:
  - `type RoomCardLayout = "stacked" | "beside"`
  - `ROOM_CARD_ASPECT_THRESHOLD: number` (1.9)
  - `roomCardLayout(mediaId: MediaId): RoomCardLayout`
  - `roomCardAspect(mediaId: MediaId): number`

- [ ] **Step 1: Write the failing test**

`lib/room-card.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MEDIA } from "./media";
import { ROOM_CARD_ASPECT_THRESHOLD, roomCardAspect, roomCardLayout } from "./room-card";
import { VANN_COPY } from "@/content/mahua-vann";
import { TOLA_COPY } from "@/content/mahua-tola";

describe("roomCardLayout", () => {
  it("gives a wide photograph the stacked card — photo above the words", () => {
    // vann-room-cottage-plain is 1440x588 = 2.45:1
    expect(roomCardLayout("vann-room-cottage-plain")).toBe("stacked");
  });

  it("gives a squarer photograph the beside card", () => {
    // suite-tiger-painting is 1440x961 = 1.50:1
    expect(roomCardLayout("suite-tiger-painting")).toBe("beside");
  });

  it("gives a portrait photograph the beside card", () => {
    // tola-room-family is 1440x2160 = 0.67:1 — the one room that needs it
    expect(roomCardLayout("tola-room-family")).toBe("beside");
  });

  it("reports the photograph's real aspect, not the card's", () => {
    expect(roomCardAspect("tola-room-family")).toBeCloseTo(1440 / 2160, 3);
  });

  it("throws on an unknown id rather than defaulting to a layout", () => {
    // A silent default would put a portrait photograph in a 2.9:1 box and crop
    // 70% of it, with every test still green.
    expect(() => roomCardLayout("not-a-real-id" as never)).toThrow(/unknown media/i);
  });

  /**
   * The threshold's whole justification is that no room sits near it. If a
   * future re-crop moves one, this fails and the choice gets re-argued rather
   * than drifting.
   */
  it("keeps every room clear of the threshold by at least 0.35", () => {
    const ids = [
      ...VANN_COPY.showcaseCopy!["vann-rooms"].rooms.map((r) => r.mediaId),
      ...TOLA_COPY.showcaseCopy!["tola-rooms"].rooms.map((r) => r.mediaId),
    ];
    expect(ids.length).toBe(7);
    for (const id of ids) {
      const gap = Math.abs(roomCardAspect(id) - ROOM_CARD_ASPECT_THRESHOLD);
      expect(gap, `${id} sits too close to the layout threshold`).toBeGreaterThan(0.35);
    }
  });

  it("covers every room in both content files", () => {
    for (const id of Object.keys(MEDIA)) {
      if (!id.includes("room") && id !== "suite-tiger-painting") continue;
      expect(() => roomCardLayout(id as never)).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/room-card.test.ts`
Expected: FAIL — `Failed to resolve import "./room-card"`.

- [ ] **Step 3: Implement**

`lib/room-card.ts`:

```ts
import { MEDIA, type MediaId } from "@/lib/media";

/**
 * Which of the two card compositions a room gets, decided by the photograph
 * rather than by hand.
 *
 * The section this replaces carried a `scale` field per room, set by a human
 * and justified in a comment. Five of the seven room photographs are 2.29:1 or
 * wider, and two of them were being cropped by ~35% of their width to reach a
 * squarer box — a decision nothing in the codebase could check. Deriving the
 * composition from the asset is the same rule the leaf, the lantern, the
 * welcome logo and the forest tint all follow.
 */
export type RoomCardLayout = "stacked" | "beside";

/**
 * Wider than this and the photograph lies across the top of the card; squarer
 * and it stands beside the words.
 *
 * 1.9 separates the two real populations — 2.29 and up against 1.50 and 0.67 —
 * with the widest margin available. `room-card.test.ts` asserts no room is
 * within 0.35 of it, so this number is only ever crossed on purpose.
 */
export const ROOM_CARD_ASPECT_THRESHOLD = 1.9;

export function roomCardAspect(mediaId: MediaId): number {
  const entry = MEDIA[mediaId];
  if (!entry) throw new Error(`Unknown media id "${mediaId}" in a room card`);
  return entry.width / entry.height;
}

export function roomCardLayout(mediaId: MediaId): RoomCardLayout {
  return roomCardAspect(mediaId) >= ROOM_CARD_ASPECT_THRESHOLD ? "stacked" : "beside";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/room-card.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Watch the threshold guard fail**

Temporarily set `ROOM_CARD_ASPECT_THRESHOLD = 2.2`. Run the test again.
Expected: FAIL on "keeps every room clear of the threshold" naming the 2.29:1 rooms. Restore 1.9 and confirm green. **A guard nobody has watched fail is not a guard.**

- [ ] **Step 6: Commit**

```bash
git add lib/room-card.ts lib/room-card.test.ts
git commit -m "feat: decide a room card's composition from the photograph, not by hand

Five of seven room photographs are 2.29:1 or wider; one is squarer and one is portrait. The
threshold at 1.9 separates them with the widest margin available, and the test
fails if any room drifts within 0.35 of it — so the number can only ever be
crossed deliberately."
```

---

### Task 3: The dials, and the CSS the stack runs on

No visual change lands in this task. It puts every number in its one legal home and proves the custom properties reach the document, so Task 4 has something to style against.

**Files:**
- Modify: `lib/motion.ts` (append `ROOM_STACK` beside `STICKY_SCREENS_MAX`)
- Modify: `app/layout.tsx` (publish it, beside the `--welcome-*` block)
- Modify: `app/globals.css` (the reserve, the mechanics, the keyframes, the switch-offs)
- Test: `lib/motion.test.ts` (append; create if absent)

**Interfaces:**
- Consumes: nothing.
- Produces: `ROOM_STACK` from `@/lib/motion`, with keys `deckStep`, `gutter`, `heightMax`, `scaleMin`, `dim`, `barReserve`. CSS properties `--room-deck-step`, `--room-card-gutter`, `--room-card-height-max`, `--room-card-scale-min`, `--room-card-dim`, `--property-bar-reserve`.

- [ ] **Step 1: Write the failing test**

Append to `lib/motion.test.ts`:

```ts
import { ROOM_STACK } from "./motion";

describe("ROOM_STACK", () => {
  it("reserves more than the booking bar's measured height", () => {
    // Measured 11 Aug 2026 on both routes: 63px at 390, 69px at 768 and up.
    // `scripts/check_card_stack.mjs` re-measures the real bar and fails if it
    // ever grows past this; this test only guards the constant's intent.
    expect(ROOM_STACK.barReserve).toBeGreaterThanOrEqual(69);
  });

  it("recedes a covered card without hiding it", () => {
    expect(ROOM_STACK.scaleMin).toBeGreaterThan(0.85);
    expect(ROOM_STACK.scaleMin).toBeLessThan(1);
    // Dim, not vanish: a card the visitor can no longer see is a card that
    // stopped being a deck and started being a disappearance.
    expect(ROOM_STACK.dim).toBeGreaterThan(0.35);
    expect(ROOM_STACK.dim).toBeLessThan(1);
  });

  it("keeps a four-card deck inside the tightest measured slack", () => {
    // 390x844: 844 - 75 header - 63 bar = 706px of slack.
    const SLACK_390 = 706;
    const deck = ROOM_STACK.deckStep * 3;
    expect(deck + ROOM_STACK.gutter).toBeLessThan(SLACK_390 * 0.15);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/motion.test.ts`
Expected: FAIL — `ROOM_STACK` is not exported.

- [ ] **Step 3: Add the dials**

Append to `lib/motion.ts`:

```ts
/**
 * The rooms card stack — `components/sections/RoomCardStack.tsx`.
 *
 * Every number here is spent against one measured budget: the *slack* between
 * the sticky header and the booking bar, which is **706px on a 390x844 phone**
 * and 724px at 1440x900. The phone is the tighter case, which is a first on
 * this page, so nothing here may be tuned against a desktop screenshot.
 *
 * `barReserve` is a constant rather than the bar's published height on purpose.
 * `PropertyBar` returns `null` over the hero, the invitation and the footer, so
 * a live measurement would flip between 0 and 69 as the visitor scrolls, and
 * card height is computed from it — every card in the chapter would resize, and
 * a resizing card moves the page under the reader's hand.
 * `scripts/check_card_stack.mjs` measures the real bar at four widths and fails
 * if it outgrows this, so the drift a constant invites is caught rather than
 * shipped.
 */
export const ROOM_STACK = {
  /** Vertical offset added per card, so the read cards leave a visible deck. */
  deckStep: 14,
  /** Breathing room between the deepest card and the booking bar. */
  gutter: 24,
  /** Past this a card stops reading as a card and starts reading as a section. */
  heightMax: 760,
  /** A covered card's scale at full recede. */
  scaleMin: 0.94,
  /** A covered card's opacity at full recede. */
  dim: 0.55,
  /** Space held for the booking bar. Measured 63px at 390, 69px from 768. */
  barReserve: 72,
} as const;
```

- [ ] **Step 4: Publish them**

In `app/layout.tsx`, import `ROOM_STACK` alongside the existing motion imports and add to the style object, after the `--welcome-*` group:

```tsx
          // The rooms card stack, on the same terms as everything above it: the
          // numbers live in `lib/motion.ts`, the rules live in
          // `app/globals.css`, and neither can drift from the other. Published
          // on `<html>` rather than on the section because `--property-bar-reserve`
          // describes a bar that is fixed to the viewport, not to any chapter.
          "--room-deck-step": `${ROOM_STACK.deckStep}px`,
          "--room-card-gutter": `${ROOM_STACK.gutter}px`,
          "--room-card-height-max": `${ROOM_STACK.heightMax}px`,
          "--room-card-scale-min": String(ROOM_STACK.scaleMin),
          "--room-card-dim": String(ROOM_STACK.dim),
          "--property-bar-reserve": `${ROOM_STACK.barReserve}px`,
          // The base paper, under its own name.
          //
          // `--bg` cannot serve here: `ChapterSurface` shadows it with
          // `var(--surface)` on every second chapter, so inside one of those a
          // card asking for `--bg` gets the deeper paper it is trying to sit
          // ON, and the whole stack goes invisible against its own section.
          // `--surface` is never shadowed, so this is the missing half of the
          // pair. Same value as `--bg` at the root, and never reassigned.
          "--paper": PALETTE.paper,
```

- [ ] **Step 5: Add the CSS**

Append to `app/globals.css`, after the `.sticky-scene` rules:

```css
/*
 * The rooms card stack — `components/sections/RoomCardStack.tsx`.
 *
 * **The cards are direct children of the stack, and that is load-bearing.**
 * `position: sticky` is clamped to its containing block, so wrapping each card
 * in a slot of the card's own height leaves zero slack and the card renders
 * exactly as if it were `static`. Measured in Chrome 151 over four cards:
 * wrapped, **0 of 4** were ever simultaneously pinned; as direct children,
 * **3 of 4**. The deck needs each card pinned while LATER cards scroll past it,
 * so the containing block has to be the whole stack.
 *
 * **And a sticky element can drive its own view timeline** — `view()` tracks
 * the element's flow position, not its stuck one. The wrapper an earlier draft
 * introduced to work around that was unnecessary and fatal at once.
 *
 * Note the shape of the failure: in the broken version the recede ran perfectly
 * on all four cards. Everything animated; nothing stacked. Only an assertion
 * that a card's position FREEZES while the next advances catches it.
 */
.room-stack {
  /*
   * `--room-card-height` is solved, not chosen. `100svh` and not `100vh`:
   * on a phone the URL bar's collapse changes `vh` mid-scroll, which would
   * resize every card in the chapter while the visitor is reading one.
   *
   * `--room-count` falls back to 1 so a stack rendered without it degrades to a
   * single-card deck depth rather than poisoning the whole `min()` — an invalid
   * `var()` here would take `height` down with it.
   */
  --room-deck-depth: calc(var(--room-deck-step) * (var(--room-count, 1) - 1));
  --room-card-height: min(
    calc(
      100svh - var(--header-height, 0px) - var(--property-bar-reserve) -
        var(--room-deck-depth) - var(--room-card-gutter)
    ),
    var(--room-card-height-max)
  );
}

.room-card {
  position: sticky;
  top: calc(var(--header-height, 0px) + var(--room-deck-step) * var(--i));
  height: var(--room-card-height);
  /* The deck edge. Gold's actual job — decorative, carrying no text. */
  border-top: 1px solid var(--accent);
  /* Scaling from the top keeps the deck's hairlines evenly spaced as cards recede. */
  transform-origin: top center;
  animation: room-recede linear both;
  animation-timeline: view();
  animation-range: exit 0% exit 100%;
}

@keyframes room-recede {
  to {
    transform: scale(var(--room-card-scale-min));
    opacity: var(--room-card-dim);
  }
}

/*
 * Reduced motion keeps the stack and drops only the recede — deliberately
 * unlike `.sticky-scene` above, which collapses entirely.
 *
 * The two are not alike. `StickyScene` reserves *empty* scroll that only means
 * anything once something moves through it, so with motion off it is screens of
 * nothing. A card stack's scroll is the visitor's own movement, 1:1, with
 * nothing animating at them. What goes is the recede, which is the only part
 * not under their hand.
 */
@media (prefers-reduced-motion: reduce) {
  .room-card {
    animation: none;
  }
}
```

- [ ] **Step 6: Verify green and that the properties reach the document**

Run: `npx vitest run lib/motion.test.ts && npx tsc --noEmit && npm run lint`
Expected: PASS.

Then `npm run dev`, open `/mahua-vann`, and in the console:

```js
getComputedStyle(document.documentElement).getPropertyValue("--property-bar-reserve")
```

Expected: `" 72px"`. If it is empty the layout edit did not land, and every later task will style against nothing.

- [ ] **Step 7: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts app/layout.tsx app/globals.css
git commit -m "feat: the card stack's dials and mechanics, no markup yet

Card height is solved from the measured slack between header and booking bar —
706px on a 390x844 phone, which is tighter than the 1440 this project usually
designs against.

The booking bar's space is a constant, not its published height: PropertyBar
returns null over the hero, invitation and footer, so a live measurement would
flip 0<->69 mid-scroll and resize every card in the chapter. The rig re-measures
the real bar and fails if it outgrows the reserve.

Reduced motion keeps the stack and drops only the recede, unlike .sticky-scene
— that construct reserves empty scroll; this one's scroll is the visitor's own
movement."
```

---

### Task 4: The card

One room, rendered correctly in both compositions, with no stack around it yet. Splitting this from Task 5 means a reviewer can reject the card's internals without re-arguing the stack.

**Files:**
- Create: `components/sections/RoomCard.tsx`
- Test: `components/sections/RoomCard.test.tsx`

**Interfaces:**
- Consumes: `RoomEntryCopy` from `@/components/sections/RoomShowcase.types`; `roomCardLayout` from `@/lib/room-card`; `Photo` from `@/components/ui/Photo`.
- Produces:
  - `ROOM_CARD_SIZES: Record<RoomCardLayout, string>`
  - `ROOM_CARD_BOXES: Record<RoomCardLayout, number>`
  - `RoomCard({ room, index }: { room: RoomEntryCopy; index: number })`

- [ ] **Step 1: Write the failing test**

`components/sections/RoomCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomCard } from "./RoomCard";
import type { RoomEntryCopy } from "./RoomShowcase.types";

const WIDE: RoomEntryCopy = {
  mediaId: "vann-room-cottage-plain",
  name: "Cottage without Deck",
  line: "A private sit-out under cane.",
  facts: ["324 sq ft", "King bed"],
};

const PORTRAIT: RoomEntryCopy = {
  mediaId: "tola-room-family",
  name: "Family Suite",
  line: "Two interconnected rooms.",
  facts: ["450 sq ft"],
};

describe("RoomCard", () => {
  it("writes its index so the deck can step it down", () => {
    const { container } = render(<RoomCard room={WIDE} index={2} onSurface={false} />);
    const card = container.querySelector(".room-card") as HTMLElement;
    expect(card.style.getPropertyValue("--i")).toBe("2");
  });

  it("lays a wide photograph across the top", () => {
    const { container } = render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).toHaveAttribute("data-card-layout", "stacked");
  });

  it("stands a portrait photograph beside the words", () => {
    const { container } = render(<RoomCard room={PORTRAIT} index={0} onSurface={false} />);
    expect(container.querySelector(".room-card")).toHaveAttribute("data-card-layout", "beside");
  });

  it("renders the room's words", () => {
    render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(screen.getByRole("heading", { name: "Cottage without Deck" })).toBeInTheDocument();
    expect(screen.getByText("A private sit-out under cane.")).toBeInTheDocument();
    expect(screen.getByText("324 sq ft · King bed")).toBeInTheDocument();
  });

  it("omits the shared-photograph note when there is none", () => {
    render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(screen.queryByTestId("room-note")).not.toBeInTheDocument();
  });

  it("shows the shared-photograph note when there is one", () => {
    render(<RoomCard room={{ ...WIDE, note: "Shown: Suite." }} index={0} onSurface={false} />);
    expect(screen.getByTestId("room-note")).toHaveTextContent("Shown: Suite.");
  });

  it("takes the opposite paper to its section, both ways round", () => {
    // The deck is only legible if a card contrasts with what it sits on. Both
    // values are guarded surfaces in `lib/palette.test.ts`, so no contrast
    // probe is added here — and deliberately no `data-contrast` hook either:
    // an attribute no rig reads is defect shape #36, a check that documents
    // itself as covering something it never sees.
    const onPaper = render(<RoomCard room={WIDE} index={0} onSurface={false} />);
    expect(
      (onPaper.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--surface)");
    const onDeep = render(<RoomCard room={WIDE} index={0} onSurface />);
    expect(
      (onDeep.container.querySelector(".room-card") as HTMLElement).style.backgroundColor,
    ).toBe("var(--paper)");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/RoomCard.test.tsx`
Expected: FAIL — `Failed to resolve import "./RoomCard"`.

- [ ] **Step 3: Implement**

`components/sections/RoomCard.tsx`:

```tsx
import { Photo } from "@/components/ui/Photo";
import { roomCardLayout, type RoomCardLayout } from "@/lib/room-card";
import type { RoomEntryCopy } from "./RoomShowcase.types";

/**
 * One room, as a card in the stack.
 *
 * Two compositions, chosen by `roomCardLayout` from the photograph's own aspect
 * rather than by a field in the content file:
 *
 * - **stacked** — the photograph lies across the top, words in a band beneath.
 *   Five of the seven rooms, all 2.29:1 or wider.
 * - **beside** — the photograph stands next to the words from `lg` up, above
 *   them below it. `suite-tiger-painting` (1.50:1) and `tola-room-family`
 *   (0.67:1, portrait).
 *
 * **The photo area is deliberately wider than every wide photograph it holds**,
 * so what a crop takes is height and never width. Every documented crop
 * constraint on this page is horizontal — `vann-room-cottage-plain` names a
 * sit-out and a cane chair near its frame edges — and a room interior survives
 * a trimmed ceiling far better than a trimmed wall.
 */

/** Exported for `lib/sizes.test.ts`, like every other section's. */
export const ROOM_CARD_SIZES: Record<RoomCardLayout, string> = {
  stacked: "(min-width: 1600px) 1504px, (min-width: 768px) calc(100vw - 144px), calc(100vw - 48px)",
  beside: "(min-width: 1024px) 46vw, calc(100vw - 48px)",
};

/**
 * The photo area's aspect per composition — what `coverSizes` widens against.
 * Wider than the widest photograph (2.45:1) on purpose; see the note above.
 */
export const ROOM_CARD_BOXES: Record<RoomCardLayout, number> = {
  stacked: 2.9,
  beside: 0.86,
};

export function RoomCard({
  room,
  index,
  onSurface,
}: {
  room: RoomEntryCopy;
  index: number;
  /** True when the chapter itself is the deeper paper — the card then takes the lighter. */
  onSurface: boolean;
}) {
  const layout = roomCardLayout(room.mediaId);
  const beside = layout === "beside";

  return (
    <li
      className={`room-card flex overflow-hidden ${
        beside ? "flex-col lg:flex-row lg:items-stretch" : "flex-col"
      }`}
      data-card-layout={layout}
      style={
        {
          "--i": String(index),
          // The opposite paper to the section, so the deck is visible against
          // it. Inside a `surface` chapter `--bg` is the deeper paper (see the
          // note on `--paper` in `app/layout.tsx`), which is why this reaches
          // for `--paper` and not `--bg`.
          backgroundColor: onSurface ? "var(--paper)" : "var(--surface)",
        } as React.CSSProperties
      }
    >
      <div className={beside ? "min-h-0 flex-1 lg:w-[46%] lg:flex-none" : "min-h-0 flex-1"}>
        <Photo
          id={room.mediaId}
          sizes={ROOM_CARD_SIZES[layout]}
          box={ROOM_CARD_BOXES[layout]}
          pictureClassName="block h-full w-full"
          className="h-full w-full object-cover"
        />
      </div>

      <div
        className={`flex shrink-0 flex-col justify-center gap-3 px-6 py-6 md:px-10 ${
          beside ? "lg:flex-1" : ""
        }`}
      >
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-light leading-tight text-[color:var(--text)] md:text-3xl">
          {room.name}
        </h3>
        <p
          className="max-w-[46ch] font-[family-name:var(--font-body)] text-[1.02rem] leading-[1.7]"
          style={{ color: "var(--dim)" }}
        >
          {room.line}
        </p>
        <p
          className="border-t pt-3 font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em]"
          style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
        >
          {room.facts.join(" · ")}
        </p>
        {room.note && (
          <p
            data-testid="room-note"
            className="font-[family-name:var(--font-body)] text-xs italic"
            style={{ color: "var(--dim)" }}
          >
            {room.note}
          </p>
        )}
      </div>
    </li>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/sections/RoomCard.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add components/sections/RoomCard.tsx components/sections/RoomCard.test.tsx
git commit -m "feat: one room as a card, in two compositions

The photo area is wider than every wide photograph it holds, so a crop takes
height and never width — every documented crop constraint on this page is
horizontal, and vann-room-cottage-plain names a sit-out and cane chair near its
frame edges.

data-contrast is an attribute, not a structural selector: #forest p matched
ChapterMark's gold paragraphs and reported 1:1 for a whole task."
```

---

### Task 5: The stack, on both routes

**Files:**
- Create: `components/sections/RoomCardStack.tsx`
- Test: `components/sections/RoomCardStack.test.tsx`
- Modify: `components/property/PropertyPage.tsx` (the `showcase` branch)
- Modify: `lib/sizes.test.ts`

**Interfaces:**
- Consumes: `RoomCard`, `ROOM_CARD_SIZES`, `ROOM_CARD_BOXES` from Task 4; `RoomShowcaseCopy` from Task 1; `ChapterSurface`, `ChapterMark`, `TwoToneHeading`, `Enter`.
- Produces: `RoomCardStack({ chapter, copy, surface }: { chapter: PropertyChapter; copy: RoomShowcaseCopy; surface?: boolean })`.

- [ ] **Step 1: Write the failing test**

`components/sections/RoomCardStack.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomCardStack } from "./RoomCardStack";
import { TOLA_COPY } from "@/content/mahua-tola";
import type { PropertyChapter } from "@/content/property-chapters";

const CHAPTER: PropertyChapter = {
  id: "tola-rooms",
  number: "05",
  label: "Rooms",
  shape: "showcase",
  media: [],
};
const COPY = TOLA_COPY.showcaseCopy!["tola-rooms"];

describe("RoomCardStack", () => {
  it("gives every room a card, in order", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.querySelectorAll(".room-card")).toHaveLength(COPY.rooms.length);
    const indices = [...container.querySelectorAll<HTMLElement>(".room-card")].map((c) =>
      c.style.getPropertyValue("--i"),
    );
    expect(indices).toEqual(COPY.rooms.map((_, i) => String(i)));
  });

  /**
   * Every card must be a DIRECT child of the stack. `position: sticky` is
   * clamped to its containing block, so any wrapper between the two leaves the
   * card no slack and it renders exactly as if it were `static` — measured at
   * 0 of 4 cards ever pinned. The stack still looks alive, because the recede
   * runs regardless; it simply never stacks.
   */
  it("makes every card a direct child of the stack", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector("ol.room-stack");
    expect(stack.children).toHaveLength(COPY.rooms.length);
    for (const child of stack.children) {
      expect(child.tagName).toBe("LI");
      expect(child).toHaveClass("room-card");
    }
  });

  it("tells the stack how many rooms it holds, so the deck depth resolves", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector(".room-stack") as HTMLElement;
    expect(stack.style.getPropertyValue("--room-count")).toBe(String(COPY.rooms.length));
  });

  it("keeps the heading out of the stack, so it scrolls away normally", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    const stack = container.querySelector(".room-stack")!;
    expect(stack.querySelector("h2")).toBeNull();
  });

  it("renders the chapter's own intro", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.textContent).toContain(COPY.intro);
  });

  it("uses a list, so the rooms are announced as the four things they are", () => {
    const { container } = render(<RoomCardStack chapter={CHAPTER} copy={COPY} />);
    expect(container.querySelector("ol.room-stack")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run components/sections/RoomCardStack.test.tsx`
Expected: FAIL — `Failed to resolve import "./RoomCardStack"`.

- [ ] **Step 3: Implement**

`components/sections/RoomCardStack.tsx`:

```tsx
import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { PropertyChapter } from "@/content/property-chapters";
import { ENTER } from "@/lib/motion";
import { RoomCard } from "./RoomCard";
import type { RoomShowcaseCopy } from "./RoomShowcase.types";

/**
 * The rooms, as a stack of cards the visitor scrolls through.
 *
 * Client request, 11 Aug 2026: "pile up, with recede" — each card sticks below
 * the header while the next rises over it, and a covered card scales down and
 * dims so the deck reads as depth rather than as stacked paper.
 *
 * **It carries no JavaScript.** The stacking is `position: sticky`; the recede
 * is a CSS scroll-driven animation reading each card's own view timeline. There is
 * no hook here, no scroll listener and no `"use client"` — which is what let
 * this ship against 3.7 KB of budget headroom.
 *
 * The mechanics live in `app/globals.css` under `.room-stack`; the numbers live
 * in `lib/motion.ts` as `ROOM_STACK`. Neither is written here.
 */
export function RoomCardStack({
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

        {/*
         * `--room-count` is what makes the deck depth a calculation rather than
         * a number per property: Vann has three rooms and Tola four, so their
         * decks are 28px and 42px and their cards differ in height by 14px.
         * Written here because this is the only place that knows the count.
         */}
        <ol
          className="room-stack mt-10 md:mt-12"
          style={{ "--room-count": String(copy.rooms.length) } as React.CSSProperties}
        >
          {copy.rooms.map((room, i) => (
            <RoomCard key={room.name} room={room} index={i} onSurface={surface} />
          ))}
        </ol>
      </div>
    </ChapterSurface>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/sections/RoomCardStack.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Mount it on both routes**

In `components/property/PropertyPage.tsx`, replace the `showcase` branch body:

```tsx
            case "showcase": {
              const showcaseCopy = copy.showcaseCopy?.[chapter.id];
              if (!showcaseCopy) throw new Error(`No showcase copy for "${chapter.id}"`);
              return (
                <RoomCardStack key={chapter.id} chapter={chapter} copy={showcaseCopy} surface={surface} />
              );
            }
```

and change the import on line 7 to `import { RoomCardStack } from "@/components/sections/RoomCardStack";`.

- [ ] **Step 6: Update the sizes round-trip**

In `lib/sizes.test.ts`, replace the `RoomShowcase` import and its three `LIVE_SLOTS` entries with:

```ts
import { ROOM_CARD_BOXES, ROOM_CARD_SIZES } from "@/components/sections/RoomCard";
```

```ts
  ...(["stacked", "beside"] as const).map((k) => ({
    name: `RoomCard.${k}`,
    sizes: ROOM_CARD_SIZES[k],
    box: ROOM_CARD_BOXES[k],
  })),
```

- [ ] **Step 7: Look at it, at 390 and at 1440**

Run `npm run dev`, open `/mahua-tola`, scroll to the rooms chapter at 1440×900 **and** at 390×844.

Expected: four cards pile up under the header, earlier cards leaving hairlines at the top, covered cards visibly smaller and dimmer. **Open the 390 view and read the words on the card** — no rig on this project measures type over cream, and that blind spot shipped a map with 4.3px labels through fifteen reviews.

If nothing stacks, check Windows *Settings → Accessibility → Visual effects → Animation effects* before the code: with it off, Chrome reports `prefers-reduced-motion: reduce`, the recede is switched off by design, and it looks like a broken build.

- [ ] **Step 8: Verify green**

Run: `npm test -- --run && npx tsc --noEmit && npm run lint`
Expected: all pass. `RoomShowcase.test.tsx` still passes — that component is still in the tree, just unmounted.

- [ ] **Step 9: Commit**

```bash
git add components/sections/RoomCardStack.tsx components/sections/RoomCardStack.test.tsx components/property/PropertyPage.tsx lib/sizes.test.ts
git commit -m "feat: the rooms as a card stack on both property pages

Carries no JavaScript: the stacking is position: sticky and the recede is a CSS
scroll-driven animation reading each slot's view timeline. No hook, no scroll
listener, no \"use client\".

--room-count is written by the section because it is the only thing that knows
it — Vann's three rooms and Tola's four give 28px and 42px decks and cards that
differ by 14px, from one formula."
```

---

### Task 6: The rig

**Files:**
- Create: `scripts/check_card_stack.mjs`

**Interfaces:**
- Consumes: a production build served on a port (default 3100, `--port` to move it), matching `scripts/check_lantern.mjs`'s argument handling.
- Produces: exit 0 on pass, 1 on any failure; a JSON report to `--out` when given.

- [ ] **Step 1: Read the rig it should look like**

Read `scripts/check_lantern.mjs` end to end. Match its argument parsing, its console output shape, its exit-code handling and its report-writing. **Do not invent a new house style for the eleventh rig in this directory.**

- [ ] **Step 2: Write the rig**

`scripts/check_card_stack.mjs` asserts, on `/mahua-vann` and `/mahua-tola`, at 390×844, 768×1024, 1440×900 and 1920×1080:

1. **Cards stack.** Scroll the chapter in ~120px steps. For each adjacent pair, find a window where card *i*'s `getBoundingClientRect().top` changes by < 2px across three consecutive steps while card *i+1*'s changes by > 40px. Fail naming the pair if no such window exists.
2. **No card is clipped.** At every step where a card is on screen, assert `rect.top >= headerHeight - 1` and `rect.bottom <= innerHeight - barHeight + 1`, where `barHeight` is the *measured* `[data-property-bar]` height, 0 when absent.
3. **The reserve covers the bar.** Assert the measured `[data-property-bar]` height ≤ the computed `--property-bar-reserve`. **This is the assertion that makes a constant safe** — see `ROOM_STACK.barReserve`.
4. **The deck is visible.** At the last card's resting position, assert *n* − 1 earlier cards have a visible strip ≥ 6px tall above it.
5. **The recede happened.** At the same position, assert card 0's rendered width < card *n*−1's by ≥ 1.5%, and its computed `opacity` < 0.99. Read from `getBoundingClientRect()` and `getComputedStyle`, **never from the stylesheet** — a check that reads back the CSS it was given proves nothing.
6. **No photograph loses more than 25% of its width.** For each card, compare the `<img>`'s `naturalWidth / naturalHeight` against its rendered box aspect; where the box is wider, the crop is vertical and passes. Fail naming the room otherwise.

Add a `--no-recede` flag that emulates `prefers-reduced-motion: reduce` and asserts 1, 2, 3, 4 and 6 still hold while 5 does not.

- [ ] **Step 3: Run it against the real build**

```bash
npm run build && npx next start -p 3100
node scripts/check_card_stack.mjs --port 3100
node scripts/check_card_stack.mjs --port 3100 --no-recede
```

Expected: exit 0 both times.

- [ ] **Step 4: Break the page three ways and watch it fail**

**This step is not optional and its output goes in the commit message.** Thirty-eight catalogued defects on this project are checks that confirmed a mechanism was configured rather than that behaviour changed.

1. Comment out `position: sticky` in `.room-card` → assertion 1 must fail.
2. Set `ROOM_STACK.heightMax` to 1200 → assertion 2 must fail at 390 and 1440.
3. Delete the `animation-timeline` line → assertion 5 must fail, and 1–4 and 6 must still pass.
4. Set `ROOM_STACK.barReserve` to 40 → assertion 3 must fail.

Restore all four and confirm exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/check_card_stack.mjs
git commit -m "test: a browser rig for the card stack, watched failing four ways

Asserts behaviour, never configuration: that a card's position freezes while the
next advances, that no card is clipped by the header or the booking bar, that
the reserve really covers the measured bar, that the deck is visible, that a
covered card is measurably smaller and dimmer, and that no photograph loses more
than 25% of its width.

Watched failing with sticky removed, with the card height forced past the slack,
with animation-timeline deleted, and with the bar reserve cut to 40px."
```

---

### Task 7: Delete the old section, and prove the page

**Files:**
- Delete: `components/sections/RoomShowcase.tsx`, `components/sections/RoomShowcase.test.tsx`
- Modify: `components/sections/RoomShowcase.types.ts` (drop the retired `RoomScale`)
- Create: `docs/reviews/2026-08-11-card-stack/README.md` and its evidence

- [ ] **Step 1: Delete**

```bash
git rm components/sections/RoomShowcase.tsx components/sections/RoomShowcase.test.tsx
```

Remove `RoomScale` from `RoomShowcase.types.ts` — Task 1 kept it only so a stale `scale:` would be a named compile error, and both content files are clean now.

- [ ] **Step 2: Prove nothing referenced it**

Run: `npx tsc --noEmit && npm test -- --run && npm run lint`
Expected: all green. If `lib/sizes.test.ts` fails, Task 5 Step 6 was skipped.

- [ ] **Step 3: Measure everything**

```bash
npm run build && npx next start -p 3100
node scripts/check_card_stack.mjs --port 3100 --out docs/reviews/2026-08-11-card-stack/card-stack.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-vann --out docs/reviews/2026-08-11-card-stack/vann-density.json
node scripts/measure_density.mjs --url http://localhost:3100/mahua-tola --out docs/reviews/2026-08-11-card-stack/tola-density.json
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-vann
node scripts/check_contrast_over_photos.mjs --url http://localhost:3100/mahua-tola
node scripts/check_image_resolution.mjs
node scripts/capture_property_pages.mjs
npm run verify:budget
```

**Acceptance:** `vann-rooms` ≤ 40.1% and `tola-rooms` ≤ 39.0% empty — the figures before this work; neither may get worse. Every chapter inside 45%. Contrast rigs exit 0.

**The JavaScript baseline is taken in Task 1, not quoted here.** `docs/reviews/2026-08-09-property-redesign/vann-js-budget.json` records 171,323 bytes brotli, and other work has landed on this branch since — `docs/PROJECT-STATE.md` now reports 159 KB. A stale baseline would charge this task with somebody else's change or, worse, hide its own. So: **before Task 2, run `npm run verify:budget -- --out /tmp/js-baseline.json` on a clean tree and keep the number.** Acceptance here is that first-load JavaScript is **byte-identical to that baseline**. Not "close": identical. This design adds no JavaScript.

- [ ] **Step 4: Read the 390px screenshots**

Open `docs/reviews/2026-08-11-card-stack/mahua-vann-390.png` and `mahua-tola-390.png` and **read the words on the cards.** Every rig here measures at 1440 and type over cream is measured nowhere — that blind spot shipped an illegible map through fifteen task reviews and a whole-branch verification.

- [ ] **Step 5: Write the evidence README**

`docs/reviews/2026-08-11-card-stack/README.md`: what was built, every number above with its command, the before/after density for both rooms chapters, the JS budget delta (0), the four ways the rig was watched failing, and — stated plainly — **the mobile scroll-length increase the client accepted on 11 Aug: ~27% on Vann and ~38% on Tola.** Report it as measured, not as projected; if it differs from the spec's projection, the measurement is what is true and the spec's §9 gets corrected.

- [ ] **Step 6: Commit**

```bash
git add -A docs/reviews/2026-08-11-card-stack components/sections
git commit -m "feat: retire RoomShowcase; the card stack is the rooms chapter

Evidence in docs/reviews/2026-08-11-card-stack/. First-load JavaScript
byte-identical, which is the assertion this whole design was shaped around."
```

---

### Task 8: Write it down

The per-task ledgers are git-ignored and do not survive a clone. Anything durable goes into `docs/` or a source file's own comment.

**Files:**
- Modify: `CLAUDE.md`, `docs/PROJECT-STATE.md`, `docs/DECISIONS.md`, `docs/superpowers/plans/2026-08-11-room-card-stack.md`

- [ ] **Step 1: `CLAUDE.md`**

Update the Status table (phase, tests count, evidence), add `check_card_stack.mjs` to the Commands list with its one-line purpose, and add the card stack to the property-pages description.

- [ ] **Step 2: `docs/DECISIONS.md`**

Add the 11 Aug client rulings to the table: the card stack requested, and "pile up with recede" chosen over the alternatives. Add a new section covering, at minimum:
- **why the cards must be direct children of the stack** — `position: sticky` is clamped to its containing block, so a wrapper of the card's own height leaves zero slack and the card renders as `static`. Measured: 0 of 4 cards pinned wrapped, 3 of 4 as direct children. **And the recede ran perfectly in the broken version** — everything animated, nothing stacked, which is why the assertion has to be that a card's position freezes while the next advances;
- **why the booking bar's space is a constant and not its published height** — `PropertyBar` returns `null` over three regions, so a live value would resize every card mid-scroll;
- **why reduced motion keeps the stack here but collapses `StickyScene`** — one reserves empty scroll, the other's scroll is the visitor's own movement;
- **the phone as the binding case at 706px**, the first time on this project;
- **that two of the five wide room photographs were being cropped ~35% of their width, and the one portrait photograph half its height,** by the design this replaced, and that the new crop bound is horizontal-only and asserted.

Add any new defect instances to §2 with the count updated in its heading, in `CLAUDE.md`'s reading list, and in the memory index.

- [ ] **Step 3: `docs/PROJECT-STATE.md`**

Update the branch state, the test count, and the evidence list.

- [ ] **Step 4: The plan's own status**

Mark this plan complete at its head, with the date and anything that turned out different from what it said — following the convention `2026-08-05-signature-interactions.md` set with its status table. **A plan that lies about its own outcome is worse than no plan.**

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/
git commit -m "docs: the card stack, and the three things it was expensive to learn"
```

---

## Self-Review

**Spec coverage.** §1 → Tasks 4, 5. §2 (measured envelope) → Task 3's `ROOM_STACK` and its test. §3 (photographs, layout rule, crop bound) → Tasks 1, 2, 4, and rig assertion 6. §4 (architecture, cards as direct children) → Task 5 and its direct-child test. §5 (bar reserve, no JS) → Task 3, rig assertion 3, Task 7's byte-identical budget check. §6 (stack mechanics) → Task 3. §7 (recede, dials in `lib/motion.ts`) → Task 3, rig assertion 5. §8 (degradation ladder) → Task 3's reduced-motion rule, Task 6's `--no-recede` arm. §9 (solved card height) → Task 3's CSS and its slack test; the projected section heights are confirmed in Task 7 Step 5. §10 (what must be proved) → Tasks 6 and 7. §11 (what is replaced) → Tasks 1, 5, 7. §12 (Tola's room count) → out of scope, unchanged.

**Two gaps found and closed while reviewing.** The spec's §8 promises a "no `animation-timeline` support" fallback distinct from reduced motion, but no task tested support-absence separately — Task 6's break #3 (deleting the `animation-timeline` line) now covers it, which is the same observable state. And nothing initially asserted the *photo crop bound* the spec's §3 makes its central promise; that is now rig assertion 6.

**Type consistency.** `RoomCardLayout` (`"stacked" | "beside"`) is defined in Task 2 and used unchanged in Tasks 4 and 5. `ROOM_CARD_SIZES` / `ROOM_CARD_BOXES` are exported from `RoomCard.tsx` in Task 4 and imported from that same path in Task 5's `sizes.test.ts` edit. `RoomShowcaseCopy` moves in Task 1 and every later import uses `@/components/sections/RoomShowcase.types`. `ROOM_STACK`'s six keys in Task 3 match the six CSS properties published in the same task and consumed in the same task's CSS.

**Known scaffolding with a stated lifetime:** `INTERIM_SCALE` in Task 1 and `RoomScale` in `RoomShowcase.types.ts`, both deleted in Task 7.
