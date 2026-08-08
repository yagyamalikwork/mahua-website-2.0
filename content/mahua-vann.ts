import type { ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import type { FieldNotesCopy } from "@/components/sections/FieldNotes";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PlateGridCopy } from "@/components/sections/PlateGrid";
import type { RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Vann's spine. Six chapters: hero, place, dining, experiences, the
 * rooms index, then field notes — no guest quote yet (none of the harvested
 * Tripadvisor reviews name Pench or Vann specifically, and this page does
 * not invent one). Rhythm holds without it: `chapterIntro` is the only
 * "quiet" kind here and it sits between two image-led ones on both sides.
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
    id: "vann-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["vann-bird-watching", "vann-evening"],
  },
  {
    // "suite-tiger-painting", not a new "vann-room-cottage" id: Task 4 (9 Aug
    // 2026) found the cottage-with-deck source file is byte-identical to this
    // existing home-page entry and dropped the duplicate rather than curating
    // it twice.
    id: "vann-rooms",
    kind: "roomsIndex",
    media: ["vann-room-deluxe", "suite-tiger-painting"],
  },
  {
    id: "vann-field-notes",
    kind: "fieldNotes",
    media: [],
  },
] as const satisfies readonly PropertyChapter[];

/**
 * Mahua Vann's copy. Adapted from `reference/site-copy.md`'s Mahua Vann
 * section and `../Mahua_Resorts_Master_Brand_Record.md`, in the established
 * brand voice — British spelling, specificity over adjectives.
 *
 * The room count (26, split 13 Deluxe / 5 Cottage without Deck / 8 Cottage
 * with Deck) is the live site's own structured total and cross-checks
 * against the brand record. Nagpur's distance is deliberately omitted — the
 * live site says 80 km, the brand record 104-112 km, and neither is trusted
 * (see docs/copy-provenance.md, same standard the home page already holds).
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
        "Morning and evening game drives, birdwatching in the lodge's own private eco park, and a " +
        "quieter afternoon at Kohka Lake or the Pachdhar potters' wheel.",
      plates: [
        {
          mediaId: "vann-bird-watching",
          plate: "I",
          caption: "Birdwatching in Mahua Vann's own private eco park.",
        },
        {
          mediaId: "vann-evening",
          plate: "II",
          caption: "An evening gathering after the day's safari, the naturalist's stories still going.",
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
      rooms: [
        {
          mediaId: "vann-room-deluxe",
          name: "Deluxe",
          size: "225 sq. ft.",
          bed: "Queen bed",
          view: "Garden and jungle view",
        },
        {
          mediaId: "suite-tiger-painting",
          name: "Cottage with Deck",
          size: "324 sq. ft.",
          bed: "King bed, private sit-out",
          view: "Jungle and seasonal river view",
        },
        {
          mediaId: "suite-tiger-painting",
          name: "Cottage without Deck",
          size: "324 sq. ft.",
          bed: "King bed, private sit-out",
          view: "Jungle view",
          note: "Shown: Cottage with Deck.",
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "vann-field-notes": {
      heading: { text: "Getting to Mahua Vann", dim: "Vann" },
      gettingThere: [
        { label: "By road", value: "Khawasa Bus Stop, 8 km" },
        { label: "From the gate", value: "Five kilometres from Turia Gate" },
      ],
      address: "Village Kuppitola, Khawasa, Madhya Pradesh 480881",
      bookLabel: "Book Mahua Vann",
      enquireLabel: "Enquire",
      siblingLabel: "Looking for Tadoba instead? Mahua Tola →",
    } satisfies FieldNotesCopy,
  },
};

export const VANN_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
