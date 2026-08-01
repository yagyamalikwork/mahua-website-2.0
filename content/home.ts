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

export const HOME = {
  hero: {
    headline: "The wild and the calm, held together",
    sub: "Two family-run lodges at the gates of Pench and Tadoba.",
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
  placeholder: { heading: string; body: string; cta: string };
  movements: readonly MovementCopy[];
};
