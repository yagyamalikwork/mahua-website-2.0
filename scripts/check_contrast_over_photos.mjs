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
// **1024 joined the four on 19 Aug 2026, and it is not a round-number
// addition.** `01 · The Lodges`' two panels sit side by side from exactly that
// width, so 1024 is where a panel is smallest and its block of type tallest as a
// fraction of it — the binding case for that chapter's scrim, and 300px away
// from the nearest width this rig used to sample. Five defects on this project
// have now lived between its fixed samples (`DECISIONS.md` §2 #44-45, #52-53,
// §20.7); a scrim solved at a width nothing measures would have been the sixth.
//
// **360 joined them on 20 Aug 2026, and it was the sixth.** The 19 Aug sweep of
// unsampled widths in `docs/reviews/2026-08-19-home-v2/panels-and-band.md` §6.5
// found `strip · card 02` at **3.30 against its 4.5 floor at 360px** — a card
// whose six scrims had all been solved at 390 and up, where the card is a flat
// 340px, while at 360 it is `78vw` = 281px and every glyph sits on a different
// crop of the photograph. A scrim answers to the pixels under the glyphs
// (`DECISIONS.md` §20.5), so a card that CHANGES SIZE below the narrowest width
// anybody measures is a card nobody has measured. 360 is the narrowest viewport
// this project's rigs sweep (`check_experience_strip.mjs` starts there), and it
// is now the narrowest one that is *solved* there too.
const WIDTHS = flag("widths", "360,390,768,1024,1440,1920").split(",").map(Number);
/**
 * The viewport shape each width is measured at.
 *
 * A phone is 844 tall and a laptop is 900, and **1024 is 768 rather than 900 on
 * purpose** — a real laptop shape, and what decides how much of a section is in
 * frame when a run scrolls to it. 360 takes the phone's height for the same
 * reason 390 does: at 360 × 900 the browser would report a device nobody holds,
 * and `02 · The Jungles`' band is a box whose aspect depends on both axes.
 */
const heightFor = (width) => (width <= 430 ? 844 : width <= 800 ? 1024 : width <= 1100 ? 768 : 900);

/** The type colour over every photograph on the page — cream, not white. */
const CREAM = [0xf1, 0xe9, 0xd7];
/** `PALETTE.ink` — the header's menu label once the bar has gone cream. */
const INK = [0x31, 0x40, 0x2c];
/** `PALETTE.brand` — the client's own wordmark brown, on the cream bar only. */
const BRAND = [0x7f, 0x5c, 0x24];
/**
 * `PALETTE.dim` — the page's lighter body colour, and the one the forest tint's
 * floor is set by.
 *
 * **Unused since 19 Aug 2026, and deliberately kept**, on the same terms as
 * `GOLD_TEXT` below. Its one run was `forest · intro`, the paragraph over the
 * hornbill tint, and `03 · The Forest` left the page in the v2 restructure —
 * the tint is unmounted rather than deleted (`app/page.tsx`'s note on the
 * retired `plateGrid` arm), so the day it is hung behind another cream chapter
 * this is the foreground colour its run needs. A constant with that history
 * attached is cheaper to keep than to rediscover.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- see above: retained on purpose
const DIM = [0x5a, 0x52, 0x40];
/** `PALETTE.overlay` — the pill's label, on gold, in both header states. */
const OVERLAY = [0x23, 0x2b, 0x21];
/**
 * `PALETTE.goldText` — the menu's region label ("Pench", "Tadoba") and its
 * "Where next" hint, both set via `--accent-text`. Added 10-11 Aug 2026 for
 * the menu-over-photograph probes: the panel's glass wash is translucent
 * (`.site-menu-glass`, `color-mix(in srgb, var(--bg) …%, transparent)`),
 * which makes every run of type on it type over whatever photograph the menu
 * was opened above — a case no probe in this file measured before, because
 * every earlier run either sat on solid paper, a solid pill, or a photograph
 * with no translucent layer between the two.
 *
 * **This is the probe that found the wash's original 82% too thin.** The
 * region label failed at 3.43-3.55:1 against its 4.5:1 floor before the fix;
 * `app/globals.css`'s own comment on `.site-menu-glass` is the authority on
 * the wash's current value and the full working behind it — read the
 * percentage off that CSS rule itself, not off a number restated here, which
 * would go stale the moment the wash is re-solved.
 *
 * **Unused since 11 Aug 2026, and deliberately kept.** The client resolved
 * that failure by spending the accent rather than the glass, so both runs it
 * named are now `INK` and no type anywhere on this site is goldText over a
 * photograph. It is retained, rather than deleted, because it is exactly the
 * value to restore if gold text ever returns to the panel — and because a
 * constant with this history attached is cheaper to keep than to rediscover.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- see above: retained on purpose
const GOLD_TEXT = [0x7a, 0x5c, 0x18];

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

/**
 * The menu-over-photograph probes, one pair per route, added 10-11 Aug 2026.
 * `heroId` is the route's own hero — the frost's worst case, because it is the
 * one photograph guaranteed behind the menu on every route at scroll position
 * zero. `pre: "menu"` (handled in `measure()`) opens the panel before either
 * box is read.
 *
 * Two runs, not one, because the panel carries two different colours of type
 * over the same glass: the place names themselves (`--text`, ink) and the
 * region labels beside them (`--accent-text`, goldText) — CLAUDE.md #7's
 * "goldText is the legible sibling; use it for any text that would otherwise
 * sit in gold" is exactly the claim this second probe is checking.
 */
