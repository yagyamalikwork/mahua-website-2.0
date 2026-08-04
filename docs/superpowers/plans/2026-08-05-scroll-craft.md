# Mahua Home Page — Plan 4: The Scroll Craft

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the page the scroll behaviour of [thesujanlife.com](https://thesujanlife.com/) — a fixed
header that gains a cream background and the brand's own brown as you leave the hero, and a slight,
slow rise on everything as it enters — **and come out lighter than we went in** by building it the way the
reference actually builds it.

**Architecture:** The reference was measured, not guessed (5 Aug 2026, `docs/reviews/2026-08-05-sujan-scroll/`).
It uses **Lenis and CSS transitions. It does not use GSAP.** We carry GSAP (71 KB) and ScrollTrigger (44 KB)
to do what it does with a class and an `IntersectionObserver`. So this plan replaces our five GSAP-driven
primitives with one CSS entrance engine, removes both libraries, and spends the room that buys on the
effects the client asked for. Mobile LCP is currently ~4.8s against a 2.5s budget; this is the larger of the
two levers costed in `docs/reviews/2026-08-04-task-8-lcp/`.

**Tech Stack:** Next.js 16 · TypeScript · Tailwind 4 · Lenis · `IntersectionObserver` · CSS transitions · Vitest · Playwright

## What the reference actually does — measured, not assumed

| | Finding |
|---|---|
| Header | `position: fixed`, 77px tall. **Transparent at the top**; gains `background: #F6F3EF` once past the hero. Nav text stays dark throughout — it never inverts, because the bar gains a background instead |
| Entrance | `translateY` of **14.1px** and **17.9px** on live elements, plus a scale of **1.0013**. `transition: all` |
| "3D" | **There is none.** `perspective: none` on every element; no `perspective()` anywhere in their CSS. What reads as dimensional is a short rise, a whisper of scale, and a slow ease |
| Libraries | Lenis ✓ · Swiper (one carousel) ✓ · **GSAP ✗** · ScrollTrigger ✗ · AOS ✗ · Locomotive ✗ |

## Client direction, 5 August 2026

- The header — menu, emblem, wordmark, booking pill — **stays at the top while scrolling**, as the
  reference's does.
- **When scrolled, the wordmark turns the brown it is in the actual logo.** Sampled from the client's
  vector: **`#7F5C24`**, which measures **5.02:1 on `paper`** and **4.58:1 on `paperDeep`** — both pass.
- Match **or better** the reference's scrolling feel.
- Add the **slight, very smooth rise** the reference puts on text and image cards as they come into view.
- The **mahua emblem spins once on load**, not continuously. Explicitly low priority.
- Scope confirmed: this plan is the scroll craft. **The leaf cursor and the ink tiger move to Plan 5.**

## Global Constraints

Every task inherits these. Exact values, copied verbatim.

- **Cream is the page.** `paper #F1E9D7`, `paperDeep #E9DFC8`, `ink #31402C`, `dim #5A5240`,
  `gold #BB8F2E`, `goldText #7A5C18`, `overlay #232B21`. No dark sections except photographs and their
  overlays.
- **New palette token this plan adds:** `brand #7F5C24` — the wordmark brown from the client's own logo.
  Decorative-plus-legible: it clears 4.5:1 on both paper surfaces and must be guarded by
  `lib/palette.test.ts` like every other token.
- **Nothing bounces.** Deceleration only. No easing from the `elastic`, `bounce` or `back` families —
  guarded by the existing test over `EASE`.
- **If you notice the animation, it is too fast.**
- **Every animation has a defined still state under `prefers-reduced-motion`**, and everything decorative
  is `aria-hidden`.
- **Fail-safe markup.** The server-rendered state is the at-rest state. Script may only move an element out
  of place in order to bring it back. No JavaScript, a thrown error, or reduced motion must all leave the
  page readable. Guarded by `components/motion/primitives.test.tsx`.
- **Contrast:** body ≥ 4.5:1, large display over photographs ≥ 3:1, checked by
  `scripts/check_contrast_over_photos.mjs`. A target that cannot be found is a **failure**, not a skip.
- **Budgets beat effects.** Initial page transfer < 1.5 MB (initial load, not whole scroll — client ruled
  4 Aug). Largest image < 200 KB. **This plan must not increase JavaScript weight; it is expected to reduce
  it by ~115 KB of library.**
- **Do not check the hero with Lighthouse's LCP** — Chrome resolves this page's LCP to a paragraph.
  `scripts/measure_page.mjs` reports the hero's own `responseEnd`. Single runs vary 2,462–4,140 ms on an
  unchanged build; **medians of 5 only.**
- **All copy lives in `content/`.** No user-facing string in a component.
- 158 tests pass today. Do not weaken one to make a number pass.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/motion.ts` | *Modified* — `ENTER` tokens replace `REVEAL_FROM`; `EASE.settle` becomes a CSS easing string |
| `lib/palette.ts` | *Modified* — adds the `brand` token |
| `app/globals.css` | *Modified* — the entrance rules, the header's two states, the emblem spin |
| `components/motion/useInView.ts` | **New** — the one `IntersectionObserver` hook every entrance uses |
| `components/motion/Enter.tsx` | **New** — replaces `Reveal`. A rise-and-settle wrapper |
| `components/motion/ImageReveal.tsx` | *Rewritten* — same mask, CSS instead of GSAP |
| `components/motion/SplitLines.tsx` | *Rewritten* — same per-line stagger, CSS instead of GSAP |
| `components/motion/Parallax.tsx` | *Rewritten* — subscribes to one shared loop instead of ScrollTrigger |
| `components/motion/SmoothScroll.tsx` | *Modified* — owns the rAF loop and a `subscribe` channel; no GSAP ticker |
| `components/motion/Reveal.tsx` | **Deleted** — `Enter` replaces it |
| `components/ui/SiteHeader.tsx` | *Modified* — fixed, and swaps state on scroll |
| `components/ui/BrandMark.tsx` | *Modified* — wordmark takes the brand brown in the scrolled state |
| `package.json` | *Modified* — `gsap` removed |

---

### Task 1: The entrance engine

**Files:**
- Create: `components/motion/useInView.ts`
- Modify: `lib/motion.ts`, `lib/motion.test.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `prefersReducedMotion` from `lib/motion.ts`
- Produces:
  - `const ENTER: { rise: string; scale: number; duration: number; stagger: number; ease: string }`
  - `function useInView<T extends HTMLElement>(options?: { rootMargin?: string }): { ref: React.RefObject<T | null>; state: "rest" | "pending" | "in" }`

**This task changes a motion law, deliberately.** `REVEAL_FROM` is `{ opacity: 0, scale: 0.96 }` and
`lib/motion.test.ts` asserts it has no `x` and no `y` — written to enforce spec §4.3 law 2, *"things develop,
they do not fly in — never a lateral slide."* The client has now asked for exactly the reference's entrance,
which is a **16px vertical rise**. A 16px rise is not a thing flying in; a lateral slide still is. So the law
narrows to what it was always protecting, the test narrows with it, and the reasoning is recorded in
`lib/motion.ts` so nobody re-widens it by accident.

- [ ] **Step 1: Write the failing test**

Add to `lib/motion.test.ts`, and delete the existing `"reveals things by developing them, not sliding them"`
test that asserts on `REVEAL_FROM`:

```ts
  it("rises by the amount the reference site actually rises", () => {
    // Measured on thesujanlife.com, 5 Aug 2026: live elements sat at
    // translateY 14.1px and 17.9px. 16px is between them. This is the whole of
    // the "3D raise" — the reference has `perspective: none` everywhere.
    const px = Number(ENTER.rise.replace("px", ""));
    expect(px).toBeGreaterThanOrEqual(12);
    expect(px).toBeLessThanOrEqual(20);
  });

  it("scales by a whisper, never a zoom", () => {
    // The reference measured 1.0013. Anything the eye can name as a zoom is
    // the gimmick spec section 4.3 law 2 exists to forbid.
    expect(ENTER.scale).toBeGreaterThan(0.98);
    expect(ENTER.scale).toBeLessThan(1);
  });

  it("never slides laterally", () => {
    // The law that survives: a vertical settle is developing, a horizontal
    // one is flying in. `rise` is the only offset this vocabulary has.
    expect(Object.keys(ENTER)).not.toContain("x");
    expect(ENTER.rise).toMatch(/^\d+px$/);
  });

  it("decelerates and never overshoots", () => {
    // A cubic-bezier whose second control point sits at or above y=1 comes to
    // rest from above — a bounce by another name.
    const m = ENTER.ease.match(/cubic-bezier\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
    expect(m, `ENTER.ease must be a cubic-bezier, got ${ENTER.ease}`).not.toBeNull();
    expect(Number(m![4])).toBeLessThanOrEqual(1);
  });

  it("staggers slowly enough to read as one movement", () => {
    expect(ENTER.stagger).toBeGreaterThan(0.04);
    expect(ENTER.stagger).toBeLessThan(0.15);
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/motion.test.ts` → FAIL, `ENTER` is not exported.

- [ ] **Step 3: Add the tokens**

In `lib/motion.ts`, delete `REVEAL_FROM` and add:

```ts
/**
 * The entrance vocabulary, taken from the reference site rather than invented.
 *
 * Measured on thesujanlife.com on 5 Aug 2026: live elements sat at translateY
 * 14.1px and 17.9px with a scale of 1.0013, and **`perspective: none` on every
 * one of them**. What the client described as a "3D raise" is a short rise, a
 * whisper of scale and a slow ease — there is no perspective anywhere in it,
 * and building literal 3D would look wrong beside the thing it is copying.
 *
 * `rise` narrows spec section 4.3 law 2 rather than breaking it. The law says
 * things develop and never fly in, and `REVEAL_FROM` enforced that by having no
 * offset at all. A 16px vertical settle is developing. A lateral slide is still
 * flying in, and `ENTER` has no `x` for one.
 */
export const ENTER = {
  rise: "16px",
  scale: 0.994,
  /** Seconds. Slow enough that the movement is felt rather than seen. */
  duration: 0.9,
  /** Seconds between successive items in a group. */
  stagger: 0.08,
  /** Decelerating, no overshoot — the CSS equivalent of `EASE.settle`. */
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
```

- [ ] **Step 4: Write the hook**

Create `components/motion/useInView.ts`:

```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** `rest` = never animated. `pending` = staged offscreen. `in` = settled. */
export type EnterState = "rest" | "pending" | "in";

/**
 * The one observer every entrance on the page goes through.
 *
 * The state machine is the fail-safe arrangement this project already relies
 * on, expressed without a tween library. The element renders at rest, so no
 * JavaScript and a thrown error both leave it visible. Only once script is
 * running, motion is wanted, and the element is confirmed **below the fold** is
 * it staged — and staging happens where nobody can see it. Anything already on
 * screen at mount stays `rest` forever, which is the fix for the flicker a
 * Playwright capture found on 4 Aug: settled text painting, then dropping out
 * of view and lifting back.
 */
export function useInView<T extends HTMLElement>(options?: { rootMargin?: string }) {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<EnterState>("rest");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setState("in");
          observer.disconnect();
        }
      },
      { rootMargin: options?.rootMargin ?? "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.rootMargin]);

  return { ref, state };
}
```

- [ ] **Step 5: Add the CSS**

Append to `app/globals.css`:

```css
/*
 * The entrance. `data-enter` is written by `components/motion/useInView.ts`,
 * and its absence is the at-rest state — so markup that never meets JavaScript
 * is simply visible, which is the arrangement every motion primitive here uses.
 */
[data-enter] {
  transition:
    opacity var(--enter-duration) var(--enter-ease),
    transform var(--enter-duration) var(--enter-ease);
  transition-delay: var(--enter-delay, 0s);
}

[data-enter="pending"] {
  opacity: 0;
  transform: translate3d(0, var(--enter-rise), 0) scale(var(--enter-scale));
}

[data-enter="in"] {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  /* A still state, not a fast one. */
  [data-enter] {
    transition: none;
    transform: none;
    opacity: 1;
  }
}
```

And in the `:root` block written by `app/layout.tsx` (Task 1 wires the values from `ENTER`, so the
numbers live in one place): `--enter-rise`, `--enter-scale`, `--enter-duration`, `--enter-ease`.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`

```bash
git add lib/motion.ts lib/motion.test.ts components/motion/useInView.ts app/globals.css app/layout.tsx
git commit -m "feat: add the CSS entrance engine, measured off the reference"
```

---

### Task 2: Port `Reveal` and `ImageReveal` off GSAP

**Files:**
- Create: `components/motion/Enter.tsx`
- Delete: `components/motion/Reveal.tsx`
- Modify: `components/motion/ImageReveal.tsx`, `components/motion/primitives.test.tsx`, and the six
  sections that mount `<Reveal>` (`ChapterIntro`, `Invitation`, `LodgeCards`, `PlateGrid`, `SplitFeature`,
  `Testimonials`)

**Interfaces:**
- Consumes: `ENTER`, `useInView`
- Produces: `<Enter delay?: number>{children}</Enter>` — the rise-and-settle wrapper. `ImageReveal` keeps
  its existing signature exactly: `{ children, className?, delay?, static? }`

`Reveal` faded from 96% scale, which the client's own brief called too subtle to register. `Enter` is the
reference's move instead. `ImageReveal` keeps its mask and its `static` escape hatch — the hero photograph
is the LCP element and must not be tweened.

- [ ] **Step 1: Extend the primitives test**

Add to `components/motion/primitives.test.tsx`:

```tsx
describe("Enter", () => {
  it("renders its children at rest with no JavaScript", () => {
    const html = renderToStaticMarkup(<Enter>visible</Enter>);
    expect(html).toContain("visible");
    expect(html, "nothing may be staged in markup that script must undo").not.toMatch(
      /data-enter="pending"|opacity:\s*0/,
    );
  });

  it("leaves an element that is already on screen alone", () => {
    withReducedMotion(false);
    const { container } = render(<Enter>visible</Enter>);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBeNull();
  });

  it("stages an element that is still below the fold", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<Enter>visible</Enter>);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBe("pending");
  });

  it("does not stage anything when the visitor asked for less motion", () => {
    withReducedMotion(true);
    placeBelowTheFold();
    const { container } = render(<Enter>visible</Enter>);
    expect(container.firstElementChild?.getAttribute("data-enter")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/motion/primitives.test.tsx` → FAIL, cannot resolve `./Enter`.

- [ ] **Step 3: Write `Enter`**

```tsx
"use client";

import { useInView } from "./useInView";
import { ENTER } from "@/lib/motion";

/**
 * A rise and settle as the element enters — the reference site's entrance,
 * replacing the `Reveal` that faded from 96% scale and was too subtle to
 * register. The whole animation is two CSS custom properties and a transition;
 * the only JavaScript is one shared `IntersectionObserver`.
 */
export function Enter({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, state } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      {...(state === "rest" ? {} : { "data-enter": state })}
      style={delay ? ({ "--enter-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `ImageReveal` on the same engine**

Keep the collapsed-at-rest mask and the `static` prop verbatim; swap the GSAP timeline for `useInView`
plus two CSS classes. The mask animates `scaleY` from 1 to 0 with `transform-origin: top`; the inner image
settles from `IMAGE_FROM.scale`. Delete the `gsap` and `ScrollTrigger` imports.

- [ ] **Step 5: Replace `<Reveal>` with `<Enter>` in the six sections, and delete `Reveal.tsx`**

```bash
git rm components/motion/Reveal.tsx
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`

```bash
git add -A && git commit -m "feat: replace Reveal with the CSS entrance, and port ImageReveal"
```

---

### Task 3: Port `SplitLines` and `Parallax`, and remove GSAP

**Files:**
- Modify: `components/motion/SplitLines.tsx`, `components/motion/Parallax.tsx`,
  `components/motion/SmoothScroll.tsx`, `components/motion/primitives.test.tsx`, `package.json`

**Interfaces:**
- Consumes: `ENTER`, `useInView`
- Produces:
  - `SplitLines` and `Parallax` keep their existing signatures exactly — no call site changes
  - `SmoothScroll`'s context gains `subscribe(fn: (scrollY: number) => void): () => void` alongside the
    existing `lock`/`unlock`

**This is the task that pays for the plan.** After it, `gsap` leaves `package.json`: 71 KB plus 44 KB.

`Parallax` is mounted in **ten** places (`ChapterIntro` ×3, `SplitFeature` ×4, `Testimonials` ×2,
`FullBleed` ×1), so it needs a real replacement. Ten independent scroll listeners would be ten layout reads
per frame; instead `SmoothScroll` — which already runs one rAF loop for Lenis — publishes its scroll
position and every `Parallax` subscribes. Under reduced motion there is no Lenis, no loop, and therefore no
parallax, which is the correct still state.

`SplitLines` keeps its per-line stagger measured after layout, and keeps the rule that a headline already
on screen is left entirely alone. The stagger becomes `--enter-delay` per line instead of a GSAP
`stagger` function.

- [ ] **Step 1: Extend the primitives test**

```tsx
  it("gives each line a later delay than the one above it", () => {
    withReducedMotion(false);
    placeBelowTheFold();
    const { container } = render(<SplitLines as="h2">{HEADLINE}</SplitLines>);
    const delays = [...container.querySelectorAll<HTMLElement>("[data-line-inner]")].map((e) =>
      Number((e.style.getPropertyValue("--enter-delay") || "0s").replace("s", "")),
    );
    expect(delays.length).toBeGreaterThan(0);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(Math.max(...delays)).toBeGreaterThan(0);
  });

  it("has no GSAP left anywhere in the motion components", async () => {
    // The plan's whole budget argument. A stray import re-adds 115 KB.
    const dir = path.join(process.cwd(), "components", "motion");
    for (const f of readdirSync(dir).filter((n) => /\.tsx?$/.test(n) && !n.includes(".test."))) {
      const src = readFileSync(path.join(dir, f), "utf8");
      expect(src, `${f} still imports gsap`).not.toMatch(/from "gsap/);
    }
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/motion/primitives.test.tsx` → FAIL on both.

- [ ] **Step 3: Give `SmoothScroll` a subscribe channel and its own ticker**

Replace `gsap.ticker.add(raf)` with `requestAnimationFrame`, and publish each frame's scroll position to a
`Set` of subscribers. Remove `gsap.registerPlugin(ScrollTrigger)` and `lenis.on("scroll", ScrollTrigger.update)`.

- [ ] **Step 4: Rewrite `Parallax` to subscribe, and `SplitLines` to use per-line delays**

- [ ] **Step 5: Remove the dependency**

```bash
npm uninstall gsap
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`
Report the change in built JS weight — this is the number the plan is judged on.

```bash
git add -A && git commit -m "perf: build the scroll effects the way the reference does, and drop GSAP"
```

---

### Task 4: The header that stays

**Files:**
- Modify: `components/ui/SiteHeader.tsx`, `components/ui/BrandMark.tsx`, `lib/palette.ts`,
  `lib/palette.test.ts`, `app/globals.css`, `app/layout.tsx`, `scripts/check_contrast_over_photos.mjs`

**Interfaces:**
- Consumes: `useInView`-style observation of the hero, `PALETTE`
- Produces: `PALETTE.brand = "#7F5C24"`, and a header that is `fixed` with two visual states

The header currently scrolls away, and `SiteHeader`'s own comment explains why: *"cream type over a
photograph is only legible while there is a photograph under it, and a header that followed the visitor
down onto the cream page would have to invert its own colours mid-scroll."* **The reference answers that
objection**: it does not invert the text, it gives the bar a background. Once the bar is cream, dark type on
it is simply legible. Replace that comment with the new reasoning; do not leave it contradicting the code.

State is driven by whether the hero is still on screen — a sentinel observed with `IntersectionObserver`,
not a scroll-position threshold, so it stays correct at every viewport height without a magic number.

| | At the top | Past the hero |
|---|---|---|
| Bar | transparent | `paper`, with a hairline rule beneath |
| Menu / pill label | cream | `ink` |
| Wordmark | cream | **`brand` `#7F5C24`** |

- [ ] **Step 1: Write the failing palette test**

```ts
  it("keeps the brand brown legible on both paper surfaces", () => {
    // The wordmark colour from the client's own logo, sampled from the vector
    // rather than eyedropped from a screenshot. It is the header's scrolled
    // state, so it is body-weight type on cream and takes the 4.5:1 floor.
    expect(contrastRatio(PALETTE.brand, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.brand, PALETTE.paperDeep)).toBeGreaterThanOrEqual(4.5);
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/palette.test.ts` → FAIL, `PALETTE.brand` is undefined.

- [ ] **Step 3: Add the token**

```ts
  /**
   * The wordmark brown from the client's supplied lockup, sampled from
   * `Mahua-property-logos/Mahua-Resorts/Mahua-Resorts.svg` at 300 DPI: 60,143
   * pixels of the wordmark band are exactly this value. Measures 5.02:1 on
   * `paper` and 4.58:1 on `paperDeep`.
   *
   * Distinct from `goldText` (#7A5C18), which is ours and exists so gold-looking
   * *links* stay legible. This one is the brand's, and the header wears it the
   * moment it has a cream background to sit on.
   */
  brand: "#7F5C24",
```

- [ ] **Step 4: Make the header fixed and stateful**

`position: fixed`, and a `data-scrolled` attribute toggled by observing a sentinel placed at the foot of
the hero. Colour transitions use `ENTER.duration` and `ENTER.ease` so the bar changes at the same pace as
everything else on the page.

- [ ] **Step 5: Add the scrolled state to the contrast rig**

`scripts/check_contrast_over_photos.mjs` measures the header at the top of the page. Add a second run that
scrolls past the hero and measures menu, wordmark and pill label against `paper`. **A target it cannot find
is already a failure** (5 Aug), so a selector that drifts will be caught rather than skipped.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm test && npm run build && npm run lint`, then the contrast rig against a
production build.

```bash
git add -A && git commit -m "feat: keep the header at the top, and give it the brand's own brown"
```

---

### Task 5: The emblem turns once

**Files:**
- Modify: `components/ui/BrandMark.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `ENTER.ease`
- Produces: nothing other tasks depend on

The client's standing idea, narrowed by them on 5 Aug: **once on load, then still.** That matches
non-negotiable #5's reasoning — permanent peripheral motion contradicts "seduce, not convert" and
"restraint is a requirement".

The emblem is a raster crop of the client's vector, so petals and leaves cannot counter-rotate
independently without re-exporting them as two layers. **That is Plan 5's problem, not this one's** — the
client called this low priority, and a single slow turn of the whole mark reads correctly at 42px.

- [ ] **Step 1: Add the keyframes**

```css
@keyframes emblem-turn {
  from { transform: rotate(-180deg); }
  to { transform: rotate(0deg); }
}

.emblem-turn {
  animation: emblem-turn 2.4s var(--enter-ease) 1 both;
}

@media (prefers-reduced-motion: reduce) {
  .emblem-turn { animation: none; }
}
```

- [ ] **Step 2: Apply it to the emblem image and verify by eye at 1440 and 390**

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: turn the emblem once as the page arrives"
```

---

### Task 6: Prove it

**Files:** none created — evidence lands in `docs/reviews/2026-08-05-scroll-craft/`.

- [ ] **Step 1: JavaScript weight, before and after**

Report built JS transferred on `/`, against the pre-plan figure. **This is the plan's headline claim.**

- [ ] **Step 2: LCP and the hero, medians of five**

`node scripts/measure_page.mjs --runs 5` at DPR 1 and DPR 3. Report mobile and desktop LCP medians and the
hero's own `responseEnd`. Single runs are not a measurement on this page.

- [ ] **Step 3: The motion is perceptible**

Capture three chapters mid-entrance and show the rise and the per-line stagger genuinely in progress —
not a still frame that could pass for no animation.

- [ ] **Step 4: The header, both states**

Screenshot at the top and past the hero, at 390 / 768 / 1440 / 1920. Confirm the bar does not cover content
it should not, and that nothing overlaps at 320px.

- [ ] **Step 5: Contrast, both header states**

`node scripts/check_contrast_over_photos.mjs` — zero failures **and zero not-found**.

- [ ] **Step 6: Reduced motion and no JavaScript**

Every section visible and readable, nothing staged, nothing behind a mask, the header still legible.

- [ ] **Step 7: Density did not regress**

`node scripts/measure_density.mjs` — all twelve chapters still inside 45%. A fixed header changes what a
screen contains.

- [ ] **Step 8: Commit the evidence**

---

## Self-Review

**Client direction covered.** Sticky header → Task 4. Wordmark in the logo's brown → Task 4, with the
sampled value and its measured contrast. Match-or-better the reference's scroll → Tasks 1–3, built from
measurements of the reference rather than description. The slight smooth rise → Task 1's `ENTER`, using the
reference's own 14.1/17.9px and 1.0013. Spin once on load → Task 5. "Which animations suit us" → the
architecture answer: the ones the reference actually uses, which cost 115 KB less than what we have.

**Placeholder scan.** No TBD. Every test is written out. Tasks 2 and 3 describe rewrites of existing files
rather than pasting them whole, but name the exact behaviour that must survive — `ImageReveal`'s `static`
prop and collapsed-at-rest mask, `SplitLines`' after-layout line measurement and its leave-on-screen-alone
rule, `Parallax`'s ten call sites keeping their signatures.

**Type consistency.** `ENTER` defined Task 1, consumed 2/3/4/5. `useInView`/`EnterState` defined Task 1,
consumed 2/3/4. `Enter` defined Task 2, consumed by six sections in the same task. `subscribe` defined
Task 3 on the context that already carries `lock`/`unlock` from the density work. `PALETTE.brand` defined
Task 4, consumed by `BrandMark` in the same task.

**Known risk, stated rather than discovered.** Removing GSAP touches every motion primitive at once, and
those primitives are the page's most-reviewed code — the flicker, the scroll lock and the mask-never-lifts
failures all live here. Task 2 and Task 3 each end with the full suite green and the fail-safe tests
intact, and Task 6 re-measures rather than assuming. If a primitive cannot be expressed in CSS at equal
quality, **the honest outcome is to keep GSAP for that one primitive and report the weight** — not to ship a
worse animation to win a byte count.
