import { describe, expect, it } from "vitest";
import { media } from "./media";
import {
  DURATION,
  EASE,
  ENTER,
  IMAGE_FROM,
  JUNGLE_BAND,
  LIVING,
  LODGE_PANELS,
  PARALLAX_MAX,
  ROOM_STACK,
  STICKY_SCREENS_MAX,
  STRIP,
} from "./motion";

/**
 * This project's width-crop bound: `object-fit: cover` in a box taller than the
 * photograph may throw away at most a quarter of its width.
 *
 * It is `scripts/check_card_stack.mjs`'s assertion 6, which the strip's own
 * rig inherits and which `ExperienceCard`'s `CARD_BOX` is measured against —
 * though not SOLVED against, and that difference is 19 Aug 2026's whole finding:
 * no portrait box can hold this strip's photographs inside the bound, so the
 * crops are made by hand in `scripts/build_images.mjs` and the box is their
 * shape rather than the other way round. Height
 * crop is unbounded by the same convention — a box WIDER than the photograph
 * crops its top and bottom, and no rule on this project limits that.
 */
const MAX_WIDTH_CROP = 0.25;

describe("the motion laws (spec section 4.3)", () => {
  it("keeps reveals between 800ms and 1400ms", () => {
    expect(DURATION.reveal).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.reveal).toBeLessThanOrEqual(1.4);
    expect(DURATION.revealSlow).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.revealSlow).toBeLessThanOrEqual(1.4);
  });

  it("caps parallax at 15%", () => {
    expect(PARALLAX_MAX).toBeLessThanOrEqual(0.15);
  });

  // "still develops the legacy reveal rather than sliding it" lived here until
  // 5 Aug 2026 and went with `REVEAL_FROM` and `components/motion/Reveal.tsx`,
  // which was its only consumer. Law 2 is not unguarded by the deletion: the
  // two remaining entrance vocabularies are checked for a lateral offset by
  // "never slides a photograph in laterally either" below and by "never slides
  // laterally" in the ENTER block.

  it("turns the emblem once, slowly, and never on a loop", () => {
    // `logoRotation: 75` — one revolution every seventy-five seconds, forever —
    // was replaced on 5 Aug 2026 when the client narrowed the idea to "once on
    // load, then still". This guards the shape that actually ships: long enough
    // that the turn is felt rather than seen (law 4), short enough that it is
    // over before a visitor could start scrolling and find the mark still
    // moving. A permanent loop cannot be expressed by this token at all, which
    // is the point — the CSS that reads it declares one iteration.
    expect(DURATION.emblemTurn).toBeGreaterThanOrEqual(1.5);
    expect(DURATION.emblemTurn).toBeLessThanOrEqual(4);
    expect(DURATION, "a permanent logo spin crept back in").not.toHaveProperty("logoRotation");
  });

  it("keeps the image mask within the reveal range", () => {
    expect(DURATION.imageMask).toBeGreaterThanOrEqual(0.8);
    expect(DURATION.imageMask).toBeLessThanOrEqual(1.4);
  });

  it("staggers headline lines slowly enough to read as one movement", () => {
    expect(DURATION.lineStagger).toBeGreaterThan(0.04);
    expect(DURATION.lineStagger).toBeLessThan(0.15);
  });

  it("staggers stacked paragraphs and quotes slowly enough to read as one movement", () => {
    expect(DURATION.stagger).toBeGreaterThan(0.02);
    expect(DURATION.stagger).toBeLessThan(0.15);
  });

  it("keeps the two-column stagger shorter than the stacked one", () => {
    // Distinct on purpose — see the comment on `columnStagger`. This guards
    // against a future edit quietly collapsing the two intervals into one,
    // which would be exactly the kind of flattening that changes how a section
    // feels without anyone deciding it should.
    expect(DURATION.columnStagger).toBeGreaterThan(0.02);
    expect(DURATION.columnStagger).toBeLessThan(DURATION.stagger);
  });

  it("delays a following photograph behind the thing it follows, and keeps the inlay and the aside distinct", () => {
    expect(DURATION.imageInlayDelay).toBeGreaterThan(0);
    expect(DURATION.imageInlayDelay).toBeLessThan(DURATION.imageMask);
    expect(DURATION.imageAsideDelay).toBeGreaterThan(0);
    expect(DURATION.imageAsideDelay).toBeLessThan(DURATION.imageInlayDelay);
  });

  it("settles images downward in scale, never upward", () => {
    expect(IMAGE_FROM.scale).toBeGreaterThan(1);
    expect(IMAGE_FROM.scale).toBeLessThanOrEqual(1.12);
  });

  it("never slides a photograph in laterally either", () => {
    // Law 2 is a law about all entrances, not just `REVEAL_FROM`'s. Without this
    // the sibling token is free to grow an `x` that the suite would not notice.
    expect(IMAGE_FROM).not.toHaveProperty("x");
    expect(IMAGE_FROM).not.toHaveProperty("y");
  });

  it("keeps a pinned scene's rope short", () => {
    // A pinned section reserves scroll height a number chose rather than the
    // content — the construct that made the rejected build sparse. Three screens
    // is already generous; more is a section padding itself out.
    expect(STICKY_SCREENS_MAX).toBeGreaterThanOrEqual(1);
    expect(STICKY_SCREENS_MAX).toBeLessThanOrEqual(3);
  });

  it("answers a hover faster than anything arrives on its own", () => {
    // A hover is an answer to something the visitor just did; an entrance arrives
    // by itself and may be unhurried. An answer that takes as long as an arrival
    // reads as lag rather than as restraint, which is law 4 pointing the other
    // way for once — this is the one movement on the page that may be noticed,
    // because being noticed is its entire job.
    expect(DURATION.ruleIn).toBeGreaterThan(0.2);
    expect(DURATION.ruleIn).toBeLessThan(0.5);
    expect(DURATION.ruleIn).toBeLessThan(ENTER.duration);
  });

  it("inks the tiger as one continuous hand, never in batches", () => {
    // Slow enough to be watched — this is the one thing on the page meant to be
    // seen happening rather than found already arrived.
    expect(DURATION.tigerInk).toBeGreaterThanOrEqual(0.4);
    expect(DURATION.tigerInk).toBeLessThanOrEqual(1.4);

    // **The stagger must be far shorter than the stroke**, so strokes overlap and
    // there is never a frame with nothing being drawn.
    //
    // This assertion previously demanded the opposite, and shipped the defect it
    // was written to prevent. Separating the waves did fix the front-loading it
    // targeted, but it left ~0.15s of dead air eight times over — measured frame
    // by frame as twenty strokes drawing, then zero, then twenty more. The client
    // called it jittery on sight.
    expect(DURATION.tigerInkStagger).toBeLessThan(DURATION.tigerInk / 4);

    // Roughly this many strokes are mid-draw at any moment. Below about four the
    // drawing thins out into a queue; far above twenty it stops reading as
    // individual lines at all.
    const concurrent = DURATION.tigerInk / DURATION.tigerInkStagger;
    expect(concurrent).toBeGreaterThan(4);
    expect(concurrent).toBeLessThan(24);

    // A short mark still has to be seen being made, not blinked into place.
    expect(DURATION.tigerInkFloor).toBeGreaterThan(0.1);
    expect(DURATION.tigerInkFloor).toBeLessThan(DURATION.tigerInk);
  });

  it("gives the tiger's two movements beats that cannot sync into a pulse", () => {
    // Two things on the same beat read as a mechanism; on unrelated beats they
    // read as an animal. Asserted rather than eyeballed, because an edit that
    // made one a multiple of the other would produce a pulse nobody would think
    // to look for.
    const ratio = Math.max(LIVING.breath, LIVING.blink) / Math.min(LIVING.breath, LIVING.blink);
    expect(Math.abs(ratio - Math.round(ratio))).toBeGreaterThan(0.08);
  });

  it("lives long enough to be seen, then dozes", () => {
    // Every cycle must fit inside the phase, or a part would be cut off
    // mid-movement when the eyes close.
    expect(LIVING.phase).toBeGreaterThan(LIVING.breath * 3);
    expect(LIVING.phase).toBeGreaterThan(LIVING.blink * 3);
    // And it must end. A living phase with no end is the permanent peripheral
    // motion non-negotiable #5 exists to forbid.
    expect(LIVING.phase).toBeLessThanOrEqual(60);
  });

  it("nothing bounces", () => {
    const banned = /(elastic|bounce|back)/i;
    for (const [name, ease] of Object.entries(EASE)) {
      expect(banned.test(ease), `EASE.${name} = "${ease}" overshoots`).toBe(false);
    }
  });

  it("keeps one entrance curve for the whole page", () => {
    // `EASE.settle` (power2.out) was `SplitLines`' entrance curve while every
    // other entrance used `ENTER.ease`. A quarter of the way through, the two
    // have travelled ~76% and ~58% — a headline and the photograph beside it
    // arriving on visibly different curves, which is the opposite of restraint
    // (CLAUDE.md non-negotiable #4). `EASE` is now for scrubbed work only, and a
    // scrub that eases twice reads as lag, so `none` is the only member.
    expect(EASE).not.toHaveProperty("settle");
    expect(Object.values(EASE), "an entrance curve crept back into EASE").toEqual(["none"]);
  });
});

