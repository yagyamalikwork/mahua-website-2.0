// The guests' review carousel at the foot of `08 · The Invitation` —
// `components/sections/ReviewCarousel.tsx` — in a real browser.
//
// Run (with `npx next start -p 3131` already up):
//   node scripts/check_reviews.mjs --port 3131
//   node scripts/check_reviews.mjs --port 3131 --out docs/reviews/<date>/reviews.json
//
// ## What this rig is for, and what it deliberately leaves to others
//
// Everything here is a *behaviour*, measured off the rendered page. Three things
// on this component cannot be seen any other way:
//
//   - **It moves, and it stops when a pointer is over it.** The client's whole
//     brief. Measured as the rail's rendered position at three moments, not as
//     "the animation property is set" — that is the difference this project's
//     catalogue is made of.
//   - **The loop's seam.** A marquee that translates by -50% only lands the
//     duplicate track where the original was if the rail is exactly twice one
//     track's width. Get the gap model wrong and the row jumps by one gap every
//     cycle — visible once a minute and invisible in any static screenshot.
//   - **The full text is reachable, and it is the WHOLE text.** A card clamps
//     its quote with CSS. If the panel it opens showed the same clamped text,
//     every check short of reading it would still pass.
//
//   - **Contrast, at every point in the loop.** Assertion 11, and the one thing
//     `check_contrast_over_photos.mjs` genuinely cannot do: it crops ONE
//     screenshot to an element's rect, and a card in a marquee is over a
//     different part of the photograph in every frame. Two runs for it were
//     written there on 20 Aug 2026 and removed the same hour — half the cards
//     are outside the viewport at any moment, which is a `bad extract area`
//     crash rather than a wrong answer.
//
// The palette is `lib/palette.test.ts`'s and the rating arithmetic is
// `lib/reviews.test.ts`'s. What is here is what needs a browser.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = flag("port", "3131");
const BASE = flag("url", `http://localhost:${PORT}`);
const OUT = flag("out", "docs/reviews/2026-08-20-reviews/reviews.json");

const failures = [];
const notes = [];
let report_phases = null;
let report_worst = null;
const fail = (assertion, where, message) => failures.push({ assertion, where, message });

/** The type colour on every card — cream, not white, as everywhere on this page. */
const CREAM = [0xf1, 0xe9, 0xd7];
/** Body copy's floor. The attribution and the quote are both body. */
const TEXT_FLOOR = 4.5;
/** How many places round the loop the contrast is taken. See assertion 11. */
const PHASES = 8;

const luminance = (rgb) =>
  rgb
    .map((c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : Math.pow((c / 255 + 0.055) / 1.055, 2.4)))
    .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);

const ratio = (rgb, text = CREAM) => {
  const [hi, lo] = [luminance(rgb), luminance(text)].sort((a, b) => b - a);
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
};

/** Past the welcome screen and its fade, with room to spare. */
const AFTER_WELCOME = 2800;

/** Bring the carousel into view and let Lenis settle before measuring. */
async function showReviews(page) {
  await page.evaluate(() => {
    const el = document.querySelector(".reviews");
    if (!el) return;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.55,
      behavior: "instant",
    });
  });
  // A poll rather than a flat wait: Lenis glides, and a fixed number is either
  // wasted time or a measurement taken mid-glide. `check_films.mjs` learnt this.
  await page.waitForFunction(
    () => {
      const y = window.scrollY;
      return new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(Math.abs(window.scrollY - y) < 0.5))),
      );
    },
    { timeout: 5000 },
  ).catch(() => {});
}

/**
 * Where the rail actually is right now, in pixels.
 *
 * **Read off a rendered box, not off `transform`.** The marquee animates the
 * `translate` PROPERTY, which Tailwind v4 and this stylesheet both use in
 * preference to `transform` — so `getComputedStyle(rail).transform` is the
 * string "none" for the whole of a running loop, and a rig reading it measures a
 * carousel that never moves. It reported exactly that on its first run. A
 * bounding rect is agnostic about which property put the element where it is,
 * which is the property a measurement should have.
 */
