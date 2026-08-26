import type { MediaId } from "@/lib/media";

/**
 * The page's spine — the journey in chapters, in order, and which photographs
 * each one carries.
 *
 * This file exists so the sequence and its rhythm live in one readable place
 * rather than being implied by the order of JSX in `app/page.tsx`. Task 7's page
 * maps over `CHAPTERS` and dispatches on `kind`; Task 6's copy is keyed by `id`.
 *
 * The rhythm rule — never two quiet screens consecutively — is enforced by
 * `chapters.test.ts`, not by good intentions. The previous build ran thirteen
 * screens with fourteen photographs and the client rejected it as empty; the
 * reference site runs eight and fills every one. Density, not length.
 */

export type ChapterKind =
  | "hero"
  /**
   * `chapterIntro`'s composition, held still while its photographs drift past —
   * the reference site's signature effect. Below the viewport
   * `components/motion/CollageStage.tsx` pins at, and for any visitor who has
   * asked for less motion, it renders as an ordinary `chapterIntro` and reserves
   * no extra scroll, so it is quiet in exactly the same way and the rhythm rule
   * counts it the same way.
   *
   * **It is no longer the only pinned scene: `03 · Rooted Like The Mahua` and
   * `04 · Mahua Philosophy` are both this kind since 19 Aug 2026** (`feat/home-v2`,
   * `docs/superpowers/specs/2026-08-19-home-v2-restructure.md` §4-§5), the second
   * a deliberate mirror of the first. `app/page.tsx` counts them and alternates
   * `mirrored`, so the two compositions are opposite handed without either
   * section knowing the other exists.
   *
   * **`"chapterIntro"` itself was retired from this union the same day.** It is
   * the composition `06 · The Lantern Hour` used, and that chapter left the page
   * with the restructure; the *component* survives and still ships, because this
   * kind renders through it (`components/motion/PinnedCollage.tsx`).
   */
  | "pinnedCollage"
  /**
   * Six activity cards in a row that scrolls sideways — `05 · Experiences`,
   * 19 Aug 2026, on the "Curated Group Departures" strip the client pointed at
   * (spec §6). Every card is a tall portrait photograph with its label, its name
   * and one sentence laid on it, so the chapter is image-led at every point in
   * its travel and has no text-only state.
   *
   * **It replaces `"coverflow"` on the one chapter that used it**, and that kind
   * is gone from this union with its two components, `lib/coverflow.ts`,
   * `COVERFLOW` in `lib/motion.ts` and `scripts/check_coverflow.mjs`. The client
   * chose the strip over the pinned stage built 16-18 Aug knowing what it
   * discards — the pin, the scroll pacing, the flank behaviour — so none of it
   * is preserved under a flag. `docs/DECISIONS.md` §20 is the record.
   *
   * Nothing moves unless the visitor moves, which was true of the coverflow for
   * a reason (the client was offered autoplay and declined it, non-negotiable
   * #5) and is true of this by construction: a native scroller has no other
   * mode.
   */
  | "experienceStrip"
  /**
   * Two photographs side by side, edge to edge, each carrying a small region
   * label, the lodge's name, a sentence and a button — `01 · The Lodges`,
   * 19 Aug 2026, on the ecotriip.co India/Africa split the client supplied as a
   * screenshot (spec §2). `components/sections/LodgePanels.tsx`.
   *
   * **It replaces `"lodgeCards"` on the one chapter that used it**, which is why
   * that kind is gone from this union below. The component survives and still
   * compiles; nothing routes to it.
   *
   * Unlike the cards, this is type laid ON photographs at every width, so it is
   * image-led in the sense non-negotiable #10 means — see `IMAGE_LED_KINDS`.
   */
  | "lodgePanels"
  /**
   * One cropped band of forest carrying the whole chapter's words on it —
   * `02 · The Jungles`, 19 Aug 2026 (spec §3).
   * `components/sections/JunglesBand.tsx`.
   *
   * **It was cream above and below the band from 19 to 20 Aug 2026**, with the
   * heading and paragraph in that cream. The client asked for them back on the
   * photograph — *"the image itself should look like the background for this
   * section"* — so the section is a scrimmed photograph edge to edge, as the
   * `fullBleedQuote` before it was, and its floor is a crop of the photograph's
   * own length rather than the whole of it (`JUNGLE_BAND.minHeightVw`).
   *
   * **It replaces `"fullBleedQuote"` on this chapter only.** The kind itself left
   * the union with `"lodgeCards"` on 19 Aug 2026 (see the note below) — what
   * survives is the component, `components/sections/FullBleedQuote.tsx`, which
   * both property pages' own `"fullBleed"` shape used to route to (`vann-table`,
   * `tola-table`, `tola-guest-word`) until Task 5 of the 26 August 2026
   * restructure deleted all three chapters on the client's own ruling. It is
   * unrouted everywhere as of that date — see the note below for why it is kept
   * anyway. The client's own words for why the home page moved off it in the
   * first place: the full-screen version *"covers the whole screen currently
   * and feels too overwhelming"*.
   */
  | "junglesBand"
  | "invitation";
