// Did the responsive-image change soften anything?
//
// A `srcset` is only as good as its `sizes`, and an under-stated `sizes` is
// invisible in code review and invisible in a test — it shows up as a slightly
// soft photograph on one viewport width and not another. This walks the whole
// page at several widths and, for every `<img>`, compares the file the browser
// actually chose against the pixels it has to fill.
//
// ## What "enough pixels" means since 4 Aug 2026
//
// It used to mean `clientWidth x devicePixelRatio` — serve every screen its own
// density, whatever that costs. Measuring that at DPR 3 for the first time (see
// lib/sizes.ts) put 595 KB of photographs on the first screen and the hero's
// `responseEnd` at 4,730 ms on Slow 4G. `lib/sizes.ts` now caps the density this
// site pays for at `DENSITY_CAP`, so the standard is
// `<pixels the browser has to paint> x min(devicePixelRatio, DENSITY_CAP)`.
//
// ## And what "the pixels it has to fill" means since 5 Aug 2026
//
// **`clientWidth` is not it, and this rig said it was for two days.** The header
// below argues at length that `naturalWidth` is an artefact of the `srcset`
// density correction — that is true and still true — and then quietly
// substituted a second artefact. `object-fit: cover` scales the photograph until
// it covers *both* axes and crops the overflow, so an image wider than its box
// is drawn far wider than the box and only the middle of it is visible. The
// browser still has to decode and paint every one of those pixels, and softness
// in the visible middle is exactly as visible as softness anywhere else.
//
// On a 390x844 phone the four full-screen photographs are 3:2 in a box roughly
// 0.36:1, so they are drawn 1,266-1,617 CSS px wide inside a 390 px box. This rig
// scored them 1.03 and reported `understatedSizes: 0` at all five viewports while
// the hero was being served 0.32 source pixels per CSS pixel. Every committed
// artefact it produced said the page was clean.
//
// So the drawn width is now computed from the box **and** the photograph's own
// intrinsic aspect ratio under the element's real `object-fit`, read off
// `getComputedStyle`. The intrinsic ratio survives the density correction that
// ruins `naturalWidth` — both dimensions are divided by the same number — so
// `naturalWidth / naturalHeight` is safe to use even though neither alone is.
//
// That is a restatement, not a relaxation, and the distinction matters:
//
//   - It still fails on the bug it was written for. An under-stated `sizes` —
//     50vw written next to a box that lays out at 100vw — serves half the pixels
//     the cap asks for and is caught at every DPR, including DPR 1, where the
//     cap does nothing at all.
//   - The cost of the cap is not hidden by it. `ratioAtDeviceDensity` is
//     reported for every photograph alongside the ratio being enforced, so what
//     a 3x screen gives up is a number in the artefact rather than a claim in a
//     commit message.
//   - It was run against the broken commit before it was trusted to pass — the
//     standard `scripts/check_menu.mjs` set on this project. See
//     `docs/reviews/2026-08-05-cover-sizes/`.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_image_resolution.mjs --out docs/reviews/2026-08-04-task-7/image-resolution.json

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Read out of `lib/sizes.ts` rather than copied here. A second hand-maintained
 * copy of the cap is a copy that goes stale silently, and this check would then
 * be enforcing a number the page no longer serves.
 */
async function readDensityCap() {
  const source = await readFile(path.join(ROOT, "lib", "sizes.ts"), "utf8");
  const m = /export const DENSITY_CAP = ([\d.]+)/.exec(source);
  if (!m) throw new Error("could not read DENSITY_CAP out of lib/sizes.ts");
  return Number(m[1]);
}

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-04-task-7/image-resolution.json");

const VIEWPORTS = [
  { width: 390, height: 844, dpr: 1 },
  { width: 390, height: 844, dpr: 3 },
  { width: 768, height: 1024, dpr: 1 },
  { width: 1440, height: 900, dpr: 1 },
  { width: 1920, height: 1080, dpr: 1 },
];

