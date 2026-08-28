// The first rig on this project that looks at a phone, a tablet or a zoomed
// browser. Every other rig here measures 1440×900 — that is how the drawn
// park map shipped with 4.3px labels through fifteen task reviews, because no
// instrument was ever pointed at a phone (`CLAUDE.md`, non-negotiable #8's own
// admission). This one checks six things, at eight shapes, on all three
// routes, and it is deliberately built first so its baseline can attribute
// every later change: Tasks 2–4 fix what this rig finds, and re-run it
// against this same committed figure.
//
// Run (with `npx next start -p 3100` already up, against a PRODUCTION build —
// see the note below, it is not optional):
//   node scripts/check_responsive.mjs --port 3100
//   node scripts/check_responsive.mjs --port 3100 --out docs/reviews/2026-08-27-mobile/baseline.json
//   node scripts/check_responsive.mjs --port 3100 --baseline docs/reviews/2026-08-27-mobile/baseline.json
//
// `--url` is a WHOLE BASE URL replacement, not a path — the same trap as
// `measure_density.mjs` and `check_experience_strip.mjs`. This rig always
// tests all three routes (`/`, `/mahua-vann`, `/mahua-tola`) against whatever
// base it is given; there is no `--chapter`-style narrowing here because the
// whole point is to never again check only the page a defect happened to be
// found on.
//
// ## Why a production build, every time
//
// `next dev` ships React's dev overlay and a floating dev-mode indicator,
// bottom-left, that is not part of the shipped page. The survey that opened
// this body of work (`docs/superpowers/plans/2026-08-27-mobile-tablet-and-
// zoom.md`) produced three false findings from a dev server, one of them that
// very badge read as a layout collision with real chrome. `npm run build` then
// `npx next start` is the only server this rig should ever be pointed at.
//
// ## The six assertions
//
// 1. No horizontal overflow — `scrollWidth - clientWidth === 0` on the
//    document element, at every shape. A page that scrolls sideways on a
//    phone is a page whose layout broke, not a design choice.
// 2. Target size — WCAG 2.5.8 (AA)'s 24×24 CSS px floor, on the EFFECTIVE hit
//    area (own box, or a `::after` extension — see `effectiveHitBox` below).
//    Apple/Google's 44×44 comfort guidance is not a compliance floor here, so
//    anything under it is counted as a WARNING, never a failure — the two
//    numbers answer different questions and this project's own client ruling
//    (27 Aug 2026) is to extend hit areas toward 44 where it can, not to
//    require it everywhere.
// 3. No overlapping hit areas — no two effective hit rectangles intersect.
//    **This is the assertion that stops Task 2 breaking things.** Extending a
//    target invisibly is exactly how six neighbouring pager links become one
//    ambiguous blob; this assertion names the PAIR, not a count, because a
//    count that changes tells you something broke without ever telling you
//    what to look at.
// 4. Type floor — the smallest rendered font size, per route per shape,
//    against a previously recorded baseline (`--baseline`). Not an absolute
//    floor: the client has ruled the site's small tracked capitals stay (spec
//    §4.4), so this only fails a REGRESSION from what this task itself
//    recorded, never a fixed number picked in advance — the same lesson
//    `mahua-solve-for-the-limit` names for every other bound on this project.
//    On this run, with no `--baseline` given, it establishes rather than
//    compares.
// 5. Zoom policy — no `maximum-scale` or `user-scalable=no` in the document's
//    own viewport meta tag. A visitor who needs to pinch-zoom to read this
//    page must be able to.
// 6. OS text scaling — Playwright has no device switch for a visitor's own
//    accessibility text-size setting, so this injects
//    `document.documentElement.style.fontSize = "150%"` (and, separately,
//    `"200%"`), which scales every `rem`-based size, and checks that nothing
//    clips (`scrollHeight` over `clientHeight` under `overflow: hidden` or
//    `clip`) and that no two text blocks' rectangles come to intersect. **A
//    `px` font size does not scale at all**, so this also counts — separately,
//    never as a pass/fail — how many text-bearing elements do not move when
//    the root scales. That count is itself a finding: an element sized in
//    `px` is one that silently ignores a visitor's own accessibility setting,
//    whatever unit its source declares it in. Measuring the OUTCOME rather
//    than grepping for `px` in a stylesheet is deliberate — this project's own
//    lesson is to check what a rig can prove happened, not what a
//    configuration merely claims (`docs/DECISIONS.md`, "attribute alone is a
//    configuration claim").
//
//    **Task 5 (28 Aug 2026) added tagging, not a threshold.** The baseline's
//    ~2,400 assertion-6 findings are dominated by one artefact class —
//    `SplitLines.tsx` wraps every headline word in its own `overflow-hidden`
//    mask (`[data-word]`), and its `scrollHeight`/`clientHeight` ratio sits
//    near 1.9× — IDENTICAL at 150% and 200% root scale, which on its own
//    rules out anything proportional to the applied scale factor (a fix-round-
//    1 correction: an earlier version of this comment attributed this to "a
//    word's glyph metrics changing by a fraction of a pixel," which the
//    figures never supported and which fix round 1 traced to something else
//    entirely — see the rest-state paragraph below). Every clip/intersection
//    finding is now tagged `isWordSpan` (`closest("[data-word]")`, a real DOM
//    check, not a guess from the description text), and `clippedWordSpanCount`
//    / `clippedOtherCount` / `intersectionWordSpanCount` /
//    `intersectionOtherCount` report the split. `clippedCount` and
//    `intersectionCount` are UNCHANGED — same totals, same `fail()` calls,
//    same elements counted as failing. This is the rig seeing more, not a
//    number coming out differently — see `docs/reviews/2026-08-27-mobile/
//    unmeasured.md` §1 for what the split found. §4's own diagnostic gained
//    a similar addition: `under12Count`/`under12MapCount` on every
//    shapeReport, tracing (not asserting) how many text-bearing elements
//    render under 12px and how many of those sit inside the property map's
//    `<svg>` — unmeasured.md §3.
//
//    **A second artefact class, found while tracing the first — and it turned
//    out to swallow the first, not sit beside it.** `.drift-frame` (the
//    non-negotiable-#5 parallax mask — `app/globals.css` — around a
//    photograph drawn deliberately oversized so it always covers its frame as
//    it translates) has `scrollHeight > clientHeight` BY DESIGN, at rest, with
//    no font scale involved at all — confirmed by measuring it before this
//    rig ever touches the root font-size. Assertion 6's clip check never
//    compared against a rest state, so this permanent, load-bearing overflow
//    read identically to a genuine scaling regression on every route that
//    carries a drift photograph. `restOverflow` (below) snapshots every
//    overflow-hidden candidate BEFORE the scale changes; `wasClippedAtRest` on
//    each clipped entry says whether it was already clipping then;
//    `clippedAtRestCount` / `clippedGenuineNewCount` report the split. **Fix
//    round 1 found that `wasClippedAtRest` is true for EVERY `isWordSpan` clip
//    on this page (1,376 of 1,376) — but traced this to a DIFFERENT mechanism
//    than `.drift-frame`'s, not the same one.** `[data-word]` only overflows
//    while its heading is `data-lines-enter="pending"` — not yet scrolled
//    into view, `[data-line-inner]` sitting translated 115% of its own
//    height below the mask, exactly as designed, awaiting its entrance. This
//    rig never scrolls, so every below-the-fold heading sits in that pending
//    position for its entire run. Confirmed empirically (scratch probe, not
//    committed): scrolling one such heading into view and letting its
//    transition settle takes `scrollHeight`/`clientHeight` from 130/67 to
//    exactly 67/67 — the overflow is not permanent, it is scroll-position-
//    dependent, and it is gone by the time a visitor would ever see the
//    heading. The word-span bucket is a subset of the at-rest one by the
//    numbers, but for its own, unrelated reason — see `unmeasured.md` §1 for
//    the full account, including why the `.drift-frame` framing in an
//    earlier version of this comment was itself imprecise.
//    `clippedWordSpanCount` still reports the same number it always has
//    (word-span clips are counted there whether or not they are also
//    at-rest), so no total changed — only the NARRATIVE was wrong. Same rule
//    as always: nothing about which elements FAIL changed, only what is now
//    known about each one.
//
//    **Fix round 1 also built the intersection half's rest-state check**,
//    which the first pass of this task never did — only clips got a
//    `restOverflow` snapshot; intersections got only the word-span split.
//    `restIntersectionSigs` (below) snapshots every text-block pair that
//    already intersects at rest, keyed by the same `"a × b"` signature the
//    post-scale loop produces; `wasIntersectingAtRest` on each intersection
//    finding says whether that pair was already there. `intersectionAtRestCount`
//    / `intersectionGenuineNewCount` report the split, the latter using the
//    same AND-exclusion (`!isWordSpan && !wasIntersectingAtRest`)
//    `clippedGenuineNewCount` already used — see `unmeasured.md` §1.4.
//
// ## Why every assertion here was watched failing before being believed
//
// "A rig that has never failed has proved nothing" is this project's own
// standing rule, named in this exact brief as the reason the map's 4.3px
// labels survived so long. Every one of the six assertions below was broken
// deliberately in a scratch edit, run against this rig, and confirmed to name
// the right thing before being reverted — recorded in
// `.superpowers/sdd/2026-08-27-mobile-tablet-and-zoom/task-1-report.md`, not
// repeated here because a rig's own file is not the place for a change log.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const PORT = flag("port", "3100");
const BASE = flag("url", `http://localhost:${PORT}`);
const OUT = flag("out", "docs/reviews/2026-08-27-mobile/responsive.json");
const BASELINE_PATH = flag("baseline", null);

