import { describe, expect, it } from "vitest";
import { media } from "./media";
import {
  COVERFLOW,
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
} from "./motion";

/**
 * This project's width-crop bound: `object-fit: cover` in a box taller than the
 * photograph may throw away at most a quarter of its width.
 *
 * It is `scripts/check_card_stack.mjs`'s assertion 6, which the coverflow's own
 * rig inherits and which `CoverflowCard`'s `CARD_BOX` was solved against. Height
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

describe("COVERFLOW", () => {
  it("never reserves more scroll than the page's own pin ceiling", () => {
    // Non-negotiable #9. `StickyScene` clamps to this; a second pinned chapter
    // that quietly reserved four screens would be exactly the paid-for empty
    // scroll that rule exists to stop.
    expect(COVERFLOW.screens).toBeLessThanOrEqual(STICKY_SCREENS_MAX);
    expect(COVERFLOW.screens).toBeGreaterThanOrEqual(1);
  });

  it("recedes a neighbour without hiding it", () => {
    // The client asked for neighbours "out of focus … behind" — behind, not gone.
    // Past this veil the photograph is a dark rectangle, which loses the depth
    // the whole effect is for.
    expect(COVERFLOW.sideVeil).toBeGreaterThan(0);
    expect(COVERFLOW.sideVeil).toBeLessThanOrEqual(0.55);
    expect(COVERFLOW.sideScale).toBeGreaterThan(0.7);
    expect(COVERFLOW.sideScale).toBeLessThan(1);
  });

  it("recedes by veil and never by opacity", () => {
    // Correction C. A card's text sits ON its own photograph, so fading the card
    // fades the type against the frame beneath it and the depth cue starts
    // fighting the legibility floor. More scrim recedes the photograph AND
    // raises cream type's contrast. This asserts the dial cannot grow the old
    // lever back by accident.
    expect(COVERFLOW).not.toHaveProperty("sideDim");
    expect(COVERFLOW).not.toHaveProperty("sideOpacity");
  });

  it("shifts a neighbour far enough to be seen past the centre card", () => {
    // Less than half a card's width and the neighbour is entirely hidden behind
    // the centre one, which is a stack, not a coverflow.
    expect(COVERFLOW.sideShiftPct).toBeGreaterThan(50);
  });

  it("keeps the stage's gutter a gutter at the viewport the client tests on", () => {
    // **The coupling the 18 Aug 2026 stage rests on, and it is not obvious.**
    // `--cf-stage-h` is `min(100svh − header, cardMaxH + 2 × gutter-y)`, so the
    // gutter is only the number it says it is while the SECOND term is the
    // smaller one. Raise `stageGutterYPx` past the cream it replaced and the
    // `min()` flips at 1440x900: the stage goes back to filling the space under
    // the header, the gutter silently becomes a remainder again, and the client's
    // *"remove some of the buffer space"* quietly un-does itself while every
    // browser assertion still passes — because a stage at `100svh − header` is a
    // perfectly valid stage.
    //
    // 107px is the header at 1440x900, measured. The rig proves the gutter holds
    // at every height from 600 to 1200 (`check_coverflow.mjs` assertion 13); this
    // is the arithmetic reason to expect it to.
    const HEADER_AT_1440 = 107;
    const cardMaxHeight = COVERFLOW.cardMaxPx * (COVERFLOW.cardBoxH / COVERFLOW.cardBoxW);
    expect(cardMaxHeight + 2 * COVERFLOW.stageGutterYPx).toBeLessThanOrEqual(900 - HEADER_AT_1440);
    // And a gutter of zero is not a gutter — the card would touch the stage's own
    // edges and, at the pin's two ends, the chapter's.
    expect(COVERFLOW.stageGutterYPx).toBeGreaterThan(0);
  });

  it("draws its photographs at exactly their own width, which is what `stay sharp` means", () => {
    // The client's ruling of 18 Aug 2026, as arithmetic. `CARD_BOX` is
    // `cardBoxW / cardBoxH` and `cardMaxPx` is the largest card the files can
    // fill; with the box equal to the photographs' own ratio the draw factor is
    // 1.000 and those two numbers are the same number. `CoverflowCard.test.tsx`
    // checks the other end of it — that the ceiling really is the library's — and
    // this checks that the two constants have not drifted apart, which is the
    // cheap half and the one that would otherwise be found in a screenshot.
    expect(COVERFLOW.cardMaxPx).toBe(COVERFLOW.cardBoxW);
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
  it("is the photograph's own box, which is the whole of the chapter's argument", () => {
    // Box aspect == image aspect is what makes `cover` crop neither axis, the
    // drawn width the element's width, and the served ratio 1.00 at 1440 — where
    // the 100svh full-bleed version it replaces drew 2,706px from a 1,440px file
    // (0.53) and put both edge cats off-screen. If the file is ever re-exported
    // at another size, these two integers move with it or the argument is gone.
    const photo = media("jungle-cats-stitch");
    expect(JUNGLE_BAND.boxW).toBe(photo.width);
    expect(JUNGLE_BAND.boxH).toBe(photo.height);
  });
});