const MENU_RUNS = (heroId) => [
  {
    name: "menu · place over frost",
    min: 3,
    at: `#${heroId}`,
    pre: "menu",
    container: "#site-menu",
    sel: "#site-menu a span.rule-in",
    text: INK,
  },
  {
    name: "menu · region over frost",
    min: 4.5,
    at: `#${heroId}`,
    pre: "menu",
    container: "#site-menu",
    // `[class*='--accent-text']` (the shape first proposed for this probe)
    // matches nothing — the colour is inline, not a class. `SiteMenu.tsx`
    // carries `data-contrast="menu-region"` for exactly this, following
    // `BrandMark`'s own wordmark hook.
    //
    // INK since 11 Aug 2026, not GOLD_TEXT: this label is what failed at
    // 3.43-3.55:1 on the 82% wash, and the client's fix was to spend the gold
    // rather than the glass. **If it ever goes back to gold, this `text:` must
    // go back with it** — a probe measuring the wrong foreground reports a
    // confident number about a colour that is not on the page.
    sel: "#site-menu a [data-contrast='menu-region']",
    text: INK,
  },
  {
    // The panel's top-strip hint sits outside the boxes the two runs above
    // probe, and until 10-11 Aug 2026's review follow-up nothing read it at
    // all — it was goldText on the same wash, failing beside the region label,
    // unmeasured (`docs/DECISIONS.md` §2 #35). Ink since 11 Aug, same ruling
    // and same warning as the region above.
    name: "menu · hint over frost",
    min: 4.5,
    at: `#${heroId}`,
    pre: "menu",
    container: "#site-menu",
    sel: "#site-menu [data-contrast='menu-hint']",
    text: INK,
  },
];