/** The three routes this site actually has. Site chrome (header, menu,
 * footer) is shared, but each route's own chapters are not, so all three are
 * walked on every run rather than trusting the header to stand for the page.
 */
const ROUTES = ["/", "/mahua-vann", "/mahua-tola"];

/*
 * Eight shapes, each with a reason. Given verbatim from the brief — this rig
 * does not invent its own thresholds, it re-derives the project's already-
 * agreed ones.
 */
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

/** WCAG 2.5.8 (AA)'s hard floor. Failing this is a defect. */
const AA_FLOOR = 24;
/** Apple/Google's comfort guidance. A target, never a compliance floor. */
const COMFORT = 44;
/** Sub-pixel layout and a scrollbar some platforms round. */
const EPS = 1.5;

const failures = [];
const fail = (assertion, where, message) => failures.push({ assertion, where, message });

const browser = await chromium.launch();

/*
 * Every browser-side evaluate below re-declares the same three small
 * helpers rather than sharing one closure, because nothing in a
 * `page.evaluate` callback can close over this file's own scope — it runs in
 * the page, not in Node. Repeating ~20 lines of real, lintable JS three times
 * is preferred here over building the callback as a template-literal STRING
 * (which would de-duplicate it, but at the cost of making its contents
 * invisible to the parser and to `npm run lint` until the moment it runs in a
 * browser). `effectiveHitBox` is given verbatim by the brief; `describe` and
 * `isVisible` are this file's own, documented once here and repeated
 * unchanged at each call site:
 *
 * - `effectiveHitBox(el)` — an element's own box, or its `::after`
 *   extension's, whichever is larger. This is the ONE shape Task 2's
 *   invisible hit-area growth is expected to grow through: it reads whichever
 *   box the CSS actually produced, so a future change to how a target is
 *   extended needs no change here at all.
 * - `describe(el)` — a short, stable description for a failure message,
 *   never a CSS selector, because a selector that matches zero elements six
 *   months from now fails silently while a described one keeps meaning
 *   something.
 * - `isVisible(el)` — is this something a visitor could actually see and
 *   reach? A `visibility: hidden` (or `display: none`) subtree still returns
 *   a real, non-zero `getBoundingClientRect()` for `visibility: hidden` — it
 *   keeps its layout box, it is only unpainted and untargetable — which is
 *   exactly the site menu's closed state (`SiteMenu.tsx`'s panel is
 *   `invisible opacity-0`, not unmounted; its Home/Vann/Tola links are
 *   server-rendered from the first paint so the client can toggle them with
 *   no fetch). Without this filter, every route's closed menu would hand
 *   assertions 2 and 4 a page's worth of targets nobody can tap, and
 *   assertion 3 a page's worth of geometry nobody can collide with — a false
 *   reading in exactly the shape this project's own `audit-the-instruments`
 *   lesson warns about: a rig may be changed so it can see more, never so it
 *   reports something that is not there. `visibility` is an inherited CSS
 *   property, so an element's own COMPUTED value already reflects a hidden
 *   ancestor with no need to walk the tree; `display: none` already yields an
 *   all-zero rect and is caught by the "non-zero box" filter the brief
 *   specifies.
 */