const RAIL_X = () => {
  const rail = document.querySelector(".reviews-rail");
  if (!rail) return null;
  return Math.round(rail.getBoundingClientRect().x * 100) / 100;
};

const GEOMETRY = () => {
  const reviews = document.querySelector(".reviews");
  const rail = document.querySelector(".reviews-rail");
  const tracks = [...document.querySelectorAll(".reviews-track")];
  const cards = [...document.querySelectorAll(".reviews .review-card")];
  if (!reviews || !rail || !cards.length) return { found: false };
  const box = reviews.getBoundingClientRect();
  const first = cards[0].getBoundingClientRect();
  return {
    found: true,
    mode: reviews.getAttribute("data-reviews-mode"),
    containerW: Math.round(box.width),
    railW: Math.round(rail.getBoundingClientRect().width),
    trackWidths: tracks.map((t) => Math.round(t.getBoundingClientRect().width)),
    tracks: tracks.length,
    cards: cards.length,
    cardW: Math.round(first.width),
    cardH: Math.round(first.height),
    pitch:
      cards.length > 1
        ? Math.round(cards[1].getBoundingClientRect().x - cards[0].getBoundingClientRect().x)
        : null,
    overflow: getComputedStyle(reviews).overflow,
    duration: getComputedStyle(rail).animationDuration,
    // Every panel in the document, and whether each has a card pointing at it.
    panels: [...document.querySelectorAll(".review-full")].map((p) => p.id),
    links: [...document.querySelectorAll(".reviews .review-card-link")].map((a) =>
      a.getAttribute("href"),
    ),
    // The duplicate track must be out of the tab order AND out of the tree.
    echoInert: tracks.length > 1 ? tracks[1].hasAttribute("inert") : null,
    echoHidden: tracks.length > 1 ? tracks[1].getAttribute("aria-hidden") : null,
    // Is each card's quote actually cut, and does it say so?
    cardText: [...document.querySelectorAll(".reviews .review-card")].map((card) => {
      const p = card.querySelector(".review-quote p");
      return {
        clipped: p ? p.scrollHeight > p.clientHeight + 1 : null,
        saysSo: Boolean(card.querySelector(".review-more")),
        text: (p?.textContent ?? "").trim(),
        circles: [...card.querySelectorAll(".review-circle")].map((c) =>
          c.getAttribute("data-circle"),
        ),
        srRating: card.querySelector(".sr-only")?.textContent?.trim() ?? null,
      };
    }),
  };
};

const browser = await chromium.launch();

/* ────────────────────────────────────────────────────────────────────────────
 * 1-5 — the carousel at 1440x900, with motion.
 * ──────────────────────────────────────────────────────────────────────────── */

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(AFTER_WELCOME);
await showReviews(page);

const geo = await page.evaluate(GEOMETRY);
const where = "1440x900";