/**
 * `05 · Experiences`' six strip cards — 19 Aug 2026, replacing the six coverflow
 * runs that stood here from 16 Aug.
 *
 * Every card is cream type laid straight onto a photograph, which is the exact
 * case CLAUDE.md says must be measured against the rendered result rather than
 * assumed. **This table discovers nothing** — a card absent from it is a card
 * nobody has checked — and all six figures in `ExperienceStrip.tsx`'s
 * `CARD_SCRIM` were solved by running it, not by looking at the photographs.
 *
 * **Not one figure was carried over from the coverflow's six**, and that is the
 * standing lesson rather than caution: `docs/DECISIONS.md` §20.5 records what
 * carrying a scrim across a re-crop cost — two cards at 3.47:1 and 3.61:1
 * against a 4.5 floor, and a third over-washed to 8.00 — and here BOTH halves
 * changed. Four of the six photographs are new to the page, five of the six were
 * re-cropped to portrait in the image pipeline, and the type moved from the
 * middle of a 1.96:1 card to the foot of a 0.74 one.
 *
 * Three things about these runs are not the file's usual shape:
 *
 * 1. **`at` is the strip itself, not a card.** Every run scrolls the same
 *    element to the top of the viewport — the strip is 419px tall, so all of it
 *    is on screen at every height this rig samples — and which CARD is measured
 *    is then a horizontal question, which is `stripCard` below. Targeting a card
 *    vertically would put its own top at the viewport's top and its words, which
 *    are at its foot, 405px below that.
 * 2. **`stripCard` scrolls the STRIP, not the page.** `scrollIntoView({ inline:
 *    "start", block: "nearest" })` moves the nearest scrollable ancestor on the
 *    inline axis and leaves the block axis alone, which is exactly the pair of
 *    facts this needs. The run then checks it got what it asked for — the named
 *    card fully inside the strip's own client box — and failing to place is
 *    fatal, like a missing target. **A contrast figure read off a card half of
 *    which is outside the scroller is a confident number about pixels nobody can
 *    see**, and with `scroll-snap-type: x proximity` on that container the
 *    request and the result are genuinely allowed to differ.
 * 3. **`lines: true`**, for the reason the coverflow's runs recorded and which
 *    has not changed: every element in the block is block-level and as wide as
 *    the card's content box, so cropping the element's own rect reports the
 *    brightest pixel in an empty gutter as the worst case for glyphs nowhere
 *    near it. It measured 1.00:1 on a card whose glyphs were at 1.33, and moved
 *    solved figures by whole steps. `lines` takes a `Range` over the text nodes
 *    and gets one rect per LINE BOX instead.
 *
 * There is no fourth run-shape here where the coverflow had one. Its cards
 * carried two arrows each in their bottom corners, cream on the same photograph,
 * and the selector had to name them or a wash solved on the words alone left
 * "NEXT" unchecked. **No card in this strip carries a link at all** — the pager
 * is one row of six, below the strip and on cream — so the words are the whole
 * of what sits on a photograph here.
 *
 * `min` is **4.5, not the 3 the quote runs above use**, and that is the
 * convention rather than a departure from it: 3 is WCAG's large-text floor and
 * the quotes are display type set at 40px and up. A card's body is
 * `clamp(0.8rem, 3.1vw, 0.9rem)` — 12.8px at its floor — its label is 9.9px, and
 * its title tops out at 20.8px. None of that is large text at any width this rig
 * samples.
 */
const STRIP_RUNS = Array.from({ length: 6 }, (_, i) => {
  // Positional AND by id, which is belt and braces on purpose: the `nth-child`
  // is what the crop needs and the `#id` is what `ExperienceStrip.tsx` composes
  // through `experienceCardId`, so a run pointed at the wrong card fails the
  // placement check below rather than quietly measuring its neighbour. The
  // coverflow's own runs were positional only, and a stale `i + 2` offset there
  // measured five wrong cards in silence before crashing on the sixth.
  const card = `#field-days ul.experience-strip > li.experience-card#field-days-card-${i}`;
  return {
    name: `strip · card ${String(i + 1).padStart(2, "0")}`,
    min: 4.5,
    at: "#field-days .experience-strip",
    stripCard: card,
    lines: true,
    container: card,
    sel: `${card} [data-contrast="experience-card"]`,
  };
});

/**
 * `01 · The Lodges`' two panels — added 19 Aug 2026 with
 * `components/sections/LodgePanels.tsx` (spec §2).
 *
 * Each panel is a photograph with a region label, the lodge's name, a sentence
 * and a button laid on it, so it is the exact case CLAUDE.md's contrast rule
 * names. Two runs per panel:
 *
 * - the words, cream on the photograph, measured with `lines: true`. Every
 *   element in that block is block-level and as wide as the block's `46ch`
 *   measure, so a four-character label ("PENCH") would otherwise drag half a
 *   panel of untyped photograph into its own crop and report the brightest pixel
 *   in it as the worst case for glyphs nowhere near it — the finding the
 *   coverflow's runs record, which moved solved figures by whole steps.
 * - the button, which is a different measurement entirely: a `PillButton` is a
 *   solid gold fill, so the photograph behind it is irrelevant and what is being
 *   checked is `--overlay` on `--accent`. `hide: "color"` keeps the fill and
 *   removes the glyphs; the `<span>` inside the `<a>` is the rectangle to crop,
 *   because the `<a>` is `rounded-full` and its own rectangle includes four
 *   corners that are not gold at all. Both points are `ui/PillButton.tsx`'s.
 *
 * **`at` is each panel's own `<article>`, not `#lodges`.** Anchoring both at the
 * chapter puts the second panel's type below the fold at 390 — the panels stack
 * there — where `measure()` filters it out and the run reports NOT FOUND, which
 * this rig treats as fatal. Scrolling to the panel itself is correct at every
 * width and needs no per-width special case.
 *
 * **The words run carries `from: 1024`, and the pill run deliberately does
 * not.** Below `lg` the words are under the photograph on cream, so there is no
 * photograph to measure them against; the pill is a solid gold fill at every
 * width, so what it measures — `--overlay` on `--accent` — does not depend on
 * what is behind it. 1024 is `LODGE_PANELS.twoUpFromPx`, and this file cannot
 * import it: a `.mjs` rig cannot read a TypeScript dial, so the number is
 * repeated here and named so a reader knows where its twin lives.
 *
 * `min` is 4.5 rather than the 3 the display-type runs use: one run covers all
 * three blocks and the sentence is ~13px at 390, which is not large text at any
 * width this rig samples.
 */
