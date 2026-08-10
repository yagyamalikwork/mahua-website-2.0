// Worst-pixel contrast for every text run laid over a photograph.
//
// CLAUDE.md: "Text laid over a photograph (hero, full-bleed quotes) needs its own
// check — a scrim or equivalent, verified by a contrast test against the actual
// rendered result, not assumed from the image looking dark enough." `lib/
// palette.test.ts` cannot do this: it knows two flat colours, and a photograph is
// neither. Only a browser can answer it.
//
// Task 7 built this measurement and left it in a scratchpad, which is how
// `verification.json` came to disagree with the report it was evidence for. It
// lives here now so the committed numbers can be re-derived by anyone.
//
// **Method.** For each run: scroll it into view, hide every text node in its
// container (so nothing reflows), screenshot the viewport, crop to each of the
// run's own boxes, and take the BRIGHTEST SINGLE PIXEL — the worst case for cream
// type. Not the mean, not the 99th percentile. Headlines are measured per word
// (`[data-word]`) so an empty gutter beside a short line cannot flatter the
// result. Deliberately not `page.screenshot({ clip })`, whose origin is ambiguous
// once the page has scrolled.
//
// Re-run whenever a scrim, a photograph, or the file served for one changes:
//   npx next start -p 3100 &
//   node scripts/check_contrast_over_photos.mjs

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/contrast-over-photos.json");
const WIDTHS = flag("widths", "390,768,1440,1920").split(",").map(Number);

/** The type colour over every photograph on the page — cream, not white. */
const CREAM = [0xf1, 0xe9, 0xd7];
/** `PALETTE.ink` — the header's menu label once the bar has gone cream. */
const INK = [0x31, 0x40, 0x2c];
/** `PALETTE.brand` — the client's own wordmark brown, on the cream bar only. */
const BRAND = [0x7f, 0x5c, 0x24];
/** `PALETTE.dim` — the page's lighter body colour, and the one the forest tint's floor is set by. */
const DIM = [0x5a, 0x52, 0x40];
/** `PALETTE.overlay` — the pill's label, on gold, in both header states. */
const OVERLAY = [0x23, 0x2b, 0x21];

const luminance = (rgb) =>
  rgb
    .map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4)))
    .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);

/**
 * The contrast one background pixel gives one type colour.
 *
 * `text` defaults to cream because that is what every run measured before 5 Aug
 * 2026: cream is the only colour type takes over a photograph. The header's
 * scrolled state broke that assumption — the menu is `ink`, the wordmark is
 * `brand` — and a rig that assumed cream would have reported the *opposite* of
 * the truth there, scoring a dark-on-cream run by how bright its background was.
 *
 * The worst-pixel search below is unchanged and needs no direction: it takes the
 * minimum ratio over every pixel in the crop, which finds the brightest pixel
 * under cream type and the darkest one under dark type, without being told which.
 */
const ratio = (rgb, text = CREAM) => {
  const [hi, lo] = [luminance(rgb), luminance(text)].sort((a, b) => b - a);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
};

/**
 * `min` is 3.0 for display type (WCAG large text) and 4.5 for body and links.
 * `container` is what gets its text hidden — hiding only the run itself would
 * leave its neighbours in the crop and measure cream against cream.
 *
 * `text` is the colour the type is set in, defaulting to cream.
 *
 * `hide` is how the container's type is taken out of the frame, and the default
 * is `visibility`. `color` exists for a run whose own element carries the
 * background being measured: the pill is a solid gold `<a>` with its label
 * inside it, and `visibility: hidden` on that `<a>` takes the gold with it and
 * measures whatever is behind the pill instead of the pill.
 *
 * **The pill's runs target the label's `<span>`, not the `<a>`.** The `<a>` is
 * `rounded-full`, so its own rectangle includes four corners that are not gold
 * at all — over the hero photograph the darkest pixel in that rectangle was
 * [36,43,29] and this run reported 1.00:1 for a pill that measures 4.92:1
 * wherever a letter actually sits. The rectangle to crop is the one the glyphs
 * are in. See `components/ui/PillButton.tsx`.
 *
 * **The header is measured in both of its states** (5 Aug 2026, when it became
 * `fixed`). The scrolled runs sit at `#why-you-came`, which is deliberate and not
 * arbitrary: it is a full-bleed photograph, so the header is over an image there.
 * If the cream bar ever failed to arrive, these runs would be measuring dark type
 * on a photograph and would fail loudly. Parked over a cream chapter they would
 * pass whether the bar was there or not, which is a check that cannot fail.
 */
