import type { ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import type { FieldNotesCopy } from "@/components/sections/FieldNotes";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PlateGridCopy } from "@/components/sections/PlateGrid";
import type { RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Vann's spine. Six chapters: hero, place, dining, experiences, the
 * rooms, then field notes — no guest quote (none of the harvested Tripadvisor
 * reviews name Pench or Vann specifically, and this page does not invent
 * one). Rhythm holds without it: `chapterIntro` is the only "quiet" kind here
 * and it sits between two image-led ones.
 *
 * **The rooms and field notes are numbered 04 and 05** so `ChapterMenu`'s
 * `number && label` filter lists them — the approved spec's own menu (§5) is
 * "Stay · Dining · Experiences · Getting there", and the two entries a
 * planner actually opens the menu for are exactly the rooms and the way in.
 * The first build left both unnumbered and the menu lost them.
 */
export const VANN_CHAPTERS: readonly PropertyChapter[] = [
  { id: "vann-hero", kind: "hero", media: ["vann-hero"] },
  {
    id: "vann-place",
    number: "01",
    label: "The Place",
    kind: "chapterIntro",
    media: ["vann-safari", "vann-kohka-lake", "vann-potters-village"],
  },
  {
    id: "vann-dining",
    number: "02",
    label: "Dining",
    kind: "plateGrid",
    media: ["vann-dining"],
  },
  {
    // Four plates since 9 Aug 2026 — the day's own arc: the drive's tiger,
    // the birds, the pool, the film under the stars. "vann-tiger" and
    // "vann-pool" are from the live Vann page's own imagery, missed by the
    // first fetch; at two plates this chapter measured 64.4% empty against
    // the 45% ceiling (docs/reviews/2026-08-08-property-pages/).
    id: "vann-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["vann-tiger", "vann-bird-watching", "vann-pool", "vann-evening"],
  },
  {
    // "suite-tiger-painting" is the home page's existing id for the live
    // site's own Cottage-with-deck photograph (byte-identical file, so a
    // second manifest entry would trip the perceptual-hash duplicate guard).
    id: "vann-rooms",
    number: "04",
    label: "The Rooms",
    kind: "roomsIndex",
    media: ["vann-room-deluxe", "suite-tiger-painting"],
  },
  {
    // The sibling banner carries Mahua Tola's candlelit poolside dinner — a
    // photograph of the *other* lodge, which is the point (see FieldNotes'
    // sibling note). Cross-page use, not a within-page repeat.
    id: "vann-field-notes",
    number: "05",
    label: "Getting There",
    kind: "fieldNotes",
    media: ["tola-candlelit-dinner"],
  },
] as const satisfies readonly PropertyChapter[];

/**
 * Mahua Vann's copy. Adapted from `reference/site-copy.md`'s Mahua Vann
 * section and `../Mahua_Resorts_Master_Brand_Record.md`, in the established
 * brand voice — British spelling, specificity over adjectives.
 *
 * The room count (26, split 13 Deluxe / 5 Cottage without Deck / 8 Cottage
 * with Deck) is the live site's own structured total and cross-checks
 * against the brand record. Nagpur's *distance* is deliberately omitted — the
 * live site says 80 km, the brand record 104-112 km, and neither is trusted
 * (docs/copy-provenance.md) — but Nagpur itself is uncontested and is the
 * fact a traveller needs, so the row names the city and claims no figure.
 */
export const VANN_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Pench, at the hour the forest wakes",
    sub: "Mahua Vann — five kilometres from Turia Gate, among the first vehicles through it at dawn.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  chapterIntroCopy: {
    "vann-place": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      body: [
        "Mahua Vann sits in the heart of Pench National Park, close enough to Turia Gate to be " +
          "among the first vehicles through it. Mornings begin on a jeep safari through forest " +
          "Kipling wrote into the Jungle Book without ever visiting; afternoons slow down at " +
          "Kohka Lake, where the birds come to the water and the day comes down with them.",
        "A short drive away, more than a hundred Kumhar families in the village of Pachdhar have " +
          "kept the potter's wheel turning for generations. Guests are welcome to sit down at one.",
      ],
    } satisfies ChapterIntroCopy,
  },

  plateGridCopy: {
    "vann-dining": {
      heading: { text: "What the season gives", dim: "gives" },
      intro:
        "Regional dishes built from what is local and in season — Chulai ki Bhaaji, Mahua Kheer — " +
        "beside international favourites, served under the open sky, by the river, or in the " +
        "privacy of a cottage.",
      plates: [
        {
          mediaId: "vann-dining",
          plate: "I",
          caption: "A table laid under the open sky at Mahua Vann.",
        },
      ],
    } satisfies PlateGridCopy,
    "vann-experiences": {
      heading: { text: "The day at Vann", dim: "day" },
      intro:
        "Morning and evening game drives, birdwatching in the lodge's own private eco park, an " +
        "afternoon in the pool under the trees, and a film in the courtyard once the light goes.",
      plates: [
        {
          mediaId: "vann-tiger",
          plate: "I",
          caption: "The reason the vehicles queue at Turia Gate before dawn.",
        },
        {
          mediaId: "vann-bird-watching",
          plate: "II",
          caption: "Birdwatching in Mahua Vann's own private eco park.",
        },
        {
          mediaId: "vann-pool",
          plate: "III",
          caption: "The pool under the trees, late-afternoon sun through the canopy.",
        },
        {
          mediaId: "vann-evening",
          plate: "IV",
          caption: "An open-air wildlife documentary in the courtyard after dinner.",
        },
      ],
    } satisfies PlateGridCopy,
  },

  roomsIndexCopy: {
    "vann-rooms": {
      heading: { text: "Twenty-six rooms, three shapes", dim: "shapes" },
      intro:
        "Deluxe rooms, cottages without a deck and cottages with one over the seasonal river — all " +
        "handmade in mud and local wood, with air conditioning, a tea and coffee maker and a " +
        "private vanity area.",
      bands: [
        {
          mediaId: "vann-room-deluxe",
          entries: [
            {
              name: "Deluxe",
              size: "225 sq. ft.",
              bed: "Queen bed",
              view: "Garden and jungle view",
            },
          ],
        },
        {
          // One photograph, both cottage types: the live site has no distinct
          // Cottage-without-Deck image anywhere in its media library (spec §6
          // checked this against the page's own markup), so the two share the
          // band and the note says which one is shown.
          mediaId: "suite-tiger-painting",
          note: "Shown: Cottage with Deck.",
          entries: [
            {
              name: "Cottage with Deck",
              size: "324 sq. ft.",
              bed: "King bed, private sit-out",
              view: "Jungle and seasonal river view",
            },
            {
              name: "Cottage without Deck",
              size: "324 sq. ft.",
              bed: "King bed, private sit-out",
              view: "Jungle view",
            },
          ],
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "vann-field-notes": {
      heading: { text: "Getting to Mahua Vann", dim: "Vann" },
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Khawasa" },
        { label: "By road", value: "Khawasa Bus Stop, 8 km" },
        { label: "From the gate", value: "Five kilometres from Turia Gate" },
      ],
      address: "Village Kuppitola, Khawasa, Madhya Pradesh 480881",
      bookLabel: "Book Mahua Vann",
      enquireLabel: "Enquire",
      sibling: {
        mediaId: "tola-candlelit-dinner",
        label: "Looking for Tadoba instead? Mahua Tola →",
      },
    } satisfies FieldNotesCopy,
  },
};

export const VANN_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
