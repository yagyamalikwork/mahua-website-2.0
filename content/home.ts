import type { MediaId } from "@/lib/media";
import { REVIEWS_LABEL, STRIP_LABELS } from "@/content/site";

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
  /**
   * The small word above the title — "Fireside", "Stillness", "On foot".
   *
   * **New on 19 Aug 2026 with the card strip**, and it is the reference's own
   * part: ecotriip's "Curated Group Departures" card carries a status pill above
   * its title. Ours has no status to report — nothing here is bookable, dated or
   * limited — so the pill became a plain label naming the *register* of the
   * activity rather than its availability, which is the one thing that slot can
   * honestly hold on this site.
   *
   * Required, not optional. Five of the six came from
   * `Brand&Design-Guidelines/mahua-home-v2-dusk.html` and the sixth was written
   * to match them; a card without one is a card composed differently from its
   * five neighbours, which is a decision to take on purpose rather than by
   * omitting a field.
   */
  readonly label: string;
  readonly title: string;
  readonly body: string;
  /**
   * The photograph this activity shows on its card.
   *
   * Added 16 Aug 2026 with the coverflow; **all six changed on 19 Aug 2026**
   * when the client replaced that pinned carousel with a horizontal strip of
   * tall portrait cards and named six different activities for it (spec §6).
   *
   * **Five of the six are cropped to 0.74 portrait inside the image pipeline**,
   * not by the card's box — a landscape frame in a portrait card loses 50-62% of
   * its width, which is over this project's 25% bound however it is dressed up.
   * `scripts/build_images.mjs`'s "THE PORTRAIT CROPS" note carries the
   * arithmetic and every window's reasoning; the short version is that the crop
   * is now a decision somebody made with the file open, and the render-time crop
   * is ~0%.
   *
   * **Two of the client's six named photographs are not the ones here, and both
   * substitutions are findings rather than preferences.** "Jungle Safari" was to
   * be `tiger-crossing-track`: it is 1.962:1, a portrait window keeps 37.7% of
   * its width — losing either the tiger or the vehicle — and it would draw
   * guests 2.65x larger relative to the card than the frame their consent was
   * cleared in. `tiger-golden-grass` has no people in it and was freed the same
   * day by `02 · The Jungles`. "Village Craft" IS `potters-hands` as he asked,
   * but that frame was `03 · Rooted`'s until today and this page never shows one
   * photograph twice (`content/chapters.test.ts`), so `rooted` took
   * `vann-potters-village` — the Pachdhar potters' village its own third
   * paragraph is actually about — and released this one.
   *
   * Typed `MediaId`, not `string`, so a mistyped id is a compile error rather
   * than a `media()` throw at render — the same reason `PlateCopy` above is.
   */
  readonly mediaId: MediaId;
};

