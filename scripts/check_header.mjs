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
 * Every frame the bar paints from the moment it first becomes `scrolled`.
 *
 * A reload part-way down the page — a restored scroll position, a refresh, a
 * back-navigation — renders `static`, then learns from the observer that it is
 * `scrolled`. Animating that is 0.9s of a cream background fading in *over a
 * cream chapter* while the type crossfades out of cream, with nothing beneath to
 * carry either end. `StickyHeader`'s double `requestAnimationFrame` is what
 * prevents it; `data-settled`, and so the transition, must not exist yet when
 * the colour changes.
 *
 * **This is installed before the page's own scripts and anchored to the DOM
 * change, not to a wall clock, and that is the entire point.** The check it
 * replaces sampled once at a fixed +320ms after `commit` and treated "the bar is
 * not scrolled yet" as a pass — so whether it caught anything depended on
 * whether hydration happened to land inside its window. Offered as proof that a
 * single frame is not enough, it reproduced the failure 1 run in 3 on the same
 * build and the same port. A guard that is red only sometimes teaches whoever
 * sees it red to shrug and re-run.
 *
 * Anchored to the event there is no race left. The `MutationObserver` fires in
 * the microtask after React commits `data-scrolled`, before any paint; the
 * samples then run one per animation frame, which is exactly where a live
 * transition would be interpolating. With the gate working there is no
 * transition when the colour changes, so *every* frame is the finished colour.
 * With one frame instead of two, `data-scrolled` and `data-settled` land in the
 * same paint and the first frames are a blend.
 *
 * `getComputedStyle` is not read inside the observer callback: at that instant a
 * style recalculation returns the after-change value whether or not a transition
 * is about to run, and it would report the fixed and broken builds identically.
 */
const RECORD_FIRST_STATE = () => {
  const FRAMES = 60;
  const state = {
    sawScrolled: false,
    scrolledAt: null,
    scrollY: null,
    settledOnFrame: null,
    samples: [],
  };
  window.__headerFirstState = state;

  const observer = new MutationObserver(() => {
    const bar = document.querySelector("[data-site-header][data-scrolled]");
    if (!bar || state.sawScrolled) return;
    state.sawScrolled = true;
    state.scrolledAt = Math.round(performance.now());
    state.scrollY = Math.round(window.scrollY);
    observer.disconnect();

    const word = bar.querySelector("[data-header-tint='wordmark']");
    let frame = 0;
    const tick = () => {
      if (bar.hasAttribute("data-settled") && state.settledOnFrame === null)
        state.settledOnFrame = frame;
      state.samples.push({
        frame,
        t: Math.round(performance.now() - state.scrolledAt),
        background: getComputedStyle(bar).backgroundColor,
        wordmark: word ? getComputedStyle(word).color : null,
      });
      if (++frame < FRAMES) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  // `document` itself, with `subtree`. This runs at document start, before the
  // header exists and before `document.documentElement` does — observing the
  // latter throws here, which silently killed the whole recorder on the first
  // attempt and made a genuinely broken build fail for the wrong reason.
  observer.observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-scrolled"],
  });
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
  // The opaque half of the pair asserted in the top state above. A solid bar
  // that lets clicks through hides the thing it hands them to.
  if (on.pointerEvents !== "auto") fail(`${w}: the cream bar is ${on.pointerEvents}, so clicks pass through an opaque surface`);
  else ok(`the cream bar catches its own clicks`);

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
  const still = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector("[data-site-header] img"));
    return { transform: cs.transform, animationName: cs.animationName };
  });
  const emblem = still.transform;
  if (!(emblem === "none" || emblem === "matrix(1, 0, 0, 1, 0, 0)")) fail(`reduced motion: the emblem is turning (${emblem})`);
  else ok(`the emblem does not turn`);
  // The transform above is the outcome; this is the rule that guarantees it for
  // any future keyframe set. `animation-duration: .001ms !important` from the `*`
  // rule would flatten a turn to nothing but would still leave an animation
  // *running*, and its final frame would decide the resting angle.
  if (still.animationName !== "none") fail(`reduced motion: the emblem still has an animation (${still.animationName})`);
  else ok(`no animation on the emblem at all, so no final frame to rest at`);

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

