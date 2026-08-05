import { describe, expect, it } from "vitest";
import { DURATION, EASE, ENTER, IMAGE_FROM, PARALLAX_MAX, STICKY_SCREENS_MAX } from "./motion";

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

  it("inks the tiger slowly, and in waves that do not overlap", () => {
    // Slow enough to be watched — this is the one thing on the page meant to be
    // seen happening rather than found already arrived.
    expect(DURATION.tigerInk).toBeGreaterThanOrEqual(0.6);
    expect(DURATION.tigerInk).toBeLessThanOrEqual(1.4);
    // And separated, which is the fix for a measured problem: with overlapping
    // waves the drawing looked finished halfway through, because ordering by
    // stroke length puts all the visual weight in the first waves.
    expect(DURATION.tigerInkStagger).toBeGreaterThan(DURATION.tigerInk);
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
