// The two films — the tiger closing `04 · Days in the Field`, the potter closing
// `02 · Rooted like the mahua` — in a real browser.
//
// Run (with `npx next start -p 3100` already up):
//   node scripts/check_films.mjs
//
// **These were the only signature interaction on the page with no automated
// check at all.** `npm test` cannot watch a video play; it reported 276 passing
// while nothing whatsoever guarded whether either film ran, stopped, held, or
// showed its white background to the visitor.
//
// Every assertion is about what a visitor gets, not about what was configured —
// `docs/DECISIONS.md` §2, the shape this project has been burned by twenty-three
// times. In particular: `loop` being absent is not the same claim as "it stopped",
// and `mix-blend-mode: darken` being set is not the same claim as "the white
// rectangle is gone". Both of those are read off the running page here.
//
// The contract, from CLAUDE.md non-negotiable #5 and `DECISIONS.md` §9:
//
//   1. Server-rendered still, lazily loaded, and neither film in the first load.
//   2. Exactly one of the still and the film is visible at any moment.
//   3. It plays once when scrolled to.
//   4. It stops at the end and **holds the last frame** — it does not loop, and
//      it does not rewind.
//   5. **The white ground is erased.** Sampled as pixels, against the cream the
//      chapter actually sits on.
//   6. A deliberate hover replays it.
//   7. Hover is ignored **while it is still playing**.
//   8. The pointer must **leave and return** — a parked cursor may not replay it
//      a second time. This is the guard that stops hover becoming a loop by
//      another name, and it is the one no static reading can see.
//   9. Reduced motion: the still, and nothing ever plays.
//  10. No JavaScript: the still, and no broken box.

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
const OUT = flag("out", "docs/reviews/2026-08-08-films/films.json");
const SHOTS = path.dirname(OUT);

/** Every film on the page, and the chapter each one closes. */
const FILMS = [
  { chapter: "rooted", name: "potter" },
  { chapter: "field-days", name: "tiger" },
];

const failures = [];
const note = (film, message) => failures.push(`${film}: ${message}`);

/** How far a channel may drift from the chapter's own cream before it reads as a rectangle. */
const CREAM_TOLERANCE = 6;

const FRAME = (chapter) => {
  const frame = document.querySelector(`#${chapter} [data-signature-film-frame]`);
  if (!frame) return null;
  const still = frame.querySelector("img");
  const film = frame.querySelector("video");
  const box = frame.getBoundingClientRect();
  const vis = (el) => getComputedStyle(el).visibility !== "hidden";
  return {
    stillVisible: vis(still),
    filmVisible: vis(film),
    stillLazy: still.getAttribute("loading") === "lazy",
    hasPosterAttribute: film.hasAttribute("poster"),
    preload: film.getAttribute("preload"),
    ariaHidden: film.getAttribute("aria-hidden"),
    blend: {
      still: getComputedStyle(still).mixBlendMode,
      film: getComputedStyle(film).mixBlendMode,
    },
    currentTime: Number(film.currentTime.toFixed(2)),
    duration: Number.isFinite(film.duration) ? Number(film.duration.toFixed(2)) : null,
    paused: film.paused,
    ended: film.ended,
    box: {
      x: Math.round(box.left),
      y: Math.round(box.top),
      w: Math.round(box.width),
      h: Math.round(box.height),
    },
    onScreen: box.bottom > 0 && box.top < window.innerHeight,
  };
};

/** Scroll the film into the middle of the screen and let it start. */
async function reveal(page, chapter) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  const top = await page.evaluate((id) => {
    const el = document.querySelector(`#${id} [data-signature-film-frame]`);
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  }, chapter);
  await page.evaluate(
    ({ y, h }) => window.scrollTo(0, y - h * 0.35),
    { y: top, h: 900 },
  );
  await page.waitForTimeout(700);
}

