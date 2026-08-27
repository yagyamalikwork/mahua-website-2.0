# Mobile, tablet and zoom — design

**Status:** approved by the client, 27 August 2026. Ready to plan.
**Branch:** `feat/journal-and-mobile`.
**Order:** this is **C**, the second of the three bodies of work agreed on 26 Aug. **B** (the restructure and
the reviews widget) shipped in 25 commits, `b9eecaa..527dba1`. **A** (the Journal) is specified in
[`2026-08-26-journal-page-design.md`](2026-08-26-journal-page-design.md) and comes last.

> **Read §2 before doing anything else.** The first reconnaissance for this brief produced **three false
> findings** and the client made a design decision on one of them. Every figure below was re-measured
> against a production build. The lesson generalises past this task.

---

## 1. What the client asked for

Verbatim, 26 August 2026:

> We need to optimize the complete website for mobile phone so the website looks as it is on a big computer
> screen but also the layout and placement of everyting looks refined and we optimized for mobile and
> tablets as well. You can go through Sujan or any other website and see how they react on each zoom in/out
> levels, I want the website experience and optimization for every zoom and every device to be on point and
> should not spoil or disturbe the user experience at any point.

**This reverses his own ruling of 12 August** — *"right now our only focus is how it looks on a
computer/laptop screen, we can workout and optimize mobile screens later"* — which `CLAUDE.md` records as
sequencing rather than a relaxed bar. This is the "later" arriving.

### 1.1 What he decided when shown the measurements

| Question | Ruling |
|---|---|
| The rooms card stack on phones | **Leave it. It works.** See §2.1 — the finding that prompted the question was false |
| Buttons below the 44px comfort size | **Extend the tap area invisibly.** The visible design must not change at any width |
| The header pill's 9.6px label | **Leave it at 9.6px**, having seen both rendered — 11px closes the gap to the wordmark |
| Which kinds of zoom | **All of them, to the same standard** — browser zoom, pinch-zoom, OS text scaling |
| How "done" is judged | **Build a rig that asserts**, run every time |

---

## 2. The reconnaissance was wrong three times, and why

The first pass measured `next dev`, took an element screenshot of a `position: sticky` container, and
judged a scroll-driven effect from a single frame. It produced these, all reported to the client:

| Claimed | Actually |
|---|---|
| `02 · The Rooms` is "six screens of blank cream" on a phone, structurally broken | **2.8 screens (Vann) / 3.4 (Tola)**, ~38% bare across the scroll — in line with the site's own 32.9% page mean |
| A room's description is cut off mid-sentence | **False.** `scripts/check_card_stack.mjs` assertion 8 already asserts every card's text is simultaneously inside the visible band, inside its own clip box and at opacity ≥0.98, **at 390×844**, and it passes on both routes: `card-stack-task9.json`, `verdict: pass`, 0 failures |
| The park map is clipped on a phone | **False.** The full drawing renders — river, four gates, reservoir, road, compass |
| The booking bar's compass mark overlaps its own text | **False.** That is Next.js's **dev-mode indicator**, bottom-left. It does not exist in a production build |

**Three lessons, and they outlive this task:**

1. **Measure a production build.** A dev overlay read as a layout collision.
2. **An element screenshot of a sticky container is not what a visitor sees.** `position: sticky` renders
   its whole scroll range into an element capture; a visitor sees one viewport of it at a time. Capture the
   **viewport at real scroll positions**.
3. **One frame of a scroll-driven effect proves nothing.** The "truncated text" was a transition state that
   the project's own rig already covers.

**The site is in substantially better shape on a phone than the first pass claimed**, and this brief is
correspondingly smaller: touch ergonomics, one map defect, and a rig.

---

## 3. What is verified sound — do not "fix" these

Measured on a production build at **360, 390, 430, 768, 1024** and at browser-zoom shapes **960×600 (≈150%)**
and **720×450 (≈200%)**, on all three routes:

- **Zero horizontal overflow, everywhere.** `document.scrollWidth - clientWidth === 0` at every shape on
  every route. The compositions genuinely hold, including under zoom.
- **Pinch-zoom is not blocked.** No `maximum-scale` or `user-scalable=no` exists anywhere in `app/` or
  `lib/`; Next.js's default viewport permits it.
- **The rooms card stack works on phones**, per §2.
- **The two closing lodge pills are already 12px type in a 227×44 box** — they meet the comfort standard
  as they stand.
- **Contrast at mobile widths is already instrumented.** `scripts/check_contrast_over_photos.mjs` sweeps
  from **360** and passed 336 probes with 0 failures in the 26 Aug sweep.

---

## 4. What is verified broken

### 4.1 The carousel pager fails the accessibility standard

The six pager links under `05 · Experiences` (and now under `03 · The Experience` on both property pages)
render at **13×15px**. WCAG 2.5.8 (AA) requires **24×24**. They fail it, and they are genuinely hard to
hit.