const LODGE_PANEL_RUNS = [1, 2].flatMap((n) => {
  const panel = `#lodges article:nth-of-type(${n})`;
  return [
    {
      name: `lodges · panel 0${n}`,
      min: 4.5,
      at: panel,
      from: 1024,
      lines: true,
      container: panel,
      sel: `${panel} [data-contrast="lodge-panel"]`,
    },
    {
      name: `lodges · pill 0${n}`,
      min: 4.5,
      at: panel,
      container: panel,
      sel: `${panel} [data-contrast="lodge-panel-pill"] a span`,
      text: OVERLAY,
      hide: "color",
    },
  ];
});

/**
 * `02 · The Jungles`' three blocks of type — 20 Aug 2026, when the client asked
 * for them back onto the photograph (`components/sections/JunglesBand.tsx`).
 *
 * Three runs and not one, because the three floors are genuinely different and a
 * single run would have to take the strictest of them and buy it with wash the
 * heading does not need — on a photograph 19 Aug already proved goes olive-grey
 * under a flat heavy enough for its lit grass.
 *
 * | run | type | floor |
 * |---|---|---|
 * | `jungles · mark` | `ui/ChapterLabel`, 12px tracked small caps | 4.5 |
 * | `jungles · heading` | display serif, `clamp(1.6rem, 3.4vw, 2.8rem)` | 3 |
 * | `jungles · body` | body, `1.02-1.08rem` | 4.5 |
 *
 * **The heading's 3 is WCAG's large-text floor and it is earned rather than
 * borrowed.** Its clamp bottoms out at 1.6rem = 25.6px, above the 24px large
 * threshold at every width this rig samples, which is the same test `hero ·
 * headline` and the property pages' `quote · *` runs pass. The other two are not
 * large text at any width, and the mark is the smallest type anywhere on this
 * photograph.
 *
 * **The mark is measured because it is the run most likely to be forgotten.**
 * `ChapterLabel` sets itself from `--accent-text` — goldText, which
 * non-negotiable #7 says is legible on cream and on nothing else — and the
 * component keeps that colour here; what changes it is a redefinition of the
 * property on the wrapping element. A probe is what proves the redefinition
 * actually reached it, rather than a reviewer taking a `style` attribute's word
 * for it.
 *
 * `at` is the section, which puts its top at the viewport's top. All three
 * blocks sit at the FOOT of the band and the band is between 350 and 600px tall
 * at every width sampled, so nothing here is below the fold and nothing needs a
 * `from:`. `lines: true` on the mark and the body for the reason the panels'
 * runs record: both are block-level and as wide as their column, so an
 * element-rect crop would report the brightest pixel in an empty gutter as the
 * worst case for glyphs nowhere near it. The heading needs no `lines` — every
 * word in a `SplitLines` heading is already its own `[data-word]` box.
 */