/** Park the pointer well away from the film, so no hover is in effect. */
const AWAY = { x: 4, y: 4 };
async function hover(page, chapter, on) {
  if (!on) {
    await page.mouse.move(AWAY.x, AWAY.y);
    await page.waitForTimeout(160);
    return;
  }
  const box = await page.evaluate((id) => {
    const r = document.querySelector(`#${id} [data-signature-film-frame]`).getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, chapter);
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(160);
}

const t = async (page, chapter) =>
  page.evaluate((id) => {
    const v = document.querySelector(`#${id} [data-signature-film-frame] video`);
    return Number(v.currentTime.toFixed(2));
  }, chapter);

const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });
const report = { measuredAt: new Date().toISOString(), url: URL, films: [] };

// ------------------------------------------ neither film is in the first load

const firstLoad = await (async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const seen = [];
  page.on("request", (r) => seen.push(r.url()));
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await context.close();
  const stills = seen.filter((u) => /film-poster/.test(u));
  const videos = seen.filter((u) => /film\.mp4/.test(u));
  return { stillsFetched: stills.length, videosFetched: videos.length };
})();

if (firstLoad.stillsFetched > 0) {
  failures.push(
    `${firstLoad.stillsFetched} film still(s) were fetched before anything scrolled — a \`poster\` ` +
      "attribute is fetched immediately however far down the page it sits, and reintroducing one costs " +
      "103 KB of the first screen and 537 ms of the hero (DECISIONS.md §3)",
  );
}
if (firstLoad.videosFetched > 0) {
  failures.push(`${firstLoad.videosFetched} film(s) were downloaded before anything scrolled`);
}

// ---------------------------------------------------------- each film in turn