const routeReports = [];

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  const routeReport = { route, shapes: [] };

  for (const shape of SHAPES) {
    const context = await browser.newContext({
      viewport: { width: shape.w, height: shape.h },
      deviceScaleFactor: shape.dpr,
      isMobile: shape.mobile,
      hasTouch: shape.mobile,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    const where = `${route} @ ${shape.name} (${shape.w}x${shape.h})`;
    const shapeReport = { shape: shape.name, w: shape.w, h: shape.h };

    /* ── 1 — No horizontal overflow ─────────────────────────────────────── */
    const overflowInfo = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const overflowPx = overflowInfo.scrollWidth - overflowInfo.clientWidth;
    shapeReport.overflowPx = overflowPx;
    if (overflowPx > EPS) {
      fail(
        1,
        where,
        `document scrollWidth ${overflowInfo.scrollWidth} exceeds clientWidth ${overflowInfo.clientWidth} by ${overflowPx}px — the page scrolls sideways`,
      );
    }

    /* ── 2 & 3 — Target size and overlap, off the SAME collected set ─────── */
    const targets = await page.evaluate(() => {
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
      const describe = (el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
        const label = el.getAttribute("aria-label");
        const href = el.getAttribute("href");
        const id = el.id;
        const bits = [tag];
        if (id) bits.push(`#${id}`);
        if (label) bits.push(`"${label}"`);
        else if (text) bits.push(`"${text}"`);
        if (href) bits.push(`→ ${href}`);
        return bits.join(" ");
      };
      const isVisible = (el) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.display !== "none";
      };

      const els = [...document.querySelectorAll("a[href], button, [role='button'], summary, input")];
      return els
        .filter((el) => isVisible(el))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            desc: describe(el),
            own: { x: r.x, y: r.y, w: r.width, h: r.height },
            box: effectiveHitBox(el),
          };
        })
        .filter(({ box }) => box.w > 0 && box.h > 0)
        .map((t) => ({
          desc: t.desc,
          // The element's own rendered box — unrounded to 2dp like the
          // effective box below. Fix-round 1, 28 Aug 2026: a whole-branch
          // review found this task's own central geometric claim (the
          // pager's measured 29.29px pitch) existed only in a report's prose
          // and a deleted throwaway script, nowhere in committed evidence —
          // against this project's own rule that every committed number must
          // be re-derivable from a script in `scripts/`, not quoted. Adding
          // `own` here (alongside the effective box already read by
          // assertions 2 & 3, unchanged below) means a pitch, a gap, or any
          // other position-derived figure is re-derivable from this file's
          // own committed JSON forever, by anyone, without re-writing a
          // script. Purely additive: `x`/`y`/`w`/`h` below are byte-identical
          // to what assertions 2 and 3 already consumed before this change.
          own: {
            x: Number(t.own.x.toFixed(2)),
            y: Number(t.own.y.toFixed(2)),
            w: Number(t.own.w.toFixed(2)),
            h: Number(t.own.h.toFixed(2)),
          },
          // The EFFECTIVE hit box — own box, or its `.tap`-grown `::after`,
          // whichever is larger. Unchanged: this is exactly what assertions
          // 2 and 3 below have always read.
          x: Number(t.box.x.toFixed(2)),
          y: Number(t.box.y.toFixed(2)),
          w: Number(t.box.w.toFixed(2)),
          h: Number(t.box.h.toFixed(2)),
        }));
    });

    let under24 = 0;
    let under44 = 0;
    for (const t of targets) {
      const failsAA = t.w < AA_FLOOR - EPS || t.h < AA_FLOOR - EPS;
      const underComfort = t.w < COMFORT - EPS || t.h < COMFORT - EPS;
      if (underComfort) under44 += 1;
      if (failsAA) {
        under24 += 1;
        fail(
          2,
          where,
          `${t.desc} has an effective hit area ${t.w}×${t.h} — under the WCAG 2.5.8 24×24 floor`,
        );
      }
    }
    shapeReport.targetsChecked = targets.length;
    shapeReport.under24 = under24;
    shapeReport.under44Warning = under44;
    // Per-target geometry, added fix-round 1 (28 Aug 2026) — additive only,
    // no threshold or assertion above touched. Each entry: `desc`, `own` (the
    // element's real rendered box) and the effective hit box (`x`/`y`/`w`/`h`
    // — the same fields assertions 2 and 3 already read, now also written
    // out). A pitch between two adjacent targets, or any other position
    // question, is derivable from this array without a bespoke script.
    shapeReport.targets = targets;

    // 3 — pairwise overlap on the same rectangles. O(n²) over a page's own
    // interactive elements (tens, not thousands), so the naive form is the
    // right one — it never has to be fast, only right, and the RIGHT thing is
    // naming the pair. Touching edges (adjacent buttons flush against each
    // other) are not an overlap: EPS shrinks each rectangle before testing so
    // an exact-zero gap does not read as a collision.
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const a = targets[i];
        const b = targets[j];
        const ax2 = a.x + a.w;
        const ay2 = a.y + a.h;
        const bx2 = b.x + b.w;
        const by2 = b.y + b.h;
        const overlapsX = a.x < bx2 - EPS && ax2 > b.x + EPS;
        const overlapsY = a.y < by2 - EPS && ay2 > b.y + EPS;
        if (overlapsX && overlapsY) {
          fail(
            3,
            where,
            `${a.desc} (${a.w}×${a.h} at ${a.x},${a.y}) overlaps ${b.desc} (${b.w}×${b.h} at ${b.x},${b.y}) — an extended hit area has swallowed a neighbour`,
          );
        }
      }
    }

    /* ── 4 — Type floor: the smallest rendered font size on this route/shape ── */
    //
    // Task 5 (28 Aug 2026) added the `under12*` fields below, purely
    // additively — nothing about `min`/`desc` (assertion 4's own reading) or
    // any threshold changed. They exist to TRACE, not assert, the spec §5
    // question of why the property routes' small-type count rose at
    // tablet-1024 against tablet-768: `under12Count` is every text-bearing,
    // visible element whose `getComputedStyle().fontSize` reads under 12 —
    // the same measurement assertion 4 already takes, just counted rather
    // than minimised — and `under12MapCount` is the subset of those sitting
    // inside an `<svg>` (i.e. the property map's own `<text>` labels, the
    // only SVG text on any of these three routes). See `unmeasured.md` §3 for
    // what this traced.
    const smallest = await page.evaluate(() => {
      const describe = (el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
        const label = el.getAttribute("aria-label");
        const id = el.id;
        const bits = [tag];
        if (id) bits.push(`#${id}`);
        if (label) bits.push(`"${label}"`);
        else if (text) bits.push(`"${text}"`);
        return bits.join(" ");
      };
      const isVisible = (el) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.display !== "none";
      };

      let min = Infinity;
      let minDesc = null;
      let under12Count = 0;
      let under12MapCount = 0;
      const under12Sample = [];
      for (const el of document.querySelectorAll("body *")) {
        const hasOwnText = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
        );
        if (!hasOwnText || !isVisible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < min) {
          min = size;
          minDesc = describe(el);
        }
        if (size < 12) {
          under12Count += 1;
          const inMap = el.closest("svg") !== null;
          if (inMap) under12MapCount += 1;
          if (under12Sample.length < 12) {
            under12Sample.push({ desc: describe(el), px: Number(size.toFixed(2)), inMap });
          }
        }
      }
      return {
        min: min === Infinity ? null : Number(min.toFixed(2)),
        desc: minDesc,
        under12Count,
        under12MapCount,
        under12Sample,
      };
    });
    shapeReport.smallestFontPx = smallest.min;
    shapeReport.smallestFontEl = smallest.desc;
    shapeReport.under12Count = smallest.under12Count;
    shapeReport.under12MapCount = smallest.under12MapCount;
    shapeReport.under12Sample = smallest.under12Sample;

    /* ── 5 — Zoom policy: the document's own viewport meta ───────────────── */
    const viewportMeta = await page.evaluate(
      () => document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
    );
    shapeReport.viewportMeta = viewportMeta;
    if (viewportMeta && /maximum-scale|user-scalable\s*=\s*no/i.test(viewportMeta)) {
      fail(5, where, `viewport meta "${viewportMeta}" blocks pinch-zoom`);
    }

    /* ── 6 — OS text scaling, at 150% and 200% ────────────────────────────── */
    shapeReport.textScaling = {};
    for (const scale of ["150%", "200%"]) {
      const result = await page.evaluate((s) => {
        const isVisible = (el) => {
          const cs = getComputedStyle(el);
          return cs.visibility !== "hidden" && cs.display !== "none";
        };
        const describe = (el) => {
          const tag = el.tagName.toLowerCase();
          const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
          const label = el.getAttribute("aria-label");
          const id = el.id;
          const bits = [tag];
          if (id) bits.push("#" + id);
          if (label) bits.push(`"${label}"`);
          else if (text) bits.push(`"${text}"`);
          return bits.join(" ");
        };

        // Text-bearing elements, before scaling — this is also the set used
        // to count non-scaling ("px-like") elements below.
        const textEls = [...document.querySelectorAll("body *")].filter((el) => {
          const hasOwnText = [...el.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
          );
          return hasOwnText && isVisible(el);
        });
        const before = textEls.map((el) => parseFloat(getComputedStyle(el).fontSize));

        // Hoisted from the post-scale intersections block below (it used to
        // be declared there alone) so the fix-round-1 rest-state intersection
        // snapshot immediately below can use the exact same tolerance. Same
        // value, same constant — not a threshold change, just shared.
        const EPS2 = 1.5;

        // Task 5 (28 Aug 2026), additive: a REST-STATE snapshot of every
        // overflow:hidden/clip candidate, taken before the root font-size
        // ever changes. `.drift-frame` (the non-negotiable-#5 parallax
        // mask around an intentionally oversized photograph — see its own
        // comment in `app/globals.css`) clips BY DESIGN at 100% scale,
        // every time, on every route: the drifting photo is drawn larger
        // than its frame so it always covers the frame as it translates.
        // Without this snapshot, that permanent, load-bearing "overflow"
        // reads identically to a real OS-text-scaling regression. Keyed by
        // element reference (this whole rig runs inside one page.evaluate,
        // so the reference is stable across both passes).
        const restOverflow = new Map();
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.overflowY !== "hidden" && cs.overflowY !== "clip" && cs.overflow !== "hidden" && cs.overflow !== "clip") continue;
          restOverflow.set(el, el.scrollHeight > el.clientHeight + 1.5);
        }

        // Fix round 1 (28 Aug 2026), additive: the SAME rest-state idea as
        // `restOverflow` immediately above, but for assertion 6's OTHER half
        // — intersections — which the first pass of this task never built an
        // equivalent check for. Built from the identical ancestor-exclusion
        // and overlap logic the post-scale intersection loop below uses (see
        // its own comment), on the same `textEls`, read BEFORE the root
        // font-size changes. A pair's signature is the same `"a × b"` string
        // used post-scale, so a post-scale pair can be looked up here by
        // identity, not by re-deriving geometry.
        const restRects = textEls
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { el, desc: describe(el), x: r.x, y: r.y, w: r.width, h: r.height };
          })
          .filter((r) => r.w > 0 && r.h > 0);
        const restIntersectionSigs = new Set();
        for (let i = 0; i < restRects.length; i++) {
          for (let j = i + 1; j < restRects.length; j++) {
            const a = restRects[i];
            const b = restRects[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const overlapsX = a.x < b.x + b.w - EPS2 && a.x + a.w > b.x + EPS2;
            const overlapsY = a.y < b.y + b.h - EPS2 && a.y + a.h > b.y + EPS2;
            if (overlapsX && overlapsY) {
              restIntersectionSigs.add(`${a.desc} × ${b.desc}`);
            }
          }
        }

        document.documentElement.style.fontSize = s;

        // Clipping: any overflow:hidden/clip element whose content now
        // outgrows its box.
        //
        // **Uncapped, deliberately.** An early draft capped this at 20 per
        // combination, and every one of the 48 route/shape/scale combinations
        // hit that cap on this very page — meaning the true count was UNKNOWN,
        // not 20, and the cap was quietly understating a real finding rather
        // than describing it. Cheap here (a few hundred candidate elements
        // per page), so there is no cost to counting every one.
        const clipped = [];
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.overflowY !== "hidden" && cs.overflowY !== "clip" && cs.overflow !== "hidden" && cs.overflow !== "clip") continue;
          if (el.scrollHeight > el.clientHeight + 1.5) {
            // Task 5 (28 Aug 2026), additive: is this element the per-word
            // entrance-animation mask `SplitLines.tsx` wraps every headline
            // word in (`[data-word]`, `overflow-hidden` by construction), or
            // its own descendant? `closest` matches the element itself too,
            // which is exactly right here — `[data-word]` is the element
            // that IS overflow-hidden and so is the one this loop finds.
            // This is a code-traceable tag, not a guess from the element's
            // description text.
            const isWordSpan = el.closest("[data-word]") !== null;
            // Was this element ALREADY clipping before the root font-size
            // changed? If so, OS text scaling did not cause it — see the
            // `restOverflow` comment above.
            const wasClippedAtRest = restOverflow.get(el) === true;
            clipped.push({
              desc: describe(el),
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              isWordSpan,
              wasClippedAtRest,
            });
          }
        }

        // Intersections among text blocks, post-scale.
        //
        // **Ancestor/descendant pairs are excluded, and that exclusion is load-
        // bearing rather than tidiness.** `textEls` picks up every element with
        // its OWN direct text node, which means a link like `<a>Mahua
        // Vann<span>Pench</span></a>` yields BOTH the `<a>` (own text "Mahua
        // Vann") and the nested `<span>` ("Pench") as separate "text blocks" —
        // and the parent's rect necessarily contains the child's by
        // construction, every time, scale or no scale. Comparing them as if
        // they were independent siblings would flag every such wrapper as a
        // permanent, guaranteed "intersection" that means nothing: a container
        // overlapping its own child is not two blocks colliding, it is nesting.
        // Only SIBLING-shaped pairs — two blocks where neither contains the
        // other — can represent a real defect (type that has grown into an
        // unrelated neighbour).
        const rects = textEls
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { el, desc: describe(el), x: r.x, y: r.y, w: r.width, h: r.height };
          })
          .filter((r) => r.w > 0 && r.h > 0);
        // Uncapped for the same reason as `clipped`, above — see its comment.
        // `EPS2` is the same constant hoisted above, shared with the
        // rest-state snapshot.
        const intersections = [];
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i];
            const b = rects[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const overlapsX = a.x < b.x + b.w - EPS2 && a.x + a.w > b.x + EPS2;
            const overlapsY = a.y < b.y + b.h - EPS2 && a.y + a.h > b.y + EPS2;
            if (overlapsX && overlapsY) {
              // Task 5, additive (see the `clipped` loop above for the same
              // tag on the other half of assertion 6): true when EITHER side
              // of the pair is a `SplitLines` per-word mask's own text node
              // (`[data-line-inner]`, nested inside `[data-word]`).
              const isWordSpan = a.el.closest("[data-word]") !== null || b.el.closest("[data-word]") !== null;
              // Fix round 1, additive: does this exact pair (by the same
              // `"a × b"` signature) already intersect at rest, before the
              // root font-size changes? The intersection-half analogue of
              // `wasClippedAtRest` above.
              const pair = `${a.desc} × ${b.desc}`;
              const wasIntersectingAtRest = restIntersectionSigs.has(pair);
              intersections.push({ pair, isWordSpan, wasIntersectingAtRest });
            }
          }
        }

        // Non-scaling elements: computed font-size unchanged by a root-level
        // scale — the measured PROXY for "declares a px font size", per this
        // rig's own header comment on why an outcome is checked rather than a
        // declared unit grepped for.
        const after = textEls.map((el) => parseFloat(getComputedStyle(el).fontSize));
        let nonScaling = 0;
        const nonScalingSample = [];
        for (let i = 0; i < textEls.length; i++) {
          if (Math.abs(after[i] - before[i]) < 0.05) {
            nonScaling += 1;
            // Task 5, additive: the actual before/after px, not just a
            // description — needed to tell "genuinely fixed px" (before ===
            // after exactly) apart from "a CSS clamp() whose vw-driven
            // middle term happens to still be the operative bound at both
            // scales", which reads identically as "non-scaling" here but is
            // a different mechanism (`unmeasured.md` §1).
            if (nonScalingSample.length < 10) {
              nonScalingSample.push({
                desc: describe(textEls[i]),
                beforePx: Number(before[i].toFixed(2)),
                afterPx: Number(after[i].toFixed(2)),
              });
            }
          }
        }

        document.documentElement.style.fontSize = "";

        return {
          clipped,
          intersections,
          textElsChecked: textEls.length,
          nonScaling,
          nonScalingSample,
        };
      }, scale);

      // Task 5, additive: split each of assertion 6's two failure kinds into
      // the `SplitLines` per-word reveal-span artefact class and everything
      // else, using the `isWordSpan` tag computed in-browser above (real
      // code — `closest("[data-word]")` — not a guess from the message
      // text). `clippedCount`/`intersectionCount` are UNCHANGED: still the
      // full, untagged totals assertion 6 has always reported; the fields
      // below are a strictly additive breakdown of that same total, never a
      // different number for it. See `unmeasured.md` §1.
      //
      // A second, orthogonal split on `clipped` only: `wasClippedAtRest`
      // separates a PRE-EXISTING overflow (`.drift-frame`'s own
      // intentionally-oversized photograph, clipping at 100% scale before
      // this rig ever touches the root font-size) from one that only
      // appears once the scale changes — the second artefact class this
      // task found, distinct from the word-span one. `clippedGenuineNew` is
      // what remains once BOTH known artefact classes are removed: neither a
      // per-word reveal mask nor an element that was already clipping at
      // rest for an unrelated, by-design reason.
      const clippedWordSpan = result.clipped.filter((c) => c.isWordSpan).length;
      const intersectionWordSpan = result.intersections.filter((p) => p.isWordSpan).length;
      const clippedAtRest = result.clipped.filter((c) => c.wasClippedAtRest).length;
      const clippedGenuineNew = result.clipped.filter((c) => !c.isWordSpan && !c.wasClippedAtRest).length;
      // Fix round 1, additive: the intersection-half analogue of
      // `clippedAtRest`/`clippedGenuineNew` above, using `wasIntersectingAtRest`
      // computed in-browser from the new `restIntersectionSigs` snapshot.
      // `intersectionAtRest` counts every pair (word-span or not) that
      // already intersected at rest; `intersectionGenuineNew` is the same
      // AND-exclusion `clippedGenuineNew` uses (neither a word-span mask nor
      // already-intersecting at rest) — see `unmeasured.md` §1.4 for what
      // this found on the 201 previously-unclassified "real" intersections.
      const intersectionAtRest = result.intersections.filter((p) => p.wasIntersectingAtRest).length;
      const intersectionGenuineNew = result.intersections.filter(
        (p) => !p.isWordSpan && !p.wasIntersectingAtRest,
      ).length;
      shapeReport.textScaling[scale] = {
        textElsChecked: result.textElsChecked,
        nonScaling: result.nonScaling,
        nonScalingSample: result.nonScalingSample,
        clippedCount: result.clipped.length,
        clippedWordSpanCount: clippedWordSpan,
        clippedOtherCount: result.clipped.length - clippedWordSpan,
        clippedAtRestCount: clippedAtRest,
        clippedGenuineNewCount: clippedGenuineNew,
        intersectionCount: result.intersections.length,
        intersectionWordSpanCount: intersectionWordSpan,
        intersectionOtherCount: result.intersections.length - intersectionWordSpan,
        intersectionAtRestCount: intersectionAtRest,
        intersectionGenuineNewCount: intersectionGenuineNew,
      };

      for (const c of result.clipped) {
        const tag = c.isWordSpan
          ? " [word-span artefact]"
          : c.wasClippedAtRest
            ? " [pre-existing at rest, e.g. drift-frame]"
            : "";
        fail(
          6,
          `${where} @ ${scale}`,
          `${c.desc} clips at ${scale} root text scale — scrollHeight ${c.scrollHeight} over clientHeight ${c.clientHeight}${tag}`,
        );
      }
      for (const p of result.intersections) {
        const tag = p.isWordSpan
          ? " [word-span artefact]"
          : p.wasIntersectingAtRest
            ? " [pre-existing at rest]"
            : "";
        fail(
          6,
          `${where} @ ${scale}`,
          `text blocks intersect at ${scale} root text scale — ${p.pair}${tag}`,
        );
      }
    }

    routeReport.shapes.push(shapeReport);
    await context.close();
  }

  routeReports.push(routeReport);
}

