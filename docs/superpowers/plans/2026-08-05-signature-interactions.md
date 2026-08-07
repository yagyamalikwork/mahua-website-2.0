# The signature interactions — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

> ## ⚠ Status, 7 Aug 2026 — read this before following any task below
>
> **Tasks 1–7 are done. Tasks 5–7 were then overtaken by events and their output is dormant. Tasks 8–10 are
> open, and task 9 as written is obsolete.** This plan is kept for its reasoning, not as a set of
> instructions to follow literally. The record of what actually happened is
> [`docs/DECISIONS.md`](../../DECISIONS.md) §7–§11 and [`docs/PROJECT-STATE.md`](../../PROJECT-STATE.md).
>
> | Task | State |
> |---|---|
> | 1 · The sliding rule | ✅ shipped. `check_rule_in.mjs` |
> | 2 · Extract a leaf from the logo | ✅ **superseded.** The logo's leaves are stylised to be read eight at a time and are a blob at 24px; the client supplied a hand-drawn PNG instead. `build_leaf.mjs` |
> | 3 · The leaf cursor | ✅ shipped, with the removability contract the client asked for |
> | 4 · The leaf cursor's rig | ✅ shipped. `check_leaf_cursor.mjs` |
> | 5 · The tiger drawing | ⚠️ **built, then replaced.** Three hand-drawn attempts failed; the client supplied a licensed vector, then film. `InkTiger.tsx` and `tiger-art.ts` are intact, tested, and unmounted |
> | 6 · The tiger inks itself in | ⚠️ built, dormant with the component |
> | 7 · It lives, dozes, stirs | ⚠️ built, dormant with the component |
> | — · **The two films** | ✅ **not in this plan.** A tiger closing `04 · Days in the Field`, a potter closing `02 · Rooted like the mahua`. Play once, hold the last frame, replay on a deliberate hover. `DECISIONS.md` §9 |
> | — · **The hanging lantern** | ✅ **not in this plan.** Client request, 7 Aug. Hangs out of `after-dark` into `06 · The Lantern Hour` and swings when pushed. `check_lantern.mjs`, `DECISIONS.md` §11 |
> | 8 · The butterfly | ⬜ **blocked on a client decision.** The two overlay films supplied 7 Aug cannot be used — chroma green, butterflies 1.9% of frame width. `DECISIONS.md` §13 |
> | 9 · The tiger's browser rig | ✅ **done as `scripts/check_films.mjs`, 8 Aug** — a rig for the two *films*, not for the SVG the task below describes. The task's own steps were not built and should not be. `DECISIONS.md` §12 |
> | 10 · Whole-page verification | ⬜ open |

**Goal:** Ship the three signature interactions — a hairline that slides in under links, a mahua leaf that
follows the pointer, and an ink tiger that draws itself and then dozes.

**Architecture:** All three are CSS-first. The sliding rule and the tiger's inking, living and dozing are
pure CSS driven by data attributes, so they cost nothing against the JavaScript budget and work with no
script at all. Only the leaf cursor needs JavaScript, and it is dynamically imported behind a fine-pointer
check so phones never fetch it. Both drawings are single exported constants in single files, so either can be
replaced without touching anything else.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Vitest, Playwright, sharp.

**Spec:** [`docs/superpowers/specs/2026-08-05-signature-interactions-design.md`](../specs/2026-08-05-signature-interactions-design.md)

## Global Constraints

Every task inherits these. They are not restated per task.

- **First-load JavaScript ≤ 175 KB transferred before any scroll.** Currently 154 KB. `npm run verify:budget`
  fails on the bytes.
- **No component hard-codes a colour, a duration or a string of copy.** `lib/palette.ts`, `lib/motion.ts`,
  `content/home.ts`. Numbers CSS needs travel `lib/motion.ts` → `app/layout.tsx` writes a custom property on
  `<html>` → `app/globals.css` reads it back.
- **Everything decorative is `aria-hidden`** and has a defined still state under
  `prefers-reduced-motion: reduce`.
- **Fail-safe by construction.** With no JavaScript, every element is fully present and still — never
  invisible, never mid-animation. Script may only *stage*; absence of a `data-` attribute is always the
  resting state.
- **British spelling** in all copy.
- **`npm test` must be green before any commit claiming completion.** `npm run build` and `npm run lint` too.
- **Never write `transform` on an element that carries a Tailwind `scale-*`, `translate-*` or `rotate-*`
  utility.** Tailwind v4 compiles those to the `scale`/`translate`/`rotate` *properties*, which compose with
  `transform` rather than replacing it, and Lightning CSS then merges the declarations. This has already
  shipped as a defect once. See the long note above the image rules in `app/globals.css`.
- **Run every new guard against the broken state before trusting it to pass.** A guard nobody has watched
  fail is not a guard. This is the single habit that caught most of the fourteen defects catalogued in
  `docs/DECISIONS.md` §2.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `lib/motion.ts` | + `DURATION.ruleIn`, `DURATION.tigerInk`, `DURATION.tigerInkStagger`, `LIVING` | 1, 6, 7 |
| `app/layout.tsx` | + writes `--rule-in-duration`, `--ink-duration`, `--ink-stagger` | 1, 6 |
| `app/globals.css` | + `.rule-in`, the ink transition, the living keyframes, the butterfly | 1, 6, 7, 8 |
| `components/ui/PillButton.tsx` | + `data-rule="none"` opt-out | 1 |
| `components/ui/ChapterMenu.tsx` | + the rule on trigger, close and chapter labels | 1 |
| `components/sections/LodgeCards.tsx` | its static border becomes the rule's resting line | 1 |
| `scripts/build_leaf.mjs` | extracts one leaf from the client's logo → `lib/leaf-art.ts` | 2 |
| `lib/leaf-art.ts` | **generated.** One constant: the leaf's path data + viewBox ← swap point | 2 |
| `components/signature/leaf-cursor/LeafCursor.tsx` | the cursor itself; the only file with the loop | 3 |
| `components/signature/leaf-cursor/index.tsx` | the mount — the one line `app/layout.tsx` references | 3 |
| `lib/tiger-art.ts` | the tiger's paths, ink order and moving-part ids ← swap point | 5 |
| `components/signature/InkTiger.tsx` | **server** component; renders the SVG and its per-path delays | 6 |
| `components/motion/InkStage.tsx` | thin client wrapper providing `data-ink` / `data-awake` | 6, 7 |
| `components/motion/useReenter.ts` | fires each time an element re-enters the viewport | 7 |
| `components/sections/SplitFeature.tsx` | + an optional `footer` slot at the foot of the section | 6 |
| `app/page.tsx` | passes `<InkTiger />` as `field-days`' footer | 6 |
| `scripts/check_rule_in.mjs` | the rule's browser rig | 1 |
| `scripts/check_leaf_cursor.mjs` | the cursor's browser rig | 4 |
| `scripts/check_ink_tiger.mjs` | the tiger's browser rig | 9 |

---

## Task 1: The sliding rule

