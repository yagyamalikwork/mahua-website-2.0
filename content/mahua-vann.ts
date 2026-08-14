import type { OpeningColumnCopy } from "@/components/sections/OpeningColumn";
import type { PropertyMapCopy } from "@/components/sections/PropertyMap";
import type { RoomShowcaseCopy } from "@/components/sections/RoomShowcase.types";
import type { ExperiencePairCopy } from "@/components/sections/ExperiencePair";
import type { PressBandCopy } from "@/components/sections/PressBand";
import type { FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyInvitationCopy } from "@/components/property/PropertyInvitation";
import type { PropertyContactCopy } from "@/components/property/PropertyContact";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Vann's spine, in the redesign's shape vocabulary. Eight moments, no
 * two adjacent alike (`findRepeatedShape` is unit-tested generically in
 * `content/property-chapters.test.ts`; the test watched failing against
 * *this* file's actual spine lives in `content/mahua-vann.test.ts` — see its
 * own note), and `column` / `press` — the two quiet shapes — are each
 * flanked by image-led ones so the older rhythm rule (CLAUDE.md
 * non-negotiable #10) holds too.
 *
 * `vann-hero` and `vann-invitation` carry no number/label, matching the
 * spec's own menu (Stay · Dining · Experiences · Getting there is now Rooms ·
 * Where it is · The table · The day · Written about) — the numbered run is
 * 01–06, `vann-forest` through `vann-press`.
 */
export const VANN_CHAPTERS: readonly PropertyChapter[] = [
  { id: "vann-hero", shape: "fullBleed", media: ["vann-hero"] },
  {
    id: "vann-forest",
    number: "01",
    label: "The Forest",
    shape: "column",
    media: [],
  },
  {
    id: "vann-where",
    number: "02",
    label: "Where It Is",
    shape: "map",
    media: [],
  },
  {
    // Each room now has its own photograph — Task 11 curated
    // vann-room-cottage-plain from the live page's own "Cottages without
    // Deck" tab, so the "Shown: Cottage with Deck" note the old file carried
    // no longer applies to either cottage type.
    id: "vann-rooms",
    number: "03",
    label: "The Rooms",
    shape: "showcase",
    media: ["vann-room-deluxe", "vann-room-cottage-plain", "suite-tiger-painting"],
  },
  {
    // NOT "vann-dining" — see the long comment on VANN_COPY.quoteCopy below.
    // vann-dining is 1163px wide, short of the 1400px full-bleed floor
    // (non-negotiable #11), and this shape renders edge-to-edge.
    id: "vann-table",
    number: "04",
    label: "The Table",
    shape: "fullBleed",
    media: ["lawn-picnic-golden-hour"],
  },
  {
    id: "vann-day",
    number: "05",
    label: "The Day",
    shape: "pair",
    media: [
      "vann-tiger",
      "vann-kohka-lake",
      "vann-bird-watching",
      "vann-dining",
      "vann-potters-village",
      "forest-trail-canopy",
    ],
  },
  {
    id: "vann-press",
    number: "06",
    label: "Written About",
    shape: "press",
    media: [],
  },
  {
    // The sibling banner carries Mahua Tola's own candlelit poolside dinner —
    // a photograph of the *other* lodge, which is the point (see
    // PropertyInvitation's own doc comment). Cross-page use, not a
    // within-page repeat.
    id: "vann-invitation",
    shape: "invitation",
    media: ["tola-candlelit-dinner"],
  },
] as const satisfies readonly PropertyChapter[];

/**
 * The lodge's own contact details. One definition, used both by the closing
 * invitation and by `PropertyBar`, so the phone number can never disagree
 * with itself. `href` is the digits with no spaces — a `tel:` with spaces in
 * it fails silently on some Android dialers, which is precisely the failure
 * mode this replaced a form to avoid.
 */
export const VANN_CONTACT: PropertyContactCopy = {
  phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
  email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
  address: {
    label: "Find us",
    value: "Village Kuppitola, Khawasa, Madhya Pradesh 480881",
  },
};

/**
 * Mahua Vann's copy. Adapted from `reference/site-copy.md`'s Mahua Vann
 * section, `reference/wp-pages/resorts_mahua-vann.html` (the three press
 * articles, verbatim) and `../Mahua_Resorts_Master_Brand_Record.md`, in the
 * established brand voice — British spelling, specificity over adjectives.
 *
 * Nagpur's *distance* is deliberately omitted — the live site says 80 km, the
 * brand record 104-112 km, and neither is trusted (docs/copy-provenance.md) —
 * but Nagpur itself is uncontested and is the fact a traveller needs, so the
 * getting-there row names the city and claims no figure.
 */