// 1 — There is a carousel, and it holds every review the page declares.
if (!geo.found) {
  fail(1, where, "no .reviews carousel on the page at all");
} else {
  if (geo.cards === 0) fail(1, where, "the carousel has no cards");
  if (geo.panels.length === 0) fail(1, where, "no full-text panels were rendered");
  for (const href of geo.links) {
    const id = href.replace(/^#/, "");
    if (!geo.panels.includes(id)) {
      fail(1, where, `a card links to ${href}, which is not a panel on this page`);
    }
  }
  if (new Set(geo.panels).size !== geo.panels.length) {
    fail(1, where, `two panels share an id: ${geo.panels.join(", ")} — :target opens only one`);
  }
}

// 2 — The seam. A -50% translate only lands where the original was if the rail
//     is exactly twice one track. This is the assertion that catches a gap model
//     that is one gap out, which is invisible in any screenshot.
if (geo.found && geo.mode === "loop") {
  if (geo.tracks !== 2) {
    fail(2, where, `${geo.tracks} track(s) in a looping carousel — a -50% translate needs exactly 2`);
  } else if (Math.abs(geo.trackWidths[0] - geo.trackWidths[1]) > 1) {
    fail(2, where, `the two tracks are ${geo.trackWidths[0]}px and ${geo.trackWidths[1]}px — the seam will jump`);
  } else if (Math.abs(geo.railW - geo.trackWidths[0] * 2) > 1) {
    fail(
      2,
      where,
      `the rail is ${geo.railW}px against two tracks of ${geo.trackWidths[0]}px — a -50% translate lands ${Math.round(geo.railW / 2 - geo.trackWidths[0])}px off the seam, every cycle`,
    );
  }
  // And the track has to be wider than what shows, or the loop reveals bare
  // section between the last card and the first.
  if (geo.trackWidths[0] < geo.containerW) {
    fail(
      2,
      where,
      `one track is ${geo.trackWidths[0]}px inside a ${geo.containerW}px frame — there are too few reviews to tile, and the loop will show a gap`,
    );
  }
}

// 3 — It actually moves, and the duration is per card rather than fixed.
if (geo.found) {
  const a = await page.evaluate(RAIL_X);
  await page.waitForTimeout(1400);
  const b = await page.evaluate(RAIL_X);
  const travelled = Math.abs(b - a);
  if (geo.mode === "loop") {
    if (travelled < 20) {
      fail(3, where, `the rail moved ${travelled}px in 1.4s — the carousel is not scrolling`);
    }
    notes.push(`loop: ${travelled}px of travel in 1.4s (${Math.round(travelled / 1.4)}px/s), duration ${geo.duration}`);
    // Slow is the brief. A carousel a visitor cannot read is not one.
    if (travelled / 1.4 > 140) {
      fail(3, where, `the rail is running at ${Math.round(travelled / 1.4)}px/s — the client asked for slow`);
    }
  }
}

// 4 — It pauses under the pointer. The client's own second sentence.
if (geo.found && geo.mode === "loop") {
  const box = await page.evaluate(() => {
    const r = document.querySelector(".reviews").getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await page.mouse.move(box.x, box.y);
  await page.waitForTimeout(300);
  const held = await page.evaluate(RAIL_X);
  await page.waitForTimeout(1400);
  const stillHeld = await page.evaluate(RAIL_X);
  if (Math.abs(stillHeld - held) > 1.5) {
    fail(
      4,
      where,
      `the rail moved ${Math.round(Math.abs(stillHeld - held))}px in 1.4s while the pointer was on it — it does not pause`,
    );
  }
  // And it starts again when the pointer leaves, or "pause" is "stop".
  await page.mouse.move(4, 4);
  await page.waitForTimeout(1400);
  const resumed = await page.evaluate(RAIL_X);
  if (Math.abs(resumed - stillHeld) < 20) {
    fail(4, where, "the rail did not start again after the pointer left — that is a stop, not a pause");
  }
}

// 5 — The read-more label agrees with what is actually cut, and the rating
//     circles agree with the figure in `content/home.ts`.
if (geo.found) {
  for (const [i, card] of geo.cardText.entries()) {
    if (card.clipped && !card.saysSo) {
      // Reported, not fatal: `isQuoteClamped` is a character count and the whole
      // card is a link either way, so this can only ever withhold a LABEL. Its
      // own note in `lib/reviews.ts` says nothing correctness-bearing may rest
      // on it, and this is the check that keeps that honest.
      notes.push(
        `card ${i + 1} is cut but shows no "Read more" — REVIEW_CHARS_PER_LINE is under-estimating: "${card.text.slice(0, 48)}…"`,
      );
    }
    if (!card.clipped && card.saysSo) {
      notes.push(`card ${i + 1} says "Read more" but fits — REVIEW_CHARS_PER_LINE is over-estimating`);
    }
    if (card.circles.length && !card.srRating) {
      fail(
        5,
        where,
        `card ${i + 1} draws ${card.circles.length} rating circles and says the rating nowhere — it is a number that exists only as a colour`,
      );
    }
    if (card.circles.length && card.circles.length !== 5) {
      fail(5, where, `card ${i + 1} draws ${card.circles.length} circles, not 5`);
    }
    if (card.srRating) {
      const filled = card.circles.reduce(
        (n, c) => n + (c === "full" ? 1 : c === "half" ? 0.5 : 0),
        0,
      );
      const said = Number(/Rated ([\d.]+) out of/.exec(card.srRating)?.[1]);
      if (said !== filled) {
        fail(
          5,
          where,
          `card ${i + 1} draws ${filled} circles and announces "${card.srRating}" — the shapes and the words disagree`,
        );
      }
    }
  }
  if (geo.cardText.every((c) => c.circles.length === 0)) {
    notes.push(
      "no review carries a rating yet, so the gold circles are unmeasured on the page — " +
        "`content/home.ts` has no `rating` on any entry (this is expected until the client's own set arrives)",
    );
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 6 — The full text, opened by :target, IS the full text.
 * ──────────────────────────────────────────────────────────────────────────── */

{
  const first = geo.found ? geo.panels[0] : null;
  if (first) {
    // A fresh context rather than a hash change on this page: `page.goto` to the
    // same URL with only a different fragment performs no navigation at all and
    // returns null, which the first version of this rig read as a load failure.
    // Loading the fragment cold is also the case that matters — `:target`
    // applies on FIRST PAINT, which is what the z-index below is about.
    await page.goto(`${BASE}/#${first}`, { waitUntil: "load" });
    await page.waitForTimeout(AFTER_WELCOME);
    const panel = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const box = el.querySelector(".review-full-box");
      const p = el.querySelector(".review-full-quote p");
      const card = document.querySelector(`.reviews a[href="#${id}"] .review-quote p`);
      return {
        visible: getComputedStyle(el).display !== "none",
        onTop: (() => {
          const r = box.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + 24);
          return box.contains(hit);
        })(),
        zIndex: getComputedStyle(el).zIndex,
        clipped: p ? p.scrollHeight > p.clientHeight + 1 : null,
        panelText: (p?.textContent ?? "").trim(),
        cardText: (card?.textContent ?? "").trim(),
        boxW: Math.round(box.getBoundingClientRect().width),
        overflowsViewport:
          box.getBoundingClientRect().right > window.innerWidth + 1 ||
          box.getBoundingClientRect().left < -1,
        close: Boolean(el.querySelector(".review-full-close")),
        backdrop: Boolean(el.querySelector(".review-full-backdrop")),
      };
    }, first);

    if (!panel) {
      fail(6, where, `#${first} is not in the document`);
    } else {
      if (!panel.visible) fail(6, where, `#${first} did not open on :target`);
      if (!panel.onTop) fail(6, where, `#${first} opened but something is painted over it`);
      // The whole point. A panel showing the same clamped text as the card is a
      // "read more" that reveals nothing, and every other check here passes.
      if (panel.clipped) {
        fail(6, where, `#${first} clamps its own text — the panel is not showing the full review`);
      }
      if (panel.panelText.length < panel.cardText.length) {
        fail(
          6,
          where,
          `#${first} shows ${panel.panelText.length} characters against the card's ${panel.cardText.length} — the panel has less than the card`,
        );
      }
      if (panel.overflowsViewport) fail(6, where, `#${first}'s box runs off the viewport`);
      if (!panel.close) fail(6, where, `#${first} has no close control`);
      if (!panel.backdrop) fail(6, where, `#${first} has no backdrop to click away`);
      const z = Number(panel.zIndex);
      // Below the welcome's 90, above every piece of persistent chrome. `:target`
      // applies on FIRST PAINT, so a link with a fragment in it opens the panel
      // while the welcome is still holding — see the note in `app/globals.css`.
      if (!(z > 50 && z < 90)) {
        fail(6, where, `#${first} is at z-index ${z} — it must sit above the chrome (50) and below the welcome (90)`);
      }
      notes.push(`panel ${first}: ${panel.panelText.length} chars against the card's ${panel.cardText.length}, box ${panel.boxW}px, z ${z}`);
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 7 — The duplicate track is out of the tab order and out of the tree.
 * ──────────────────────────────────────────────────────────────────────────── */

if (geo.found && geo.mode === "loop") {
  if (geo.echoHidden !== "true") {
    fail(7, where, "the duplicate track is not aria-hidden — a screen reader reads every review twice");
  }
  if (!geo.echoInert) {
    fail(
      7,
      where,
      "the duplicate track is not inert — its links stay in the tab order while being unannounced, so a keyboard visitor lands on something that is not there",
    );
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 11 — Contrast, at every point in the loop rather than at one of them.
 *
 * **This is the assertion the obvious rig cannot make, and it is why the two
 * runs written for `check_contrast_over_photos.mjs` were removed the same hour
 * they were added.** That rig crops one screenshot to an element's rect. A card
 * in a marquee is over a different part of the photograph in every frame, and
 * half of them are outside the viewport — which is a `bad extract area` crash,
 * not a wrong number. Measuring where a card happens to be when the shutter
 * falls answers a question nobody asked.
 *
 * So the marquee is frozen at eight evenly spaced phases across one full track,
 * and at each one every card that is genuinely inside both the carousel's frame
 * and the viewport has its type hidden and the pixels beneath it read. **Real
 * composited pixels, card wash included** — hiding the `<p>` leaves its
 * ancestor's background exactly where it was, which is the whole point: what is
 * being solved here is the card's own wash over an unknown patch of photograph.
 *
 * The reported figure is the worst pixel found anywhere in the loop. That is the
 * number the card's wash has to be solved against, because a carousel visits
 * every part of the frame behind it and a scrim solved for one position is a
 * scrim solved for one twentieth of a second.
 * ──────────────────────────────────────────────────────────────────────────── */

if (geo.found) {
  /*
   * **Put the page back first, and this is not defensive tidying.** Assertion 6
   * navigates to a review's own fragment, and assertion 11 read the results:
   * the carousel ended up under `SiteHeader`'s fixed cream bar, so every crop
   * came back rgb(241,233,215) — `--bg` exactly — and the rig reported 1.00:1
   * on all eight phases. That is a real failure mode of this composition
   * (`Invitation.tsx`'s own top padding exists because of it) and it was NOT
   * what was happening; the rig had simply moved the page under itself.
   *
   * A rig that shares one page across assertions has to restore what it
   * disturbed. This is the third instance on this project of an instrument
   * steering the thing it measures — after `scroll-snap` quantising two rigs'
   * own samples, and a per-frame layout read pushing the hero's reveal by 700ms.
   */
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(AFTER_WELCOME);
  await showReviews(page);
  await page.mouse.move(4, 4);
  const geoAgain = await page.evaluate(GEOMETRY);
  const trackW = geoAgain.trackWidths[0];
  let worstAnywhere = { ratio: Number.POSITIVE_INFINITY, phase: null, px: null, run: null };
  const perPhase = [];

  for (let phase = 0; phase < PHASES; phase++) {
    const offset = -(trackW * phase) / PHASES;
    // Freeze the rail exactly where the marquee would have it. `animation:
    // none` first, or the running animation keeps overriding the translate.
    await page.evaluate((x) => {
      const rail = document.querySelector(".reviews-rail");
      rail.style.animation = "none";
      rail.style.translate = `${x}px`;
    }, offset);
    await page.waitForTimeout(90);

    // Only what a visitor can actually see: inside the carousel's own frame AND
    // inside the viewport. A card half-out of either would be cropped from a
    // screenshot that does not contain it.
    const boxes = await page.evaluate(() => {
      const frame = document.querySelector(".reviews").getBoundingClientRect();
      const out = [];
      for (const sel of [".review-quote p", ".review-attribution", ".review-more"]) {
        for (const el of document.querySelectorAll(`.reviews ${sel}`)) {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const left = Math.max(r.left, frame.left, 0);
          const right = Math.min(r.right, frame.right, window.innerWidth);
          const top = Math.max(r.top, 0);
          const bottom = Math.min(r.bottom, window.innerHeight);
          if (right - left < 8 || bottom - top < 4) continue;
          out.push({
            run: sel,
            x: Math.floor(left),
            y: Math.floor(top),
            w: Math.floor(right - left),
            h: Math.floor(bottom - top),
          });
        }
      }
      return out;
    });

    // Hide the glyphs, keep every background. `visibility: hidden` on the text
    // element only — its ancestor carries the card's wash, which must stay.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll(
        ".reviews .review-quote p, .reviews .review-attribution, .reviews .review-more",
      )) {
        el.dataset.rigStyle = el.getAttribute("style") ?? "";
        el.style.visibility = "hidden";
      }
    });
    await page.waitForTimeout(60);
    const shot = await page.screenshot();
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("[data-rig-style]")) {
        const was = el.dataset.rigStyle;
        if (was) el.setAttribute("style", was);
        else el.removeAttribute("style");
        delete el.dataset.rigStyle;
      }
    });

    let worstHere = { ratio: Number.POSITIVE_INFINITY, px: null, run: null };
    for (const b of boxes) {
      const { data, info } = await sharp(shot)
        .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += info.channels) {
        const px = [data[i], data[i + 1], data[i + 2]];
        const r = ratio(px);
        if (r < worstHere.ratio) worstHere = { ratio: r, px, run: b.run };
      }
    }
    perPhase.push({ phase, offset: Math.round(offset), boxes: boxes.length, worst: worstHere.ratio });
    if (worstHere.ratio < worstAnywhere.ratio) worstAnywhere = { ...worstHere, phase };
  }

  // Put the marquee back, so anything measured after this is measuring the page
  // rather than the rig's own leftovers.
  await page.evaluate(() => {
    const rail = document.querySelector(".reviews-rail");
    rail.style.removeProperty("animation");
    rail.style.removeProperty("translate");
  });

  if (worstAnywhere.ratio < TEXT_FLOOR) {
    fail(
      11,
      where,
      `the worst pixel under a card's type anywhere in the loop is ${worstAnywhere.ratio}:1 against a ${TEXT_FLOOR} floor ` +
        `(${worstAnywhere.run} at phase ${worstAnywhere.phase} of ${PHASES}, rgb ${worstAnywhere.px?.join(",")}) — ` +
        `the card's own wash in app/globals.css is what solves this, not the section's scrim`,
    );
  }
  notes.push(
    `contrast over ${PHASES} phases: worst ${worstAnywhere.ratio}:1 (${worstAnywhere.run}, phase ${worstAnywhere.phase}), ` +
      `per phase ${perPhase.map((p) => p.worst).join(" ")}`,
  );
  report_phases = perPhase;
  report_worst = worstAnywhere;
}

