# Mobile, tablet and zoom — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Make every touch target reachable, stop the park map's labels colliding on a phone, and put an
asserting rig behind all of it — without changing one visible pixel of the design at any width.

**Architecture:** One CSS mechanism (an invisible hit-area extension scoped to coarse pointers) covers
almost every finding, so this is mostly a rig plus a utility class plus one bug fix in the map's existing
declutter pass. Nothing is redesigned; §3 of the spec lists what measures sound and must not be touched.

**Tech Stack:** Next.js 16.2.12 (App Router, React 19.2.4), TypeScript, Tailwind v4, Vitest, Playwright for
the rigs in `scripts/`.

**Spec:** [`docs/superpowers/specs/2026-08-27-mobile-tablet-and-zoom-design.md`](../specs/2026-08-27-mobile-tablet-and-zoom-design.md)

---

## Global Constraints

Every task's requirements implicitly include all of these.

- **Branch is `feat/journal-and-mobile`.** Never commit to `feat/home-v2`, `demo` or `main`.
- **The visible design must not change at any width.** This is the client's explicit ruling of 27 Aug:
  buttons keep their exact look, the hit area grows invisibly. A screenshot diff that shows a moved pixel
  is a failed task, not a judgement call.
- **Measure a production build**, never `next dev`. The spec's §2 exists because three false findings came
  from a dev server — one of them was Next.js's own dev-mode indicator read as a layout collision.
- **A viewport screenshot at a real scroll position** is the evidence. An element screenshot of a
  `position: sticky` container is not what a visitor sees, and one frame of a scroll-driven effect proves
  nothing.
- No user-facing string in a component; all copy lives in `content/`.
- No hard-coded colour or duration in a component — `lib/palette.ts` and `lib/motion.ts` are the dials.
- British spelling in all prose. **Invent no copy.**
- `npm test`, `npm run build`, `npm run lint` green before any commit. Suite is **497**.
- `npm run verify:budget` must still PASS — currently 167.2 KB brotli. This work adds **no JavaScript**.
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

**Thresholds, exact:**
- WCAG 2.5.8 (AA) minimum target: **24×24 CSS px**. This is the standard; failing it is a defect.
- Apple/Google comfort guidance: **44×44 CSS px**. This is a target, not a compliance floor.
- Shapes: **360×800, 390×844, 430×932, 768×1024, 1024×1366**, landscape phone **844×390**, browser-zoom
  **960×600** (≈150%) and **720×450** (≈200%).

**`lib/media.test.ts` is a known intermittent timeout** — it decodes ~200 images and fails on a cold disk
cache, as a TIMEOUT never an assertion. Re-run before believing it.

**Rig gotchas already paid for on this branch:** every rig here takes `--url` as a **whole base URL
replacement**, not a path (`--url http://localhost:3100/mahua-vann`). `measure_lcp_arms.mjs` defaults to
port 3210. Run precision-sensitive rigs **one at a time** — concurrent runs produced spurious failures
during the 26 Aug sweep.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `scripts/check_responsive.mjs` | The asserting rig: overflow, target size, type floor, hit-area overlap, zoom policy, OS text scaling |
| `docs/reviews/2026-08-27-mobile/` | Every measured figure this plan produces |

**Modified**

| File | Change |
|---|---|
| `app/globals.css` | The `.tap` hit-area utility, scoped to coarse pointers |
| `components/ui/SiteHeader.tsx` | `.tap` on the menu button and the CTA pill |
| `components/property/PropertyBar.tsx` | `.tap` on the bar's own links |
| `components/sections/ExperienceStrip.tsx` | `.tap` on the six pager links |
| `components/ui/SiteFooter.tsx` | `.tap` on the directory links |
| `components/sections/PropertyMap.tsx` | `declutterMobile` gains the lodge marker |
| `components/sections/PropertyMap.test.tsx` | Its tests |
| `CLAUDE.md`, `docs/DECISIONS.md`, `docs/PROJECT-STATE.md` | The record — Task 6 |