// `img.naturalWidth` is useless as an absolute here: once an image is chosen from
// a `srcset` with `w` descriptors, the HTML spec has the browser correct the
// intrinsic dimensions by the selected candidate's density, so `naturalWidth`
// comes back equal to the CSS layout width for *every* image and every ratio is
// exactly 1.00. The first version of this rig did that and reported a page-wide
// 0.33 at DPR 3 that was an artefact, not a photograph. The chosen file's real
// width is read off its own filename instead — the pipeline names every
// derivative `<id>-<width>.<ext>` — and the widest candidate offered is read off
// the `<source>`'s srcset, so a shortfall can be attributed to the right cause.
//
// The intrinsic *ratio* is a different matter, and close enough for this rig's
// purpose — but "is exact" (this comment's own claim until 14 Aug 2026) is
// false, and this project has since measured the gap. The correction divides
// both dimensions by the same density, but `naturalWidth`/`naturalHeight` are
// each `unsigned long` (WebIDL), so each is rounded to an integer
// INDEPENDENTLY after that division, not as a pair — and the ratio two
// independently-rounded integers form can drift from the file's true aspect.
// Measured, not assumed (`docs/reviews/2026-08-11-card-stack/card-stack.json`,
// Vann@1280x1024/"Deluxe"): `naturalWidth`/`naturalHeight` read `1094`/`729`
// for `vann-room-deluxe`, whose only file is `762x508` = exactly `1.5` — and
// `729 × 1.5 = 1093.5`, not an integer, so both reported numbers cannot be
// that one file's dimensions divided by a single common density and left
// otherwise alone. The drift is small (`(1094/729 − 1.5) / 1.5 ≈ 4.6×10⁻⁴`,
// about one part in 2,000) — small enough that `naturalWidth / naturalHeight`
// stays the right tool for THIS rig's own purpose (a coarse under-served
// check with tolerance to spare), which is why its behaviour is unchanged
// here. It is not free everywhere: `components/sections/RoomCard.tsx`'s
// `ROOM_PHOTO_MARGIN` exists specifically to absorb this exact drift, at the
// one place on this page (`check_card_stack.mjs`'s 25% crop bound) solved
// close enough to zero margin that it can cross the ceiling.
// It falls back to the `width`/`height` attributes, which this site's
// `<img>` always carries from the manifest, for a page that does not.
const report = (cap) => `(() => {
  const CAP = ${cap};
  const widthOf = (url) => {
    const m = /-(\\d+)\\.(?:avif|webp|jpg)$/.exec(new URL(url, location.href).pathname);
    return m ? Number(m[1]) : null;
  };

  // How wide the photograph is actually painted, which is not the box whenever
  // \`object-fit\` crops or letterboxes it. A 3:2 frame in a 0.36:1 full-screen box
  // under \`cover\` is drawn 4.1x the box's width; the browser decodes all of it.
  const drawnWidth = (img, ratio, fit) => {
    const boxW = img.clientWidth;
    const boxH = img.clientHeight;
    if (!boxW) return 0;
    if (!ratio || !boxH) return boxW;
    if (fit === "cover") return Math.max(boxW, boxH * ratio);
    if (fit === "contain") return Math.min(boxW, boxH * ratio);
    if (fit === "none") return img.naturalWidth || boxW;
    if (fit === "scale-down") return Math.min(img.naturalWidth || boxW, Math.min(boxW, boxH * ratio));
    return boxW; // fill — stretched to the box, so the box is the answer
  };

  const out = [];
  for (const img of document.querySelectorAll("img")) {
    if (!img.currentSrc) continue;
    const dpr = window.devicePixelRatio;
    const attrW = Number(img.getAttribute("width")) || 0;
    const attrH = Number(img.getAttribute("height")) || 0;
    const ratio =
      img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : attrW && attrH
          ? attrW / attrH
          : 0;
    const fit = getComputedStyle(img).objectFit || "fill";
    const drawn = drawnWidth(img, ratio, fit);
    const needed = Math.round(drawn * Math.min(dpr, CAP));
    if (needed === 0) continue;
    const fileWidth = widthOf(img.currentSrc);
    if (!fileWidth) continue;

    const source = img.parentElement && img.parentElement.querySelector('source[type="image/avif"]');
    const offered = source
      ? source.srcset.split(",").map((c) => Number(/(\\d+)w\\s*$/.exec(c.trim())?.[1] || 0))
      : [];
    const widest = offered.length ? Math.max.apply(null, offered) : fileWidth;

    out.push({
      file: new URL(img.currentSrc).pathname,
      fileWidth,
      widestOffered: widest,
      objectFit: fit,
      cssWidth: Math.round(img.clientWidth),
      // The number this rig got wrong until 5 Aug 2026. Kept beside \`cssWidth\`
      // deliberately: where the two differ, the difference is the crop.
      drawnWidth: Math.round(drawn),
      needed,
      ratio: Number((fileWidth / needed).toFixed(2)),
      // What this screen would have got with no cap. Not enforced; reported so
      // the price of the cap is visible in the artefact.
      ratioAtDeviceDensity: Number((fileWidth / (drawn * dpr)).toFixed(2)),
      // True when nothing wider exists for this photograph — the shortfall is
      // the image library's ceiling, not an under-stated \`sizes\`.
      atLibraryCeiling: fileWidth >= widest,
    });
  }
  return out;
})()`;

