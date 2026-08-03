import type { MediaId } from "@/lib/media";

/**
 * THE DIAL for copy. Every word on the page lives here, so text edits never touch
 * layout (spec §6.2). Shaped to slot into Sanity later without redesign (spec D9).
 *
 * Sourced from `reference/site-copy.md` (the live site's own words, harvested in
 * Plan 3 Task 2) and `../Mahua_Resorts_Master_Brand_Record.md`. Keyed by chapter
 * id from `content/chapters.ts`; `content/home.test.ts` enforces the join in both
 * directions, so a chapter cannot exist without copy and a plate caption cannot
 * describe a photograph its chapter does not carry.
 *
 * Voice: British spelling. Specificity is the brand's luxury — name a gate, a
 * tigress, a tree, a dish, and do not reach for an adjective instead.
 *
 * **Every hard number here is flagged in the Task 6 report and needs the client's
 * confirmation.** The live site publishes three different distances to Turia Gate
 * and none of them is the 5 km the client gave us; treat its room counts, acreage
 * and drive times with the same suspicion (spec §12).
 */

/**
 * The reference site's signature headline: one word dropped to `dim` while the
 * rest stays `ink`. Stored as the word rather than as markup so the copy has no
 * HTML in it — the component finds and splits on `dim`, and the test guarantees
 * it is there to find, exactly once.
 */
export type TwoTone = {
  readonly text: string;
  readonly dim: string;
};

/**
 * A numbered plate's caption, keyed to a specific photograph. `mediaId` is typed
 * against `MediaId` so a caption and the plate it sits under can never drift onto
 * two different files.
 */
export type PlateCopy = {
  readonly mediaId: MediaId;
  readonly plate: string;
  readonly caption: string;
};

export type LodgeCopy = {
  readonly name: string;
  readonly place: string;
  readonly gate: string;
  readonly rooms: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
};

export type ExperienceCopy = {
  readonly title: string;
  readonly body: string;
};

export type GuestQuote = {
  readonly quote: string;
  readonly name: string;
  readonly year: string;
  readonly source: string;
};