**Files:**
- Modify: `lib/motion.ts` (add `DURATION.ruleIn`)
- Modify: `app/layout.tsx:64` (add `--rule-in-duration` beside `--emblem-turn-duration`)
- Modify: `app/globals.css` (add the rule's block after `.emblem-turn`)
- Modify: `components/ui/PillButton.tsx:33-35`
- Modify: `components/ui/ChapterMenu.tsx:111-133, 152-159, 169-183`
- Modify: `components/sections/LodgeCards.tsx:148-156`
- Test: `lib/motion.test.ts`, `scripts/check_rule_in.mjs`

**Interfaces:**
- Produces: the CSS classes `rule-in` and `rule-in--rest`; the markup contract **every `<a href>` and every
  text `<button>` carries either `rule-in` or `data-rule="none"`**, which Task 1's rig enforces and Tasks 3
  and 6 must not break.

### Two decisions taken here, with their reasoning

**The rule is `currentColor`, not gold.** The spec said gold; that is wrong on one surface and this is the
task that found it. The menu trigger sits over the hero photograph before the header gains its cream
background, and gold measures ~2.5:1 on cream — a 1px gold hairline over a photograph disappears. Using
`currentColor` means the rule always matches the text it underlines, so it is legible on cream, on the menu's
dark overlay, and over the hero, with no per-surface special-casing. On `LodgeCards`, whose link text is
already `--accent-text`, it still reads gold. Non-negotiable #7 permits gold for rules; it does not require
it.

**Elements that gain the rule lose their `hover:opacity-*`.** Two hover responses on one element is the busy
reading the reference site avoids. The rule becomes the hover.

- [ ] **Step 1: Write the failing token test**

In `lib/motion.test.ts`, add:

```ts
it("carries a hover-rule duration shorter than an entrance", () => {
  // A hover answers a deliberate act, so it may be quicker than something
  // arriving on its own. Past ~0.5s a hover response reads as lag, not restraint.
  expect(DURATION.ruleIn).toBeGreaterThan(0.2);
  expect(DURATION.ruleIn).toBeLessThan(0.5);
  expect(DURATION.ruleIn).toBeLessThan(ENTER.duration);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/motion.test.ts`
Expected: FAIL — `DURATION.ruleIn` is `undefined`.

- [ ] **Step 3: Add the token**

In `lib/motion.ts`, inside `DURATION`, after `columnStagger`:

```ts
  /**
   * A hairline sliding in under a link on hover or focus.
   *
   * Shorter than `ENTER.duration` on purpose. An entrance arrives on its own and
   * may be unhurried; a hover is an answer to something the visitor just did, and
   * an answer that takes as long as an arrival reads as lag rather than restraint.
   */
  ruleIn: 0.4,
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run lib/motion.test.ts` → PASS.

- [ ] **Step 5: Write the property onto `<html>`**

In `app/layout.tsx`, after `"--emblem-turn-duration"`:

```tsx
          // The hover rule, on the same terms as everything above it: the number
          // lives in `lib/motion.ts`, the rule lives in `app/globals.css`, and
          // neither can drift from the other.
          "--rule-in-duration": `${DURATION.ruleIn}s`,
```

- [ ] **Step 6: Add the CSS**

In `app/globals.css`, after the `.emblem-turn` rule (line 188):

```css
/*
 * The hairline that slides in under a link on hover or focus — the reference
 * site's affordance, and the client's 5 Aug request.
 *
 * **`currentColor`, not gold.** Gold is ~2.5:1 on cream and the menu trigger
 * spends the first screen sitting over the hero photograph, where a gold hairline
 * is invisible. Matching the text means one rule is legible on cream, on the
 * menu's dark overlay and over a photograph, with no per-surface special-casing —
 * and on `LodgeCards`, whose links are already `--accent-text`, it still reads
 * gold. Non-negotiable #7 permits gold for rules; it does not require it.
 *
 * **`transform` is safe here specifically because these are pseudo-elements.**
 * Tailwind's `scale-*` utilities compile to the `scale` property and would
 * compose with a `transform` — the trap documented above the image rules — but a
 * utility only reaches a pseudo-element through an `after:`/`before:` variant,
 * and nothing on this page uses one. `scripts/check_rule_in.mjs` measures the
 * rendered matrix rather than trusting that, because this is exactly the claim
 * that shipped wrong once before.
 *
 * `right: 0` rather than a width, so the rule is always the full width of its own
 * box and never has to know how long the label is.
 */
.rule-in {
  position: relative;
}

.rule-in::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.28em;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--rule-in-duration) var(--enter-ease);
  pointer-events: none;
}

/*
 * The resting hairline, for a link that already read as a link before this
 * existed — `LodgeCards`' two. Without it, replacing that link's permanent border
 * with a hover-only rule would take an affordance away. At 35% the rule sliding
 * over it reads as filling in rather than as appearing from nothing.
 */
.rule-in--rest::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.28em;
  height: 1px;
  background-color: currentColor;
  opacity: 0.35;
  pointer-events: none;
}

/*
 * Focus as well as hover: an affordance only pointer users get is not one. The
 * descendant selectors are for the menu's chapter links, where the hover target
 * is the `<a>` row and the rule belongs under the label alone — the number beside
 * it is a marker, not part of the name.
 */
.rule-in:hover::after,
.rule-in:focus-visible::after,
a:hover .rule-in::after,
a:focus-visible .rule-in::after,
button:hover .rule-in::after,
button:focus-visible .rule-in::after {
  transform: scaleX(1);
}
```

**No second line under `prefers-reduced-motion`, and that is a decision rather than an oversight.** The `*`
rule in that block already crushes `transition-duration` to 0.001ms, so the rule appears and disappears
instantly — which is exactly what is wanted, because it is a signal and signals stay. Only the travel goes.
Step 12 asserts this rather than assuming it.

- [ ] **Step 7: Give `PillButton` the opt-out**

In `components/ui/PillButton.tsx`, on the `<a>` at line 33, add the attribute and extend the comment block
above it:

```tsx
    <a
      href={href}
      /*
       * The pill is the one interactive thing on the page that does not take the
       * sliding rule: it is a filled gold shape, and a hairline inside it reads as
       * a rendering fault. `data-rule="none"` is an explicit opt-out rather than an
       * exclusion list inside the rig, because a list in a script drifts from the
       * markup silently — which is how a contrast check came to measure nothing for
       * a whole task (see `components/ui/BrandMark.tsx`).
       */
      data-rule="none"
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
```

- [ ] **Step 8: Apply the rule in `ChapterMenu`**

Three edits in `components/ui/ChapterMenu.tsx`:

1. The trigger (line 130): replace `hover:opacity-80` with `rule-in` in the `className`.
2. The close button (line 156): replace `hover:opacity-80` with `rule-in`.
3. The chapter label span (line 180): add `rule-in` to its `className`, and remove `hover:opacity-75` from
   the `<a>` at line 172.

- [ ] **Step 9: Convert `LodgeCards`' border into the rule's resting line**

In `components/sections/LodgeCards.tsx`, replace the `<a>` at lines 148-156 with:

```tsx
                    <a
                      href={lodge.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      /*
                       * `border-b` became the rule's resting line on 5 Aug 2026.
                       * The border was permanent and gold; leaving it there would
                       * have meant a gold line under a gold line, with nothing to
                       * see on hover. `rule-in--rest` draws the same hairline at
                       * 35% and the full-strength one slides over it.
                       */
                      className="rule-in rule-in--rest mt-7 inline-block pb-1 font-[family-name:var(--font-label)] text-[0.7rem] uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {lodge.cta}
                    </a>
```

- [ ] **Step 10: Write the rig**

Create `scripts/check_rule_in.mjs`, following the shape of `scripts/check_header.mjs` (same flag parsing,
same `fails`/`fail`/`ok` helpers, same JSON output, `process.exitCode = fails.length ? 1 : 0`).

It must assert, against `http://localhost:3100/`:

```js
// 1. COVERAGE — the contract that cannot drift.
//    Every <a href> and every text <button> carries `rule-in` or `data-rule="none"`.
//    A link added later that carries neither fails here, which is the whole point:
//    an exclusion list living in this file would go stale silently.
const uncovered = await page.$$eval(
  "a[href], button",
  (els) => els
    .filter((el) => el.textContent.trim().length > 0)
    .filter((el) => !el.classList.contains("rule-in")
                 && !el.querySelector(".rule-in")
                 && !el.hasAttribute("data-rule"))
    .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 40)}`),
);
// expect uncovered.length === 0

// 2. AT REST it is collapsed. Reads the rendered matrix, not the class list —
//    a Tailwind `after:` utility composing with this would show up here and
//    nowhere else.
const rest = await page.$eval(sel, (el) => getComputedStyle(el, "::after").transform);
// expect matrix scaleX ≈ 0

// 3. IT TRAVELLED — both halves, because either alone passes while it snaps.
//    (a) a real transition is running on the pseudo-element after hover
await page.hover(sel);
const running = await page.$eval(sel, (el) =>
  el.getAnimations({ subtree: true }).some((a) =>
    a.transitionProperty === "transform" && a.effect?.pseudoElement === "::after"));
// expect running === true
//    (b) a sample taken mid-transition sits strictly between 0 and 1
//        Sampled at ~40% of DURATION.ruleIn; assert 0.05 < scaleX < 0.95.

// 4. IT COMPLETES — after the transition, scaleX ≈ 1.

// 5. KEYBOARD FOCUS reaches the same final state as hover.
//    Uses page.keyboard.press("Tab") to the element, not element.focus(),
//    because `:focus-visible` does not match a programmatic focus.

// 6. REDUCED MOTION — with { reducedMotion: "reduce" }, hovering reaches
//    scaleX ≈ 1 with NO running transition. The rule stays; only the travel goes.

