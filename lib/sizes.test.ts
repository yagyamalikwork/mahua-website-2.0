import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HERO_BOX, HERO_SIZES } from "@/components/sections/Hero";
import {
  BOXES as INTRO_BOXES,
  SIZES as INTRO_SIZES,
} from "@/components/sections/ChapterIntro";
// `@/components/sections/Coverflow` is deliberately NOT imported: since 17 Aug
// 2026 that file draws no `<Photo>` at all — the client deleted its header band
// — so it exports no `SIZES`/`BOXES` and passes no `sizes` prop. The tripwire at
// the foot of this file is what would notice if that ever changed back, and it
// can only notice because its match now includes the closing quote (see below).
import { CARD_BOX, CARD_SIZES } from "@/components/sections/CoverflowCard";
import { BOXES as LODGE_BOXES, SIZES as LODGE_SIZES } from "@/components/sections/LodgeCards";
import {
  EXPERIENCE_BOXES,
  EXPERIENCE_SIZES,
  type ExperienceWeight,
} from "@/components/sections/ExperiencePair";
import { PLATE_FRAME, PLATE_SIZES } from "@/components/sections/PlateGrid";
import { ROOM_CARD_SIZES } from "@/components/sections/RoomCard";
import { GALLERY_SIZES } from "@/components/sections/RoomCardStack";
import { MENU_CARD_BOX, MENU_CARD_SIZES } from "@/components/ui/SiteHeader";
import {
  BOXES as TESTIMONIAL_BOXES,
  SIZES as TESTIMONIAL_SIZES,
} from "@/components/sections/Testimonials";
import {
  BOXES as COLLAGE_BOXES,
  SIZES as COLLAGE_SIZES,
} from "@/components/motion/PinnedCollage";
import { INVITATION_BOX, INVITATION_SIZES } from "@/components/property/PropertyInvitation";
import { LANTERN_SIZES } from "@/components/signature/lantern/HangingLantern";
import { FOREST_BACKDROP_SIZES } from "@/components/ui/ForestBackdrop";
import { EMBLEM_SIZES } from "@/components/ui/BrandMark";
import {
  WELCOME_FLOWER_SIZES,
  WELCOME_WORDMARK_SIZES,
} from "@/components/ui/WelcomeScreen";
import { FULL_BLEED_SIZES } from "@/components/ui/FullBleed";
import { MEDIA } from "./media";
import {
  capDensity,
  type CoverBox,
  coverSizes,
  DENSITY_BUCKETS,
  DENSITY_CAP,
  splitTopLevel,
} from "./sizes";

/**
 * These tests guard the *strings*. Whether Chrome then picks the tier we intended
 * is a browser question and is measured on the real page by
 * `scripts/check_image_resolution.mjs`, which reports the effective density of
 * every photograph at DPR 1, 2 and 3 and fails below the cap; whether the result
 * looks sharp is measured by `scripts/measure_sharpness.mjs`. None of the three
 * substitutes for the others: this one cannot see a browser, the second cannot
 * see a photograph, and neither of those can run in CI without a build.
 */
describe("capDensity", () => {
  it("leaves the original list intact as the fallback tail", () => {
    const original = "(min-width: 1024px) 42vw, 100vw";
    expect(capDensity(original).endsWith(original)).toBe(true);
  });

  it("puts the densest bucket first, because the first match wins", () => {
    const out = capDensity("100vw");
    expect(out.indexOf("3.5x")).toBeLessThan(out.indexOf("2.5x"));
    expect(out.indexOf("2.5x")).toBeLessThan(out.lastIndexOf("100vw"));
  });

  it("scales a bare length", () => {
    expect(capDensity("100vw")).toBe(
      "(min-resolution: 3.5x) calc(0.5 * 100vw), (min-resolution: 2.5x) calc(0.667 * 100vw), 100vw",
    );
  });

  it("keeps each entry's own media condition and ands the resolution onto it", () => {
    const out = capDensity("(min-width: 1024px) 42vw, 100vw");
    expect(out).toContain("(min-width: 1024px) and (min-resolution: 2.5x) calc(0.667 * 42vw)");
    expect(out).toContain("(min-resolution: 2.5x) calc(0.667 * 100vw)");
  });

  it("unwraps an existing calc() rather than nesting one inside another", () => {
    const out = capDensity("calc((100vw - 72px) * 0.82)");
    expect(out).toContain("calc(0.667 * ((100vw - 72px) * 0.82))");
    expect(out).not.toContain("calc(0.667 * calc(");
  });

  it("does not split on a comma inside a function", () => {
    // No caller writes this today; one will. A naive split(",") turns it into
    // two entries the browser drops, and the photograph silently reverts to
    // 100vw — the exact class of failure `sizes` bugs belong to.
    const out = capDensity("min(50vw, 400px)");
    expect(out).toContain("calc(0.667 * min(50vw, 400px))");
    expect(splitTopLevel(out)).toHaveLength(3);
  });

  it("refuses a shape it cannot parse instead of quietly skipping the cap", () => {
    expect(() => capDensity("(min-width: 1024px)")).toThrow(/no length/);
    expect(() => capDensity("(min-width: 1024px 42vw")).toThrow(/unbalanced/);
    expect(() => capDensity("not all 42vw")).toThrow(/unsupported/);
  });

  it("the cap is 2 — the number the byte/sharpness trade was argued at", () => {
    expect(DENSITY_CAP).toBe(2);
  });
});

