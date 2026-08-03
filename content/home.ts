import type { MediaId } from "@/lib/media";

/**
 * THE DIAL for copy. Every word on the page lives here, so text edits never touch layout
 * (spec section 6.2). Shaped to slot into Sanity later without redesign (spec D9).
 *
 * Voice: drafted from Mahua_Resorts_Master_Brand_Record.md. British spelling.
 * Specificity is the brand's luxury — name a gate, a tigress, a tree, a dish.
 */

/**
 * A single numbered plate's caption, keyed to a specific photograph. `mediaId` is
 * typed against `MediaId` rather than left as a bare string, so a movement
 * component and its copy can never reference two different photographs by
 * accident — the plate a component renders and the caption it looks up are
 * guaranteed to describe the same file.
 */
export type PlateCopy = {
  readonly mediaId: MediaId;
  readonly plate: string;
  readonly caption: string;
};

export type MovementCopy = {
  readonly id: string;
  readonly chapter: string;
  readonly heading: string;
  readonly body: string;
  readonly plates?: readonly PlateCopy[];
};

const HERO_HEADLINE = "The wild and the calm, held together";

export const HOME = {
  hero: {
    headline: HERO_HEADLINE,
    sub: "Two family-run lodges at the gates of Pench and Tadoba.",
  },
  // Every <title>/<meta description> on the site, so the two most externally
  // visible strings on the site sit under the house-style guard like everything
  // else, instead of being hard-coded per-page and free to drift (spec section 6.2).
  meta: {
    title: `Mahua Resorts — ${HERO_HEADLINE}`,
    // Longer than hero.sub on purpose — a search-result description earns its
    // extra clause ("tiger country") that a one-line on-page sub-headline doesn't.
    description:
      "Two family-run lodges at the gates of Pench and Tadoba, in central India's tiger country.",
    homeTitle: "Mahua Resorts — early build",
    previewTitle: "Light states — Mahua Resorts",
  },
  // Provisional prose for Plan 2 (drawn from spec section 3); Plan 3 owns the
  // final copy pass, including how this content maps onto the rebuilt page
  // (the day-arc's dawn-to-night band order this list used to follow was
  // retired 3 Aug 2026 along with content/movements.ts).
  movements: [
    {
      id: "dawn",
      chapter: "Before dawn",
      heading: "The mahua falls",
      body:
        "Each spring, before first light, the mahua drops its cream-coloured flowers until the forest " +
        "floor lies carpeted in pale blossom. Chital, sloth bear and a hundred smaller lives gather " +
        "beneath it. We took our name from that tree.",
    },
    {
      id: "firstLight",
      chapter: "First light",
      heading: "Five kilometres to Turia Gate",
      body:
        "We are five kilometres from Turia Gate and among the first vehicles through it. Our " +
        "naturalists have followed these particular tigresses for years — their territories, their " +
        "cubs, the trails they favour before the heat sets in.",
      plates: [
        {
          mediaId: "guide-sunrise",
          plate: "1",
          caption: "A naturalist scans the canopy for movement before the gate opens.",
        },
      ],
    },
    {
      id: "midMorning",
      chapter: "Mid-morning",
      heading: "The residents",
      body:
        "Bengal tiger, Indian leopard, and — rarer — the melanistic leopard that has made these hills " +
        "briefly famous. Beyond the cats: gaur, sloth bear, dhole, and some three hundred recorded " +
        "birds, each one a reason to keep the binoculars close.",
      plates: [
        { mediaId: "tiger-yawning", plate: "2", caption: "Bengal tiger — Panthera tigris tigris." },
        { mediaId: "leopard-on-rock", plate: "3", caption: "Indian leopard — Panthera pardus fusca." },
        {
          mediaId: "melanistic-leopard",
          plate: "4",
          caption: "The melanistic leopard, seen rarely and photographed less.",
        },
      ],
    },
    {
      id: "afternoon",
      chapter: "Afternoon",
      heading: "Two lodges, two forests",
      body:
        "Mahua Vann sits five kilometres from Turia Gate at Pench: twenty-six mud-plastered cottages " +
        "under sal and mahua trees. Mahua Tola stands at Kolara Gate, Tadoba: fourteen rooms, several " +
        "on river-facing machaans, built for a forest that changes with every dry season.",
      plates: [
        {
          mediaId: "mahua-vann-room",
          plate: "5",
          caption: "Mahua Vann, Pench — twenty-six rooms, five kilometres from Turia Gate.",
        },
        {
          mediaId: "mahua-tola-suite",
          plate: "6",
          caption: "Mahua Tola, Tadoba — fourteen rooms at Kolara Gate, several river-facing.",
        },
      ],
    },
    {
      id: "lateAfternoon",
      chapter: "Late afternoon",
      heading: "Rooted like the mahua",
      body:
        "To the Gond and other Adivasi communities of these forests, the mahua is kalpavriksha — the " +
        "wish-fulfilling tree. We build in the vernacular, hire from the villages around us, and cook " +
        "what the season gives: rooted in this soil, the way the tree we are named for is rooted in it.",
      plates: [
        {
          mediaId: "potters-hands",
          plate: "7",
          caption: "Clay worked by hand in the village beyond the gate.",
        },
      ],
    },
    {
      id: "dusk",
      chapter: "Dusk",
      heading: "The ritual",
      body:
        "On full-moon nights, we gather for breathwork and intention-setting, then a diya set afloat " +
        "with water and flowers. Mahua Kheer simmers on the open chula while the lanterns come on " +
        "along the veranda.",
      plates: [
        {
          mediaId: "sound-healing",
          plate: "8",
          caption: "Breathwork and singing bowls, before the ritual begins.",
        },
        { mediaId: "bonfire-dinner", plate: "9", caption: "Mahua Kheer, cooked on the open chula." },
      ],
    },
    {
      id: "night",
      chapter: "Night",
      heading: "The lanterns are already lit",
      body:
        "A telescope wheeled onto the lawn, and someone to tell you what you are looking at. " +
        "Five kilometres away, the forest carries on without us.",
    },
  ],
} as const satisfies {
  hero: { headline: string; sub: string };
  meta: { title: string; description: string; homeTitle: string; previewTitle: string };
  movements: readonly MovementCopy[];
};

/**
 * The single accessor for a movement's copy, mirroring `media()` elsewhere —
 * throws on a miss rather than handing a component `undefined` and letting a
 * missing heading surface as a blank patch of page.
 */
export function movementCopy(id: string): MovementCopy {
  const found = HOME.movements.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown movement id: ${id}`);
  return found;
}
