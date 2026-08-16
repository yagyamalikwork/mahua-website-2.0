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
  | "chapterIntro"
  /**
   * `chapterIntro`'s composition, held still while its photographs drift past —
   * the reference site's signature effect, and the only pinned scene on the
   * page. Below the viewport `components/motion/CollageStage.tsx` pins at, and
   * for any visitor who has asked for less motion, it renders as an ordinary
   * `chapterIntro` and reserves no extra scroll, so it is quiet in exactly the
   * same way and the rhythm rule counts it the same way.
   */
  | "pinnedCollage"
  | "splitFeature"
  /**
   * Six activity cards on one pinned stage, the neighbours behind and to either
   * side, advancing on the visitor's own scroll (16 Aug 2026). Every card is a
   * photograph with its words on it, so the chapter is image-led at every point
   * in its travel — unlike `splitFeature`, which it replaced on `field-days`,
   * it has no text-only state. Nothing moves unless the visitor moves: there is
   * no autoplay, which the client was offered and declined (non-negotiable #5).
   */
  | "coverflow"
  | "plateGrid"
  | "lodgeCards"
  | "testimonials"
  | "invitation";

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
 * Deliberately conservative: `lodgeCards` and `splitFeature` both show
 * substantial imagery, but counting them as quiet makes the alternation test
 * stricter rather than looser, which is the direction to err in.
 */
export const IMAGE_LED_KINDS: readonly ChapterKind[] = [
  "hero",
  "fullBleedQuote",
  "plateGrid",
  // Nine photographs, six of them the cards themselves, and a card is a
  // photograph with its words laid on it. Added 16 Aug 2026 with the coverflow.
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
    id: "lodges",
    number: "01",
    label: "The Lodges",
    kind: "lodgeCards",
    media: ["bungalow-exterior-palms", "mahua-vann-room", "mahua-tola-pool", "mahua-tola-suite"],
  },
  {
    id: "why-you-came",
    kind: "fullBleedQuote",
    media: ["tiger-golden-grass"],
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
    id: "rooted",
    number: "02",
    label: "Rooted like the mahua",
    kind: "pinnedCollage",
    media: ["lantern-bridge-dusk", "forest-shrine-incense", "potters-hands"],
  },
  {
    // Three portraits, one orientation — a plate grid reads as a field guide
    // only if the plates match. It was four until 4 Aug 2026, when two of them
    // turned out to be the same tiger photograph under two ids.
    id: "forest",
    number: "03",
    label: "The Forest",
    kind: "plateGrid",
    media: ["tiger-pair-profile", "leopard-on-rock", "melanistic-leopard"],
  },
  {
    id: "field-days",
    number: "04",
    label: "Days in the Field",
    kind: "coverflow",
    // The hammocks carry the chapter's second paragraph — the half of the day
    // most lodges leave out. Nothing else in the library says "rest".
    //
    // `pool-daylight-forest` was one of the two photographs held in reserve after
    // Task 4 and came off the bench on 5 Aug 2026, under that same sentence, and
    // it is the only other frame in the library of the slow half of the day. It
    // was described here as a letterbox in a half-width column until 16 Aug
    // 2026; that was `splitFeature`'s composition, which the coverflow replaced.
    // Its 1163px file still bounds how large it can be drawn.
    //
    // Nine, from six, when the coverflow landed (16 Aug 2026). The first three
    // are the chapter's two written beats and stay in the header band above the
    // stage: the dawn gate, then "the day slows right down" — the client's own
    // copy, which a carousel of activities does not carry and must not drop.
    // The last six are one per activity, in the order `content/home.ts` lists
    // them; three of those are frames `/mahua-vann` also shows, a repeat the
    // client saw and accepted the same day. `chapters.test.ts` asserts that
    // every activity's photograph is declared here — membership, not order — so
    // a card can never reach for a frame this list does not carry, and so
    // `measure_density.mjs` counts every photograph a card can show.
    media: [
      "guide-sunrise",
      "hammocks-shade",
      "pool-daylight-forest",
      "tiger-crossing-track",
      "vann-bird-watching",
      "vann-kohka-lake",
      "forest-boardwalk-daylight",
      "vann-potters-village",
      "forest-trail-canopy",
    ],
  },
  {
    // The rooms had no chapter at all in the rejected build, on a site selling
    // rooms. Four landscape interiors, 2×2.
    id: "rooms",
    number: "05",
    label: "The Rooms",
    kind: "plateGrid",
    media: [
      "room-open-to-bamboo",
      "suite-tiger-painting",
      "room-hanging-chair-view",
      "hanging-chair-forest-deck",
    ],
  },
  {
    // Night-lit, so white type over it needs the least scrim of any full-bleed
    // on the page. Task 7 still measures it rather than assuming.
    id: "after-dark",
    kind: "fullBleedQuote",
    media: ["lodge-facade-night"],
  },
  {
    id: "lantern-hour",
    number: "06",
    label: "The Lantern Hour",
    kind: "chapterIntro",
    // The petal table is the full-moon ritual this chapter's copy describes —
    // "a diya set afloat with water and flowers" — and we had no photograph of
    // it until one was harvested from the client's own property video.
    media: ["bonfire-circle-night", "sound-healing", "petal-table-night"],
  },
  {
    id: "details",
    number: "07",
    label: "Details",
    kind: "plateGrid",
    media: ["petal-bowl-map", "veranda-through-leaves", "lily-pond-fountain", "geese-garden-pond"],
  },
  {
    id: "guests",
    kind: "testimonials",
    media: ["lawn-picnic-golden-hour", "garden-path-lodge"],
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