/**
 * Every `sizes` string the page actually serves, **imported from the components
 * that use them** rather than copied here.
 *
 * The copied version covered 8 of 15. The seven it missed included all three
 * `PLATE_SIZES` and both of `Testimonials`', and since `capDensity` *throws*, an
 * unparseable string among them would have been a 500 at request time rather
 * than a red test. Importing is what makes that impossible: a new key in any of
 * these objects is covered the moment it is written, with no second list to
 * remember.
 */
type Slot = { readonly name: string; readonly sizes: string; readonly box?: CoverBox };

const LIVE_SLOTS: readonly Slot[] = [
  { name: "Hero", sizes: HERO_SIZES, box: HERO_BOX },
  // `FullBleed`'s box height varies with `heightVh`; every use on the page is
  // 100, which oversizes to ~127.6vh for the parallax buffer.
  { name: "FullBleed", sizes: FULL_BLEED_SIZES, box: { viewportHeightVh: 127.6 } },
  // The header emblem. No `box`: it is `object-fit` nothing — a transparent mark
  // drawn at its own aspect inside an auto-width slot, so the box IS the drawn
  // content and there is no cover crop to correct for.
  { name: "BrandMark", sizes: EMBLEM_SIZES },
  // No `box`: the lantern is drawn at its own aspect with no `object-fit: cover`
  // frame around it, so there is no crop for `coverSizes` to widen.
  { name: "HangingLantern", sizes: LANTERN_SIZES },
  // The forest tint behind `03 · The Forest`. No `box`: it is `object-cover`
  // over the whole section, so its drawn width is the viewport and `100vw` is
  // already the widest honest answer — there is no crop to widen further.
  { name: "ForestBackdrop", sizes: FOREST_BACKDROP_SIZES },
  // The welcome's two halves of the client's logo. Also uncropped — each is laid
  // out at its own fraction of the logo's box, at its own aspect.
  { name: "WelcomeScreen.flower", sizes: WELCOME_FLOWER_SIZES },
  { name: "WelcomeScreen.wordmark", sizes: WELCOME_WORDMARK_SIZES },
  ...(["solo", "pairTop", "pairLower"] as const).map((k) => ({
    name: `ChapterIntro.${k}`,
    sizes: INTRO_SIZES[k],
    box: INTRO_BOXES[k] as CoverBox,
  })),
  // Same three widths as `ChapterIntro` — the same columns, laid out the same
  // way — but shallower boxes, so the crop factor and therefore the file served
  // are different. Sharing a `sizes` string does not share a `sizes` *outcome*,
  // which is why these three are their own slots and not a comment saying "as
  // above".
  ...(["solo", "pairTop", "pairLower"] as const).map((k) => ({
    name: `PinnedCollage.${k}`,
    sizes: COLLAGE_SIZES[k],
    box: COLLAGE_BOXES[k] as CoverBox,
  })),
  ...(["primary", "secondary"] as const).map((k) => ({
    name: `LodgeCards.${k}`,
    sizes: LODGE_SIZES[k],
    box: LODGE_BOXES[k] as CoverBox,
  })),
  // `SplitFeature`'s six rows were here until 16 Aug 2026, when the coverflow
  // replaced it on `field-days` — its only caller — and the component was
  // deleted. Five distinct strings went with them (`wide` was two rows and one
  // string), which is the whole of this table's own count moving 29 → 24.
  // An unframed plate is `h-auto`, so nothing is cropped and there is no box to
  // describe. A grid whose plates disagree about their shape imposes one on all
  // of them, and then there is — every frame against every plate width, since
  // which frame a grid picks depends on the photographs it happens to carry.
  ...Object.entries(PLATE_SIZES).flatMap(([k, v]) => [
    { name: `PlateGrid.${k}-up`, sizes: v },
    ...Object.entries(PLATE_FRAME).map(([f, frame]) => ({
      name: `PlateGrid.${k}-up framed ${f}`,
      sizes: v,
      box: frame.ratio as CoverBox,
    })),
  ]),
  ...(["wide", "tall"] as const).map((k) => ({
    name: `Testimonials.${k}`,
    sizes: TESTIMONIAL_SIZES[k],
    box: TESTIMONIAL_BOXES[k] as CoverBox,
  })),
  // The rooms, as a stack of cards (Task 5 of the room-card-stack plan, 11
  // Aug 2026), replacing `RoomShowcase`'s three-scale ledger of bands above
  // (see the distinct-string comment beneath the assertion this feeds).
  // Every room card is `beside` since the client's 13 Aug 2026 ruling — one
  // composition, one string. The box column carries the widest current room
  // photograph (~1.50, rounded up to 1.51) rather than a layout constant: the
  // rendered box is the card's own solved geometry now, and the widest photo
  // is the worst case `sizes` must cover under `cover`.
  { name: "RoomCard.beside", sizes: ROOM_CARD_SIZES, box: 1.51 as CoverBox },
  // The room gallery's enlarged photograph (13 Aug 2026) — object-contain, so
  // the box column is the widest room photo again; a genuinely new width list
  // (nothing else on the page serves ~80vw).
  { name: "RoomCardStack.gallery", sizes: GALLERY_SIZES, box: 1.51 as CoverBox },
  // The day's six experiences, two weights. `hero` repeats `PLATE_SIZES[1]`
  // and `quiet` repeats `PLATE_SIZES[2]` verbatim — same container, same
  // columns — so neither adds a distinct string; both still get their own
  // rows because their boxes (2:1, 4:5) are new crops.
  ...(["hero", "quiet"] as const).map((k: ExperienceWeight) => ({
    name: `ExperiencePair.${k}`,
    sizes: EXPERIENCE_SIZES[k],
    box: EXPERIENCE_BOXES[k] as CoverBox,
  })),
  // The closing band's sister-lodge photograph — full container width at
  // 21:9. Repeats `PLATE_SIZES[1]`'s string verbatim (same 1600px container,
  // one column, no `50vw` tier), so this row adds no new distinct string;
  // its box is new (21:9, nobody else on the page uses it).
  { name: "PropertyInvitation.sibling", sizes: INVITATION_SIZES, box: INVITATION_BOX },
  // `SiteMenu`'s two lodge cards, drawn server-side in `SiteHeader.tsx` (the
  // client menu itself must never import `Photo`) at up to 208px — a genuinely
  // new crop and a genuinely new width list, since nothing else on the page is
  // sized this small.
  { name: "SiteMenu.card", sizes: MENU_CARD_SIZES, box: MENU_CARD_BOX },
  // `04 · Days in the Field`'s coverflow card (16 Aug 2026) — one activity, its
  // photograph filling the card with the words laid on it. Both halves are
  // derived rather than transcribed: `CARD_SIZES` is built from `COVERFLOW`'s
  // own `cardMaxPx`/`stageGutterPx`, and `CARD_BOX` from `COVERFLOW.cardBoxW` /
  // `cardBoxH`. **Since 18 Aug 2026 that box is the photographs' own 1344/685**
  // — the client's *"wider only, stay sharp"* — so it crops neither axis, where
  // the 16:9 it carried until then was solved against the 25% width-crop bound
  // on files that no longer exist. See the component's own comments.
  { name: "Coverflow.card", sizes: CARD_SIZES, box: CARD_BOX },
  // The same chapter's header band had three more rows here — `Coverflow.wide`,
  // `.pair` and `.track`, the four photographs above the stage — registered on
  // 16 Aug 2026 and removed on 17 Aug when the client deleted the band. They are
  // worth a line because of HOW they were missed for a day: the tripwire below
  // asserted the test's own source `toContain("@/components/sections/Coverflow")`,
  // which is a SUBSTRING of `@/components/sections/CoverflowCard`, so it read
  // green for a file nothing here imported. That hole is closed, which is also
  // what makes removing these three safe rather than a silent regression.
];