// 7. PERCEPTIBLE ON BOTH SURFACES — the rendered rule's colour differs from the
//    background behind it by a luminance delta > 0.15 on cream and on the menu's
//    dark overlay. Not a WCAG text ratio: it carries no text.
```

- [ ] **Step 11: Run the rig against the broken state first**

**Do not skip this.** Temporarily comment out the `.rule-in:hover::after` block in `app/globals.css`,
rebuild, and run the rig. It must fail checks 3, 4 and 5. Then restore the block. Record both outputs in
`docs/reviews/2026-08-05-signature/rule-in-broken.json` and `rule-in.json`.

A rig that has only ever been seen to pass is worth nothing here — checks 3(a) and 3(b) exist *specifically*
because either one alone would pass against a rule that snaps instantly.

- [ ] **Step 12: Run everything**

```bash
npm test && npm run lint && npm run build
npx next start -p 3100 &
node scripts/check_rule_in.mjs --out docs/reviews/2026-08-05-signature/rule-in.json
```
Expected: 222+ tests pass, build clean, rig verdict `pass`.

- [ ] **Step 13: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts app/layout.tsx app/globals.css \
        components/ui/PillButton.tsx components/ui/ChapterMenu.tsx \
        components/sections/LodgeCards.tsx scripts/check_rule_in.mjs \
        docs/reviews/2026-08-05-signature/
git commit -m "feat: a hairline slides in under every link, and none can be missed"
```

---

## Task 2: Extract one leaf from the client's logo

**Files:**
- Create: `scripts/build_leaf.mjs`
- Create: `lib/leaf-art.ts` (generated by that script, committed)
- Test: `lib/leaf-art.test.ts`

**Interfaces:**
- Produces: `LEAF_VIEWBOX: string` and `LEAF_PATHS: readonly { d: string; vein?: boolean }[]` from
  `lib/leaf-art.ts`. Task 3 imports both.

**Source:** `Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.svg` — 127 KB, 340 paths, an
Illustrator export with a `<style>` block of `.st0`–`.st18` classes. Verified 5 Aug 2026: the emblem is a
mahua flower ringed by **eight leaves**, four filled `#465E44` (class `st3`) and four `#2B3F2A` (class `st5`),
with veins in `#78924B` (`st4`) and `#5B7835` (`st1`). Class usage counts: `st3` × 4, `st5` × 4, `st7`
(yellow petal) × 8.

- [ ] **Step 1: Write the failing test**

Create `lib/leaf-art.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LEAF_PATHS, LEAF_VIEWBOX } from "./leaf-art";

describe("the extracted leaf", () => {
  it("is a square viewBox starting at the origin", () => {
    // The cursor rotates the leaf about its stem, so a non-square box would make
    // the mark drift as it swings.
    const [x, y, w, h] = LEAF_VIEWBOX.split(/\s+/).map(Number);
    expect([x, y]).toEqual([0, 0]);
    expect(w).toBe(h);
  });

  it("carries a body and at least one vein", () => {
    // A leaf with no veins is a blob. If the extraction ever collapses to one
    // path, this is what says so.
    expect(LEAF_PATHS.filter((p) => !p.vein).length).toBeGreaterThanOrEqual(1);
    expect(LEAF_PATHS.filter((p) => p.vein).length).toBeGreaterThanOrEqual(1);
  });

  it("holds real path data, not a placeholder", () => {
    for (const p of LEAF_PATHS) {
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.d).toMatch(/^[Mm]/);
    }
  });

  it("stays small enough to inline", () => {
    // It ships inside a JS chunk. The whole emblem raster is 3.2-8.0 KB and this
    // must not cost more than the mark it comes from.
    const bytes = LEAF_PATHS.reduce((n, p) => n + p.d.length, 0);
    expect(bytes).toBeLessThan(4000);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/leaf-art.test.ts`
Expected: FAIL — cannot resolve `./leaf-art`.

- [ ] **Step 3: Write the extraction script**

Create `scripts/build_leaf.mjs`. It must:

1. Read the SVG and parse its `<style>` block into a `class → fill` map.
2. Bucket every `<path class="stN" d="..."/>` by its fill.
3. Identify the **leaf-body** classes as those whose fill is green (`g` is the largest channel) and whose
   usage count is exactly 4, and the **vein** classes as green fills used more often.
4. **Assert exactly 8 leaf bodies** across the two body classes. Throw with the counts found otherwise — a
   re-supplied logo with different structure must fail loudly rather than emit a blob. This mirrors
   `scripts/build_brand.mjs`, which derives the emblem's band from the artwork's own ink rather than
   hard-coding a crop.
5. Compute each body path's bounding-box centre, take the artwork centre as the mean of all eight, and pick
   the body whose centre is **closest to due north** of it — the upright leaf, so the cursor's own rotation
   starts from a known angle.
6. Take the vein paths whose bounding boxes fall inside that body's box.
7. Translate and uniformly scale the chosen paths so the body's bounding box is centred in a square viewBox
   with 4% padding, and emit `lib/leaf-art.ts` with a generated-file header naming the script.

Run it: `node scripts/build_leaf.mjs`

- [ ] **Step 4: Run the test and watch it pass**

Run: `npx vitest run lib/leaf-art.test.ts` → PASS.

- [ ] **Step 5: Look at it — this step is not optional**

Render the leaf alone to a PNG at 24px and at 240px:

```bash
node -e "
const { LEAF_PATHS, LEAF_VIEWBOX } = await import('./lib/leaf-art.ts');
const svg = \`<svg xmlns='http://www.w3.org/2000/svg' viewBox='\${LEAF_VIEWBOX}'>\` +
  LEAF_PATHS.map(p => \`<path d='\${p.d}' fill='#31402C'/>\`).join('') + '</svg>';
const sharp = (await import('sharp')).default;
for (const w of [24, 240]) await sharp(Buffer.from(svg)).resize(w).png()
  .toFile(\`docs/reviews/2026-08-05-signature/leaf-\${w}.png\`);
"
```

Then **open both and look at them.** A test cannot tell you whether a shape reads as a leaf. If the 24px
version is a smudge or reads as a generic leaf rather than a mahua one, the exit is to replace
`lib/leaf-art.ts` by hand with a drawn mahua leaf — long and elliptical rather than the logo's rosette
shape — keeping the same two exports. Every test above still applies to a hand-drawn replacement.

This is the project's "look at the assets" rule: filenames and green tests said four photographs were
distinct when they were one picture under two ids.

- [ ] **Step 6: Commit**

```bash
git add scripts/build_leaf.mjs lib/leaf-art.ts lib/leaf-art.test.ts docs/reviews/2026-08-05-signature/
git commit -m "feat: pull one leaf out of the client's own logo, and assert there were eight"
```

---

## Task 3: The leaf cursor

**Files:**
- Create: `components/signature/leaf-cursor/LeafCursor.tsx`
- Create: `components/signature/leaf-cursor/index.tsx`
- Create: `components/signature/leaf-cursor/removability.test.ts`
- Modify: `app/layout.tsx` (one line, inside `<SmoothScroll>` beside `<Grain />`)
- Modify: `lib/motion.ts` (add `CURSOR`)

**Interfaces:**
- Consumes: `LEAF_PATHS`, `LEAF_VIEWBOX` from `lib/leaf-art.ts` (Task 2).
- Produces: `<LeafCursorMount />`, the default export of `components/signature/leaf-cursor/index.tsx`. It is
  the **only** symbol any other file may import from that directory.

### Behaviour, exactly

| | |
|---|---|
| Size | 24px tall, fixed CSS pixels |
| Anchor | stem tip at the pointer, body hanging down-right |
| Positional lag | eased toward the pointer each frame; ≤ 12px behind at speed, < 2px within 200ms of stopping |
| Angle | swings toward the direction of travel, damped, no overshoot |
| Over interactive | lifts (scales to 1.15) and fills `--accent` |
| Over focused text input | hidden, and `cursor: none` lifted |
| Coarse pointer | **never fetched** |
| Reduced motion | not rendered; system cursor untouched |

- [ ] **Step 1: Write the failing removability test**

Create `components/signature/leaf-cursor/removability.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const DIR = "components/signature/leaf-cursor";

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (["node_modules", ".next", ".git"].includes(name)) continue;
    if (statSync(path.join(ROOT, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|mjs)$/.test(name)) out.push(rel);
  }
  return out;
}

describe("the leaf cursor stays removable", () => {
  /**
   * The client is unsure about this feature, so removability is a requirement
   * with teeth rather than an intention. Deleting the one mount in
   * `app/layout.tsx` must remove the whole feature — and because it is
   * dynamically imported, its bytes with it.
   *
   * This test is what keeps that true in three months rather than only today.
   */
  it("is imported by exactly one file outside its own directory", () => {
    const importers = sourceFiles("components")
      .concat(sourceFiles("app"), sourceFiles("lib"))
      .filter((f) => !f.startsWith(DIR))
      .filter((f) => !f.endsWith("removability.test.ts"))
      .filter((f) => readFileSync(path.join(ROOT, f), "utf8").includes("signature/leaf-cursor"));

    expect(importers).toEqual(["app/layout.tsx"]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/signature/leaf-cursor/removability.test.ts`