**Deliberately untouched** — §3 of the spec: the rooms card stack, every page composition, the breakpoint
system, `content/*`, and the closing CTA (the client's item 4f, sequenced last and not part of this work).

---

## Task order, and why

**The rig is first and it is not negotiable.** Its baseline is what proves every later task changed what it
claims and nothing else. Build it after the fixes and it can only confirm the end state, never attribute a
change — which is exactly how a +63-byte regression went unexplained on this repo for a week.

---

### Task 1: The responsive rig, and its baseline

**Files:**
- Create: `scripts/check_responsive.mjs`
- Create: `docs/reviews/2026-08-27-mobile/baseline.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `node scripts/check_responsive.mjs --port 3100 [--url <base>] [--out <path>]`, exiting non-zero
  on any failure. Later tasks re-run it and diff against the baseline.

**What it asserts, per route per shape:**

1. **No horizontal overflow** — `document.documentElement.scrollWidth - clientWidth === 0`.
2. **Target size** — every `a[href]`, `button`, `[role=button]`, `summary`, `input` with a non-zero box has
   an effective hit area (its own box **or** its `::after` extension) of at least **24×24**. Report every
   target under **44×44** separately as a warning count, not a failure.
3. **No overlapping hit areas** — no two effective hit rectangles intersect. **This is the assertion that
   stops Task 2 breaking things**: extending targets is exactly how you turn six neighbouring links into
   one ambiguous blob.
4. **Type floor** — record the smallest rendered font size per route and fail if it drops **below the
   baseline recorded by this task**. Not an absolute floor: the client has ruled that the site's small
   tracked capitals stay (spec §4.4).
5. **Zoom policy** — no `maximum-scale` or `user-scalable=no` in the document's viewport meta.
6. **OS text scaling** — at 1.5× and 2× text scale, no element's `scrollHeight` exceeds its `clientHeight`
   where `overflow` is `hidden` or `clip`, and no two text blocks' rectangles intersect.

**How to simulate OS text scaling in Playwright:** there is no device-emulation switch for it. Inject
`document.documentElement.style.fontSize = "150%"` — which scales every `rem`-based size — **and** record
how many elements use `px` font sizes that will therefore *not* scale. That count is itself a finding: a
`px` font size is one that ignores a visitor's accessibility setting.

- [ ] **Step 1: Write the rig**

Follow the house shape of `scripts/check_experience_strip.mjs`: a `flag()` helper, `PORT`/`BASE` constants,
a `SHAPES` array with the reasoning for each in a comment, a per-assertion failure list, a JSON `--out`,
and a non-zero exit on failure. Read that file first and match it.

```js
const SHAPES = [
  // The three phone widths that matter: 360 is the narrowest Android in real
  // use and is the width that caught `strip · card 02` at 3.30:1 in August;
  // 390 is the iPhone reference this project's other rigs already use; 430 is
  // the current large iPhone.
  { name: "phone-360", w: 360, h: 800, dpr: 3, mobile: true },
  { name: "phone-390", w: 390, h: 844, dpr: 3, mobile: true },
  { name: "phone-430", w: 430, h: 932, dpr: 3, mobile: true },
  // A phone held sideways. `pocket:` and `roomy:` exist in this project's
  // Tailwind config for exactly this shape (CLAUDE.md) and no rig has ever
  // exercised them.
  { name: "phone-landscape", w: 844, h: 390, dpr: 3, mobile: true },
  { name: "tablet-768", w: 768, h: 1024, dpr: 2, mobile: true },
  // 1024 is where the property routes' small-type count rose to 60-70 against
  // 39-46 at 768 (spec §5) — unexplained, and this rig is what will explain it.
  { name: "tablet-1024", w: 1024, h: 1366, dpr: 2, mobile: true },
  // Browser zoom on a 1440 laptop is a narrower LAYOUT viewport at desktop
  // DPR — not a device. 150% of 1440 is 960; 200% is 720. This site shipped
  // plates 230% too wide at 150% zoom once (DECISIONS.md §2 #44-45) because
  // `short:` was used to size geometry; nothing has watched it since.
  { name: "zoom-150", w: 960, h: 600, dpr: 1, mobile: false },
  { name: "zoom-200", w: 720, h: 450, dpr: 1, mobile: false },
];
```

The effective hit area of an element, accounting for a `::after` extension:

```js
const effectiveHitBox = (el) => {
  const r = el.getBoundingClientRect();
  const after = getComputedStyle(el, "::after");
  if (after.content === "none" || after.position !== "absolute") {
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }
  const w = Math.max(r.width, parseFloat(after.width) || 0);
  const h = Math.max(r.height, parseFloat(after.height) || 0);
  return { x: r.x + (r.width - w) / 2, y: r.y + (r.height - h) / 2, w, h };
};
```

- [ ] **Step 2: Watch every assertion fail**

**Do not skip this.** A rig that has never failed has proved nothing — this project's standing rule, and
the reason the map's 4.3px labels survived fifteen reviews. For each of the six assertions, break it
deliberately in a scratch edit, run the rig, confirm it fails naming the right thing, and revert.

Assertion 3 (overlap) is the one to break most carefully: give two adjacent pager links a 60px hit area and
confirm the rig names *that pair*, not a count.

Record what you did and what each failure message said, in the report.

- [ ] **Step 3: Run it clean and commit the baseline**

```bash
npm run build
npx next start -p 3100 &
node scripts/check_responsive.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/baseline.json
```

Expected against today's build: assertion 1 passes everywhere; assertion 2 **fails** on the six pager links
(13×15, under the 24px AA floor); assertion 3 passes; assertion 4 establishes the floor; assertion 5 passes;
assertion 6 is unknown and is a finding either way.

**The rig will exit non-zero. That is correct** — it is describing real defects that Tasks 2–4 fix. Commit
the baseline anyway; it is the before-figure.

- [ ] **Step 4: Commit**

```bash
git add scripts/check_responsive.mjs docs/reviews/2026-08-27-mobile/baseline.json
git commit -m "$(cat <<'EOF'
test: a rig that looks at phones, tablets and zoom — and fails today

Every measuring script on this project checks 1440. That is how a park map
shipped with 4.3px labels through fifteen task reviews: no instrument was
pointed at a phone.

Six assertions over eight shapes and three routes — overflow, target size
against WCAG 2.5.8's 24px, overlapping hit areas, a per-route type floor,
the zoom policy, and OS text scaling. Each was watched failing on a
deliberate break before being believed.

It exits non-zero today, on the six carousel pager links at 13x15. That is
the rig describing a real defect, not a broken rig. The baseline is
committed as the before-figure.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: The invisible hit area

**Files:**
- Modify: `app/globals.css`
- Modify: `components/ui/SiteHeader.tsx`, `components/property/PropertyBar.tsx`,
  `components/ui/SiteFooter.tsx`

**Interfaces:**
- Consumes: `check_responsive.mjs` (Task 1).
- Produces: a `.tap` class. Later tasks apply it.

**The client's ruling, 27 August 2026, verbatim in effect:** buttons keep their exact look; the pressable
region extends to 44px on touch devices. **Nothing visible may move.**

- [ ] **Step 1: Add the utility**

```css
/*
 * An invisible, larger pressable region — the client's ruling, 27 Aug 2026.
 *
 * He was shown that ~20 targets per route sit below the 44px comfort size
 * (Apple's and Google's guidance) while passing WCAG 2.5.8's actual 24px
 * requirement, and shown the header pill rendered at 9.6px and 11px side by
 * side. He chose to keep every button exactly as it looks and grow only what
 * a thumb can hit. So this adds no width, no height, no padding and no
 * margin: a positioned pseudo-element, centred on the control, outside the
 * layout entirely.
 *
 * `pointer: coarse` scopes it to touch. A mouse is precise and gains nothing,
 * and an invisible 44px box around a desktop link would sit under the pointer
 * in places the link is not — which is how you get a cursor that turns into a
 * hand over empty cream.
 *
 * **Overlap is the failure mode this can create**, and it is asserted rather
 * than trusted: `scripts/check_responsive.mjs` assertion 3 fails if any two
 * effective hit areas intersect. Six links 16px apart, each grown to 44px,
 * would be one ambiguous blob — which is worse than six small targets,
 * because a visitor cannot see why they pressed the wrong thing.
 */
@media (pointer: coarse) {
  .tap {
    position: relative;
  }

  .tap::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: max(100%, var(--tap-w, 44px));
    height: max(100%, var(--tap-h, 44px));
    transform: translate(-50%, -50%);
    /* Purely a hit area. It must never paint and never affect layout. */
    pointer-events: auto;
  }
}
```

`--tap-w` / `--tap-h` exist so a control in a tight row can take a smaller extension rather than overlap its
neighbour — Task 3 needs exactly that.

- [ ] **Step 2: Apply it to the chrome, and to nothing else yet**

`SiteHeader`'s menu button and CTA pill; `PropertyBar`'s links; `SiteFooter`'s directory links. Add `tap` to
each `className`. **Change no other class.**

- [ ] **Step 3: Prove nothing moved**

Capture the header and footer at 390 and 768 before and after, and compare. **A moved pixel is a failed
task.** Use viewport screenshots at a real scroll position, per the global constraints.

- [ ] **Step 4: Re-run the rig**

```bash
npm run build && npx next start -p 3100 &
node scripts/check_responsive.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/after-tap.json
```

Expected: assertion 2's under-44 warning count **drops** for the chrome controls; assertion 3 **still
passes** (no overlap); assertions 1, 4, 5 unchanged. The pager still fails — Task 3 owns it.

- [ ] **Step 5: `npm test && npm run lint && npm run build && npm run verify:budget`**

Expected: 497 tests, and **167.2 KB brotli unchanged** — this task adds CSS only.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: an invisible larger tap area, because the design does not change

The client was shown that ~20 targets per route sit under the 44px comfort
size while passing WCAG 2.5.8's actual 24px requirement, and ruled: keep
every button exactly as it looks, grow only what a thumb can hit.

So this is a positioned pseudo-element outside the layout — no width, no
height, no padding, no margin. Scoped to `pointer: coarse`, because a mouse
gains nothing and an invisible box around a desktop link puts a hand cursor
over empty cream.

Overlap is the failure this creates, so it is asserted rather than trusted:
the rig fails if any two effective hit areas intersect. Six links 16px
apart, each grown to 44px, is one ambiguous blob — worse than six small
targets, because a visitor cannot see why they hit the wrong one.

Zero JavaScript. Byte budget unchanged.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: The carousel pager — the one standards failure

**Files:**
- Modify: `components/sections/ExperienceStrip.tsx`
- Modify: `components/sections/ExperienceStrip.test.tsx`

**Interfaces:**
- Consumes: `.tap` and `--tap-w` / `--tap-h` (Task 2).
- Produces: nothing.

**This is the only control on the site that fails an actual standard.** The six pager links render at
**13×15px** against WCAG 2.5.8's 24×24. Current markup, unchanged since 19 August:

```tsx
<nav aria-label={labels.region} className="flex items-center gap-4">
  {copy.experiences.map((experience, i) => (
    <a
      key={experience.title}
      href={`#${experienceCardId(chapter.id, i)}`}
      aria-label={`${labels.jump} — ${experience.title}`}
      className="rule-in font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{ color: "var(--dim)" }}
    >
      {String(i + 1).padStart(2, "0")}
    </a>
  ))}