async function main() {
  const CAP = await readDensityCap();
  const REPORT = report(CAP);
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      await new Promise((r) => setTimeout(r, 800));
    });
    await page.waitForLoadState("networkidle").catch(() => {});

    // **Open the menu before reporting.** Its two lodge tiles are the largest
    // photographs on the site after the hero — half the panel each since 11 Aug
    // 2026 — and they are NOT in the document until the panel has been opened
    // once (`SiteMenu` gates them behind `everOpened`, so a visitor who never
    // opens the menu never pays for them). Scrolling the page cannot reveal
    // them.
    //
    // Until this was added the rig reported "0 under-served" across five
    // viewports on a build whose menu `sizes` had just been rewritten, and the
    // figure was true and meaningless: it had never seen the images in
    // question. That is this project's most-repeated defect — a check
    // confirming a mechanism rather than the behaviour — and it very nearly
    // banked a verification that had not happened. `docs/DECISIONS.md` §2.
    const trigger = page.locator("[aria-controls='site-menu']").first();
    if (await trigger.count()) {
      await trigger.click();
      await page.waitForTimeout(500);
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    const images = await page.evaluate(REPORT);
    // The only failure this rig owns: a photograph served smaller than the
    // capped density asks for, while a wider file for it existed. That is an
    // under-stated `sizes`.
    const understated = images.filter((i) => i.ratio < 1 && !i.atLibraryCeiling);
    // Separately worth knowing, and not fixable here: the library has nothing
    // wider. Six sources top out between 541px and 1000px.
    const ceiling = images.filter((i) => i.ratio < 1 && i.atLibraryCeiling);

    const densities = images.map((i) => i.ratioAtDeviceDensity).sort((a, b) => a - b);

    results.push({
      viewport: `${vp.width}x${vp.height}@${vp.dpr}x`,
      images: images.length,
      softestServed: images.slice().sort((a, b) => a.ratio - b.ratio)[0] ?? null,
      // The cap's cost, at this viewport: how many device pixels per CSS pixel
      // each photograph actually gets. At DPR <= 2 these are unchanged from
      // before the cap existed.
      deviceDensity: {
        worst: densities[0] ?? null,
        median: densities[Math.floor(densities.length / 2)] ?? null,
        best: densities[densities.length - 1] ?? null,
      },
      understatedSizes: understated,
      atLibraryCeiling: ceiling.map((c) => ({ file: c.file, needed: c.needed, ratio: c.ratio })),
      // Every photograph, not only the failures. `docs/shot-list.md` quotes
      // "what this frame needs at 390 on a DPR-3 phone" at a photographer who is
      // being paid on those numbers, and it had been quoting the box.
      all: images.map((i) => ({
        file: i.file,
        cssWidth: i.cssWidth,
        drawnWidth: i.drawnWidth,
        needed: i.needed,
        ratio: i.ratio,
      })),
    });
    console.log(
      `${vp.width}x${vp.height}@${vp.dpr}x — ${images.length} images, ` +
        `${understated.length} under-served by \`sizes\`, ${ceiling.length} at the library's ceiling, ` +
        `device density worst/median ${densities[0]}/${densities[Math.floor(densities.length / 2)]}`,
    );
    await context.close();
  }

  await browser.close();
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `${JSON.stringify({ measuredAt: new Date().toISOString(), url: URL, densityCap: CAP, results }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${OUT}`);

  const total = results.reduce((n, r) => n + r.understatedSizes.length, 0);
  if (total > 0) {
    console.error(`FAILED: ${total} photograph(s) served below their box with a wider file available.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