describe("the entrance vocabulary (ENTER)", () => {
  it("rises by the amount the reference site actually rises", () => {
    // Measured on thesujanlife.com, 5 Aug 2026: live elements sat at
    // translateY 14.1px and 17.9px. 16px is between them. This is the whole of
    // the "3D raise" — the reference has `perspective: none` everywhere.
    const px = Number(ENTER.rise.replace("px", ""));
    expect(px).toBeGreaterThanOrEqual(12);
    expect(px).toBeLessThanOrEqual(20);
  });

  it("scales by a whisper, never a zoom", () => {
    // The reference measured 1.0013. Anything the eye can name as a zoom is
    // the gimmick spec section 4.3 law 2 exists to forbid.
    expect(ENTER.scale).toBeGreaterThan(0.98);
    expect(ENTER.scale).toBeLessThan(1);
  });

  it("never slides laterally", () => {
    // The law that survives: a vertical settle is developing, a horizontal
    // one is flying in. `rise` is the only offset this vocabulary has.
    expect(Object.keys(ENTER)).not.toContain("x");
    expect(ENTER.rise).toMatch(/^\d+px$/);
  });

  it("decelerates and never overshoots", () => {
    // A cubic-bezier whose second control point sits at or above y=1 comes to
    // rest from above — a bounce by another name.
    const m = ENTER.ease.match(/cubic-bezier\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
    expect(m, `ENTER.ease must be a cubic-bezier, got ${ENTER.ease}`).not.toBeNull();
    expect(Number(m![4])).toBeLessThanOrEqual(1);
  });

  it("staggers slowly enough to read as one movement", () => {
    expect(ENTER.stagger).toBeGreaterThan(0.04);
    expect(ENTER.stagger).toBeLessThan(0.15);
  });

  it("holds the entrance inside the same duration range as every other reveal", () => {
    // ENTER.duration is a second dial for the same law DURATION.reveal is
    // guarded by ("keeps reveals between 800ms and 1400ms"). Two dials for one
    // law is exactly how a page ends up with one entrance that feels expensive
    // and another that feels cheap.
    expect(ENTER.duration).toBeGreaterThanOrEqual(0.8);
    expect(ENTER.duration).toBeLessThanOrEqual(1.4);
  });
});

describe("ROOM_STACK", () => {
  it("reserves more than the booking bar's measured height", () => {
    // Measured 11 Aug 2026 on both routes: 63px at 390, 69px at 768 and up.
    // `scripts/check_card_stack.mjs` re-measures the real bar and fails if it
    // ever grows past this; this test only guards the constant's intent.
    expect(ROOM_STACK.barReserve).toBeGreaterThanOrEqual(69);
  });

  it("recedes a covered card without hiding it", () => {
    expect(ROOM_STACK.scaleMin).toBeGreaterThan(0.85);
    expect(ROOM_STACK.scaleMin).toBeLessThan(1);
    // Dim, not vanish: a card the visitor can no longer see is a card that
    // stopped being a deck and started being a disappearance.
    expect(ROOM_STACK.dim).toBeGreaterThan(0.35);
    expect(ROOM_STACK.dim).toBeLessThan(1);
  });

  it("keeps a four-card deck inside the tightest measured slack", () => {
    // 390x844: 844 - 75 header - 63 bar = 706px of slack.
    const SLACK_390 = 706;
    const deck = ROOM_STACK.deckStep * 3;
    expect(deck + ROOM_STACK.gutter).toBeLessThan(SLACK_390 * 0.15);
  });
});

describe("STRIP", () => {
  it("shows three whole cards and most of a fourth at the width the client tests on", () => {
    // At 1440 `ChapterSurface`'s container is 1440 − 2×48 = 1344px and a card
    // plus a gap is 360, so 3.73 fit. **The fraction is the whole point**: a card
    // breaking the container's edge is the best affordance the strip has, and an
    // exact 4.0 would hide it — which is precisely why 320 was rejected in the
    // density sweep on `STRIP.cardMaxPx`, where 1344 leaves a 4px sliver.
    const CONTAINER_AT_1440 = 1440 - 2 * 48;
    const visible = CONTAINER_AT_1440 / (STRIP.cardMaxPx + STRIP.gapPx);
    expect(visible).toBeGreaterThan(3.5);
    expect(visible).toBeLessThan(4.5);
    // The peek, in pixels: what is left of the row after the last whole card and
    // its gap. Under the gap's own width, no card pixel shows at all.
    const peek = CONTAINER_AT_1440 % (STRIP.cardMaxPx + STRIP.gapPx);
    expect(peek, "no card peeks past the container's edge at 1440").toBeGreaterThan(STRIP.gapPx);
  });

  it("leaves a card peeking past the edge of a 390px phone too", () => {
    // Below 385px the card is `78vw`, and this is what that buys at the width
    // every rig on this project measures: a 342px container, a 304px card, and
    // 38px of the next one showing. Take `cardVw` to 100 and the affordance
    // disappears at exactly the width where a visitor is most likely to think
    // the strip is a single photograph.
    const container = 390 - 2 * 24;
    const card = Math.min(STRIP.cardMaxPx, (STRIP.cardVw / 100) * 390);
    expect(card).toBeLessThan(container - 20);
  });

  it("caps the card at a width every one of its photographs can actually fill", () => {
    // **The lesson `docs/DECISIONS.md` §20.6 paid for, as an assertion.** The
    // coverflow's card was swept to the exact largest size its six files could
    // fill, and the rig that was supposed to guard it could not see past a
    // photograph already serving its widest tier. The narrowest frame in this
    // strip is `potters-hands` at 444px after its portrait crop, so a card wider
    // than that is a soft photograph on the one screen the client tests on.
    //
    // Read off the manifest rather than transcribed: these are pipeline crops,
    // and a re-cut window changes the number this depends on.
    const STRIP_FRAMES = [
      "bonfire-dinner",
      "sound-healing",
      "star-talks",
      "guide-sunrise",
      "potters-hands",
      "tiger-golden-grass",
    ] as const;
    const narrowest = Math.min(...STRIP_FRAMES.map((id) => media(id).width));
    expect(STRIP.cardMaxPx).toBeLessThanOrEqual(narrowest);
  });

  it("carries no lever the retired coverflow's dial had", () => {
    // A strip is a native scroller: the browser computes every frame of it, so
    // there is nothing here to tune. This asserts the dial cannot grow back the
    // ten properties `COVERFLOW` published — most of all `sideDim`, which
    // `docs/DECISIONS.md` §20.5 records as the "simplification" a future editor
    // reaches for and which fades type against the frame beneath it.
    for (const gone of [
      "screens",
      "sideScale",
      "sideShiftPct",
      "sideVeil",
      "sideDim",
      "stageGutterPx",
      "stageGutterYPx",
    ]) {
      expect(STRIP, `STRIP grew back COVERFLOW's \`${gone}\``).not.toHaveProperty(gone);
    }
  });
});

describe("LODGE_PANELS", () => {
  it("keeps both lodge photographs inside the 25% width-crop bound", () => {
    // The panel is taller than either photograph, so `cover` crops their WIDTH,
    // and the crop is a pure function of the two aspects. Asserted against the
    // real manifest entries rather than against the 1.5 they happen to share
    // today: the client swaps these frames, and a portrait re-export would blow
    // through the bound silently.
    const box = LODGE_PANELS.boxW / LODGE_PANELS.boxH;
    for (const id of ["vann-hero", "tola-hero"] as const) {
      const photo = media(id);
      const crop = 1 - box / (photo.width / photo.height);
      expect(crop, `${id} loses ${(crop * 100).toFixed(1)}% of its width in a ${box.toFixed(3)} box`)
        .toBeLessThanOrEqual(MAX_WIDTH_CROP);
    }
  });

  it("is a landscape box, because spec §2's 'full-height' panel is not buildable", () => {
    // The reference screenshot measures ~1.3:1 and the spec's prose says "each
    // full-height", which on a 1440x900 laptop is roughly 0.75:1 — that would
    // throw away half of each 1.5:1 hero, twice the bound above. This is the
    // assertion that stops a later reader "restoring" the spec's own words.
    expect(LODGE_PANELS.boxW / LODGE_PANELS.boxH).toBeGreaterThan(1);
  });

  it("stops stacking at a Tailwind breakpoint, since a class has to name one", () => {
    // `PANEL_SIZES` interpolates this number while the markup writes `lg:` as a
    // literal, so the two can only agree if this IS a breakpoint. 1024 is `lg`.
    expect([640, 768, 1024, 1280, 1536]).toContain(LODGE_PANELS.twoUpFromPx);
  });
});

describe("JUNGLE_BAND", () => {
  it("still records the photograph's own dimensions, which every crop figure is against", () => {
    // These two were the band's BOX until 20 Aug 2026 — box aspect equal to
    // image aspect, so `cover` cropped neither axis. They are now the reference
    // the crop is measured from: `minHeightVw` is only meaningfully "a crop of
    // 26.8%" against this photograph's own 42.4vw height at full width. If the
    // file is ever re-exported at another size, these move with it or every
    // figure quoted around them is about a photograph that no longer exists.
    const photo = media("jungle-cats-stitch");
    expect(JUNGLE_BAND.boxW).toBe(photo.width);
    expect(JUNGLE_BAND.boxH).toBe(photo.height);
  });

  it("crops the band's length and nothing else", () => {
    // The client asked for the length cropped further (20 Aug 2026) and this is
    // the assertion that the answer is a CROP rather than a squeeze: the floor
    // has to be shorter than the photograph's own height at the same width, or
    // nothing is cropped, and it has to leave the box WIDER than the photograph,
    // or `cover` starts taking the width instead — which on a stitched composite
    // with a panther at one edge and a tiger at the other loses a cat.
    const photoHeightVw = 100 / (JUNGLE_BAND.boxW / JUNGLE_BAND.boxH);
    expect(JUNGLE_BAND.minHeightVw).toBeLessThan(photoHeightVw);
    expect(100 / JUNGLE_BAND.minHeightVw).toBeGreaterThan(JUNGLE_BAND.boxW / JUNGLE_BAND.boxH);
  });

  it("costs `sizes` at an aspect no narrower than the band can ever be", () => {
    // `coverAspectFloor` is a LOWER bound on the box's aspect, not a shape: the
    // band grows past its floor wherever its own words are taller, and
    // under-stating the aspect over-states the pixels drawn, which is the
    // direction `ui/Photo.tsx` says to err in. So it must sit below the floor's
    // own aspect — above it would be an over-statement, i.e. a photograph served
    // softer than it is drawn, with no instrument in this suite able to see it.
    expect(JUNGLE_BAND.coverAspectFloor).toBeLessThan(100 / JUNGLE_BAND.minHeightVw);
  });
});
