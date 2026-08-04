// What JavaScript does a visitor pay for before they scroll?
//
// Plan 4 Task 3's whole argument is that every scrubbed effect on this page is
// below the fold, so the tween library driving them has no business blocking
// first paint. That claim is only worth anything if the number can be
// re-derived, so it lives here rather than in a scratchpad.
//
// Two measurements, deliberately not collapsed into one:
//
//   1. **Static** — every `<script src>` the prerendered document references,
//      summed off disk raw and gzipped. Deterministic, needs no server, and it
//      is the definition of "first load JS": what the browser must fetch before
//      the page is interactive.
//   2. **Live** — every `.js` the browser really transfers, sampled twice: once
//      after load with the page untouched, and again after one scroll. A
//      dynamic `import()` that is genuinely deferred shows up as a file in the
//      second sample and not the first. Asserting that the source says
//      `await import(...)` would be this project's recurring defect again —
//      confirming a mechanism was configured rather than that bytes moved.
//
// Run (with `npm run build` done, and `npx next start -p 3100` up for the live half):
//   node scripts/measure_js_budget.mjs --port 3100
//   node scripts/measure_js_budget.mjs            # static half only
//
// Flags: --port, --url, --out, --width, --height, --scroll.

import { readFile, readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const ROOT = process.cwd();
const PORT = flag("port", null);
const PAGE_URL = flag("url", PORT ? `http://localhost:${PORT}/` : null);
const OUT = flag("out", null);
const WIDTH = Number(flag("width", "1440"));
const HEIGHT = Number(flag("height", "900"));
const SCROLL_TO = Number(flag("scroll", "1400"));

const kb = (n) => (n === null ? "    n/a" : (n / 1024).toFixed(1).padStart(7));

// ---------------------------------------------------------------- static half

const html = await readFile(path.join(ROOT, ".next/server/app/index.html"), "utf8");
const referenced = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))];

const firstLoad = { raw: 0, gz: 0, br: 0, files: [] };
for (const src of referenced) {
  const file = path.join(ROOT, ".next", src.replace(/^\/_next\//, "").split("?")[0]);
  const buf = await readFile(file).catch(() => null);
  if (!buf) {
    firstLoad.files.push({ src, raw: null, note: "not found on disk" });
    continue;
  }
  const gz = gzipSync(buf).length;
  const br = brotliCompressSync(buf).length;
  firstLoad.raw += buf.length;
  firstLoad.gz += gz;
  firstLoad.br += br;
  firstLoad.files.push({ src, raw: buf.length, gz, br });
}

/**
 * Where the tween library ended up. Matched on GSAP's own internals rather than
 * on a filename, because the chunk names are content hashes and a bundled copy
 * never contains the string "gsap" in its module path — the exact false
 * negative that had Plan 4 believing the reference site shipped none of it.
 *
 * `_gsap` and not `ScrollTrigger`: the latter is a false *positive*, because
 * `components/motion/scrub.ts` contains the literal `import("gsap/ScrollTrigger")`
 * and so does the chunk it compiles to. That chunk is 8.6 KB of this project's
 * own code and reporting it as "GSAP in the first load" would have described
 * exactly the thing this task removed as still being there.
 */
const chunkDir = path.join(ROOT, ".next/static/chunks");
const gsapChunks = [];
for (const name of await readdir(chunkDir)) {
  if (!name.endsWith(".js")) continue;
  const text = await readFile(path.join(chunkDir, name), "utf8").catch(() => "");
  if (!/_gsap\b/.test(text)) continue;
  gsapChunks.push({
    name,
    raw: (await stat(path.join(chunkDir, name))).size,
    gz: gzipSync(Buffer.from(text)).length,
    inFirstLoad: referenced.some((s) => s.includes(name)),
  });
}

console.log("STATIC — scripts the prerendered / document references");
for (const f of firstLoad.files)
  console.log(`  ${kb(f.raw)} KB raw ${kb(f.gz ?? null)} KB gz  ${f.src}${f.note ? `  <- ${f.note}` : ""}`);
console.log(
  `  ${kb(firstLoad.raw)} KB raw ${kb(firstLoad.gz)} KB gz ${kb(firstLoad.br)} KB br  FIRST LOAD JS over ${referenced.length} files`,
);

console.log("\nCHUNKS carrying GSAP internals");
if (gsapChunks.length === 0) console.log("  none");
for (const c of gsapChunks)
  console.log(`  ${kb(c.raw)} KB raw ${kb(c.gz)} KB gz  ${c.name}  ${c.inFirstLoad ? "IN THE FIRST LOAD" : "(lazy)"}`);

// ------------------------------------------------------------------ live half

let live = null;
if (PAGE_URL) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

  const SAMPLE = () => {
    const js = performance
      .getEntriesByType("resource")
      .filter((r) => new URL(r.name).pathname.endsWith(".js"));
    return {
      files: js.length,
      transferKB: Math.round(js.reduce((n, r) => n + (r.transferSize || 0), 0) / 1024),
      decodedKB: Math.round(js.reduce((n, r) => n + (r.decodedBodySize || 0), 0) / 1024),
      names: js.map((r) => new URL(r.name).pathname),
    };
  };

  await page.goto(PAGE_URL, { waitUntil: "load" });
  // Long enough for hydration and anything hydration itself pulls in. If a
  // deferred import fires here, it was not deferred by scroll and this catches it.
  await page.waitForTimeout(3000);
  const untouched = await page.evaluate(SAMPLE);

  await page.evaluate((y) => window.scrollTo(0, y), SCROLL_TO);
  await page.waitForTimeout(3000);
  const afterScroll = await page.evaluate(SAMPLE);
  await browser.close();

  live = {
    untouched,
    afterScroll,
    loadedOnlyOnScroll: afterScroll.names.filter((n) => !untouched.names.includes(n)),
  };

  console.log(
    `\nLIVE ${WIDTH}x${HEIGHT} — untouched : ${untouched.files} files, ${untouched.transferKB} KB transferred, ${untouched.decodedKB} KB decoded`,
  );
  console.log(
    `LIVE ${WIDTH}x${HEIGHT} — after scroll: ${afterScroll.files} files, ${afterScroll.transferKB} KB transferred, ${afterScroll.decodedKB} KB decoded`,
  );
  console.log(
    `Fetched only once the visitor scrolled: ${live.loadedOnlyOnScroll.length ? live.loadedOnlyOnScroll.join(", ") : "nothing"}`,
  );
}

if (OUT) {
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `${JSON.stringify({ measuredAt: new Date().toISOString(), firstLoad, gsapChunks, live }, null, 2)}\n`,
    "utf8",
  );
  console.log(`\n-> ${OUT}`);
}
