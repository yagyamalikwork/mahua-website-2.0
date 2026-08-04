// The pictures behind the report: every chapter at four widths, and the scroll
// choreography caught in the act.
//
// Task 7 produced its screenshots from a rig that lived in a scratchpad and was
// gone by the time anyone looked at the frames, so nobody could re-shoot them
// against a later commit. This is that rig, kept.
//
// Two things it captures:
//
//   1. **Per chapter, per width.** `window.scrollTo` to each `<section id>`,
//      settle, screenshot. Written as WebP because the set is 48 frames and a
//      PNG set is ~90 MB.
//   2. **Mid-reveal triples.** The client's complaint was "no scroll animation".
//      A settled frame cannot answer it — a page with no animation at all
//      produces the same picture. So each chapter is entered fresh from the top
//      at **three progressively deeper scroll offsets** and photographed while
//      the reveal is still running, with the mask's `scaleY` and each headline
//      line's `translateY` recorded alongside. A frame showing a half-drawn mask
//      is the evidence; the numbers are what make it checkable. A fourth frame
//      shows the same chapter settled, for comparison.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/capture_chapters.mjs --out docs/reviews/2026-08-03-chapters

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-03-chapters");
const WIDTHS = flag("widths", "390,768,1440,1920").split(",").map(Number);

const heightFor = (width) => (width === 390 ? 844 : width === 768 ? 1024 : width === 1920 ? 1080 : 900);

/** Chapters whose entrance is worth three frames — one masked photograph, one staggered headline. */
const MID_REVEAL = ["forest", "rooms", "guests"];

/**
 * What the motion primitives are doing right now, read off the live elements.
 *
 * **Mask coverage is the mask's rendered height over its container's, never its
 * `transform`.** `new DOMMatrixReadOnly("none")` does not throw — it returns the
 * identity matrix, whose `d` is 1, so a mask that is doing nothing reads as
 * fully covering. Task 5's review recorded that trap; the first version of this
 * rig fell into it anyway and reported eight chapters stuck behind masks under
 * reduced motion. Their real rendered height was 0.
 */
function motionState() {
  const coverage = (el) => {
    const box = el.parentElement?.getBoundingClientRect();
    const mask = el.getBoundingClientRect();
    if (!box || box.height === 0) return 0;
    return Number(Math.min(1, mask.height / box.height).toFixed(3));
  };
  const translateY = (el) => {
    const t = getComputedStyle(el).transform;
    if (t === "none") return 0;
    return Number(new DOMMatrixReadOnly(t).f.toFixed(1));
  };
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };
  return {
    scrollY: Math.round(window.scrollY),
    // The image masks: 1 covers the photograph completely, 0 is fully revealed.
    masksCovering: Array.from(document.querySelectorAll("[data-image-mask]"))
      .filter(onScreen)
      .map(coverage),
    // Headline lines still displaced from their resting position.
    linesDisplaced: Array.from(document.querySelectorAll("[data-line-inner]"))
      .filter(onScreen)
      .map(translateY)
      .filter((v) => Math.abs(v) > 0.5),
    linesOnScreen: Array.from(document.querySelectorAll("[data-line-inner]")).filter(onScreen).length,
  };
}