await context.close();

/* ────────────────────────────────────────────────────────────────────────────
 * 8 — Reduced motion: still, and still reachable.
 * ──────────────────────────────────────────────────────────────────────────── */

{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const p2 = await ctx.newPage();
  await p2.goto(BASE, { waitUntil: "load" });
  await p2.waitForTimeout(AFTER_WELCOME);
  await showReviews(p2);
  const a = await p2.evaluate(RAIL_X);
  await p2.waitForTimeout(1600);
  const b = await p2.evaluate(RAIL_X);
  if (a !== null && Math.abs(b - a) > 1) {
    fail(8, "reduced-motion", `the rail moved ${Math.round(Math.abs(b - a))}px for a visitor who asked for less motion`);
  }
  // The movement is decoration; the reviews are content. A still carousel must
  // still show reviews.
  const shown = await p2.evaluate(() => {
    const cards = [...document.querySelectorAll(".reviews .review-card")];
    const box = document.querySelector(".reviews")?.getBoundingClientRect();
    if (!box) return 0;
    return cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.right > box.left + 2 && r.left < box.right - 2;
    }).length;
  });
  if (shown < 1) fail(8, "reduced-motion", "no review is visible at all with reduced motion on");
  notes.push(`reduced motion: rail still (${Math.abs(b - a)}px), ${shown} card(s) in frame`);
  await ctx.close();
}