describe("the sizes the page actually serves", () => {
  it("covers every distinct sizes string on the page", () => {
    // A deliberate tripwire, not a fact worth asserting for its own sake. This
    // list started as eight of the fifteen strings actually in use, and the
    // seven it missed would each have thrown at request time rather than failed
    // in CI. Adding a slot must be a decision, so adding one fails here until
    // the number is changed on purpose. The companion test below — which reads
    // the components off disk — is what stops a NEW component being forgotten
    // entirely; this one stops the table being edited carelessly.
    // 17 since 5 Aug 2026: `SplitFeature.aside`, the pool laid under band 2's
    // display line (`docs/reviews/2026-08-05-density/`). The plate frames added
    // in the same change reuse `PLATE_SIZES`' strings and so add no distinct one.
    // `PinnedCollage`'s three slots, added the same day, are three more entries
    // in the table and no more distinct strings: it lays its photographs out in
    // the same three columns at the same widths as `ChapterIntro`, so it reaches
    // for the same three strings deliberately. It is still worth its own rows —
    // its boxes differ, and every assertion below runs per slot, not per string.
    // 18 since 7 Aug 2026: `HangingLantern`, the lantern hung out of `after-dark`
    // into `06 · The Lantern Hour`. 20 since 8 Aug: the welcome screen's two
    // halves of the client's stacked logo, the flower and the wordmark.
    // 21 since the same day: fixing the one-plate `vann-dining` chapter's
    // forced-two-column layout (a real bug — `landscapes > plates.length / 2`
    // reserved a second, empty column for a single landscape plate, measured
    // at 78% empty in `docs/reviews/2026-08-08-property-pages/vann-density.json`)
    // gave `PlateGrid` a genuine one-up variant, `PLATE_SIZES[1]`, which is a
    // real new string: unlike every 2/3/4-up entry it carries no `50vw`
    // tier, because a one-column grid never shares its row with another
    // plate at any width.
    // 22 since 9 Aug 2026, when the rooms index was recomposed from a card
    // grid (which reused `PlateGrid`'s 2/3-up strings and so added nothing
    // distinct) into full-width bands, after the grid measured 60.3% / 53%
    // empty against the 45% ceiling: the band's 8-of-12-column plate is one
    // genuinely new string. The field notes' sibling banner spans the full
    // container and so repeats `PLATE_SIZES[1]`'s string (deliberately
    // written out, not imported) — one more row, no new distinct string.
    // 24 since the same day, when `RoomShowcase` replaced `RoomsIndex`'s
    // ledger of bands with three rooms at three scales: `ROOM_SIZES.wide`
    // repeats `PLATE_SIZES[1]` verbatim (one more row, no new string), but
    // `offsetRight` and `offsetLeft` are genuinely new crops, so +2.
    // `RoomsIndex.band`'s own slot and string are still here too — the
    // component it describes is still wired into the live content dials
    // until Tasks 12-14 retire it, so its `sizes` string is still real and
    // still owed coverage; see the import comment above.
    // Still 24 as of the same day's `ExperiencePair`: `EXPERIENCE_SIZES.hero`
    // repeats `PLATE_SIZES[1]` verbatim and `.quiet` repeats `PLATE_SIZES[2]`
    // verbatim (same 1600px container, same columns as everywhere else that
    // reaches for those two crops), so the two new rows below add no new
    // distinct string between them — only new boxes (2:1, 4:5).
    // Still 24 as of `PropertyInvitation`, the property pages' closing band
    // (Task 8, 9 Aug 2026): `INVITATION_SIZES` is `PLATE_SIZES[1]` copied
    // character for character, checked by hand rather than assumed — same
    // 1600px container, one column, no `50vw` tier. One more row, no new
    // string; its 21:9 box is the only new thing about it.
    // 23 since Task 14 (9 Aug 2026), which retired `RoomsIndex.tsx` and
    // `FieldNotes.tsx` now that `RoomShowcase` and `PropertyInvitation` are
    // wired into both live routes and nothing imports the old two any more.
    // Their two slots come out of `LIVE_SLOTS` with them. `FieldNotes.sibling`
    // was never a distinct string (it repeated `PLATE_SIZES[1]`, per the note
    // that used to sit above it), so removing it costs nothing here.
    // `RoomsIndex.band` (`ROOMS_SIZES`) *was* the one genuinely new string
    // the 21→22 step added — no surviving slot shares it — so losing it is
    // the whole of the drop: 24 → 23, read off this suite rather than
    // computed by hand, per this task's own instruction not to guess it.
    // 24 since the site-navigation Task 3 (10 Aug 2026): `SiteMenu`'s two
    // lodge cards, drawn at up to 208px by `SiteHeader.tsx` (the server file
    // that renders the `<Photo>`s the client menu is only handed as
    // elements). Nothing else on the page is sized this small, so
    // `MENU_CARD_SIZES` is a genuinely new width list — read off this suite,
    // not guessed, per the same instruction.
    // Still 24 as of Task 5 of the room-card-stack plan (11 Aug 2026), which
    // swaps `RoomShowcase`'s three `LIVE_SLOTS` rows for `RoomCard`'s two:
    // `offsetRight` and `offsetLeft` (2 distinct strings) come out, `stacked`
    // and `beside` (2 distinct strings — neither repeats any surviving slot;
    // `stacked` differs from `PLATE_SIZES[1]` by its 144px gutter, not 96px)
    // go in. Two out, two in, read off this suite rather than assumed from
    // the row count matching — per this task's own instruction not to guess
    // it.
    // 24 → 23 since Task 4 of the image-sizing plan (13 Aug 2026), the
    // client's ruling that retired the `stacked`/`beside` choice: every room
    // card is now `beside`, one composition, one row. `ROOM_CARD_SIZES` is a
    // single string now, not a record — both old strings (`stacked`'s and
    // the old `beside`'s `(min-width: 1024px) 60vw, calc(100vw - 48px)`) go
    // out (2 distinct strings lost), and the new single string — `(min-width:
    // 1600px) 978px, (min-width: 1280px) 65vw, (min-width: 1024px) 60vw,
    // calc(100vw - 48px)`, carrying the new 65%-at-xl tier — comes in as one
    // genuinely new string (nothing else on the page reaches for 978px or
    // this exact width list). Two out, one in: net −1, 24 → 23 — read off
    // this suite by running it and reading the failure (`expected 23 to be
    // 24`) rather than computed by hand, per this task's own instruction not
    // to guess it. **The share widened again on 14 Aug 2026 (image-sizing
    // Task 8's own review, `RoomCard.tsx`'s `ROOM_CARD_SIZES` comment), to
    // `1128px`/`75vw`/`70vw` — the count this test guards is unaffected
    // (still one genuinely new string, still distinct from every other
    // slot), so only the literal numbers quoted above are now history, not
    // the assertion.
    // 23 → 24 since Task 6 of the image-sizing plan (13 Aug 2026), the room
    // gallery's click-to-expand panel: `GALLERY_SIZES` (`(min-width: 768px)
    // 80vw, calc(100vw - 32px)`) is a genuinely new width list — nothing else
    // on the page serves ~80vw — read off this suite by running it and
    // reading the failure (`expected 24 to be 23`), not computed by hand, per
    // this task's own instruction not to guess it.
    // 24 → 25 since the plate-reflow rework (14 Aug 2026), which replaced
    // `PlateGrid`'s fixed breakpoints with a flex-wrap reflow (CSS Grid
    // `auto-fit` was tried first and rejected — see `PlateGrid.tsx`'s own
    // comment), each board's `sizes` now built from its own solved REF
    // rather than a hand-picked `vw` fraction. `PLATE_SIZES[2]`'s new value
    // is not the same string as
    // before — and `ExperiencePair.quiet`'s `EXPERIENCE_SIZES.quiet` is a
    // hardcoded, independent COPY of the OLD `PLATE_SIZES[2]` string (never
    // an import; `ExperiencePair.tsx`'s own layout is unrelated to
    // `PlateGrid`'s reflow and did not change), so the coincidence that let
    // five rows (`PlateGrid.2-up` and its three framed variants, plus
    // `ExperiencePair.quiet`) share one distinct string now breaks: the four
    // `PlateGrid.2-up*` rows move to the new string together, and
    // `ExperiencePair.quiet` is left holding the old one alone. One string
    // becomes two — net +1, 24 → 25 — read off this suite by running it and
    // reading the failure (`expected 25 to be 24`), not computed by hand.
    // 25 → 26 since Task 5 of the coverflow plan (16 Aug 2026):
    // `CoverflowCard`'s `CARD_SIZES` is a genuinely new width list — derived from
    // `COVERFLOW.cardMaxPx` and `COVERFLOW.stageGutterPx` rather than from a
    // container's own columns, so neither of its two numbers appears anywhere
    // else on the page. (The literal string that comment used to quote,
    // `(min-width: 608px) 560px, calc(100vw - 48px)`, is history: the card was
    // swept from 560px to 900px on 16 Aug and it now reads `(min-width: 948px)
    // 900px, calc(100vw - 48px)`. The assertion is unaffected — still one
    // genuinely new string — so only the quoted numbers changed.) Read off this
    // suite by running it and reading the failure (`expected 26 to be 25`), not
    // computed by hand, per the same instruction as every step above.
    // 26 → 29 the same day, registering the coverflow's HEADER BAND —
    // `Coverflow.tsx`'s own `SIZES.wide`/`.pair`/`.track`, which had never been
    // in this table at all because the companion tripwire below matched
    // `@/components/sections/Coverflow` as a substring of
    // `@/components/sections/CoverflowCard` and reported itself satisfied. All
    // three are genuinely new strings: `wide` and `pair` are that band's own
    // 7/5 column split at a 56px gutter (nothing else on the page uses either),
    // and `track` is a flat 420px cap set by a 541px FILE rather than by a
    // column, which nothing else on the page does at all. Read off this suite by
    // running it and reading the failure (`expected 29 to be 26`).
    // 29 → 24 when `SplitFeature` was retired (16 Aug 2026, the coverflow plan's
    // Task 8): `field-days` was its only caller and is a `coverflow` now, so the
    // component was deleted and its six rows came out with it. Five distinct
    // strings, not six — `wide` was two rows (band 1 and band 2, same string,
    // different boxes) and one string — and none of the five was shared with any
    // surviving slot. Read off this suite by running it and reading the failure
    // (`expected 24 to be 29`), not computed by hand, per the same instruction
    // as every step above.
    // 24 → 21 on 17 Aug 2026, the client's ruling that deleted `field-days`'
    // header band outright (*"Remove all 4 images (collage of images)…"*).
    // `Coverflow.tsx` draws no photograph now, so `Coverflow.wide`, `.pair` and
    // `.track` come out — three rows and three genuinely distinct strings, none
    // of them shared with a surviving slot (`track`'s flat 420px cap in
    // particular was the only file-driven width on the page). `Coverflow.card`
    // stays: the cards are the chapter. Read off this suite by running it and
    // reading the failure (`expected 21 to be 24`), not computed by hand.
    expect(new Set(LIVE_SLOTS.map((s) => s.sizes)).size).toBe(21);
  });

  it.each(LIVE_SLOTS.map((s) => [s.name, s.sizes] as const))(
    "%s survives capDensity's round trip",
    (_name, s) => {
      const out = capDensity(s);
      expect(out.endsWith(s)).toBe(true);

      // One capped entry per bucket per original entry, plus the original list —
      // which is what the comment here promised for two days while the assertion
      // beneath it was `expect(n).toBeGreaterThan(0)` on a value that cannot be
      // zero. Counted with the module's own splitter, not a regex approximation
      // of it living in the test.
      const original = splitTopLevel(s);
      const emitted = splitTopLevel(out);
      expect(emitted).toHaveLength(original.length * (DENSITY_BUCKETS.length + 1));
      for (const bucket of DENSITY_BUCKETS) {
        const marker = `(min-resolution: ${bucket.minResolution})`;
        expect(emitted.filter((e) => e.includes(marker))).toHaveLength(original.length);
      }
    },
  );

  it.each(LIVE_SLOTS.map((s) => [s.name, s] as const))(
    "%s stays parseable for every photograph in the library",
    (_name, slot) => {
      // `capDensity` throws rather than silently skipping the cap, and
      // `coverSizes` runs first and rewrites every entry — so a slot that is
      // fine for a 3:2 frame and broken for a 16:9 one would be a 500 at request
      // time on one chapter only. All 34 x every slot, in CI.
      for (const entry of MEDIA) {
        const out = coverSizes(slot.sizes, slot.box, entry.width / entry.height);
        expect(() => capDensity(out)).not.toThrow();
      }
    },
  );

  /**
   * The list above is only complete if no component has a `sizes` this file does
   * not import. Rather than trust that, read the components: any file passing a
   * `sizes` prop must be one this test imports from.
   */
  it("imports from every component that passes a sizes prop", () => {
    const root = path.resolve(import.meta.dirname, "..");
    const self = readFileSync(path.join(root, "lib", "sizes.test.ts"), "utf8");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory()
          ? walk(path.join(dir, d.name))
          : d.name.endsWith(".tsx")
            ? [path.join(dir, d.name)]
            : [],
      );

    const passers = walk(path.join(root, "components"))
      .filter((f) => /\bsizes=\{|\bsizes="/.test(readFileSync(f, "utf8")))
      // `ui/Photo.tsx` and `ui/Plate.tsx` forward the caller's `sizes`; they
      // originate none of their own.
      .filter((f) => !/[\\/]ui[\\/](Photo|Plate)\.tsx$/.test(f));

    expect(passers.length).toBeGreaterThan(0);
    for (const file of passers) {
      const specifier = `@/${path.relative(root, file).replace(/\\/g, "/").replace(/\.tsx$/, "")}`;
      // **The closing quote is the whole assertion, and it was missing for a
      // day.** A bare `toContain(specifier)` is a substring test, and every
      // module path on this page is a prefix of some other one:
      // `@/components/sections/Coverflow` is a substring of
      // `@/components/sections/CoverflowCard`, which something else already
      // imported — so this tripwire read green for a file it had never seen, and
      // `Coverflow.tsx`'s own `SIZES`/`BOXES` went unregistered while the test
      // written to make that impossible passed. Matching the specifier *and its
      // closing quote* is what makes a prefix stop being a match.
      expect(self, `${specifier} passes a sizes prop but nothing here imports it`).toContain(
        `"${specifier}"`,
      );
    }
  });
});

/**
 * The two halves of a cover crop, held together.
 *
 * A photograph in an `object-fit: cover` box is drawn wider than its box
 * whenever the box is taller than the photograph, and `sizes` has to describe
 * the *drawn* width or the browser fetches a file a quarter of the resolution it
 * needs. That was a Critical on this branch: the hero and the tiger shipped
 * visibly blurred on a phone, and the rig built to catch it measured the box too.
 *
 * The fix pairs a Tailwind `aspect-[a/b]` class in the markup with a ratio in a
 * `BOXES` constant, and **nothing connected the two**. A reviewer demonstrated
 * it precisely: deleting `box={HERO_BOX}` from `Hero.tsx`, and flattening
 * `ChapterIntro`'s `BOXES.solo` to a single ratio, each reintroduced the defect
 * with the whole suite still green. `BOXES` is a hand transcription of classes
 * written somewhere else in the same file, and only a browser rig — a build plus
 * a server, not `npm test` — ever compared them.
 *
 * These two tests are that comparison, in CI, on the source text.
 */
describe("cover boxes match the markup they describe", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

  /** Every distinct aspect ratio written as a Tailwind class in a file. */
  const ratiosInMarkup = (src: string): Set<number> => {
    const found = new Set<number>();
    for (const [, a, b] of src.matchAll(/aspect-\[(\d+)\/(\d+)\]/g)) {
      found.add(Number(a) / Number(b));
    }
    if (/aspect-square/.test(src)) found.add(1);
    return found;
  };

  /**
   * Every distinct aspect ratio a `BOXES`-style declaration resolves to.
   *
   * Walks the four shapes a box is written in rather than collecting every
   * number it can find. A blind walk picks up the `0` in a `[0, 3/2]` breakpoint
   * pair and the `100` in `{ viewportHeightVh: 100 }` and calls them aspect
   * ratios — which is how the first draft of this test failed three components
   * that were perfectly correct.
   */
  const ratiosDeclared = (box: unknown): Set<number> => {
    const found = new Set<number>();
    const walk = (v: unknown): void => {
      if (typeof v === "number") {
        found.add(v);
      } else if (Array.isArray(v)) {
        // A breakpoint list: `[minWidth, ratio]` pairs. Only the ratio is one.
        for (const entry of v) {
          if (Array.isArray(entry)) walk(entry[1]);
          else walk(entry);
        }
      } else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        // A viewport-height box describes a share of the screen, not a shape,
        // and produces no `aspect-*` class to compare against.
        if ("viewportHeightVh" in o) return;
        if ("ratio" in o) return void walk(o.ratio);
        Object.values(o).forEach(walk);
      }
    };
    walk(box);
    return found;
  };

  const CASES: readonly { file: string; declared: unknown }[] = [
    { file: "components/sections/Hero.tsx", declared: HERO_BOX },
    { file: "components/sections/ChapterIntro.tsx", declared: INTRO_BOXES },
    { file: "components/sections/LodgeCards.tsx", declared: LODGE_BOXES },
    { file: "components/sections/Testimonials.tsx", declared: TESTIMONIAL_BOXES },
    { file: "components/sections/PlateGrid.tsx", declared: PLATE_FRAME },
    // The day's six experiences: `hero` at 2:1, `quiet` at 4:5 — new crops
    // even though both `sizes` strings are borrowed from `PlateGrid`.
    { file: "components/sections/ExperiencePair.tsx", declared: EXPERIENCE_BOXES },
    { file: "components/motion/PinnedCollage.tsx", declared: COLLAGE_BOXES },
    // The closing band's one photograph, the sister lodge at 21:9 — a bare
    // ratio rather than a `BOXES` map, because there is only the one crop on
    // the page that uses it.
    { file: "components/property/PropertyInvitation.tsx", declared: INVITATION_BOX },
    // The site menu's two lodge cards — a bare 3:2 ratio, the same shape as
    // `SiteMenu.tsx`'s `aspect-[3/2]` class on the card's wrapper `<span>`.
    // The `<Photo>` itself lives in `SiteHeader.tsx` (the server component
    // that renders it), which is why this entry names that file and not the
    // client menu.
    { file: "components/ui/SiteHeader.tsx", declared: MENU_CARD_BOX },
    // The coverflow card — `COVERFLOW.cardBoxW / cardBoxH`, the same shape as
    // the `aspect-[1344/685]` class on its own `<li>`. This pairing is
    // load-bearing rather than tidy: since 18 Aug 2026 the ratio is what makes
    // the card's own resolution ceiling equal the file's width (draw factor
    // 1.000), so a future editor who retunes the card's shape in the markup and
    // leaves `CARD_BOX` alone gets a red test here instead of a photograph
    // drawn wider than any file the library holds and a `sizes` describing a
    // box that no longer exists.
    { file: "components/sections/CoverflowCard.tsx", declared: CARD_BOX },
    // `components/sections/Coverflow.tsx` had a case here from 16 to 17 Aug 2026
    // — 3:2 for `guide-sunrise`, 16:9 for the pair, 1:1 for
    // `tiger-crossing-track`. The client deleted that band, so the file now has
    // no `aspect-*` class and no `<Photo>`, and a case with an empty set on both
    // sides asserts nothing. The chapter's one remaining box is
    // `CoverflowCard`'s, above.
  ];

  it.each(CASES.map((c) => [c.file, c.declared] as const))(
    "%s declares exactly the ratios its markup uses",
    (file, declared) => {
      const inMarkup = [...ratiosInMarkup(read(file))].sort((a, b) => a - b);
      const inCode = [...ratiosDeclared(declared)].sort((a, b) => a - b);

      // Set equality, both directions on purpose. A ratio in the markup that
      // nothing declares is a photograph whose `sizes` never learns it is being
      // cropped; a declared ratio no class produces is a `sizes` describing a
      // box that does not exist.
      expect(inCode, `${file}: declared ratios do not match its aspect-* classes`).toEqual(inMarkup);
    },
  );

  it("passes a box to every Photo that sits in one", () => {
    // The other half. Set equality above cannot see a `box={...}` deleted from
    // the JSX while its constant stays declared and its class stays in the
    // markup — which is exactly what the reviewer did to `Hero.tsx`. Every
    // `<Photo` in these files is inside a cover box, so the counts must agree.
    for (const { file } of CASES) {
      const src = read(file);
      const photos = (src.match(/<Photo\b/g) ?? []).length;
      const boxes = (src.match(/\bbox=/g) ?? []).length;
      if (photos === 0) continue; // PlateGrid hands its frame to `ui/Plate.tsx`.
      expect(boxes, `${file}: ${photos} <Photo> but ${boxes} box= props`).toBe(photos);
    }
  });

  it("refuses a viewport-height box it cannot honour, rather than discarding the width", () => {
    // A `viewportHeightVh` box rebuilds the width list from the viewport's own
    // aspect, which is only correct for a full-width box. It used to ignore the
    // caller's list without saying so: "50vw" in, "375vw" out.
    expect(() => coverSizes("50vw", { viewportHeightVh: 100 }, 3 / 2)).toThrow(/only accepts "100vw"/);
    expect(() => coverSizes("100vw", { viewportHeightVh: 100 }, 3 / 2)).not.toThrow();
  });

  it("keeps ui/Plate.tsx forwarding its frame ratio to the photograph", () => {
    // PlateGrid is the one case the count check above skips, because its box
    // travels as `frame` through `ui/Plate.tsx`. If that forwarding is dropped,
    // three chapters' plates go back to being sized by their box.
    expect(read("components/ui/Plate.tsx"), "Plate no longer forwards frame.ratio to Photo").toMatch(
      /box=\{\s*frame\?\.\s*ratio\s*\}/,
    );
  });
});