async function toWebp(page, file) {
  const png = `${file}.png`;
  await page.screenshot({ path: png });
  await sharp(png).webp({ quality: 82 }).toFile(`${file}.webp`);
  await unlink(png);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { measuredAt: new Date().toISOString(), url: URL, widths: {}, midReveal: [] };

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: heightFor(width) } });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1800);

    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main section[id]")).map((s) => s.id),
    );
    if (ids.length === 0) throw new Error("No `main section[id]` found — nothing to capture.");

    const captured = [];
    for (const [i, id] of ids.entries()) {
      await page.evaluate((sel) => {
        const el = document.getElementById(sel);
        window.scrollTo(0, (el?.getBoundingClientRect().top ?? 0) + window.scrollY);
      }, id);
      // Long enough for the reveal, the stagger and Lenis's easing to finish:
      // these frames are meant to show the settled page.
      await page.waitForTimeout(1600);
      const name = `w${width}-${String(i).padStart(2, "0")}-${id}`;
      await toWebp(page, path.join(OUT, name));
      captured.push(`${name}.webp`);
    }
    report.widths[width] = captured;
    console.log(`${width}px — ${captured.length} frames`);
    await context.close();
  }

  // Mid-reveal triples, at 1440 only: this is about the choreography, not the
  // breakpoint.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1800);

  /** How far short of the chapter's top to land, and how long to wait before the shutter. */
  const OFFSETS = [
    { name: "a-entering", short: 460, settle: 120 },
    { name: "b-halfway", short: 240, settle: 200 },
    { name: "c-arrived", short: 40, settle: 280 },
    { name: "d-settled", short: 40, settle: 1800 },
  ];

  for (const id of MID_REVEAL) {
    const frames = [];
    for (const step of OFFSETS) {
      // Back to the top before each one, so the chapter is entered fresh rather
      // than already played out. Its staged state is applied while it is still
      // below the fold, which is the only way this reveal exists to be caught.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);
      await page.evaluate(
        ({ sel, short }) => {
          const el = document.getElementById(sel);
          window.scrollTo(0, (el?.getBoundingClientRect().top ?? 0) + window.scrollY - short);
        },
        { sel: id, short: step.short },
      );
      await page.waitForTimeout(step.settle);
      const state = await page.evaluate(motionState);
      const name = `motion-${id}-${step.name}`;
      await toWebp(page, path.join(OUT, name));
      frames.push({ file: `${name}.webp`, landedShortBy: step.short, msAfterLanding: step.settle, ...state });
    }
    report.midReveal.push({ id, frames });
    const covering = frames.map((f) => (f.masksCovering.length ? Math.max(...f.masksCovering) : 0));
    console.log(
      `mid-reveal ${id.padEnd(12)} mask coverage ${covering.join(" → ")}, ` +
        `lines displaced ${frames.map((f) => f.linesDisplaced.length).join(" → ")}`,
    );
  }

  await context.close();

  // Reduced motion: every section has to be visible and readable, with nothing
  // left pinned behind a mask. The failure this guards against is not "the
  // animation still plays" but "the animation never plays and the content stays
  // hidden", which is worse than motion and invisible to a unit test.
  const still = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const stillPage = await still.newPage();
  await stillPage.goto(URL, { waitUntil: "load" });
  await stillPage.waitForTimeout(1500);

  const stillIds = await stillPage.evaluate(() =>
    Array.from(document.querySelectorAll("main section[id]")).map((s) => s.id),
  );
  report.reducedMotion = [];
  for (const id of stillIds) {
    await stillPage.evaluate((sel) => {
      const el = document.getElementById(sel);
      window.scrollTo(0, (el?.getBoundingClientRect().top ?? 0) + window.scrollY);
    }, id);
    await stillPage.waitForTimeout(700);
    const state = await stillPage.evaluate((sel) => {
      const root = document.getElementById(sel);
      const onScreen = (el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      };
      // Rendered height, not `transform` — see the note on `motionState`.
      const covering = Array.from(root.querySelectorAll("[data-image-mask]"))
        .filter(onScreen)
        .map((el) => {
          const box = el.parentElement?.getBoundingClientRect();
          if (!box || box.height === 0) return 0;
          return Number(Math.min(1, el.getBoundingClientRect().height / box.height).toFixed(3));
        })
        .filter((d) => d > 0.01);
      const displaced = Array.from(root.querySelectorAll("[data-line-inner]"))
        .filter(onScreen)
        .map((el) => {
          const t = getComputedStyle(el).transform;
          return t === "none" ? 0 : Number(new DOMMatrixReadOnly(t).f.toFixed(1));
        })
        .filter((v) => Math.abs(v) > 0.5);
      // Photographs actually painting, not merely present in the DOM.
      const imagesDrawn = Array.from(root.querySelectorAll("img")).filter(
        (img) => img.complete && img.naturalWidth > 0 && onScreen(img),
      ).length;
      const textVisible = Array.from(root.querySelectorAll("h1,h2,h3,p,li,figcaption")).filter(
        (el) => onScreen(el) && el.textContent.trim() && Number(getComputedStyle(el).opacity) > 0.9,
      ).length;
      return { masksStillCovering: covering, linesStillDisplaced: displaced, imagesDrawn, textVisible };
    }, id);
    report.reducedMotion.push({ id, ...state });
  }
  await toWebp(stillPage, path.join(OUT, "reduced-motion-1440-midpage"));
  await still.close();

  const stuck = report.reducedMotion.filter(
    (r) => r.masksStillCovering.length > 0 || r.linesStillDisplaced.length > 0,
  );
  console.log(
    `reduced motion — ${report.reducedMotion.length} chapters, ` +
      `${stuck.length} with anything stuck behind a mask or displaced`,
  );

  await browser.close();

  const out = path.join(OUT, "captures.json");
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${out}`);

  // A triple where nothing changed is not evidence of animation; say so rather
  // than leaving three identical frames in a folder called evidence.
  const flat = report.midReveal.filter((m) => {
    const values = m.frames.flatMap((f) => [...f.masksCovering, ...f.linesDisplaced]);
    return values.length === 0 || new Set(values.map((v) => v.toFixed(2))).size <= 1;
  });
  if (flat.length) {
    console.error(
      `WARNING: nothing measurably moved in ${flat.map((f) => f.id).join(", ")} — ` +
        `either the reveal had already run or it is not running at all.`,
    );
    process.exitCode = 1;
  }
  if (stuck.length) {
    console.error(
      `FAILED: under prefers-reduced-motion, ${stuck.map((s) => s.id).join(", ")} still has ` +
        `content hidden behind a mask or displaced.`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
