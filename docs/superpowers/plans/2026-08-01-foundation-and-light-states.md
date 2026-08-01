# Mahua Home Page — Plan 1: Foundation & Light-States Preview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js project and the token system, and deliver a `/preview/light-states` page
that demonstrates the seven-state day palette bleeding continuously on scroll with the motion laws applied —
the client approval gate that must pass before any page content is built on top of it.

**Architecture:** Everything the rest of the site consumes is a *token*, not a literal. Colour lives in
`lib/palette.ts`, timing in `lib/motion.ts`, copy in `content/home.ts`. The scroll-driven background is split
into a pure, unit-tested interpolation function (`lib/day-surface.ts`) and a thin React wrapper that renders
it — so the hard logic is testable without a browser. Two Vitest suites permanently encode client
constraints that would otherwise erode: the palette must stay warm and predominantly light, and no easing
may overshoot.

**Tech Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Lenis · Vitest

**Spec:** `docs/superpowers/specs/2026-08-01-mahua-home-mvp-design.md`

## Global Constraints

Every task's requirements implicitly include these. Values copied verbatim from the spec.

- **No component may hard-code a colour, a duration, or a string of copy.** All three are imported from
  `lib/palette.ts`, `lib/motion.ts`, `content/home.ts`. (spec §6.2)
- **Palette must stay warm.** Cream/warm paper is the home key, ~80% of page height. Dark is punctuation
  only, always warm-toned. Never cold blue-black. (spec §9 — client correction, non-negotiable)
- **Nothing bounces.** No elastic, spring, back or overshoot easing anywhere. (spec §4.3)
- **Reveals run 800–1400ms.** Elements fade up from 96% scale. No lateral slides. (spec §4.3)
- **Parallax offset caps at 15%.** (spec §4.3)
- **Every animation has a defined still state under `prefers-reduced-motion`.** (spec §11)
- **Text must clear 4.5:1 contrast against its background at all seven light states.** (spec §11)
- **British spelling in all copy.** No "boutique nature resorts in India" as filler. (spec §4.2, CLAUDE.md)
- **Budgets:** hero < 200 KB, first load < 2.5s on 4G. If an effect cannot hit budget, the effect loses.
  (spec §11)