export const VANN_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Pench, at the hour the forest wakes",
    sub: "Mahua Vann — five kilometres from Turia Gate, among the first vehicles through it at dawn.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  columnCopy: {
    "vann-forest": {
      // Heading changed from the old file's "Five kilometres from the gate" —
      // that line now belongs to vann-where (the map), below, and using it
      // twice on one page would read as a mistake rather than an echo.
      heading: { text: "The forest of the Jungle Book", dim: "Jungle" },
      body: [
        // Carried over verbatim from the pre-redesign file — the words
        // already worked.
        "Mahua Vann sits in the heart of Pench National Park, close enough to Turia Gate to be " +
          "among the first vehicles through it. Mornings begin on a jeep safari through forest " +
          "Kipling wrote into the Jungle Book without ever visiting; afternoons slow down at " +
          "Kohka Lake, where the birds come to the water and the day comes down with them.",
        "A short drive away, more than a hundred Kumhar families in the village of Pachdhar have " +
          "kept the potter's wheel turning for generations. Guests are welcome to sit down at one.",
      ],
    } satisfies OpeningColumnCopy,
  },

  mapCopy: {
    "vann-where": {
      heading: { text: "Five kilometres from the gate", dim: "gate" },
      art: "vann",
      // x/y are fractions of the artwork's own 800×484 box (mapRight=800 in
      // scripts/build_map.mjs; height is the untouched source height), read
      // off reference/wp-media/property-pages/Mahua-website_Vann-pench-map.jpg
      // in source pixels (px, py) and converted x = px/800, y = py/484 — the
      // source is 968×484, so mapRight crops the legend/compass off the
      // right edge and every coordinate below is transcribed against the
      // *un-cropped* left 800px, which is exactly what the SVG draws.
      // Verified by eye against 3×-upscaled crops of the source, not against
      // memory — see the task report for the crop coordinates used.
      labels: [
        // The three named gates.
        { text: "Turia Gate", x: 0.635, y: 0.603, kind: "gate" },
        { text: "Karmajhiri Gate", x: 0.619, y: 0.376, kind: "gate" },
        { text: "Jamtara Gate", x: 0.488, y: 0.318, kind: "gate" },
        // Water.
        { text: "Pench Reservoir", x: 0.416, y: 0.589, kind: "water" },
        { text: "Pench River", x: 0.623, y: 0.114, kind: "water" },
        // The artwork spells this "Totlah Doh Dam" — three words, not
        // "Totladoh" as the live site's own copy and the brand record both
        // have it. Transcribed off the artwork itself, per the brief's own
        // instruction not to trust memory on spelling here.
        { text: "Totlah Doh Dam", x: 0.44, y: 0.926, kind: "water" },
        // The villages (black-dot markers on the artwork). Forest rest
        // houses (Kumbhpani, Rukhad, the plain "Karmajhiri" beneath its
        // Gate label, and Khawasa) are drawn with a triangle icon on the
        // artwork, not a village dot, and MapLabelKind has no matching kind
        // — rendering them as "village" would put a black dot where the
        // source draws a different mark, so they are left off rather than
        // mislabelled. See the task report.
        { text: "Halal", x: 0.565, y: 0.103, kind: "village" },
        { text: "Tikari", x: 0.555, y: 0.293, kind: "village" },
        { text: "Ghumtara", x: 0.419, y: 0.448, kind: "village" },
        { text: "Chindia", x: 0.519, y: 0.419, kind: "village" },
        { text: "Alhatta", x: 0.51, y: 0.537, kind: "village" },
        { text: "Payorthadi", x: 0.544, y: 0.676, kind: "village" },
        { text: "Pulpuldoh", x: 0.285, y: 0.651, kind: "village" },
        // The "Kurai" village dot's position is fixed to the exact figure
        // already established in scripts/build_map.mjs's own road-gap
        // comment (measured there for a different reason — bridging the
        // road past this same dot) rather than re-eyeballed: "(690, 207) in
        // the 968px source".
        { text: "Kurai", x: 0.863, y: 0.428, kind: "village" },
        // The road's own destination labels, as the brief's worked example
        // allows.
        { text: "Towards Seoni, Jabalpur", x: 0.809, y: 0.031, kind: "road" },
        { text: "Towards Nagpur", x: 0.65, y: 0.812, kind: "road" },
      ],
      lodge: { text: "Mahua Vann", x: 0.7, y: 0.655 },
      legend: [
        { swatch: "core", text: "Core area" },
        { swatch: "park", text: "Buffer zone" },
        { swatch: "water", text: "Water" },
        { swatch: "road", text: "Main road" },
        { swatch: "gate", text: "Park entry gate" },
        // Added 9 Aug 2026 (Task 13's authorised extra work): the eight
        // village dots below (Halal, Tikari, Ghumtara…) were already being
        // drawn — PropertyMap has always rendered `kind: "village"` as a
        // solid dot — but MapLegendEntryCopy's swatch union had no "village"
        // member, so nothing in the key could name them. See
        // components/sections/PropertyMap.tsx's SWATCH map.
        { swatch: "village", text: "Village" },
      ],
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Khawasa" },
        { label: "By road", value: "Khawasa Bus Stop, 8 km" },
        { label: "From the gate", value: "Five kilometres from Turia Gate" },
      ],
    } satisfies PropertyMapCopy,
  },

  showcaseCopy: {
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
          line: "Handmade in mud and local wood, with a queen bed and views that open from the garden into the jungle beyond.",
          facts: ["225 sq ft", "Queen bed", "Garden and jungle view"],
        },
        {
          mediaId: "vann-room-cottage-plain",
          name: "Cottage without Deck",
          // Re-read 14 Aug 2026 against the shipped crop (`left: 0`,
          // scripts/build_images.mjs) — flagged rather than silently fixed,
          // the same way that file's own comment on this entry flags it.
          // This line's opening clause names the cane sit-out and its
          // chair; the crop that ships today shows neither. The pipeline
          // chose a bed-first, `left: 0` window over the sit-out because
          // the card's one job is to sell the room, not one amenity in it
          // — the source is 1931px wide with the bed and the sit-out chair
          // ~1740px apart, and no 1184px window can hold both. The room
          // itself still has a private sit-out under cane; it is real and
          // still named two lines below, in this room's own `facts`
          // ("King bed, private sit-out") — so nothing false is claimed
          // about the ROOM, only about what this specific PHOTOGRAPH now
          // shows. Left deliberately untouched: whether to lead with the
          // bed instead is a copy decision, and the client reviews every
          // line — a controller does not rewrite it unilaterally. Open
          // item awaiting the client: docs/DECISIONS.md §5.
          line: "A private sit-out under cane, and the forest close enough to touch through the glass doors.",
          facts: ["324 sq ft", "King bed, private sit-out", "Jungle view"],
        },
        {
          mediaId: "suite-tiger-painting",
          name: "Cottage with Deck",
          line: "A king bed, a private deck over the seasonal river, and the forest holding it on every side.",
          facts: ["324 sq ft", "King bed, private sit-out", "Jungle and seasonal river view"],
        },
      ],
    } satisfies RoomShowcaseCopy,
  },

  /**
   * `vann-table` ("04 · The Table") is a `fullBleed` shape, which renders
   * edge-to-edge — non-negotiable #11 requires the underlying image to be
   * ≥1400px wide. The old file's dining photograph, `vann-dining`, is only
   * 1163px (its own source file tops out there; re-checked directly with
   * `sharp(...).metadata()`, not assumed from the manifest), so it cannot be
   * used here without failing the full-bleed-safety test — the brief's own
   * worked spine table names it for this slot, which is a defect in the
   * brief, not a rule to bend.
   *
   * `vann-dining` still appears once on this page — as the pair's
   * "Candlelight Bush Dinner" (`weight: "hero"`, a *contained*, not
   * edge-to-edge, box), which is where the brief's own worked `pairCopy`
   * example already put it, and where a photograph under 1400px is fine.
   *
   * In its place: `lawn-picnic-golden-hour` (source
   * `reference/wp-media/JAS05507-HDR-scaled.jpg`, 2560×1707, already curated
   * and fullBleedSafe) — picnic tables and umbrellas set out on a lawn at
   * golden hour, looked at directly rather than taken on the alt text alone.
   * It matches this chapter's own copy ("served under the open sky") without
   * repeating the candlelit-night mood the pair chapter right after it
   * already carries with vann-dining. `FullBleed`'s photograph is
   * `decorative` (`alt=""`), so it makes no factual claim beyond what the
   * quote below says — it does not need to be Mahua Vann's own dining table
   * specifically to be honest here, only to not misrepresent what it shows,
   * which it does not.
   */
  quoteCopy: {
    "vann-table": {
      quote: "Chulai ki Bhaaji, Mahua Kheer, and whatever the season gives — under the open sky.",
    } satisfies FullBleedQuoteCopy,
  },

  pairCopy: {
    "vann-day": {
      heading: { text: "The day at Vann", dim: "day" },
      intro:
        "Morning and evening game drives, birdwatching in the lodge's own private eco park, " +
        "and a quieter afternoon at Kohka Lake or the Pachdhar potters' wheel.",
      experiences: [
        {
          mediaId: "vann-tiger",
          name: "Jungle Safari",
          line: "Open vehicles through Turia Gate at first light, with the naturalists who know this forest.",
          weight: "hero",
        },
        {
          mediaId: "vann-kohka-lake",
          name: "Kohka Lake",
          line: "Still water at the forest's edge, where the birds come down as the day does.",
          weight: "quiet",
        },
        {
          mediaId: "vann-bird-watching",
          name: "Bird Watching",
          line: "Thirty-seven acres of private eco park, and a guide who can name what is calling.",
          weight: "quiet",
        },
        {
          mediaId: "vann-dining",
          name: "Candlelight Bush Dinner",
          line: "A table laid in an open space in the forest, and the stars coming out over it.",
          weight: "hero",
        },
        {
          mediaId: "vann-potters-village",
          name: "The Potters of Pachdhar",
          line: "More than a hundred Kumhar families have kept the wheel turning here. Sit down at one.",
          weight: "quiet",
        },
        {
          // NOT "vann-pool" — the brief flagged that id as a stand-in that
          // "must be checked": the live site pairs Serene Nature Walk with a
          // different photograph (RAG1474-scaled.jpg, not curated), and
          // vann-pool shows the pool, not a walk. "do not caption the pool
          // as a forest path" — five alt texts on this branch already
          // described photographs they were not.
          //
          // forest-trail-canopy (already curated, fullBleedSafe not
          // required here — this is a contained "quiet" box) is a genuine
          // sunlit forest trail: looked at directly
          // (reference/wp-media/DSC00170-scaled.jpg), not inferred from its
          // alt text. Its "dappled" quality is what the line below was
          // already written around.
          mediaId: "forest-trail-canopy",
          name: "Serene Nature Walk",
          line: "No vehicle, no schedule — earthy air, dappled light, and whatever the woods are saying.",
          weight: "quiet",
        },
      ],
      alsoLine:
        // "seats forty" was cut 9 Aug (fix round 1): it traced to nothing —
        // not the live site's own copy, not the brand record, not
        // docs/copy-provenance.md, not the task brief. It existed only in
        // the master plan's illustrative worked example, which was never
        // sourced. Do not reintroduce a capacity figure without a source.
        "Also: cycling the estate's trails, swimming, table tennis and carrom, karaoke, " +
        "and a conference hall.",
    } satisfies ExperiencePairCopy,
  },

  pressCopy: {
    "vann-press": {
      heading: { text: "Written about", dim: "about" },
      articles: [
        {
          publication: "Condé Nast Traveller",
          headline: "Where to stay in Pench",
          standfirst: "From outdoor machans to luxury tents, the best properties to explore the wilderness.",
          href: "https://www.cntraveller.in/story/where-to-stay-in-pench-national-park-baghvan-taj-safari-jamatara-top-hotels-to-book-in-pench/",
          linkLabel: "Read the article",
        },
        {
          // The live page's own logo image has no legible publication name
          // in its markup; the domain (travelandleisureasia.com) confirms
          // this is the regional edition, not the US site, so it is named
          // as such rather than as the brief's shorthand "Travel + Leisure".
          publication: "Travel + Leisure Asia",
          headline: "Feel Bliss At These Jungle Lodges And Resorts In Pench National Park",
          standfirst:
            "Looking forward to your next wildlife outing sometime soon? Reconnect with nature at these lodges and resorts in Pench National Park.",
          href: "https://www.travelandleisureasia.com/in/hotels/india-hotels/jungle-lodges-and-resorts-in-pench-national-park/",
          linkLabel: "Read the article",
        },
        {
          publication: "The Guardian",
          headline: "India: five gorgeous getaways",
          standfirst:
            "From a remote desert camp in Rajasthan to cottages right on the sand in Kerala, these five exclusive Indian pads are the perfect antidote to winter",
          href: "https://www.theguardian.com/travel/blog/2012/nov/21/india-luxury-logdes-cottages-rajasthan",
          linkLabel: "Read the article",
        },
      ],
    } satisfies PressBandCopy,
  },

  invitationCopy: {
    "vann-invitation": {
      heading: { text: "Stay at Mahua Vann", dim: "Vann" },
      // Rewritten in the whole-branch review's fix wave (10 Aug 2026): this
      // line was byte-identical to Mahua Tola's own, bar the gate name — the
      // last sentence a visitor reads on either page, saying the same thing
      // twice. Kipling is Vann's own texture (already established in
      // columnCopy above), not Tola's, and belongs in its close too. See
      // content/mahua-tola.test.ts's widened "does not reuse Mahua Vann's
      // opening headline" test, which now checks this field as well.
      line: "Turia Gate is five kilometres up the road, and the forest Kipling wrote about is waiting on the other side of it. Write to us, or call — we will do the rest.",
      bookLabel: "Book Mahua Vann",
      contact: VANN_CONTACT,
      sibling: {
        mediaId: "tola-candlelit-dinner",
        label: "Looking for Tadoba instead? Mahua Tola →",
      },
    } satisfies PropertyInvitationCopy,
  },
};

export const VANN_BAR = {
  name: "Mahua Vann · Pench",
  bookLabel: "Book",
};
