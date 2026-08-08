import type { ChapterIntroCopy } from "@/components/sections/ChapterIntro";
import type { FieldNotesCopy } from "@/components/sections/FieldNotes";
import type { FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PlateGridCopy } from "@/components/sections/PlateGrid";
import type { RoomsIndexCopy } from "@/components/sections/RoomsIndex";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Tola's spine. Seven chapters — one more than Vann's, because a
 * genuine, attributed guest quote exists for this property (Vedant, 2019,
 * names Tadoba directly) and Vann's does not.
 */
export const TOLA_CHAPTERS: readonly PropertyChapter[] = [
  { id: "tola-hero", kind: "hero", media: ["tola-hero"] },
  {
    id: "tola-place",
    number: "01",
    label: "The Place",
    kind: "chapterIntro",
    media: ["tola-tiger-safari", "tola-river-walk", "tola-experiences"],
  },
  {
    id: "tola-guest-word",
    kind: "fullBleedQuote",
    media: ["tola-guest-word"],
  },
  {
    id: "tola-dining",
    number: "02",
    label: "Dining",
    kind: "plateGrid",
    media: ["tola-dining"],
  },
  {
    // One plate, not two — Task 3 (9 Aug 2026) found "tola-evening" would
    // have been a byte-identical duplicate of "vann-evening"'s underlying
    // photograph (perceptual hash distance 0). Vann keeps it; this chapter
    // runs on tola-swimming alone. Still valid: plateGrid's floor is 1
    // (content/mahua-tola.test.ts).
    id: "tola-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["tola-swimming"],
  },
  {
    id: "tola-rooms",
    kind: "roomsIndex",
    media: ["tola-room-deluxe", "tola-room-suite", "tola-room-camping"],
  },
  {
    id: "tola-field-notes",
    kind: "fieldNotes",
    media: [],
  },
] as const satisfies readonly PropertyChapter[];

/**
 * Mahua Tola's copy. Adapted from `reference/site-copy.md`'s Mahua Tola
 * section and `../Mahua_Resorts_Master_Brand_Record.md`.
 *
 * **Room count: twelve, not fourteen.** The live site's own structured room
 * list (5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite + 1
 * Camping Hut = 12) is what has real per-type facts. The brand record's
 * "growing to 14" refers to three new river-facing machaan rooms still under
 * construction, with no published size/bed/view for them yet — needs client
 * confirmation before those are added as their own entries (docs/copy-provenance.md,
 * docs/superpowers/specs/2026-08-08-property-pages-design.md §8).
 *
 * **Tiger density is stated comparatively, not as the live site's specific
 * count.** The live site says "115 tigers" and "highest Sighting Rating Index
 * in the country" — the home page's own copy already softened this same claim
 * for the same reason (a number that will date); this page follows that
 * precedent rather than reintroducing the harder claim in new copy.
 */
export const TOLA_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Tadoba, raw and close to the gate",
    sub: "Mahua Tola — five kilometres from Kolara Gate, on the Hattinala river.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  chapterIntroCopy: {
    "tola-place": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      body: [
        "Mahua Tola sits at the edge of the Tadoba-Andhari Tiger Reserve, close enough to Kolara " +
          "Gate to be among the first vehicles through it. Tadoba carries one of the highest tiger " +
          "densities anywhere in the country, and the drives here are guided by trackers who know " +
          "this forest's cats by name.",
        "The Hattinala river runs along the property — flowing water, birdsong, and a walk with " +
          "nothing scheduled on it.",
      ],
    } satisfies ChapterIntroCopy,
  },

  fullBleedQuoteCopy: {
    "tola-guest-word": {
      quote: "One of the best forests for seeing tigers and one of the best resorts to stay in Tadoba.",
    } satisfies FullBleedQuoteCopy,
  },

  plateGridCopy: {
    "tola-dining": {
      heading: { text: "What the kitchen keeps", dim: "keeps" },
      intro:
        "Maharashtrian specialties beside global favourites, cooked from what is fresh and local — " +
        "a meal to the sound of the jungle, or a candlelit dinner by the river.",
      plates: [
        {
          mediaId: "tola-dining",
          plate: "I",
          caption: "Dining at Mahua Tola, to the sound of the forest.",
        },
      ],
    } satisfies PlateGridCopy,
    "tola-experiences": {
      heading: { text: "The day at Tola", dim: "day" },
      intro:
        "Tiger safaris at dawn and dusk, an afternoon along the Hattinala, and a pool to come back " +
          "to once the light goes.",
      plates: [
        {
          mediaId: "tola-swimming",
          plate: "I",
          caption: "The pool at Mahua Tola, between drives.",
        },
      ],
    } satisfies PlateGridCopy,
  },

  roomsIndexCopy: {
    "tola-rooms": {
      heading: { text: "Twelve rooms, five shapes", dim: "shapes" },
      intro:
        "Deluxe rooms, suites, super deluxe cottages, a family suite and a camping hut, all with a " +
        "forest view.",
      rooms: [
        {
          mediaId: "tola-room-deluxe",
          name: "Deluxe",
          size: "220 sq. ft.",
          bed: "Twin beds",
          view: "Forest view",
        },
        {
          mediaId: "tola-room-suite",
          name: "Suite",
          size: "270 sq. ft.",
          bed: "Queen bed",
          view: "Forest view",
        },
        {
          mediaId: "tola-room-suite",
          name: "Super Deluxe Cottage",
          size: "300 sq. ft.",
          bed: "King bed",
          view: "Forest view",
          note: "Shown: Suite.",
        },
        {
          mediaId: "tola-room-suite",
          name: "Family Suite",
          size: "450 sq. ft., two interconnected rooms",
          bed: "Queen and king bed",
          view: "Forest view",
          note: "Shown: Suite.",
        },
        {
          mediaId: "tola-room-camping",
          name: "Camping Hut",
          size: "500 sq. ft.",
          bed: "Four cemented single beds",
          view: "Forest view",
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "tola-field-notes": {
      heading: { text: "Getting to Mahua Tola", dim: "Tola" },
      gettingThere: [
        { label: "By road", value: "Chimur, 17 km" },
        { label: "From the gate", value: "Five kilometres from Kolara Gate" },
      ],
      address: "Village – Adegaon Tehsil – Chimur TATR, Maharashtra 442904",
      bookLabel: "Book Mahua Tola",
      enquireLabel: "Enquire",
      siblingLabel: "Looking for Pench instead? Mahua Vann →",
    } satisfies FieldNotesCopy,
  },
};

export const TOLA_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