// ---- a click on the opaque bar must not reach the page it is hiding
{
  console.log(`\n--- clicking where the cream bar covers a link ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  // `LodgeCards`' links leave the site, so the click is proved by the *attempt*
  // rather than by letting it happen. Aborting also means this check cannot be
  // fooled by a slow network into looking like nothing happened.
  await context.route("https://mahuaresorts.com/**", (route) => route.abort());
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(2200);

  // Park a real, outbound link inside the bar's band.
  await page.evaluate(() => {
    const link = document.querySelector("#lodges a[href]");
    window.scrollTo(0, link.getBoundingClientRect().top + window.scrollY - 25);
  });
  await page.waitForTimeout(1400);

  const covered = await page.evaluate(() => {
    const bar = document.querySelector("[data-site-header]");
    const box = bar.getBoundingClientRect();
    const found = [...document.querySelectorAll("#lodges a[href]")]
      .map((a) => ({ a, r: a.getBoundingClientRect() }))
      .find(({ r }) => r.top >= 0 && r.top < box.height);
    if (!found) return null;
    const hit = document.elementFromPoint(found.r.x + found.r.width / 2, found.r.y + found.r.height / 2);
    return {
      barHeight: Math.round(box.height),
      barBackground: getComputedStyle(bar).backgroundColor,
      linkText: found.a.textContent?.trim(),
      linkHref: found.a.getAttribute("href"),
      linkTop: Math.round(found.r.top),
      point: { x: Math.round(found.r.x + found.r.width / 2), y: Math.round(found.r.y + found.r.height / 2) },
      hitIsTheLink: found.a === hit || found.a.contains(hit),
    };
  });

  // A check that cannot find a covered link is a check that passes by measuring
  // nothing — the exact shape this project keeps being burned by.
  if (!covered) {
    fail(`no #lodges link could be placed under the bar, so nothing was actually clicked`);
  } else {
    let openedTab = null;
    context.on("page", (p) => { openedTab = p.url() || "(blank)"; });
    const before = page.url();
    await page.mouse.click(covered.point.x, covered.point.y);
    await page.waitForTimeout(1800);
    const navigated = openedTab !== null || page.url() !== before;
    report.clickThrough = { ...covered, openedTab, navigated };
    console.log(`   "${covered.linkText}" -> ${covered.linkHref} at y=${covered.linkTop}, under a ${covered.barHeight}px ${covered.barBackground} bar`);
    if (navigated) {
      fail(`a click at (${covered.point.x},${covered.point.y}) on the opaque bar navigated to ${openedTab ?? page.url()}`);
    } else {
      ok(`a click at (${covered.point.x},${covered.point.y}) went nowhere`);
    }
  }
  await context.close();
}

// ---- a reload part-way down must arrive already-scrolled, not fade into it
{
  console.log(`\n--- reloading mid-page ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(RECORD_FIRST_STATE);
  const page = await context.newPage();
  await page.goto(`${URL}#why-you-came`, { waitUntil: "commit" });

  // Wait for the *event*, not for a clock. This check used to sample at a fixed
  // +320ms and report "nothing to fade" whenever hydration had not got there
  // yet — a pass that measured nothing, and the reason a re-reviewer could
  // reproduce its FAIL against the exact cited mutation only 1 run in 3.
  const arrived = await page
    .waitForFunction(() => window.__headerFirstState?.sawScrolled === true, null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  // ~60 frames of samples at ~16ms, well past the 0.9s the crossfade would take.
  await page.waitForTimeout(1400);

  const record = await page.evaluate(() => window.__headerFirstState ?? null);
  report.midScrollReload = record;

  if (!arrived || !record?.sawScrolled) {
    // Previously the silent pass. A mid-page reload that never reaches the
    // scrolled state is cream type on a cream chapter, which is the whole
    // failure this block exists for.
    fail(`a mid-page reload never reached the scrolled state at all (scrollY ${record?.scrollY})`);
  } else {
    const paper = css(PALETTE.paper);
    const brand = css(PALETTE.brand);
    const partial = record.samples.filter((s) => s.background !== paper || s.wordmark !== brand);
    console.log(
      `   data-scrolled at +${record.scrolledAt}ms (scrollY ${record.scrollY}), ` +
        `data-settled ${record.settledOnFrame === null ? "not within the run" : `on frame ${record.settledOnFrame}`}, ` +
        `${record.samples.length} frames sampled, ${partial.length} of them mid-fade`,
    );
    if (partial.length > 0) {
      const worst = partial[0];
      fail(
        `a mid-page reload animated into its first state: ${partial.length} of ${record.samples.length} frames were mid-fade, ` +
          `the first on frame ${worst.frame} (+${worst.t}ms) at bar ${worst.background}, wordmark ${worst.wordmark}`,
      );
    } else {
      ok(
        `all ${record.samples.length} frames from the first painted state onward are exactly ${paper} / ${brand} — no crossfade over cream`,
      );
    }
  }
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