export const HOME = {
  meta: {
    title: "Mahua Resorts — The wild and the calm, held together",
    description:
      "Two family-run lodges at the gates of Pench and Tadoba, in central India's tiger country.",
  },

  nav: {
    menu: "Menu",
    cta: "Plan your stay",
  },

  chapters: {
    // ── Hero ────────────────────────────────────────────────────────────────
    arrival: {
      // The brand vision, compressed. 35 characters, one clause, no full stop —
      // it has to sit over a photograph at display size without wrapping badly.
      headline: "The wild and the calm, held together",
      sub: "Two family-run lodges at the gates of Pench and Tadoba.",
      scrollCue: "The journey begins",
    },

    // ── 01 · The Lodges ─────────────────────────────────────────────────────
    lodges: {
      heading: { text: "Two forests, known deeply", dim: "deeply" },
      intro:
        "Mahua is deliberately small — two forests known deeply rather than many known in " +
        "passing. One at Pench, one at Tadoba, both close enough to the gate to be among the " +
        "first vehicles through it at dawn.",
      lodges: [
        {
          name: "Mahua Vann",
          place: "Pench, Madhya Pradesh",
          gate: "Five kilometres from Turia Gate",
          rooms: "Twenty-six rooms",
          body:
            "Mud-plastered cottages and raised machaans under sal and mahua, with bay windows " +
            "sized for what is outside them. The lodge sits in its own private eco park, which " +
            "the birds found long before we did.",
          cta: "Discover Mahua Vann",
          href: "https://mahuaresorts.com/resorts/mahua-vann/",
        },
        {
          name: "Mahua Tola",
          place: "Tadoba-Andhari, Maharashtra",
          gate: "Five kilometres from Kolara Gate",
          rooms: "Fourteen rooms",
          body:
            "Set along the seasonal Hattinala river, where three new river-facing machaans look " +
            "onto a stretch the dominant male, Xylo, still walks. Raw forest, and very little " +
            "standing between you and it.",
          cta: "Discover Mahua Tola",
          href: "https://mahuaresorts.com/resorts/mahua-tola/",
        },
      ],
    },

    // ── Pull-quote over the tiger ───────────────────────────────────────────
    "why-you-came": {
      quote: "The forest at its most alive, and you at your most rested.",
    },

    // ── 02 · Rooted like the mahua ──────────────────────────────────────────
    rooted: {
      heading: { text: "Rooted like the mahua", dim: "mahua" },
      body: [
        "Each spring, before first light, Madhuca longifolia drops its cream-coloured flowers " +
          "until the forest floor lies carpeted in pale blossom — and the forest comes to feed. " +
          "Chital, sloth bear and a hundred smaller lives gather beneath it. We took our name " +
          "from that tree.",
        "To the Gond and other Adivasi communities of these forests the mahua is kalpavriksha, " +
          "the wish-fulfilling tree. It gave oil for lamps, leaves for plates, medicine and " +
          "vessel, and it is never felled — local gods are placed high in its branches so that " +
          "no one would dare.",
        "So we build in the vernacular, hire from the villages around us, and cook what the " +
          "season gives. At Pachdhar, a village adjoining Pench, more than a hundred Kumhar " +
          "families have kept the potter's wheel turning. You can sit down at one.",
      ],
    },

    // ── 03 · The Forest ─────────────────────────────────────────────────────
    forest: {
      heading: { text: "Three hundred birds, and the cats you came for", dim: "cats" },
      intro:
        "Bengal tiger and Indian leopard — and, rarely, the melanistic leopard that has made " +
        "these hills briefly famous. Beyond them: gaur, sloth bear, dhole, and some three " +
        "hundred recorded birds. Pench is the forest Kipling wrote into the Jungle Book without " +
        "ever setting foot in it; Tadoba's tiger density is among the highest in the country.",
      plates: [
        {
          mediaId: "tiger-pair-profile",
          plate: "I",
          caption: "Bengal tiger — Panthera tigris tigris. A second cat passes just behind.",
        },
        {
          mediaId: "leopard-on-rock",
          plate: "II",
          caption: "Indian leopard — Panthera pardus fusca.",
        },
        {
          mediaId: "melanistic-leopard",
          plate: "III",
          caption: "The melanistic leopard, seen rarely and photographed less.",
        },
      ],
    },

    // ── 04 · Days in the Field ──────────────────────────────────────────────
    "field-days": {
      heading: { text: "The day the forest keeps", dim: "forest" },
      body: [
        "The gates open before the light does. We are five kilometres from Turia and among the " +
          "first vehicles through, which matters most in the hour when the forest is still " +
          "saying out loud where everything is.",
        "Then the day slows right down. That is the half most lodges leave out.",
      ],
      experiences: [
        {
          title: "Jungle safari",
          body:
            "Morning and evening drives in open vehicles, led by naturalists who have followed " +
            "these particular tigresses and their lineages for years.",
        },
        {
          title: "Bird watching",
          body:
            "The estate is its own reason to carry binoculars — our naturalists have recorded " +
            "species here without ever leaving it.",
        },
        {
          title: "Kohka Lake",
          body: "An hour at the water near Pench, where the day comes down slowly and the birds come to it.",
        },
        {
          title: "The river walk",
          body:
            "At Tola, the Hattinala: flowing water, chirping, leaves turning over. Nothing scheduled.",
        },
        {
          title: "Pachdhar, the potters' village",
          body:
            "More than a hundred Kumhar families next to Pench have kept the wheel turning. " +
            "Watch, then take a turn at it yourself.",
        },
        {
          title: "Walks and cycling",
          body: "Winding trails and earthy air, at the pace the forest is actually lived at.",
        },
      ],
    },

    // ── 05 · The Rooms ──────────────────────────────────────────────────────
    rooms: {
      heading: { text: "Rooms with the forest left in", dim: "forest" },
      intro:
        "Twenty-six rooms at Vann, fourteen at Tola — deluxe rooms, cottages, suites and a " +
        "camping hut, eight of the cottages with a deck over the seasonal river. All of them " +
        "handmade in mud and local wood. Air conditioning, a tea and coffee maker, a private " +
        "vanity area; and then the doors thrown open.",
      plates: [
        {
          mediaId: "room-open-to-bamboo",
          plate: "I",
          caption: "Terracotta beams, and doors that open onto a wall of bamboo.",
        },
        {
          mediaId: "suite-tiger-painting",
          plate: "II",
          caption: "A suite with the glass folded back to the trees.",
        },
        {
          mediaId: "room-hanging-chair-view",
          plate: "III",
          caption: "A private balcony, and a cane chair hung among the branches.",
        },
        {
          mediaId: "hanging-chair-forest-deck",
          plate: "IV",
          caption: "A deck over the stream, for the part of the day nobody schedules.",
        },
      ],
    },

    // ── Pull-quote over the lodge at night ──────────────────────────────────
    "after-dark": {
      quote: "By the time you come back, the lanterns are already lit.",
    },

    // ── 06 · The Lantern Hour ───────────────────────────────────────────────
    "lantern-hour": {
      heading: { text: "The other half of the day", dim: "other" },
      body: [
        "Most jungle lodges make you choose between the intensity of the safari and the " +
          "softness of a retreat. The same day holds both here: the alarm call at dawn and the " +
          "slow afternoon, the tracker's focus and the wanderer's ease.",
        "On full-moon nights we gather for breathwork and intention-setting, then a diya set " +
          "afloat with water and flowers. Mahua Kheer simmers on the open chula; the Chulai ki " +
          "Bhaaji came out of a field nearby this morning. Later somebody wheels a telescope " +
          "onto the lawn and stays out to tell you what you are looking at.",
      ],
    },

    // ── 07 · Details ────────────────────────────────────────────────────────
    details: {
      heading: { text: "The small things, which are the whole thing", dim: "small" },
      intro:
        "A welcome inked by hand on a leaf. Petals in a stone bowl. Incense at a shrine that " +
        "was not put there for guests. What we are actually trying to do is meet the need " +
        "before it is spoken.",
      plates: [
        {
          mediaId: "petal-bowl-map",
          plate: "I",
          caption: "Rose petals in a stone bowl, before a hand-painted map of the forest.",
        },
        {
          mediaId: "veranda-through-leaves",
          plate: "II",
          caption: "Rattan and lamplight, glimpsed through the leaves.",
        },
        {
          mediaId: "lily-pond-fountain",
          plate: "III",
          caption: "Water lilies crowding a stone fountain.",
        },
        {
          mediaId: "geese-garden-pond",
          plate: "IV",
          caption: "Geese crossing the garden pond, under the overhanging leaves.",
        },
      ],
    },

    // ── Guests ──────────────────────────────────────────────────────────────
    guests: {
      heading: { text: "Known by name", dim: "name" },
      body: [
        "Small enough that everyone is — twenty-six rooms at Pench, fourteen at Tadoba, and a " +
          "family who have run them since the first one opened. More than one guest writing " +
          "about a stay here mentions Shukla ji by name.",
      ],
      // Verbatim from the Tripadvisor widget on the live site, trimmed only at
      // sentence boundaries. Nothing here is written by us, and nothing is
      // paraphrased. See the Task 6 report: these are frozen copies of a live
      // widget and should either be refreshed or re-embedded before launch.
      quotes: [
        {
          quote: "The place is secluded and gives you a feel of actually being in the jungle.",
          name: "Saurav R",
          year: "2021",
          source: "Tripadvisor",
        },
        {
          quote:
            "One of the best forests for seeing tigers and one of the best resorts to stay in Tadoba.",
          name: "Vedant",
          year: "2019",
          source: "Tripadvisor",
        },
        {
          quote:
            "Spacious rooms and bathrooms. Food is very good and the staff is very helpful and courteous.",
          name: "Amit Pednekar",
          year: "2020",
          source: "Tripadvisor",
        },
      ],
    },

    // ── The close ───────────────────────────────────────────────────────────
    invitation: {
      heading: { text: "Two forests are expecting you", dim: "expecting" },
      body: [
        "The park opens on the first of October and closes at the end of June. December and " +
          "January fill first. April and May are when the cats are easiest to find. The green " +
          "season, when the forest is still wet and the vehicles are few, is the one we would " +
          "choose.",
        "Write to us and we will tell you honestly which of the two is right for what you want.",
      ],
      cta: "Plan your stay",
      href: "https://mahuaresorts.com/",
    },
  },
} as const satisfies {
  meta: { title: string; description: string };
  nav: { menu: string; cta: string };
  chapters: Record<
    string,
    {
      heading?: TwoTone;
      headline?: string;
      sub?: string;
      scrollCue?: string;
      quote?: string;
      intro?: string;
      body?: string | readonly string[];
      plates?: readonly PlateCopy[];
      lodges?: readonly LodgeCopy[];
      experiences?: readonly ExperienceCopy[];
      quotes?: readonly GuestQuote[];
      cta?: string;
      href?: string;
    }
  >;
};

export type ChapterCopyKey = keyof typeof HOME.chapters;

/**
 * The single accessor for a chapter's copy, mirroring `media()` and `chapter()` —
 * throws on a miss rather than handing a component `undefined` and letting a
 * missing heading surface as a blank patch of page.
 */
export function chapterCopy<K extends ChapterCopyKey>(id: K): (typeof HOME.chapters)[K] {
  const found = HOME.chapters[id];
  if (!found) throw new Error(`No copy for chapter id: ${id}`);
  return found;
}
