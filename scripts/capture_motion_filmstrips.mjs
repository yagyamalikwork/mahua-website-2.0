// Task 6 — the pictures a non-technical reader can check, and one real check.
//
// The brief's standing rule: "a still frame that could pass for no animation
// proves nothing". So every motion capture here is a FILMSTRIP with the
// measured transform printed beside each frame — the picture and the number
// come from the same instant, and a dead animation produces a strip of
// identical frames with identical numbers.
//
// **Most of this script is a capture, not a check** — it writes filmstrips and
// a JSON trace for a human to look at, and most of `findings` asserts nothing.
// Real motion coverage lives in `check_entrances.mjs` (`peakWordOffset` /
// `peakMaskCover`) and `check_header.mjs` (the emblem). The one exception is
// `entrance()`'s distinct-value floor below: it existed as a comment — "a dead
// animation produces one distinct value here" — with no assertion behind it
// until 5 Aug 2026, so a dead entrance on any of the four sampled chapters
// would still exit 0. That was the same defect shape as fourteen others on
// this project: a check that reads like a gate and gates nothing.
//
// Flags: --port --out

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = flag("port", "3210");
const URL = flag("url", `http://localhost:${PORT}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-scroll-craft");

const findings = { capturedAt: new Date().toISOString(), url: URL, sections: {} };
// Populated only by `entrance()`'s distinct-value floor — see the header note.
const failures = [];
const write = async (name, buf) => {
  await mkdir(OUT, { recursive: true });
  await sharp(buf).webp({ quality: 82 }).toFile(path.join(OUT, name));
};

/** Stack frames into one strip with a caption bar under each. */
async function filmstrip(name, frames, width) {
  const CAP = 26;
  const tiles = [];
  for (const f of frames) {
    const img = sharp(f.buf).resize({ width });
    const meta = await img.toBuffer({ resolveWithObject: true });
    const label = f.label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const cap = Buffer.from(
      `<svg width="${width}" height="${CAP}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="100%" height="100%" fill="#31402C"/>` +
        `<text x="8" y="18" font-family="monospace" font-size="13" fill="#F1E9D7">${label}</text></svg>`,
    );
    tiles.push(
      await sharp({
        create: { width, height: meta.info.height + CAP, channels: 3, background: "#31402C" },
      })
        .composite([
          { input: meta.data, top: 0, left: 0 },
          { input: cap, top: meta.info.height, left: 0 },
        ])
        .png()
        .toBuffer(),
    );
  }
  const metas = await Promise.all(tiles.map((t) => sharp(t).metadata()));
  const total = metas.reduce((n, m) => n + m.height, 0);
  let top = 0;
  const layers = tiles.map((t, i) => {
    const o = { input: t, top, left: 0 };
    top += metas[i].height;
    return o;
  });
  const buf = await sharp({ create: { width, height: total, channels: 3, background: "#31402C" } })
    .composite(layers)
    .webp({ quality: 82 })
    .toBuffer();
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, name), buf);
}

// ---------------------------------------------------------------------------
// 1. The header, both states, five widths
// ---------------------------------------------------------------------------
async function header(browser) {
  const out = [];
  for (const width of [320, 390, 768, 1440, 1920]) {
    const height = width <= 390 ? 844 : 900;
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(2600); // past the emblem's 2.4s turn

    const top = await page.evaluate(() => {
      const bar = document.querySelector("[data-site-header]");
      const r = bar.getBoundingClientRect();
      return {
        position: getComputedStyle(bar).position,
        background: getComputedStyle(bar).backgroundColor,
        barTop: Math.round(r.top),
        barHeight: Math.round(r.height),
        scrolled: bar.hasAttribute("data-scrolled"),
      };
    });
    await write(`header-${width}-top.webp`, await page.screenshot());

    // Past the hero: the state the client asked for.
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(1400);
    const scrolled = await page.evaluate(() => {
      const bar = document.querySelector("[data-site-header]");
      const r = bar.getBoundingClientRect();
      const mark = document.querySelector("[data-contrast='brand-wordmark']");
      return {
        position: getComputedStyle(bar).position,
        background: getComputedStyle(bar).backgroundColor,
        barTop: Math.round(r.top),
        barHeight: Math.round(r.height),
        scrolled: bar.hasAttribute("data-scrolled"),
        wordmarkColour: mark ? getComputedStyle(mark).color : null,
        // Does the bar cover something it should not? What is painted at the
        // very first pixel below it.
        firstUnderBar: (() => {
          const el = document.elementFromPoint(Math.round(window.innerWidth / 2), Math.round(r.bottom) + 2);
          return el ? `${el.tagName}.${String(el.className || "").slice(0, 40)}` : null;
        })(),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      };
    });
    await write(`header-${width}-scrolled.webp`, await page.screenshot());
    out.push({ width, top, scrolled });
    await ctx.close();
  }
  findings.sections.header = out;
}