const HOME_RUNS = [
  { name: "header · menu", min: 4.5, at: "#arrival", container: "header", sel: "[aria-controls='site-menu']" },
  {
    name: "header · wordmark",
    min: 4.5,
    at: "#arrival",
    container: "header",
    // Targeted by attribute, not by structure. `header > div > p` was the
    // selector until 5 Aug 2026, when the wordmark became part of a flower+name
    // lockup and stopped being a `<p>`. Nothing failed — the run simply reported
    // "not visible", which this script used to treat as neither pass nor fail.
    sel: '[data-contrast="brand-wordmark"]',
  },
  {
    name: "header · pill",
    min: 4.5,
    at: "#arrival",
    container: "header",
    sel: "[data-contrast='header-pill'] a span",
    text: OVERLAY,
    hide: "color",
  },
  { name: "hero · headline", min: 3, at: "#arrival", container: "#arrival", sel: "#arrival h1 [data-word]" },
  /*
   * `03 · The Forest` carries a tinted drawing between its cream and its
   * content as of 10 Aug 2026, so its type is now text over imagery and belongs
   * in this rig like any other.
   *
   * `scripts/build_forest_overlay.mjs` already refuses to emit a tint that would
   * put `PALETTE.dim` under 4.5:1 on its own darkest pixel — but that is
   * arithmetic on the file, and this is the rendered page. The two have
   * disagreed before on this project; the build maths cannot see a mask, a
   * scale, or a second thing painted on top.
   */
  {
    name: "forest · headline",
    min: 3,
    at: "#forest",
    container: "#forest",
    sel: "#forest h2 [data-word]",
    // Ink, not cream. The default here is cream because almost every run in this
    // rig sits on a photograph; this chapter's type sits on paper, and measuring
    // cream against a cream-tinted backdrop reads 1:1 — which is what it did.
    text: INK,
  },
  {
    name: "forest · intro",
    min: 4.5,
    at: "#forest",
    container: "#forest",
    sel: '#forest [data-contrast="plate-intro"]',
    text: DIM,
  },
  { name: "hero · sub", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival > div > p" },
  { name: "hero · scroll cue", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival div.flex > span:nth-child(2)" },
  {
    name: "header scrolled · menu",
    min: 4.5,
    at: "#why-you-came",
    container: "header",
    sel: "[aria-controls='site-menu']",
    text: INK,
  },
  {
    name: "header scrolled · wordmark",
    min: 4.5,
    at: "#why-you-came",
    container: "header",
    sel: '[data-contrast="brand-wordmark"]',
    text: BRAND,
  },
  {
    name: "header scrolled · pill",
    min: 4.5,
    at: "#why-you-came",
    container: "header",
    sel: "[data-contrast='header-pill'] a span",
    text: OVERLAY,
    hide: "color",
  },
  { name: "quote · why-you-came", min: 3, at: "#why-you-came", container: "#why-you-came", sel: "#why-you-came [data-word]" },
  { name: "quote · after-dark", min: 3, at: "#after-dark", container: "#after-dark", sel: "#after-dark [data-word]" },
  { name: "invitation · heading", min: 3, at: "#invitation", container: "#invitation", sel: "#invitation h2 span" },
  { name: "invitation · body", min: 4.5, at: "#invitation", container: "#invitation", sel: "#invitation p" },
];

/**
 * The property pages' shared probe set. Same header and hero runs as the home
 * page's, retargeted at that page's own hero id — the selectors are the same
 * because `Hero` and `SiteHeader` are the same components.
 *
 * `scrolledAt` should be a chapter where the scrolled header sits over a
 * photograph, so a missing cream bar fails loudly (the home page's own rule
 * above). Tola has one — the full-bleed guest quote (`#tola-guest-word`).
 *
 * **Vann's own scrolled anchor moved on 9/10 Aug 2026, Task 15.** It was
 * `#vann-rooms`, a cream showcase band, with a comment here claiming "Vann
 * has no full-bleed chapter below its hero at all" — true of the page this
 * rig was first written against, false of the shape-vocabulary redesign that
 * shipped in `05d8925`: `vann-table` ("04 · The Table") is now a `fullBleed`
 * chapter with a photograph under it. `#vann-rooms` was a probe that could
 * never fail the way its home-page counterpart can, exactly the weakness the
 * comment it replaced flagged and then left unfixed. `scrolledAt` is now
 * `#vann-table`, which is also where the new quote probe below reads its
 * type.
 */
const propertyRuns = (heroId, scrolledAt) => [
  { name: "header · menu", min: 4.5, at: `#${heroId}`, container: "header", sel: "[aria-controls='site-menu']" },
  { name: "header · wordmark", min: 4.5, at: `#${heroId}`, container: "header", sel: '[data-contrast="brand-wordmark"]' },
  {
    name: "header · pill",
    min: 4.5,
    at: `#${heroId}`,
    container: "header",
    sel: "[data-contrast='header-pill'] a span",
    text: OVERLAY,
    hide: "color",
  },
  { name: "hero · headline", min: 3, at: `#${heroId}`, container: `#${heroId}`, sel: `#${heroId} h1 [data-word]` },
  { name: "hero · sub", min: 4.5, at: `#${heroId}`, container: `#${heroId}`, sel: `#${heroId} > div > p` },
  { name: "hero · scroll cue", min: 4.5, at: `#${heroId}`, container: `#${heroId}`, sel: `#${heroId} div.flex > span:nth-child(2)` },
  { name: "header scrolled · menu", min: 4.5, at: scrolledAt, container: "header", sel: "[aria-controls='site-menu']", text: INK },
  { name: "header scrolled · wordmark", min: 4.5, at: scrolledAt, container: "header", sel: '[data-contrast="brand-wordmark"]', text: BRAND },
  {
    name: "header scrolled · pill",
    min: 4.5,
    at: scrolledAt,
    container: "header",
    sel: "[data-contrast='header-pill'] a span",
    text: OVERLAY,
    hide: "color",
  },
];

/**
 * Which probe set a URL gets, by pathname. An unknown route is fatal, not a
 * silent pass: the committed vann-contrast.json of 8 Aug 2026 was this script
 * running the home page's probes against /mahua-vann — seven "not found"
 * targets, an exit code of 1, and the artefact still landed in a commit that
 * said "verified". A rig must refuse to measure a page it has no probes for.
 */
const RUN_SETS = {
  "/": HOME_RUNS,
  "/mahua-vann": [
    ...propertyRuns("vann-hero", "#vann-table"),
    // `vann-table` renders as `FullBleedQuote` — type over a photograph —
    // and until Task 15 (9/10 Aug 2026) had never been measured: it fell
    // through to that component's generic default scrim
    // (`{ flat: 0.4, centre: 0.4 }`), tuned for no composition in particular.
    // Added alongside `tola-table`'s equivalent below.
    { name: "quote · vann-table", min: 3, at: "#vann-table", container: "#vann-table", sel: "#vann-table [data-word]" },
  ],
  "/mahua-tola": [
    ...propertyRuns("tola-hero", "#tola-guest-word"),
    { name: "quote · tola-guest-word", min: 3, at: "#tola-guest-word", container: "#tola-guest-word", sel: "#tola-guest-word [data-word]" },
    // `tola-table`, this page's other generic-scrim `FullBleedQuote` chapter
    // — same gap `vann-table` had, closed the same way, Task 15.
    { name: "quote · tola-table", min: 3, at: "#tola-table", container: "#tola-table", sel: "#tola-table [data-word]" },
  ],
};

async function measure(page, run) {
  // A missing scroll anchor is a missing target, full stop. Until 9 Aug 2026
  // this fell through to `?? 0` and measured wherever the page already was —
  // which is how the home page's "header scrolled" probes, run against
  // /mahua-vann where `#why-you-came` does not exist, asserted the scrolled
  // palette against the un-scrolled hero and reported 1.04:1 "failures" for
  // a header that was actually fine.
  const anchored = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    return true;
  }, run.at);
  if (!anchored) return { name: run.name, min: run.min, worst: null, boxes: 0, pass: null };
  // Long enough for parallax and any reveal to have finished; the measurement is
  // of the settled frame, which is the one the visitor reads.
  await page.waitForTimeout(1500);

  const boxes = await page.evaluate(
    ({ sel }) =>
      Array.from(document.querySelectorAll(sel))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= window.innerHeight)
        .map((r) => ({
          x: Math.max(0, Math.floor(r.x)),
          y: Math.max(0, Math.floor(r.y)),
          w: Math.ceil(r.width),
          h: Math.ceil(r.height),
        })),
    { sel: run.sel },
  );
  if (boxes.length === 0) return { name: run.name, min: run.min, worst: null, boxes: 0, pass: null };

  await page.evaluate(({ container, hide }) => {
    // `button` matters: the header's own run *is* a button, and leaving it
    // visible measures its cream label against cream and reports 1.06:1.
    const tags = ["h1", "h2", "p", "span", "a", "cite", "button"];
    for (const e of document.querySelectorAll(tags.map((t) => `${container} ${t}`).join(", "))) {
      // The exact inline style, kept so it can be put back exactly. Clearing the
      // properties this script sets is not the same thing: `PillButton` carries
      // its own inline `color`, and a blanket `style.color = ""` afterwards
      // *deleted* it — the pill went on being measured with a label colour it
      // does not have, in every run after the first.
      e.dataset.rigStyle = e.getAttribute("style") ?? "";
      // `visibility: hidden` takes the element's own background with it, which
      // is right for type laid over a photograph and wrong for type laid on a
      // solid pill. `color: transparent` removes the glyphs and leaves the fill.
      if (hide === "color") e.style.color = "transparent";
      else e.style.visibility = "hidden";
    }
  }, { container: run.container, hide: run.hide ?? "visibility" });
  await page.waitForTimeout(150);
  const shot = await page.screenshot();
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("[data-rig-style]")) {
      const original = e.dataset.rigStyle;
      if (original) e.setAttribute("style", original);
      else e.removeAttribute("style");
      delete e.dataset.rigStyle;
    }
  });

  const text = run.text ?? CREAM;
  let worst = Number.POSITIVE_INFINITY;
  /** The pixel that gave `worst` — brightest under cream type, darkest under dark. */
  let brightest = [0, 0, 0];
  for (const b of boxes) {
    const { data, info } = await sharp(shot)
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      const px = [data[i], data[i + 1], data[i + 2]];
      const r = ratio(px, text);
      if (r < worst) {
        worst = r;
        brightest = px;
      }
    }
  }
  return {
    name: run.name,
    min: run.min,
    text: `#${text.map((c) => c.toString(16).padStart(2, "0")).join("")}`,
    worst,
    brightest,
    boxes: boxes.length,
    pass: worst >= run.min,
  };
}

