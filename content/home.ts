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
  /**
   * The photograph this activity shows on its card.
   *
   * Added 16 Aug 2026 with the coverflow. **Four of the six are frames
   * `/mahua-vann` also draws** — `vann-bird-watching`, `vann-kohka-lake`,
   * `vann-potters-village` and `forest-trail-canopy`, all in that page's 4:5
   * `quiet` box — and the client saw that repeat and accepted it. Two of those
   * were corrections rather than preferences: "Kohka Lake" would have been
   * captioning the lodge's own swimming pool, and Pachdhar had no village and no
   * potter anywhere in the chapter. Three prose bands only sat a photograph
   * *near* an activity; a card puts the two in one box, which makes the pairing
   * a claim.
   *
   * **"Jungle safari" is `tiger-crossing-track` again as of 17 Aug 2026, and
   * that closes a resolution detour worth recording.** For one day it was
   * `vann-safari` — an open vehicle with no tiger in it — purely because
   * `tiger-crossing-track`'s file was 541px wide, narrower than the card it was
   * being drawn in, and so was the single photograph capping
   * `COVERFLOW.cardMaxPx` for the whole carousel. The client then re-exported
   * all six frames at 1344x685 (`scripts/build_images.mjs`), the cap moved to
   * every other frame at once, and the better photograph — a tiger crossing the
   * track in front of a vehicle of guests, which is what a jungle safari here
   * actually is — came back. `vann-safari` is curated and unused again, exactly
   * as it was before 16 Aug.
   *
   * Typed `MediaId`, not `string`, so a mistyped id is a compile error rather
   * than a `media()` throw at render — the same reason `PlateCopy` above is.
   */
  readonly mediaId: MediaId;
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
    // The wordmark in the centre of the header. The client's vector emblem is a
    // 127 KB full-colour illustration with white fills — unreadable at 24px over
    // a photograph and a sixth of the whole page budget, so the header sets the
    // name in the display serif instead (Task 7 report).
    brand: "Mahua Resorts",
    cta: "Plan your stay",
    // The menu used to be this page's own — "Menu", "The chapters", "Close",
    // "Jump to a chapter" — and lived here because there was only one page to
    // navigate. `SiteMenu` (10 Aug 2026, `docs/superpowers/plans/2026-08-10-
    // site-navigation.md` Task 3) is the *site's* menu, listing the three
    // places rather than one page's chapters, so its four strings moved to
    // `content/site.ts`'s `SITE.nav` — one source the menu and the footer
    // both read, so they can never name a place differently.
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
          href: "/mahua-vann",
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
          href: "/mahua-tola",
        },
      ],
    },

    // ── 02 · The Jungles ────────────────────────────────────────────────────
    /*
     * **Was the unnumbered pull-quote over the tiger until 19 Aug 2026.** The
     * client's own ruling keeps this exact line as the chapter's heading —
     * *"The heading is the line already there"* — so it stays under `quote`,
     * which is the key `FullBleedQuote` reads, and no word of it changes.
     *
     * `intro` is `03 · The Forest`'s own paragraph, moved here verbatim when
     * that chapter left the page. Spec §3 sets it to the right of the heading;
     * `FullBleedQuote` does not render it yet, so it is copy waiting for the
     * band that will carry it. The Forest's heading — "Three hundred birds, and
     * the cats you came for" — is deliberately NOT here: the spec drops it with
     * the section and keeps only the paragraph.
     */
    "why-you-came": {
      quote: "The forest at its most alive, and you at your most rested.",
      intro:
        "Bengal tiger and Indian leopard — and, rarely, the melanistic leopard that has made " +
        "these hills briefly famous. Beyond them: gaur, sloth bear, dhole, and some three " +
        "hundred recorded birds. Pench is the forest Kipling wrote into the Jungle Book without " +
        "ever setting foot in it; Tadoba's tiger density is among the highest in the country.",
    },

    // ── 03 · Rooted Like The Mahua ──────────────────────────────────────────
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

    // ── 04 · Mahua Philosophy ───────────────────────────────────────────────
    /*
     * **New on 19 Aug 2026, and every word of it is moved rather than written.**
     * The client: this chapter is *"an extension of an already existing
     * section"*, so it mirrors `rooted` above — same composition, opposite
     * hand — and its words are `05 · The Rooms`' own intro paragraph, carried
     * here verbatim when that chapter left the page. That paragraph's room
     * counts were reconciled on 12 Aug 2026 (twenty-six at Vann, eleven at
     * Tola, the Camping Hut retired and three machaans still being built); the
     * note that recorded the working left with the `rooms` block, and the
     * numbers here are the corrected ones.
     *
     * The heading is the chapter's own name. `Mahua` takes the dim tone, as it
     * does in `rooted`'s "Rooted like the mahua" — the two headings are a pair
     * and the brand word is the soft one in both.
     */
    philosophy: {
      heading: { text: "Mahua Philosophy", dim: "Mahua" },
      body: [
        "Twenty-six rooms at Vann, eleven at Tola — deluxe rooms, cottages, suites and a family " +
          "suite, eight of the cottages with a deck over the seasonal river. All of them " +
          "handmade in mud and local wood. Air conditioning, a tea and coffee maker, a private " +
          "vanity area; and then the doors thrown open.",
      ],
    },

    // ── 05 · Experiences ────────────────────────────────────────────────────
    // Renamed and renumbered on 19 Aug 2026 (it was `04 · Days in the Field`).
    // **Not one word below changed**, by the client's own ruling: *"We keep the
    // text and the tiger where they are and not touch them."* The six activities
    // and their photographs are re-carded in a later task; the six here are the
    // ones the coverflow still shows.
    "field-days": {
      heading: { text: "The day the forest keeps", dim: "forest" },
      /*
       * **One paragraph since 17 Aug 2026, by the client's own ruling**: *"…also
       * remove the text 'Then the day slows right down. That is the half most
       * lodges leave out.'"* It went with the four-photograph collage it was
       * written to introduce — the same ruling deleted both — so the chapter now
       * opens on the dawn gate and hands straight over to the carousel.
       *
       * `Coverflow.tsx` reads `body[0]` and nothing else. Adding a second entry
       * here will not render; the band that drew it no longer exists.
       */
      body: [
        "The gates open before the light does. We are five kilometres from Turia and among the " +
          "first vehicles through, which matters most in the hour when the forest is still " +
          "saying out loud where everything is.",
      ],
      // Six activities, six cards, and the order here is the order they travel
      // in. Each names its own photograph — see `ExperienceCopy.mediaId` above
      // for the four that `/mahua-vann` also draws — and `chapters.test.ts`
      // holds every id to one the chapter itself declares in `chapters.ts`.
      experiences: [
        {
          title: "Jungle safari",
          body:
            "Morning and evening drives in open vehicles, led by naturalists who have followed " +
            "these particular tigresses and their lineages for years.",
          // The tiger crossing the track in front of a vehicle of watching
          // guests. It was `vann-safari` — the same drive with no tiger in it —
          // for one day, while this file was 541px wide and capping the card;
          // the client's 1344x685 re-export lifted that. Guest consent for this
          // frame at card size is granted and recorded in
          // `scripts/build_images.mjs`. See `ExperienceCopy.mediaId`.
          mediaId: "tiger-crossing-track",
        },
        {
          title: "Bird watching",
          body:
            "The estate is its own reason to carry binoculars — our naturalists have recorded " +
            "species here without ever leaving it.",
          mediaId: "vann-bird-watching",
        },
        {
          title: "Kohka Lake",
          body: "An hour at the water near Pench, where the day comes down slowly and the birds come to it.",
          // Not `pool-daylight-forest`, which is the lodge's swimming pool.
          // Naming a specific lake over a photograph of a pool is a false claim
          // about a real place, and a card is where it would have been made.
          mediaId: "vann-kohka-lake",
        },
        {
          title: "The river walk",
          body:
            "At Tola, the Hattinala: flowing water, chirping, leaves turning over. Nothing scheduled.",
          mediaId: "forest-boardwalk-daylight",
        },
        {
          title: "Pachdhar, the potters' village",
          body:
            "More than a hundred Kumhar families next to Pench have kept the wheel turning. " +
            "Watch, then take a turn at it yourself.",
          // The chapter held no village and no potter at all. `potters-hands`
          // exists but belongs to `02 · Rooted`, and the page never shows one
          // photograph twice — `chapters.test.ts` enforces that.
          mediaId: "vann-potters-village",
        },
        {
          title: "Walks and cycling",
          body: "Winding trails and earthy air, at the pace the forest is actually lived at.",
          mediaId: "forest-trail-canopy",
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
      /*
       * **The guest quotes moved here on 19 Aug 2026 and are not rendered yet.**
       *
       * They were the `guests` chapter's, a band of its own between `07 · Details`
       * and this close. The client: *"later when we get the TripAdvisor API we
       * will change it to auto-scrolling reviews, but what I meant is that this
       * will be the new place for the reviews, below the two property buttons."*
       * So the chapter is gone, the three quotes are not, and their new home is
       * the foot of this section — **`components/sections/Invitation.tsx` has to
       * be taught to read them**, which is the next task's job and the reason
       * they sit here unread rather than deleted.
       *
       * The `guests` chapter's own heading ("Known by name") and its paragraph
       * did NOT move. The paragraph stated "fourteen at Tadoba", a count the
       * client corrected to eleven on 12 Aug 2026 and which had survived here
       * only because nobody re-read it; it leaves the page with its section.
       *
       * Verbatim from the Tripadvisor widget on the live site, trimmed only at
       * sentence boundaries. Nothing here is written by us, and nothing is
       * paraphrased. These are frozen copies of a live widget and should either
       * be refreshed or re-embedded before launch — which is exactly what the
       * client's own "later, the TripAdvisor API" note anticipates.
       */
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
  },
} as const satisfies {
  meta: { title: string; description: string };
  nav: {
    brand: string;
    cta: string;
  };
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