Expected: FAIL — the directory does not exist.

- [ ] **Step 3: Add the motion tokens**

In `lib/motion.ts`, after `PARALLAX_MAX`:

```ts
/**
 * The leaf that follows the pointer.
 *
 * `follow` and `swing` are per-frame easing factors, not seconds: each frame the
 * leaf closes that fraction of the remaining distance (or angle) to its target,
 * which is what produces a lag that is large while you are moving and gone the
 * moment you stop. They are here rather than in the component because they are
 * the two numbers anyone tuning this will reach for.
 *
 * `maxLagPx` is a cap, and it is a correctness cap rather than a taste one: the
 * leaf replaces the arrow, so how far it may trail is how far the visible cursor
 * may be from the real click point.
 */
export const CURSOR = {
  sizePx: 24,
  follow: 0.22,
  swing: 0.12,
  maxLagPx: 12,
  /** How much the leaf lifts over something interactive. */
  hoverScale: 1.15,
  /** Seconds — the fill and lift crossfade. Matches the rule sliding in beneath it. */
  hoverDuration: 0.4,
} as const;
```

- [ ] **Step 4: Write the cursor**

Create `components/signature/leaf-cursor/LeafCursor.tsx` — `"use client"`. Requirements the implementation
must meet:

1. Renders one `<svg aria-hidden="true">` at `position: fixed`, `left: 0; top: 0`, `pointer-events: none`,
   `z-index: 100`, sized `CURSOR.sizePx`, containing `LEAF_PATHS`. The stem tip is the **top-left of the
   viewBox**, so the SVG is positioned with its own origin at the pointer and the body hangs down-right with
   no offset maths.
2. Tracks the pointer in a `useRef`, never in state. **No React re-render may happen on pointer move.**
3. One `requestAnimationFrame` loop writing `el.style.transform` directly:
   `translate3d(x, y, 0) rotate(a) scale(s)`. Nothing on this element carries a Tailwind
   `scale-*`/`translate-*` utility, so `transform` is safe — and it must stay that way.
4. **The loop stops itself.** When the distance to target < 0.1px and the angle delta < 0.1°, it does not
   schedule another frame; the next `pointermove` restarts it. This is the battery guarantee and Task 4
   asserts it.
5. Lag is clamped to `CURSOR.maxLagPx` each frame — the eased position is pulled back onto the segment to
   the true pointer if it exceeds the cap.
6. `pointerover` sets a hovering flag when
   `event.target.closest('a[href], button, [role="button"], summary, [data-photo]')` matches;
   `pointerout` clears it. The flag drives a class, not the loop.
7. On mount, after the first frame has painted, sets `document.documentElement.style.cursor = "none"`. On
   unmount, restores it. **Never in server-rendered CSS** — if this module fails to load or throws, the
   visitor keeps their arrow.
8. `focusin`/`focusout` on `input, textarea, [contenteditable]` hides the leaf and lifts `cursor: none`.
9. Cleans up every listener and cancels the frame on unmount.

- [ ] **Step 5: Write the mount**

Create `components/signature/leaf-cursor/index.tsx` — `"use client"`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The leaf cursor's single entry point, and the only thing outside this
 * directory may import. Deleting the one line in `app/layout.tsx` removes the
 * feature — and, because the component below is loaded dynamically, removes its
 * bytes rather than leaving dead code in the bundle.
 * `removability.test.ts` fails if a second importer ever appears.
 *
 * **The gate runs before the import, not inside the component.** A phone must
 * never fetch this chunk: most of this site's traffic is Indian mobile, the
 * first-load budget has 21 KB of headroom, and a pointer that cannot hover has
 * nothing to show. `scripts/check_leaf_cursor.mjs` asserts zero bytes on the
 * network at a coarse pointer rather than asserting the import is conditional —
 * a guard grepping source for an import shape is exactly the check that let a
 * 110 KB regression through once already.
 */
const LeafCursor = dynamic(() => import("./LeafCursor").then((m) => m.LeafCursor), { ssr: false });

export default function LeafCursorMount() {
  const [wanted, setWanted] = useState(false);

  useEffect(() => {
    // A fine pointer AND motion not declined. Read once: neither changes
    // without a reload in any browser this page supports, and re-reading them
    // would mean an extra listener for nothing.
    setWanted(window.matchMedia("(pointer: fine)").matches && !prefersReducedMotion());
  }, []);

  return wanted ? <LeafCursor /> : null;
}
```

- [ ] **Step 6: Mount it**

In `app/layout.tsx`, add the import and one line inside `<SmoothScroll>`:

```tsx
import LeafCursorMount from "@/components/signature/leaf-cursor";
```
```tsx
        <SmoothScroll>
          <Grain />
          <LeafCursorMount />
          {children}
        </SmoothScroll>
```

- [ ] **Step 7: Run the removability test and watch it pass**

Run: `npx vitest run components/signature/leaf-cursor/removability.test.ts` → PASS.

- [ ] **Step 8: Prove the test can fail**

Add `import LeafCursorMount from "@/components/signature/leaf-cursor";` to `components/ui/SiteHeader.tsx`,
re-run the test, confirm it **fails**, then remove the import. A removability guard nobody has watched fail
guarantees nothing.

- [ ] **Step 9: Run everything and commit**

```bash
npm test && npm run lint && npm run build
git add components/signature/leaf-cursor/ lib/motion.ts app/layout.tsx
git commit -m "feat: a mahua leaf on the pointer, behind one import that a test keeps single"
```

---

## Task 4: The leaf cursor's browser rig

**Files:**
- Create: `scripts/check_leaf_cursor.mjs`
- Modify: `package.json` (nothing — run directly, like the other rigs)

**Interfaces:**
- Consumes: `CURSOR` from `lib/motion.ts`; the shipped page at `http://localhost:3100/`.

Every assertion below is an outcome. Follow `scripts/check_header.mjs` for structure, flags and JSON output.

- [ ] **Step 1: Write the rig**

```js
// 1. PRESENT on a fine pointer with normal motion:
//    the leaf's <svg> exists, and getComputedStyle(document.documentElement).cursor === "none".

// 2. ZERO BYTES on a coarse pointer. Emulate with
//    browser.newContext({ hasTouch: true, isMobile: true }) plus a CDP override of
//    `pointer: fine`, then sum response sizes for every request whose URL is a JS
//    chunk containing the cursor. Assert the cursor chunk was never requested.
//    NOT a source grep — defect #12 in docs/DECISIONS.md was exactly that.

// 3. REDUCED MOTION: { reducedMotion: "reduce" } → no leaf element in the DOM,
//    and documentElement cursor is NOT "none".

// 4. FOLLOW ACCURACY. Drive page.mouse.move along a path of ~40 points with
//    steps, sampling after each:
//      - error at rest (200ms after the last move) < 2px
//      - error at speed never exceeds CURSOR.maxLagPx + 1 (one px of tolerance
//        for sub-pixel rounding)

// 5. IT SWINGS AND SETTLES. Rotation sampled during a fast lateral move differs
//    from rest by > 4deg, and returns to within 1deg of rest afterwards.
//    A leaf that never rotates is a sticker, and that is the failure mode the
//    original spec named.

// 6. THE LOOP STOPS. page.addInitScript patches requestAnimationFrame to count
//    calls into window.__rafCount. Move the pointer, wait 1s, record the count,
//    wait a further 500ms, record again. Assert the two are EQUAL.
//    This is the battery check. It is the assertion most likely to regress
//    silently, because nothing about the page looks different when it fails.

// 7. GOLD OVER A LINK, not over prose. Hover a menu link → the leaf's fill
//    computes to PALETTE.gold. Hover a paragraph → it does not.

// 8. TEXT INPUT. There is no text input on the home page today, so this is
//    asserted against an injected <input> appended to the body: focusing it
//    hides the leaf and restores the cursor; blurring it restores both.
//    Written now because a booking form is a stated future page.
```

- [ ] **Step 2: Run it against the broken state, one assertion at a time**

For each of checks 4, 5 and 6, break the thing it guards and confirm **that** check fails:

| Break | Expected failure |
|---|---|
| Set `CURSOR.follow = 1` (no lag at all) | check 5 fails — nothing swings |
| Set `CURSOR.maxLagPx = 400` | check 4 fails at speed |
| Remove the loop's self-terminating condition | check 6 fails |