- **Decorative elements are `aria-hidden`.** (spec §11)

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/contrast.ts` | WCAG relative luminance and contrast ratio. Pure. No dependencies. |
| `lib/palette.ts` | The seven light states. The single dial for all colour. |
| `lib/motion.ts` | Durations, easings, parallax cap. The single dial for all timing. |
| `content/home.ts` | Every word on the page. The single dial for all copy. |
| `lib/day-surface.ts` | Pure scroll-progress → background colour interpolation. Unit tested. |
| `components/motion/DaySurface.tsx` | Renders the interpolated background. Thin wrapper over the above. |
| `components/motion/SmoothScroll.tsx` | Lenis provider, disabled under reduced motion. |
| `components/motion/Reveal.tsx` | The "develops, doesn't fly in" reveal primitive. |
| `components/motion/Parallax.tsx` | Depth primitive, hard-capped at 15%. |
| `components/motion/Grain.tsx` | Paper grain overlay. |
| `app/preview/light-states/page.tsx` | The client approval gate. |

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`,
  `app/globals.css`, `vitest.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a working `npm run dev` / `npm run build` / `npm test`; path alias `@/*` → repo root

- [ ] **Step 1: Scaffold Next.js into a temp folder**

`create-next-app` refuses to run in a directory containing a `README.md`, so scaffold aside and merge in.

```bash
npx create-next-app@latest .tmp-scaffold --typescript --tailwind --eslint --app --no-src-dir --turbopack --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Merge the scaffold into the repo root**

Keep the existing `README.md`, `CLAUDE.md`, `.gitignore`, `docs/`, `reference/`, `scripts/`, `.claude/`.

```bash
mv .tmp-scaffold/app .tmp-scaffold/public .
mv .tmp-scaffold/package.json .tmp-scaffold/package-lock.json .tmp-scaffold/tsconfig.json .
mv .tmp-scaffold/next.config.ts .tmp-scaffold/postcss.config.mjs .tmp-scaffold/eslint.config.mjs .
rm -rf .tmp-scaffold
```

- [ ] **Step 3: Install test and motion dependencies**

```bash
npm install gsap lenis
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", ".tmp-scaffold"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 5: Add test scripts to `package.json`**

Add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify the toolchain works**

Run: `npm run build && npm test`
Expected: build succeeds. `npm test` reports "No test files found" and exits 0 — that is correct at this
point; there are no tests yet.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js, Tailwind, Vitest, GSAP and Lenis"
```

---

### Task 2: WCAG contrast utility

**Files:**
- Create: `lib/contrast.ts`
- Test: `lib/contrast.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `hexToRgb(hex: string): readonly [number, number, number]` — throws on malformed input
  - `relativeLuminance(rgb: readonly [number, number, number]): number`
  - `contrastRatio(a: string, b: string): number` — order-independent, range 1–21

- [ ] **Step 1: Write the failing test**

Create `lib/contrast.test.ts`. Every expected value here is exact by definition of the WCAG formula — no
approximations of my own arithmetic.

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, relativeLuminance } from "./contrast";

describe("hexToRgb", () => {
  it("parses with and without the leading hash", () => {
    expect(hexToRgb("#F1E9D7")).toEqual([241, 233, 215]);
    expect(hexToRgb("232B21")).toEqual([35, 43, 33]);
  });

  it("throws on malformed input", () => {
    expect(() => hexToRgb("#FFF")).toThrow();
    expect(() => hexToRgb("not a colour")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 10);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
  });

  it("pins each channel coefficient independently", () => {
    // Black and white are achromatic: white linearises every channel to 1.0,
    // so it sums to 1 no matter which coefficient sits on which channel.
    // A pure primary zeroes the other two, isolating one coefficient exactly.
    expect(relativeLuminance([255, 0, 0])).toBeCloseTo(0.2126, 10);
    expect(relativeLuminance([0, 255, 0])).toBeCloseTo(0.7152, 10);
    expect(relativeLuminance([0, 0, 255])).toBeCloseTo(0.0722, 10);
  });

  it("takes the linear branch below the 0.03928 threshold", () => {
    // 10/255 = 0.0392157, just under the threshold. Nothing else in the suite
    // reaches this branch with a non-zero value, so without this the 12.92
    // divisor is unverifiable: 0/12.92 equals 0/anything.
    expect(relativeLuminance([10, 0, 0])).toBeCloseTo(0.2126 * (10 / 255 / 12.92), 12);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 6);
  });

  it("is 1 for a colour against itself", () => {
    expect(contrastRatio("#BB8F2E", "#BB8F2E")).toBeCloseTo(1, 10);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#31402C", "#F1E9D7")).toBeCloseTo(
      contrastRatio("#F1E9D7", "#31402C"),
      10,
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/contrast.test.ts`
Expected: FAIL — cannot resolve `./contrast`.

- [ ] **Step 3: Write the implementation**

Create `lib/contrast.ts`:

```ts
export type Rgb = readonly [number, number, number];

/** Parse a 6-digit hex colour. Throws rather than silently returning black. */
export function hexToRgb(hex: string): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG 2.1 relative luminance. https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). Order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/contrast.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/contrast.ts lib/contrast.test.ts
git commit -m "feat: add WCAG contrast utility"
```

---

### Task 3: The seven light states

**Files:**
- Create: `lib/palette.ts`
- Test: `lib/palette.test.ts`

**Interfaces:**
- Consumes: `contrastRatio`, `relativeLuminance`, `hexToRgb` from `lib/contrast.ts`
- Produces:
  - `type LightState = { id: LightStateId; label: string; bg: string; text: string; accent: string; accentText: string }`
  - `type LightStateId = "dawn" | "firstLight" | "midMorning" | "afternoon" | "lateAfternoon" | "dusk" | "night"`
  - `const LIGHT_STATES: readonly LightState[]` — exactly 7, ordered dawn → night
  - `function lightState(id: LightStateId): LightState`

**Important:** `accent` is **decorative only** — rules, ornaments, the logo, never text. Gold `#BB8F2E` on
cream `#F1E9D7` measures roughly 2.5:1, which fails at every text size. `accentText` is the AA-compliant
link colour for that background.

**If a colour below fails its contrast test, adjust the hex until it passes — do not weaken the test.**
The thresholds are the spec's requirement; the specific hex values are a starting point.

- [ ] **Step 1: Write the failing test**

Create `lib/palette.test.ts`. The last two suites permanently encode the client's palette correction
(spec §9) so it cannot quietly erode.

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb, relativeLuminance } from "./contrast";
import { LIGHT_STATES, lightState } from "./palette";

const HEX = /^#[0-9A-F]{6}$/;

describe("LIGHT_STATES", () => {
  it("has exactly seven states in narrative order, dawn to night", () => {
    expect(LIGHT_STATES).toHaveLength(7);
    expect(LIGHT_STATES.map((s) => s.id)).toEqual([
      "dawn", "firstLight", "midMorning", "afternoon", "lateAfternoon", "dusk", "night",
    ]);
  });

  it("uses uppercase 6-digit hex everywhere", () => {
    for (const s of LIGHT_STATES) {
      for (const key of ["bg", "text", "accent", "accentText"] as const) {
        expect(s[key], `${s.id}.${key}`).toMatch(HEX);
      }
    }
  });

  it("ends where it began", () => {
    expect(lightState("night").bg).toBe(lightState("dawn").bg);
  });
});