/*
 * **`"lodgeCards"` and `"fullBleedQuote"` were retired from this union on 19 Aug
 * 2026**, by the two kinds above, and the two components are in different
 * positions afterwards. `components/sections/LodgeCards.tsx` is now routed by
 * nothing at all — `lodges` was its only caller on any page — and is a candidate
 * for retirement alongside `PlateGrid.tsx` and
 * `ui/ForestBackdrop.tsx`. `components/sections/FullBleedQuote.tsx` is now
 * routed by nothing at all too, as of 26 August 2026 — Task 5 of that day's
 * restructure deleted `vann-table`, `tola-table` and `tola-guest-word`, the
 * three property-page chapters that used to route their own `"fullBleed"`
 * shape to it, on the client's own ruling. Unlike `LodgeCards.tsx` just above,
 * it is **not** a retirement candidate: `"fullBleed"` is still the shape both
 * property pages' own heroes use (`components/property/PropertyPage.tsx`'s
 * dispatcher), and an unrouted component with an already-solved scrim is the
 * cheap way back if the client reverses this call — keeping it costs nothing a
 * future revert would not have to pay for anyway.
 *
 * **`"plateGrid"` and `"testimonials"` were retired from this union on 19 Aug
 * 2026** with the chapters that used them — `03 · The Forest`, `05 · The Rooms`
 * and `07 · Details` were the three plate boards, and `guests` was the
 * testimonials band. The guest quotes are not gone: `content/home.ts` moves them
 * into `invitation`'s copy, to be rendered below the two property buttons (spec
 * §7). **`Testimonials.tsx` was deleted later the same day**, once
 * `Invitation.tsx` was rendering the quotes: component, its two rows in
 * `lib/sizes.test.ts` and its case in that file's box tripwire, together.
 * `components/sections/PlateGrid.tsx` and `components/ui/ForestBackdrop.tsx`
 * are still on disk and still unused by any route.
 */

export type Chapter = {
  /** Stable key. `content/home.ts` keys its copy by this, and the test enforces the join. */
  id: string;
  /** Zero-padded, e.g. "01". Absent on the hero, the pull-quotes and the close. */
  number?: string;
  /** The words beside the number, e.g. "The Lodges". Present wherever `number` is. */
  label?: string;
  kind: ChapterKind;
  /** Order matters — components read positionally. See the note on each chapter below. */
  media: readonly MediaId[];
};

/**
 * The shape a chapter *section component* actually reads — id, its optional
 * number/label, and the photographs it carries. Every one of `Hero`,
 * `ChapterIntro`, `PlateGrid` and `FullBleedQuote` types its `chapter` prop
 * against this rather than the full `Chapter`, because none of them reads
 * `kind` — and `content/property-chapters.ts`'s `PropertyChapter` has a
 * different, non-overlapping `kind` union, so it could never satisfy `Chapter`
 * itself. Both `Chapter` and `PropertyChapter` satisfy `ChapterLike`
 * structurally, with no import relationship needed between the two files.
 */
