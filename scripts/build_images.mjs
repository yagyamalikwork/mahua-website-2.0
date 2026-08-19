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
 *
 * ## The 1344x685 re-exports, 17 Aug 2026
 *
 * Six entries — `tiger-crossing-track`, `vann-bird-watching`,
 * `vann-kohka-lake`, `forest-boardwalk-daylight`, `vann-potters-village`,
 * `forest-trail-canopy` — point at `Activity-Carousel-Images/` rather than at
 * `reference/`. They are the six `04 · Days in the Field` coverflow cards, and
 * the client re-exported each from the wider original after `docs/DECISIONS.md`
 * §20.6 measured that chapter as unable to reach the 45% density ceiling on the
 * files it had: four of the six were 1163px 2.289:1 crops served at exactly 1.00
 * against a 900px card, so the card could not grow.
 *
 * **They are re-exports, not upscales, and that was checked rather than
 * assumed** — every one shows more scene than the file it replaces, and each was
 * opened beside its old derivative at full size before being wired in. Two
 * consequences fall out of the shape change and are recorded on the entries
 * themselves: `forest-boardwalk-daylight` loses `fullBleedSafe` (1344 < the
 * 1400px floor), and `forest-trail-canopy` loses its `maxWidth` cap (the new
 * window is a third fewer pixels and now fits the 200 KB budget).
 *
 * **Four of the six are also drawn on `/mahua-vann`** — `vann-bird-watching`,
 * `vann-kohka-lake`, `vann-potters-village`, `forest-trail-canopy`, all in
 * `ExperiencePair`'s 4:5 `quiet` box. Repointing a source repoints that page
 * too, and a 4:5 box `cover`-crops a 1.962:1 frame to its centred 41%. Both
 * routes were screenshotted and read by eye before this shipped.
 *
 * Three further files arrived in the same folder — `guide-sunrise-1000-2.png`,
 * `hammocks-shade-1440-2.png`, `pool-daylight-forest-768-2.png` — and are
 * deliberately NOT used. They are re-exports of the four-photograph header
 * collage the client deleted the same day, so those three entries keep their
 * existing `reference/` sources: repointing them would be re-cutting artwork
 * for an element that no longer exists.
 *
 * ## THE PORTRAIT CROPS, 19 Aug 2026 — five entries, and why they exist
 *
 * `05 · Experiences` became a horizontal strip of **tall portrait cards**, 0.74:1,
 * on the client's own ruling (spec §6). Five of its six photographs are
 * landscape, and this is the arithmetic that forced a decision rather than a
 * preference:
 *
 * | id | file | aspect | `object-cover` in a 0.74 box |
 * |---|---|---|---|
 * | `bonfire-dinner` | 1100x733 | 1.501 | **50.7%** of its width gone |
 * | `sound-healing` | 1000x666 | 1.502 | **50.7%** |
 * | `guide-sunrise` | 1000x666 | 1.502 | **50.7%** |
 * | `potters-hands` | 700x466 | 1.502 | **50.7%** |
 * | `tiger-crossing-track` | 1344x685 | 1.962 | **62.3%** |
 * | `star-talks` | 900x1350 | 0.667 | 9.9% of its HEIGHT — allowed |
 *
 * This project's bound is 25% of a photograph's **width**, and it is a bound on
 * the render: `check_card_stack.mjs` assertion 6 compares the loaded `<img>`'s
 * natural aspect against its rendered box. Rearranged, it says the box may not
 * be narrower than `0.75 x` the file's own aspect — **1.1265 for a 1.5:1 frame
 * and 1.4715 for the panorama.** Both are landscape. So there is no portrait
 * card, at any ratio, that this library can serve by `cover`: the tall card and
 * these files are simply incompatible, and no card ratio negotiates that away.
 *
 * The three honest ways out were a shallower card (1.13:1 is not a vertical
 * card and the client would reject it on sight), portrait re-exports from the
 * client (which blocks the work), and **an editorial crop in this pipeline**,
 * which is the one taken. It is the same mechanism the 13 Aug room photographs
 * use, and the distinction it turns on is real rather than a loophole: an
 * `object-cover` crop is a box silently discarding whatever happens to be at a
 * photograph's edges, and that is what the 25% bound exists to stop; a crop
 * here is a window chosen by a person who opened the file at full size and
 * decided what the photograph is of. The served file's aspect then IS the
 * card's, so the render-time crop is ~0% and the rig reads it as such honestly.
 *
 * **Every one of the five carries its window's reasoning on its own entry** —
 * what is kept, what is discarded, and why that is the right half. Do not add a
 * sixth without doing the same, and do not "simplify" any of them to a centred
 * window: three of the five are deliberately off-centre.
 *
 * `tiger-crossing-track` is the one that could NOT be cropped — the crop would
 * have enlarged guests whose consent clearance rests on how small they are — and
 * `tiger-golden-grass` replaces it on the card. Both entries carry the working.
 *
 * **What it costs, stated plainly**: at DPR 2 these five are short. The card is
 * ~321px at 1440 and ~274px at 390, so DPR 2 asks for ~642px and the five crops
 * are 710 / 542 / 493 / 493 / 444 wide. Only the tiger clears it. The ask that
 * closes it is the same one `docs/OWED-ORIGINALS.md` already carries for two
 * other groups — **uncropped portrait originals, ~900px wide** — which is a
 * re-export rather than a re-shoot for all five.
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
    /*
     * **Cropped to a 0.74 portrait on 19 Aug 2026, for `05 · Experiences`'
     * card strip** — see the block comment on THE PORTRAIT CROPS below, which
     * carries the arithmetic for all five of them and must be read before any
     * of these five `crop` windows is touched.
     *
     * 1100x733 → 542x733. The fire sits at x≈583 and the laid table at
     * 660-803, so the window is centred on the two of them together (their
     * midpoint, 670, minus half the window) rather than on the frame. What it
     * gives up is the cluster of lantern tripods on the left, x 55-385 — the
     * whole of the left third. Looked at at full size before and after: the
     * card's words are "Tables under the trees, a fire going", and the fire and
     * the table are what survive.
     */
    id: "bonfire-dinner",
    src: "reference/mockup-media/bonfire-dinner-under-lantern-lit-trees-111c897880.jpg",
    alt: "A bonfire burning beneath lantern-lit trees, a table laid beside it under a starlit sky.",
    category: "lanternHour",
    orientation: "portrait",
    crop: { left: 400, top: 0, width: 542, height: 733 },
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
    /*
     * **Cropped to a 0.74 portrait on 19 Aug 2026, and it is the card the
     * client did NOT ask for.** His list for `05 · Experiences` names
     * `tiger-crossing-track` against "Jungle Safari"; that frame is 1344x685
     * (1.962:1) and a portrait card throws away **62.3%** of its width, which
     * is over this project's 25% bound twice over — and the two things the
     * photograph is *about*, the tiger and the vehicle of guests behind it,
     * span x 0.34-0.85 and cannot both survive a 0.377 window. Worse, the
     * frame's guest-consent clearance (see that entry) rests on the guests
     * being "small, shaded and mostly turned toward the tiger": a portrait
     * window would draw them **2.65x larger relative to the card**, and this
     * pipeline's own standing rule is that a frame cleared at one size is not
     * cleared at every size. So it is not cropped, it is replaced.
     *
     * This is the substitute, and it costs nothing to get: 1440x959 (1.502:1),
     * freed on 19 Aug when `02 · The Jungles` took `jungle-cats-stitch`, with
     * no people in it at all. 1440x959 → 710x959, the window centred on the
     * tiger (x 346-893, centre ≈605). The bright vertical trunk at the right
     * edge, x 1240-1370, is outside it, which the portrait crop improves
     * rather than merely tolerates.
     *
     * **`fullBleedSafe` goes false with the crop**: 710px is under the 1400px
     * floor non-negotiable #11 sets, and the assertion at the foot of
     * `buildOne` would throw if this were left true. Nothing draws this frame
     * full-bleed — the chapter that did left the page the same day.
     */
    id: "tiger-golden-grass",
    src: "reference/mockup-media/a-bengal-tiger-moving-through-tall-golden-grass-b07148cf9b.jpg",
    alt: "A Bengal tiger moving through tall golden grass in the Pench forest.",
    category: "forest",
    orientation: "portrait",
    crop: { left: 250, top: 0, width: 710, height: 959 },
    fullBleedSafe: false,
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
    /*
     * Client-supplied, 19 Aug 2026, for `02 · The Jungles` on `feat/home-v2` —
     * the cropped band that replaces the 100svh tiger quote.
     *
     * **Looked at at full size before curating, and it is a COMPOSITE of the
     * three plates directly above.** Left panel: `melanistic-leopard`, the black
     * panther in the fork of a tree. Centre: `leopard-on-rock`, the leopard on
     * its slab among slender trunks. Right: `tiger-pair-profile`, the tiger in
     * close profile with the second cat's flank behind it. The three have been
     * blended into one continuous 3168x1344 forest frame with the joins
     * retouched — it is not a contact sheet, and at band size it reads as a
     * single photograph.
     *
     * That matters for one rule and not for the other. The perceptual-hash
     * duplicate guard in `lib/media.test.ts` compares whole frames and will not
     * fire, correctly — this is a different image. What WOULD have been a
     * problem is showing it beside its own three sources, and it cannot: the
     * same restructure that introduces it deletes `03 · The Forest`, so all
     * three leave the page in the same commit. **Do not restore a chapter
     * carrying any of `melanistic-leopard`, `leopard-on-rock` or
     * `tiger-pair-profile` while this band is on the page** — `chapters.test.ts`
     * would not catch it, because by id they are four distinct photographs.
     *
     * 3168x1344 is 2.357:1 — the widest source in the library, and comfortably
     * over the 1400px full-bleed floor even after the 1440 cap.
     */
    id: "jungle-cats-stitch",
    src: "reference/home-v2/cats-stitch.png",
    alt: "A stretch of sal forest holding three cats at once — a black panther in the trees at left, a leopard on a rock at centre, and a tiger in the golden grass at right.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: true,
  },
  {
    /*
     * Re-exported by the client at 1344x685 on 17 Aug 2026 — see the
     * "1344x685 re-exports" note at the head of `CURATION`. Looked at against
     * the old 1440x960 derivative: the same photograph, wider and shallower —
     * the vine-hung trunk on the right and the lantern posts on the bridge are
     * all still in frame, and the alt below still describes what is there.
     *
     * **`fullBleedSafe` drops to false with the re-export**, and it is not a
     * judgement: 1344 is under the 1400px floor in non-negotiable #11. Nothing
     * lays this photograph out edge-to-edge — it is a coverflow card, and
     * `FULL_BLEED_KINDS` is hero/fullBleedQuote/invitation — so the flag was
     * describing an eligibility nothing used.
     */
    id: "forest-boardwalk-daylight",
    src: "Activity-Carousel-Images/forest-boardwalk-daylight-1440-2.png",
    alt: "A timber boardwalk threading through forest, tangled vines framing the foreground.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    /*
     * Re-exported at 1344x685, 17 Aug 2026. **The `maxWidth: 960` cap that
     * used to sit here is gone, and the reason it can go is the crop.**
     *
     * The cap was written against the old 1440x960 window: dense foliage over
     * 1.38 Mpx, whose WebP landed at 203 KB even at the quality floor, so the
     * entry was capped rather than shipped over budget. The re-export is a
     * 1344x685 letterbox — 0.92 Mpx, a third fewer pixels — and its widest tier
     * fits the 200 KB budget with the encoder still well above its floor.
     *
     * The cap could not survive anyway: a 900px coverflow card draws a 1.962:1
     * photograph in a 16:9 box at 993px, so a 960px ceiling would have served
     * this one card soft while the other five were sharp. Re-run
     * `check_image_resolution.mjs` if this frame is ever re-cropped.
     */
    id: "forest-trail-canopy",
    src: "Activity-Carousel-Images/forest-trail-canopy-960-2.png",
    alt: "A sunlit trail tunnelling beneath an arch of forest canopy.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    /*
     * **Guest consent: GRANTED by the client, 17 Aug 2026, and the reason it
     * had to be asked is worth keeping.**
     *
     * This frame ships a safari vehicle with six or seven guests in it, and
     * until 17 Aug it was served at 541px, where nobody in it is identifiable.
     * The coverflow's card is 1344px. **The same photograph at 2.5× the size is
     * a different consent question**, and it was put to the client with the two
     * withdrawn images below cited: he confirmed consent.
     *
     * The lesson generalises past this file: the rule at the head of this
     * script ("look at every frame before curating it") is not only about
     * *whether* a face is in shot but about *how large it will be drawn*. A
     * frame cleared at one size is not cleared at every size, and enlarging a
     * photograph is enough on its own to reopen it.
     *
     * The 1344x685 re-export below is that larger frame arriving. Consent is
     * the same consent, granted for exactly this: **do not remove or weaken
     * this note, and do not re-narrow the file to "solve" it.** Looked at at
     * full size, 17 Aug 2026: the guests are at ~a third of the frame's width,
     * four of them under the canopy behind the windscreen and two standing with
     * cameras; faces are small, shaded and mostly turned toward the tiger.
     *
     * It was 1.065:1 (541x508) and is now 1.962:1 (1344x685), which is why it
     * is back on a card rather than in the header band — the band, its 420px
     * cap and its 1:1 box were all built around the narrow file and went with
     * the collage on 17 Aug.
     */
    /*
     * **Curated, cleared, and unused again as of 19 Aug 2026.** The coverflow
     * that drew it was replaced by a strip of 0.74 portrait cards, and this
     * frame is 1.962:1 — a portrait window keeps 37.7% of its width, which
     * loses either the tiger or the vehicle, and would draw the guests 2.65x
     * larger relative to the card than the frame they were cleared in. See the
     * PORTRAIT CROPS note at the head of this file, and `tiger-golden-grass`,
     * which took the card instead. **The consent note below stands unchanged
     * and is the reason this entry was not cropped rather than a formality.**
     */
    id: "tiger-crossing-track",
    src: "Activity-Carousel-Images/tiger-crossing-track-541-2.png",
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
    /*
     * **Cropped to a 0.74 portrait on 19 Aug 2026** — 1000x666 → 493x666, the
     * window on the guide himself (x 130-680, his mass centred at ≈360) rather
     * than on the frame. It keeps his whole body, the cap, the raised
     * binoculars and the sun flare breaking through at 520-620; what it loses
     * is empty scrub either side. A standing figure is the one shape in this
     * set that a portrait window flatters.
     *
     * **This entry is NOT the 1344x685 file the strip's brief assumed.** The
     * client's 17 Aug `Activity-Carousel-Images/guide-sunrise-1000-2.png`
     * re-export was deliberately never wired up — it was cut for the header
     * band he deleted the same day (see the note at the head of this file) —
     * so this id has been the 1000x666 mockup-media frame throughout, and
     * `reference/home-v2/guide-binoculars-sunrise.jpg` is byte-for-byte the
     * same photograph at the same size. There was no gentler copy to reach
     * for; this already was it.
     */
    id: "guide-sunrise",
    src: "reference/mockup-media/a-guide-scanning-the-canopy-with-binoculars-at-sunrise-400151ad6e.jpg",
    alt: "A guide scanning the forest canopy with binoculars in the early sunrise light.",
    category: "lodgeLife",
    orientation: "portrait",
    crop: { left: 114, top: 0, width: 493, height: 666 },
    fullBleedSafe: false,
  },
  // "bush-breakfast" (mockup-media, guests-birdwatching-over-bush-breakfast-...jpg)
  // was removed on a guest-consent basis: a guest's face is fully lit, in
  // focus, and recognisable. That is a consent question, not a quality one —
  // Mahua may hold a release for that guest, but this pipeline does not know
  // that, so the image is excluded rather than assumed clear. See
  // task-3-report.md for the fuller reasoning.
  {
    /*
     * **Cropped to a 0.74 portrait on 19 Aug 2026** — 1000x666 → 493x666,
     * centred on the seated figure at x≈500. The easiest of the five by a
     * distance: the subject is already dead centre, the singing bowls run
     * along the foot of the frame, and the window keeps the figure whole with
     * a bowl at each bottom corner. The photograph is symmetrical about its
     * own centre line, so a centred window is the composition rather than a
     * compromise with it.
     */
    id: "sound-healing",
    src: "reference/mockup-media/sound-healing-session-by-candlelight-a65d35e28c.jpg",
    alt: "A sound healing session by candlelight, singing bowls set before a seated guest.",
    category: "lodgeLife",
    orientation: "portrait",
    crop: { left: 254, top: 0, width: 493, height: 666 },
    fullBleedSafe: false,
  },
  {
    /*
     * Client-supplied, 19 Aug 2026, for the "Screenings and Star Talks" card in
     * `05 · Experiences` on `feat/home-v2`. **Curated here; nothing renders it
     * yet** — the re-carded strip is a later task, so this entry is deliberately
     * unused for now, exactly as `vann-safari` was between 16 and 17 Aug.
     *
     * **GUEST CONSENT: NOT YET CONFIRMED. Put to the client before this frame
     * reaches a card, and do not treat this comment as the clearance.**
     *
     * Looked at at full size, 19 Aug 2026. Three people on the night lawn round
     * a Dobsonian telescope, two of them pointing up at the sky:
     *
     * - **Left, a man in a grey T-shirt** — full left profile, lit, in focus,
     *   glasses and moustache legible. **Recognisable.**
     * - **Centre, a young woman at the eyepiece** — three-quarter face, hair
     *   tied back, features legible even though one eye is at the telescope.
     *   **Recognisable.**
     * - **Right, a man in a hat and tan shirt** — back fully to camera, no face
     *   in frame at any zoom. Not identifiable. Reads as a naturalist rather
     *   than a guest, but that is an inference from the hat and the pointing,
     *   not a fact this file knows.
     *
     * So this is the same question `tiger-crossing-track` was put to the client
     * on 17 Aug, and a harder one: there the guests were a third of the frame's
     * width, shaded and turned away, and here two faces are lit, near the
     * foreground, and will be drawn at card size. The rule at the head of this
     * file has cost two photographs already; a frame is not cleared because the
     * client sent it, only because he was shown what is in it and said yes.
     *
     * **CONSENT GRANTED by the client, 19 Aug 2026**, having been shown exactly
     * what the frame contains: the man in left profile and the woman at the
     * eyepiece are both recognisable, the third figure has his back to camera.
     * Cleared on the same terms as `tiger-crossing-track` two days earlier.
     *
     * That is now three consent rulings in three days, and the shape of all
     * three is worth keeping: **the question was never whether a face was in
     * shot, but how large it would be drawn.** This frame and the safari one had
     * both been sitting in the library, unremarkable, until a card made them
     * large. A frame cleared at one size is not cleared at every size.
     *
     * 900x1350 (0.667:1) is genuinely portrait, which is what the reference's
     * tall cards want — the one source of the six that needs no re-crop.
     *
     * **Rendered since 19 Aug 2026**, on `05 · Experiences`' "Screenings and
     * Star Talks" card. It is the only one of the six that reaches its card
     * uncropped by this pipeline: the card is 0.74 and this file is 0.667, so
     * `object-cover` trims 9.9% of its HEIGHT — off the night sky at the top,
     * which is the half of the frame with nothing in it — and this project
     * bounds width crops only.
     */
    id: "star-talks",
    src: "reference/home-v2/star-talks.jpg",
    alt: "Guests and a naturalist round a telescope on the lawn at night, two of them pointing up at the sky.",
    category: "lodgeLife",
    orientation: "portrait",
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
    /*
     * **Re-sourced and cropped to a 0.74 portrait on 19 Aug 2026.**
     *
     * The source moves from `reference/mockup-media/…forest-24…jpg` (700x466)
     * to `reference/home-v2/potters-wheel.jpg` (900x600) — **the same
     * photograph, 29% wider**, which the client supplied in the home-v2 pack.
     * Checked side by side at full size before the swap: same wheel, same
     * hands, same ring, same bamboo screen behind; nothing is added or
     * recomposed, it is simply a bigger export. That matters because the crop
     * below costs half the width, and 700px could not afford it — a 0.74
     * window of the old file would have been 345px wide and emitted one 400px
     * tier off a 345px base, i.e. a photograph narrower than the card that
     * draws it on any laptop.
     *
     * 900x600 → 444x600, window at x 51-495: the pot complete, the hands
     * complete, the arm cut at the wrist where it already ran off the frame's
     * own left edge. What it gives up is the out-of-focus bamboo screen on the
     * right, x 495-900 — which is nearly half the frame and none of the
     * subject.
     *
     * **This frame moves chapters in the same change.** It was `03 · Rooted
     * Like The Mahua`'s third photograph until 19 Aug; the strip's "Village
     * Craft" card wants exactly it ("Pottery at the wheel"), and
     * `content/chapters.test.ts` forbids one photograph appearing twice on the
     * page — so `rooted` takes `vann-potters-village` (the Pachdhar potters'
     * village its own third paragraph is actually about) and this comes here.
     * See `content/chapters.ts`.
     */
    id: "potters-hands",
    src: "reference/home-v2/potters-wheel.jpg",
    alt: "A potter's clay-covered hands shaping a vessel on the wheel.",
    category: "details",
    orientation: "portrait",
    crop: { left: 51, top: 0, width: 444, height: 600 },
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
    // 3:2 window per the 13 Aug 2026 ruling ("crop and zoom to fit their half");
    // offset chosen by eye — see docs/reviews/2026-08-13-image-sizing/crops/.
    // left shifted from the centred 200 to 150: at 200 the buffalo painting and
    // headboard rack sat right at the frame edge; 150 gives them a full margin
    // and still carries the caned chair and glass table into frame on the right.
    crop: { left: 150, top: 0, width: 762, height: 508 },
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
    // Re-exported at 1344x685, 17 Aug 2026 (see the head of `CURATION`).
    // Viewed at full size: the same still water and forested far shore, with
    // more sky above and more of the reed bank in the bottom-right corner than
    // the 2.289:1 window carried. **Also drawn on `/mahua-vann`**, where a 4:5
    // `quiet` box shows the centred third — open water either way.
    id: "vann-kohka-lake",
    src: "Activity-Carousel-Images/Pench-Kohka-Lake.png",
    alt: "Kohka Lake near Mahua Vann, still water at the forest's edge.",
    category: "forest",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    // Viewed 9 Aug 2026: finished pots — terracotta and blackened clay —
    // laid out in the sun. No potter and no wheel in the frame, whatever
    // the filename suggests. Still true of the 1344x685 re-export (17 Aug
    // 2026), which is the same arrangement with more of the terracotta cups
    // above and below the old letterbox window.
    //
    // **This is the frame `docs/OWED-ORIGINALS.md` asks for a different CROP
    // of, not a wider file**, and the re-export does not answer that: the
    // white-glazed highlights on the two black bowls are still where a card's
    // body copy lands. Its scrim is solved against those highlights.
    id: "vann-potters-village",
    src: "Activity-Carousel-Images/Pench-potters-village.png",
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
    /*
     * Re-exported at 1344x685, 17 Aug 2026 (see the head of `CURATION`).
     *
     * **Three identifiable people, and this is the entry to look at first if
     * that rule is ever revisited.** Looked at at full size: three men in olive
     * fleeces, field trousers and caps, each with binoculars raised — the dress
     * and the kit read as naturalists rather than as guests. Every pair of eyes
     * is behind an eyecup, but the left figure's nose, mouth and jaw are clear
     * in three-quarter view, the centre figure's profile and grey-streaked hair
     * are clear, and the right figure's full beard and profile are clear. The
     * old 1163x508 window drew all three at roughly half this height.
     *
     * Raised with the client on 17 Aug 2026 alongside the `tiger-crossing-track`
     * consent above; it is his call, not this file's, and the note is here so
     * that the next person to enlarge this frame asks again rather than
     * inherits an answer. See the two withdrawn images recorded elsewhere in
     * this list for what a "no" looks like: the entry is deleted, not shelved.
     */
    id: "vann-bird-watching",
    src: "Activity-Carousel-Images/Pench-Bird-Watching.png",
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
  // No "tola-bonfire" entry. DSC00097-scaled.jpg (the live Tola page's own
  // Bonfire image) shows a guest's face clearly enough to identify her, and
  // the client asked for it off the site on consent grounds, 10 Aug 2026.
  // This is the second image rejected here for exactly that reason — the
  // original curation dropped one on the same grounds (see this array's own
  // header note), and that rule should have been applied when this one was
  // curated on 9 Aug. It was not, and the photograph shipped.
  //
  // Deleted rather than left curated-but-unused: an id in the manifest is an
  // id a later chapter can reach for, and the next person to want a bonfire
  // would find it by name without ever seeing the face in it. Mahua Tola's
  // Bonfire experience now uses "bonfire-circle-night", a frame from the
  // client's own Mahua Tola property video with no people in it at all.
  // Restoring this needs the guest's consent, not a code change.
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
    // 3:2 window per the 13 Aug 2026 ruling ("crop and zoom to fit their half");
    // offset chosen by eye — see docs/reviews/2026-08-13-image-sizing/crops/.
    // The centred 200 held up against 100 and 250 by eye: both twin beds and
    // the trunk at their foot stay whole, and — since the copy's own line
    // names it ("the forest at the window") — the window and its curtain stay
    // in frame, which 250 alone cropped away entirely.
    crop: { left: 200, top: 0, width: 762, height: 508 },
    alt: "A Deluxe room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    id: "tola-room-suite",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_Tadoba_Suite-room.jpg",
    // 3:2 window per the 13 Aug 2026 ruling ("crop and zoom to fit their half");
    // offset chosen by eye — see docs/reviews/2026-08-13-image-sizing/crops/.
    // left shifted from the centred 200 to 300: it drops a bedside kettle
    // table nobody's copy names and, in exchange, gives the glass double
    // doors and the bamboo beyond them — the alt's "window onto bamboo" —
    // the whole frame, doors uncut, rather than sharing it with a table.
    crop: { left: 300, top: 0, width: 762, height: 508 },
    alt: "A Suite room at Mahua Tola, forest view.",
    category: "lodgeLife",
    orientation: "landscape",
    fullBleedSafe: false,
  },
  {
    /*
     * Replaced `tola-room-camping` on 12 Aug 2026, and the old id is DELETED
     * rather than left curated-but-unused — the same rule the two consent
     * rejections above follow, for the same reason: an id in this manifest is
     * an id a later chapter reaches for by name, without ever seeing what is
     * in it.
     *
     * **The camping hut is a retired product, confirmed by the client.** It was
     * still the fourth card on `/mahua-tola` while the booking engine offered
     * no such room on any of five date ranges sampled across nine months —
     * whereas the Super Deluxe Cottages appear at every one, three of them, and
     * had no photograph at all. The page was advertising something nobody could
     * book and hiding something on sale every day.
     *
     * Client-supplied, 12 Aug 2026, 1500x1000 — checked with `sharp().metadata()`
     * and looked at, not trusted from the filename. No people in frame.
     *
     * **Curated from the 2:1 crop, not the original, and the reason is layout
     * rather than taste.** `roomCardLayout` picks a card's whole composition
     * from its photograph's aspect: at or above `ROOM_CARD_ASPECT_THRESHOLD`
     * (1.9) the card is `stacked` (photograph above the type), below it the card
     * is `beside`. The retired camping hut was 2.29, so it was stacked; the
     * original of this photograph is 1.50, so dropping it in **silently changed
     * the card's composition** and with it the chapter's height — `tola-rooms`
     * went from 33.8% mean / 44.3% worst empty to 37.1% / 47.9%, over
     * non-negotiable #8's 45% ceiling, on what was meant to be a like-for-like
     * swap.
     *
     * **2.29, not 2.00 — and the difference was caught by a test, not by eye.**
     * 2.00 is `ROOM_CARD_BOXES.stacked` exactly, so it crops nothing, and it
     * was the obvious choice. But `lib/room-card.test.ts` requires every room
     * photograph to sit at least **0.35** clear of the 1.9 threshold, so that no
     * card's composition is ever one re-encode away from flipping; 2.00 is only
     * 0.10 clear and was rejected. 2.29 is exactly what `tola-room-deluxe` and
     * `tola-room-suite` already are, clears by 0.39, and costs 12.6% of width to
     * the 2.0 box at render — the same 12.6% those two have always paid.
     *
     * The uncropped original stays beside this file: it is the better photograph
     * of the *room*, and if the card is ever given a `beside` composition it is
     * already there.
     *
     * **13 Aug 2026: the `beside` composition arrived, and the uncropped
     * original — kept beside the 2.29 file for exactly this day, per the
     * paragraph above — is now what ships.** No `crop` here: the source is
     * already the room's own 1500x1000 (1.50:1), inside Task 4's ≤1.51
     * landscape ceiling with no cropping needed. Everything above this
     * paragraph is history — the 2.29 stacked derivation it fed retires in
     * `lib/room-card.ts` the same day.
     *
     * **14 Aug 2026, finishing that annotation (image-sizing Task 4 review,
     * Important 4): the clearance test the "2.29, not 2.00" paragraph cites is
     * ALSO gone, not merely the export it measured.** `roomCardLayout`,
     * `ROOM_CARD_ASPECT_THRESHOLD` and `ROOM_CARD_BOXES` no longer exist —
     * `lib/room-card.test.ts`'s "keeps every room clear of the threshold by at
     * least 0.35" test went with them, so the 2.29-vs-2.00 argument above no
     * longer has anything enforcing it; it survives here only as the record of
     * why 2.29 was chosen at the time. `lib/room-card.ts` now only reads a
     * photograph's own worst-case aspect (`roomCardAspect`, corrected the same
     * day to read every emitted tier, not just the canonical one — Critical 1
     * of that review), and the live guard on any room's aspect is
     * `lib/room-card.test.ts`'s "the beside population" describe block: every
     * room, in both content files, at or under 1.6:1.
     */
    id: "tola-room-super-deluxe",
    src: "reference/client-photos/Super-Delux-Cottage.jpg",
    alt: "A Super Deluxe Cottage at Mahua Tola: a king bed under timber beams, with a window onto the bamboo.",
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
    // HISTORICAL as of 13 Aug 2026: RoomShowcase is retired and the crop
    // below now happens in the pipeline itself, ahead of every derivative —
    // the manifest's width/height are the cropped 1184x789 (1.50:1), so the
    // constraint above no longer binds whatever reads this entry next.
    id: "vann-room-cottage-plain",
    src: "reference/wp-media/property-pages/Mahua-Website-Images_TC.jpg",
    // 3:2 window per the 13 Aug 2026 ruling ("crop and zoom to fit their half");
    // offset chosen by eye — see docs/reviews/2026-08-13-image-sizing/crops/.
    // This source is 1931px wide — the bed sits at its far left, the woven
    // cane chair on its private sit-out at its far right, ~1740px apart,
    // well over the 1184px window's reach. No offset holds both; every
    // offset trades one for the other, and both trades were tried and
    // shipped in turn.
    //
    // SUPERSEDED 13 Aug 2026: `left: 650` shipped first, on the reasoning
    // that this room's own line never names the bed ("A private sit-out
    // under cane, and the forest close enough to touch through the glass
    // doors" — content/mahua-vann.ts) and the brief's own art-direction
    // table names this photo's feature as "the cane sit-out under glass
    // doors". That crop led with the AC unit and the back of the red
    // armchair and showed no bed at all — a corner of a room, not a room,
    // on a card whose one job is to sell the room.
    //
    // CURRENT as of 14 Aug 2026, art-direction correction: `left: 0`. Shows
    // the bed with its red textile, the framed wall art, the lamp and the
    // glass double doors onto the forest — the AC unit stays in frame at
    // upper right, only the cane sit-out and its chair are given up. The
    // bed wins because the card's job is to sell the room, not one amenity
    // in it; the sit-out is a real fact about this room and still stated in
    // its `facts` array in content/mahua-vann.ts.
    //
    // CORRECTED 14 Aug 2026: the sentence that stood here claimed the whole
    // uncropped 1931×789 photograph "remains on disk and reachable whole
    // once a later task builds the room gallery." That was true when
    // written and false two tasks later — image-sizing Tasks 6-7 built the
    // gallery the same day, and it opens the SAME cropped derivative as the
    // card (`RoomCardStack.tsx`'s gallery `<Photo id={room.mediaId}>`,
    // enlarged, not a second uncropped source). The cane sit-out and chair
    // this crop gave up are reachable nowhere on the site; only this
    // 1184-wide, left:0 window of the source ever ships. The uncropped
    // original stays on disk only as raw material for a future crop
    // decision, not as a visitor-reachable image.
    crop: { left: 0, top: 0, width: 1184, height: 789 },
    // Re-read against the left:0 frame, 14 Aug 2026: the sit-out and cane
    // chair are no longer in view, so this no longer names them.
    alt: "A cottage bedroom at Mahua Vann — a bed against mud-plastered walls, with the forest through the glass doors.",
    category: "lodgeLife",
    orientation: "landscape",
    // Was true when this source's uncropped 1931px width cleared the 1400px
    // full-bleed floor (non-negotiable #11). The 13 Aug crop's largest
    // derivative is 1184px — this id is a room-card photograph, never
    // rendered full-bleed, and the pipeline throws rather than let a false
    // claim through (grep-verified: no full-bleed use exists — RoomCard.tsx,
    // content/mahua-vann.ts).
    fullBleedSafe: false,
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

  // An editorial crop, in SOURCE pixels, applied before every derivative —
  // tiers, JPG fallback and blur all come from the same window, and the
  // manifest's width/height are the window's, so everything downstream that
  // reads an aspect (RoomCard's solved crop bound, the orientation field,
  // `sizes` math) sees the crop as the photograph. Client ruling 13 Aug 2026:
  // "You can crop and zoom into them to fit their half" — the spec's §2 table
  // says which entries and why.
  let baseBuffer = srcBuffer;
  let baseMeta = srcMeta;
  if (entry.crop) {
    const { left, top, width, height } = entry.crop;
    if (left + width > srcMeta.width || top + height > srcMeta.height || left < 0 || top < 0) {
      throw new Error(
        `${entry.id}: crop ${JSON.stringify(entry.crop)} exceeds the ${srcMeta.width}x${srcMeta.height} source`,
      );
    }
    baseBuffer = await sharp(srcBuffer).extract(entry.crop).toBuffer();
    baseMeta = { ...srcMeta, width, height };
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
  const ceiling = Math.min(baseMeta.width, entry.maxWidth ?? Number.POSITIVE_INFINITY);
  const fittingWidths = WIDTHS.filter((w) => w <= ceiling);
  const widthsToGenerate = [
    ...new Set([...fittingWidths, Math.min(ceiling, largestTier)]),
  ].sort((a, b) => a - b);

  const produced = [];
  for (const width of widthsToGenerate) {
    const resized = sharp(baseBuffer).resize({ width, withoutEnlargement: true });

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

  const jpgResized = sharp(baseBuffer).resize({ width: largest.width, withoutEnlargement: true });
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

  const blurBuffer = await sharp(baseBuffer)
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