Record the three broken outputs alongside the passing one in
`docs/reviews/2026-08-05-signature/`. **This step is the task's real deliverable** — the rig, not the
cursor, is what the fourteen-defect pattern says will be wrong.

- [ ] **Step 3: Run against the real build and commit**

```bash
npm run build && npx next start -p 3100 &
node scripts/check_leaf_cursor.mjs --out docs/reviews/2026-08-05-signature/leaf-cursor.json
npm run verify:budget    # untouched KB must NOT have risen — the cursor is desktop-only and lazy
git add scripts/check_leaf_cursor.mjs docs/reviews/2026-08-05-signature/
git commit -m "test: prove the leaf follows, swings, warms and stops"
```

---

## Task 5: The tiger drawing

**Files:**
- Create: `lib/tiger-art.ts`
- Test: `lib/tiger-art.test.ts`

**Interfaces:**
- Produces:

```ts
export type TigerPart = "chest" | "tail" | "ear-left" | "ear-right" | "eye-left" | "eye-right";

export type TigerPath = {
  /** The `d` attribute. */
  d: string;
  /** Ink order, 0-based. Paths sharing an index ink together. */
  ink: number;
  /** Set only on the parts that move; matches a keyframe in `app/globals.css`. */
  part?: TigerPart;
};

export const TIGER_VIEWBOX: string;
export const TIGER_PATHS: readonly TigerPath[];
```

Tasks 6, 7 and 9 all consume these exact names.

**This is the risk on Plan 5 and it is not assertable.** No test can say whether a drawing is good. The tests
below guarantee it is *well-formed*; a human looks at it in Step 4 and the client looks at it after Task 6.

- [ ] **Step 1: Write the failing test**

Create `lib/tiger-art.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TIGER_PATHS, TIGER_VIEWBOX, type TigerPart } from "./tiger-art";

describe("the ink tiger's artwork", () => {
  it("has a viewBox wider than it is tall", () => {
    const [x, y, w, h] = TIGER_VIEWBOX.split(/\s+/).map(Number);
    expect([x, y]).toEqual([0, 0]);
    expect(w).toBeGreaterThan(h);   // a standing cat in profile
  });

  it("inks in a contiguous order starting at zero", () => {
    // A gap would leave a silent pause mid-draw; a missing zero would delay the
    // whole thing. Both look like the drawing is broken and neither throws.
    const orders = [...new Set(TIGER_PATHS.map((p) => p.ink))].sort((a, b) => a - b);
    expect(orders[0]).toBe(0);
    orders.forEach((o, i) => expect(o).toBe(i));
  });

  it("names every moving part exactly once", () => {
    const parts: TigerPart[] = ["chest", "tail", "ear-left", "ear-right", "eye-left", "eye-right"];
    for (const part of parts) {
      expect(TIGER_PATHS.filter((p) => p.part === part)).toHaveLength(1);
    }
  });

  it("draws the back line before the stripes", () => {
    // The order is the whole effect: an outline that appears after its own
    // markings reads as assembly, not as drawing.
    const back = TIGER_PATHS.find((p) => p.ink === 0);
    expect(back).toBeDefined();
    const stripes = TIGER_PATHS.filter((p) => !p.part && p.ink > 0);
    expect(stripes.length).toBeGreaterThan(4);
  });

  it("holds real path data and stays small enough to inline", () => {
    for (const p of TIGER_PATHS) {
      expect(p.d.length).toBeGreaterThan(20);
      expect(p.d).toMatch(/^[Mm]/);
    }
    const bytes = TIGER_PATHS.reduce((n, p) => n + p.d.length, 0);
    expect(bytes).toBeLessThan(12000);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/tiger-art.test.ts`
Expected: FAIL — cannot resolve `./tiger-art`.

- [ ] **Step 3: Draw the tiger**

Author `lib/tiger-art.ts` by hand. Constraints:

- **Stroke only.** No fills anywhere. The component sets `stroke`, `fill="none"`, `stroke-linecap="round"`
  and `stroke-linejoin="round"`; the art carries geometry and nothing else.
- A standing Bengal tiger in profile, facing left, on a `0 0 400 260` viewBox with the feet on y≈250 so the
  drawing sits on its own ground line.
- Ink order: `0` back line → `1` head and muzzle → `2` chest and forelegs → `3` hindquarters and hind legs →
  `4` tail → `5` ears → `6` eyes → `7+` stripes. At least five stripe paths.
- 25–45 paths total.
- Keep each path a single continuous line. A path that jumps (`M` mid-string) inks as two strokes appearing
  at once and reads wrong.

- [ ] **Step 4: Run the test, then look at it**

Run: `npx vitest run lib/tiger-art.test.ts` → PASS.

Then render it and **open the file**:

```bash
node -e "
const { TIGER_PATHS, TIGER_VIEWBOX } = await import('./lib/tiger-art.ts');
const svg = \`<svg xmlns='http://www.w3.org/2000/svg' viewBox='\${TIGER_VIEWBOX}'>\` +
  TIGER_PATHS.map(p => \`<path d='\${p.d}' fill='none' stroke='#31402C' stroke-width='2'
    stroke-linecap='round' stroke-linejoin='round'/>\`).join('') + '</svg>';
const sharp = (await import('sharp')).default;
await sharp(Buffer.from(svg)).resize(800).png()
  .toFile('docs/reviews/2026-08-05-signature/tiger.png');
"
```

If it does not read as a tiger, redraw. Only this file changes — the mechanism in Tasks 6–8 never sees the
geometry.

- [ ] **Step 5: Commit**

```bash
git add lib/tiger-art.ts lib/tiger-art.test.ts docs/reviews/2026-08-05-signature/tiger.png
git commit -m "feat: draw the ink tiger, stroke only, in the order a hand would draw it"
```

---

## Task 6: The tiger inks itself in

