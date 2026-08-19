// The frames behind Plan 5: every signature interaction, at every width, plus the
// two states that are supposed to take them away.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/capture_signature.mjs
//
// A script rather than a scratchpad session, for the reason `capture_chapters.mjs`
// exists: Plan 3's screenshots were produced by a rig that lived in a temp folder
// and was gone before anyone looked at the frames, so nobody could re-shoot them
// against a later commit.
//
// What it catches, and why each needs a picture rather than a number:
//
//   - **the welcome**, while it is up. Its own rig proves it leaves; only a frame
//     shows the client's logo assembled correctly from two files.
//   - **the two films and the lantern**, settled. Their rigs measure behaviour;
//     these show the composition each one sits in.
//   - **reduced motion**, where the welcome must be absent and everything else
//     still legible.
//   - **no JavaScript**, where the welcome must still leave and the films must
//     show their stills.

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-signature");

const WIDTHS = [390, 768, 1440, 1920];
const heightFor = (w) => (w === 390 ? 844 : w === 768 ? 1024 : w === 1920 ? 1080 : 900);
/** The chapters a signature interaction lives in. */
/*
 * **`lantern-hour` left this list on 19 Aug 2026, on `feat/home-v2` only.**
 *
 * The client's restructure removes that chapter from the home page, so the
 * hanging lantern has no mount here. `HangingLantern`, `build_lantern.mjs`,
 * `lib/lantern-art.ts` and `check_lantern.mjs` are all untouched and still work
 * — `feat/image-sizing` keeps the chapter and the lantern shipping. If it ever
 * returns to a chapter, put its id back; do not rebuild the arm.
 */
const SCENES = ["rooted", "field-days"];

async function webp(page, file, clip) {
  const png = `${file}.png`;
  await page.screenshot({ path: png, ...(clip ? { clip } : {}) });
  await sharp(png).webp({ quality: 82 }).toFile(`${file}.webp`);
  await unlink(png);
}

/** Walk the page so every lazy image has loaded and every section has its height. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

async function toScene(page, id, height) {
  const top = await page.evaluate((sel) => {
    const el = document.getElementById(sel);
    return Math.round((el?.getBoundingClientRect().top ?? 0) + window.scrollY);
  }, id);
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, top - Math.round(height * 0.08)));
  await page.waitForTimeout(1400);
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
const captured = [];

for (const width of WIDTHS) {
  const height = heightFor(width);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  // The welcome, caught while it is up. Warm first: the very first navigation
  // after `next start` can take seconds, by which time it has gone.
  await page.goto(URL, { waitUntil: "load" });
  await page.goto(URL, { waitUntil: "commit" });
  await page
    .waitForFunction(
      () => (document.querySelector("[data-welcome]")?.getAnimations().length ?? 0) > 0,
      undefined,
      { timeout: 15000 },
    )
    .catch(() => {});
  await page.waitForTimeout(250);
  const name = `w${width}-00-welcome`;
  await webp(page, path.join(OUT, name));
  captured.push(`${name}.webp`);

  await page.waitForTimeout(2600);
  await settle(page);
  for (const [i, id] of SCENES.entries()) {
    await toScene(page, id, height);
    const n = `w${width}-0${i + 1}-${id}`;
    await webp(page, path.join(OUT, n));
    captured.push(`${n}.webp`);
  }
  await context.close();
  console.log(`${width}px — welcome + ${SCENES.length} scenes`);
}

// Reduced motion: no welcome at all, everything else legible and still.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await webp(page, path.join(OUT, "reduced-motion-1440-top"));
  await settle(page);
  await toScene(page, "field-days", 900);
  await webp(page, path.join(OUT, "reduced-motion-1440-field-days"));
  captured.push("reduced-motion-1440-top.webp", "reduced-motion-1440-field-days.webp");
  await context.close();
  console.log("reduced motion — 2 frames");
}

// No JavaScript: the welcome must still leave, and the films must show stills.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(3500);
  await webp(page, path.join(OUT, "no-js-1440-top"));
  // No `evaluate` with scripting off; scroll with the mouse wheel instead.
  await page.mouse.wheel(0, 6200);
  await page.waitForTimeout(1200);
  await webp(page, path.join(OUT, "no-js-1440-field-days"));
  captured.push("no-js-1440-top.webp", "no-js-1440-field-days.webp");
  await context.close();
  console.log("no JavaScript — 2 frames");
}

await browser.close();
await writeFile(
  path.join(OUT, "captures.json"),
  `${JSON.stringify({ measuredAt: new Date().toISOString(), url: URL, widths: WIDTHS, scenes: SCENES, files: captured }, null, 2)}\n`,
  "utf8",
);
console.log(`\n${captured.length} frames -> ${OUT}`);