await browser.close();

/*
 * Assertion 4's own comparison — done here, once, after every route/shape has
 * been read, against a PRIOR run's committed figures. With no `--baseline`
 * given (this task's own first run) there is nothing to compare against, so
 * this establishes rather than fails — the file this run writes out becomes
 * the figure a later run can point `--baseline` at.
 */
let baselineData = null;
if (BASELINE_PATH) {
  try {
    baselineData = JSON.parse(await readFile(BASELINE_PATH, "utf8"));
  } catch {
    console.log(`--baseline ${BASELINE_PATH} could not be read — treating this run as the baseline instead.`);
  }
}

if (baselineData) {
  for (const routeReport of routeReports) {
    const priorRoute = baselineData.routes?.find((r) => r.route === routeReport.route);
    if (!priorRoute) continue;
    for (const shapeReport of routeReport.shapes) {
      const priorShape = priorRoute.shapes?.find((s) => s.shape === shapeReport.shape);
      const priorMin = priorShape?.smallestFontPx;
      if (priorMin == null || shapeReport.smallestFontPx == null) continue;
      if (shapeReport.smallestFontPx < priorMin - 0.05) {
        fail(
          4,
          `${routeReport.route} @ ${shapeReport.shape}`,
          `smallest rendered font dropped to ${shapeReport.smallestFontPx}px from the recorded ${priorMin}px (${shapeReport.smallestFontEl ?? "unknown element"})`,
        );
      }
    }
  }
} else {
  console.log(
    "Assertion 4 (type floor) has no --baseline to compare against — this run's own figures ARE the baseline being established.",
  );
}