**Files:**
- Create: `components/signature/InkTiger.tsx` (server component)
- Create: `components/motion/InkStage.tsx` (client)
- Modify: `components/sections/SplitFeature.tsx` (add a `footer` slot)
- Modify: `app/page.tsx` (pass the tiger as `field-days`' footer)
- Modify: `lib/motion.ts`, `app/layout.tsx`, `app/globals.css`
- Test: `lib/motion.test.ts`

**Interfaces:**
- Consumes: `TIGER_PATHS`, `TIGER_VIEWBOX`, `TigerPath` (Task 5); `useInView` (existing).
- Produces: `<InkTiger />`; `<InkStage>{children}</InkStage>`; `SplitFeature`'s `footer?: React.ReactNode`.

### Why the split into two components

`InkTiger` is a **server** component and `InkStage` is the client one, because a client component's
`import`s ship to the browser but its `children` do not. Importing `lib/tiger-art.ts` from a `"use client"`
file would push the whole drawing into a JavaScript chunk; passing the rendered SVG as children keeps it in
the HTML. This is the same arrangement `PinnedCollage` uses, and `npm run verify:budget` is what proves it
held.

- [ ] **Step 1: Write the failing token test**

In `lib/motion.test.ts`:

```ts
it("inks the tiger slowly enough to read as drawing", () => {
  // Each stroke, and the gap between consecutive strokes. Fast enough that the
  // whole animal is there within a screen of scrolling, slow enough that you can
  // see the line being made — which is the entire effect.
  expect(DURATION.tigerInk).toBeGreaterThanOrEqual(0.5);
  expect(DURATION.tigerInk).toBeLessThanOrEqual(1.2);
  expect(DURATION.tigerInkStagger).toBeGreaterThan(0);
  expect(DURATION.tigerInkStagger).toBeLessThan(DURATION.tigerInk);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/motion.test.ts` → FAIL, both undefined.

- [ ] **Step 3: Add the tokens and write them onto `<html>`**

In `lib/motion.ts`, inside `DURATION`:

```ts
  /** One stroke of the ink tiger drawing itself. */
  tigerInk: 0.8,
  /** The gap between one ink order and the next. Overlapping, so the hand never lifts. */
  tigerInkStagger: 0.22,
```

In `app/layout.tsx`, after `--rule-in-duration`:

```tsx
          "--ink-duration": `${DURATION.tigerInk}s`,
```

- [ ] **Step 4: Run the token test and watch it pass**

Run: `npx vitest run lib/motion.test.ts` → PASS.

- [ ] **Step 5: Write `InkStage`**

Create `components/motion/InkStage.tsx`:

```tsx
"use client";

import { useInView } from "./useInView";

/**
 * Gives its children a `data-ink` state, on the page's existing entrance engine.
 *
 * Fail-safe on the same terms as `Enter`: **the absence of the attribute is the
 * drawn state**, so no JavaScript, a thrown error and `prefers-reduced-motion`
 * each leave the tiger complete and still. Script may only stage it, and only
 * after `useInView` has confirmed it is below the fold — a tiger that erased
 * itself on screen and redrew would be the exact flicker that hook exists to
 * prevent.
 *
 * It takes `children` rather than importing the artwork, so `lib/tiger-art.ts`
 * stays on the server. A `"use client"` file's imports ship; its children do not.
 */
export function InkStage({ children }: { children: React.ReactNode }) {
  const { ref, state } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} {...(state === "rest" ? {} : { "data-ink": state })}>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Write `InkTiger`**

Create `components/signature/InkTiger.tsx` (no `"use client"`):

```tsx
import { InkStage } from "@/components/motion/InkStage";
import { DURATION } from "@/lib/motion";
import { TIGER_PATHS, TIGER_VIEWBOX } from "@/lib/tiger-art";

/**
 * A field-guide tiger that draws itself onto the page, then lives, then dozes.
 *
 * **`pathLength="1"` is what makes this free.** It normalises every path to a
 * length of 1 whatever its real geometry, so `stroke-dasharray: 1` and
 * `stroke-dashoffset: 1 -> 0` draw any line with no JavaScript measuring anything.
 * A path missing that attribute keeps its true length, so a dash array of 1 leaves
 * it fully drawn from the start — it silently opts out of the animation while
 * looking perfectly correct in the markup. `scripts/check_ink_tiger.mjs` counts
 * them for that reason.
 *
 * A server component: the drawing is markup and its animation is CSS, so none of
 * it needs to reach the browser as JavaScript.
 */
export function InkTiger() {
  return (
    <InkStage>
      <svg
        aria-hidden="true"
        data-ink-tiger
        viewBox={TIGER_VIEWBOX}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none block h-[max(120px,20vh)] w-auto text-[color:var(--text)]"
      >
        {TIGER_PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            pathLength={1}
            {...(p.part ? { "data-part": p.part } : {})}
            style={{ "--ink-delay": `${p.ink * DURATION.tigerInkStagger}s` } as React.CSSProperties}
          />
        ))}
      </svg>
    </InkStage>
  );
}
```

- [ ] **Step 7: Add the CSS**

In `app/globals.css`, after the `.rule-in` block:

```css
/*
 * The ink tiger drawing itself — `components/signature/InkTiger.tsx`, on the same
 * fail-safe grammar as every other motion primitive here: **the absence of
 * `data-ink` is the drawn state.** With no script there is no attribute, nothing
 * below matches, `stroke-dashoffset` is its initial 0, and the tiger is simply
 * there. There is no state in which it is invisible waiting for JavaScript.
 *
 * `stroke-dasharray: 1` pairs with the `pathLength="1"` the component sets on
 * every path, which is what lets one rule draw lines of wildly different lengths
 * at the same rate.
 */
[data-ink-tiger] path {
  stroke-dasharray: 1;
  transition: stroke-dashoffset var(--ink-duration) var(--enter-ease);
  transition-delay: var(--ink-delay, 0s);
}

/* Staged instantly, for the reason given above [data-enter="pending"]. */
[data-ink="pending"] [data-ink-tiger] path {
  transition: none;
  stroke-dashoffset: 1;
}

[data-ink="in"] [data-ink-tiger] path {
  stroke-dashoffset: 0;
}
```

And inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  /*
   * The tiger is drawn, and it does not draw. A still state, not a fast one —
   * and a second line, exactly like the entrance rules above: were a `pending`
   * ever stranded here, by a stale attribute or a visitor changing the setting
   * mid-session, it would be an empty patch of cream where the animal should be.
   */
  [data-ink] [data-ink-tiger] path {
    transition: none;
    stroke-dashoffset: 0;
  }
```

- [ ] **Step 8: Give `SplitFeature` a footer slot**

In `components/sections/SplitFeature.tsx`, change the signature and add the slot after band 3's closing
`</div>` (line 271), still inside the outer `<div>`:

```tsx
export function SplitFeature({
  chapter,
  surface = false,
  footer,
}: {
  chapter: Chapter;
  surface?: boolean;
  /**
   * Rendered at the foot of the section, on its own ground line. `field-days`
   * passes the ink tiger; nothing else uses it.
   *
   * A slot rather than a `chapter.id` check inside this component: every chapter
   * section here is self-contained and never reaches into another, and which
   * chapter carries the tiger is a decision belonging to the page's spine.
   */
  footer?: React.ReactNode;
}) {
```
```tsx
        {footer && <div className="mt-12 lg:mt-16">{footer}</div>}
```

- [ ] **Step 9: Place the tiger**

In `app/page.tsx`, where `splitFeature` is dispatched, pass the footer for `field-days` only:

```tsx
  case "splitFeature":
    return (
      <SplitFeature
        key={chapter.id}
        chapter={chapter}
        surface={surface}
        /*
         * The tiger goes here and the choice was measured, not felt.
         * `field-days` owns the emptiest screen on the page that belongs to an
         * actual chapter (52.4% against non-negotiable #8's 45% ceiling), the
         * join below it is the third emptiest screen anywhere (61%), and it is
         * the chapter about going out to look for animals. Filling it costs no
         * scroll, which is the lesson the pinned collage taught on 5 Aug: a
         * scene that buys scroll without adding imagery moves the page-wide
         * density figure the wrong way.
         */
        footer={chapter.id === "field-days" ? <InkTiger /> : undefined}
      />
    );
```

- [ ] **Step 10: Verify by running the page, not by asserting it works**

```bash
npm run build && npx next start -p 3100
```

Screenshot `field-days` at 390 / 768 / 1440 / 1920. Confirm by eye: the tiger sits on a ground line, does not
overlap text at any width, and inks in when scrolled to. Save to
`docs/reviews/2026-08-05-signature/tiger-{width}.webp`.

- [ ] **Step 11: Check the budget did not move**

```bash
npm run verify:budget
```
The untouched-JS figure must still be ~154 KB. If it rose, `lib/tiger-art.ts` has reached a client component
— the architecture rule in CLAUDE.md, and the reason `InkStage` takes children.

- [ ] **Step 12: Run everything and commit**

```bash
npm test && npm run lint && npm run build
git add components/signature/InkTiger.tsx components/motion/InkStage.tsx \
        components/sections/SplitFeature.tsx app/page.tsx app/globals.css \
        app/layout.tsx lib/motion.ts lib/motion.test.ts docs/reviews/2026-08-05-signature/
git commit -m "feat: the tiger inks itself onto the emptiest screen that owns a chapter"
```

---

## Task 7: It lives, it dozes, it stirs

**Files:**
- Create: `components/motion/useReenter.ts`
- Modify: `components/motion/InkStage.tsx`
- Modify: `app/globals.css`
- Modify: `lib/motion.ts`
- Test: `components/motion/useReenter.test.tsx`, `lib/motion.test.ts`

**Interfaces:**
- Consumes: `TigerPart` ids rendered as `data-part` by Task 6.
- Produces: `useReenter<T>(): { ref, onReenter }`; `LIVING` in `lib/motion.ts`.

### Why a new hook rather than an option on `useInView`

`useInView` drives 37 entrances and never un-stages anything, deliberately. Adding a re-arming mode to it
would put every one of those at risk for one element's benefit. `useReenter` is a separate, additive hook.

- [ ] **Step 1: Write the failing token test**

In `lib/motion.test.ts`:

```ts
it("gives the tiger's living parts periods that cannot sync into a pulse", () => {
  // Four things on the same beat reads as a machine; four on unrelated beats
  // reads as an animal. Asserted rather than eyeballed: any future edit that
  // makes two periods simple multiples would produce a pulse nobody would think
  // to look for.
  const periods = [LIVING.breath, LIVING.tail, LIVING.ears, LIVING.blink];
  for (const a of periods) {
    for (const b of periods) {
      if (a === b) continue;
      const ratio = Math.max(a, b) / Math.min(a, b);
      expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(0.08);
    }
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/motion.test.ts` → FAIL, `LIVING` undefined.

- [ ] **Step 3: Add `LIVING`**

In `lib/motion.ts`, after `CURSOR`:

```ts
/**
 * The ink tiger's living phase — seconds per cycle for each moving part, and how
 * long the whole phase lasts before it dozes.
 *
 * **No two periods may be simple multiples of one another.** Four parts moving on
 * a common beat reads as a mechanism; four on unrelated beats reads as breathing.
 * `motion.test.ts` holds them apart.
 *
 * `phase` is why this can doze with no JavaScript timer: each part runs a finite
 * number of iterations and fills forwards, and the eyes take a final animation
 * delayed past all of them. Non-negotiable #5 — it arrives, performs, then dozes.
 */
export const LIVING = {
  breath: 4.3,
  tail: 7.1,
  ears: 11.3,
  blink: 5.9,
  /** Seconds the whole living phase runs before the eyes close. */
  phase: 24,
} as const;
```

- [ ] **Step 4: Run the token test and watch it pass**

Run: `npx vitest run lib/motion.test.ts` → PASS.

- [ ] **Step 5: Write `useReenter` and its test**

Create `components/motion/useReenter.test.tsx` first, asserting with a mocked `IntersectionObserver` that
`onReenter` fires on the *second* and subsequent entries but **not** the first, and that it never fires under
`prefers-reduced-motion`. Then create `components/motion/useReenter.ts`:

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Calls back each time the element **re-enters** the viewport, having left it.
 *
 * Separate from `useInView` on purpose. That hook drives 37 entrances and never
 * un-stages anything — an entrance that replayed would be a page that flickers
 * as you scroll back up. This is additive, opt-in, and the tiger is its only
 * consumer: it stirs when you return to it, which is phase 7 of the original
 * spec's state machine.
 *
 * Never fires on the first entry: that one is the tiger's arrival, and Task 6's
 * ink already owns it.
 */
export function useReenter<T extends HTMLElement>(onReenter: () => void) {
  const ref = useRef<T | null>(null);
  const seen = useRef(false);
  const cb = useRef(onReenter);
  cb.current = onReenter;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) { seen.current = true; continue; }
        if (seen.current) { seen.current = false; cb.current(); }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
```

- [ ] **Step 6: Wire it into `InkStage`**

`InkStage` gains a second ref from `useReenter` (merged onto the same element) whose callback resets the
living animations:

```tsx
  const reenterRef = useReenter<HTMLDivElement>(() => {
    // Restarting a CSS animation cannot be done by changing an attribute the
    // rule already matches — the animation simply carries on. Resetting
    // `currentTime` is the reliable way, and it is also exactly what
    // `scripts/check_ink_tiger.mjs` asserts, so the check and the mechanism are
    // the same claim.
    for (const a of ref.current?.getAnimations({ subtree: true }) ?? []) {
      a.currentTime = 0;
      a.play();
    }
  });
```

Both refs are attached with a small callback ref that assigns each.

- [ ] **Step 7: Add the living keyframes**

In `app/globals.css`, after the ink rules. Each part animates a `transform` — safe, because these are
`<path>` elements inside an SVG carrying no Tailwind utilities at all. `transform-box: fill-box` and
`transform-origin` are set per part so a tail rotates about its root and not about the viewBox corner.

```css
@keyframes tiger-breath { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.012); } }
@keyframes tiger-tail   { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3.5deg); } }
@keyframes tiger-ear    { 0%, 88%, 100% { transform: rotate(0deg); } 94% { transform: rotate(-6deg); } }
@keyframes tiger-blink  { 0%, 92%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.05); } }
@keyframes tiger-doze   { to { transform: scaleY(0.05); } }

[data-ink-tiger] [data-part] { transform-box: fill-box; }
[data-ink-tiger] [data-part="chest"]     { transform-origin: bottom;  animation: tiger-breath var(--living-breath) ease-in-out var(--living-count-breath) both; }
[data-ink-tiger] [data-part="tail"]      { transform-origin: left;    animation: tiger-tail   var(--living-tail)   ease-in-out var(--living-count-tail)   both; }
[data-ink-tiger] [data-part^="ear"]      { transform-origin: bottom;  animation: tiger-ear    var(--living-ears)   ease-in-out var(--living-count-ears)   both; }
[data-ink-tiger] [data-part^="eye"]      { transform-origin: center;  animation:
    tiger-blink var(--living-blink) ease-in-out var(--living-count-blink) both,
    tiger-doze 0.6s ease-in-out var(--living-phase) 1 both; }
```

`app/layout.tsx` writes `--living-*` from `LIVING`, with each count computed as
`Math.floor(LIVING.phase / period)` so every part stops within the phase rather than being cut mid-cycle.

And in the reduced-motion block:

```css
  /*
   * The tiger is present and still — not dozing, not blinking fast. The `*` rule
   * above crushes durations but not `animation-delay`, so without this the eyes
   * would sit open for 24 seconds and then snap shut, which is motion arriving
   * late rather than motion removed.
   */
  [data-ink-tiger] [data-part] {
    animation: none;
    transform: none;
  }
```

- [ ] **Step 8: Verify by running the page**

Load `/`, scroll to `field-days`, and watch for 30 seconds. Confirm: the four movements never land on the
same beat, the eyes close at the end, and nothing moves afterwards. Scroll away and back — it stirs, and it
does **not** redraw.

- [ ] **Step 9: Run everything and commit**

```bash
npm test && npm run lint && npm run build && npm run verify:budget
git add components/motion/useReenter.ts components/motion/useReenter.test.tsx \
        components/motion/InkStage.tsx app/globals.css app/layout.tsx \
        lib/motion.ts lib/motion.test.ts
git commit -m "feat: the tiger breathes on four unrelated beats, then closes its eyes"
```

---

## Task 8: The butterfly

> **⚠️ Written against the ink tiger, which is no longer on the page — but the drawn-art approach below is
> now the leading candidate again.** This task attaches a butterfly to `InkTiger.tsx`, an unmounted
> component, and draws it as SVG paths in `lib/tiger-art.ts`; both of those homes would have to move.
>
> The client's two butterfly *films*, supplied 7 Aug 2026, were measured on 8 Aug and **cannot be used**:
> chroma green rather than white, so no blend mode erases the ground, and the butterflies are 1.9% of frame
> width — 5.8px if drawn at the tiger's size. `DECISIONS.md` §13 has the numbers and the exact re-render
> specification that would work instead.
>
> So the medium is open again: drawn art as below (~5 KB, and it can stop, which continuous flight cannot),
> or a re-rendered film to the tiger's specification. **Blocked on the client** — and the prior question is
> whether a fourth figure is wanted at all beside the tiger, the potter and the lantern.

**Files:**
- Modify: `lib/tiger-art.ts` (add `BUTTERFLY_PATHS`, `BUTTERFLY_VIEWBOX`, `BUTTERFLY_TRACK`)
- Modify: `lib/tiger-art.test.ts`
- Modify: `components/signature/InkTiger.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `BUTTERFLY_PATHS: readonly { d: string; wing?: "left" | "right" }[]`,
  `BUTTERFLY_VIEWBOX: string`, `BUTTERFLY_TRACK: string` (an SVG path `d` used as the CSS `offset-path`).

- [ ] **Step 1: Extend the artwork test**

In `lib/tiger-art.test.ts`:

```ts
describe("the butterfly", () => {
  it("has two wings that can beat independently", () => {
    expect(BUTTERFLY_PATHS.filter((p) => p.wing === "left")).toHaveLength(1);
    expect(BUTTERFLY_PATHS.filter((p) => p.wing === "right")).toHaveLength(1);
  });

  it("travels a closed loop", () => {
    // An open path would leave it teleporting back to the start each cycle.
    expect(BUTTERFLY_TRACK.trim()).toMatch(/[Zz]$/);
  });
});
```

- [ ] **Step 2: Run it, watch it fail, then add the artwork**

Add to `lib/tiger-art.ts` a small butterfly (a body and two wings, ≤ 6 paths) and a closed, meandering
`BUTTERFLY_TRACK` that stays clear of the tiger's head. Re-run: PASS.

- [ ] **Step 3: Render it in `InkTiger`**

A second `<svg data-butterfly>` inside the same wrapper, `aria-hidden`, absolutely positioned over the
tiger's box.

- [ ] **Step 4: Add the CSS**

```css
/*
 * `offset-distance` holds at 34% and 72% — the two landings. The wings slow to a
 * stop across each hold, because a butterfly that keeps beating while stationary
 * reads as a sprite looping.
 */
@keyframes butterfly-drift {
  0%   { offset-distance: 0%; }
  30%  { offset-distance: 34%; }
  42%  { offset-distance: 34%; }
  66%  { offset-distance: 72%; }
  76%  { offset-distance: 72%; }
  100% { offset-distance: 100%; }
}
@keyframes butterfly-wing { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.35); } }
```

