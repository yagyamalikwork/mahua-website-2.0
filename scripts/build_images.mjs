// Build-time image pipeline for Mahua Resorts.
//
// Reads the curation list below (id -> source path -> hand-written alt text),
// re-encodes each source into AVIF and WebP at up to three widths, a single
// JPEG fallback, and a tiny inline base64 blur placeholder, then writes
// `lib/media-manifest.ts` (TypeScript, `as const`) describing the result.
//
// Run: node scripts/build_images.mjs

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "media");
const MANIFEST_PATH = path.join(ROOT, "lib", "media-manifest.ts");

/**
 * The curated set. Task 1 selected 14 from reference/mockup-media only.
 * Task 3 roughly triples that: the client's first complaint about the
 * rejected build was "it got so less images," and re-reviewed the live
 * site's own reference/wp-media pool, previously dismissed as weaker —
 * at inset and grid sizes many of those shots hold up fine, and the client
 * explicitly asked for them to be used.
 *
 * Every candidate in both folders was opened and looked at by eye before
 * being added or rejected — see task-3-report.md for the full table,
 * the rejected list (duplicates re-exported from the brand-guidelines PDF
 * at a different crop, the two Murud/Bagh coastal shots, one image showing
 * a recognisable guest's face on consent grounds, and a handful of
 * near-identical "path through bamboo to a cottage" repeats), and the
 * per-category counts.
 *
 * `category` is the brand guidelines' own photography taxonomy (lanternHour
 * / forest / lodgeLife / details). `orientation` and `fullBleedSafe` feed
 * the Task 7 layouts directly — fullBleedSafe is only ever true when the
 * largest derivative this script actually emits is >= 1400px wide (CLAUDE.md
 * non-negotiable #10); never set it true for a narrower source.
 *
 * Alt text is written by hand, in British English, describing what is
 * actually in the frame — not filler.
 */