export type ChapterLike = {
  id: string;
  number?: string;
  label?: string;
  media: readonly MediaId[];
};

/**
 * The kinds that count as carrying a screen on their photography.
 *
 * Deliberately conservative: `lodgeCards` shows substantial imagery and is
 * still counted as quiet, because counting it that way makes the alternation
 * test stricter rather than looser, which is the direction to err in. (The
 * retired `splitFeature` was the other one held to that line.)
 */
export const IMAGE_LED_KINDS: readonly ChapterKind[] = [
  "hero",
  /*
   * **`"lodgePanels"` is here where `"lodgeCards"` deliberately was not, and the
   * distinction is real rather than convenient.** The cards were photographs on
   * cream with the words beneath them, so a screen of that chapter could be
   * mostly type; this kind is two photographs edge to edge with the words laid
   * ON them, which has no text-only state at any scroll position — the same
   * property that put `"coverflow"` on this list.
   *
   * **No adjacency depends on it**, which is the test that it is here because it
   * is true rather than to make something pass: `lodges` sits between `arrival`
   * (hero) and `why-you-came` (this band), both image-led, so the rhythm rule is
   * satisfied on either side whichever way this is classified. Removing it would
   * turn no test red today.
   */
  "lodgePanels",
  /*
   * `"fullBleedQuote"` was here until 19 Aug 2026 and left with the kind. This
   * is what took its place on `02 · The Jungles`: a shorter band, but still one
   * photograph across the full width of the screen with its type on it.
   */
  "junglesBand",
  // `"plateGrid"` came out on 19 Aug 2026 with the kind itself.
  //
  // **`"pinnedCollage"` is deliberately NOT here, and that is the whole of the
  // v2 restructure's one unresolved collision.** The spine the client approved
  // puts `03 · Rooted Like The Mahua` next to `04 · Mahua Philosophy` and both
  // are this kind — text held still with three photographs floating at the
  // margins, which is exactly the composition non-negotiable #10 calls quiet.
  // Adding it here would make the rhythm test pass by redefining the rule it
  // enforces, so it has not been added; see the failing case in
  // `chapters.test.ts` and the report on this task.
  // Six photographs, all six of them the cards themselves, and a card is a
  // photograph with its words laid on it. Added 16 Aug 2026 as `"coverflow"`;
  // the kind changed on 19 Aug and the classification did not, because what
  // makes this image-led is the card rather than the mechanism that moves it.
  //
  // **It is now load-bearing where it never used to be.** Under the twelve-
  // chapter spine `field-days` sat between two `plateGrid` chapters and the
  // alternation rule was satisfied by its neighbours whichever way this was
  // classified. On the v2 spine it sits between `philosophy` (a `pinnedCollage`,
  // which this file classes as QUIET) and `invitation`, so removing this entry
  // turns `chapters.test.ts` red — correctly.
  "experienceStrip",
  "invitation",
];

/**
 * The kinds whose photograph is tiled edge-to-edge across the viewport, and so
 * may only use images ≥ 1400px wide (CLAUDE.md non-negotiable #10). Fourteen of
 * the thirty-five curated images qualify; the four used here are all of them
 * that suit a full screen.
 *
 * **`"lodgePanels"` and `"junglesBand"` replaced `"fullBleedQuote"` here on
 * 19 Aug 2026.** The band is edge-to-edge in the obvious way. A panel is only
 * half the screen wide from 768px up, so it is arguably not full-bleed at all —
 * it is listed because listing it makes this test STRICTER (both `vann-hero` and
 * `tola-hero` are 1440px and `fullBleedSafe`, so nothing changes today) and
 * because the band of two panels does reach both edges. Erring towards the
 * stricter reading is the direction this file already errs in — see the note on
 * `lodgeCards` in `IMAGE_LED_KINDS`' history.
 */