for (const { chapter, name } of FILMS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);

  const record = { chapter, name };

  // --- Before it is reached: the still stands in for the film. --------------
  const atRest = await page.evaluate(FRAME, chapter);
  if (!atRest) {
    note(name, `no film frame inside #${chapter}`);
    await context.close();
    continue;
  }
  record.beforeReached = atRest;
  if (!atRest.stillLazy) note(name, "the still is not `loading=\"lazy\"`");
  if (atRest.hasPosterAttribute) {
    note(name, "the film carries a `poster` attribute again — see the first-load note above");
  }
  if (atRest.preload !== "none") note(name, `preload is "${atRest.preload}", not "none"`);
  if (atRest.ariaHidden !== "true") note(name, "the film is not aria-hidden");
  if (atRest.blend.still !== "darken" || atRest.blend.film !== "darken") {
    note(name, `blend is ${atRest.blend.still}/${atRest.blend.film}, not darken/darken`);
  }
  if (!atRest.stillVisible || atRest.filmVisible) {
    note(
      name,
      `before it is reached the still is ${atRest.stillVisible ? "visible" : "HIDDEN"} and the film is ` +
        `${atRest.filmVisible ? "VISIBLE" : "hidden"} — exactly one of the two must show, and before ` +
        "the film has frames it must be the still",
    );
  }

  // --- It plays once when scrolled to. --------------------------------------
  await reveal(page, chapter);
  await page.waitForTimeout(1200);
  const early = await page.evaluate(FRAME, chapter);
  record.whilePlaying = early;

  if (early.currentTime <= 0.1 || early.paused) {
    note(
      name,
      `it did not start on scroll — t=${early.currentTime}, paused=${early.paused}. The observer, the ` +
        "autoplay permission, or the source itself",
    );
  }
  if (early.stillVisible || !early.filmVisible) {
    note(
      name,
      `while playing the still is ${early.stillVisible ? "VISIBLE" : "hidden"} and the film is ` +
        `${early.filmVisible ? "visible" : "HIDDEN"} — a still left under a playing film ghosts through ` +
        "it, because both blend with darken",
    );
  }

  // --- Hover is ignored while it is still playing. --------------------------
  const beforeHover = await t(page, chapter);
  await hover(page, chapter, true);
  await page.waitForTimeout(400);
  const afterHover = await t(page, chapter);
  record.hoverWhilePlaying = { beforeHover, afterHover };
  if (afterHover < beforeHover) {
    note(
      name,
      `hovering mid-play rewound it from ${beforeHover}s to ${afterHover}s — hover must be ignored until ` +
        "it has finished, or a cursor resting on it restarts it forever",
    );
  }
  await hover(page, chapter, false);

  // --- It stops at the end and holds the last frame. ------------------------
  // The clip is ten seconds; wait it out from wherever it has reached.
  await page.waitForTimeout(11000);
  const held = [];
  for (let i = 0; i < 3; i++) {
    held.push(await t(page, chapter));
    await page.waitForTimeout(700);
  }
  const ended = await page.evaluate(FRAME, chapter);
  record.afterItEnds = { ...ended, sampledTimes: held };

  if (!ended.paused) {
    note(name, `it is still running ${held.join(" -> ")}s after its own duration — it is looping`);
  }
  if (ended.duration && Math.abs(held[0] - ended.duration) > 0.6) {
    note(
      name,
      `it settled at ${held[0]}s of ${ended.duration}s rather than holding its last frame — a rewind to ` +
        "the first frame reads as the animation being cut off",
    );
  }
  if (new Set(held.map((n) => n.toFixed(1))).size > 1) {
    note(name, `its position kept changing after it ended: ${held.join(" -> ")}s`);
  }

  // --- The white ground is erased. ------------------------------------------
  // Pixels, not the declared blend mode. The artwork is drawn on white and only
  // `mix-blend-mode: darken` against a lighter-than-cream ground makes the
  // rectangle disappear; if that ever stops working the page shows a white box
  // and every other assertion here still passes.
  const cream = await page.evaluate((id) => {
    const section = document.getElementById(id);
    const rgb = getComputedStyle(section).backgroundColor.match(/\d+/g).map(Number);
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }, chapter);
  const box = ended.box;
  const clip = { x: box.x, y: box.y, width: box.w, height: box.h };
  const shot = path.join(SHOTS, `film-${name}.png`);
  await page.screenshot({ path: shot, clip });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };
  // Four corners: the artwork occupies the middle of its frame, so every one of
  // these is background in the source file.
  const corners = [px(2, 2), px(info.width - 3, 2), px(2, info.height - 3), px(info.width - 3, info.height - 3)];
  const drift = Math.max(
    ...corners.flatMap((c) => [
      Math.abs(c.r - cream.r),
      Math.abs(c.g - cream.g),
      Math.abs(c.b - cream.b),
    ]),
  );
  record.ground = { chapterCream: cream, corners, worstChannelDriftPx: drift };
  if (drift > CREAM_TOLERANCE) {
    note(
      name,
      `the corners of the film's box are ${JSON.stringify(corners[0])} against the chapter's cream ` +
        `${JSON.stringify(cream)} — ${drift} levels out. The white ground is showing as a rectangle`,
    );
  }

  // --- A deliberate hover replays it. ---------------------------------------
  await hover(page, chapter, true);
  await page.waitForTimeout(700);
  const replayed = await t(page, chapter);
  record.hoverReplay = { from: held[held.length - 1], to: replayed };
  if (replayed >= held[held.length - 1] - 0.2) {
    note(
      name,
      `hovering a finished film left it at ${replayed}s rather than replaying it from the start — the ` +
        "client asked for this explicitly on 6 Aug",
    );
  }

  // --- ...but only once, until the pointer leaves and returns. ---------------
  // The pointer stays put. When this replay ends the film must stay ended: a
  // parked cursor may not restart it, which is the whole difference between an
  // answer and a loop.
  //
  // **Know what this does and does not prove.** Run on 8 Aug 2026 against a build
  // with the `armed` ref deleted from `SignatureFilm`, it passed unchanged —
  // 10s -> 10s on both films. Chromium does not re-fire `pointerenter` under a
  // stationary pointer, so `armed` is never reached and the `finished` guard
  // alone carries this case. `armed` is defence for the browsers that *do* fire
  // an enter when an element becomes visible beneath a resting cursor, and this
  // rig cannot reach that. So: this is a real assertion about what a visitor
  // gets, and it is **not** evidence that both guards are present. Do not delete
  // `armed` on the strength of this line being green.
  await page.waitForTimeout(11500);
  const parked = await t(page, chapter);
  const parkedState = await page.evaluate(FRAME, chapter);
  await page.waitForTimeout(1500);
  const parkedAgain = await t(page, chapter);
  record.pointerParked = { paused: parkedState.paused, first: parked, second: parkedAgain };
  if (!parkedState.paused || Math.abs(parkedAgain - parked) > 0.2) {
    note(
      name,
      `with the pointer resting on it the film replayed again by itself (${parked}s -> ${parkedAgain}s, ` +
        `paused=${parkedState.paused}) — hover has become a loop by another name`,
    );
  }

  // --- Leaving and returning arms it again. ---------------------------------
  await hover(page, chapter, false);
  await hover(page, chapter, true);
  await page.waitForTimeout(700);
  const rearmed = await t(page, chapter);
  record.leaveAndReturn = { from: parkedAgain, to: rearmed };
  if (rearmed >= parkedAgain - 0.2) {
    note(
      name,
      `after the pointer left and came back the film stayed at ${rearmed}s — it has armed itself off ` +
        "permanently and can never be replayed again",
    );
  }

  report.films.push(record);
  await context.close();
}