const JUNGLES_RUNS = [
  {
    name: "jungles · mark",
    min: 4.5,
    at: "#why-you-came",
    lines: true,
    container: "#why-you-came",
    sel: '#why-you-came [data-contrast="jungles-mark"] p',
  },
  {
    name: "jungles · heading",
    min: 3,
    at: "#why-you-came",
    container: "#why-you-came",
    sel: "#why-you-came h2 [data-word]",
  },
  {
    name: "jungles · body",
    min: 4.5,
    at: "#why-you-came",
    lines: true,
    container: "#why-you-came",
    sel: '#why-you-came [data-contrast="jungles-body"]',
  },
];

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
   * **`forest · headline` and `forest · intro` were deleted on 19 Aug 2026, and
   * they were deleted rather than retargeted.** They measured `03 · The Forest`'s
   * ink and `--dim` type over the client's hornbill tint, and that chapter left
   * the page in the v2 restructure — there is no other chapter on any route with
   * a tint behind its type, so there is nothing for these two to point at. The
   * drawing itself is unmounted, not deleted (`app/page.tsx`); if it is ever hung
   * behind another cream chapter, restore both runs with `INK` and `DIM`
   * respectively and the new chapter's own id, and read `build_forest_overlay.mjs`
   * first: that script solves the tint against a 4.55:1 floor as arithmetic on
   * the file, and these runs exist because the file's arithmetic cannot see a
   * mask, a scale, or a second thing painted on top.
   *
   * **`quote · after-dark` went the same day.** It is one of the four chapters
   * the restructure removes outright.
   *
   * **`quote · why-you-came` was deleted on 19 Aug and `02 · The Jungles` has
   * three runs again from 20 Aug**, which is the sentence the 19 Aug note ended
   * on — *"if type is ever laid back onto that band, a run belongs here again;
   * this table is hand-written and discovers nothing"* — coming true within the
   * day. The client asked for the chapter's words back on the photograph, so
   * there are now three blocks of cream type over `jungle-cats-stitch` and each
   * one is measured. They are `JUNGLES_RUNS` below rather than a single retarget
   * of the old run: the old one measured a centred pull-quote over a different
   * photograph in a different section.
   */
  { name: "hero · sub", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival > div > p" },
  { name: "hero · scroll cue", min: 4.5, at: "#arrival", container: "#arrival", sel: "#arrival div.flex > span:nth-child(2)" },
  /*
   * **The three scrolled-header runs anchor at `#invitation` since 19 Aug 2026,
   * where they anchored at `#why-you-came` from 5 Aug.** The anchor is not
   * arbitrary and the note above explains why: it has to be a chapter where the
   * header sits over a PHOTOGRAPH, so that a cream bar which failed to arrive
   * would be measured as dark type on an image and fail loudly. Parked over a
   * cream chapter these three would pass whether the bar was there or not, which
   * is a check that cannot fail.
   *
   * `why-you-came` was a 100svh full-bleed photograph and is now a cream chapter
   * with a band inside it — its first 107px, which is what the fixed header
   * covers, is cream. `#invitation` is the home page's one remaining full-bleed
   * photograph below the hero, so it is the only anchor that still holds the
   * property these runs were written for.
   */
  {
    name: "header scrolled · menu",
    min: 4.5,
    at: "#invitation",
    container: "header",
    sel: "[aria-controls='site-menu']",
    text: INK,
  },
  {
    name: "header scrolled · wordmark",
    min: 4.5,
    at: "#invitation",
    container: "header",
    sel: '[data-contrast="brand-wordmark"]',
    text: BRAND,
  },
  {
    name: "header scrolled · pill",
    min: 4.5,
    at: "#invitation",
    container: "header",
    sel: "[data-contrast='header-pill'] a span",
    text: OVERLAY,
    hide: "color",
  },
  ...LODGE_PANEL_RUNS,
  ...JUNGLES_RUNS,
  ...STRIP_RUNS,
  { name: "invitation · heading", min: 3, at: "#invitation", container: "#invitation", sel: "#invitation h2 span" },
  { name: "invitation · body", min: 4.5, at: "#invitation", container: "#invitation", sel: "#invitation p" },
  ...MENU_RUNS("arrival"),
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
  ...MENU_RUNS(heroId),
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

/** Past this the scroll is treated as settled — see `scrollToAndSettle`. */
const SETTLE_TOLERANCE = 0.5;

/**
 * Scroll to `y` and wait for the position to actually stop changing.
 *
 * Lenis is running on this page and interpolates toward its target, so a fixed
 * wait after `window.scrollTo` can read a position the page has not reached.
 * Every other rig on this project polls instead (`check_card_stack.mjs` solved
 * it first and `check_coverflow.mjs` copied it); this file waited a flat 1500ms,
 * which was long enough for a section but is not a promise. The wait below is
 * kept ON TOP of this, because parallax and the entrance reveals settle after
 * the scroll does and the measurement is of the frame a visitor reads.
 */
async function scrollToAndSettle(page, y) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  let prev = null;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(30);
    const cur = await page.evaluate(() => window.scrollY);
    if (prev !== null && Math.abs(cur - prev) < SETTLE_TOLERANCE) return cur;
    prev = cur;
  }
  return prev;
}