const report = {
  base: BASE,
  routes: routeReports,
  baselineComparedAgainst: BASELINE_PATH ?? null,
  failures,
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Checked ${ROUTES.length} routes × ${SHAPES.length} shapes = ${ROUTES.length * SHAPES.length} loads.`);
for (const routeReport of routeReports) {
  const worstUnder24 = Math.max(...routeReport.shapes.map((s) => s.under24));
  const worstUnder44 = Math.max(...routeReport.shapes.map((s) => s.under44Warning));
  const minFont = Math.min(...routeReport.shapes.map((s) => s.smallestFontPx ?? Infinity));
  console.log(
    `  ${routeReport.route}: worst under-24 ${worstUnder24}, worst under-44 (warning) ${worstUnder44}, smallest font ${minFont}px`,
  );
}
console.log(`Wrote ${OUT}`);

if (failures.length === 0) {
  console.log("\nPASS — 6 assertions across 3 routes × 8 shapes.");
} else {
  console.error(`\nFAILED: ${failures.length} finding(s)`);
  for (const f of failures.slice(0, 60)) {
    console.error(`  [${f.assertion}] ${f.where}: ${f.message}`);
  }
  if (failures.length > 60) console.error(`  … and ${failures.length - 60} more`);
}
process.exitCode = failures.length === 0 ? 0 : 1;