// ------------------------------------------------- reduced motion, and no-JS

async function stillnessRun(label, options) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  const out = [];
  for (const { chapter, name } of FILMS) {
    if (options.javaScriptEnabled === false) {
      const present = (await page.locator(`#${chapter} [data-signature-film-frame] img`).count()) > 0;
      if (!present) {
        failures.push(`${label}: ${name} — no still at all. It must be server-rendered, not scripted in`);
      }
      out.push({ name, stillPresent: present });
      continue;
    }
    await reveal(page, chapter);
    await page.waitForTimeout(1500);
    await hover(page, chapter, true);
    await page.waitForTimeout(600);
    const state = await page.evaluate(FRAME, chapter);
    out.push({ name, ...state });
    if (state.currentTime > 0.1 || !state.paused) {
      failures.push(
        `${label}: ${name} played anyway — t=${state.currentTime}, paused=${state.paused}`,
      );
    }
    if (!state.stillVisible) {
      failures.push(`${label}: ${name} — the still is hidden, so the chapter has an empty box`);
    }
    await hover(page, chapter, false);
  }
  await context.close();
  return out;
}

report.reducedMotion = await stillnessRun("reduced motion", { reducedMotion: "reduce" });
report.noJs = await stillnessRun("no JavaScript", { javaScriptEnabled: false });

await browser.close();

report.firstLoad = firstLoad;
report.failures = failures;
report.verdict = failures.length === 0 ? "pass" : "fail";
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `first load: ${firstLoad.stillsFetched} stills, ${firstLoad.videosFetched} films fetched before scrolling`,
);
for (const f of report.films) {
  console.log(
    `${f.name.padEnd(7)} plays ${f.whilePlaying?.currentTime}s -> holds ${f.afterItEnds?.sampledTimes.join("/")}s ` +
      `of ${f.afterItEnds?.duration}s`,
  );
  console.log(
    `        hover mid-play ${f.hoverWhilePlaying?.beforeHover}->${f.hoverWhilePlaying?.afterHover}s | ` +
      `replay ${f.hoverReplay?.from}->${f.hoverReplay?.to}s | ` +
      `parked ${f.pointerParked?.first}->${f.pointerParked?.second}s | ` +
      `re-entered ${f.leaveAndReturn?.from}->${f.leaveAndReturn?.to}s`,
  );
  console.log(
    `        ground: corners within ${f.ground?.worstChannelDriftPx} levels of the chapter's cream ` +
      `(tolerance ${CREAM_TOLERANCE})`,
  );
}
console.log(
  `reduced motion: ${report.reducedMotion.map((r) => `${r.name} t=${r.currentTime}`).join(", ")} | ` +
    `no-JS stills present: ${report.noJs.map((r) => r.stillPresent).join(", ")}`,
);
console.log(`\n${report.verdict.toUpperCase()}`);
for (const f of failures) console.log(`  - ${f}`);
console.log(`\n-> ${OUT}`);

process.exitCode = failures.length === 0 ? 0 : 1;