describe("accessibility (spec section 11)", () => {
  it("clears 4.5:1 for body text at every state", () => {
    for (const s of LIGHT_STATES) {
      expect(contrastRatio(s.text, s.bg), `${s.id}: text on bg`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for link text at every state", () => {
    for (const s of LIGHT_STATES) {
      expect(contrastRatio(s.accentText, s.bg), `${s.id}: accentText on bg`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("the page stays warm (spec section 9 — client constraint)", () => {
  it("has no cold background: red channel never below blue", () => {
    for (const s of LIGHT_STATES) {
      const [r, , b] = hexToRgb(s.bg);
      expect(r, `${s.id} bg is cold (#16232B-style blue-black is banned)`).toBeGreaterThanOrEqual(b);
    }
  });

  it("keeps cream as the home key: at least four of seven states are light", () => {
    const light = LIGHT_STATES.filter((s) => relativeLuminance(hexToRgb(s.bg)) > 0.5);
    expect(light.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/palette.test.ts`
Expected: FAIL — cannot resolve `./palette`.

- [ ] **Step 3: Write the implementation**

Create `lib/palette.ts`:

```ts
/**
 * The seven light states of "One Day at Mahua".
 *
 * THE DIAL. Retuning the whole scroll arc happens here and nowhere else.
 * No component may hard-code a colour (spec section 6.2).
 *
 * `accent`     DECORATIVE ONLY — rules, ornaments, the logo. Never text:
 *              gold on cream measures ~2.5:1 and fails at every size.
 * `accentText` The AA-compliant link/label colour for this background.
 */
export type LightStateId =
  | "dawn" | "firstLight" | "midMorning" | "afternoon" | "lateAfternoon" | "dusk" | "night";

export type LightState = {
  readonly id: LightStateId;
  readonly label: string;
  readonly bg: string;
  readonly text: string;
  readonly accent: string;
  readonly accentText: string;
};

export const LIGHT_STATES: readonly LightState[] = [
  { id: "dawn",          label: "Pre-dawn",       bg: "#232B21", text: "#E9DFC7", accent: "#D5A63E", accentText: "#D5A63E" },
  { id: "firstLight",    label: "First light",    bg: "#3E4A33", text: "#E9DFC7", accent: "#D5A63E", accentText: "#E3B85C" },
  { id: "midMorning",    label: "Mid-morning",    bg: "#F1E9D7", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "afternoon",     label: "Afternoon",      bg: "#F1E9D7", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "lateAfternoon", label: "Late afternoon", bg: "#E9DFC8", text: "#31402C", accent: "#BB8F2E", accentText: "#7A5C18" },
  { id: "dusk",          label: "Dusk",           bg: "#E4D2AC", text: "#6E4F2F", accent: "#DCA457", accentText: "#744A12" },
  { id: "night",         label: "Night",          bg: "#232B21", text: "#E9DFC7", accent: "#BB8F2E", accentText: "#D5A63E" },
] as const;

export function lightState(id: LightStateId): LightState {
  const found = LIGHT_STATES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown light state: ${id}`);
  return found;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/palette.test.ts`
Expected: PASS, 7 tests. If a contrast assertion fails, darken that `accentText` (or lighten it on dark
backgrounds) until it passes. Do not lower the threshold.

- [ ] **Step 5: Commit**

```bash
git add lib/palette.ts lib/palette.test.ts
git commit -m "feat: add the seven light states with enforced contrast and warmth"
```

---

### Task 4: Motion tokens

**Files:**
- Create: `lib/motion.ts`
- Test: `lib/motion.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `const DURATION: { reveal: number; revealSlow: number; stagger: number; colourBleed: number; logoRotation: number }` — seconds
  - `const EASE: { settle: string; drift: string }` — GSAP easing strings
  - `const PARALLAX_MAX: number` — 0.15
  - `const REVEAL_FROM: { opacity: number; scale: number }`
  - `function prefersReducedMotion(): boolean`

- [ ] **Step 1: Write the failing test**

Create `lib/motion.test.ts`. The banned-easing suite is the spec's "nothing bounces" law made enforceable.

```ts
import { describe, expect, it } from "vitest";
import { DURATION, EASE, PARALLAX_MAX, REVEAL_FROM } from "./motion";

describe("the motion laws (spec section 4.3)", () => {
  it("keeps reveals between 800ms and 1400ms", () => {
    expect(DURATION.reveal).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.reveal).toBeLessThanOrEqual(1.4);
    expect(DURATION.revealSlow).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.revealSlow).toBeLessThanOrEqual(1.4);
  });

  it("caps parallax at 15%", () => {
    expect(PARALLAX_MAX).toBeLessThanOrEqual(0.15);
  });

  it("reveals things by developing them, not sliding them", () => {
    expect(REVEAL_FROM.scale).toBeGreaterThanOrEqual(0.94);
    expect(REVEAL_FROM.scale).toBeLessThan(1);
    expect(REVEAL_FROM).not.toHaveProperty("x");
    expect(REVEAL_FROM).not.toHaveProperty("y");
  });

  it("turns the logo slowly enough to be almost imperceptible", () => {
    expect(DURATION.logoRotation).toBeGreaterThanOrEqual(60);
  });

  it("nothing bounces", () => {
    const banned = /(elastic|bounce|back)/i;
    for (const [name, ease] of Object.entries(EASE)) {
      expect(banned.test(ease), `EASE.${name} = "${ease}" overshoots`).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/motion.test.ts`
Expected: FAIL — cannot resolve `./motion`.

- [ ] **Step 3: Write the implementation**

Create `lib/motion.ts`:

```ts
/**
 * THE DIAL for timing. "It feels too fast" is one edit here, not fifty across components.
 *
 * The motion laws (spec section 4.3):
 *   1. Nothing bounces — everything decelerates and stops.
 *   2. Things develop, they do not fly in — fade up from 96% scale, never a lateral slide.
 *   3. Depth, not movement — parallax caps at 15%.
 *   4. If you notice the animation, it is too fast.
 */

/** Seconds, matching GSAP's unit. */
export const DURATION = {
  reveal: 1.0,
  revealSlow: 1.4,
  stagger: 0.06,
  colourBleed: 0.6,
  logoRotation: 75,
} as const;

/** GSAP easing strings. Deceleration only — no overshoot family is permitted. */
export const EASE = {
  settle: "power2.out",
  drift: "none",
} as const;

export const PARALLAX_MAX = 0.15;

export const REVEAL_FROM = { opacity: 0, scale: 0.96 } as const;

/** True when the visitor has asked their device to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/motion.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/motion.ts lib/motion.test.ts
git commit -m "feat: add motion tokens enforcing the motion laws"
```

---

### Task 5: Scroll-progress colour interpolation

**Files:**
- Create: `lib/day-surface.ts`
- Test: `lib/day-surface.test.ts`

**Interfaces:**
- Consumes: `LIGHT_STATES` from `lib/palette.ts`, `hexToRgb` from `lib/contrast.ts`
- Produces:
  - `function segmentAt(progress: number): { from: number; to: number; t: number }`
  - `function backgroundAt(progress: number): string` — uppercase hex
  - `function textAt(progress: number): string` — the nearer state's text colour (text does not blend;
    blending text mid-transition would drop it below the contrast floor)

- [ ] **Step 1: Write the failing test**

Create `lib/day-surface.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LIGHT_STATES } from "./palette";
import { backgroundAt, segmentAt, textAt } from "./day-surface";

describe("segmentAt", () => {
  it("starts in the first segment and ends in the last", () => {
    expect(segmentAt(0)).toEqual({ from: 0, to: 1, t: 0 });
    expect(segmentAt(1)).toEqual({ from: 5, to: 6, t: 1 });
  });

  it("clamps outside the 0..1 range", () => {
    expect(segmentAt(-5)).toEqual({ from: 0, to: 1, t: 0 });
    expect(segmentAt(99)).toEqual({ from: 5, to: 6, t: 1 });
  });

  it("sits mid-segment between two states", () => {
    // Six segments between seven states. Deliberately sampled mid-segment, not on a
    // boundary: progress * 6 at an exact boundary is floating-point ambiguous, and
    // Math.floor turns a 1-ulp error into an off-by-one segment.
    const third = segmentAt(2.5 / 6);
    expect(third.from).toBe(2);
    expect(third.to).toBe(3);
    expect(third.t).toBeCloseTo(0.5, 6);
  });
});

describe("backgroundAt", () => {
  it("returns the endpoint colours exactly", () => {
    expect(backgroundAt(0)).toBe(LIGHT_STATES[0].bg);
    expect(backgroundAt(1)).toBe(LIGHT_STATES[6].bg);
  });

  it("blends between neighbouring states", () => {
    const mid = backgroundAt(0.5 / 6); // halfway from dawn to first light
    expect(mid).not.toBe(LIGHT_STATES[0].bg);
    expect(mid).not.toBe(LIGHT_STATES[1].bg);
    expect(mid).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("never produces a cold background while blending", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const hex = backgroundAt(p);
      const r = Number.parseInt(hex.slice(1, 3), 16);
      const b = Number.parseInt(hex.slice(5, 7), 16);
      expect(r, `progress ${p.toFixed(2)} produced cold ${hex}`).toBeGreaterThanOrEqual(b);
    }
  });
});

describe("textAt", () => {
  it("snaps to the nearer state rather than blending", () => {
    expect(textAt(0)).toBe(LIGHT_STATES[0].text);
    expect(textAt(0.4 / 6)).toBe(LIGHT_STATES[0].text);
    expect(textAt(0.6 / 6)).toBe(LIGHT_STATES[1].text);
    expect(textAt(1)).toBe(LIGHT_STATES[6].text);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/day-surface.test.ts`
Expected: FAIL — cannot resolve `./day-surface`.

- [ ] **Step 3: Write the implementation**

Create `lib/day-surface.ts`:

```ts
import { hexToRgb } from "./contrast";
import { LIGHT_STATES } from "./palette";

const SEGMENTS = LIGHT_STATES.length - 1; // six gaps between seven states

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Which pair of light states a scroll progress falls between, and how far across. */
export function segmentAt(progress: number): { from: number; to: number; t: number } {
  const p = clamp01(progress);
  const scaled = p * SEGMENTS;
  const from = Math.min(Math.floor(scaled), SEGMENTS - 1);
  return { from, to: from + 1, t: scaled - from };
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();

/**
 * The background is one continuously bleeding surface, not seven blocks (spec section 4.1).
 * Interpolated in sRGB: every state is warm, so the path between any two never passes
 * through a cold tone — which the test suite verifies across the whole range.
 */
export function backgroundAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  const a = hexToRgb(LIGHT_STATES[from].bg);
  const b = hexToRgb(LIGHT_STATES[to].bg);
  const mix = a.map((channel, i) => channel + (b[i] - channel) * t);
  return `#${mix.map(toHex).join("")}`;
}

/**
 * Text snaps to the nearer state instead of blending. A blended text colour would sit
 * below the 4.5:1 floor for the whole middle of every transition (spec section 11).
 */
export function textAt(progress: number): string {
  const { from, to, t } = segmentAt(progress);
  return LIGHT_STATES[t < 0.5 ? from : to].text;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/day-surface.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/day-surface.ts lib/day-surface.test.ts
git commit -m "feat: add scroll-progress colour interpolation for the day surface"
```

---

### Task 6: Global styles and CSS variables

**Files:**
- Modify: `app/globals.css`
- Create: `app/fonts.ts`

**Interfaces:**
- Consumes: `LIGHT_STATES` (values transcribed as CSS custom properties)
- Produces: CSS variables `--bg`, `--text`, `--accent`, `--accent-text` on `:root`, updated at runtime by
  `DaySurface`; font variables `--font-display`, `--font-heading`, `--font-label`, `--font-body`

- [ ] **Step 1: Create the font loader**

Create `app/fonts.ts`. Cormorant Garamond is on trial for display sizes per spec decision D12; Gilda
Display remains for headings.

```ts
import { Cinzel, Cormorant_Garamond, Crimson_Pro, Gilda_Display } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400"], variable: "--font-display", display: "swap",
});
export const heading = Gilda_Display({
  subsets: ["latin"], weight: "400", variable: "--font-heading", display: "swap",
});
export const label = Cinzel({
  subsets: ["latin"], weight: ["400", "500"], variable: "--font-label", display: "swap",
});
export const body = Crimson_Pro({
  subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"],
  variable: "--font-body", display: "swap",
});
```

- [ ] **Step 2: Replace `app/globals.css`**

Note: the `--bg`/`--text`/`--accent`/`--accent-text` values are **not** written here. Hard-coding them in
CSS would duplicate `lib/palette.ts` and drift from it silently, violating the global constraint. `layout.tsx`
renders them inline from `LIGHT_STATES[0]` instead (Step 3), which is server-rendered — so there is no flash
and `palette.ts` stays the only place a colour is defined.

```css
@import "tailwindcss";

@theme inline {
  --color-bg: var(--bg);
  --color-text: var(--text);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --font-display: var(--font-display);
  --font-heading: var(--font-heading);
  --font-label: var(--font-label);
  --font-body: var(--font-body);
}

html {
  /* Lenis drives scrolling; native smooth scrolling would fight it. */
  scroll-behavior: auto;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--font-body), Georgia, serif;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Wire the fonts into `app/layout.tsx`**

Replace the file:

```tsx
import type { Metadata } from "next";
import { LIGHT_STATES } from "@/lib/palette";
import { body, display, heading, label } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mahua Resorts — The wild and the calm, held together",
  description:
    "Two family-run lodges at the gates of Pench and Tadoba, in central India's tiger country.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Seeded from the first light state, server-rendered so there is no flash of
  // unstyled colour. DaySurface overwrites these as the visitor scrolls.
  // Read from palette.ts rather than written in CSS: one source of truth for colour.
  const dawn = LIGHT_STATES[0];

  return (
    <html
      lang="en-GB"
      style={
        {
          "--bg": dawn.bg,
          "--text": dawn.text,
          "--accent": dawn.accent,
          "--accent-text": dawn.accentText,
        } as React.CSSProperties
      }
    >
      <body
        className={`${display.variable} ${heading.variable} ${label.variable} ${body.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify the build still passes**

Run: `npm run build`
Expected: build succeeds, fonts download without error.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/fonts.ts app/layout.tsx
git commit -m "feat: wire palette CSS variables and the type system"
```

---

### Task 7: Smooth scroll provider

**Files:**
- Create: `components/motion/SmoothScroll.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion` from `lib/motion.ts`
- Produces: `<SmoothScroll>{children}</SmoothScroll>` — a client component; also registers GSAP
  ScrollTrigger against Lenis so scroll-driven animation stays in sync

- [ ] **Step 1: Write the component**

Create `components/motion/SmoothScroll.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Gives the page a little mass, so it reads as something with weight rather than a
 * document snapping between positions (spec section 4.3).
 *
 * Skipped entirely under prefers-reduced-motion: hijacked scrolling is itself motion,
 * and some visitors disable it for vestibular reasons.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/motion/SmoothScroll.tsx
git commit -m "feat: add Lenis smooth scroll, disabled under reduced motion"
```

---

### Task 8: The day surface

**Files:**
- Create: `components/motion/DaySurface.tsx`

**Interfaces:**
- Consumes: `backgroundAt`, `textAt` from `lib/day-surface.ts`; `LIGHT_STATES` from `lib/palette.ts`
- Produces: `<DaySurface />` — a client component, rendered once near the root. Writes `--bg`, `--text`,
  `--accent`, `--accent-text` onto `document.documentElement` as the page scrolls.

- [ ] **Step 1: Write the component**

Create `components/motion/DaySurface.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { LIGHT_STATES } from "@/lib/palette";
import { backgroundAt, segmentAt, textAt } from "@/lib/day-surface";

/**
 * The clock. One continuously bleeding surface driven by document scroll progress
 * (spec section 4.1). Writes CSS variables rather than re-rendering React, so the
 * colour update costs nothing on the main thread.
 */
export function DaySurface() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      const { from, to, t } = segmentAt(progress);
      const nearer = LIGHT_STATES[t < 0.5 ? from : to];

      root.style.setProperty("--bg", backgroundAt(progress));
      root.style.setProperty("--text", textAt(progress));
      root.style.setProperty("--accent", nearer.accent);
      root.style.setProperty("--accent-text", nearer.accentText);
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        apply();
        queued = false;
      });
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/motion/DaySurface.tsx
git commit -m "feat: add the scroll-driven day surface"
```

---

### Task 9: Reveal, Parallax and Grain primitives

**Files:**
- Create: `components/motion/Reveal.tsx`
- Create: `components/motion/Parallax.tsx`
- Create: `components/motion/Grain.tsx`

**Interfaces:**
- Consumes: `DURATION`, `EASE`, `PARALLAX_MAX`, `REVEAL_FROM`, `prefersReducedMotion` from `lib/motion.ts`
- Produces:
  - `<Reveal delay?: number; slow?: boolean>{children}</Reveal>`
  - `<Parallax strength?: number>{children}</Parallax>` — `strength` is clamped to `PARALLAX_MAX`
  - `<Grain />` — fixed full-viewport overlay, `aria-hidden`

- [ ] **Step 1: Write `Reveal`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, REVEAL_FROM, prefersReducedMotion } from "@/lib/motion";

/** Things develop, they do not fly in (spec section 4.3, law 2). */
export function Reveal({
  children, delay = 0, slow = false,
}: { children: React.ReactNode; delay?: number; slow?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, scale: 1 });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(el, { ...REVEAL_FROM }, {
      opacity: 1,
      scale: 1,
      delay,
      duration: slow ? DURATION.revealSlow : DURATION.reveal,
      ease: EASE.settle,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, slow]);

  // Starts visible so the page is readable if JavaScript never runs.
  return <div ref={ref}>{children}</div>;
}
```

- [ ] **Step 2: Write `Parallax`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EASE, PARALLAX_MAX, prefersReducedMotion } from "@/lib/motion";

/** Depth, not movement. Strength is hard-clamped (spec section 4.3, law 3). */
export function Parallax({
  children, strength = PARALLAX_MAX,
}: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    const capped = Math.min(Math.abs(strength), PARALLAX_MAX);
    const shift = el.offsetHeight * capped;

    const tween = gsap.fromTo(el, { y: -shift / 2 }, {
      y: shift / 2,
      ease: EASE.drift,
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [strength]);

  return <div ref={ref}>{children}</div>;
}
```

- [ ] **Step 3: Write `Grain`**

```tsx
/**
 * Fine paper grain across the whole page. Ties everything to the field-guide idiom and
 * stops the dark movements reading as flat rectangles (spec section 4.4).
 * Inline SVG so it costs no network request.
 */
export function Grain() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/></filter>
      <rect width="120" height="120" filter="url(#n)" opacity="0.55"/>
    </svg>`.replace(/\s+/g, " "),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.07] mix-blend-soft-light"
      style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }}
    />
  );
}
```

- [ ] **Step 4: Verify everything compiles**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all 28 existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add components/motion/
git commit -m "feat: add reveal, parallax and grain motion primitives"
```

---

### Task 10: House-style guard for copy

**Files:**
- Create: `content/home.ts`
- Test: `content/home.test.ts`

**Interfaces:**
- Consumes: `LightStateId` from `lib/palette.ts`
- Produces:
  - `type MovementCopy = { id: LightStateId; chapter: string; heading: string; body: string }`
  - `const HOME: { hero: { headline: string; sub: string }; movements: readonly MovementCopy[] }`

Only the hero and the two dark bookends are written here. The remaining movements' copy is drafted in Plan 2,
after the light-states gate. The house-style test applies to whatever exists.

- [ ] **Step 1: Write the failing test**

Create `content/home.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HOME } from "./home";

const strings = (obj: unknown): string[] =>
  typeof obj === "string" ? [obj]
    : Array.isArray(obj) ? obj.flatMap(strings)
    : obj && typeof obj === "object" ? Object.values(obj).flatMap(strings)
    : [];

describe("house style (CLAUDE.md conventions)", () => {
  const all = strings(HOME);

  it("uses British spelling", () => {
    const american = /\b(color|colors|favorite|center|centers|honor|organize|realize|traveler|travelers|harmonize)\b/i;
    for (const s of all) {
      expect(american.test(s), `American spelling in: "${s}"`).toBe(false);
    }
  });

  it("does not reuse the old keyword filler", () => {
    for (const s of all) {
      expect(s.toLowerCase()).not.toContain("boutique nature resorts in india");
    }
  });

  it("opens with one confident line, not a paragraph", () => {
    expect(HOME.hero.headline.length).toBeLessThanOrEqual(60);
    expect(HOME.hero.headline.split(".").filter(Boolean)).toHaveLength(1);
  });
});

describe("HOME.movements", () => {
  it("gives every movement a chapter label and a heading", () => {
    for (const m of HOME.movements) {
      expect(m.chapter.length, m.id).toBeGreaterThan(0);
      expect(m.heading.length, m.id).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run content/home.test.ts`
Expected: FAIL — cannot resolve `./home`.

- [ ] **Step 3: Write the implementation**

Create `content/home.ts`:

```ts
import type { LightStateId } from "@/lib/palette";

/**
 * THE DIAL for copy. Every word on the page lives here, so text edits never touch layout
 * (spec section 6.2). Shaped to slot into Sanity later without redesign (spec D9).
 *
 * Voice: drafted from Mahua_Resorts_Master_Brand_Record.md. British spelling.
 * Specificity is the brand's luxury — name a gate, a tigress, a tree, a dish.
 */
export type MovementCopy = {
  readonly id: LightStateId;
  readonly chapter: string;
  readonly heading: string;
  readonly body: string;
};

export const HOME = {
  hero: {
    headline: "The wild and the calm, held together",
    sub: "Two family-run lodges at the gates of Pench and Tadoba.",
  },
  movements: [
    {
      id: "dawn",
      chapter: "Before dawn",
      heading: "The mahua falls",
      body:
        "Each spring, before first light, the mahua drops its cream-coloured flowers until the forest " +
        "floor lies carpeted in pale blossom. Chital, sloth bear and a hundred smaller lives gather " +
        "beneath it. We took our name from that tree.",
    },
    {
      id: "night",
      chapter: "Night",
      heading: "The lanterns are already lit",
      body:
        "A telescope wheeled onto the lawn, and someone to tell you what you are looking at. " +
        "Five kilometres away, the forest carries on without us.",
    },
  ],
} as const satisfies {
  hero: { headline: string; sub: string };
  movements: readonly MovementCopy[];
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run content/home.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add content/home.ts content/home.test.ts
git commit -m "feat: add copy tokens with a British-spelling house-style guard"
```

---

### Task 11: The light-states preview page

**Files:**
- Create: `app/preview/light-states/page.tsx`

**Interfaces:**
- Consumes: `LIGHT_STATES`, `contrastRatio`, `DaySurface`, `SmoothScroll`, `Grain`, `Reveal`, `Parallax`,
  `HOME`
- Produces: the route `/preview/light-states` — **the client approval gate (spec §6.3, step 1)**

- [ ] **Step 1: Write the page**

Create `app/preview/light-states/page.tsx`:

```tsx
import { DaySurface } from "@/components/motion/DaySurface";
import { Grain } from "@/components/motion/Grain";
import { Reveal } from "@/components/motion/Reveal";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { contrastRatio } from "@/lib/contrast";
import { LIGHT_STATES } from "@/lib/palette";
import { HOME } from "@/content/home";

export const metadata = { title: "Light states — Mahua Resorts" };

export default function LightStatesPreview() {
  return (
    <SmoothScroll>
      <DaySurface />
      <Grain />
      <main>
        {LIGHT_STATES.map((state, i) => (
          <section
            key={state.id}
            className="flex min-h-screen flex-col justify-center px-[8vw] py-24"
          >
            <Reveal>
              <p
                className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.28em]"
                style={{ color: "var(--accent-text)" }}
              >
                {String(i + 1).padStart(2, "0")} · {state.label}
              </p>

              <h2 className="mt-6 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] font-light leading-[1.05]">
                {i === 0 ? HOME.hero.headline : state.label}
              </h2>

              <p className="mt-8 max-w-[46ch] text-lg leading-relaxed opacity-90">
                {i === 0
                  ? HOME.hero.sub
                  : "Body text at this light state. Check that it reads comfortably, that the " +
                    "background feels warm rather than cold, and that the change from the state " +
                    "above arrived without you noticing a boundary."}
              </p>

              <a
                href="#"
                className="mt-8 inline-block font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.24em] underline underline-offset-8"
                style={{ color: "var(--accent-text)" }}
              >
                A link at this state
              </a>

              <dl className="mt-16 grid max-w-lg grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs opacity-70">
                <dt>background</dt><dd>{state.bg}</dd>
                <dt>text</dt><dd>{state.text}</dd>
                <dt>text contrast</dt>
                <dd>{contrastRatio(state.text, state.bg).toFixed(2)}:1</dd>
                <dt>link contrast</dt>
                <dd>{contrastRatio(state.accentText, state.bg).toFixed(2)}:1</dd>
                <dt>accent (decorative only)</dt><dd>{state.accent}</dd>
              </dl>
            </Reveal>
          </section>
        ))}
      </main>
    </SmoothScroll>
  );
}
```

- [ ] **Step 2: Run the dev server and view it**

```bash
npm run dev
```

Open `http://localhost:3000/preview/light-states`.

Expected: scrolling moves the background continuously from forest green, up through cream, into ochre, and
back to forest green. **No visible boundary between sections.** Every contrast readout ≥ 4.50.

- [ ] **Step 3: Verify the production build**

Run: `npm run build && npm test`
Expected: build succeeds; all 32 tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/preview/light-states/page.tsx
git commit -m "feat: add the light-states preview page"
```

---

### Task 12: Verification pass and client gate

**Files:** none created — this task produces evidence.

**Interfaces:**
- Consumes: everything above
- Produces: screenshots and a Lighthouse report for the client review

- [ ] **Step 1: Screenshot at all four widths**

With `npm run dev` running, capture `/preview/light-states` at **390 · 768 · 1440 · 1920 px** (spec §11).
Save to `docs/reviews/2026-08-01-light-states/`.

- [ ] **Step 2: Run Lighthouse against the production build**

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000/preview/light-states --output html \
  --output-path docs/reviews/2026-08-01-light-states/lighthouse.html --chrome-flags="--headless"
```

Expected: Accessibility ≥ 95. Record Performance; the preview has almost no imagery, so treat this as the
baseline the real page must not fall far below.

- [ ] **Step 3: Verify the grain reads on both light and dark**

Grain uses `mix-blend-soft-light`, which works on light and dark backgrounds alike — unlike `multiply`,
which vanishes on the dark states. Scroll to the cream states and to the two forest-green bookends.

Expected: a faint tooth visible in **both**. If it disappears at either end, adjust the opacity or blend
mode in `components/motion/Grain.tsx` until it reads at both, then re-verify. Spec §4.4 requires it to stop
the dark movements looking like flat rectangles, so "invisible on dark" is a failure.

- [ ] **Step 4: Verify the reduced-motion still state**

In Chrome DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload the page.
Expected: no smooth-scroll hijacking, content visible immediately, no reveal animation, background still
tracks scroll position. **Nothing disappears or becomes unreadable.**

- [ ] **Step 5: Commit the evidence**

```bash
git add docs/reviews/
git commit -m "docs: light-states verification evidence"
```

- [ ] **Step 6: STOP — client approval gate**

**Do not begin Plan 2.** Spec §6.3 requires the client to approve colour and motion from the running page
before any movement is built on top of it. Present the screenshots and ask specifically:

1. Does the page feel **warm** throughout? (spec §9 — the constraint they raised)
2. Is the motion slow enough? The intended answer is "almost too slow."
3. Does any transition show a visible boundary?

If colour needs retuning, it is `lib/palette.ts` alone. If timing needs retuning, `lib/motion.ts` alone.

---

## What follows this plan

| Plan | Contents | Gate |
|---|---|---|
| **2** | The seven movements in narrative order, with copy drafted from the Master Brand Record | After the light-states gate |
| **3** | Signature interactions: logo bloom → leaf cursor → tiger (rig, state machine, art) | After movements render |
| **4** | Image optimisation, performance budget enforcement, full WCAG pass, the targeted shot list (spec §7) | Before client handover |

---

## Self-Review

**Spec coverage.** §4.1 palette → Task 3. §4.2 typography → Task 6. §4.3 motion laws → Tasks 4, 9. §4.4
grain → Task 9. §6.1 stack → Task 1. §6.2 the four dials → Tasks 3, 4, 10 (`lib/tiger/rig.ts` is Plan 3).
§6.3 build order → task order, gate at Task 12. §11 contrast → Tasks 2, 3; reduced motion → Tasks 7, 9,
12; screenshots and Lighthouse → Task 12. §9 warmth → Task 3, enforced by test. **Deferred by design:**
§3 movements (Plan 2), §5 interactions (Plan 3), §7 shot list and §10 SEO map (Plan 4).

**Placeholder scan.** No TBD/TODO. Every code step carries complete, runnable code. Task 10 intentionally
ships only the hero and two bookends — stated explicitly, with the remainder assigned to Plan 2, rather
than left vague.

**Type consistency.** `LightStateId` defined Task 3, consumed Tasks 5, 10. `LIGHT_STATES` defined Task 3,
consumed Tasks 5, 8, 11. `backgroundAt`/`textAt`/`segmentAt` defined Task 5, consumed Task 8.
`DURATION`/`EASE`/`PARALLAX_MAX`/`REVEAL_FROM`/`prefersReducedMotion` defined Task 4, consumed Tasks 7, 9.
`hexToRgb`/`contrastRatio`/`relativeLuminance` defined Task 2, consumed Tasks 3, 5, 11. `HOME` defined
Task 10, consumed Task 11. Names match at every site.