async function measure(page, run) {
  // A missing scroll anchor is a missing target, full stop. Until 9 Aug 2026
  // this fell through to `?? 0` and measured wherever the page already was —
  // which is how the home page's "header scrolled" probes, run against
  // /mahua-vann where `#why-you-came` does not exist, asserted the scrolled
  // palette against the un-scrolled hero and reported 1.04:1 "failures" for
  // a header that was actually fine.
  const target = await page.evaluate(
    ({ sel, anchor }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      // `anchor` reproduces what a click on this hash does, which includes the
      // scroll container's `scroll-padding-top`. It was the coverflow's runs
      // that needed it — their targets were zero-size boxes placed at the
      // offsets an anchor click lands a card centred at — and **no run uses it
      // today**: the strip that replaced them scrolls a container rather than
      // the page, so `stripCard` below is what places a card and this stays for
      // the next section that navigates by hash.
      const pad = anchor
        ? Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
        : 0;
      return el.getBoundingClientRect().top + window.scrollY - pad;
    },
    { sel: run.at, anchor: Boolean(run.anchor) },
  );
  if (target === null) return { name: run.name, min: run.min, worst: null, boxes: 0, pass: null };
  await scrollToAndSettle(page, target);
  // Long enough for parallax and any reveal to have finished; the measurement is
  // of the settled frame, which is the one the visitor reads.
  await page.waitForTimeout(1500);

  /**
   * Did the scroll land where the run says it did?
   *
   * Only asked of a run that names a `card`, and fatal when it fails. A contrast
   * figure read off the wrong card of a carousel — or off a card wearing a
   * neighbour's veil — is a confident number about something no visitor looks
   * at, which is worse than no number at all.
   */
  /**
   * Bring the named card into the STRIP's own view, on the inline axis only.
   *
   * `block: "nearest"` is the half that matters: this runs after the page has
   * already been scrolled to put the whole strip on screen, and a `block:
   * "start"` here would undo that by scrolling the card's top to the viewport's
   * top instead. `inline: "start"` moves the strip and nothing else.
   *
   * Then it waits for the strip's own `scrollLeft` to settle, for the same
   * reason `scrollToAndSettle` exists for the page: the container carries
   * `scroll-snap-type: x proximity` and `scroll-behavior` can be smooth, so the
   * position immediately after the call is not the position that will be
   * screenshotted.
   */
  if (run.stripCard) {
    await page.evaluate((sel) => {
      document.querySelector(sel)?.scrollIntoView({ inline: "start", block: "nearest" });
    }, run.stripCard);
    let prevLeft = null;
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(30);
      const cur = await page.evaluate(
        (sel) => document.querySelector(sel)?.closest(".experience-strip")?.scrollLeft ?? null,
        run.stripCard,
      );
      if (cur === null) break;
      if (prevLeft !== null && Math.abs(cur - prevLeft) < SETTLE_TOLERANCE) break;
      prevLeft = cur;
    }
  }

  let placement = null;
  if (run.stripCard) {
    /*
     * Is the whole card inside the scroller?
     *
     * Fatal when it is not. A card clipped by the strip's edge is measured on
     * pixels a visitor cannot see, and `scroll-snap-type: x proximity` means the
     * browser is entitled to land somewhere other than where this asked — which
     * is the same class of hazard the coverflow's own placement check existed
     * for, arriving through a different mechanism. 1px of tolerance for
     * sub-pixel layout.
     */
    placement = await page.evaluate((sel) => {
      const card = document.querySelector(sel);
      const strip = card ? card.closest(".experience-strip") : null;
      if (!card || !strip) return { found: false };
      const c = card.getBoundingClientRect();
      const s = strip.getBoundingClientRect();
      return {
        found: true,
        // How far each edge of the card is INSIDE the strip's box. Negative on
        // either is a clipped card.
        leftSlack: Number((c.left - s.left).toFixed(2)),
        rightSlack: Number((s.right - c.right).toFixed(2)),
      };
    }, run.stripCard);
  }

  if (run.card) {
    placement = await page.evaluate((sel) => {
      const card = document.querySelector(sel);
      const stage = card ? card.closest("ul.coverflow-stage") : null;
      if (!card || !stage) return { found: false };
      const sr = stage.getBoundingClientRect();
      const mid = sr.left + sr.width / 2;
      const own = card.getBoundingClientRect();
      const nearest = Math.min(
        ...[...stage.querySelectorAll("li.coverflow-card")].map((el) => {
          const r = el.getBoundingClientRect();
          return Math.abs(r.left + r.width / 2 - mid);
        }),
      );
      const veilEl = card.querySelector(".coverflow-veil");
      return {
        found: true,
        offset: Number((own.left + own.width / 2 - mid).toFixed(2)),
        nearest: Number(nearest.toFixed(2)),
        veil: veilEl ? Number(getComputedStyle(veilEl).opacity) : null,
      };
    }, run.card);
  }

  /**
   * `pre: "menu"` opens the site menu over whatever photograph `run.at`
   * scrolled to, before any box is measured — the one new capability this
   * rig gained on 10-11 Aug 2026. The menu is closed again at every exit path
   * below (empty boxes, and the normal return), not only the happy path: a
   * run left open would put a fixed, full-viewport, `z-50` panel over every
   * run measured after it in the same `page`, however `RUNS` happens to be
   * ordered.
   */
  const closeMenu = async () => {
    if (run.pre !== "menu") return;
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  };
  if (run.pre === "menu") {
    await page.click("button[aria-controls='site-menu']");
    await page.waitForTimeout(700);
  }

  const boxes = await page.evaluate(
    ({ sel, lines }) => {
      const rects = [];
      for (const el of document.querySelectorAll(sel)) {
        if (!lines) {
          rects.push(el.getBoundingClientRect());
          continue;
        }
        // One rect per LINE BOX rather than one per element. A block-level
        // element's own rect is its container's full width, so a short heading
        // drags a wide strip of untyped photograph into the crop and the
        // brightest pixel in it is reported as the worst case for glyphs that
        // are nowhere near it. A `Range` over the element's text nodes is tight
        // to the run of glyphs, which is what `[data-word]` gives the headlines
        // and what nothing gave these.
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          if (!n.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          rects.push(...range.getClientRects());
        }
      }
      return rects
        .filter((r) => r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= window.innerHeight)
        .map((r) => ({
          x: Math.max(0, Math.floor(r.x)),
          y: Math.max(0, Math.floor(r.y)),
          w: Math.ceil(r.width),
          h: Math.ceil(r.height),
        }));
    },
    { sel: run.sel, lines: Boolean(run.lines) },
  );
  if (boxes.length === 0) {
    await closeMenu();
    return { name: run.name, min: run.min, worst: null, boxes: 0, pass: null, placement };
  }

  await page.evaluate(({ container, hide }) => {
    // `button` matters: the header's own run *is* a button, and leaving it
    // visible measures its cream label against cream and reports 1.06:1.
    // `h3` since 16 Aug 2026: a coverflow card's title is one, and leaving it
    // visible would have measured its own cream glyphs as the background under
    // itself — the same 1:1 reading, on the biggest word on the card. Nothing
    // else in this table has an `h3` inside a measured crop, so no committed
    // figure moves; hiding more type is only ever more correct here, because
    // every run in this file measures what is BEHIND type.
    const tags = ["h1", "h2", "h3", "p", "span", "a", "cite", "button"];
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
  await closeMenu();

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
    placement,
  };
}