/* ────────────────────────────────────────────────────────────────────────────
 * 9 — No JavaScript. Everything here is CSS, so everything here must survive it.
 * ──────────────────────────────────────────────────────────────────────────── */

{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const p3 = await ctx.newPage();
  await p3.goto(BASE, { waitUntil: "load" });
  const noJs = await p3
    .evaluate(() => ({
      cards: document.querySelectorAll(".reviews .review-card").length,
      panels: document.querySelectorAll(".review-full").length,
    }))
    .catch(() => null);
  if (!noJs || noJs.cards === 0) {
    fail(9, "no-JS", "no review cards with JavaScript disabled — the carousel is not server-rendered");
  }
  if (noJs && noJs.panels === 0) {
    fail(9, "no-JS", "no full-text panels with JavaScript disabled");
  }
  // And the panel still opens, because `:target` is CSS.
  const firstId = geo.found ? geo.panels[0] : null;
  if (firstId) {
    await p3.goto(`${BASE}/#${firstId}`, { waitUntil: "load" });
    const open = await p3
      .evaluate((id) => getComputedStyle(document.getElementById(id)).display !== "none", firstId)
      .catch(() => false);
    if (!open) fail(9, "no-JS", `#${firstId} did not open with JavaScript disabled — :target is CSS and must`);
  }
  await ctx.close();
}

