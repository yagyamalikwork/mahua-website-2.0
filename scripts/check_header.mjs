// The header that stays — both of its states, measured in a browser.
//
// Task 4 made the header `fixed` with two visual states, and every interesting
// thing about it is a rendered outcome rather than a configured mechanism: does
// the bar hold at the top of the screen, does it gain a cream background before
// the photograph beneath it runs out, is the wordmark really the client's brown,
// and — the failure that matters most — is it still legible for a visitor with no
// JavaScript, who can never be told that the photograph has gone.
//
// `components/ui/StickyHeader.test.tsx` covers the state machine in jsdom, where
// every box is zero and no colour is ever painted. This is the half that needs a
// browser. Run it against a production build:
//
//   npm run build && npx next start -p 3100
//   node scripts/check_header.mjs
//
// Flags: --url --port --out --widths

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { PALETTE } from "../lib/palette.ts";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const URL = flag("url", `http://localhost:${flag("port", "3100")}/`);
const OUT = flag("out", "docs/reviews/2026-08-05-header/header.json");
const SHOTS = path.dirname(OUT);

/**
 * 320 is in the list and is not decoration. The header's three items were
 * already fighting for that row before it gained a background — see the note on
 * the base padding in `components/ui/SiteHeader.tsx` — and it is the width where
 * an extra pixel of border or a wider wordmark shows up first.
 */
const VIEWPORTS = flag("widths", "320,390,768,1440,1920")
  .split(",")
  .map(Number)
  .map((w) => ({ w, h: w === 390 ? 844 : w === 768 ? 1024 : w === 320 ? 800 : 900 }));

/**
 * The size below which the wordmark has no solid glyph core to sample.
 *
 * Measured, not guessed: at 24px the darkest pixel under the wordmark is exactly
 * `PALETTE.brand`, and at 10px and 11px the darkest pixel that exists anywhere in
 * the run is a brown/cream blend (#A97F5B at 320, #9B7F6C at 390) because a
 * light-weight display serif at that size is *entirely* antialiased edge. Below
 * this the computed colour is still asserted exactly; only the rendered-pixel
 * assertion stands down, and the contrast that actually matters at those sizes is
 * `scripts/check_contrast_over_photos.mjs`'s job, which hides the type and
 * measures its background against the intended colour.
 */
const SOLID_CORE_PX = 14;

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const css = (hex) => `rgb(${rgb(hex).join(", ")})`;
const toHex = (px) => "#" + px.map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");

const fails = [];
const fail = (m) => { fails.push(m); console.log(`   FAIL  ${m}`); };
const ok = (m) => console.log(`   ok    ${m}`);

/** Everything worth knowing about the bar, read from the live document. */
const PROBE = () => {
  const el = document.querySelector("[data-site-header]");
  if (!el) return null;
  const box = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const pick = (sel) => el.querySelector(sel);
  const rect = (n) => (n ? (({ x, y, width, height }) => ({ x, y, width, height }))(n.getBoundingClientRect()) : null);
  const word = pick("[data-header-tint='wordmark']");
  const menu = pick("[data-header-tint='ink']");
  const pill = pick("[data-contrast='header-pill'] a");
  const img = pick("img");
  return {
    position: cs.position,
    top: Math.round(box.top),
    height: Math.round(box.height),
    background: cs.backgroundColor,
    borderBottomColor: cs.borderBottomColor,
    pointerEvents: cs.pointerEvents,
    scrolled: el.hasAttribute("data-scrolled"),
    wordmark: { colour: word && getComputedStyle(word).color, fontSize: word && getComputedStyle(word).fontSize, box: rect(word), text: word?.textContent },
    menu: { colour: menu && getComputedStyle(menu).color, box: rect(menu) },
    pill: { box: rect(pill) },
    emblemTransform: img && getComputedStyle(img).transform,
    scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop,
    docScrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollY: Math.round(window.scrollY),
  };
};

const AT_QUOTE = () => {
  const el = document.querySelector("#why-you-came");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
};