// ---------------------------------------------------------------------------
// 2. The wordmark's colour, read off the rendered pixels
// ---------------------------------------------------------------------------
async function wordmarkPixels(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.evaluate(() => {
    // Grain sits over everything at 3% with mix-blend-hard-light and tints a
    // sampled pixel; hide it so the reading is the type's own colour. Same
    // selector check_header.mjs uses, for the same reason.
    const g = document.querySelector(".mix-blend-hard-light");
    if (g) g.style.display = "none";
  });
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(1600);
  const box = await page.evaluate(() => {
    const m = document.querySelector("[data-contrast='brand-wordmark']");
    if (!m) throw new Error("no [data-contrast='brand-wordmark'] — the hook was renamed");
    const r = m.getBoundingClientRect();
    // Playwright's clip wants width/height, not w/h. A couple of extra pixels
    // of padding so the crop is all type and no cream edge.
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  });
  const shot = await page.screenshot({ clip: box });
  await write("wordmark-scrolled-1440.webp", shot);
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  // The darkest pixel in the crop is the middle of a stroke — the type's colour
  // before any antialiasing toward the cream behind it.
  let best = null;
  let bestLum = 1e9;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < bestLum) { bestLum = lum; best = [r, g, b]; }
  }
  const hex = `#${best.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  findings.sections.wordmark = {
    darkestRenderedPixel: hex,
    rgb: best,
    expected: "#7F5C24",
    matches: hex === "#7F5C24",
  };
  await ctx.close();
}

// ---------------------------------------------------------------------------
// 3. The rise and the per-line stagger, caught in progress
// ---------------------------------------------------------------------------
async function entrance(browser, chapterId, width = 1440, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2200);

  // Park two screens above the chapter so it is staged, not settled.
  const target = await page.evaluate((id) => {
    const el = document.getElementById(id);
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, y - window.innerHeight * 2.2));
    return Math.round(y);
  }, chapterId);
  await page.waitForTimeout(1200);

  // A recorder that starts the clock at the observer's own state change, not at
  // a wall clock — the entrance is triggered by intersection, so anchoring to
  // anything else measures the scroll, not the animation.
  await page.evaluate((id) => {
    const root = document.getElementById(id);
    window.__rec = { t0: null, samples: [] };
    const read = () => {
      const line = root.querySelector("[data-line-inner]");
      const block = root.querySelector("[data-enter]");
      const mask = root.querySelector("[data-image-mask]");
      const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
      return {
        lineTranslate: cs(line, "translate"),
        lineState: root.querySelector("[data-lines-enter]")?.getAttribute("data-lines-enter") ?? null,
        blockTransform: cs(block, "transform"),
        blockOpacity: cs(block, "opacity"),
        blockState: block?.getAttribute("data-enter") ?? null,
        maskScale: cs(mask, "scale") || cs(mask, "transform"),
      };
    };
    const tick = () => {
      const s = read();
      if (window.__rec.t0 === null && (s.blockState === "in" || s.lineState === "in")) {
        window.__rec.t0 = performance.now();
      }
      if (window.__rec.t0 !== null) {
        s.t = Math.round(performance.now() - window.__rec.t0);
        if (window.__rec.samples.length < 200) window.__rec.samples.push(s);
      }
      if (window.__rec.t0 === null || performance.now() - window.__rec.t0 < 1600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, chapterId);

  // Bring it in. One jump, because that is what a fast scroll does.
  await page.evaluate((y) => window.scrollTo(0, y - 120), target);

  const frames = [];
  const t0 = Date.now();
  for (let i = 0; i < 7; i++) {
    const buf = await page.screenshot();
    const now = await page.evaluate(() =>
      window.__rec.t0 === null ? null : Math.round(performance.now() - window.__rec.t0),
    );
    const s = await page.evaluate(() => {
      const r = window.__rec.samples;
      return r.length ? r[r.length - 1] : null;
    });
    frames.push({ buf, t: now, s });
    if (Date.now() - t0 > 1700) break;
  }
  await page.waitForTimeout(900);
  frames.push({
    buf: await page.screenshot(),
    t: "settled",
    s: await page.evaluate(() => {
      const r = window.__rec.samples;
      return r.length ? r[r.length - 1] : null;
    }),
  });

  const samples = await page.evaluate(() => window.__rec.samples);
  await ctx.close();

  await filmstrip(
    `entrance-${chapterId}-${width}.webp`,
    frames.map((f) => ({
      buf: f.buf,
      label:
        `t=${f.t === null ? "before" : f.t}${typeof f.t === "number" ? "ms" : ""}  ` +
        `line translate ${f.s?.lineTranslate ?? "-"}  block opacity ${f.s?.blockOpacity ?? "-"}`,
    })),
    Math.round(width / 2),
  );

  const result = {
    chapter: chapterId,
    width,
    framesCaptured: frames.length,
    sampleCount: samples.length,
    // A dead animation produces one distinct value here.
    distinctLineTranslates: [...new Set(samples.map((s) => s.lineTranslate))].length,
    distinctBlockOpacities: [...new Set(samples.map((s) => s.blockOpacity))].length,
    firstSample: samples[0] ?? null,
    midSample: samples[Math.floor(samples.length / 3)] ?? null,
    lastSample: samples[samples.length - 1] ?? null,
    trace: samples.filter((_, i) => i % 4 === 0).slice(0, 24),
  };

  // The one assertion in this script — see the header note. A working
  // transition sampled at up to 200 rAF ticks across ~1.6s of real motion
  // produces dozens of distinct values; 5 is comfortably below that and
  // comfortably above what a transition-free snap can produce (1-2 values:
  // the staged state, then the settled one). `sampleCount === 0` means the
  // observer never reported "in" at all — the entrance never triggered — and
  // is caught the same way, because zero samples yields zero distinct values.
  const DISTINCT_FLOOR = 5;
  if (result.distinctLineTranslates <= DISTINCT_FLOOR) {
    failures.push(
      `${chapterId}@${width}w: only ${result.distinctLineTranslates} distinct line-translate value(s) across ` +
        `${result.sampleCount} samples — the headline entrance looks dead`,
    );
  }
  if (result.distinctBlockOpacities <= DISTINCT_FLOOR) {
    failures.push(
      `${chapterId}@${width}w: only ${result.distinctBlockOpacities} distinct block-opacity value(s) across ` +
        `${result.sampleCount} samples — the block entrance looks dead`,
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// 4. The per-line stagger, as written delays
// ---------------------------------------------------------------------------
async function stagger(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() =>
    [...document.querySelectorAll("[data-lines-enter]")].slice(0, 6).map((h) => ({
      chapter: h.closest("section")?.id ?? null,
      text: String(h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      delays: [...h.querySelectorAll("[data-line-inner]")].map((s) =>
        getComputedStyle(s).transitionDelay,
      ),
    })),
  );
  await ctx.close();
  findings.sections.stagger = out;
}

// ---------------------------------------------------------------------------
// 5. The emblem turns once, then stops
// ---------------------------------------------------------------------------
async function emblem(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__emb = [];
    const start = performance.now();
    const tick = () => {
      const el = document.querySelector(".emblem-turn");
      if (el) {
        const cs = getComputedStyle(el);
        window.__emb.push({
          t: Math.round(performance.now() - start),
          transform: cs.transform,
          animationName: cs.animationName,
          iterations: cs.animationIterationCount,
        });
      }
      if (performance.now() - start < 6000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(URL, { waitUntil: "load" });

  // The lockup is centred, not at the left edge: at 1440 the wordmark box
  // starts at x=604. Clip around the emblem+wordmark, not around the origin.
  const clip = await page.evaluate(() => {
    const em = document.querySelector(".emblem-turn");
    const r = em.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round(r.x) - 40),
      y: Math.max(0, Math.round(r.y) - 20),
      width: 460,
      height: Math.round(r.height) + 40,
    };
  });
  const frames = [];
  for (const at of [120, 400, 800, 1300, 1900, 2600, 4500]) {
    await page.waitForFunction((ms) => window.__emb.length && window.__emb[window.__emb.length - 1].t >= ms, at, { timeout: 20000 }).catch(() => {});
    const s = await page.evaluate(() => window.__emb[window.__emb.length - 1]);
    frames.push({ buf: await page.screenshot({ clip }), label: `${s?.t ?? at}ms  ${s?.transform ?? "-"}` });
  }
  await page.waitForTimeout(500);
  const trace = await page.evaluate(() => window.__emb);
  await ctx.close();
  await filmstrip("emblem-turn-1440.webp", frames, 420);

  const angles = trace.map((s) => {
    const m = /matrix\(([-\d.]+), ([-\d.]+)/.exec(s.transform || "");
    if (!m) return 0;
    return Math.round((Math.atan2(Number(m[2]), Number(m[1])) * 180) / Math.PI);
  });
  const afterTurn = trace.filter((s) => s.t > 3000);
  findings.sections.emblem = {
    samples: trace.length,
    distinctTransformsWhileTurning: [...new Set(trace.filter((s) => s.t < 2400).map((s) => s.transform))].length,
    distinctTransformsAfter3s: [...new Set(afterTurn.map((s) => s.transform))].length,
    finalTransform: trace[trace.length - 1]?.transform ?? null,
    iterationCount: trace[0]?.iterations ?? null,
    angleRange: [Math.min(...angles), Math.max(...angles)],
    trace: trace.filter((_, i) => i % 8 === 0).slice(0, 30),
  };
}

// ---------------------------------------------------------------------------
// 6. Reduced motion and no JavaScript
// ---------------------------------------------------------------------------
async function stillStates(browser) {
  const out = {};
  for (const mode of ["reduced", "nojs"]) {
    for (const width of [390, 1440]) {
      const ctx = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 900 },
        ...(mode === "reduced" ? { reducedMotion: "reduce" } : { javaScriptEnabled: false }),
      });
      const page = await ctx.newPage();
      await page.goto(URL, { waitUntil: "load" });
      await page.waitForTimeout(mode === "nojs" ? 1500 : 2600);
      if (mode === "reduced") {
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 70));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(900);
      }
      // Nothing may be left staged, invisible, or behind a collapsed mask.
      const state = await page.evaluate(() => {
        const staged = (sel, want) => [...document.querySelectorAll(sel)].filter((e) => e.getAttribute(want) === "pending").length;
        const invisible = [...document.querySelectorAll("[data-enter], [data-line-inner], [data-image-inner]")].filter(
          (e) => Number(getComputedStyle(e).opacity) < 0.95,
        ).length;
        // MIND THE POLARITY. The mask is a COVER that wipes away: its at-rest
        // state is Tailwind's own `scale-y-0` and a mask at `scale: 1 0` means
        // the photograph is fully revealed. The failure is the opposite — a
        // mask left at full height, hiding the picture behind it.
        //
        // Measuring `scale < 0.95` therefore counts every healthy mask on the
        // page. This check did exactly that on its first run and reported 30
        // "collapsed masks" in the very states that are supposed to be clean.
        // What is actually wanted is the covered ones, so measure the drawn
        // height: a mask still painting over its photograph.
        const masked = [...document.querySelectorAll("[data-image-mask]")].filter(
          (e) => e.getBoundingClientRect().height > 4,
        ).length;
        const displaced = [...document.querySelectorAll("[data-line-inner]")].filter((e) => {
          const t = getComputedStyle(e).translate;
          return t && t !== "none" && t !== "0px";
        }).length;
        return {
          sections: document.querySelectorAll("section[id]").length,
          words: document.body.innerText.split(/\s+/).filter(Boolean).length,
          stagedEnter: staged("[data-enter]", "data-enter"),
          stagedLines: staged("[data-lines-enter]", "data-lines-enter"),
          stagedImages: staged("[data-image-enter]", "data-image-enter"),
          invisibleElements: invisible,
          masksStillCoveringPhoto: masked,
          displacedWords: displaced,
          pinnedScene: Boolean(document.querySelector(".sticky-scene")),
          docHeight: document.body.scrollHeight,
          headerLegible: (() => {
            const b = document.querySelector("[data-site-header]");
            return b ? getComputedStyle(b).position : null;
          })(),
        };
      });
      await write(`${mode}-${width}-top.webp`, await page.screenshot());
      await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.45)));
      await page.waitForTimeout(600);
      await write(`${mode}-${width}-middle.webp`, await page.screenshot());
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await write(`${mode}-${width}-foot.webp`, await page.screenshot());
      out[`${mode}-${width}`] = state;
      await ctx.close();
    }
  }

  // CONTROL — a metric that reads 0 in every state it is pointed at proves
  // nothing, so point it at a page where masks genuinely ARE covering their
  // photographs: motion on, script on, below-the-fold chapters staged and not
  // yet entered. This must be > 0, or `masksStillCoveringPhoto` is dead and the
  // zeroes above are worthless.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    const staged = await page.evaluate(() => ({
      pendingImages: document.querySelectorAll("[data-image-enter='pending']").length,
      masksStillCoveringPhoto: [...document.querySelectorAll("[data-image-mask]")].filter(
        (e) => e.getBoundingClientRect().height > 4,
      ).length,
    }));
    out.control = {
      ...staged,
      note:
        "Motion on, script on, page untouched. Below-fold photographs are staged, so masks " +
        "ARE covering. Both numbers must be > 0 or the zeroes above mean nothing.",
      metricIsAlive: staged.masksStillCoveringPhoto > 0,
    };
    await ctx.close();
  }

  findings.sections.stillStates = out;
}

// ---------------------------------------------------------------------------
// 7. Horizontal overflow at five widths
// ---------------------------------------------------------------------------
async function overflow(browser) {
  const out = [];
  for (const width of [320, 390, 768, 1440, 1920]) {
    const ctx = await browser.newContext({ viewport: { width, height: width <= 390 ? 844 : 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load" });
    const worst = await page.evaluate(async () => {
      let max = 0;
      let at = 0;
      const step = Math.round(window.innerHeight * 0.6);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
        if (document.documentElement.scrollWidth > max) {
          max = document.documentElement.scrollWidth;
          at = y;
        }
      }
      return { scrollWidth: max, clientWidth: document.documentElement.clientWidth, at };
    });
    out.push({ width, ...worst, horizontalScroll: worst.scrollWidth > worst.clientWidth });
    await ctx.close();
  }
  findings.sections.overflow = out;
}

// ---------------------------------------------------------------------------
// 8. The pinned collage, mid-movement
// ---------------------------------------------------------------------------
async function collageMidMove(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const band = await page.evaluate(() => {
    const scene = document.querySelector(".sticky-scene");
    if (!scene) return null;
    const top = scene.getBoundingClientRect().top + window.scrollY;
    return { top: Math.round(top), height: Math.round(scene.offsetHeight) };
  });
  if (!band) { await ctx.close(); return; }
  const frames = [];
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = Math.round(band.top + band.height * f * 0.75);
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(700);
    const pos = await page.evaluate(() =>
      [...document.querySelectorAll("[data-drift]")].map((e) => Math.round(e.getBoundingClientRect().top)),
    );
    frames.push({ buf: await page.screenshot(), label: `scrollY ${y}  photograph tops ${pos.join(" / ")}` });
  }
  await ctx.close();
  await filmstrip("collage-drift-filmstrip-1440.webp", frames, 720);
  findings.sections.collage = { band, frames: frames.map((f) => f.label) };
}

async function main() {
  const browser = await chromium.launch();
  // Close the browser on the way out whatever happens. Without this a throw
  // anywhere below leaves Chromium running and node waits on it for ever — the
  // script HANGS instead of reporting the error, which is exactly what it did
  // on its first run when a renamed selector threw inside an evaluate.
  try {
    await capture(browser);
  } finally {
    await browser.close();
  }
}

async function capture(browser) {
  console.log("header…");        await header(browser);
  console.log("wordmark…");      await wordmarkPixels(browser);
  console.log("entrances…");
  findings.sections.entrances = [
    await entrance(browser, "forest", 1440),
    await entrance(browser, "rooms", 1440),
    await entrance(browser, "guests", 1440),
    await entrance(browser, "forest", 390, 844),
  ];
  console.log("stagger…");       await stagger(browser);
  console.log("emblem…");        await emblem(browser);
  console.log("still states…");  await stillStates(browser);
  console.log("overflow…");      await overflow(browser);
  console.log("collage…");       await collageMidMove(browser);

  findings.failures = failures;
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "task-6-visual-evidence.json"), `${JSON.stringify(findings, null, 2)}\n`, "utf8");
  console.log("Wrote", path.join(OUT, "task-6-visual-evidence.json"));

  // The one point in this script where exit code means anything — see the
  // header note. Everything above is a capture; this is the check.
  if (failures.length > 0) {
    console.error(`\n${failures.length} FAILURE(S):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else {
    console.log("\nEntrance motion: every sampled chapter cleared the distinct-value floor.");
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