/**
 * Did the scroll place the card this run claims to measure?
 *
 * **The coverflow's version of this asked a completely different question and
 * the difference is worth keeping.** There, a card was placed by the PAGE's
 * scroll offset driving a CSS animation, so the check was "is this card at the
 * stage's centre and is its veil off" — and it used `.coverflow-veil`'s own
 * opacity to answer it, because the veil is the animation's own distance from
 * the centred moment and is immune to whatever the layout is doing.
 *
 * A strip has no animation and no centre. What can go wrong here is smaller and
 * more ordinary: `scrollIntoView` asked the container to bring a card to its
 * inline start, `scroll-snap-type: x proximity` is entitled to land somewhere
 * else, and a card clipped by the scroller's edge would be measured on pixels a
 * visitor cannot see. So the question is "is the whole card inside the box", and
 * a run that cannot answer it is as fatal as a missing target.
 */
const misplacement = (run, row) => {
  if (!run.stripCard) return null;
  const p = row.placement;
  if (!p || !p.found) return `${run.stripCard} is not on the page, or is not inside a .experience-strip`;
  if (p.leftSlack < -1) {
    return `card is clipped by ${Math.abs(p.leftSlack)}px at the strip's left edge — the scroll did not land where this run asked (proximity snapping is allowed to move it)`;
  }
  if (p.rightSlack < -1) {
    return `card is clipped by ${Math.abs(p.rightSlack)}px at the strip's right edge — the strip is too narrow to show one whole card, or the scroll did not land where this run asked`;
  }
  return null;
};

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
  /**
   * A run that measured the right selector at the wrong moment.
   *
   * Counted separately from a contrast failure and equally fatal. A coverflow
   * card is only the worst case when it is the CENTRED one — a flank wears an
   * added veil, which raises cream type's contrast — so a run that sampled a
   * flank, or landed between two cards, reports a number that is true of a
   * frame nobody reads. That is the same shape of defect as an unfindable
   * target: it looks like a pass.
   */
  let misplaced = 0;

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      // Shape per width — see `heightFor`. It is a function of the width rather
      // than a table of equalities because this rig is routinely run with
      // `--widths` at values nobody ships (the 19 Aug sweep used seven), and an
      // equality table silently gave every one of them 900px, i.e. a phone the
      // shape of a laptop.
      viewport: { width, height: heightFor(width) },
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const rows = [];
    for (const run of RUNS) {
      /**
       * A run whose type is not over a photograph at THIS width.
       *
       * The one case on the site, and the reason the field exists rather than a
       * per-width table: `01 · The Lodges`' panels lay their words on the
       * photograph from `lg` up and under it, on cream, below that
       * (`LodgePanels.tsx` — a solved wash for a block filling 83% of a 390px
       * panel measured a flat of 0.56-0.60 and would have mudded both frames).
       * Ink on cream is `lib/palette.test.ts`'s job; measured here it would read
       * cream against cream and report a confident 1:1 failure about type that
       * is perfectly legible.
       *
       * **It is printed, never silent.** A skipped run looks exactly like a
       * passing one in a log that does not mention it, which is the shape of
       * defect this file's `missing` counter exists for.
       */
      if (run.from && width < run.from) {
        rows.push({ name: run.name, min: run.min, worst: null, boxes: 0, pass: null, skipped: run.from });
        continue;
      }
      const row = await measure(page, run);
      row.misplaced = misplacement(run, row);
      rows.push(row);
    }
    report.widths[width] = rows;

    console.log(`--- ${width}px ---`);
    for (const r of rows) {
      if (r.skipped) {
        console.log(
          `  ${r.name.padEnd(24)} skipped — its type is not over a photograph below ${r.skipped}px`,
        );
        continue;
      }
      if (r.pass === false) failures++;
      if (r.pass === null) missing++;
      if (r.misplaced) misplaced++;
      console.log(
        `  ${r.name.padEnd(24)} floor ${String(r.min).padEnd(4)} worst ${String(r.worst).padEnd(6)} ${
          r.pass === null ? "NOT FOUND" : r.pass ? "ok" : "FAIL"
        }`,
      );
      if (r.misplaced) console.log(`      MISPLACED @${width}px: ${r.misplaced}`);
      // How much of the strip's own box the placed card leaves either side of
      // itself. Reported every run and never fatal — it is what would show a
      // card's width or the strip's gutter drifting, and it is the number the
      // coverflow's own off-centre note occupied before the effect that needed
      // it was retired.
      if (r.placement?.found) {
        console.log(
          `      placed: ${r.placement.leftSlack}px inside the strip's left edge, ` +
            `${r.placement.rightSlack}px inside its right, at ${width}px`,
        );
      }
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

  if (misplaced > 0) {
    console.error(
      `FAILED: ${misplaced} run(s) measured their type at a scroll position where the card they name ` +
        `was not the centred, unveiled one. The figure they report is about a frame nobody reads.`,
    );
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