describe("coverSizes", () => {
  it("leaves a box the photograph exactly fills alone", () => {
    expect(coverSizes("(min-width: 1024px) 42vw, 100vw", 3 / 2, 3 / 2)).toBe(
      "(min-width: 1024px) 42vw, 100vw",
    );
  });

  it("leaves a portrait photograph in a landscape box alone — cover crops the top and bottom", () => {
    // 2:3 in a 3:2 box scales to the box's width and overflows vertically. The
    // extra pixels are height, and `sizes` is a width.
    expect(coverSizes("50vw", 3 / 2, 2 / 3)).toBe("50vw");
  });

  it("scales a landscape photograph by exactly how far past the box it is drawn", () => {
    // 3:2 in a 4:5 box: 1.5 / 0.8 = 1.875.
    expect(coverSizes("40vw", 4 / 5, 3 / 2)).toBe("calc(1.875 * 40vw)");
  });

  it("uses the worst ratio over each entry's own range of widths", () => {
    // The box is 7:9 from 1024px and 3:2 below it; the width list breaks at 1024
    // and at 768. The 1024 entry sees only 7:9 (1.5/0.778 = 1.929); the other two
    // see only 3:2, which crops nothing.
    const out = coverSizes(
      "(min-width: 1024px) 42vw, (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
      [
        [1024, 7 / 9],
        [0, 3 / 2],
      ],
      3 / 2,
    );
    expect(out).toBe(
      "(min-width: 1024px) calc(1.929 * 42vw), (min-width: 768px) calc(100vw - 72px), calc(100vw - 24px)",
    );
  });

  it("takes the worst ratio when a box breakpoint falls inside one width entry", () => {
    // One entry covering everything below 1024px, a box that is 4:5 below 640px
    // and 16:9 above it. The 4:5 half is the one that must not be under-served.
    const out = coverSizes(
      "100vw",
      [
        [640, 16 / 9],
        [0, 4 / 5],
      ],
      3 / 2,
    );
    expect(out).toBe("calc(1.875 * 100vw)");
  });

  it("describes a viewport-sized box with aspect-ratio conditions, densest crop first", () => {
    const out = coverSizes("100vw", { viewportHeightVh: 100 }, 3 / 2);
    // 3:2 in a 0.4:1 box is drawn 3.75x the box's width; in a 1.5:1 box, exactly once.
    expect(out).toBe(
      "(max-aspect-ratio: 1/2) 375vw, (max-aspect-ratio: 2/3) 300vw, (max-aspect-ratio: 1/1) 225vw, (max-aspect-ratio: 3/2) 150vw, 100vw",
    );
  });

  it("accounts for a viewport box taller than the viewport", () => {
    // FullBleed oversizes its picture so parallax cannot uncover bare canvas; the
    // extra height is extra cover-crop and has to be paid for.
    const out = coverSizes("100vw", { viewportHeightVh: 127.6 }, 3 / 2);
    expect(out.startsWith("(max-aspect-ratio: 1/2) 478.5vw")).toBe(true);
  });

  it("collapses viewport buckets that ask for the same width", () => {
    // A 2:3 portrait is never cropped horizontally in a landscape-ish box, so
    // four of the five buckets would otherwise emit an identical `100vw`.
    const out = coverSizes("100vw", { viewportHeightVh: 100 }, 2 / 3);
    expect(splitTopLevel(out)).toEqual([
      "(max-aspect-ratio: 1/2) 166.7vw",
      "(max-aspect-ratio: 2/3) 133.3vw",
      "100vw",
    ]);
  });

  it("refuses a condition it cannot place on the width axis", () => {
    expect(() => coverSizes("(orientation: portrait) 50vw, 100vw", 1, 3 / 2)).toThrow(/min-width/);
  });

  it("is a no-op when no box is given, so an uncropped photograph is unaffected", () => {
    expect(coverSizes("(min-width: 640px) 50vw, 100vw", undefined, 3 / 2)).toBe(
      "(min-width: 640px) 50vw, 100vw",
    );
  });
});
