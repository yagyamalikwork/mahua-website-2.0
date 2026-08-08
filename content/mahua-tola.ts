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
 *
 * The rooms and field notes are numbered 04/05 for the same reason as
 * Vann's — the menu must list them (spec §5). The guest quote stays
 * unnumbered: it is a held breath, not a stop on the itinerary.
 */
export const TOLA_CHAPTERS: readonly PropertyChapter[] = [
  // DSC00044 — the lodge across its lily pond at dusk — since 9 Aug 2026.
  // The candlelit-dinner frame that opened the page before that now closes
  // the dining chapter as "tola-candlelit-dinner", where its subject and its
  // caption finally agree. See scripts/build_images.mjs.
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
    // One plate, full container width, on purpose — measured with a second
    // plate beside it (9 Aug 2026) this chapter *lost* density, 18.1% → 49.8%
    // empty: two 736px plates carry less imagery than one 1504px one. The
    // candlelit-dinner frame that briefly sat here closes /mahua-vann as its
    // "Looking for Tadoba instead?" banner, where it works harder anyway.
    id: "tola-dining",
    number: "02",
    label: "Dining",
    kind: "plateGrid",
    media: ["tola-dining"],
  },
  {
    // Two plates since 9 Aug 2026: the pool, and the bonfire — a named
    // experience on the live Tola page whose photograph (DSC00097) the first
    // fetch had already pulled and never used.
    id: "tola-experiences",
    number: "03",
    label: "Experiences",
    kind: "plateGrid",
    media: ["tola-swimming", "tola-bonfire"],
  },
  {
    id: "tola-rooms",
    number: "04",
    label: "The Rooms",
    kind: "roomsIndex",
    media: ["tola-room-deluxe", "tola-room-suite", "tola-room-family", "tola-room-camping"],
  },
  {
    id: "tola-field-notes",
    number: "05",
    label: "Getting There",
    kind: "fieldNotes",
    media: ["vann-hero"],
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
        "Maharashtrian specialities beside global favourites, cooked from what is fresh and local — " +
        "a meal to the sound of the jungle, or a candlelit dinner by the water.",
      plates: [
        {
          mediaId: "tola-dining",
          plate: "I",
          caption: "The dining hall, tables laid under wicker pendant lamps.",
        },
      ],
    } satisfies PlateGridCopy,
    "tola-experiences": {
      heading: { text: "The day at Tola", dim: "day" },
      intro:
        "Tiger safaris at dawn and dusk, an afternoon along the Hattinala, a pool to come back to, " +
        "and a bonfire once the light goes.",
      plates: [
        {
          mediaId: "tola-swimming",
          plate: "I",
          caption: "The pool at Mahua Tola, between drives.",
        },
        {
          mediaId: "tola-bonfire",
          plate: "II",
          caption: "The bonfire, lit after the evening drive comes in.",
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
      bands: [
        {
          mediaId: "tola-room-deluxe",
          entries: [
            {
              name: "Deluxe",
              size: "220 sq. ft.",
              bed: "Twin beds",
              view: "Forest view",
            },
          ],
        },
        {
          // The Super Deluxe Cottage has no interior photograph anywhere in
          // the live site's media (its rooms tab shows the lodge exterior),
          // so it shares the Suite's band and the note says so.
          mediaId: "tola-room-suite",
          note: "Shown: Suite.",
          entries: [
            {
              name: "Suite",
              size: "270 sq. ft.",
              bed: "Queen bed",
              view: "Forest view",
            },
            {
              name: "Super Deluxe Cottage",
              size: "300 sq. ft.",
              bed: "King bed",
              view: "Forest view",
            },
          ],
        },
        {
          // The live Tola page's own Family Suite tab image (DSC09703),
          // cross-referenced 9 Aug 2026 — the first build repeated the Suite
          // photograph here instead, with a second "Shown: Suite." note.
          mediaId: "tola-room-family",
          entries: [
            {
              name: "Family Suite",
              size: "450 sq. ft., two interconnected rooms",
              bed: "Queen and king bed",
              view: "Forest view",
            },
          ],
        },
        {
          mediaId: "tola-room-camping",
          entries: [
            {
              name: "Camping Hut",
              size: "500 sq. ft.",
              bed: "Four cemented single beds",
              view: "Forest view",
            },
          ],
        },
      ],
    } satisfies RoomsIndexCopy,
  },

  fieldNotesCopy: {
    "tola-field-notes": {
      heading: { text: "Getting to Mahua Tola", dim: "Tola" },
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Chimur" },
        { label: "By road", value: "Chimur, 17 km" },
        { label: "From the gate", value: "Five kilometres from Kolara Gate" },
      ],
      address: "Village – Adegaon Tehsil – Chimur TATR, Maharashtra 442904",
      bookLabel: "Book Mahua Tola",
      enquireLabel: "Enquire",
      sibling: {
        mediaId: "vann-hero",
        label: "Looking for Pench instead? Mahua Vann →",
      },
    } satisfies FieldNotesCopy,
  },
};

export const TOLA_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};
