// One-off fetch for property-page photography the crawler's <img>-only
// harvest missed — these are loaded via a `data-image` lazy-load attribute
// WordPress puts on a <div>, not a real <img src>. Confirmed live 8 Aug 2026.
//
// Run: node scripts/fetch_property_media.mjs
//
// The four generic DSC000xx-scaled.jpg Tola frames carry no filename hint of
// their content. By-eye determination (Task 3, 9 Aug 2026 — full reasoning
// and screenshots in .superpowers/sdd/2026-08-08-property-pages/task-3-report.md):
//   - DSC00091-scaled.jpg is the dining frame: a wood-beamed dining hall,
//     laid tables under woven pendant lights. Use this by name in Task 4/8.
//     (DSC00044 was the wrong first guess — it's a lodge/reception exterior
//     with a lily pond, not dining. Corrected after actually viewing both.)
//   - DSC00122-scaled.jpg is the recommended full-bleed candidate for the
//     guest-quote chapter: a dusk accommodation-block exterior among bamboo,
//     practical lights on, clean negative space stage-right for a text
//     scrim. DSC00044 (same lodge/pond exterior above) is a reasonable
//     second choice. DSC00097 clears the 1400px-wide rule (1707px) but is
//     PORTRAIT (1707x2560, a guest by a campfire at night) — technically
//     eligible, unconventional for this site's landscape-only full-bleed
//     pattern; a Task 4 design call, not resolved here.
//
// Also found: Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg and
// Mahua-Website-Images_Tadoba_Wildlife-documentaries.jpg are THE SAME
// PHOTOGRAPH under two property-specific filenames — perceptual-hash
// distance 0/256 against lib/media.test.ts's own duplicate guard (which
// fails anything under 16). Curating both into lib/media-manifest.ts under
// separate ids will trip that test. Pick one property to carry the image,
// or source a genuinely distinct wildlife-documentary-night frame for the
// other.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "reference", "wp-media", "property-pages");
const BASE = "https://mahuaresorts.com/wp-content/uploads/2024/09/";

const FILES = [
  // Vann
  "JAS05303-HDR-scaled.jpg",
  "Mahua-Website-Images_Pench_Deluxe.jpg",
  "Mahua-Website-Images_Pench_Jungle-Safari.jpg",
  "Mahua-Website-Images_Pench_Kohka-Lake.jpg",
  "Mahua-Website-Images_Pench_Potters-Village.jpg",
  "Mahua-Website-Images_Pench_Dining.jpg",
  "Mahua-Website-Images_Pench_Bird-Watching.jpg",
  "Mahua-Website-Images_Pench_Wildlife-Documentaries.jpg",
  // Tola
  "TWD5337-scaled.jpg",
  "Mahua-Website-Images_Tadoba_Deluxe-room.jpg",
  "Mahua-Website-Images_Tadoba_Suite-room.jpg",
  "Mahua-Website-Images_Tadoba_Camping-hut.jpg",
  "Mahua-Website-Images_Tadoba_Tiger-safari.jpg",
  "Mahua-Website-Images_Tadoba_River-Walk.jpg",
  "Mahua-Website-Images_Tadoba_Experiences.jpg",
  "Mahua-Website-Images_Tadoba_Swimming.jpg",
  "Mahua-Website-Images_Tadoba_Wildlife-documentaries.jpg",
  "DSC00044-scaled.jpg",
  "DSC00091-scaled.jpg",
  "DSC00097-scaled.jpg",
  "DSC00122-scaled.jpg",
  // Second sweep (9 Aug 2026): every uploads/*.jpg the two crawled property
  // pages reference that neither the first fetch list nor the home page's own
  // CURATION already holds. Deliberately skipped from the same sweep:
  // Pench_Conference / Pench_Karaoke / _Indoor-and-Outdoor-Games (off-brand
  // for a page selling quiet), the location-map JPGs (spec D8 parks maps),
  // press logos, and Homepage_Pench / DSC00063 (bytes already curated by the
  // home page — a second id would trip the perceptual-hash duplicate guard).
  "JAS05372-HDR-scaled.jpg",
  "JAS05502-HDR-scaled.jpg",
  "Mahua-Website-Images_Pench_Experiences.jpg",
  "DSC09703-scaled.jpg",
  "Mahua-Website-Images_Homepage_Tadoba-1.jpg",
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const file of FILES) {
    const dest = path.join(OUT_DIR, file);
    if (existsSync(dest)) {
      console.log(`${file} — already fetched, skipped`);
      continue;
    }
    const res = await fetch(BASE + file);
    if (!res.ok) {
      console.error(`FAILED ${res.status} ${file} — this file may need a different path or is no longer live.`);
      continue;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, bytes);
    console.log(`${file} — ${bytes.length} bytes`);
  }
}

main();