/**
 * The card strip's six activities — extracted to a named export on 26 August
 * 2026, so `content/mahua-vann.ts` and `content/mahua-tola.ts` can import the
 * SAME six rather than copy them a second and third time.
 *
 * Client, 26 Aug: *"replace it with the exact same copy-pasted activities
 * carousel from our homepage … for now just place the entire carousel as it
 * is."* Both property pages keep their own heading and intro above the strip
 * (his ruling when asked — three pages opening on identical sentences is the
 * *"very wordpress and templaty"* verdict that started this whole redesign);
 * only the six cards themselves are shared, because he says the activities
 * "will be changed later" and three literal copies is three places a future
 * edit would have to remember to make. `docs/DECISIONS.md` §22.
 *
 * **This is a pure extraction — no string or value below changed.** Moving
 * the array out from under `HOME.chapters["field-days"]` and giving it a name
 * does not touch what it contains; `content/chapters.test.ts` and
 * `ExperienceStrip.test.tsx` watch the home page's own copy and layout for
 * exactly this reason, and both stayed green against this file unchanged.
 *
 * The long comment that used to introduce this array inline, kept in full
 * because every word of it is still true of what is exported here:
 *
 * Six activities, re-carded on 19 Aug 2026, in the client's own order.
 *
 * Every word below except the sixth card's sentence comes from
 * `Brand&Design-Guidelines/mahua-home-v2-dusk.html`, which is his own
 * document; "Private Bush Dinners" is his rename of its "Lantern dinners",
 * and he added Jungle Safari to that document's five and set this running
 * order himself. Nothing here is written by us — the sixth card carries
 * the *old* safari card's sentence verbatim, which is the one line that
 * survives the previous six.
 *
 * **The labels are the reference's status pill, and this site has no
 * status to put in one** — see `ExperienceCopy.label`. Five are his
 * document's; `At the gate` is ours, written to the same register and to
 * this chapter's own opening paragraph ("The gates open before the light
 * does"), which is the nearest thing to a source there was.
 *
 * **Nothing on a card is a link, and that is a decision.** The reference's
 * card ends in one because a departure has a page to go to; not one of
 * these six activities has a page, a date or a price anywhere on this
 * site, and the two lodges that run them are already the chapter after
 * next. Six links to the same two pages would be six controls that all do
 * the same not-very-much, and a link that goes nowhere is worse than no
 * link — so the card is the photograph, its label, its title and one
 * sentence, and the strip is scrolled rather than clicked through.
 *
 * Each names its own photograph; `chapters.test.ts` holds every id to one
 * the chapter itself declares in `chapters.ts`, so a card can never reach
 * for a frame the chapter has not counted. The property pages carry no
 * such guard of their own — `content/mahua-vann.test.ts` and
 * `content/mahua-tola.test.ts` instead check that `vann-day`/`tola-day`'s
 * own `media` list is exactly these six ids, in this order.
 */