async function main() {
  const pathname = new globalThis.URL(URL).pathname.replace(/\/$/, "") || "/";
  const RUNS = RUN_SETS[pathname];
  if (!RUNS) {
    console.error(
      `FAILED: no probe set for "${pathname}". Add one to RUN_SETS — refusing to run another ` +
        `page's probes and call the result evidence.`,
    );
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch();
  const report = { measuredAt: new Date().toISOString(), url: URL, widths: {} };
  let failures = 0;
  /**
   * A target this script was asked to measure and could not find.
   *
   * Counted separately and still fatal. Until 5 Aug 2026 an unfindable target
   * printed "not visible" and was neither a pass nor a failure, so when the
   * header wordmark stopped being a `<p>` the check quietly stopped running and
   * the suite stayed green — cream type over a photograph, unmeasured, for as
   * long as nobody read the log. A contrast target that cannot be located is a
   * broken check, and a broken check is worse than a failing one because it
   * looks like success.
   */
  let missing = 0;

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 900 },
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const rows = [];
    for (const run of RUNS) rows.push(await measure(page, run));
    report.widths[width] = rows;

    console.log(`--- ${width}px ---`);
    for (const r of rows) {
      if (r.pass === false) failures++;
      if (r.pass === null) missing++;
      console.log(
        `  ${r.name.padEnd(24)} floor ${String(r.min).padEnd(4)} worst ${String(r.worst).padEnd(6)} ${
          r.pass === null ? "NOT FOUND" : r.pass ? "ok" : "FAIL"
        }`,
      );
    }
    await context.close();
  }

  await browser.close();
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${OUT}`);

  if (failures > 0) {
    console.error(`FAILED: ${failures} text run(s) below their contrast floor over a photograph.`);
    process.exitCode = 1;
  }

  if (missing > 0) {
    console.error(
      `FAILED: ${missing} target(s) could not be found on the page. Either the markup moved and the ` +
        `selector needs updating, or the run genuinely no longer exists and should be deleted from RUNS. ` +
        `A target that is silently skipped is an unmeasured piece of type over a photograph.`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