**This is the only touch target on the site that fails a standard rather than a guideline**, and it is
fixed properly — a real, larger target — rather than invisibly. Six small numerals under a strip have room
to grow without costing the composition anything.

### 4.2 Twenty-odd targets sit below the 44px comfort size

Per route, per shape: **20–24** elements. The Menu button is 40×32; `Book`, `Plan your stay` and both
`Discover Mahua …` links are 34px tall. **All of these pass WCAG AA (24px).** They are below Apple's and
Google's 44px guidance.

**The client's ruling: extend the tap area invisibly. The visible design does not change at any width.**
A pressable region larger than the painted box, on touch devices, where a pointer gains nothing from it.

### 4.3 The park map's labels collide at phone width

At 390, `Turia Gate` runs into `Mahua Vann` on the Vann map. The labels are placed in the drawing's own
coordinate space and do not reflow as the drawing shrinks.

**This is the same failure family as the 4.3px labels of 9 August** — which `CLAUDE.md` records shipping
through fifteen task reviews and a whole-branch verification, because every rig measured 1440. The label
sizing was fixed then; the label *placement* was not.

### 4.4 Small type, and where it is deliberate

Between **23 and 70** elements per route render below 12px, the smallest being **8.8px** (`Pench`,
`Tadoba` under the lodge names) and **9.6px** (the header pill and `Book`).

**Most of this is the site's own idiom** — uppercase, widely tracked small capitals, which read
considerably larger than their point size and are rendered on 3× screens. The client has seen the header
pill at 9.6px and 11px side by side and **chose 9.6px**, because 11px closes the gap to the wordmark.

**So this is not a defect to fix. It is a floor to establish and hold**: the rig records the smallest
type on each route and fails if anything drops *below today's measured minimum*, so nothing new arrives
smaller by accident.

---

## 5. What has not been measured yet, and must be

- **OS-level text scaling.** A visitor who has set larger system text. Nothing on this project has ever
  tested it. The failure mode is a fixed-height box clipping or overlapping its own words.
- **Landscape phones.** `pocket:` and `roomy:` exist for exactly this shape (`CLAUDE.md`) and no rig
  exercises them.
- **Tablet at 1024 on the property routes**, where the tiny-text count rose to 60–70 against 39–46 at 768.
  Probably the map drawing more labels at that size; unconfirmed.

These are part of the work, not preconditions for it.

---

## 6. The rig

**`scripts/check_responsive.mjs`**, run on all three routes, asserting:

| Assertion | Threshold |
|---|---|
| No horizontal overflow | `scrollWidth - clientWidth === 0` |
| Tap targets | none below **24×24** (WCAG AA); those below 44 must carry an extended hit area |
| Smallest type | never below the per-route minimum recorded when the rig is written |
| No overlapping interactive elements | zero pairs of intersecting hit areas |
| Pinch-zoom permitted | no `maximum-scale` / `user-scalable=no` |
| Text survives OS scaling | no clipped or overlapping text at 1.5× and 2× text scale |

Shapes: **360×800, 390×844, 430×932, 768×1024, 1024×1366**, landscape phone **844×390**, and browser-zoom
**960×600** and **720×450**.

**Every assertion is watched failing before it is believed.** That is this project's standing rule and it
is why §4.3 exists — the map's labels survived fifteen reviews because no instrument was pointed at them.

**It measures a production build.** §2's whole lesson.

---

## 7. Deliberately out of scope

No redesign of any section. No new breakpoint system. No mobile-only navigation pattern. No touch gestures
beyond what the browser gives natively. No change to any composition that measures sound in §3.

**And no change to the closing CTA** — that is the client's item 4f, explicitly sequenced last and not
part of this work.

---

## 8. Order

1. **The rig first**, against today's build, so every subsequent change is measured rather than asserted —
   and so the baseline it locks in is the real one.
2. **The pager** (§4.1) — the only standards failure.
3. **The invisible tap areas** (§4.2) — shared chrome first, since it is on every page.
4. **The map labels** (§4.3).
5. **OS text scaling and landscape** (§5).
6. A full sweep, screenshots read by eye at every shape, and the record.

---

## 9. What is owed by the client

Nothing blocking. His outstanding items are all from **B** and unchanged: the Mahua Tola Elfsight embed,
the widget restyle, a paid Elfsight plan for the free-tier badge, the Vercel plan check, and a
no-JavaScript fallback sentence. He also has *"a few minor changes"* noted while reviewing B on 27 Aug,
which he has chosen to give later — **ask for them before this branch closes.**

---

## 10. Related reading

- `CLAUDE.md` — the non-negotiables, and the `short:` / `pocket:` rule that browser zoom already broke once
- `docs/DECISIONS.md` §2 (the defect catalogue, #29 and #44–45 in particular), §17–§18 (the rooms card
  stack), §22 (the 26 Aug restructure and its six instrument blind spots)
- `docs/reviews/2026-08-26-restructure/` — B's evidence, including `card-stack-task9.json`