export const HOME_EXPERIENCES: readonly ExperienceCopy[] = [
  {
    label: "Fireside",
    title: "Private Bush Dinners",
    body: "Tables under the trees, a fire going, the forest listening in.",
    mediaId: "bonfire-dinner",
  },
  {
    label: "Stillness",
    title: "Wellness",
    body: "Lawn yoga, pranayama and candlelit sound baths.",
    mediaId: "sound-healing",
  },
  {
    label: "After dark",
    title: "Screenings and Star Talks",
    body: "Telescopes on the lawn and wildlife documentaries under the trees.",
    // The only one of the six a portrait card fits without a crop — 900 x
    // 1350, supplied by the client for this card. Guest consent granted
    // 19 Aug 2026 after he was shown exactly which two faces are legible
    // in it; `scripts/build_images.mjs` carries that ruling in full.
    mediaId: "star-talks",
  },
  {
    label: "On foot",
    title: "Nature Walks and Birding",
    body: "Guided trails around the lodge — pugmarks, birdcalls, small dramas.",
    mediaId: "guide-sunrise",
  },
  {
    label: "Local hands",
    title: "Village Craft",
    body: "Pottery at the wheel, learnt from the villages next door.",
    // The client's own choice, and it had to be taken off `03 · Rooted
    // Like The Mahua` to be used here — see `ExperienceCopy.mediaId`. It
    // is also re-sourced from a 900px export of the same photograph,
    // because a 0.74 window of the old 700px file was 345px wide.
    mediaId: "potters-hands",
  },
  {
    label: "At the gate",
    title: "Jungle Safari",
    // The one sentence carried over from the coverflow's own six, word for
    // word: the client ruled that this chapter's text is not to be
    // touched, and the strip's brief asks for "the current safari card's
    // own words".
    body:
      "Morning and evening drives in open vehicles, led by naturalists who have followed " +
      "these particular tigresses and their lineages for years.",
    // NOT `tiger-crossing-track`, which is what his list names — a
    // portrait card cannot hold it and its guest consent is size-bound.
    // See `ExperienceCopy.mediaId`. **This substitution is his to
    // overturn**, and the cost of overturning it is a portrait re-export
    // of that frame with the vehicle and the tiger both inside a 0.74
    // window, which the original scene may not contain at all.
    mediaId: "tiger-golden-grass",
  },
] as const;

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

  /**
   * The words the card strip needs that are not a card's own — `05 ·
   * Experiences` on the home page, `03 · The Experience` on both property
   * pages.
   *
   * **Moved to `content/site.ts`'s `STRIP_LABELS` on 26 August 2026 and
   * re-exported here unchanged.** Until then this comment correctly said
   * these three strings belonged in one page's own content module because
   * only one page scrolled sideways; the client's ruling that both property
   * pages get "the exact same … activities carousel" made that false — a
   * string three pages must not be able to disagree about belongs beside
   * `SITE.nav`'s own four, not inside `content/home.ts`. Kept as a property
   * of `HOME` too so `app/page.tsx`'s existing `labels={HOME.strip}` and
   * every test written against it keep working with no edit required — one
   * value, reached two ways.
   */
  strip: STRIP_LABELS,

  /**
   * Interface furniture for the guests' reviews, not brand copy — the same
   * distinction `strip` above draws.
   *
   * **Moved to `content/site.ts`'s own `REVIEWS_LABEL` on 26 August 2026**, the
   * day `ReviewWidget` gained a second and third call site — `04 · Written
   * About` on both property pages, alongside this page's own closing chapter
   * — and a string all three must not be able to disagree about belongs beside
   * `SITE.nav`'s own four, not inside one page's content module. `region`
   * still reads as `HOME.reviews.region` below, so `Invitation.tsx`'s existing
   * call site and every test written against it keep working unchanged — one
   * value, reached two ways, exactly as `strip`/`STRIP_LABELS` above.
   */
  reviews: {
    region: REVIEWS_LABEL,
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
    // **The heading and the body are untouched**, by the client's own ruling:
    // *"We keep the text and the tiger where they are and not touch them."* The
    // six activities below them are entirely new — his own list, his own order —
    // and were re-carded later the same day when the pinned coverflow became a
    // horizontal strip.
    "field-days": {
      heading: { text: "The day the forest keeps", dim: "forest" },
      /*
       * **One paragraph since 17 Aug 2026, by the client's own ruling**: *"…also
       * remove the text 'Then the day slows right down. That is the half most
       * lodges leave out.'"* It went with the four-photograph collage it was
       * written to introduce — the same ruling deleted both — so the chapter now
       * opens on the dawn gate and hands straight over to the cards.
       *
       * `ExperienceStrip.tsx` reads `body[0]` and nothing else — as
       * `Coverflow.tsx` did before it, and for the same reason. Adding a second
       * entry here will not render; the band that drew it no longer exists.
       */
      body: [
        "The gates open before the light does. We are five kilometres from Turia and among the " +
          "first vehicles through, which matters most in the hour when the forest is still " +
          "saying out loud where everything is.",
      ],
      // **Extracted to `HOME_EXPERIENCES`, above, on 26 August 2026** — the
      // client asked for "the exact same copy-pasted activities carousel"
      // on both property pages, and an import is what keeps three copies
      // from drifting once his own "the activities will be changed later"
      // comes true. See that export's own comment for the full history;
      // nothing about these six cards changed in the move.
      experiences: HOME_EXPERIENCES,
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
       * **The three guest quotes were here until 26 August 2026.** They were verbatim
       * from the live site's Tripadvisor widget, trimmed at sentence boundaries, and
       * they were placeholders for a curated set the client was assembling.
       *
       * He supplied an Elfsight embed instead, which is a live Tripadvisor feed and
       * therefore needs no copy here at all. `ReviewCarousel`, `lib/reviews.ts`,
       * `REVIEWS` and `scripts/check_reviews.mjs` went with them — and so did the
       * open `REVIEWS.mode` question, which non-negotiable #5 was carrying a dated
       * exception for. See `docs/DECISIONS.md` §22.
       */
    },
  },
} as const satisfies {
  meta: { title: string; description: string };
  nav: {
    brand: string;
    cta: string;
  };
  strip: { region: string; hint: string; jump: string };
  reviews: { region: string };
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