export const FULL_BLEED_KINDS: readonly ChapterKind[] = [
  "hero",
  "lodgePanels",
  "junglesBand",
  "invitation",
];

/**
 * Kept `as const` so `ChapterId` below is a literal union — Task 6 keys `HOME`
 * by it, and a typo'd chapter id must be a build error rather than a blank patch
 * of page. `CHAPTERS` itself is re-exported widened to `readonly Chapter[]`, or
 * `number` and `label` would only exist on the members that happen to set them.
 */
const CHAPTER_LIST = [
  {
    // The lantern-lit arrival rather than a tiger. Every wildlife lodge in
    // central India opens on a tiger; almost none can open on this light, and
    // "the lantern hour" is the brand's own signature. The tiger is spent three
    // chapters later, at full viewport, where it lands harder for being earned.
    id: "arrival",
    kind: "hero",
    media: ["reception-path-dusk"],
  },
  {
    /*
     * **Two panels since 19 Aug 2026** (spec §2), on the ecotriip.co India /
     * Africa split the client supplied as a screenshot: one photograph per
     * lodge, side by side, edge to edge, each carrying its region, its name, a
     * sentence and a button.
     *
     * **Two photographs where there were four**, and both are the property
     * pages' own opening frames — the client's choice, and he accepted what it
     * costs: the same photograph greets a visitor again one click later.
     * `bungalow-exterior-palms`, `mahua-vann-room`, `mahua-tola-pool` and
     * `mahua-tola-suite` are curated and now unused by any route.
     *
     * Order is Vann first, Tola second, and `LodgePanels` reads it positionally
     * against the order `content/home.ts` lists the two lodges in. It also looks
     * each one up in `content/site.ts` by route for the name and the region
     * label, and throws if it cannot find it — so the pairing cannot silently
     * come apart.
     *
     * This chapter measured 43.7% mean / **48.6% worst** as `lodgeCards` on this
     * spine, one of only two over non-negotiable #8's ceiling, and the rebuild
     * was aimed at exactly that. The after figure is in
     * `docs/reviews/2026-08-19-home-v2/shapes.md`.
     */
    id: "lodges",
    number: "01",
    label: "The Lodges",
    kind: "lodgePanels",
    media: ["vann-hero", "tola-hero"],
  },
  {
    /*
     * **`02 · The Jungles` since 19 Aug 2026** — numbered and labelled, where it
     * was an unnumbered pull-quote over `tiger-golden-grass` from 4 Aug.
     *
     * The photograph is `jungle-cats-stitch`, the client's own 3168x1344
     * composite of the three cats `03 · The Forest` used to show as plates: the
     * black panther, the leopard on its rock and the tiger in profile, blended
     * into one continuous forest frame. That chapter is deleted in the same
     * change, which is what makes the composite honest rather than a repeat —
     * see the entry's note in `scripts/build_images.mjs`.
     *
     * **A band since 19 Aug 2026, not a screen** (spec §3). It was `100svh` of
     * full-bleed photograph with a centred quote on it, which the client found
     * *"too overwhelming"*.
     *
     * The crop was a resolution fix as much as a compositional one. At 100svh
     * `FullBleed` oversized the picture for parallax and `cover` drew this
     * photograph **2,706px wide from a 1,440px file** at 1440x900 — ratio 0.53,
     * the softest image on the site — with the panther at its left edge and the
     * tiger at its right both outside the viewport.
     *
     * **The band was cropped again on 20 Aug 2026, and the chapter's words went
     * back onto it.** *"I like that you have cropped the image length and made
     * it thinner, but I would like for you to crop it a bit more on its
     * length"*, and *"place and align all the text for 02-The Jungles on the
     * image… the image itself should look like the background for this
     * section."* The band's floor is now 31vw against the photograph's own
     * 42.4vw — 26.8% more of its length — and the section grows past that floor
     * wherever its own words need the room, which is what stops the arrangement
     * clipping its text the way the first attempt at it did. `JUNGLE_BAND` in
     * `lib/motion.ts` carries both numbers and the working.
     */
    id: "why-you-came",
    number: "02",
    label: "The Jungles",
    kind: "junglesBand",
    media: ["jungle-cats-stitch"],
  },
  {
    // The mahua tree, the Gond, building in the vernacular, the potters of
    // Pachdhar. Three images floating at the margins, cropped by the viewport
    // edge — the reference's signature move. The page's memory chapter, and so
    // the one chapter that earns a pin: on a wide enough screen the text is held
    // still while these three rise past it at three different speeds.
    //
    // Order is [tall flank, upper of the pair, lower of the pair], and it is a
    // resolution decision, not a taste one. `lantern-bridge-dusk` is the only
    // one of the three with a 1300px file; the other two are 700px, so they go
    // where the crop is shallow and it takes the one deep slot. Reordered 5 Aug
    // 2026 — with `potters-hands` in the tall slot it was being drawn 1,141px
    // wide from a 700px file at 1440, i.e. 0.61 source pixels per CSS pixel.
    //
    // **`03` since 19 Aug 2026, and no longer the only pinned scene** —
    // `philosophy` below is its mirror. Spec §4 also removes the potter film
    // from its footer and realigns the text left with the photographs on the
    // right.
    //
    // **`potters-hands` became `vann-potters-village` later the same day, and it
    // is a forced move rather than a preference.** `05 · Experiences`' "Village
    // Craft" card wants exactly `potters-hands` — it is the client's own choice
    // and its sentence is "Pottery at the wheel" — and the test below forbids
    // one photograph appearing twice on this page. Something had to give, and
    // this slot is the one that could: the paragraph it stands beside is about
    // *Pachdhar, a village adjoining Pench, where more than a hundred Kumhar
    // families have kept the potter's wheel turning*, which a photograph of that
    // village's pots serves at least as well as a pair of anonymous hands. It is
    // also the better file for this slot on the two grounds the order below is
    // chosen on: 1344px rather than 700px into a ~421px column, and 1.962:1 in a
    // 5:3 `pairLower` box, which crops 15.0% of its width — inside the 25%
    // bound, where `potters-hands` at 1.502 was cropping 9.9% of its HEIGHT.
    //
    // The repeat with `/mahua-vann`, which also draws this frame, is the one the
    // client saw and accepted on 16 Aug for four of the coverflow's cards.
    id: "rooted",
    number: "03",
    label: "Rooted Like The Mahua",
    kind: "pinnedCollage",
    media: ["lantern-bridge-dusk", "forest-shrine-incense", "vann-potters-village"],
  },
  {
    /*
     * **New on 19 Aug 2026, and deliberately not a new idea** — spec §5: *"make
     * sure it is in continuity as it is an extension of an already existing
     * section."* Same kind as `rooted`, one place below it, so `app/page.tsx`'s
     * intro counter hands it the mirrored composition with no section knowing
     * the other exists.
     *
     * Its words are `05 · The Rooms`' intro paragraph, moved here without that
     * chapter's heading — see `content/home.ts`.
     *
     * The three photographs are the ones `07 · Details` freed, and they are the
     * client's own pick (19 Aug). Two are 0.67 portraits, which is what a
     * scrolling column wants, and all three are the page's quiet still lifes,
     * which is what a section called Philosophy wants beside it.
     *
     * **Slot order is a resolution decision and departs from the order the spec
     * lists them in**, exactly as `rooted`'s comment above departs from taste.
     * The tall flank is drawn at ~42vw — about 1,141px at 1440 — so it must take
     * the widest file of the three: `veranda-through-leaves` at 1100px, not
     * `petal-bowl-map` at 700px, which would be 0.61 source pixels per CSS
     * pixel. The pair slots crop shallow and take the 700px and 1080px files.
     */
    id: "philosophy",
    number: "04",
    label: "Mahua Philosophy",
    kind: "pinnedCollage",
    media: ["veranda-through-leaves", "petal-bowl-map", "lily-pond-fountain"],
  },
  {
    /*
     * **`05 · Experiences` since 19 Aug 2026**, renamed and renumbered from
     * `04 · Days in the Field`. Spec §6 keeps the heading, the body copy and the
     * tiger film exactly as they are — *"We keep the text and the tiger where
     * they are and not touch them"* — and replaces the pinned coverflow with a
     * plain horizontal strip of tall portrait cards, which is what this now is.
     */
    id: "field-days",
    number: "05",
    label: "Experiences",
    kind: "experienceStrip",
    /*
     * **Six new photographs on 19 Aug 2026 — all six, not one carried over.**
     *
     * The client named six activities of his own for the strip and five of the
     * six frames with them; the sixth is a substitution this task made and he
     * has not yet ruled on. In his order, which is the order they scroll in:
     *
     * | card | frame | how it got here |
     * |---|---|---|
     * | Private Bush Dinners | `bonfire-dinner` | his; portrait-cropped in the pipeline |
     * | Wellness | `sound-healing` | his; portrait-cropped |
     * | Screenings and Star Talks | `star-talks` | his; supplied 19 Aug, natively portrait |
     * | Nature Walks and Birding | `guide-sunrise` | his; portrait-cropped |
     * | Village Craft | `potters-hands` | his; portrait-cropped, and TAKEN OFF `rooted` above |
     * | Jungle Safari | `tiger-golden-grass` | **ours** — see below |
     *
     * **Five of the six are cropped to the card's 0.74 portrait inside
     * `scripts/build_images.mjs`, not by the card's box.** A 1.5:1 frame in a
     * portrait card loses 50.7% of its width and this project bounds that at
     * 25%; there is no portrait ratio at which these files are legal by
     * `object-cover`, so the crop is made by hand with the file open instead.
     * That script's "THE PORTRAIT CROPS" note carries the arithmetic and each
     * window's reasoning.
     *
     * **`tiger-crossing-track` is what his list names against Jungle Safari and
     * it is not here.** It is 1.962:1 — a portrait window keeps 37.7% of its
     * width, which loses either the tiger or the vehicle of guests behind it —
     * and its guest-consent clearance rests on those guests being small and
     * turned away, which a crop drawing them 2.65x larger would invalidate.
     * `tiger-golden-grass` has no people in it, needs no consent question, and
     * was freed the same day when `02 · The Jungles` took `jungle-cats-stitch`.
     *
     * The six the coverflow drew are all released: `vann-bird-watching`,
     * `vann-kohka-lake`, `forest-boardwalk-daylight` and `forest-trail-canopy`
     * are curated and now unused on this page (all four are still drawn on
     * `/mahua-vann`), `vann-potters-village` moved up to `rooted`, and
     * `tiger-crossing-track` is curated, cleared and unused.
     *
     * Nothing here is read positionally. Every card names its own frame by
     * `mediaId` and `chapters.test.ts` holds each of those names to MEMBERSHIP
     * of this list, so a card can never reach for a photograph the chapter does
     * not declare and `measure_density.mjs` therefore does not count.
     */
    media: [
      "bonfire-dinner",
      "sound-healing",
      "star-talks",
      "guide-sunrise",
      "potters-hands",
      "tiger-golden-grass",
    ],
  },
  {
    id: "invitation",
    kind: "invitation",
    media: ["birding-cairn-dusk"],
  },
] as const satisfies readonly Chapter[];

export type ChapterId = (typeof CHAPTER_LIST)[number]["id"];

export const CHAPTERS: readonly Chapter[] = CHAPTER_LIST;

/** Throws on a miss rather than handing a component `undefined`, as `media()` does. */
export function chapter(id: ChapterId): Chapter {
  const found = CHAPTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown chapter id: ${id}`);
  return found;
}
