import type { OpeningColumnCopy } from "@/components/sections/OpeningColumn";
import type { PropertyMapCopy } from "@/components/sections/PropertyMap";
import type { RoomShowcaseCopy } from "@/components/sections/RoomShowcase.types";
import type { ExperiencePairCopy } from "@/components/sections/ExperiencePair";
import type { HeroCopy } from "@/components/sections/Hero";
import type { PropertyPageCopy } from "@/components/property/PropertyPage";
import type { PropertyInvitationCopy } from "@/components/property/PropertyInvitation";
import type { PropertyContactCopy } from "@/components/property/PropertyContact";
import type { PropertyChapter } from "./property-chapters";

/**
 * Mahua Tola's spine, in the redesign's shape vocabulary. **Six moments as of
 * 26 August 2026** (was eight — two `fullBleed` bands, `tola-guest-word` and
 * `tola-table`, both removed the same day on the client's own ruling; see
 * their removal comments below): hero → column → map → showcase → pair →
 * invitation.
 *
 * This page no longer diverges from Vann's own shape sequence the way it did
 * before 26 Aug — both of the extra `fullBleed` moments that used to set it
 * apart (the guest's word, the table) are gone, and `tola-press` (Task 8 of
 * this same restructure) is what will make the two pages' spines match
 * exactly, hero through invitation.
 *
 * No two adjacent moments share a shape (`findRepeatedShape`,
 * `content/mahua-tola.test.ts`). `column` is this page's one quiet shape
 * (there is no `press` band yet to be a second one), and it sits between two
 * image-led moments (`tola-hero`, `tola-where`) — CLAUDE.md's older rhythm
 * rule (non-negotiable #10) holds even though only one quiet screen exists to
 * check it against.
 *
 * Numbered chapters are 01–03 (`tola-reserve` through `tola-day`) — `tola-where`
 * (the map) carries no number, same reasoning as Vann's own map, below.
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
  /*
   * **No `number` and no `label` since 26 August 2026.** Client: *"the map is an
   * extention to the first sections on both the pages 01-The Forest and 01-The
   * Reserve respectively."*
   *
   * "Extension of" has a defined meaning on this site — the client's own 19 Aug
   * ruling on `04 · Mahua Philosophy` — and it is two things, not one: the same
   * cream, and no band of cream between. Dropping the heading is this half;
   * `PropertyPage.tsx`'s `continues` is the other. Both are needed or the map
   * reads as an unlabelled orphan rather than as part of 01.
   */
  {
    id: "tola-where",
    shape: "map",
    media: [],
  },
  /*
   * **`tola-guest-word` (the guest's word, a bare `fullBleed` quote) was here
   * until 26 August 2026.** Client: *"Remove the section that comes just above
   * 05-The Day that has a wide image and text in the center"*, naming its
   * copy — "One of the best forests for seeing tigers…".
   *
   * `tola-guest-word` (the photograph, same id as the chapter it backed) is
   * released and is now curated-but-unused. **It is not to be parked in
   * another chapter to keep a density figure up** — `measure_density.mjs`
   * scores what is painted, and a chapter that needs imagery needs a
   * composition. See `docs/DECISIONS.md` §22.
   */
  {
    id: "tola-rooms",
    number: "02",
    label: "The Rooms",
    shape: "showcase",
    media: ["tola-room-deluxe", "tola-room-suite", "tola-room-super-deluxe", "tola-room-family"],
  },
  /*
   * **`tola-table` ("04 · The Table") was here until 26 August 2026.** Client:
   * *"Remove the section that comes just above 05-The Day that has a wide image
   * and text in the center"*, naming its copy — "Maharashtrian specialities and
   * whatever the day brings fresh…".
   *
   * `tola-dining` is released and is now curated-but-unused. **It is not to be
   * parked in another chapter to keep a density figure up** —
   * `measure_density.mjs` scores what is painted, and a chapter that needs
   * imagery needs a composition. See `docs/DECISIONS.md` §22.
   */
  {
    // Six experiences, matching Vann's own tola-day/vann-day rhythm of two
    // "hero" (full-row) entries with an even run of "quiet" ones before each
    // — see the long comment on TOLA_COPY.pairCopy below for why the sixth
    // is not "Village Walk & Bamboo Crafts Market" despite that being one of
    // the six the brief named.
    id: "tola-day",
    number: "03",
    label: "The Experience",
    shape: "pair",
    media: [
      "tola-tiger-safari",
      "tola-river-walk",
      // `bonfire-circle-night`, not `tola-bonfire`. The live site's own
      // bonfire photograph shows a guest's face clearly enough to identify
      // her, and the client asked for it off the page on consent grounds
      // (10 Aug 2026) — the same rule the original curation already applied
      // to another frame (see `scripts/build_images.mjs`'s CURATION note).
      // This frame is from the client's own Mahua Tola property video
      // (docs/PROJECT-STATE.md), so it is honestly this lodge's own bonfire
      // and not a stand-in from Pench, and it carries no people at all.
      "bonfire-circle-night",
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
 * the other cross-page fact this page still carries (the invitation's
 * sibling photograph) is bound to its source by a test that fails if the
 * two ever diverge, not by a shared import, and this follows the same
 * pattern. (The guest quote used to be a second example here; it was one
 * of the two `quoteCopy` entries deleted on 26 Aug 2026 — see that
 * removal comment below.)
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
 * **Room count: ELEVEN. Settled 12 Aug 2026, and every source now reconciles.**
 * The client's own booking engine sells 5 Deluxe + 2 Suite + 3 Super Deluxe
 * Cottage + 1 Family Suite — identical across five date ranges spanning nine
 * months, including peak — and the client confirmed the same day that the
 * Camping Hut is retired.
 *
 * That resolves a question this file has carried since the copy-provenance
 * work, where it was recorded as "twelve, not fourteen" and flagged unresolved:
 *
 *   - The live site's **twelve** was eleven plus the Camping Hut. Right when
 *     written; wrong now.
 *   - The brand record's **fourteen** is eleven plus the three river-facing
 *     machaan rooms still under construction. A future number, and the home
 *     page was quoting it in the present tense until this date.
 *
 * So: eleven today, fourteen when the machaan rooms open, and the twelfth has
 * been retired. Neither source was lying; neither had both halves. **Still
 * worth the client's confirmation** — a booking engine reports what is
 * *sellable*, which need not equal what is built.
 * (docs/copy-provenance.md, docs/superpowers/specs/2026-08-08-property-pages-design.md §8.)
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
        // First sentence rewritten in the whole-branch review's fix wave (10
        // Aug 2026): it shared the clause "close enough to [Gate] to be
        // among the first vehicles through it" verbatim with Mahua Vann's
        // own opening paragraph, bar the gate name. Same fact (five
        // kilometres, Kolara Gate — see mapCopy and gettingThere below), put
        // differently, and leading with what actually distinguishes this
        // reserve rather than a sentence shape Vann's file already used.
        "Mahua Tola sits at the edge of the Tadoba-Andhari Tiger Reserve, a five-kilometre run from " +
          "Kolara Gate that puts its jeeps at the front of the queue when the barrier lifts. Tadoba " +
          "carries one of the highest tiger densities anywhere in the country, and the drives here " +
          "are guided by trackers who know this forest's cats by name.",
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
        // Kolara and Moharli lead the gate list — reordered in the
        // whole-branch review's fix wave (10 Aug 2026) for
        // `declutterMobile` in components/sections/PropertyMap.tsx, which
        // keeps whichever of two colliding gate labels it reaches first
        // and drops the rest. Kolara is the one gate this very page names
        // elsewhere (the map's own heading, and gettingThere below) and
        // Moharli is Tadoba's other core-zone gate (the fourteen gates
        // after these two are all buffer-zone entry points, sharing the
        // artwork's one settlement icon with no way to tell them apart on
        // the drawing itself) — between them the two gates an actual guest
        // is most likely to use, so they are the two that must survive a
        // phone screen too small to show all sixteen.
        { text: "Kolara", x: 0.4591, y: 0.2025, kind: "gate" },
        { text: "Moharli", x: 0.4712, y: 0.595, kind: "gate" },
        // The rest, north-west cluster first, then clockwise.
        { text: "Nimdela", x: 0.3227, y: 0.1322, kind: "gate" },
        { text: "Ramdegi", x: 0.3788, y: 0.1198, kind: "gate" },
        { text: "Alizanza", x: 0.4197, y: 0.157, kind: "gate" },
        { text: "Navegaon", x: 0.3697, y: 0.1756, kind: "gate" },
        { text: "Madnapur", x: 0.5197, y: 0.2893, kind: "gate" },
        { text: "Shirkheda", x: 0.6258, y: 0.3678, kind: "gate" },
        { text: "Khutwanda", x: 0.4212, y: 0.4318, kind: "gate" },
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
        // Water: the four named lakes and the dam backwaters. Tadoba Lake
        // leads — the reserve's own namesake, and (same reordering, same
        // reason as the gates above) the one of the three tightly
        // clustered lake names here that `declutterMobile` should keep
        // when a phone screen cannot show Pandharpauni, Tadoba and Jamni
        // separately.
        { text: "Tadoba Lake", x: 0.4061, y: 0.3285, kind: "water" },
        { text: "Pandharpauni Lake", x: 0.4106, y: 0.2789, kind: "water" },
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
        // The artwork's own legend text for the mustard badges is "Zone
        // number" — added here (whole-branch review fix wave, 10 Aug 2026)
        // now that MapLegendEntryCopy's swatch union has a "zone" member.
        // Until then the four numbered safari zones were drawn on the map
        // (kind: "zone") with nothing in the key naming them — the same gap
        // "village" once had, above, and the same fix.
        { swatch: "zone", text: "Safari zone" },
      ],
      gettingThere: [
        { label: "By air or train", value: "Nagpur, then by road to Chimur" },
        { label: "By road", value: "Chimur, 17 km" },
        { label: "From the gate", value: "Five kilometres from Kolara Gate" },
      ],
    } satisfies PropertyMapCopy,
  },

  /*
   * **`quoteCopy` was here until 26 August 2026** — two entries,
   * `"tola-guest-word"` (Vedant, 2019, Tripadvisor: "One of the best forests
   * for seeing tigers and one of the best resorts to stay in Tadoba.") and
   * `"tola-table"` ("Maharashtrian specialities and whatever the day brings
   * fresh, under wicker lamps — or candlelit by the water."). Deleted whole
   * with the two chapters they belonged to; see the removal comments on
   * `TOLA_CHAPTERS` above for the client's own words and what happened to
   * each photograph.
   *
   * Vedant's attribution is not carried anywhere else in this codebase any
   * more — `content/home.ts`'s own copy of it (`guests`/`invitation.quotes`)
   * was already deleted in Task 2 of this same restructure, when the
   * client's Elfsight widget replaced the curated quote set outright (see
   * that file's own removal comment). This deletion is the second and last
   * place the words lived; nothing here is invented to replace it.
   */

  showcaseCopy: {
    "tola-rooms": {
      /*
       * **Eleven, not twelve, since 12 Aug 2026 — and the number is now
       * evidenced rather than inherited.** The client's own booking engine
       * offers exactly Deluxe 5, Suite 2, Super Deluxe Cottages 3, Family Suite
       * 1 — identical across five date ranges spanning nine months, including
       * peak. The retired Camping Hut is the twelfth the old heading counted.
       *
       * This also settles the "12 or 14?" that sat open in `docs/DECISIONS.md`
       * §5 from the copy provenance work: the live site's twelve was right and
       * the brand record's fourteen is wrong, and neither source knew why.
       * Confirm the figure with the client before treating it as final — an
       * engine reports what is *sellable*, which need not equal what is built.
       */
      heading: { text: "Eleven rooms, four shapes", dim: "shapes" },
      intro:
        "Deluxe rooms, suites, super deluxe cottages and one family suite — four shapes, each with " +
        "its own view into the forest.",
      rooms: [
        {
          mediaId: "tola-room-deluxe",
          name: "Deluxe",
          line: "Twin beds and a trunk at the foot of them, with the forest at the window.",
          facts: ["220 sq ft", "Twin beds", "Forest view"],
        },
        {
          mediaId: "tola-room-suite",
          name: "Suite",
          line: "A king bed under bamboo, seen through the glass doors that open onto it.",
          facts: ["270 sq ft", "Queen bed", "Forest view"],
        },
        {
          /*
           * Added 12 Aug 2026, in the retired Camping Hut's place, and ordered
           * by tariff like the three around it (11,440 / 12,650 / 14,300 /
           * 16,500 a night at the breakfast rate).
           *
           * This row was impossible until the client supplied a photograph the
           * same day: the previous note here recorded that no interior shot of
           * a Super Deluxe Cottage existed anywhere in the live site's media,
           * so the room could only be named in the intro. It is three real
           * rooms, on sale every date sampled across nine months, and it had no
           * picture while a retired hut had one.
           *
           * **No square footage, deliberately.** The other three rows carry one
           * and this does not, which looks like an omission and is a refusal:
           * nobody has told us the figure and the booking engine does not
           * publish it. Inventing a plausible number to complete the pattern is
           * exactly how a made-up capacity nearly shipped as a claim about this
           * client's property once already. Ask, then add it.
           */
          mediaId: "tola-room-super-deluxe",
          name: "Super Deluxe Cottage",
          // Re-read 13 Aug 2026 against the SHIPPED frame, which changed under
          // this line twice now. It was written for the original 3:2 ("under
          // timber beams"); the 2.29 stacked crop then cut the ceiling off, so
          // the line was rewritten to "a stone headboard" — true of that crop,
          // false of the source. The beside composition ships the uncropped
          // 1500x1000 today, which restores the ceiling: the timber beams are
          // back in frame, alongside the stone headboard, not instead of it —
          // both are named now rather than the line trading one for the other.
          line: "A king bed against a stone headboard, under a timber-beamed ceiling, with a sitting area by the window and the bamboo close outside it.",
          facts: ["King bed, sitting area", "Up to three adults", "Forest view"],
        },
        {
          mediaId: "tola-room-family",
          name: "Family Suite",
          line: "Two interconnected rooms under a terracotta-beamed roof, a Gond painting over the bed.",
          facts: ["450 sq ft, two interconnected rooms", "Queen and king bed", "Forest view"],
        },
      ],
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
          mediaId: "bonfire-circle-night",
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
      // Rewritten in the whole-branch review's fix wave (10 Aug 2026): this
      // line was byte-identical to Mahua Vann's own, bar the gate name — the
      // sharpest evidence the client's "very wordpress and templaty" verdict
      // had, on the last sentence a visitor reads on either page. Tadoba's
      // tiger density is this page's own texture (already established in
      // columnCopy above), not Vann's, and belongs in its close too.
      line: "Kolara Gate is five kilometres away, close enough that the tigers of Tadoba are almost part of the address. Write to us, or call, and we will take it from there.",
      bookLabel: "Book Mahua Tola",
      contact: TOLA_CONTACT,
      sibling: {
        mediaId: "vann-hero",
        label: "Looking for Pench instead? Mahua Vann →",
      },
    } satisfies PropertyInvitationCopy,
  },
};

export const TOLA_BAR = {
  name: "Mahua Tola · Tadoba",
  bookLabel: "Book",
};
