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
  | "fullBleedQuote"
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
   * Six activity cards on one pinned stage, the neighbours behind and to either
   * side, advancing on the visitor's own scroll (16 Aug 2026). Every card is a
   * photograph with its words on it, so the chapter is image-led at every point
   * in its travel — unlike `"splitFeature"`, the copy-one-side/imagery-the-other
   * kind it replaced on `field-days` and which was retired with its component
   * the same day, it has no text-only state. Nothing moves unless the visitor
   * moves: there is no autoplay, which the client was offered and declined
   * (non-negotiable #5).
   */
  | "coverflow"
  | "lodgeCards"
  | "invitation";
/*
 * **`"plateGrid"` and `"testimonials"` were retired from this union on 19 Aug
 * 2026** with the chapters that used them — `03 · The Forest`, `05 · The Rooms`
 * and `07 · Details` were the three plate boards, and `guests` was the
 * testimonials band. The guest quotes are not gone: `content/home.ts` moves them
 * into `invitation`'s copy, to be rendered below the two property buttons (spec
 * §7). `components/sections/PlateGrid.tsx` and `Testimonials.tsx` are now unused
 * by any route and are candidates for retirement in a later task, along with
 * `components/ui/ForestBackdrop.tsx`.
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
  "fullBleedQuote",
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
  // photograph with its words laid on it. (It was nine, then ten, while the
  // chapter still carried a header band of photographs above the stage; the
  // client deleted that band on 17 Aug 2026 and the chapter is now the carousel
  // and nothing else.) Added 16 Aug 2026 with the coverflow.
  // The suite would not have caught its omission — `field-days` sits between
  // `forest` and `rooms`, both `plateGrid`, so the alternation rule is already
  // satisfied by its neighbours either way. It is here because it is true, not
  // because a test demanded it.
  "coverflow",
  "invitation",
];

/**
 * The kinds whose photograph is tiled edge-to-edge across the viewport, and so
 * may only use images ≥ 1400px wide (CLAUDE.md non-negotiable #10). Fourteen of
 * the thirty-five curated images qualify; the four used here are all of them
 * that suit a full screen.
 */
export const FULL_BLEED_KINDS: readonly ChapterKind[] = ["hero", "fullBleedQuote", "invitation"];

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
    // Two lodges, two photographs each: [Vann exterior, Vann room, Tola pool,
    // Tola suite]. Orientation is Vann first, Tola second — Task 7 reads the
    // pairs positionally.
    //
    // **This is the OLD shape, kept deliberately for one task.** Spec §2 rebuilds
    // this chapter as ecotriip's two full-height panels on `vann-hero` and
    // `tola-hero`, which drops it to two photographs; the restructure ships the
    // spine only, so `lodgeCards` and its four frames stand until the panels are
    // built.
    id: "lodges",
    number: "01",
    label: "The Lodges",
    kind: "lodgeCards",
    media: ["bungalow-exterior-palms", "mahua-vann-room", "mahua-tola-pool", "mahua-tola-suite"],
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
     * **Still `fullBleedQuote`, and that is temporary.** Spec §3 crops the band
     * down from 100svh so it breathes with cream above and below, left-aligns
     * the heading at a smaller size, and sets `03 · The Forest`'s surviving
     * paragraph to its right. None of that is built yet — only the numbering,
     * the label, the photograph and the copy have moved.
     */
    id: "why-you-came",
    number: "02",
    label: "The Jungles",
    kind: "fullBleedQuote",
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
    // right; neither is built yet.
    id: "rooted",
    number: "03",
    label: "Rooted Like The Mahua",
    kind: "pinnedCollage",
    media: ["lantern-bridge-dusk", "forest-shrine-incense", "potters-hands"],
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
     * plain horizontal strip of tall portrait cards. **The strip is a later
     * task; this is still the coverflow, on its own six frames.**
     */
    id: "field-days",
    number: "05",
    label: "Experiences",
    kind: "coverflow",
    /*
     * **Exactly the six cards since 17 Aug 2026 — one photograph per activity,
     * in the order `content/home.ts` lists them, and nothing else.**
     *
     * The list went 6 → 9 → 10 → 6 in three days. The four that came and went
     * were the header band's — `guide-sunrise` and `tiger-crossing-track` under
     * the dawn-gate paragraph, `hammocks-shade` and `pool-daylight-forest` under
     * "then the day slows right down" — and the client deleted that band and
     * that sentence outright: *"Remove all 4 images (collage of images) between
     * the section's introductory text and the activity card carousel, also
     * remove the text 'Then the day slows right down…'"*. `Coverflow.tsx` no
     * longer reads any of this list positionally; every card names its own frame
     * by `mediaId`, and `chapters.test.ts` holds each of those names to
     * membership of this list — so a card can never reach for a photograph the
     * chapter does not declare, and `measure_density.mjs` counts every
     * photograph a card can show.
     *
     * `guide-sunrise`, `hammocks-shade` and `pool-daylight-forest` leave the
     * chapter with the band. They remain curated and are drawn elsewhere or held;
     * the client also re-exported all three at 1344x685 for the band, and those
     * three files are deliberately unused — see `scripts/build_images.mjs`.
     *
     * **`tiger-crossing-track` is a card again, and both moves were resolution
     * decisions rather than editorial ones.** At 541x508 it was narrower than
     * the card it was drawn in — the single frame capping `COVERFLOW.cardMaxPx`
     * for the whole carousel — so on 16 Aug it went to the band and `vann-safari`
     * took the card. The client's 17 Aug re-export makes it 1344x685, the same
     * shape and the same width as the other five, and `vann-safari` is unused
     * again. Four of the six are frames `/mahua-vann` also draws (a repeat the
     * client saw and accepted); the other two, `tiger-crossing-track` and
     * `forest-boardwalk-daylight`, are this page's own.
     */
    media: [
      "tiger-crossing-track",
      "vann-bird-watching",
      "vann-kohka-lake",
      "forest-boardwalk-daylight",
      "vann-potters-village",
      "forest-trail-canopy",
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
