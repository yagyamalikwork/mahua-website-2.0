import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb } from "./contrast";
import { PALETTE } from "./palette";

const HEX = /^#[0-9A-F]{6}$/;

describe("PALETTE", () => {
  it("uses uppercase 6-digit hex for every token", () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).toMatch(HEX);
    }
  });

  it("stays warm — red is never below blue", () => {
    // The client's standing constraint. A cold value anywhere drains the warmth
    // the whole brand rests on.
    for (const [name, value] of Object.entries(PALETTE)) {
      const [r, , b] = hexToRgb(value);
      expect(r, `${name} (${value}) is cold`).toBeGreaterThanOrEqual(b);
    }
  });

  it("clears 4.5:1 for body text and links on both paper surfaces", () => {
    for (const surface of [PALETTE.paper, PALETTE.paperDeep]) {
      expect(contrastRatio(PALETTE.ink, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(PALETTE.goldText, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for dim secondary text on both paper surfaces", () => {
    // `paperDeep` was added to this assertion on 4 Aug 2026. It had been guarded
    // on `paper` only, from when `paperDeep` was an unused second surface — but
    // Task 7's `ChapterSurface` alternates the two creams across the cream
    // chapters, and `dim` carries the intro paragraph in five of them. It
    // measures 5.84:1 and always did; the point is that nothing was checking.
    // CLAUDE.md: contrast is checked by test, not by eye.
    for (const surface of [PALETTE.paper, PALETTE.paperDeep]) {
      expect(contrastRatio(PALETTE.dim, surface), `dim on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears 4.5:1 for the pill's label on gold", () => {
    // `ui/PillButton.tsx` fills with `gold` and sets its label in `overlay`,
    // because the two the brief proposed both fail: white measures 2.97:1 and
    // `ink` 3.73:1. That measurement lived only in a comment, so the pairing it
    // justifies could have been changed back with nothing to object. 5.00:1.
    expect(contrastRatio(PALETTE.overlay, PALETTE.gold)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the brand brown legible on both paper surfaces", () => {
    // The wordmark colour from the client's own logo, sampled from the vector
    // rather than eyedropped from a screenshot. It is the header's scrolled
    // state, so it is body-weight type on cream and takes the 4.5:1 floor.
    expect(contrastRatio(PALETTE.brand, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.brand, PALETTE.paperDeep)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the Website Directory legible on the brand brown", () => {
    // The brown stopped being only a *type* colour on 11 Aug 2026, when the
    // client asked for the footer's background to be the brown of his logo's
    // wordmark. It is now a SURFACE as well, and a surface has to be guarded
    // from the other side — every earlier assertion in this file measures the
    // brown as ink on cream, and not one of them would have objected to
    // unreadable text laid on top of it.
    //
    // The two that carry the footer: `paper` for anything read or clicked,
    // `paperDeep` for the quieter second rank.
    expect(contrastRatio(PALETTE.paper, PALETTE.brand)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(PALETTE.paperDeep, PALETTE.brand)).toBeGreaterThanOrEqual(4.5);

    // And the two that are deliberately NOT used there, asserted as failures so
    // the reason is a measurement rather than a memory. `dim` was the footer's
    // secondary text and `goldText` its labels while it sat on cream; carrying
    // either across to the brown unchanged is the obvious mistake, and it would
    // have shipped looking approximately fine.
    expect(contrastRatio(PALETTE.dim, PALETTE.brand)).toBeLessThan(4.5);
    expect(contrastRatio(PALETTE.goldText, PALETTE.brand)).toBeLessThan(4.5);
  });

  it("keeps the brand's brown and our gold text colour apart", () => {
    // They look alike and they are not the same decision. `goldText` is ours,
    // invented so a gold-*looking* link stays legible; `brand` is the client's
    // own ink, lifted off their vector, and the header wears it because it is
    // theirs. Collapsing the two would silently repaint the wordmark in a colour
    // the brand never chose — and nothing else here would object.
    expect(PALETTE.brand).not.toBe(PALETTE.goldText);
  });

  it("keeps gold decorative — it is not required to pass as text", () => {
    // `gold` is for rules, ornaments and the emblem. `goldText` is the legible
    // sibling. Asserting gold passes would be wrong; asserting the pair differ
    // stops someone collapsing them later.
    expect(PALETTE.gold).not.toBe(PALETTE.goldText);
  });
});