</nav>
```

**The geometry, and why 44 is not reachable here.** Six links at ~15px wide with `gap-4` (16px) gives a
pitch of ~31px. Grow each to 44px wide and adjacent hit areas overlap by 13px — which Task 1's assertion 3
will correctly reject. **So solve for the bound rather than assuming a number**: the largest
non-overlapping width is the pitch itself.

- [ ] **Step 1: Write the failing test**

```tsx
it("gives every pager link a hit area that clears the accessibility floor", () => {
  const { container } = render(
    <ExperienceStrip chapter={chapter("field-days")} copy={stripCopy} labels={stripLabels} />,
  );
  const links = container.querySelectorAll("nav a");
  expect(links).toHaveLength(6);
  for (const a of links) {
    expect(a.className).toContain("tap");
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx`
Expected: FAIL — no `tap` class on the pager links.

- [ ] **Step 3: Apply `.tap` with a solved width**

Add `tap` to the link's `className` and set the extension explicitly, with the reasoning at the site:

```tsx
      className="tap rule-in font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4"
      /*
       * **The one control on this site that failed a standard rather than a
       * guideline.** These render 13x15 against WCAG 2.5.8 (AA)'s 24x24.
       *
       * The width is solved, not chosen. Six links at ~15px with `gap-4`
       * gives a ~31px pitch; a full 44px extension would overlap its
       * neighbour by 13px, and `scripts/check_responsive.mjs` assertion 3
       * rejects exactly that — two overlapping hit areas are worse than two
       * small ones, because a visitor cannot see why they pressed the wrong
       * number. So the horizontal extension is the pitch and the vertical is
       * the full 44: 31x44 clears the 24px floor with margin in both axes and
       * overlaps nothing.
       */
      style={{ color: "var(--dim)", "--tap-w": "30px", "--tap-h": "44px" } as React.CSSProperties}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run components/sections/ExperienceStrip.test.tsx && npm test`
Expected: PASS, 498 tests (497 + 1).

- [ ] **Step 5: Re-run the rig — this is the task's gate**

```bash
npm run build && npx next start -p 3100 &
node scripts/check_responsive.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/after-pager.json
```

Expected: **assertion 2 now passes on all three routes** — no target under 24×24 anywhere. Assertion 3
still passes. **If assertion 3 fails, the width is too large: reduce it and re-run.** Report the final
figure and the measured pitch.

- [ ] **Step 6: Screenshot the pager at 390 and confirm nothing moved**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: the carousel pager was 13x15 against a 24x24 standard

The only control on this site failing WCAG 2.5.8 rather than merely sitting
under Apple's 44px guidance. Six numerals under the activity strip, on all
three routes since the strip moved to the property pages.

The extension width is solved rather than picked: six links at ~15px with
gap-4 gives a ~31px pitch, so a full 44px would overlap its neighbour by
13px — which the rig's overlap assertion correctly rejects. Two overlapping
hit areas are worse than two small ones, because a visitor cannot see why
they pressed the wrong number. 30x44 clears the floor in both axes and
overlaps nothing.

Nothing visible moved.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: The park map's labels collide with the lodge

**Files:**
- Modify: `components/sections/PropertyMap.tsx`
- Modify: `components/sections/PropertyMap.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

**The mechanism, traced through the code rather than assumed.** `PropertyMap.tsx` already carries a
sophisticated collision pass — `declutterMobile(labels, width, height)`, using `labelReachPx`,
`MOBILE_COLUMN_PX = 342`, row-sharing detection and a documented priority order. It works.

**It walks `copy.labels` only.** Line 386 is `declutterMobile(copy.labels, width, height)`, and the lodge
is rendered separately at line 536 from `copy.lodge`. **The lodge marker has never been part of the
collision pass**, so a gate label and the lodge's own name can overlap and nothing checks it. At 390px on
Mahua Vann, `Turia Gate` runs straight through `Mahua Vann`.

**This is the same failure family as the 4.3px labels of 9 August** (`DECISIONS.md` §2 #29): the labels
were made *bigger* then, and never taught to *move* around the one mark that is not a label.

- [ ] **Step 1: Write the failing test**

```tsx
it("never lets a kept label collide with the lodge's own name", () => {
  // The lodge is not in `labels` — it is `copy.lodge`, rendered separately —
  // so the declutter pass never saw it until 27 Aug 2026.
  const kept = keptMobileLabels(VANN_MAP_COPY);
  const lodge = VANN_MAP_COPY.lodge;
  for (const l of kept) {
    const sameRow = Math.abs(l.y - lodge.y) < 0.02;
    if (!sameRow) continue;
    const leftFirst = l.x <= lodge.x ? l : lodge;
    const other = l.x <= lodge.x ? lodge : l;
    expect(reachOf(leftFirst)).toBeLessThan((other.x - leftFirst.x) * MAP_WIDTH);
  }
});
```

This needs `declutterMobile`'s result and `labelReachPx` exported for test. Export them, with a comment
saying they are exported for the test and are not a public API.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/sections/PropertyMap.test.tsx`
Expected: FAIL — `Turia Gate` reaches into `Mahua Vann`.

- [ ] **Step 3: Include the lodge in the pass**

Seed `declutterMobile`'s `kept` array with the lodge before walking the labels, so **the lodge always wins**
— it is the one mark on the map the whole page is about, and a gate label is expendable beside it. Record
that reasoning at the site, in the style of the comments already there.

The lodge is not a `MapLabelCopy`; give it the same shape for the purposes of the pass, treating it as
`kind: "gate"` for reach (an upright name beside a marker, which is what it is).

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run components/sections/PropertyMap.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 5: Look at both maps at 390 — this is the real gate**

Capture `/mahua-vann` and `/mahua-tola` at 390 with the map centred in the viewport, and **open them**.
Questions no assertion answers: is `Turia Gate` gone or moved, and is the map still legible without it? On
Tola, did seeding the lodge drop a label the page's own copy names? **If a dropped label is one the
getting-there row mentions, that is a finding, not a success** — the priority order exists for exactly
that.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: the map's collision pass never knew about the lodge

declutterMobile walks copy.labels. The lodge is copy.lodge, rendered
separately, and has never been part of the pass — so at 390px on Mahua
Vann, "Turia Gate" runs straight through "Mahua Vann" and nothing checked
it.

Same family as the 4.3px labels of 9 August: the labels were made bigger
then and never taught to move around the one mark that is not a label.

The lodge seeds the kept set, so it always wins. It is the one mark the
whole page is about; a gate label is expendable beside it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: The three cases nobody has ever measured

**Files:**
- Modify: `scripts/check_responsive.mjs` (only if a case needs a better probe)
- Create: `docs/reviews/2026-08-27-mobile/unmeasured.md`

**Interfaces:** consumes Task 1's rig.

This task **measures and reports**; it fixes only what it finds broken. Spec §5.

- [ ] **Step 1: OS-level text scaling**

Run the rig's assertion 6 at 1.5× and 2×. Report: how many elements clip or overlap, and **how many font
sizes are declared in `px` rather than `rem`** — a `px` font size silently ignores a visitor's
accessibility setting, so that count is the real finding whether or not anything visibly breaks today.

- [ ] **Step 2: Landscape phones**

844×390. This project has `pocket:` and `roomy:` Tailwind variants written for exactly this shape and no
rig has ever exercised them. Report every assertion, and open a screenshot of each route — a 390px-tall
viewport is the shape most likely to strand a full-bleed hero or a sticky bar.

- [ ] **Step 3: Explain tablet-1024**

The property routes' small-type count rose to **60–70** at 1024 against **39–46** at 768. Find out why —
the likely cause is the map drawing more labels once `declutterMobile` stops applying above `lg`, but that
is a hypothesis and it must be traced, not asserted. **If the honest answer is "not established", write
that** and list what was ruled out.

- [ ] **Step 4: Write `unmeasured.md` and commit**

Every figure with the command that produced it. Anything genuinely broken becomes a finding for the client
or a follow-up task, **not a silent fix inside a measurement task**.

```bash
git add -A
git commit -m "$(cat <<'EOF'
test: the three shapes nobody on this project had ever measured

OS text scaling, landscape phones, and tablet-1024 — the last because the
property routes' small-type count rose to 60-70 there against 39-46 at 768
and nobody knew why.

A px font size ignores a visitor's accessibility setting, so the count of
them is the finding whether or not anything visibly breaks today. `pocket:`
and `roomy:` have existed in this project's Tailwind config for a landscape
phone since August and no rig had ever exercised them.

Measured and reported, not silently fixed.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: The sweep, and the record

**Files:**
- Create: `docs/reviews/2026-08-27-mobile/README.md`
- Modify: `CLAUDE.md`, `docs/DECISIONS.md` (new §23), `docs/PROJECT-STATE.md`

- [ ] **Step 1: Every rig, on all three routes, against one production build**

`check_responsive.mjs`, `measure_density.mjs`, `check_contrast_over_photos.mjs`,
`check_image_resolution.mjs`, `check_experience_strip.mjs`, `check_card_stack.mjs`, `check_room_gallery.mjs`,
`check_menu.mjs`, `check_header.mjs`, `measure_page.mjs`, `npm run verify:budget`, `node scripts/check_docs.mjs`.

**Density figures for chapters carrying the reviews widget are non-deterministic** —
`docs/reviews/2026-08-26-restructure/density-variance-NOTE.md`. Do not quote a single figure as settled for
`invitation`, `vann-press` or `tola-press`.

**`check_films.mjs`, `check_plates.mjs` and `check_rule_in.mjs` fail on this branch by design or
pre-existing cause** — `DECISIONS.md` §22. Do not "fix" them.

- [ ] **Step 2: Screenshots at every shape, read by a human**

All three routes at all eight shapes. **Open the 390 and the landscape frames.** This project's two worst
defects were both found by a person looking at a picture.

- [ ] **Step 3: Write `README.md`** — every figure with the command that produced it, before and after.

- [ ] **Step 4: `docs/DECISIONS.md` §23**

Must carry: the client's rulings of 27 Aug (rooms left alone, invisible tap area, 9.6px label kept after
seeing both); **the three false findings of §2 of the spec and their three lessons** — measure production,
never element-screenshot a sticky container, never judge a scroll effect from one frame; the pager's solved
width and why 44 was not reachable; and the map's lodge-collision mechanism.

- [ ] **Step 5: `CLAUDE.md`** — the branch table, Status, Tests and Evidence rows; add `check_responsive.mjs`
to the Commands list; and **update the 12 August "desktop is the lens" note**, which this work supersedes.

- [ ] **Step 6: `docs/PROJECT-STATE.md`** — the owed list, unchanged from B plus: **ask the client for the
"few minor changes" he noted on 27 Aug and chose to give later.**

- [ ] **Step 7: `node scripts/check_docs.mjs` must PASS. Final gate:**
`npm test && npm run build && npm run lint && npm run verify:budget`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: the mobile work, verified — and how the first survey got it wrong

Every rig re-run on all three routes against one production build, and the
390 and landscape frames opened and read by eye.

DECISIONS.md §23 carries the client's three rulings and, more usefully, the
three false findings that opened this work and why each happened: a
dev-mode indicator read as a layout collision, an element screenshot of a
sticky container read as wasted space, and one frame of a scroll-driven
effect read as clipped type. The site was in far better shape than the
first survey claimed, and the brief shrank accordingly.

CLAUDE.md's 12 August "desktop is the lens" note is superseded here.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review

**Spec coverage.** §1.1's five rulings → Tasks 2, 3, 4 and 6 (rooms untouched is enforced by the File
Structure's "deliberately untouched"). §2's three lessons → Global Constraints and Task 6 Step 4. §3's
verified-sound list → the rig's assertions 1 and 5, which lock them in. §4.1 → Task 3. §4.2 → Task 2.
§4.3 → Task 4. §4.4 → the rig's assertion 4 (a floor, not an absolute). §5 → Task 5. §6 → Task 1.
§7's out-of-scope → File Structure. §8's order → the task order. §9 → Task 6 Step 6.

**Type consistency.** `.tap`, `--tap-w`, `--tap-h` are defined in Task 2 and used in Task 3 under exactly
those names. `check_responsive.mjs`'s flags and `--out` shape are fixed in Task 1 and reused in 2, 3, 5, 6.
`declutterMobile` and `labelReachPx` are existing names; Task 4 exports them rather than renaming.

**Two things a reviewer should push back on if done differently.** Task 3's `--tap-w: 30px` is derived from
a ~31px pitch measured at one width — if the pitch differs at 360 or on a property route, the figure must be
re-solved there rather than assumed to carry; the rig's overlap assertion is what will catch it. And Task 4
seeds the lodge as always-winning, which is a priority decision: if it drops a label that a page's own
getting-there copy names, that is a finding for the client, not a success.