/* ────────────────────────────────────────────────────────────────────────────
 * 10 — A phone. Narrow enough that the card's `vw` arm is what binds.
 * ──────────────────────────────────────────────────────────────────────────── */

{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const p4 = await ctx.newPage();
  await p4.goto(BASE, { waitUntil: "load" });
  await p4.waitForTimeout(AFTER_WELCOME);
  await showReviews(p4);
  const small = await p4.evaluate(() => {
    const box = document.querySelector(".reviews")?.getBoundingClientRect();
    const card = document.querySelector(".reviews .review-card")?.getBoundingClientRect();
    const doc = document.documentElement;
    return box && card
      ? {
          containerW: Math.round(box.width),
          cardW: Math.round(card.width),
          peek: Math.round(box.width - card.width),
          horizontalScroll: doc.scrollWidth - doc.clientWidth,
        }
      : null;
  });
  if (!small) fail(10, "360x800", "no carousel at 360px");
  else {
    if (small.cardW > small.containerW) {
      fail(10, "360x800", `the card is ${small.cardW}px in a ${small.containerW}px frame — it does not fit`);
    }
    // The peek is the only affordance a clipped carousel has that it continues.
    if (small.peek < 12) {
      fail(
        10,
        "360x800",
        `only ${small.peek}px of the next card shows — the carousel reads as a single card with nothing after it`,
      );
    }
    if (small.horizontalScroll > 1) {
      fail(10, "360x800", `the page scrolls sideways by ${small.horizontalScroll}px`);
    }
    notes.push(`360x800: card ${small.cardW}px in ${small.containerW}px, ${small.peek}px of peek`);
  }
  await ctx.close();
}

await browser.close();

const report = {
  url: BASE,
  mode: geo.mode ?? null,
  geometry: geo,
  contrast: { floor: TEXT_FLOOR, phases: report_phases, worst: report_worst },
  notes,
  failures,
};
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (geo.found) {
  console.log(
    `mode ${geo.mode} — ${geo.cards} card(s) over ${geo.tracks} track(s), ${geo.cardW}x${geo.cardH} at a ${geo.pitch}px pitch, ` +
      `container ${geo.containerW}px, rail ${geo.railW}px, duration ${geo.duration}`,
  );
}
for (const n of notes) console.log(`  note: ${n}`);
console.log(`Wrote ${OUT}`);

if (failures.length === 0) {
  console.log("\nPASS — 10 assertions.");
} else {
  console.error(`\nFAILED: ${failures.length} finding(s)`);
  for (const f of failures) console.error(`  [${f.assertion}] ${f.where}: ${f.message}`);
}
process.exitCode = failures.length === 0 ? 0 : 1;