/**
 * The darkest pixel in a box.
 *
 * `Grain` lays fractal noise over the entire page at 3% with `mix-blend-hard-light`,
 * so *every* rendered pixel on this page is perturbed by a unit or two — the
 * wordmark reads #805D25 at 1440 with it and #7F5C24 without. It is hidden for
 * the duration of this sample so the measurement is of the type's own colour,
 * which is the thing being claimed. The grain is put straight back.
 */
async function darkestPixel(page, box, { withoutGrain = true } = {}) {
  if (withoutGrain) {
    await page.evaluate(() => {
      const grain = document.querySelector(".mix-blend-hard-light");
      if (grain) grain.style.display = "none";
    });
    await page.waitForTimeout(150);
  }
  const shot = await page.screenshot();
  if (withoutGrain) {
    await page.evaluate(() => {
      const grain = document.querySelector(".mix-blend-hard-light");
      if (grain) grain.style.display = "";
    });
  }
  const { data, info } = await sharp(shot)
    .extract({
      left: Math.max(0, Math.floor(box.x)),
      top: Math.max(0, Math.floor(box.y)),
      width: Math.max(1, Math.ceil(box.width)),
      height: Math.max(1, Math.ceil(box.height)),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let best = [255, 255, 255];
  let bestSum = Infinity;
  for (let i = 0; i < data.length; i += info.channels) {
    const px = [data[i], data[i + 1], data[i + 2]];
    const sum = px[0] + px[1] + px[2];
    if (sum < bestSum) { bestSum = sum; best = px; }
  }
  return toHex(best);
}

const report = { measuredAt: new Date().toISOString(), url: URL, viewports: {} };
const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });

for (const { w, h } of VIEWPORTS) {
  console.log(`\n--- ${w}x${h} ---`);
  const context = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const rows = {};

  // ---- over the hero
  const top = (rows.top = await page.evaluate(PROBE));
  if (top.position !== "fixed") fail(`${w}: header is ${top.position} after hydration, so it does not stay`);
  else ok(`fixed, ${top.height}px tall`);
  if (top.scrolled) fail(`${w}: the bar is already cream over the hero photograph`);
  else if (top.background !== "rgba(0, 0, 0, 0)") fail(`${w}: bar is ${top.background} over the hero, not transparent`);
  else ok(`transparent over the hero`);
  if (top.wordmark.colour !== css(PALETTE.paper)) fail(`${w}: wordmark over the photograph is ${top.wordmark.colour}, not cream`);
  if (top.pointerEvents !== "none") fail(`${w}: the bar is ${top.pointerEvents} and will swallow clicks meant for the page`);
  if (top.docScrollWidth > top.innerWidth) fail(`${w}: the page scrolls sideways (${top.docScrollWidth} > ${top.innerWidth})`);
  else ok(`no horizontal overflow`);

  // The three items sharing one row. At 320 this is the check that bites.
  const collide = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width;
  if (collide(top.menu.box, top.wordmark.box) || collide(top.wordmark.box, top.pill.box)) {
    fail(`${w}: the menu, the lockup and the pill overlap each other`);
  } else ok(`menu / lockup / pill clear of one another`);
  await page.screenshot({ path: `${SHOTS}/header-${w}-top.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 220) } });

  // ---- past the hero, and deliberately over a full-bleed photograph. Parked on
  // a cream chapter this whole block would pass with no bar at all.
  await page.evaluate(AT_QUOTE);
  await page.waitForTimeout(1600);
  const on = (rows.scrolled = await page.evaluate(PROBE));
  if (on.top !== 0) fail(`${w}: the bar left the top of the screen (y=${on.top} at ${on.scrollY}px)`);
  else ok(`held at y=0 through ${on.scrollY}px of scroll`);
  if (!on.scrolled) fail(`${w}: the bar never took its scrolled state`);
  if (on.background !== css(PALETTE.paper)) fail(`${w}: bar is ${on.background} over a photograph, not paper — type is on the image`);
  else ok(`cream bar over the photograph`);
  if (on.borderBottomColor !== css(PALETTE.gold)) fail(`${w}: the hairline is ${on.borderBottomColor}, not gold`);
  if (on.wordmark.colour !== css(PALETTE.brand)) fail(`${w}: wordmark computes ${on.wordmark.colour}, not ${PALETTE.brand}`);
  else ok(`wordmark computes ${css(PALETTE.brand)} = ${PALETTE.brand}`);
  if (on.menu.colour !== css(PALETTE.ink)) fail(`${w}: the menu computes ${on.menu.colour}, not ink`);

  const drawn = (rows.wordmarkDarkestPixel = await darkestPixel(page, on.wordmark.box));
  const px = Number.parseFloat(on.wordmark.fontSize);
  if (px >= SOLID_CORE_PX) {
    if (drawn !== PALETTE.brand) fail(`${w}: the wordmark draws ${drawn}, not ${PALETTE.brand}, at ${on.wordmark.fontSize}`);
    else ok(`the pixels really are ${PALETTE.brand} at ${on.wordmark.fontSize}`);
  } else {
    ok(`darkest pixel ${drawn} at ${on.wordmark.fontSize} — all antialiased edge below ${SOLID_CORE_PX}px, not asserted`);
  }
  await page.screenshot({ path: `${SHOTS}/header-${w}-scrolled.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 220) } });

  // ---- the foot of the page
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1200);
  const end = (rows.bottom = await page.evaluate(PROBE));
  if (end.top !== 0 || end.position !== "fixed" || !end.scrolled) {
    fail(`${w}: at the foot of the page the bar is ${end.position} at y=${end.top}, scrolled=${end.scrolled}`);
  } else ok(`still fixed, cream and at y=0 after ${end.scrollY}px`);

  // ---- a fixed bar overlays what an anchor scrolls to
  if (end.scrollPaddingTop !== `${end.height}px`) {
    fail(`${w}: scroll-padding-top is ${end.scrollPaddingTop} for a ${end.height}px bar`);
  } else ok(`scroll-padding-top = ${end.scrollPaddingTop}, the bar's own measured height`);

  const anchor = (rows.anchor = await page.evaluate(() => {
    location.hash = "";
    window.scrollTo(0, 0);
    location.hash = "#rooms";
    return new Promise((res) =>
      setTimeout(() => {
        const el = document.querySelector("#rooms");
        const bar = document.querySelector("[data-site-header]");
        res({
          sectionTop: Math.round(el.getBoundingClientRect().top),
          barHeight: Math.round(bar.getBoundingClientRect().height),
        });
      }, 900),
    );
  }));
  if (anchor.sectionTop < anchor.barHeight - 2) {
    fail(`${w}: #rooms lands at y=${anchor.sectionTop}, underneath the ${anchor.barHeight}px bar`);
  } else ok(`#rooms lands at y=${anchor.sectionTop}, clear of the ${anchor.barHeight}px bar`);

  report.viewports[`${w}x${h}`] = rows;
  await context.close();
}

