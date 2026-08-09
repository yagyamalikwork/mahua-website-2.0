import type { OpeningColumnCopy } from "@/components/sections/OpeningColumn";
import type { PropertyMapCopy } from "@/components/sections/PropertyMap";
import type { RoomShowcaseCopy } from "@/components/sections/RoomShowcase";
import type { ExperiencePairCopy } from "@/components/sections/ExperiencePair";
import type { FullBleedQuoteCopy } from "@/components/sections/FullBleedQuote";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyInvitationCopy } from "@/components/property/PropertyInvitation";
import type { PropertyContactCopy } from "@/components/property/PropertyContact";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Tola's spine, in the redesign's shape vocabulary — deliberately NOT
 * Vann's. Vann runs hero → column → map → showcase → fullBleed → pair →
 * press → invitation. Tola has no press mentions (inventing parity with
 * Vann's three articles would be inventing content) and it does have a real,
 * attributed guest quote (Vedant, 2019, Tripadvisor — names Tadoba directly),
 * so in place of the press band it gets a second full-bleed moment, moved
 * earlier in the run: hero → column → map → **fullBleed (the guest's word)**
 * → showcase → fullBleed (the table) → pair → invitation.
 *
 * Shape sequence: fullBleed, column, map, fullBleed, showcase, fullBleed,
 * pair, invitation — no two adjacent alike, checked against
 * `findRepeatedShape` before this shipped (`content/mahua-tola.test.ts`
 * carries the same generic guard Vann's file does). `tola-guest-word` and
 * `tola-table` are both `fullBleed` but sit three moments apart (`map`,
 * `showcase` between them), and `tola-hero` and `tola-guest-word` are also
 * both `fullBleed` but have `column` and `map` between *them* — the closest
 * two full-bleed moments ever sit is one shape (`map` or `showcase`) apart,
 * never zero.
 *
 * `column` is this page's one quiet shape (there is no `press` band to be a
 * second one), and it sits between two image-led moments (`vann-hero`,
 * `vann-where`) — CLAUDE.md's older rhythm rule (non-negotiable #10) holds
 * even though only one quiet screen exists to check it against.
 *
 * Numbered chapters are 01–05 (`tola-reserve` through `tola-day`), one fewer
 * than Vann's 01–06 — this page has no `press` moment to number.
 */
export const TOLA_CHAPTERS: readonly PropertyChapter[] = [
  { id: "tola-hero", shape: "fullBleed", media: ["tola-hero"] },
  {
    // Heading is deliberately NOT "Five kilometres from the gate" — see the
    // long comment on TOLA_COPY.columnCopy below. Both pages shipped with
    // that exact sentence as chapter 01 on 9 Aug, and it is the clearest
    // evidence a visitor could have that they are reading a template. Vann's
    // rewrite (Task 12) moved its own copy of the line to its map section;
    // Tola's map does the same, below.
    id: "tola-reserve",
    number: "01",
    label: "The Reserve",
    shape: "column",
    media: [],
  },
  {
    id: "tola-where",
    number: "02",
    label: "Where It Is",
    shape: "map",
    media: [],
  },
  {
    // Vedant, 2019, Tripadvisor — a genuine, attributed guest quote that
    // names Tadoba directly. Where Vann has a press band (three articles
    // about Pench, none of them about Tola), this page has this instead:
    // moved up from a "Dining" plate caption in the pre-redesign file into
    // its own full-bleed moment, because it is stronger than anything wire
    // copy could say about the reserve, and inventing three press mentions
    // to match Vann's shape would be inventing content.
    id: "tola-guest-word",
    shape: "fullBleed",
    media: ["tola-guest-word"],
  },
  {
    id: "tola-rooms",
    number: "03",
    label: "The Rooms",
    shape: "showcase",
    media: ["tola-room-deluxe", "tola-room-suite", "tola-room-family", "tola-room-camping"],
  },
  {
    // tola-dining is 1440px wide and fullBleedSafe (non-negotiable #11) —
    // checked directly against lib/media-manifest.ts before this shipped.
    // Task 12's own brief was tripped by exactly this rule (a 1163px
    // photograph assigned to a fullBleed slot); tola-guest-word above and
    // tola-hero are also both checked and both 1440px.
    id: "tola-table",
    number: "04",
    label: "The Table",
    shape: "fullBleed",
    media: ["tola-dining"],
  },
  {
    // Six experiences, matching Vann's own tola-day/vann-day rhythm of two
    // "hero" (full-row) entries with an even run of "quiet" ones before each
    // — see the long comment on TOLA_COPY.pairCopy below for why the sixth
    // is not "Village Walk & Bamboo Crafts Market" despite that being one of
    // the six the brief named.
    id: "tola-day",
    number: "05",
    label: "The Day",
    shape: "pair",
    media: [
      "tola-tiger-safari",
      "tola-river-walk",
      "tola-bonfire",
      "tola-candlelit-dinner",
      "tola-swimming",
      "tola-experiences",
    ],
  },
  {
    // vann-hero, the same cross-page move Vann's own invitation makes with
    // tola-candlelit-dinner (a photograph of the *other* lodge, which is the
    // point — see PropertyInvitation's own doc comment). Not a within-page
    // repeat: content/mahua-tola.test.ts's "never shows the same photograph
    // twice" is scoped to TOLA_CHAPTERS alone, same as Vann's own test.
    id: "tola-invitation",
    shape: "invitation",
    media: ["vann-hero"],
  },
] as const satisfies readonly PropertyChapter[];

/**
 * The lodge's own contact details. Same phone and email as
 * `VANN_CONTACT` — the brand publishes one of each, for both properties —
 * and Tola's own address, transcribed verbatim from the live site's "Find
 * Us" field and from `reference/site-copy.md`. Kept as its own literal
 * record rather than importing `VANN_CONTACT` and overriding `address`:
 * every other cross-page fact on this page (the guest quote, the sibling
 * photograph) is bound to its source by a test that fails if the two ever
 * diverge, not by a shared import, and this follows the same pattern.
 */
export const TOLA_CONTACT: PropertyContactCopy = {
  phone: { label: "Speak to us", value: "+91 87448 67278", href: "tel:+918744867278" },
  email: { label: "Write", value: "sales@mahuaresorts.com", href: "mailto:sales@mahuaresorts.com" },
  address: {
    label: "Find us",
    value: "Village – Adegaon Tehsil – Chimur TATR, Maharashtra 442904",
  },
};

/**
 * Mahua Tola's copy. Adapted from `reference/site-copy.md`'s Mahua Tola
 * section, `reference/wp-pages/resorts_mahua-tola.html` and
 * `../Mahua_Resorts_Master_Brand_Record.md`, in the established brand voice —
 * British spelling, specificity over adjectives.
 *
 * **Room count: twelve, not fourteen.** The live site's own structured room
 * list (5 Deluxe + 2 Suite + 3 Super Deluxe Cottage + 1 Family Suite + 1
 * Camping Hut = 12) is what has real per-type facts. The brand record's
 * "growing to 14" refers to three new river-facing machaan rooms still under
 * construction, with no published size/bed/view for them yet — flagged here,
 * not resolved; it is the client's call, not a guess this file should make
 * (docs/copy-provenance.md, docs/superpowers/specs/2026-08-08-property-pages-design.md §8).
 *
 * **Tiger density is stated comparatively, not as the live site's specific
 * count.** The live site says "115 tigers" and "highest Sighting Rating Index
 * in the country" — both numbers that will date, and the home page's own
 * copy already softened this same claim for the same reason. This page
 * follows that precedent rather than reintroducing the harder claim.
 *
 * Nagpur's *distance* is deliberately omitted, same as Vann's own copy — the
 * live site says 100 km by one field and nothing corroborates it
 * (docs/copy-provenance.md) — but Nagpur itself is uncontested and is the
 * fact a traveller needs, so the getting-there row names the city and claims
 * no figure.
 */
export const TOLA_COPY: PropertyPageCopy = {
  heroCopy: {
    headline: "Tadoba, raw and close to the gate",
    sub: "Mahua Tola — on the Hattinala river, five kilometres from Kolara Gate.",
    scrollCue: "Discover the lodge",
  } satisfies HeroCopy,

  columnCopy: {
    "tola-reserve": {
      // Heading is NOT "Five kilometres from the gate" — that sentence
      // shipped as BOTH pages' chapter 01 heading on 9 Aug, which is the
      // single clearest evidence a visitor could have that they are reading
      // a template (content/mahua-tola.test.ts's "does not reuse Mahua
      // Vann's opening headline" guards this mechanically). Vann's rewrite
      // (Task 12) moved its own copy of the line down to its map section;
      // this page's map does the same, below, with a Kolara-specific
      // wording of its own rather than Vann's exact sentence.
      //
      // This heading opens on Tadoba's tiger density instead — the fact this
      // reserve is actually known for — and the body's second paragraph
      // carries the Hattinala and the villages beyond the boundary, per the
      // brief's own instruction to open on "Tadoba's density and the
      // Hattinala."
      heading: { text: "Where Tadoba runs at its densest", dim: "densest" },
      body: [
        "Mahua Tola sits at the edge of the Tadoba-Andhari Tiger Reserve, close enough to Kolara " +
          "Gate to be among the first vehicles through it. Tadoba carries one of the highest tiger " +
          "densities anywhere in the country, and the drives here are guided by trackers who know " +
          "this forest's cats by name.",
        "The Hattinala river runs along the property — flowing water, birdsong, and a walk with " +
          "nothing scheduled on it. The villages just beyond the boundary are their own find: a " +
          "warm welcome, and a bamboo crafts market worth the detour.",
      ],
    } satisfies OpeningColumnCopy,
  },

  mapCopy: {
    "tola-where": {
      // A Kolara-specific wording of the sentence Vann's own map carries,
      // not Vann's exact words — see the note on columnCopy above for why
      // chapter 01 could not use this line, and why the map is where it
      // belongs.
      heading: { text: "Five kilometres from Kolara Gate", dim: "Kolara" },
      art: "tola",
      // x/y are fractions of the artwork's own 660×484 box (mapRight=660 in
      // scripts/build_map.mjs; height is the untouched source height), read
      // off reference/wp-media/property-pages/Mahua-website_Tola-tadoba-map2.jpg
      // in source pixels (px, py) and converted x = px/660, y = py/484.
      // Verified by eye against 5×-upscaled, gridded crops of the source,
      // not against memory — see the task report for the crop coordinates
      // used.
      //
      // Every named place on this artwork — Nimdela through Mamala below —
      // shares one icon (a two-panel brown glyph), and the artwork's own
      // legend names that icon "National park entry gate", not "village".
      // Unlike Vann's map, which draws two visibly different marks (a solid
      // square for its three named Gates, a plain dot for its eight
      // villages), Tola's artwork draws no separate village mark at all —
      // so every icon-bearing name below is transcribed as `kind: "gate"`,
      // matching what the artwork itself prints, rather than split by guess
      // into "real" gates and villages that merely share a glyph. Tadoba's
      // buffer zone genuinely does run this many named entry points (Moharli
      // and Kolara are Tadoba's two core-zone gates; the rest — Navegaon,
      // Khutwanda, Zari, Pangadi, Junona, Devada, Madnapur among them — are
      // its buffer-zone gates), which is consistent with, not contradicted
      // by, reading the legend literally.
      //
      // "Agarzari" is the one exception: it is the only named place on the
      // artwork with NO icon beside it at all (checked directly against the
      // source — the two icons just above it both belong to "Devada
      // Adegaon"). A bare name with no icon is exactly what a village dot
      // means on Vann's map, so it is transcribed as `kind: "village"` here
      // — the one place this page's map actually uses the swatch this
      // task's authorised extra work added, rather than adding an unused
      // legend line.
      labels: [
        // The gates (all sharing the artwork's one settlement icon — see
        // above). North-west cluster first, then clockwise.
        { text: "Nimdela", x: 0.3227, y: 0.1322, kind: "gate" },
        { text: "Ramdegi", x: 0.3788, y: 0.1198, kind: "gate" },
        { text: "Alizanza", x: 0.4197, y: 0.157, kind: "gate" },
        { text: "Navegaon", x: 0.3697, y: 0.1756, kind: "gate" },
        { text: "Kolara", x: 0.4591, y: 0.2025, kind: "gate" },
        { text: "Madnapur", x: 0.5197, y: 0.2893, kind: "gate" },
        { text: "Shirkheda", x: 0.6258, y: 0.3678, kind: "gate" },
        { text: "Khutwanda", x: 0.4212, y: 0.4318, kind: "gate" },
        { text: "Moharli", x: 0.4712, y: 0.595, kind: "gate" },
        { text: "Junona", x: 0.4712, y: 0.655, kind: "gate" },
        // One label for both icons — the artwork sets "Devada" and
        // "Adegaon" as one combined name over a pair of adjacent icons.
        // "Adegaon" itself is the spelling the property's own postal
        // address uses (TOLA_CONTACT.address, below), which cross-confirms
        // it against a source outside this map.
        { text: "Devada Adegaon", x: 0.4364, y: 0.7025, kind: "gate" },
        { text: "Pangadi", x: 0.703, y: 0.6157, kind: "gate" },
        { text: "Aswal Chuha", x: 0.7121, y: 0.6612, kind: "gate" },
        { text: "Zari", x: 0.6682, y: 0.7707, kind: "gate" },
        { text: "Mamala", x: 0.6667, y: 0.8636, kind: "gate" },
        // The one village dot the artwork actually draws — see the long
        // note above.
        { text: "Agarzari", x: 0.3712, y: 0.7273, kind: "village" },
        // Water: the four named lakes and the dam backwaters.
        { text: "Pandharpauni Lake", x: 0.4106, y: 0.2789, kind: "water" },
        { text: "Tadoba Lake", x: 0.4061, y: 0.3285, kind: "water" },
        { text: "Jamni Lake", x: 0.453, y: 0.3202, kind: "water" },
        { text: "Teliya Lake", x: 0.4894, y: 0.5455, kind: "water" },
        { text: "Irai Dam Backwaters", x: 0.3333, y: 0.5992, kind: "water" },
        // The four numbered safari zones.
        { text: "Zone 1", x: 0.3652, y: 0.5372, kind: "zone" },
        { text: "Zone 2", x: 0.2879, y: 0.2004, kind: "zone" },
        { text: "Zone 3", x: 0.5197, y: 0.1157, kind: "zone" },
        { text: "Zone 4", x: 0.7303, y: 0.7273, kind: "zone" },
        // The road's own destination labels, transcribed verbatim —
        // "Chimur" and "Chandrapur" mark actual junctions (each has its own
        // dot on the artwork); "To Umred" and "Nagpur to Gadchiroli" are
        // bare directional signage.
        { text: "Chimur", x: 0.3909, y: 0.0455, kind: "road" },
        { text: "To Umred", x: 0.5076, y: 0.0413, kind: "road" },
        { text: "To Nagpur", x: 0.1773, y: 0.5372, kind: "road" },
        { text: "Nagpur to Gadchiroli", x: 0.8409, y: 0.3616, kind: "road" },
        { text: "Chandrapur", x: 0.303, y: 0.9628, kind: "road" },
      ],
      lodge: { text: "Mahua Tola", x: 0.5742, y: 0.1653 },
      legend: [
        { swatch: "core", text: "Core area" },
        { swatch: "park", text: "Buffer zone" },
        { swatch: "water", text: "Water" },
        { swatch: "road", text: "Main road" },
        // The artwork's own legend text for this icon — "National park
        // entry gate", not Vann's shorter "Park entry gate" — kept verbatim
        // rather than matched to Vann's file, per the brief's own
        // instruction to transcribe spelling off the artwork rather than
        // from memory or from the sibling page.
        { swatch: "gate", text: "National park entry gate" },
        // This task's authorised extra work: see the long comment on
        // labels above for the one point on this map it actually describes.
        { swatch: "village", text: "Village" },
      ],
      // The artwork also prints a "Zone number" legend line for the mustard
      // badges above, but MapLegendEntryCopy's swatch union has no member
      // for it (only the five — now six — fixed swatches PropertyMap can
      // draw a dot for), so it is left off the key rather than added under
      // a swatch that would draw the wrong colour. The zone badges are
      // still transcribed on the map itself (kind: "zone"); only the legend
      // line describing them is missing, the same gap Vann's own map has
      // for its triangle-icon forest rest houses.
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Chimur" },
        { label: "By road", value: "Chimur, 17 km" },
        { label: "From the gate", value: "Five kilometres from Kolara Gate" },
      ],
    } satisfies PropertyMapCopy,
  },

  /**
   * `tola-guest-word` — Vedant, 2019, Tripadvisor, byte-identical to
   * `content/home.ts`'s own copy of it
   * (`content/mahua-tola.test.ts`'s "reuses its guest quote byte-identical
   * to the attributed original" carries this forward from the pre-redesign
   * file). `FullBleedQuoteCopy` carries only `quote` — there is nowhere on a
   * full-bleed photograph to set a name, source and year in the display
   * serif the home page uses for pull-quotes — so this page's attribution
   * lives one level up, in `content/home.ts`'s `guests.quotes`, which
   * `content/home.test.ts`'s "attributes every guest quote" test already
   * holds to a name, a source and a year.
   */
  quoteCopy: {
    "tola-guest-word": {
      quote: "One of the best forests for seeing tigers and one of the best resorts to stay in Tadoba.",
    } satisfies FullBleedQuoteCopy,

    /**
     * `tola-table` ("04 · The Table"). Condensed from the live site's own
     * dining copy (reference/site-copy.md: "Our kitchen serves a delightful
     * mix of Maharashtrian specialties and global favorites, crafted using
     * fresh, locally sourced ingredients. Enjoy a meal while listening to
     * the sounds of the jungle, or opt for a candlelit dinner by the
     * river."), with British spelling corrected on the way in —
     * "specialities", not the live site's American "specialties", which
     * CLAUDE.md flags as a defect that has already shipped once on this
     * branch. "Wicker lamps" is not invented: it is `tola-dining`'s own
     * caption in the pre-redesign file ("tables laid under wicker pendant
     * lamps"), carried into the line the photograph now sits under. No dish
     * is named — unlike Vann's own quote ("Chulai ki Bhaaji, Mahua
     * Kheer…"), no specific Tola dish traces to a source
     * (docs/copy-provenance.md), so none is invented here (non-negotiable
     * #6 / the brief's own warning against a repeat of Task 12's "seats
     * forty").
     */
    "tola-table": {
      quote: "Maharashtrian specialities and whatever the day brings fresh, under wicker lamps — or candlelit by the water.",
    } satisfies FullBleedQuoteCopy,
  },

  showcaseCopy: {
    "tola-rooms": {
      heading: { text: "Twelve rooms, five shapes", dim: "shapes" },
      // "Five shapes" names all five the live site's own structured list
      // offers (Deluxe, Suite, Super Deluxe Cottage, Family Suite, Camping
      // Hut) even though only four are shown below — see the note on the
      // Suite entry's `note` field for why.
      intro:
        "Deluxe rooms, suites, a family suite and a camping hut, each with its own forest view — " +
        "and three Super Deluxe Cottages besides, similarly styled to the suites.",
      rooms: [
        {
          mediaId: "tola-room-deluxe",
          name: "Deluxe",
          line: "Twin beds and a trunk at the foot of them, with the forest at the window.",
          facts: ["220 sq ft", "Twin beds", "Forest view"],
          // 1163×508 (2.29:1) is close enough to wide's 21:9 (2.33:1) that
          // either scale loses almost nothing; the alt text names no
          // specific feature at risk in a narrower crop, so — same
          // reasoning as Vann's own Deluxe room — this is the gentler-loss
          // pick (offsetLeft's 3:2 crops ~35% of the width; offsetRight's
          // 4:3 crops ~42%), not a hard constraint. Chosen over `wide`
          // deliberately, so the three landscape rooms below don't all
          // render as three consecutive full-width rows.
          scale: "offsetLeft",
        },
        {
          mediaId: "tola-room-suite",
          name: "Suite",
          line: "A king bed under bamboo, seen through the glass doors that open onto it.",
          facts: ["270 sq ft", "Queen bed", "Forest view"],
          // Hard constraint, checked against the photograph directly: the
          // room's own French doors onto a bamboo grove — the "forest view"
          // the alt text and facts both name — sit at the RIGHT edge of a
          // 1163×508 frame. offsetRight (4:3) or offsetLeft (3:2) crop
          // ~35-42% of the width from both sides equally and would cut into
          // exactly that feature; wide (21:9) loses under 2%.
          scale: "wide",
        },
        {
          mediaId: "tola-room-family",
          name: "Family Suite",
          line: "Two interconnected rooms under a terracotta-beamed roof, a Gond painting over the bed.",
          facts: ["450 sq ft, two interconnected rooms", "Queen and king bed", "Forest view"],
          // The one portrait photograph among the four (1440×2160, 2:3) —
          // every scale this component offers is a landscape box, so some
          // height is always lost. offsetRight (4:3) keeps the most of any
          // of them (50% of the height, centred, vs. 55.6% for offsetLeft
          // and 71.4% for wide — arithmetic checked against the actual
          // photograph, not assumed from the ratios alone). At that crop
          // the bed and the Gond painting both stay in frame; the
          // terracotta ceiling beams the alt text also names do not — no
          // landscape box this component offers can keep both a feature at
          // the top of a 2:3 portrait and one two-thirds of the way down it
          // at once.
          scale: "offsetRight",
        },
        {
          mediaId: "tola-room-camping",
          name: "Camping Hut",
          line: "Four beds under one roof, built for a family or a group travelling together.",
          facts: ["500 sq ft", "Four cemented single beds", "Forest view"],
          // The room's whole point — four beds in a row — is what a
          // narrower crop would cut into first. Same reasoning as the
          // Suite: wide (21:9) is a hard constraint here, not a preference,
          // because offsetRight/offsetLeft would plausibly crop a bed
          // entirely off one end of a room whose fact line is specifically
          // "four".
          scale: "wide",
        },
      ],
      // Super Deluxe Cottage is not its own row: the live site's media has
      // no interior photograph of it anywhere (its own rooms tab shows the
      // lodge exterior, same gap the pre-redesign file already found), and
      // this component's contract — one row per photograph, `rooms.map(id)`
      // matching the chapter's own `media` array exactly — has no way to
      // give it a row that shares the Suite's photograph without either
      // repeating a media id within one chapter (which
      // content/mahua-tola.test.ts's "never shows the same photograph
      // twice" forbids) or breaking that join. It is named instead in the
      // intro above, honestly, as sharing the Suite's styling.
    } satisfies RoomShowcaseCopy,
  },

  pairCopy: {
    "tola-day": {
      heading: { text: "The day at Tola", dim: "day" },
      intro:
        "Tiger safaris at dawn and dusk, an afternoon along the Hattinala, a bonfire once the light " +
        "goes, and a pool to come back to between drives.",
      experiences: [
        {
          mediaId: "tola-tiger-safari",
          name: "Tiger Safari",
          line: "Dawn and dusk drives through one of the country's most tiger-dense forests, with trackers who know this reserve's cats by name.",
          weight: "hero",
        },
        {
          mediaId: "tola-river-walk",
          name: "River Walk",
          line: "A walk along the Hattinala, with nothing scheduled on it but flowing water and birdsong.",
          weight: "quiet",
        },
        {
          mediaId: "tola-bonfire",
          name: "Bonfire",
          line: "A fire lit once the evening drive comes in, and conversation that runs late under the stars.",
          weight: "quiet",
        },
        {
          mediaId: "tola-candlelit-dinner",
          name: "Candle Light Dinner",
          line: "A table laid by candlelight, the forest's own sounds for company and whatever the kitchen is cooking that night.",
          weight: "hero",
        },
        {
          mediaId: "tola-swimming",
          name: "Swimming",
          line: "A pool tucked into the greenery, for the hours between drives.",
          weight: "quiet",
        },
        {
          // NOT captioned "Village Walk & Bamboo Crafts Market" — that is
          // one of the six experiences the brief named, but tola-experiences
          // (looked at directly: reference is
          // public/media/tola-experiences-1163.jpg) shows rope hammocks
          // slung between trees on a garden path, not a village or a
          // market. Forcing that caption onto this photograph would repeat
          // the exact defect Task 12's review caught on this branch —
          // captioning a photograph as something it does not show ("do not
          // caption the pool as a forest path"). The Village Walk & Bamboo
          // Crafts Market content is real and is not dropped: it is in
          // TOLA_COPY.columnCopy["tola-reserve"]'s second paragraph, in
          // prose, where no photograph is required. This slot is captioned
          // for what the photograph actually is instead.
          mediaId: "tola-experiences",
          name: "Time in the Bamboo",
          line: "Rope hammocks slung between the trees, for whoever wants the afternoon to do nothing in particular.",
          weight: "quiet",
        },
      ],
      alsoLine:
        // Wildlife documentaries and indoor/outdoor games — the live site's
        // own two remaining experience sections, named honestly in one
        // quiet line rather than promoted to their own photograph or
        // deleted, same treatment Vann's alsoLine gives its own leftovers.
        // No capacity or count invented for either — see Task 12's "seats
        // forty" finding, which traced to nothing.
        "Also: an evening with the in-house naturalist or a wildlife documentary, and carrom, " +
        "table tennis and other indoor and outdoor games.",
    } satisfies ExperiencePairCopy,
  },

  invitationCopy: {
    "tola-invitation": {
      heading: { text: "Stay at Mahua Tola", dim: "Tola" },
      line: "The forest is five kilometres from Kolara Gate, and it is ready for you. Write to us, or call — we will do the rest.",
      bookLabel: "Book Mahua Tola",
      contact: TOLA_CONTACT,
      sibling: {
        mediaId: "vann-hero",
        label: "Looking for Pench instead? Mahua Vann →",
      },
    } satisfies PropertyInvitationCopy,
  },
};

export const TOLA_NAV = {
  menu: "Menu",
  menuTitle: "The chapters",
  menuClose: "Close",
  menuHint: "Jump to a chapter",
};

export const TOLA_BAR = {
  name: "Mahua Tola · Tadoba",
  bookLabel: "Book",
};
