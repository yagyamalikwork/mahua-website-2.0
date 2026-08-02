import type { LightStateId } from "@/lib/palette";

/**
 * THE DIAL for copy. Every word on the page lives here, so text edits never touch layout
 * (spec section 6.2). Shaped to slot into Sanity later without redesign (spec D9).
 *
 * Voice: drafted from Mahua_Resorts_Master_Brand_Record.md. British spelling.
 * Specificity is the brand's luxury — name a gate, a tigress, a tree, a dish.
 */
export type MovementCopy = {
  readonly id: LightStateId;
  readonly chapter: string;
  readonly heading: string;
  readonly body: string;
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
  placeholder: {
    heading: "Mahua Resorts",
    body: "This is an early build of the Mahua Resorts home page, under active construction.",
    cta: "View the light-states preview",
  },
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
  placeholder: { heading: string; body: string; cta: string };
  movements: readonly MovementCopy[];
};