`offset-path: path(...)` is set inline by the component from `BUTTERFLY_TRACK`, and `offset-rotate: auto`
turns it into the direction of travel.

**If `offset-path` is unsupported the butterfly renders still**, which is an acceptable degradation for an
`aria-hidden` ornament, not a defect.

Reduced motion: it is covered by the `[data-ink-tiger] [data-part]` rule only if it carries `data-part`, and
it does not — so add it explicitly to the reduced-motion block:

```css
  [data-butterfly], [data-butterfly] [data-wing] { animation: none; }
```

- [ ] **Step 5: Verify by eye, run everything, commit**

```bash
npm test && npm run lint && npm run build && npm run verify:budget
git add lib/tiger-art.ts lib/tiger-art.test.ts components/signature/InkTiger.tsx app/globals.css
git commit -m "feat: a butterfly wanders the tiger's clearing and lands twice"
```

---

## Task 9: The tiger's browser rig

> **⚠️ Obsolete as written, and settled elsewhere. Do not build this.** The thing that was actually owed —
> a rig for the two films — shipped on 8 Aug 2026 as `scripts/check_films.mjs`, which fails against a
> looping film, a lost blend and a restored `poster` attribute. See `docs/DECISIONS.md` §12.
>
> Every assertion below is about an SVG inking itself in —
> `pathLength`, `stroke-dashoffset`, per-stroke stagger — and that tiger was replaced by film on 6 Aug 2026.
> `InkTiger.tsx` is unmounted; a rig for it would guard nothing a visitor can see.
>
> **What is actually owed is a rig for the two films**, which are on the page and verified by hand only:
> that each plays once and holds its last frame; that a deliberate hover replays it; that the two guards
> against hover-becoming-a-loop hold (ignored while playing, and the pointer must leave and return); that
> `mix-blend-mode: darken` erases the white ground on both creams; and that the poster carries the frame if
> the video never loads. `scripts/check_lantern.mjs` is the closest model — in particular its use of a
> **control** for any rate, and of a deliberately broken build before trusting a pass.
>
> Keep the pieces below only as a reference for the day the ink tiger is remounted.

**Files:**
- Create: `scripts/check_ink_tiger.mjs`

- [ ] **Step 1: Write the rig**

```js
// 1. EVERY PATH CARRIES pathLength="1". Assert the count of <path> inside
//    [data-ink-tiger] equals the count with the attribute. One missing path keeps
//    its true length, so `stroke-dasharray: 1` leaves it fully drawn from the
//    start — it opts out of the animation silently while looking correct.

// 2. IT DREW. Sum stroke-dashoffset across all paths:
//      - before scrolling to it  ≈ path count (undrawn)
//      - after                   ≈ 0
//      - a mid-scroll sample strictly between the two
//    The mid sample is the one that matters: without it, a tiger that snapped
//    straight to drawn would pass.

// 3. NO JAVASCRIPT → fully drawn at load. context = browser.newContext({ javaScriptEnabled: false }).

// 4. REDUCED MOTION → fully drawn, and getAnimations({subtree:true}) on the tiger
//    returns nothing running.

// 5. IT LIVES. Sample the tail path's computed transform at 3 moments across 8s.
//    Assert all three differ.

// 6. THE BEATS DO NOT SYNC. Sample chest and tail transforms together at 12
//    moments; assert they are not identical at every sample.

// 7. IT DOZES. After LIVING.phase + 2s, assert no animation on the tiger has
//    playState "running", and the eye paths' scaleY is < 0.2.

// 8. IT STIRS, AND DOES NOT REDRAW. Scroll away, scroll back, then assert
//    (a) a living animation's currentTime is near 0 again, and
//    (b) total stroke-dashoffset is still ≈ 0 — the ink never replays.

// 9. THE BUTTERFLY TRAVELS. offset-distance advances between two samples, and is
//    equal across two samples taken inside a landing hold.

// 10. IT NEVER CROSSES TEXT. At 320/390/768/1440/1920, assert the tiger's
//     bounding box does not intersect any text-bearing element's box in
//     `field-days`.
```

- [ ] **Step 2: Run it against the broken state**

| Break | Expected failure |
|---|---|
| Delete `pathLength={1}` from `InkTiger` | check 1, and check 2's mid sample |
| Set `[data-ink="pending"]` offset to 0 | check 2 |
| Give every `LIVING` period the same value | check 6 |
| Remove the `tiger-doze` animation | check 7 |
| Reset the ink on re-entry as well | check 8(b) |

Record each broken run in `docs/reviews/2026-08-05-signature/`.

- [ ] **Step 3: Run against the real build and commit**

```bash
node scripts/check_ink_tiger.mjs --out docs/reviews/2026-08-05-signature/ink-tiger.json
git add scripts/check_ink_tiger.mjs docs/reviews/2026-08-05-signature/
git commit -m "test: prove the tiger drew, lived, dozed, stirred — and never redrew"
```

---

## Task 10: Whole-page verification and the handoff

**Files:**
- Modify: `CLAUDE.md`, `docs/PROJECT-STATE.md`, `docs/DECISIONS.md`
- Create: `docs/reviews/2026-08-05-signature/README.md`

- [ ] **Step 1: Re-measure the page**

```bash
npm run build && npx next start -p 3100
node scripts/measure_density.mjs      # field-days' worst screen must have improved; mean < 45%
node scripts/measure_page.mjs         # transfer, overflow, reduced motion
node scripts/check_entrances.mjs      # the 37 existing entrances still stage and settle
node scripts/check_pinned_collage.mjs # the pin is untouched
node scripts/check_header.mjs         # the menu trigger still tints correctly with the rule on it
node scripts/check_contrast_over_photos.mjs
npm run verify:budget
```

Every one must pass. `check_entrances` and `check_pinned_collage` are here because Task 7 touched the motion
directory and Task 1 touched the header's markup — both are regression surfaces, not new features.

- [ ] **Step 2: Screenshot the page**

390 / 768 / 1440 / 1920, plus reduced-motion and no-JavaScript captures of `field-days`. Into
`docs/reviews/2026-08-05-signature/`.

- [ ] **Step 3: Write the evidence README**

`docs/reviews/2026-08-05-signature/README.md`: what each JSON is, the command that regenerates it, and the
before/after density figures for `field-days`.

- [ ] **Step 4: Update the handoff documents**

- `CLAUDE.md` — Status table to Plan 5 complete; test count; add `check_rule_in.mjs`,
  `check_leaf_cursor.mjs`, `check_ink_tiger.mjs` to the Commands list; note the two swap-point art files.
- `docs/PROJECT-STATE.md` — Plan 5 row to ✅; what Plan 6 inherits.
- `docs/DECISIONS.md` — the 5 Aug rulings from §1 of the spec; any new defect found while executing, into
  §2, with what the check missed.

- [ ] **Step 5: Final commit**

```bash
npm test && npm run lint && npm run build
git add -A && git commit -m "docs: land Plan 5's evidence and bring the handoff up to date"
```

---

## Self-review

**Spec coverage.** §3 sliding rule → Task 1. §4 leaf artwork → Task 2; behaviour, gating, safety,
removability → Task 3; every §7 cursor assertion → Task 4. §5 placement and the drawing → Tasks 5–6; phases
1–2 → Task 6; phases 3–5 → Task 7; butterfly → Task 8; every §7 tiger assertion → Task 9. §6 architecture →
the file-structure table and Task 6's server/client split. §2's budget → asserted in Tasks 4, 6, 7, 8 and 10.

**One deviation from the spec, deliberate and reasoned in Task 1:** the rule is `currentColor`, not gold,
because a 2.5:1 gold hairline over the hero photograph is invisible. The spec is amended to match.

**Placeholders:** none. Every code step carries the code. The one prose instruction that is not code —
"draw the tiger", Task 5 Step 3 — carries its constraints, its viewBox, its ink order and its path budget,
and is followed by a render-and-look step, because a drawing is the one thing in this plan that cannot be
specified as code.

**Type consistency:** `TigerPath`/`TigerPart`/`TIGER_PATHS`/`TIGER_VIEWBOX` (Task 5) are used verbatim in
Tasks 6, 8 and 9. `LEAF_PATHS`/`LEAF_VIEWBOX` (Task 2) in Task 3. `DURATION.ruleIn` (1), `CURSOR` (3),
`DURATION.tigerInk`/`tigerInkStagger` (6), `LIVING` (7) are each defined once and referenced by name
thereafter. `data-ink`, `data-part`, `data-ink-tiger`, `data-butterfly`, `data-rule` are the five attribute
contracts, each introduced in one task and consumed by name in its rig.