const CURATION = [
  // ---- lanternHour: dusk and after — flame, filament and firelight ----
  {
    id: "lantern-bridge-dusk",
    src: "reference/mockup-media/lantern-lit-wooden-bridge-at-mahua-vann-at-dusk-b3e98363b8.jpg",
    alt: "A lantern-lit wooden bridge leading into Mahua Vann's forest canopy at dusk.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "bonfire-dinner",
    src: "reference/mockup-media/bonfire-dinner-under-lantern-lit-trees-111c897880.jpg",
    alt: "A bonfire dinner laid beneath lantern-lit trees under a starlit sky.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Was "veranda-dusk". Merged 4 Aug 2026 with the near-identical
    // "veranda-through-leaves" (mahua-brand-guidelines-v1-forest-15), which was
    // the same photograph at 700px against this one's 960px. The surviving
    // entry keeps the larger source and the more accurate of the two captions —
    // the veranda really is glimpsed through foreground leaves.
    id: "veranda-through-leaves",
    src: "reference/mockup-media/lantern-lit-veranda-walkway-at-dusk-24dbe6defa.jpg",
    alt: "A lantern-lit veranda glimpsed through leaves at dusk, a rattan lampshade glowing above the tables.",
    category: "lanternHour",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "mahua-tola-pool",
    src: "reference/mockup-media/the-pool-at-mahua-tola-lit-by-lanterns-at-dusk-e564617ce9.jpg",
    alt: "The pool at Mahua Tola lit by lanterns against a fading dusk sky.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // "lantern-boardwalk-map" (mockup-media, mahua-brand-guidelines-v1-forest-14)
  // was removed 4 Aug 2026: perceptual hashing showed it is *pixel-identical*
  // to "lantern-bridge-dusk" above, which the mockup pack had also exported
  // under a descriptive name. Its alt text described a hand-painted forest map
  // that is not in the frame. See the duplicate guard in lib/media.test.ts.
  {
    id: "reception-path-dusk",
    src: "reference/wp-media/DSC00063-scaled.jpg",
    alt: "The path to a lantern-lit reception veranda at dusk, banana leaves catching the last light.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "birding-cairn-dusk",
    src: "reference/wp-media/DSC09540-scaled.jpg",
    alt: "A cairn of hand-painted bird names beside the path to a lantern-lit veranda at dusk.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "lodge-facade-night",
    src: "reference/wp-media/TWD5223-scaled.jpg",
    alt: "A two-storey lodge building lit against the night sky, framed by bamboo.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // The 700px duplicate of "veranda-through-leaves" lived here until 4 Aug 2026.
  {
    id: "petal-table-night",
    src: "reference/video-stills/petal-table-night.png",
    alt: "A candlelit table strewn with bougainvillea petals on the night lawn, the lit veranda beyond.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "bonfire-circle-night",
    src: "reference/video-stills/bonfire-circle-night.png",
    alt: "A bonfire burning inside a ring of bamboo benches, the forest dark beyond the firelight.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },

  // ---- forest: wildlife from the lodges' own drives at Pench and Tadoba ----
  {
    id: "tiger-golden-grass",
    src: "reference/mockup-media/a-bengal-tiger-moving-through-tall-golden-grass-b07148cf9b.jpg",
    alt: "A Bengal tiger moving through tall golden grass in the Pench forest.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // Was "tiger-yawning", from a source file named "tiger-yawning-in-the-
    // undergrowth". The photograph is nothing of the kind — it is a close side
    // profile, mouth shut, with a second cat's flank behind it. Merged 4 Aug
    // 2026 with the pixel-identical 700px "tiger-pair-profile"
    // (mahua-brand-guidelines-v1-forest-17); this 900px source survives under
    // that entry's accurate caption. Both were in the same plate grid, so the
    // Forest chapter would have shown one photograph twice, side by side.
    id: "tiger-pair-profile",
    src: "reference/mockup-media/tiger-yawning-in-the-undergrowth-07140d7db1.jpg",
    alt: "A tiger in close profile, a second cat's flank passing just behind it.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "leopard-on-rock",
    src: "reference/mockup-media/leopard-resting-on-a-rock-among-trees-7693cb2ddb.jpg",
    alt: "A leopard resting on a rock, framed by slender trees in dense forest.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "melanistic-leopard",
    src: "reference/mockup-media/melanistic-leopard-in-a-tree-4653568499.jpg",
    alt: "A melanistic leopard perched watchfully in the fork of a tree.",
    category: "forest",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  // Two more removed 4 Aug 2026, both re-exports from the v1 guidelines pack:
  // "tiger-approaching-grass" (forest-01) is the same walk-through-grass frame
  // as "tiger-golden-grass" at two-thirds the width, and "tiger-pair-profile"
  // (forest-17) is the 700px twin of the entry above.
  {
    id: "forest-boardwalk-daylight",
    src: "reference/wp-media/RAG1474-scaled.jpg",
    alt: "A timber boardwalk threading through forest, tangled vines framing the foreground.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "forest-trail-canopy",
    src: "reference/wp-media/DSC00170-scaled.jpg",
    alt: "A sunlit trail tunnelling beneath an arch of forest canopy.",
    category: "forest",
    orientation: "landscape",
    // Dense foliage compresses badly: at 1440 its WebP lands at 203 KB even at
    // the quality floor. Capped at 960 and dropped from full-bleed rather than
    // shipped over budget or visibly soft.
    maxWidth: 960,
    fullBleedSafe: false,
  },
  {
    id: "tiger-crossing-track",
    src: "reference/wp-media/Mahua-Website-Images_Homepage_Pench.jpg",
    alt: "A tiger crossing the track ahead of a safari jeep and its watching guests.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },

  // ---- lodgeLife: people mid-moment, candid, unposed ----
  {
    id: "mahua-vann-room",
    src: "reference/mockup-media/mud-walled-room-with-tiled-roof-and-forest-view-at-mahu-2e5022462f.jpg",
    alt: "A mud-walled room at Mahua Vann with a tiled roof and forest views through open windows.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "mahua-tola-suite",
    src: "reference/mockup-media/family-suite-with-terracotta-roof-and-jungle-textiles-a-19a0ef4a39.jpg",
    alt: "A family suite at Mahua Tola with a terracotta roof and jungle-print textiles.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "guide-sunrise",
    src: "reference/mockup-media/a-guide-scanning-the-canopy-with-binoculars-at-sunrise-400151ad6e.jpg",
    alt: "A guide scanning the forest canopy with binoculars in the early sunrise light.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  // "bush-breakfast" (mockup-media, guests-birdwatching-over-bush-breakfast-...jpg)
  // was removed on a guest-consent basis: a guest's face is fully lit, in
  // focus, and recognisable. That is a consent question, not a quality one —
  // Mahua may hold a release for that guest, but this pipeline does not know
  // that, so the image is excluded rather than assumed clear. See
  // task-3-report.md for the fuller reasoning.
  {
    id: "sound-healing",
    src: "reference/mockup-media/sound-healing-session-by-candlelight-a65d35e28c.jpg",
    alt: "A sound healing session by candlelight, singing bowls set before a seated guest.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "room-hanging-chair-view",
    src: "reference/wp-media/1600x900-pench-17.jpg",
    alt: "A mud-walled room opening onto a private balcony with a hanging cane chair among the trees.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "hanging-chair-forest-deck",
    src: "reference/wp-media/1600x900-pench-18.jpg",
    alt: "A hanging cane chair on a private wooden deck above the forest stream.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "bungalow-exterior-palms",
    src: "reference/wp-media/701998_499472406750031_483614617_o.jpg",
    alt: "A tiled-roof bungalow with young palms rising in front of its veranda.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "suite-tiger-painting",
    src: "reference/wp-media/Cottage-with-deck-2-scaled.jpg",
    alt: "A mud-walled suite with a painted cat's face above the bed and doors open to a forest deck.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // These two had each other's source file until 4 Aug 2026: JAS05507 is the
    // lawn and JAS06485 is the bedroom, and the ids said the opposite. Nothing
    // in the suite could see it — the tests check that a file exists and is
    // under budget, not that the words describe the picture. Caught by eye,
    // during an audit of all 35 against their captions.
    id: "room-open-to-bamboo",
    src: "reference/wp-media/JAS06485-scaled.jpg",
    alt: "A room with a dark timber dado and terracotta beams, its doors open to a wall of bamboo.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "lawn-picnic-golden-hour",
    src: "reference/wp-media/JAS05507-HDR-scaled.jpg",
    alt: "Picnic tables and umbrellas set out on the lawn as the trees turn gold.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "hammocks-shade",
    src: "reference/video-stills/hammocks-shade.png",
    alt: "Two rope hammocks slung between slender trees in dappled afternoon shade.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // "stargazing-telescope" (mockup-media, mahua-brand-guidelines-v1-forest-23-...jpg)
  // was also removed on a guest-consent basis on re-review: dim night
  // lighting makes two of the three figures unrecognisable, but the third
  // (left, glasses and beard visible) has discernible features under
  // low-but-not-negligible ambient light, and it is not clear from the frame
  // whether that figure is a guest or the naturalist. Excluded rather than
  // guessed — see task-3-report.md.
  {
    id: "garden-path-lodge",
    src: "reference/wp-media/3B84C808-5785-4721-82CD-5F6B68F83EE3-scaled.jpg",
    alt: "A stone path through palms and bamboo towards the lodge's reception rooms.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "pool-daylight-forest",
    src: "reference/wp-media/newsletter-banner.png",
    alt: "The pool by daylight, banana leaves and forest closing around the water.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },

  // ---- details: the small things guests remember — clay, flowers, shrines, hands ----
  {
    id: "potters-hands",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-24-63f192761b.jpg",
    alt: "A potter's clay-covered hands shaping a vessel on the wheel.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "petal-bowl-map",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-25-42377ab0ca.jpg",
    alt: "Rose petals afloat in a stone bowl before a lantern-lit forest map.",
    category: "details",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "forest-shrine-incense",
    src: "reference/mockup-media/mahua-brand-guidelines-v1-forest-26-cfc851210f.jpg",
    alt: "Incense smoke rising from a small forest shrine beneath a hanging lamp.",
    category: "details",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "lily-pond-fountain",
    src: "reference/wp-media/IMG_0175.jpg",
    alt: "Water lilies crowding a stone fountain, the lawn stretching out beyond.",
    category: "details",
    orientation: "square",
    fullBleedSafe: false,
  },
  {
    id: "geese-garden-pond",
    src: "reference/wp-media/vcccc-scaled.jpg",
    alt: "A family of geese paddling across a garden pond beneath overhanging leaves.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: true,
  },

  // ---- Property pages: Mahua Vann ----
  {
    // Viewed 9 Aug 2026: this is the lodge's entrance court — ochre walls,
    // brass pots, a bowl of petals at the dining-hall doors. Not "grounds
    // under the forest canopy", which is what the alt claimed until then.
    id: "vann-hero",
    src: "reference/wp-media/property-pages/JAS05303-HDR-scaled.jpg",
    alt: "The entrance court at Mahua Vann — brass pots, lanterns, and a bowl of petals at the dining-hall doors.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "vann-room-deluxe",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Deluxe.jpg",
    alt: "A Deluxe room at Mahua Vann, garden and jungle view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  // No "vann-room-cottage" entry. lib/media.test.ts's perceptual-hash
  // duplicate guard flagged it (distance 0/256) as byte-identical to
  // "suite-tiger-painting", already curated for the home page from the same
  // source file (reference/wp-media/Cottage-with-deck-2-scaled.jpg) — a true
  // positive, not a false alarm. Per this task's brief: dropped rather than
  // exempting the guard. Whichever task writes the Vann rooms copy should
  // reference the existing "suite-tiger-painting" id directly.
  {
    id: "vann-safari",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Jungle-Safari.jpg",
    alt: "An open safari vehicle on a morning game drive at Pench.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-kohka-lake",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Kohka-Lake.jpg",
    alt: "Kohka Lake near Mahua Vann, still water at the forest's edge.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Viewed 9 Aug 2026: finished pots — terracotta and blackened clay —
    // laid out in the sun. No potter and no wheel in the frame, whatever
    // the filename suggests.
    id: "vann-potters-village",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Potters-Village.jpg",
    alt: "Terracotta and blackened clay pots drying in the sun at Pachdhar, the potters' village near Pench.",
    category: "details",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-dining",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Dining.jpg",
    alt: "A table laid at Mahua Vann, seasonal dishes under the open sky.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "vann-bird-watching",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Bird-Watching.jpg",
    alt: "Birdwatching in Mahua Vann's private eco park.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Viewed 9 Aug 2026: guests in safari chairs watching an open-air
    // wildlife documentary in the lit courtyard — elephants on the screen.
    // The earlier alt ("an evening gathering") undersold what the lodge
    // actually offers here; the filename had it right all along.
    id: "vann-evening",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg",
    alt: "An open-air wildlife documentary in Mahua Vann's courtyard after dinner.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // The live Vann page's own "Experiences" banner — a tiger among the sal
    // trunks, head turned to the road. 1163x508, so far below the 1400px
    // full-bleed floor: a plate, never a backdrop.
    id: "vann-tiger",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Pench_Experiences.jpg",
    alt: "A tiger pausing between sal trunks in Pench.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Second sweep, 9 Aug 2026 — the pool under the trees at golden hour,
    // from the same JAS shoot as the hero. Vann's page carried no pool at
    // all until this landed; Tola's page had one from the start.
    id: "vann-pool",
    src: "reference/wp-media/property-pages/JAS05502-HDR-scaled.jpg",
    alt: "Mahua Vann's pool under the trees, late-afternoon sun through the canopy.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },

  // ---- Property pages: Mahua Tola ----
  {
    // Repointed 9 Aug 2026, by eye. TWD5337 — this id's src until then — is a
    // candlelit dinner for two beside the pool at night: a beautiful frame
    // that contradicted both the hero's own headline ("Tadoba, raw and close
    // to the gate") and the alt text describing lodge grounds. DSC00044 is
    // the lodge seen across its lily pond at dusk — the arrival the headline
    // actually promises. TWD5337 now closes /mahua-vann as its "Looking for
    // Tadoba instead?" banner, under the id "tola-candlelit-dinner".
    id: "tola-hero",
    src: "reference/wp-media/property-pages/DSC00044-scaled.jpg",
    alt: "Mahua Tola across its lily pond at dusk, the lodge lit under the trees.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // TWD5337, the frame that was briefly Tola's hero (see "tola-hero"
    // above). It closes /mahua-vann as the sibling banner — the invitation
    // to Tadoba — where its subject and its caption finally agree. It was
    // briefly a second dining plate on /mahua-tola instead, and measurement
    // ended that: two half-width plates carry less imagery than the one
    // full-width dining-hall plate they replaced (18.1% -> 49.8% empty).
    id: "tola-candlelit-dinner",
    src: "reference/wp-media/property-pages/TWD5337-scaled.jpg",
    alt: "A candlelit dinner for two laid beside Mahua Tola's pool at night.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // A guest by the bonfire at night — the live Tola page's Bonfire
    // experience, portrait. 1707px wide clears the full-bleed floor on
    // paper, but the page's full-bleed pattern is landscape-only (see
    // scripts/fetch_property_media.mjs); kept false so nobody reaches for
    // it as a backdrop without looking at it first.
    id: "tola-bonfire",
    src: "reference/wp-media/property-pages/DSC00097-scaled.jpg",
    alt: "A guest warming her hands over the bonfire at Mahua Tola.",
    category: "lanternHour",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    // The live Tola page's own Family Suite tab image (data-image on the
    // rooms tabs, cross-referenced 9 Aug 2026) — white walls, terracotta
    // beams, a Gond painting over the bed. The spec's claim that the Family
    // Suite had no photograph anywhere in the harvest was wrong; the mapping
    // was sitting in the same data-image attributes the first fetch read.
    id: "tola-room-family",
    src: "reference/wp-media/property-pages/DSC09703-scaled.jpg",
    alt: "The Family Suite at Mahua Tola — terracotta beams and a Gond painting over the bed.",
    category: "lodgeLife",
    orientation: "portrait",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-deluxe",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Deluxe-room.jpg",
    alt: "A Deluxe room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-suite",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Suite-room.jpg",
    alt: "A Suite room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-camping",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Camping-hut.jpg",
    alt: "The camping hut at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Viewed 9 Aug 2026: three tigers at rest on grass in the shade — no
    // vehicle anywhere in the frame, whatever the filename suggests.
    id: "tola-tiger-safari",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Tiger-safari.jpg",
    alt: "Three tigers at rest in the shade at Tadoba-Andhari Tiger Reserve.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-river-walk",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_River-Walk.jpg",
    alt: "The Hattinala river near Mahua Tola.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Viewed 9 Aug 2026: two rope hammocks slung between trees at the
    // lodge — there are no guests in the frame, so the alt does not
    // invent any.
    id: "tola-experiences",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Experiences.jpg",
    alt: "Rope hammocks slung between the trees at Mahua Tola.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Corrected against Task 3's by-eye findings (9 Aug 2026): DSC00091 is the
    // dining hall (wood-beamed, tables laid, wicker pendant lamps); DSC00044 —
    // this id's src until this correction — is a lodge/pond exterior with no
    // dining furniture at all. Do not revert to DSC00044 without re-viewing it.
    id: "tola-dining",
    src: "reference/wp-media/property-pages/DSC00091-scaled.jpg",
    alt: "The dining hall at Mahua Tola, tables laid under wicker pendant lamps.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    // Corrected the same way: DSC00122 is an accommodation-block exterior at
    // dusk with clean negative space for a text scrim — DSC00091 (this id's
    // src until this correction) is the dining hall, wrong mood and no room
    // for overlaid type without cropping across a laid table.
    id: "tola-guest-word",
    src: "reference/wp-media/property-pages/DSC00122-scaled.jpg",
    alt: "An accommodation block at Mahua Tola, dusk light through the bamboo.",
    category: "lanternHour",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    id: "tola-swimming",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Swimming.jpg",
    alt: "The pool at Mahua Tola.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  // No "tola-evening" entry. Task 3 (9 Aug 2026) confirmed by perceptual hash
  // (distance 0/256, lib/media.test.ts's own duplicate algorithm) that
  // Mahua-Website-Images_Tadoba_Wildlife-documentaries.jpg is the identical
  // photograph to Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg
  // (curated above as "vann-evening") — same people, same poses, same frame.
  // Curating both under separate ids would fail that test. Vann keeps it;
  // Tola's Experiences plateGrid runs on one plate instead of two (still
  // valid — plateGrid's floor is 1, see content/mahua-tola.test.ts).
  {
    // The live Vann page's own "Cottages without Deck" tab image — confirmed
    // by the tab's own data-image attribute in reference/wp-pages, not by
    // this file's name (its filename is shared with an unrelated WordPress
    // page and is not evidence of anything). Task 3 recorded this room type
    // as having no photograph anywhere in the harvest; it does, and the
    // Vann rooms index has been showing "Shown: Cottage with Deck" against
    // both cottage types for a fortnight because of that miss.
    //
    // Draft alt text called the sit-out a "deck" — accurate to what a cane
    // chair and railing through the glass look like, but this is
    // specifically the room type the brand calls "without deck" (see
    // content/mahua-vann.ts's rooms copy, which lists "private sit-out" for
    // both cottage types and reserves "deck" for the one over the seasonal
    // river). Reworded to "sit-out" so the alt text doesn't read as
    // contradicting the room name it will sit beside.
    //
    // CONSTRAINT for whoever wires this into a content dial: this source is
    // 1931x789, 2.45:1 — unusually wide. RoomShowcase's offsetRight (4:3)
    // and offsetLeft (3:2) scales centre-crop to box, which at 2.45:1 into
    // either box removes close to half the frame's width, split evenly, and
    // takes the sit-out and cane chair this alt text names out of the
    // visible crop entirely. Use the "wide" scale (21:9 = 2.33:1) — under
    // 5% width loss, keeps the whole room including the sit-out and chair.
    id: "vann-room-cottage-plain",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_TC.jpg",
    alt: "A cottage at Mahua Vann — mud-plastered walls, a woven cane chair on the private sit-out, and the forest close through the glass doors.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  // No Conference-hall entry. Looked at Mahua-Website-Images_Pench_Conference.jpg
  // (an empty multipurpose hall — beamed ceiling, pendant lights, a handful
  // of chairs, tall curtained windows) and decided against curating it:
  // ExperiencePair's `alsoLine` (components/sections/ExperiencePair.tsx)
  // names the conference hall in one quiet text line by the client's own
  // 9 Aug ruling and never gives it a photograph. Nothing on either
  // property page will render this image, so curating it would only add
  // bytes and a manifest entry with no consumer.
];

/**
 * Nominal responsive tiers. A tier narrower than the source is skipped —
 * never upscale. Capped at 1440, not 1920: 1440px already clears the
 * >=1400px full-bleed threshold (CLAUDE.md non-negotiable #10), and several
 * of the busiest Task 3 sources (dense foliage, bamboo, tangled vines)
 * cannot hit the 200 KB budget at 1920 even at floor quality — the extra
 * pixels aren't worth the budget they cost. See encodeUnderBudget below.
 *
 * The two small tiers were added on 4 Aug 2026, and they are the point of the
 * whole exercise. Until then the manifest recorded only the *largest* tier and
 * every `<img>` on the page pointed at it, so a 390px phone downloaded the
 * 1440-wide hero: 192 KB where ~30 KB covers the same pixels. Measured on Slow
 * 4G (1.6 Mbps / 150 ms RTT) that hero landed at 4,954 ms against CLAUDE.md
 * non-negotiable #6's 2.5s budget, and Chrome's LCP hid it by resolving to a
 * paragraph instead.
 *
 * - **400** — a 390px phone at DPR 1, and every small inset and 4-up plate.
 * - **640** — a phone at DPR ~1.6, a 2-up plate, the offset pair in `guests`.
 * - **768**, **1200** — added 4 Aug 2026, and they are pure fit. A tier list is
 *   a staircase the browser has to round *up* on: Lighthouse's mobile emulation
 *   is 412px at DPR 1.75, which asks for 721px, and with 640 and 960 as the only
 *   neighbours it was landing on the 960 file — 98 KB where 768 covers the same
 *   pixels in 63. 1200 does the same job for a laptop-width full-bleed, which
 *   was rounding 1024-1280 up to 1440. Nothing is served smaller than before;
 *   the staircase just has more steps, so fewer visitors overshoot one.
 * - **960**, **1440** — the pre-existing pair; 1440 stays the canonical entry
 *   recorded as `width`/`height`/`avif`/`webp` so nothing downstream that reads
 *   the largest derivative changes meaning.
 */
const WIDTHS = [400, 640, 768, 960, 1200, 1440];
const AVIF_QUALITY = 55;
const WEBP_QUALITY = 72;
const JPG_QUALITY = 78;
const BLUR_WIDTH = 24;

// CLAUDE.md non-negotiable #6: "largest image < 200 KB" is a hard budget,
// not a target hit by eye on the 14 images this pipeline started with. Some
// of the wp-media sources brought in for Task 3 are far busier (leaf
// canopy, bamboo, tangled vines) than the original curated set and blew
// well past 200 KB at AVIF_QUALITY/WEBP_QUALITY on their largest tier. Step
// quality down per-encode until the budget is met instead of hand-tuning a
// magic constant for today's photo set — this keeps the guarantee true for
// whatever gets curated next, too. WebP compresses these high-frequency
// textures noticeably worse than AVIF at a given quality, so it gets a
// lower floor to work with — it's the older-browser fallback, not the
// format most visitors actually download.
const MAX_DERIVATIVE_BYTES = 200 * 1024;
const QUALITY_STEP = 5;
const AVIF_QUALITY_FLOOR = 30;
const WEBP_QUALITY_FLOOR = 20;
// The JPEG fallback used to be encoded once at a fixed quality with no
// budget check at all — every other format stepped down to meet the 200 KB
// cap, JPEG just didn't. That gap is exactly how 1440px JPEGs for the
// busiest Task 3 sources (forest-trail-canopy, garden-path-lodge, and
// others — dense foliage and bamboo again) ended up 1.5-2x over budget even
// after the 1920 tier was removed. Same floor-stepping treatment as AVIF/
// WebP now applies. mozjpeg holds up worse than AVIF at very low quality
// (visible blocking, not just softness), so its floor sits higher than
// WebP's — this is the fallback of last resort, not the format most
// visitors download, so some quality loss at the floor is an acceptable
// trade against a hard 200 KB ceiling.
const JPG_QUALITY_FLOOR = 35;

// Filenames that landed over MAX_DERIVATIVE_BYTES even at their quality
// floor, collected as buildOne() runs. A non-empty list at the end of
// main() sets a non-zero process.exitCode — previously an oversized file
// only ever got a console.warn, which a CI run (or a human skimming
// terminal output) can miss entirely. That is exactly how the JPEG-never-
// budgeted bug shipped in the first place: nothing failed loudly.
const overBudgetFiles = [];

async function encodeUnderBudget(resized, format, startQuality, floorQuality, extraOptions = {}) {
  let quality = startQuality;
  let result;
  for (;;) {
    const pipeline = resized.clone();
    result =
      format === "avif"
        ? await pipeline.avif({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true })
        : format === "webp"
          ? await pipeline.webp({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true })
          : await pipeline.jpeg({ quality, ...extraOptions }).toBuffer({ resolveWithObject: true });
    if (result.data.length <= MAX_DERIVATIVE_BYTES || quality <= floorQuality) break;
    // Clamp to floorQuality rather than always subtracting a full QUALITY_STEP:
    // when (startQuality - floorQuality) isn't a multiple of QUALITY_STEP, an
    // unclamped decrement overshoots and the *next* iteration encodes one
    // full step below the configured floor before the `quality <= floorQuality`
    // check above ever sees it — e.g. WebP (72 -> 20, step 5) bottomed out at
    // 17, JPEG (78 -> 35, step 5) at 33. Clamping guarantees the floor is the
    // lowest quality this function ever actually encodes at.
    quality = Math.max(quality - QUALITY_STEP, floorQuality);
  }
  return { ...result, quality };
}

async function buildOne(entry) {
  const srcPath = path.join(ROOT, entry.src);
  const srcBuffer = await readFile(srcPath);
  const srcMeta = await sharp(srcBuffer).metadata();
  if (!srcMeta.width || !srcMeta.height) {
    throw new Error(`${entry.id}: could not read dimensions of ${entry.src}`);
  }

  // Never upscale: only emit tiers that fit within the source's native width.
  // `maxWidth` is a per-entry escape valve for a source that cannot be served
  // at a given tier inside the 200 KB budget without dropping below its quality
  // floor. Capping the tier is honest — the image simply is not offered wide —
  // where shipping it over budget, or below the floor, would not be.
  //
  // The source's own width is always offered as a final tier, capped at the
  // widest configured one. This used to be a fallback for when *no* tier fitted,
  // and adding the 400/640 tiers on 4 Aug 2026 turned that into a silent
  // downgrade: a 900px source that previously emitted one 900px derivative now
  // matched 400 and 640, so the fallback never fired and its largest derivative
  // dropped from 900px to 640px. Seven of the thirty-five images lost native
  // resolution that way — including all three cats in the *forest* plate grid —
  // and nothing failed, because "the manifest matches what was emitted" stays
  // true when both get smaller together. Offering the native width rather than
  // falling back to it makes the tier list purely additive.
  const largestTier = WIDTHS[WIDTHS.length - 1];
  const ceiling = Math.min(srcMeta.width, entry.maxWidth ?? Number.POSITIVE_INFINITY);
  const fittingWidths = WIDTHS.filter((w) => w <= ceiling);
  const widthsToGenerate = [
    ...new Set([...fittingWidths, Math.min(ceiling, largestTier)]),
  ].sort((a, b) => a - b);

  const produced = [];
  for (const width of widthsToGenerate) {
    const resized = sharp(srcBuffer).resize({ width, withoutEnlargement: true });

    // `.metadata()` reads the *input* header and never runs the pixel
    // pipeline, so it cannot be used to learn what a queued `.resize()`
    // will actually emit. `.toBuffer({ resolveWithObject: true })` returns
    // `{ data, info }`, where `info.width`/`info.height` are the true
    // dimensions of the bytes just encoded — read those back instead of
    // re-deriving (and re-guessing) dimensions separately.
    const avifResult = await encodeUnderBudget(resized, "avif", AVIF_QUALITY, AVIF_QUALITY_FLOOR);
    const avifBuffer = avifResult.data;
    const avifInfo = avifResult.info;
    const avifName = `${entry.id}-${width}.avif`;
    await writeFile(path.join(OUT_DIR, avifName), avifBuffer);
    if (avifBuffer.length > MAX_DERIVATIVE_BYTES) {
      console.warn(
        `  ! ${avifName}: ${(avifBuffer.length / 1024).toFixed(1)} KB at floor quality ${avifResult.quality} — still over the 200 KB budget`,
      );
      overBudgetFiles.push({ name: avifName, bytes: avifBuffer.length, quality: avifResult.quality });
    }

    const webpResult = await encodeUnderBudget(resized, "webp", WEBP_QUALITY, WEBP_QUALITY_FLOOR);
    const webpBuffer = webpResult.data;
    const webpName = `${entry.id}-${width}.webp`;
    await writeFile(path.join(OUT_DIR, webpName), webpBuffer);
    if (webpBuffer.length > MAX_DERIVATIVE_BYTES) {
      console.warn(
        `  ! ${webpName}: ${(webpBuffer.length / 1024).toFixed(1)} KB at floor quality ${webpResult.quality} — still over the 200 KB budget`,
      );
      overBudgetFiles.push({ name: webpName, bytes: webpBuffer.length, quality: webpResult.quality });
    }

    produced.push({
      width,
      avifName,
      webpName,
      avifBytes: avifBuffer.length,
      webpBytes: webpBuffer.length,
      avifQuality: avifResult.quality,
      webpQuality: webpResult.quality,
      actualWidth: avifInfo.width,
      actualHeight: avifInfo.height,
    });
  }

  // Largest tier actually produced becomes the manifest's canonical entry
  // and the JPEG fallback. Its dimensions come from the buffer sharp just
  // encoded (captured above), not from re-reading the source.
  const largest = produced.reduce((a, b) => (b.width > a.width ? b : a));

  const jpgResized = sharp(srcBuffer).resize({ width: largest.width, withoutEnlargement: true });
  const jpgResult = await encodeUnderBudget(jpgResized, "jpeg", JPG_QUALITY, JPG_QUALITY_FLOOR, {
    mozjpeg: true,
  });
  const jpgBuffer = jpgResult.data;
  const jpgName = `${entry.id}-${largest.width}.jpg`;
  await writeFile(path.join(OUT_DIR, jpgName), jpgBuffer);
  if (jpgBuffer.length > MAX_DERIVATIVE_BYTES) {
    console.warn(
      `  ! ${jpgName}: ${(jpgBuffer.length / 1024).toFixed(1)} KB at floor quality ${jpgResult.quality} — still over the 200 KB budget`,
    );
    overBudgetFiles.push({ name: jpgName, bytes: jpgBuffer.length, quality: jpgResult.quality });
  }

  const blurBuffer = await sharp(srcBuffer)
    .resize({ width: BLUR_WIDTH, withoutEnlargement: true })
    .blur()
    .webp({ quality: 40 })
    .toBuffer();
  const blur = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  // Full-bleed eligibility is a hard rule (CLAUDE.md non-negotiable #10): an
  // entry curated as fullBleedSafe: true must actually emit a derivative
  // >= 1400px wide, not just claim a big enough source. Curation intent
  // (the CURATION array) and reality (what sharp actually encoded) can
  // drift if a source gets swapped later, so check both here rather than
  // trusting the hand-set flag through to the manifest unverified.
  if (entry.fullBleedSafe && largest.actualWidth < 1400) {
    throw new Error(
      `${entry.id}: curated fullBleedSafe: true but the largest derivative is only ${largest.actualWidth}px`,
    );
  }

  return {
    id: entry.id,
    alt: entry.alt,
    width: largest.actualWidth,
    height: largest.actualHeight,
    avif: `/media/${largest.avifName}`,
    webp: `/media/${largest.webpName}`,
    jpg: `/media/${jpgName}`,
    blur,
    // Every tier this entry emitted, ascending, with the dimensions sharp
    // actually encoded (`info.width`/`info.height` off the returned buffer, the
    // same source of truth the canonical width/height above uses — never the
    // input header). This is what `ui/Photo.tsx` turns into a real `srcset`.
    // Before it existed the pipeline was already writing these files and then
    // throwing away every reference to all but the largest, so the widths were
    // encoded, paid for on disk, and never served.
    sources: produced.map((p) => ({
      width: p.actualWidth,
      height: p.actualHeight,
      avif: `/media/${p.avifName}`,
      webp: `/media/${p.webpName}`,
    })),
    category: entry.category,
    orientation: entry.orientation,
    fullBleedSafe: entry.fullBleedSafe,
    _widthsGenerated: produced.map((p) => p.width),
    _largestAvifBytes: largest.avifBytes,
    // Includes the JPEG fallback now that it is budget-checked too — this
    // used to only look at avif/webp bytes, which is how a 636 KB JPEG sat
    // on disk while this figure quietly reported everything as compliant.
    _largestDerivativeBytes: Math.max(
      ...produced.map((p) => Math.max(p.avifBytes, p.webpBytes)),
      jpgBuffer.length,
    ),
    // Every file this entry actually wrote to OUT_DIR at every tier — not
    // just the largest tier recorded in the manifest above. This is the
    // per-entry contribution to the "what should exist" set that
    // cleanupStaleFiles() uses to find files the current curation list and
    // WIDTHS would not produce.
    _allFilenames: [...produced.flatMap((p) => [p.avifName, p.webpName]), jpgName],
    // Per-tier, per-format quality actually used, for the build log. This
    // used to exist only in a console.log line, gone the moment the
    // terminal scrolled past it — nobody could tell, weeks later, whether a
    // given derivative was crisp at quality 55 or scraped its floor at 30.
    _tiers: produced.map((p) => ({
      width: p.width,
      avifQuality: p.avifQuality,
      avifBytes: p.avifBytes,
      webpQuality: p.webpQuality,
      webpBytes: p.webpBytes,
    })),
    _jpgQuality: jpgResult.quality,
    _jpgBytes: jpgBuffer.length,
  };
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

function renderManifest(entries) {
  const lines = [];
  lines.push("// GENERATED FILE — do not edit by hand.");
  lines.push("// Produced by scripts/build_images.mjs from reference/mockup-media and reference/wp-media.");
  lines.push("// Run `node scripts/build_images.mjs` to regenerate.");
  lines.push("");
  lines.push("export const MANIFEST = [");
  for (const e of entries) {
    lines.push("  {");
    lines.push(`    id: ${tsStringLiteral(e.id)},`);
    lines.push(`    alt: ${tsStringLiteral(e.alt)},`);
    lines.push(`    width: ${e.width},`);
    lines.push(`    height: ${e.height},`);
    lines.push(`    avif: ${tsStringLiteral(e.avif)},`);
    lines.push(`    webp: ${tsStringLiteral(e.webp)},`);
    lines.push(`    jpg: ${tsStringLiteral(e.jpg)},`);
    lines.push(`    blur: ${tsStringLiteral(e.blur)},`);
    lines.push("    sources: [");
    for (const s of e.sources) {
      lines.push(
        `      { width: ${s.width}, height: ${s.height}, avif: ${tsStringLiteral(s.avif)}, webp: ${tsStringLiteral(s.webp)} },`,
      );
    }
    lines.push("    ],");
    lines.push(`    category: ${tsStringLiteral(e.category)},`);
    lines.push(`    orientation: ${tsStringLiteral(e.orientation)},`);
    lines.push(`    fullBleedSafe: ${e.fullBleedSafe},`);
    lines.push("  },");
  }
  lines.push("] as const;");
  lines.push("");
  return lines.join("\n");
}

// Deletes anything sitting in OUT_DIR that the current CURATION list and
// WIDTHS would not produce. The manifest this run is about to write is the
// authority on what should exist — `expectedFilenames` is built from exactly
// what buildOne() wrote for every entry actually in CURATION this run, at
// every tier it generated (not just the tier the manifest records), so
// nothing still-referenced can be swept up here. This closes a gap flagged
// as a deferred minor in Plan 2: a source removed from CURATION, or a WIDTHS
// tier removed (as happened when 1920 was dropped for budget reasons),
// previously left its old derivatives on disk forever with nothing to ever
// clean them up.
//
// Assumption this relies on: nothing but this script ever writes into
// OUT_DIR (public/media/). A hand-placed favicon, OG image, or any other
// file dropped straight into public/media/ outside this pipeline will be
// silently deleted on the next run — it won't be in any entry's
// `_allFilenames`. Keep any such file in a different directory under
// public/.
//
// The assumption above is known false for exactly the four files below.
// Filenames in OUT_DIR this cleanup pass must never remove, however the
// current CURATION list computes `expectedFilenames`. These are checked in
// outside this pipeline — client-supplied video, referenced by literal path
// in components/signature/SignatureFilm.tsx rather than through MediaId/
// media() — so they will never appear in any entry's `_allFilenames`.
const NEVER_DELETE = new Set([
  "tiger-film.mp4",
  "tiger-film-poster.webp",
  "potter-film.mp4",
  "potter-film-poster.webp",
]);

async function cleanupStaleFiles(expectedFilenames) {
  const existing = await readdir(OUT_DIR);
  const stale = existing.filter((f) => !expectedFilenames.has(f) && !NEVER_DELETE.has(f));
  for (const f of stale) {
    await rm(path.join(OUT_DIR, f));
  }
  return stale;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  const expectedFilenames = new Set();
  for (const entry of CURATION) {
    process.stdout.write(`Building ${entry.id} <- ${entry.src} ... `);
    const result = await buildOne(entry);
    results.push(result);
    for (const filename of result._allFilenames) expectedFilenames.add(filename);
    console.log(
      `widths [${result._widthsGenerated.join(", ")}], largest derivative ${(result._largestDerivativeBytes / 1024).toFixed(1)} KB`,
    );
  }

  const stale = await cleanupStaleFiles(expectedFilenames);
  if (stale.length > 0) {
    console.log(`\nRemoved ${stale.length} stale file(s) no longer produced by the current curation list/WIDTHS:`);
    for (const f of stale) console.log(`  - ${f}`);
  } else {
    console.log("\nNo stale files found in public/media.");
  }

  const manifestSource = renderManifest(results);
  await writeFile(MANIFEST_PATH, manifestSource, "utf8");
  console.log(`\nWrote ${MANIFEST_PATH}`);

  const largest = results.reduce((a, b) =>
    b._largestDerivativeBytes > a._largestDerivativeBytes ? b : a,
  );
  console.log(
    `Largest derivative overall: ${largest.id} at ${(largest._largestDerivativeBytes / 1024).toFixed(1)} KB`,
  );
  // Fail loudly. Previously an oversized derivative only produced a console
  // warning, which CI and a human skimming output both miss — that is exactly
  // how a 636 KB file and an unbudgeted JPEG encoder both shipped unnoticed.
  if (overBudgetFiles.length > 0) {
    console.error(
      `\nFAILED: ${overBudgetFiles.length} derivative(s) exceed the 200 KB budget ` +
        `(CLAUDE.md non-negotiable #6) even at their quality floor:`,
    );
    for (const f of overBudgetFiles) {
      console.error(`  ${f.name} — ${(f.bytes / 1024).toFixed(1)} KB at quality ${f.quality}`);
    }
    console.error(
      `Cap the offending entry with \`maxWidth\` so it is not offered at that tier, ` +
        `or drop it. Do not lower the quality floor.`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