// ---- the emblem turns once and then is still
{
  console.log(`\n--- the emblem ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "commit" });
  await page.waitForTimeout(600);
  const early = await page.evaluate(() => getComputedStyle(document.querySelector("[data-site-header] img")).transform);
  await page.waitForTimeout(3200);
  const late = await page.evaluate(() => getComputedStyle(document.querySelector("[data-site-header] img")).transform);
  report.emblem = { early, late };
  const still = (t) => t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
  if (still(early)) fail(`the emblem never turned (${early} at ~600ms)`);
  else ok(`turning at ~600ms: ${early}`);
  if (!still(late)) fail(`the emblem is still turning at ~3.8s (${late}) — this is a turn, not a spin`);
  else ok(`upright and still at ~3.8s`);
  await context.close();
}

// ---- reduced motion: a still state, not a fast one
{
  console.log(`\n--- reduced motion ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "commit" });
  await page.waitForTimeout(400);
  const emblem = await page.evaluate(() => getComputedStyle(document.querySelector("[data-site-header] img")).transform);
  if (!(emblem === "none" || emblem === "matrix(1, 0, 0, 1, 0, 0)")) fail(`reduced motion: the emblem is turning (${emblem})`);
  else ok(`the emblem does not turn`);

  await page.waitForTimeout(1500);
  const before = await page.evaluate(PROBE);
  await page.evaluate(AT_QUOTE);
  // Deliberately far shorter than ENTER.duration: the change must already be over.
  await page.waitForTimeout(120);
  const after = await page.evaluate(PROBE);
  report.reducedMotion = { emblem, top: before, scrolled: after };
  if (before.position !== "fixed") fail(`reduced motion: the header stopped following (${before.position})`);
  else ok(`the header still follows — following is not motion`);
  if (after.background !== css(PALETTE.paper)) fail(`reduced motion: the bar is ${after.background} 120ms in — it is animating`);
  else ok(`the bar is cream 120ms after the state changed, so it did not animate`);
  if (after.wordmark.colour !== css(PALETTE.brand)) fail(`reduced motion: the wordmark is ${after.wordmark.colour} 120ms in`);
  else ok(`the wordmark is already ${PALETTE.brand}`);
  await context.close();
}

// ---- no JavaScript: the state nobody can ever correct
{
  console.log(`\n--- no JavaScript ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(3500);
  const probe = (report.noJs = await page.$eval("[data-site-header]", (el) => {
    const word = el.querySelector("[data-header-tint='wordmark']");
    const img = el.querySelector("img");
    return {
      position: getComputedStyle(el).position,
      background: getComputedStyle(el).backgroundColor,
      scrolled: el.hasAttribute("data-scrolled"),
      wordmark: getComputedStyle(word).color,
      text: word.textContent,
      emblem: getComputedStyle(img).transform,
      scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop,
    };
  }));
  // `absolute` is the whole point. A `fixed` bar here would follow the visitor
  // onto the cream page wearing cream type, with nothing able to tell it to change.
  if (probe.position !== "absolute") fail(`no-JS: the bar is ${probe.position} — cream type will follow onto cream`);
  else ok(`the bar stays with the photograph it is legible over`);
  if (probe.wordmark !== css(PALETTE.paper)) fail(`no-JS: the wordmark is ${probe.wordmark}, not cream`);
  else ok(`cream type over the photograph`);
  if (!probe.text?.trim()) fail(`no-JS: the wordmark is empty`);
  else ok(`the wordmark reads "${probe.text}"`);
  if (!(probe.emblem === "none" || probe.emblem === "matrix(1, 0, 0, 1, 0, 0)")) fail(`no-JS: the emblem is stuck mid-turn (${probe.emblem})`);
  else ok(`the emblem finished its turn without script`);
  if (probe.scrollPaddingTop !== "0px") fail(`no-JS: anchors are offset by ${probe.scrollPaddingTop} for a bar that overlays nothing`);
  else ok(`anchors are not offset`);
  await context.close();
}

// ---- the bar must not become the thing that eats a click
{
  console.log(`\n--- clicks through the bar ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const beneath = (report.clickThrough = await page.evaluate(() => {
    const bar = document.querySelector("[data-site-header]");
    const box = bar.getBoundingClientRect();
    // The centre of the bar's own empty space, between the menu and the lockup.
    const hit = document.elementFromPoint(box.width * 0.25, box.height / 2);
    return { hit: hit?.tagName ?? null, insideBar: bar.contains(hit) };
  }));
  if (beneath.insideBar) fail(`the bar is the hit target in its own empty space — it swallows clicks`);
  else ok(`empty bar hands the click to the page beneath (<${beneath.hit?.toLowerCase()}>)`);
  await context.close();
}

await browser.close();
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`\nWrote ${OUT}`);

if (fails.length > 0) {
  console.error(`\nFAILED — ${fails.length}:\n${fails.map((f) => `  ${f}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`\nPASS — 0 failures`);
}
