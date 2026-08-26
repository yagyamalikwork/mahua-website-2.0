# The restructure and the reviews widget — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Carry out the client's eleven rulings of 26 August 2026 — take the tiger off the home page's
Experiences chapter, replace the guests' review carousel with his Elfsight embed on all three pages, and
restructure both property pages (three quote bands removed, the map's heading dropped, chapters renumbered,
the home page's activity carousel moved across, Written About on both).

**Architecture:** Content-first. This site keeps its page spines in `content/*.ts` and its words in the same
place; nine of the eleven changes are therefore content edits with a test guarding them, and only three
need component work — `ExperienceStrip` learning to take its copy as props so three pages can render it,
`PressBand` learning to render with no articles, and one new component for the embed. Nothing gains a
client boundary that does not already have one.

**Tech Stack:** Next.js 16.2.12 (App Router, React 19.2.4), TypeScript, Tailwind v4, Vitest +
@testing-library/react, Playwright for the browser rigs in `scripts/`.

**Spec:** [`docs/superpowers/specs/2026-08-26-restructure-and-reviews-design.md`](../specs/2026-08-26-restructure-and-reviews-design.md)

---

## Global Constraints

Every task's requirements implicitly include all of these. They are this repository's, not this plan's.

- **Branch is `feat/journal-and-mobile`.** Never commit to `feat/home-v2`, `demo` or `main`.
- **No user-facing string in a component.** All copy lives in `content/`. (CLAUDE.md, Architecture rule.)
- **No hard-coded colour or duration in a component.** `lib/palette.ts` and `lib/motion.ts` are the dials.
- **British spelling** in all copy.
- **Invent no copy.** If a string is needed that the client has not supplied, stop and ask. A worked
  example has shipped as real copy on this project before.
- **Cream is the page** (non-negotiable #3). No dark section except a photograph and its overlay.
- **45% empty-space ceiling per chapter, on its own worst sampled screen** (non-negotiable #8). The field
  that encodes it is `passesWorst` in `density.json`, never `passesMean`.
- **Never two consecutive text-only screens** (non-negotiable #10) — `content/*chapters.test.ts` enforces it.
- **Only images ≥1400px wide may go full-bleed** (non-negotiable #11).
- **Type over a photograph needs a measured scrim**, from `scripts/check_contrast_over_photos.mjs`, at every
  width **from 360**. Never by eye. Floors: 4.5:1 body, 3.0:1 large display type.
- **`npm test`, `npm run build` and `npm run lint` must be green** before any commit claiming completion.
- **`npm run verify:budget` is not optional** for any commit touching motion or adding script.
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

**The Elfsight app id, exactly as supplied by the client:**
`9735be0a-7667-475d-938e-2de773f1c7de`
**Script URL:** `https://elfsightcdn.com/platform.js`

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `lib/elfsight.ts` | The vendor's app id and script URL, and the class name derivation. Config, not copy — an app id is not a word a visitor reads, so it does not belong in `content/`. |
| `components/ui/ReviewWidget.tsx` | Mounts one Elfsight app. Renders the vendor's target `<div>` and the platform script. Server component. |
| `components/ui/ReviewWidget.test.tsx` | Its unit tests. |
| `lib/elfsight.test.ts` | Unit tests for the id/class derivation. |
| `docs/reviews/2026-08-26-restructure/` | Every measured figure this plan produces. |

**Modified**

| File | Change |
|---|---|
| `app/page.tsx` | Stops passing `figure`; passes `ExperienceStrip`'s copy explicitly. |
| `components/sections/ExperienceStrip.tsx` | Loses `figure` and the 7/5 header band; takes `copy` and `labels` as props. |
| `components/sections/Invitation.tsx` | `ReviewCarousel`/`ReviewPanels` out, `ReviewWidget` in. |
| `components/sections/PressBand.tsx` | `articles` becomes optional; renders a `children` slot below. |
| `components/property/PropertyPage.tsx` | `"pair"` → `"strip"`; `PressBand` gains the widget. |
| `content/property-chapters.ts` | `PropertyShape`: `"pair"` → `"strip"`. |
| `content/mahua-vann.ts` | Spine and copy — §3 of the spec. |
| `content/mahua-tola.ts` | Spine and copy — §3 of the spec, plus a new press chapter. |
| `content/home.ts` | `quotes` and `GuestQuote` removed. |
| `lib/motion.ts` | `REVIEWS` removed. |
| `app/globals.css` | `.reviews*` and `.experience-figure` removed. |
| `CLAUDE.md`, `docs/DECISIONS.md`, `docs/PROJECT-STATE.md` | The record — Task 9. |

**Deleted**

`components/sections/ReviewCarousel.tsx`, `lib/reviews.ts`, `lib/reviews.test.ts`,
`scripts/check_reviews.mjs`, `components/sections/ExperiencePair.tsx`,
`components/sections/ExperiencePair.test.tsx`, `components/ui/RatingCircles.tsx` (+ its test if one exists).

**Deliberately untouched** — unmounted, not deleted: `components/signature/SignatureFilm.tsx`,
`/media/tiger-film.mp4`, `scripts/check_films.mjs`, `components/sections/FullBleedQuote.tsx`.

---

## Task order, and why

The widget lands **first and alone** (Tasks 1–2) so its cost is measured against an otherwise unchanged
page. Bury it under a restructure and the budget delta becomes unattributable — which is exactly how a
+63-byte regression went unexplained on this project for a week.

Tasks 3–4 finish the home page. Tasks 5–8 do the property pages, content before components. Task 9 is the
whole-branch verification and the documentation, which on this project is a task and not an afterthought.

---

### Task 1: The review widget component

**Files:**
- Create: `lib/elfsight.ts`
- Create: `lib/elfsight.test.ts`
- Create: `components/ui/ReviewWidget.tsx`
- Create: `components/ui/ReviewWidget.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `ELFSIGHT_SCRIPT: string`, `REVIEWS_APP_ID: string`, `elfsightClass(appId: string): string` from
  `lib/elfsight.ts`; `<ReviewWidget appId?: string />` from `components/ui/ReviewWidget.tsx`.

**Why a server component with a bare `<script>`.** React 19 hoists and **de-duplicates** `<script async
src=…>` rendered anywhere in the tree, so two widgets on one page load the platform once and the section
stays a server component — no client boundary, no first-load JavaScript of our own. If Task 2's browser
check finds the widget never initialises, the fallback is `next/script` with `strategy="lazyOnload"`, and
that decision must be recorded with its measurement rather than taken quietly.

- [ ] **Step 1: Write the failing test for the id/class module**

```ts
// lib/elfsight.test.ts
import { describe, expect, it } from "vitest";
import { ELFSIGHT_SCRIPT, elfsightClass, REVIEWS_APP_ID } from "@/lib/elfsight";

describe("elfsight", () => {
  it("carries the client's own app id, verbatim", () => {
    expect(REVIEWS_APP_ID).toBe("9735be0a-7667-475d-938e-2de773f1c7de");
  });

  it("loads the platform from the vendor's CDN over https", () => {
    expect(ELFSIGHT_SCRIPT).toBe("https://elfsightcdn.com/platform.js");
  });

  it("builds the vendor's own class name, which is how their platform finds the mount", () => {
    expect(elfsightClass(REVIEWS_APP_ID)).toBe("elfsight-app-9735be0a-7667-475d-938e-2de773f1c7de");
  });

  it("refuses an id that is not a uuid, rather than rendering a mount nothing will ever fill", () => {
    expect(() => elfsightClass("not-a-uuid")).toThrow(/uuid/i);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/elfsight.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/elfsight"`.

- [ ] **Step 3: Write `lib/elfsight.ts`**

```ts
/**
 * The client's Elfsight reviews widget — its identifiers, and nothing else.
 *
 * **Config, not copy, which is why it is here and not in `content/`.** That
 * directory holds words a visitor reads; an app id is a key into a third
 * party's system. The distinction matters because `content/` is reviewed by the
 * client line by line and this string is not something he can check by reading.
 *
 * ## This is the first third-party script on this site
 *
 * `platform.js` is loaded from Elfsight's CDN with **no Subresource Integrity
 * hash**, which means this site executes whatever that CDN serves. SRI is the
 * usual answer and it is not available: a widget platform is updated by its
 * vendor without notice, and a pinned hash would break the widget the first
 * time they shipped a change. That is the ordinary bargain of every third-party
 * embed, the client chose the embed knowing it, and it is recorded rather than
 * solved — see `docs/superpowers/specs/2026-08-26-restructure-and-reviews-design.md` §2.3.
 *
 * Two things keep it bounded and both are load-bearing:
 * **it is loaded only by the pages that use it, never from `app/layout.tsx`**,
 * and it keeps `async` + `data-elfsight-app-lazy` so it cannot block the first
 * screen.
 */

/** The vendor's platform loader. */
export const ELFSIGHT_SCRIPT = "https://elfsightcdn.com/platform.js";

/**
 * The reviews app, exactly as the client supplied it on 26 August 2026.
 *
 * It replaced `ReviewCarousel` — a curated set of three placeholder quotes in
 * `content/home.ts` — and with it the open `REVIEWS.mode` question that
 * non-negotiable #5 carried a dated exception for.
 */
export const REVIEWS_APP_ID = "9735be0a-7667-475d-938e-2de773f1c7de";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The class name Elfsight's platform scans the document for.
 *
 * Their embed is `class="elfsight-app-<uuid>"`, and the platform finds its
 * mounts by that class alone — so a typo here is not a crash, it is a silently
 * empty section. **Hence the throw**: a malformed id fails the build, which a
 * developer sees, rather than shipping a mount nothing will ever fill, which
 * nobody sees until a stakeholder opens the page.
 */
export function elfsightClass(appId: string): string {
  if (!UUID.test(appId)) {
    throw new Error(`Elfsight app id is not a uuid: "${appId}"`);
  }
  return `elfsight-app-${appId}`;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run lib/elfsight.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing test for the component**

```tsx
// components/ui/ReviewWidget.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewWidget } from "@/components/ui/ReviewWidget";
import { REVIEWS_APP_ID } from "@/lib/elfsight";

describe("ReviewWidget", () => {
  it("renders the vendor's mount, which their platform finds by class name", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount).not.toBeNull();
  });

  it("keeps the lazy attribute, so the widget is not fetched above the fold", () => {
    const { container } = render(<ReviewWidget />);
    const mount = container.querySelector(`.elfsight-app-${REVIEWS_APP_ID}`);
    expect(mount?.hasAttribute("data-elfsight-app-lazy")).toBe(true);
  });

  it("loads the platform script asynchronously, so it cannot block the first screen", () => {
    const { container } = render(<ReviewWidget />);
    const script = container.querySelector("script");
    expect(script?.getAttribute("src")).toBe("https://elfsightcdn.com/platform.js");
    expect(script?.hasAttribute("async")).toBe(true);
  });

  it("is labelled, because a region a screen reader lands in must say what it is", () => {
    const { getByRole } = render(<ReviewWidget label="What guests say" />);
    expect(getByRole("region", { name: "What guests say" })).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

Run: `npx vitest run components/ui/ReviewWidget.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/ui/ReviewWidget"`.

- [ ] **Step 7: Write the component**

```tsx
import { ELFSIGHT_SCRIPT, elfsightClass, REVIEWS_APP_ID } from "@/lib/elfsight";

/**
 * The client's Tripadvisor reviews, as his own Elfsight widget.
 *
 * Client, 26 August 2026, supplying the embed himself: the widget replaces
 * `ReviewCarousel` on the home page and appears under `04 · Written About` on
 * both property pages.
 *
 * ## A server component, and no client boundary
 *
 * React 19 hoists `<script async src>` rendered anywhere in the tree and
 * **de-duplicates by src**, so two of these on one page load the platform once
 * and neither section needs `"use client"`. That is the whole budget claim, and
 * `npm run verify:budget` is what proves it rather than this paragraph.
 *
 * ## What it does with no JavaScript, and why that is a `<noscript>` and not
 * a spinner
 *
 * The widget renders nothing without script — it is script. A section that
 * collapsed to a heading over emptiness would be a hole in the page, so the
 * fallback is a line of type in the site's own voice, taken from `content/`.
 * **Everything decorative on this site has a defined still state** (CLAUDE.md,
 * Conventions) and a third-party embed is no exception.
 *
 * ## The one thing that cannot be asserted here
 *
 * Whether the widget **auto-scrolls**. If it does, non-negotiable #5 — nothing
 * on this site moves forever — is live again, and it is the client's call
 * whether it stays, not this component's. `docs/reviews/2026-08-26-restructure/`
 * carries the observation.
 */
export function ReviewWidget({
  appId = REVIEWS_APP_ID,
  label,
  fallback,
}: {
  /** Defaults to the reviews app. A prop so a second widget never means a second component. */
  appId?: string;
  /** The accessible name of the region. Omit and no region landmark is rendered. */
  label?: string;
  /** What a visitor with no JavaScript reads instead. Comes from `content/`. */
  fallback?: string;
}) {
  const mount = (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- it carries `async`; the rule
          does not see the attribute through a variable. */}
      <script src={ELFSIGHT_SCRIPT} async />
      <div className={elfsightClass(appId)} data-elfsight-app-lazy />
      {fallback && (
        <noscript>
          <p
            className="font-[family-name:var(--font-body)] text-[1.05rem] leading-[1.6]"
            style={{ color: "var(--dim)" }}
          >
            {fallback}
          </p>
        </noscript>
      )}
    </>
  );

  if (!label) return mount;
  return (
    <section aria-label={label} className="w-full">
      {mount}
    </section>
  );
}
```

- [ ] **Step 8: Run it and watch it pass**

Run: `npx vitest run components/ui/ReviewWidget.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 9: Full suite and lint**

Run: `npm test && npm run lint`
Expected: all green. The suite was 491 before; it is **499** now (4 + 4).

- [ ] **Step 10: Commit**

```bash
git add lib/elfsight.ts lib/elfsight.test.ts components/ui/ReviewWidget.tsx components/ui/ReviewWidget.test.tsx
git commit -m "$(cat <<'EOF'
feat: the client's reviews widget, as one component for three pages

He supplied the Elfsight embed himself on 26 Aug. One component takes the
app id as a prop, because the same widget is wanted on the home page and
both property pages and React 19 de-duplicates the platform script by src
— so two mounts on one page load it once, and nothing here needs a client
boundary.

The id module throws on a malformed uuid rather than returning it. Elfsight
finds its mounts by class name alone, so a typo is not a crash, it is a
silently empty section that nobody notices until a stakeholder opens the
page.

This is the first third-party script on this site and it carries no
Subresource Integrity hash, because a vendor's platform loader changes
without notice and a pinned hash would break the widget the first time it
did. Recorded rather than solved, and bounded two ways: loaded only by the
pages that use it, never from the layout, and kept async + lazy.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: The widget replaces the home page's review carousel

**Files:**
- Modify: `components/sections/Invitation.tsx`
- Modify: `content/home.ts` — remove `quotes`, `GuestQuote`; add the no-JS fallback line
- Modify: `lib/motion.ts` — remove `REVIEWS`
- Modify: `app/globals.css` — remove the `.reviews*` block
- Delete: `components/sections/ReviewCarousel.tsx`, `lib/reviews.ts`, `lib/reviews.test.ts`,
  `scripts/check_reviews.mjs`, `components/ui/RatingCircles.tsx`
- Modify: `content/home.test.ts` — the quote-attribution test goes with the quotes

**Interfaces:**
- Consumes: `<ReviewWidget appId? label? fallback? />` from Task 1.
- Produces: nothing new.

**The one string this needs from the client.** The `<noscript>` fallback line. **It is not to be
invented.** If it has not been supplied when this task runs, render the widget with no `fallback` prop and
raise it as an owed item — an empty `<noscript>` is honest; a sentence we wrote and attributed to the lodge
is not.

- [ ] **Step 1: Find every reference before deleting anything**

```bash
grep -rn "ReviewCarousel\|ReviewPanels\|RatingCircles\|lib/reviews\|REVIEWS\|GuestQuote\|reviewPanelId\|REVIEW_CARD\|isQuoteClamped" \
  --include=*.ts --include=*.tsx --include=*.mjs --include=*.css . | grep -v node_modules
```

Expected: hits in `Invitation.tsx`, `ReviewCarousel.tsx`, `lib/reviews.ts`, `lib/motion.ts`,
`content/home.ts`, `content/mahua-tola.ts` (a **comment** only — leave the file alone),
`app/globals.css`, `scripts/check_reviews.mjs`. Anything else is a surprise; read it before proceeding.

- [ ] **Step 2: Update `content/home.test.ts` to expect the quotes gone**

Replace the existing "attributes every guest quote" test with:

```ts
it("carries no guest quotes — the reviews are the client's own widget since 26 Aug 2026", () => {
  const invitation = HOME.chapters.invitation as Record<string, unknown>;
  expect(invitation.quotes).toBeUndefined();
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run content/home.test.ts`
Expected: FAIL — `quotes` is still defined.

- [ ] **Step 4: Remove the quotes and the type from `content/home.ts`**

Delete the `quotes` array from the `invitation` chapter, the `quotes?: readonly GuestQuote[]` field from
the chapter copy type, and the `GuestQuote` type itself. Leave a comment at the removal site:

```ts
/*
 * **The three guest quotes were here until 26 August 2026.** They were verbatim
 * from the live site's Tripadvisor widget, trimmed at sentence boundaries, and
 * they were placeholders for a curated set the client was assembling.
 *
 * He supplied an Elfsight embed instead, which is a live Tripadvisor feed and
 * therefore needs no copy here at all. `ReviewCarousel`, `lib/reviews.ts`,
 * `REVIEWS` and `scripts/check_reviews.mjs` went with them — and so did the
 * open `REVIEWS.mode` question, which non-negotiable #5 was carrying a dated
 * exception for. See `docs/DECISIONS.md` §22.
 */
```

- [ ] **Step 5: Run it and watch it pass**

Run: `npx vitest run content/home.test.ts`
Expected: PASS.

- [ ] **Step 6: Swap the component in `Invitation.tsx`**

Remove the `ReviewCarousel` / `ReviewPanels` imports and both call sites (the `<div className="mt-10 …">`
wrapper around `<ReviewCarousel …>`, and the `<ReviewPanels …>` outside the `<Enter>`). In their place,
inside the same wrapper:

```tsx
<div className="mt-10 w-full md:mt-12 short:mt-7">
  <ReviewWidget label={copy.reviewsLabel} fallback={copy.reviewsFallback} />
</div>
```

**`ReviewPanels`' comment goes with it, but its lesson does not.** Leave this at the removal site:

```tsx
{/*
  **`ReviewPanels` sat outside the `<Enter>` until 26 August 2026, and the
  reason it did still binds anything that goes here.** `Enter` sets a transform
  while it is staged, and a transform on any ancestor stops `position: fixed`
  escaping this section's `overflow-hidden`. The widget below is an iframe-like
  third-party mount and does not need to escape — but the next thing that does
  will, and this is where that was learned.
*/}
```

- [ ] **Step 7: Delete the retired modules and the CSS**

```bash
git rm components/sections/ReviewCarousel.tsx lib/reviews.ts lib/reviews.test.ts \
       scripts/check_reviews.mjs components/ui/RatingCircles.tsx
```

Remove `REVIEWS` from `lib/motion.ts` (and any publication of it in `app/layout.tsx` — check with
`grep -n "REVIEWS" app/layout.tsx`). Remove the `.reviews*` block from `app/globals.css`.

- [ ] **Step 8: Full suite, lint and build**

Run: `npm test && npm run lint && npm run build`
Expected: green. The suite drops by however many `lib/reviews.test.ts` held plus the one home test replaced
— **record the exact number**, because on this project a test-count drop must always be explained
(retiring `SplitFeature` dropped exactly 13, and that was expected, not a regression).

- [ ] **Step 9: Measure the widget — this is the point of the task**

```bash
npm run build && npx next start -p 3100 &
node scripts/measure_js_budget.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/js-budget.json
node scripts/measure_page.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/page.json
node scripts/measure_density.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/density-home.json
node scripts/check_contrast_over_photos.mjs --port 3100 --url /
```

Record in `docs/reviews/2026-08-26-restructure/README.md`, against the pre-task figures (491 tests,
167.5 KB brotli, hero `responseEnd` ~4,611 ms):

1. first-load JavaScript delta at 390 **and** 1440;
2. initial transfer, against the 1.5 MB budget;
3. hero `responseEnd` — **medians of five** via `node scripts/measure_lcp_arms.mjs --runs 5 --port 3100`,
   because single runs on this page vary by 1.7s;
4. **does the widget auto-scroll?** Watch it. One sentence, and flag it to the client if yes.

- [ ] **Step 10: Screenshot and read it**

Run: `node scripts/capture_chapters.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/shots/`

**Open the 390px and the 1440px frames and look at them.** The question is whether Tripadvisor's white
cards, their own typeface and their green read as foreign on cream (non-negotiable #3). This is a judgement
for a human — put the frames in front of the client rather than deciding alone.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: the reviews are the client's Tripadvisor widget, and the carousel is gone

His own embed, supplied 26 Aug, replaces ReviewCarousel on the home page.
Out with it go lib/reviews.ts, REVIEWS, the .reviews CSS,
check_reviews.mjs and the three placeholder quotes in content/home.ts —
all one week old.

It also answers a question rather than leaving it open. REVIEWS.mode was
built with two arms so the client could choose on the real page, and
non-negotiable #5 carried a dated exception for the looping one — the only
thing on this site that never stopped. The widget supersedes both.

Landed alone and measured alone, before the restructure goes on top of it:
bury a third-party script under eleven other changes and its cost becomes
unattributable, which is how a +63-byte regression went unexplained here
for a week. Figures in docs/reviews/2026-08-26-restructure/.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The tiger comes off, and the header band closes

**Files:**
- Modify: `app/page.tsx` — stop passing `figure`
- Modify: `components/sections/ExperienceStrip.tsx` — remove the `figure` prop and the 7/5 split
- Modify: `app/globals.css` — remove `.experience-figure`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ExperienceStrip` without a `figure` prop.

**The gap is structural.** The band is `lg:grid-cols-12` with copy in `lg:col-span-7` and the film in
`lg:col-span-5`. Removing the film alone leaves five empty columns — which is the gap the client is
pointing at. Both halves change.

- [ ] **Step 1: Write the failing test**

```tsx
// components/sections/ExperienceStrip.test.tsx  (create)
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceStrip } from "@/components/sections/ExperienceStrip";
import { chapter } from "@/content/chapters";

describe("ExperienceStrip", () => {
  it("has no figure column — the tiger came off on 26 Aug 2026", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelector(".experience-figure")).toBeNull();
    expect(container.querySelector(".lg\\:col-span-5")).toBeNull();
    expect(container.querySelector(".lg\\:col-span-7")).toBeNull();
  });

  it("still renders all six cards", () => {
    const { container } = render(<ExperienceStrip chapter={chapter("field-days")} />);
    expect(container.querySelectorAll(".experience-card")).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx`
Expected: FAIL — `.lg:col-span-7` is present.

- [ ] **Step 3: Collapse the band and drop the prop**

In `ExperienceStrip.tsx`, replace the whole header-band block with a single column, and delete the `figure`
prop from the signature and its type:

```tsx
{/*
  The header band.

  **It was a 7/5 grid until 26 August 2026, and the tiger held the five.**
  Client: *"Remove the tiger from 'The Experience' section, hence removing the
  big gap between the activities and the text for this section."* The gap he is
  pointing at is those five columns, empty — so the film going was only half the
  fix and the band collapses to one column with it.

  **The 7/5 was not arbitrary and its reasoning is now spent rather than wrong:**
  7/5 rather than 5/7 because a 7-column slot for a 300px film left 461px of bare
  cream inside its own column, and `lg:items-start` because bottom-aligning the
  shorter column would push the chapter mark 210px down the page. Both facts were
  about a film that is no longer here.

  **The film is unmounted, not deleted** — `components/signature/SignatureFilm.tsx`,
  `/media/tiger-film.mp4` and `scripts/check_films.mjs` are untouched, exactly as
  the lantern, the potter's film and the hornbill tint were handled when the v2
  restructure dropped them. `feat/image-sizing` still ships it.

  **`scripts/check_films.mjs` therefore has nothing left to check on this branch
  and will fail. That failure is the client's ruling, not a regression** — see
  `docs/DECISIONS.md` §22 and CLAUDE.md. Do not "fix" it by remounting the film.
*/}
<Enter>
  <div>
    {chapter.number && chapter.label && (
      <ChapterMark number={chapter.number} label={chapter.label} />
    )}
    <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[20ch]" />
    <p
      className="mt-7 max-w-[62ch] font-[family-name:var(--font-body)] text-[1.15rem] leading-[1.68] md:text-xl"
      style={{ color: "var(--text)" }}
    >
      {copy.body[0]}
    </p>
  </div>
</Enter>
```

**The two measures widen deliberately** — `16ch` → `20ch` on the heading and `54ch` → `62ch` on the
paragraph. In a 7-column slot those caps were the column; at full width the old caps would leave the band
emptier than the grid did, which is the opposite of what the client asked for. **62ch is at the top of the
comfortable measure and must be checked in a screenshot at 1920, not trusted.**

Remove `.experience-figure` from `app/globals.css`. Remove the `SignatureFilm` import and the `figure={…}`
prop from `app/page.tsx`, replacing them with a comment recording the unmount in the style of the lantern
and forest-tint notes already in that file.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 5: Measure the density this moved**

```bash
npm run build && npx next start -p 3100 &
node scripts/measure_density.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/density-home-2.json
```

Compare `field-days` against **27.0% mean / 31.1% worst**. Removing a `<video>` takes imagery out; closing
the band takes height out. The net is not predictable — **read the number, do not assume it**. If
`passesWorst` goes false, recompose the band rather than padding it (non-negotiable #8).

- [ ] **Step 6: Screenshot at 1920 and read the measure**

Run: `node scripts/capture_chapters.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/shots-notiger/`

Open the 1920px frame. The question is whether the 62ch paragraph reads as a column or as a stretched line.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: the tiger comes off Experiences, and the band closes behind it

Client: "Remove the tiger from 'The Experience' section, hence removing the
big gap between the activities and the text for this section."

The gap is structural. The header band was a 7/5 grid and the film held the
five; taking the film out alone would have left the five columns exactly
where they were, empty. So the band collapses to one column and the two
measures widen with it — at full width the old 16ch/54ch caps would have
left the band emptier than the grid did.

The film is unmounted, not deleted, exactly as the lantern, the potter and
the hornbill tint were. check_films.mjs now has no film to check on this
branch and fails. That failure is the ruling — recorded in CLAUDE.md and
DECISIONS.md §22 at this commit so the next session does not "fix" it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `ExperienceStrip` takes its copy as props

**Files:**
- Modify: `components/sections/ExperienceStrip.tsx`
- Modify: `app/page.tsx`
- Modify: `components/sections/ExperienceStrip.test.tsx`

**Interfaces:**
- Consumes: `ExperienceStrip` from Task 3.
- Produces:
  ```ts
  export type StripCopy = {
    readonly heading: TwoTone;
    readonly body: readonly string[];
    readonly experiences: readonly ExperienceCopy[];
  };
  export type StripLabels = { readonly region: string; readonly hint: string; readonly jump: string };
  // <ExperienceStrip chapter={…} copy={StripCopy} labels={StripLabels} surface?={boolean} />
  // `chapter` is now `{ id: string; number?: string; label?: string }` — structurally
  // satisfied by BOTH `Chapter` and `PropertyChapter`, which is the whole point.
  ```

**A pure refactor. The home page must render byte-identically afterwards.** Nothing about the markup
changes; only where the copy comes from.

- [ ] **Step 1: Write the failing test**

```tsx
it("renders copy it is given, from any page's content module", () => {
  const { getByText } = render(
    <ExperienceStrip
      chapter={{ id: "vann-day", number: "03", label: "The Experience" }}
      copy={{
        heading: { text: "The day at Vann", dim: "day" },
        body: ["Morning and evening game drives."],
        experiences: [
          { mediaId: "tiger-golden-grass", label: "At dawn", title: "Jungle Safari", line: "Through Turia Gate." },
        ],
      }}
      labels={{ region: "Experiences — scroll sideways", hint: "Scroll →", jump: "Jump to" }}
    />,
  );
  expect(getByText("Jungle Safari")).toBeTruthy();
  expect(getByText("03")).toBeTruthy();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx`
Expected: FAIL — the component ignores `copy` and calls `chapterCopy(chapter.id)`, which throws for
`vann-day`.

- [ ] **Step 3: Change the signature**

Replace the two lines that read copy off the home module:

```ts
// was:
//   const copy = chapterCopy(chapter.id as ChapterCopyKey) as StripCopy;
//   const strip = HOME.strip;
```

with `copy` and `labels` props, and drop the `chapterCopy` / `HOME` / `Chapter` imports. Widen `chapter` to
the structural shape above and record why:

```tsx
/**
 * **`chapter` is structural rather than `Chapter`, since 26 August 2026.**
 * This section now draws on three pages — `field-days` on the home page and
 * `03 · The Experience` on both property pages — and those spines have
 * different types (`Chapter` in `content/chapters.ts`, `PropertyChapter` in
 * `content/property-chapters.ts`). All this component ever reads is an id and
 * an optional number and label, so it asks for exactly that and both satisfy it.
 * Importing either concrete type here would tie a shared section to one page's
 * spine.
 */
chapter: { readonly id: string; readonly number?: string; readonly label?: string };
```

In `app/page.tsx`, pass them explicitly:

```tsx
case "experienceStrip":
  return (
    <ExperienceStrip
      key={chapter.id}
      chapter={chapter}
      surface={at.surface}
      copy={chapterCopy(chapter.id as ChapterCopyKey) as StripCopy}
      labels={HOME.strip}
    />
  );
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx && npm test && npm run build`
Expected: PASS.

- [ ] **Step 5: Prove the home page did not move**

```bash
npx next start -p 3100 &
node scripts/check_experience_strip.mjs --port 3100 --url /
node scripts/measure_density.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/density-home-3.json
```

Expected: **13/13 assertions pass**, and `field-days`' density **identical** to Task 3's figure. A pure
refactor that moves a density number has not been pure.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: ExperienceStrip takes its copy, so three pages can render it

It read chapterCopy(chapter.id) and HOME.strip directly — a home-page
component. The client wants this exact carousel on both property pages, so
the copy comes in as props and app/page.tsx passes the home page's.

`chapter` is now structural — an id and an optional number and label —
because the two spines have different types and all this component ever
reads is those three fields. Importing either concrete type would tie a
shared section to one page's spine.

Pure refactor, and proved so rather than asserted: check_experience_strip
13/13 on / and field-days' density identical to the commit before. A
refactor that moves a measured number was not one.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: The property spines — bands removed, map unheaded, chapters renumbered

**Files:**
- Modify: `content/mahua-vann.ts`, `content/mahua-tola.ts`
- Modify: `content/mahua-vann.test.ts`, `content/mahua-tola.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the new spines, which Tasks 6–8 render.

Content only. `PropertyShape` still has `"pair"` at the end of this task — Task 7 changes it.

- [ ] **Step 1: Write the failing tests**

Add to `content/mahua-vann.test.ts`:

```ts
it("has the client's 26 Aug spine — no table band, an unheaded map, renumbered chapters", () => {
  const ids = VANN_CHAPTERS.map((c) => c.id);
  expect(ids).toEqual([
    "vann-hero", "vann-forest", "vann-where", "vann-rooms", "vann-day", "vann-press", "vann-invitation",
  ]);
  const numbered = VANN_CHAPTERS.filter((c) => c.number).map((c) => `${c.number} ${c.label}`);
  expect(numbered).toEqual([
    "01 The Forest", "02 The Rooms", "03 The Experience", "04 Written About",
  ]);
});

it("gives the map no heading — it is an extension of 01, by the client's ruling", () => {
  const map = VANN_CHAPTERS.find((c) => c.id === "vann-where");
  expect(map?.number).toBeUndefined();
  expect(map?.label).toBeUndefined();
});

it("carries no full-bleed quote copy — the table band went on 26 Aug 2026", () => {
  expect(VANN_COPY.quoteCopy).toBeUndefined();
});
```

And to `content/mahua-tola.test.ts`, the same three shapes with:

```ts
expect(ids).toEqual([
  "tola-hero", "tola-reserve", "tola-where", "tola-rooms", "tola-day", "tola-press", "tola-invitation",
]);
expect(numbered).toEqual([
  "01 The Reserve", "02 The Rooms", "03 The Experience", "04 Written About",
]);
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run content/mahua-vann.test.ts content/mahua-tola.test.ts`
Expected: FAIL on all six.

- [ ] **Step 3: Edit the spines**

**`content/mahua-vann.ts`** — delete the `vann-table` chapter; strip `number`/`label` from `vann-where`;
renumber `vann-rooms` to `02`, `vann-day` to `03 · The Experience`, `vann-press` to `04`. Delete the whole
`quoteCopy` block.

**`content/mahua-tola.ts`** — delete `tola-guest-word` **and** `tola-table`; strip `number`/`label` from
`tola-where`; renumber `tola-rooms` to `02`, `tola-day` to `03 · The Experience`. Delete the whole
`quoteCopy` block. `tola-press` does not exist yet — **Task 8 adds it**, so this task's Tola id assertion
will still fail on the last two entries. **Split the Tola test:** assert ids up to `tola-day` here and add
`tola-press` in Task 8.

Leave this at each removal site, adapted to the chapter:

```ts
/*
 * **`vann-table` ("04 · The Table") was here until 26 August 2026.** Client:
 * *"Remove the section that comes just above 05-The Day that has a wide image
 * and text in the center"*, naming its copy — "Chulai ki bhaaji, Mahua kheer
 * and…".
 *
 * `lawn-picnic-golden-hour` is released and is now curated-but-unused. **It is
 * not to be parked in another chapter to keep a density figure up** —
 * `measure_density.mjs` scores what is painted, and a chapter that needs
 * imagery needs a composition. See `docs/DECISIONS.md` §22.
 */
```

And at the map:

```ts
/*
 * **No `number` and no `label` since 26 August 2026.** Client: *"the map is an
 * extention to the first sections on both the pages 01-The Forest and 01-The
 * Reserve respectively."*
 *
 * "Extension of" has a defined meaning on this site — the client's own 19 Aug
 * ruling on `04 · Mahua Philosophy` — and it is two things, not one: the same
 * cream, and no band of cream between. Dropping the heading is this half;
 * `PropertyPage.tsx`'s `continues` is the other. Both are needed or the map
 * reads as an unlabelled orphan rather than as part of 01.
 */
```

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run content/mahua-vann.test.ts content/mahua-tola.test.ts`
Expected: Vann PASS; Tola PASS with the split assertion.

- [ ] **Step 5: Run the whole suite — the structural rules are the real gate**

Run: `npm test`
Expected: green, **including** `content/property-chapters.test.ts`'s `findRepeatedShape` and the rhythm
rule. The new spine is `fullBleed → column → map → showcase → pair → press → invitation`; no two adjacent
share a shape. **If the rhythm test fails, do not weaken it** — it is non-negotiable #10, and the answer is
the composition, not the assertion.

- [ ] **Step 6: Measure the holes — before and after, and this matters**

```bash
git stash && npm run build && npx next start -p 3100 &
node scripts/measure_density.mjs --port 3100 --url /mahua-vann --out docs/reviews/2026-08-26-restructure/density-vann-before.json
node scripts/measure_density.mjs --port 3100 --url /mahua-tola --out docs/reviews/2026-08-26-restructure/density-tola-before.json
# then unstash, rebuild, and repeat into -after.json
```

**Both files are required.** `vann-press` measured **88.4%** empty and `tola-reserve` was already over the
ceiling before any of this (`DECISIONS.md` §5). Without the before-figures this change gets blamed for a
pre-existing failure, or hides behind one. Task 8 puts the widget under `vann-press`, which should improve
that 88.4% substantially — the before-figure is what proves it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: the property spines, restructured to the client's 26 Aug rulings

Three full-bleed quote bands removed — Vann's table band, and both of
Tola's. The map loses its heading on both pages because he called it "an
extention to the first sections". Rooms 03→02, The Day 05→03 and renamed
The Experience, Written About 06→04.

Three photographs are released and are now curated-but-unused. They are
not to be parked in another chapter to hold a density figure up:
measure_density scores what is painted, and a chapter that needs imagery
needs a composition.

Density measured on both routes at the commit before as well as after,
because vann-press was already 88.4% empty and tola-reserve already over
the ceiling. Without the before-figures this change gets blamed for a
failure that predates it — or hides behind one.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The map continues 01 — same cream, no band between

**Files:**
- Modify: `components/property/PropertyPage.tsx`
- Modify: `components/sections/PropertyMap.tsx`
- Modify: `components/property/PropertyPage.test.tsx` (create if absent)

**Interfaces:**
- Consumes: the unheaded map chapters from Task 5.
- Produces: `PropertyMap` accepting `continues?: boolean`.

**The pattern already exists** — `app/page.tsx`'s `positions()` and `PinnedCollage`'s `continues`. Copy its
mechanism, and copy its **knock-on**: a continuing chapter takes the surface above it and **does not
advance the cream counter**, or every cream chapter below it flips.

- [ ] **Step 1: Write the failing test**

```tsx
it("stands the map on the same cream as the chapter above, and does not advance the alternation", () => {
  const { container } = render(<PropertyPage chapters={VANN_CHAPTERS} copy={VANN_COPY} {...props} />);
  const forest = container.querySelector("#vann-forest");
  const map = container.querySelector("#vann-where");
  const rooms = container.querySelector("#vann-rooms");
  // The map continues the chapter above it…
  expect(map?.getAttribute("data-surface")).toBe(forest?.getAttribute("data-surface"));
  // …and the chapter below still steps off it, which it would not if the
  // continuing chapter had consumed a turn of the cycle.
  expect(rooms?.getAttribute("data-surface")).not.toBe(map?.getAttribute("data-surface"));
});
```

This needs `ChapterSurface` to expose `data-surface`. Add it there if absent — it is a testing seam, and
the alternative is asserting on a Tailwind class name, which is brittle.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/property/PropertyPage.test.tsx`
Expected: FAIL — the map takes the next surface in the cycle, not the one above.

- [ ] **Step 3: Implement `continues` in the dispatcher**

Replace the single-expression surface calculation with a pre-pass, mirroring `app/page.tsx`'s own
`positions()` and its comment about why an expression inside `map`'s argument list cannot look backwards:

```tsx
/**
 * Every chapter's cream, worked out in one pass before anything renders.
 *
 * It was `cream++ % 2 === 1` inline until 26 August 2026, which was fine while
 * every surface depended only on the chapters above — but a **continuing**
 * chapter takes the surface the one above it already has, and an expression
 * evaluated inside `map`'s own argument list cannot look backwards at what it
 * decided last time round. `app/page.tsx` learned exactly this on 19 Aug.
 *
 * **A continuing chapter does not advance the cycle**, so everything beneath the
 * pair alternates as though the two were one chapter — which is what they are
 * meant to look like.
 */
function surfaces(chapters: readonly PropertyChapter[]): readonly { surface: boolean; continues: boolean }[] {
  let cream = 0;
  let last = false;
  return chapters.map((chapter, i) => {
    // The map is an extension of the chapter above it — the client's ruling,
    // 26 Aug 2026. It is identified by having no heading of its own rather than
    // by id, so a second unheaded shape inherits the behaviour for free.
    const continues =
      chapter.shape === "map" && !chapter.number && CREAM_SHAPES.includes(chapters[i - 1]?.shape);
    const surface = CREAM_SHAPES.includes(chapter.shape) ? (continues ? last : cream++ % 2 === 1) : false;
    if (CREAM_SHAPES.includes(chapter.shape)) last = surface;
    return { surface, continues };
  });
}
```

Pass `continues` to `PropertyMap`, which uses it to drop its own top padding so the two chapters meet with
no cream between — the same thing `PinnedCollage` does.

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run components/property/PropertyPage.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 5: Look at it, at four widths**

Run: `node scripts/capture_property_pages.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/shots-map/`

**Open them.** The question a rig cannot answer: does the map now read as part of `01 · The Forest`, or as
a section that lost its heading? If the latter, the join needs work, not the padding.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: the map is an extension of 01, in the sense this site already means it

The client said the map "is an extention to the first sections". That
phrase has a defined meaning here — his own 19 Aug ruling on Mahua
Philosophy — and it is two things: the same cream, and no band of cream
between. Task 5 dropped the heading; this is the other half.

The surface calculation becomes a pre-pass for the same reason app/page.tsx
made that change on 19 Aug: a continuing chapter takes the surface the one
above already has, and an expression inside map()'s argument list cannot
look backwards at what it decided last time. A continuing chapter also does
not advance the cycle, or every cream chapter below it flips.

Identified by having no heading rather than by id, so the next unheaded
shape inherits it for free.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: The home page's carousel, on both property pages

**Files:**
- Modify: `content/property-chapters.ts` — `"pair"` → `"strip"`
- Modify: `components/property/PropertyPage.tsx`
- Modify: `content/mahua-vann.ts`, `content/mahua-tola.ts` — `shape` and `stripCopy`
- Delete: `components/sections/ExperiencePair.tsx`, `components/sections/ExperiencePair.test.tsx`
- Modify: `lib/sizes.test.ts` — the `ExperiencePair` box cases go with it

**Interfaces:**
- Consumes: `ExperienceStrip` with `copy`/`labels` props (Task 4).
- Produces: `PropertyShape` containing `"strip"` and not `"pair"`.

**Cards only — each property keeps its own heading and intro.** The client chose this over copying the
whole section: Vann's intro names Turia Gate, Kohka Lake and the Pachdhar potters' wheel, and three pages
opening on identical sentences is the *"very wordpress and templaty"* verdict that began the property
redesign.

**⚠ The trap this task exists to avoid.** `CARD_SCRIM`'s six figures are solved **per photograph at a
specific card size**. `ExperienceStrip.tsx`'s own comment records the same pair measuring **4.64:1 on a
300px card and 7.33:1 on a 340px one**, and one card failing at **3.30:1** because a 23px-narrower card
wrapped a sentence and moved a line of type 24px. **Render these cards at the same size as the home page's,
then verify anyway.**

- [ ] **Step 1: Write the failing test**

```ts
// content/mahua-vann.test.ts
it("runs the home page's card strip at 03 · The Experience, not the old pair", () => {
  const day = VANN_CHAPTERS.find((c) => c.id === "vann-day");
  expect(day?.shape).toBe("strip");
  expect(VANN_COPY.pairCopy).toBeUndefined();
  expect(VANN_COPY.stripCopy?.["vann-day"].experiences).toHaveLength(6);
});

it("keeps its own words above the strip — the client's ruling, cards only", () => {
  expect(VANN_COPY.stripCopy?.["vann-day"].heading.text).toBe("The day at Vann");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run content/mahua-vann.test.ts`
Expected: FAIL — `shape` is `"pair"`.

- [ ] **Step 3: Rename the shape and route it**

In `content/property-chapters.ts`, replace `"pair"` with `"strip"` in `PropertyShape` and in
`PROPERTY_IMAGE_LED_SHAPES`, with:

```ts
/*
 * **`"pair"` until 26 August 2026.** The client replaced both property pages'
 * activity sections with the home page's own card strip. `ExperiencePair` is
 * deleted rather than left unrouted — a shape in this union that nothing renders
 * is a shape the next reader will believe in.
 */
```

In `PropertyPage.tsx`, replace the `case "pair"` arm:

```tsx
case "strip": {
  const stripCopy = copy.stripCopy?.[chapter.id];
  if (!stripCopy) throw new Error(`No strip copy for "${chapter.id}"`);
  return (
    <ExperienceStrip
      key={chapter.id}
      chapter={chapter}
      copy={stripCopy}
      labels={STRIP_LABELS}
      surface={surface}
    />
  );
}
```

`STRIP_LABELS` are the three interface strings (`region`, `hint`, `jump`). They live in `content/site.ts`
because they are now shared by three pages, and `content/home.ts`'s `HOME.strip` reads them from there —
**one string, one place**, which is the rule that keeps the lodge names from being written twice.

In both content files: change `shape` to `"strip"`, rename `pairCopy` to `stripCopy`, keep each page's own
`heading` and `intro`, and replace the `experiences` array with the home page's six. Import them rather
than copying the literal:

```ts
/*
 * **The home page's six activities, imported rather than copied.** Client,
 * 26 Aug 2026: *"replace it with the exact same copy-pasted activities carousel
 * from our homepage … for now just place the entire carousel as it is."*
 *
 * An import rather than a paste because "the activities will be changed later"
 * — and when they are, three copies would drift. The day they are meant to
 * differ per property, this becomes three arrays on purpose rather than by
 * accident.
 *
 * Note `alsoLine` does NOT come across. It was `ExperiencePair`'s honest
 * one-line naming of karaoke and the conference hall (client's ruling, 9 Aug),
 * and the strip has no slot for it. **That copy is not deleted from the
 * repository without the client being told** — see `docs/DECISIONS.md` §22.
 */
import { HOME_EXPERIENCES } from "@/content/home";
```

**`alsoLine` was raised with the client and he ruled: dropped for now, revisited later.** 26 Aug 2026,
having been told the strip has no slot for it and that it encodes his own 9 Aug decision to name karaoke,
the conference hall and the indoor games plainly rather than promote or hide them. His reasoning: the
activities themselves change later, so where that line lives is a question for that work.

**It is therefore a deferred item, not a deletion.** Keep the two strings in `content/mahua-vann.ts` and
`content/mahua-tola.ts`, commented out at their own sites with the ruling and its date, so the words are
not lost and the next session finds them where they belong. Record it in `docs/DECISIONS.md` §22 and in
`docs/PROJECT-STATE.md`'s owed list. **Do not `git rm` the copy** — a decision to revisit is not a decision
to discard, and this project has an explicit rule that a rejected item is either deleted *with its
reasoning* or kept where the next reader will find it.

- [ ] **Step 4: Delete the pair and run the suite**

```bash
git rm components/sections/ExperiencePair.tsx components/sections/ExperiencePair.test.tsx
```

Remove `EXPERIENCE_SIZES` / `EXPERIENCE_BOXES` from `lib/sizes.test.ts`'s parameterised cases.

Run: `npm test && npm run build && npm run lint`
Expected: green. **Record the test-count change and explain it** — the `ExperiencePair` cases going is
expected, exactly as `SplitFeature`'s 13 were.

- [ ] **Step 5: Verify the scrims on all three routes — the point of the task**

```bash
npx next start -p 3100 &
node scripts/check_contrast_over_photos.mjs --port 3100 --url /
node scripts/check_contrast_over_photos.mjs --port 3100 --url /mahua-vann
node scripts/check_contrast_over_photos.mjs --port 3100 --url /mahua-tola
node scripts/check_experience_strip.mjs --port 3100 --url /mahua-vann
node scripts/check_experience_strip.mjs --port 3100 --url /mahua-tola
node scripts/check_image_resolution.mjs --port 3100
```

**Every card, every width from 360, all three routes.** Floors: 4.5:1. If any card is under, the card size
differs from the home page's — **fix the size first**; re-solving a scrim to paper over a size difference
darkens a photograph for the wrong reason. `check_experience_strip.mjs` must be **13/13 on both property
routes**, including assertion 7 (that `scroll-snap` has not returned) and assertion 13 (the hover zoom) —
note assertion 13 may legitimately not apply off the home page, since `data-hover-zoom` is on
`app/page.tsx` alone by client ruling. **If it fails there, that is expected and the rig needs a route
guard, not the page a new attribute.**

- [ ] **Step 6: Density on both routes**

Run: `node scripts/measure_density.mjs --port 3100 --url /mahua-vann` and `--url /mahua-tola`.
Compare `vann-day` / `tola-day` against Task 5's after-figures.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: the home page's card strip is now 03 · The Experience on both lodges

Client: "replace it with the exact same copy-pasted activities carousel
from our homepage … for now just place the entire carousel as it is."

Cards only — each property keeps its own heading and intro, which he chose
when asked. Vann's names Turia Gate, Kohka Lake and the Pachdhar potters'
wheel; three pages opening on identical sentences is the "very wordpress
and templaty" verdict that started this redesign.

The six activities are IMPORTED, not pasted. He says they change later, and
three copies would drift.

The scrims were the risk and they were verified rather than trusted. The
same figures measure 4.64:1 on a 300px card and 7.33:1 on a 340px one, and
one card once failed at 3.30 because 23px of card width wrapped a sentence
and moved a line of type 24px. Same card size on all three routes, then
check_contrast_over_photos on all three anyway, every width from 360.

alsoLine does not survive the move — the strip has no slot for the honest
one-line naming of karaoke and the conference hall. Raised with the client
rather than quietly dropped. DECISIONS.md §22.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Written About on both pages, with the widget

**Files:**
- Modify: `components/sections/PressBand.tsx` — `articles` optional, `children` slot
- Modify: `components/sections/PressBand.test.tsx` (create if absent)
- Modify: `components/property/PropertyPage.tsx` — pass the widget
- Modify: `content/mahua-tola.ts` — a new `tola-press` chapter
- Modify: `content/mahua-tola.test.ts` — restore the full id assertion from Task 5

**Interfaces:**
- Consumes: `<ReviewWidget>` (Task 1), `PressBand`.
- Produces: `PressBandCopy` with `articles?: readonly PressArticleCopy[]`.

**"Written About" on both, by the client's own choice.** He was told that Tola has no press mentions and
that the section was deliberately left off that page because inventing three would be fabrication
(`content/mahua-tola.ts` line 15 records exactly that), and he was offered a rename covering press and
reviews together. **He chose to keep the name.** So Tola's `04 · Written About` is a heading over guest
reviews and nothing else — loose, defensible, and a ruling rather than an oversight.

- [ ] **Step 1: Write the failing test**

```tsx
// components/sections/PressBand.test.tsx
it("renders with no articles at all — Mahua Tola has no press mentions", () => {
  const { getByText, container } = render(
    <PressBand
      chapter={{ id: "tola-press", number: "04", label: "Written About", shape: "press", media: [] }}
      copy={{ heading: { text: "Written about", dim: "about" } }}
    >
      <div data-testid="widget" />
    </PressBand>,
  );
  expect(getByText("Written about")).toBeTruthy();
  expect(container.querySelector("[data-testid=widget]")).not.toBeNull();
  expect(container.querySelector("article")).toBeNull();
});

it("still renders three articles where a property has them", () => {
  const { container } = render(
    <PressBand chapter={vannPressChapter} copy={VANN_COPY.pressCopy!["vann-press"]} />,
  );
  expect(container.querySelectorAll("article")).toHaveLength(3);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/PressBand.test.tsx`
Expected: FAIL — `articles` is required and `children` is not a prop.

- [ ] **Step 3: Make articles optional and add the slot**

```ts
export type PressBandCopy = {
  readonly heading: TwoTone;
  /**
   * **Optional since 26 August 2026, and the reason is a real asymmetry rather
   * than a convenience.** Mahua Vann has three press mentions and Mahua Tola has
   * none — `content/mahua-tola.ts` records that the section was left off that
   * page rather than filled with three invented ones (non-negotiable: do not
   * invent facts).
   *
   * The client asked for the section on both pages anyway, carrying his reviews
   * widget, and chose to keep the heading "Written About" on both when offered
   * a rename. So a band with no articles is a supported state, not a broken one.
   */
  readonly articles?: readonly PressArticleCopy[];
};
```

Render the article grid only when `articles?.length`, and render `{children}` beneath it in both cases.

In `PropertyPage.tsx`'s `case "press"`:

```tsx
return (
  <PressBand key={chapter.id} chapter={chapter} copy={pressCopy} surface={surface}>
    <ReviewWidget label={pressCopy.heading.text} fallback={copy.reviewsFallback} />
  </PressBand>
);
```

- [ ] **Step 4: Add Tola's chapter**

In `content/mahua-tola.ts`, add `tola-press` between `tola-day` and `tola-invitation`:

```ts
{
  /*
   * **New on 26 August 2026, and it exists to carry the reviews widget.**
   * Client: *"I just saw that you have not created a 'Written About' section
   * for Mahua Tola, do that and simply copy paste the widget as you'll be doing
   * for the Mahua Vann page."*
   *
   * **It has no articles, and that is not an omission.** There are no press
   * mentions of Mahua Tola; the section was deliberately left off this page for
   * that reason (see the note at the head of this file), and three invented ones
   * are what non-negotiable "verify hard numbers, do not trust the sources"
   * forbids. He was offered a heading covering press and reviews together and
   * chose to keep "Written About" on both pages. Recorded as a ruling.
   */
  id: "tola-press",
  number: "04",
  label: "Written About",
  shape: "press",
  media: [],
},
```

and `pressCopy: { "tola-press": { heading: { text: "Written about", dim: "about" } } }`.

Restore the full id assertion in `content/mahua-tola.test.ts` from Task 5.

- [ ] **Step 5: Run it and watch it pass**

Run: `npx vitest run && npm run build && npm run lint`
Expected: green, **including** `findRepeatedShape` — the Tola spine is now
`fullBleed → column → map → showcase → strip → press → invitation`, no two adjacent alike, and the rhythm
rule holds because `press` is type-led and `invitation` carries the sister lodge's photograph.

- [ ] **Step 6: Measure — and `vann-press` is the number to watch**

```bash
npx next start -p 3100 &
node scripts/measure_density.mjs --port 3100 --url /mahua-vann --out docs/reviews/2026-08-26-restructure/density-vann-final.json
node scripts/measure_density.mjs --port 3100 --url /mahua-tola --out docs/reviews/2026-08-26-restructure/density-tola-final.json
node scripts/check_contrast_over_photos.mjs --port 3100 --url /mahua-vann
node scripts/check_contrast_over_photos.mjs --port 3100 --url /mahua-tola
```

`vann-press` measured **88.4%** empty — the emptiest chapter on either page, and a known open item in
`DECISIONS.md` §5. A widget full of review cards under it should move that substantially. **Report the
figure either way**: if it does not improve, the section needs recomposing, and if it does, §5 has an item
to close.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Written About on both lodges, carrying the client's reviews widget

Vann renumbered 06→04 and keeps its three articles, with the widget below
them. Tola gets the section for the first time, with the widget and no
articles.

Articles are optional now, and that is a real asymmetry rather than a
convenience: there are no press mentions of Mahua Tola, which is exactly
why the section was left off that page — three invented ones are what this
project's own rule against trusting sources forbids. Offered a heading
covering press and reviews together, the client chose to keep "Written
About" on both. A ruling, not an oversight.

vann-press was the emptiest chapter on either page at 88.4% and an open
item in DECISIONS.md §5. Measured again with the widget under it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Whole-branch verification, and the record

**Files:**
- Create: `docs/reviews/2026-08-26-restructure/README.md`
- Modify: `CLAUDE.md`, `docs/DECISIONS.md` (new §22), `docs/PROJECT-STATE.md`
- Modify: `scripts/check_films.mjs` — a route/branch note, **not** a weakened assertion

**On this project the documentation is a task, not an afterthought** — `node scripts/check_docs.mjs` exists
because it was asked for three times.

- [ ] **Step 1: Run every rig, on all three routes, against one production build**

```bash
npm run build && npx next start -p 3100 &
node scripts/measure_density.mjs --port 3100                      # and --url /mahua-vann, /mahua-tola
node scripts/check_contrast_over_photos.mjs --port 3100           # all three routes
node scripts/check_image_resolution.mjs --port 3100
node scripts/check_experience_strip.mjs --port 3100               # all three routes
node scripts/check_plates.mjs --port 3100
node scripts/check_card_stack.mjs --port 3100
node scripts/check_room_gallery.mjs --port 3100
node scripts/check_menu.mjs --port 3100
node scripts/check_header.mjs --port 3100
node scripts/check_rule_in.mjs --port 3100
node scripts/measure_page.mjs --port 3100
node scripts/measure_lcp_arms.mjs --runs 5 --port 3100
npm run verify:budget
```

**`measure_lcp_arms.mjs` defaults to port 3210** — omitting `--port` fails on a connection refused that
looks like a broken rig.

- [ ] **Step 2: Screenshot all three routes at four widths and read them**

```bash
node scripts/capture_chapters.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/shots/
node scripts/capture_property_pages.mjs --port 3100 --out docs/reviews/2026-08-26-restructure/shots/
```

**Open the 390px frames.** This project's own record is that its two worst defects were found by a human
reading a picture — a park map whose labels rendered at 4.3px survived fifteen task reviews and a
whole-branch verification because every rig measures at 1440.

- [ ] **Step 3: Handle `check_films.mjs` honestly**

It asserts two films. The potter left on 19 Aug; the tiger left in Task 3. **Do not weaken the assertion to
zero and do not delete the rig.** Add a header comment saying the branch has no film mounted by client
ruling, that the failure is expected here and that the rig still describes `feat/image-sizing`, and record
the same in `CLAUDE.md`'s Tests row and `DECISIONS.md` §22.

- [ ] **Step 4: Write the evidence README**

`docs/reviews/2026-08-26-restructure/README.md` — every figure above, before and after, with the command
that produced it. **Every committed number must be re-derivable by one command.** Include: the widget's
budget delta, whether it auto-scrolls, the cream screenshot judgement, all three routes' density before and
after, the six card scrims on all three routes, and the test-count changes with their explanations.

- [ ] **Step 5: Update `CLAUDE.md`, `DECISIONS.md` §22, `PROJECT-STATE.md`**

`DECISIONS.md` §22 must carry: the eleven rulings verbatim; the tiger unmount and `check_films.mjs`'s
expected failure; the widget superseding `REVIEWS.mode` **and** non-negotiable #5's dated exception; the
three released photographs and the instruction not to park them; `alsoLine`'s loss; "Written About" on Tola
as a ruling; and the map's `continues`.

`CLAUDE.md`'s branch table, Status, Tests and Evidence rows all change. **Non-negotiable #5's exception
paragraph must be rewritten**, not left describing a carousel that no longer exists.

- [ ] **Step 6: Prove the documents match the repository**

Run: `node scripts/check_docs.mjs`
Expected: PASS. It reads files and needs no build or server.

- [ ] **Step 7: Final gate**

Run: `npm test && npm run build && npm run lint && npm run verify:budget`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: the restructure, verified end to end — and what it retired

Every rig re-run on all three routes against one production build, every
figure in docs/reviews/2026-08-26-restructure/ with the command that
produced it, and the 390px frames opened and read by eye — this project's
two worst defects were both found that way, not by a rig.

DECISIONS.md §22 carries the eleven rulings and four things that will
otherwise be misread later: check_films.mjs fails on this branch because
there is no film left to check and that is the ruling; the widget
supersedes REVIEWS.mode AND non-negotiable #5's dated exception, so
nothing on this site moves forever any more; three released photographs
are not to be parked in another chapter to hold a density figure up; and
alsoLine did not survive the strip.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review

**Spec coverage.** §2.1 → Task 3. §2.2 → Tasks 1, 2. §2.3 → Task 2 Steps 9–10, Task 9. §3.1 → Task 5.
§3.2 → Tasks 5, 6. §3.3 → Tasks 5, 8. §3.4 → Tasks 4, 7. §3.5 → Task 8. §3.6 → **deliberately out of
scope**, by the client. §4 → Tasks 2, 3, 7. §5 → Task 9. §6 → mitigations in Tasks 2, 7, 5, 9 respectively.
§7 → Task 9 Step 7. §8 → the two owed items appear as Task 2's `fallback` note and Task 2 Step 9 #4.

**Type consistency.** `StripCopy` and `StripLabels` are defined in Task 4 and consumed in Task 7 under the
same names. `PressBandCopy.articles` becomes optional in Task 8 and nothing before it constructs a
`PressBandCopy`. `elfsightClass` / `REVIEWS_APP_ID` / `ELFSIGHT_SCRIPT` are defined in Task 1 and used in
Tasks 2 and 8. `stripCopy` replaces `pairCopy` in Task 7 in the content files, the dispatcher and the
tests together.

**Two things a reviewer should push back on if they are done differently.**
`ExperienceStrip`'s widened measures (Task 3) are a judgement dressed as a number — 62ch is at the top of
the comfortable range and the screenshot step is the real gate. And Task 7's `STRIP_LABELS` move to
`content/site.ts` is a small architectural change riding along inside a feature task; it is there because
three pages now need the same three strings, and writing them twice is the defect `content/site.ts` exists
to prevent.

---

## Execution

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — tasks executed in this session with checkpoints for review.
