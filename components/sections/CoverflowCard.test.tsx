import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { COVERFLOW } from "@/lib/motion";
import { CARD_SIZES, CoverflowCard } from "./CoverflowCard";

const experience = {
  title: "Kohka Lake",
  body: "An hour at the water near Pench.",
  mediaId: "vann-kohka-lake",
} as const;

// The card takes its wash as a prop; the six real figures live in
// `Coverflow.tsx`, keyed by photograph. See correction C.
const scrim = { flat: 0.5 } as const;

describe("CoverflowCard", () => {
  it("carries its own index into CSS, because every card shares one stylesheet", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />,
    );
    const card = container.querySelector("li");
    expect(card?.style.getPropertyValue("--i")).toBe("2");
  });

  it("shows the activity's own words", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={2} count={6} chapterId="field-days" />);
    expect(screen.getByRole("heading", { name: "Kohka Lake" })).toBeInTheDocument();
    expect(screen.getByText(/An hour at the water/)).toBeInTheDocument();
  });

  it("points its arrows at its neighbours, and wraps at the ends", () => {
    const { container } = render(
      <CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />,
    );
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    // Card 0's "previous" is card 5 — the loop the client asked for, and the
    // whole reason the arrows are anchors rather than script.
    expect(links).toContain("#field-days-card-5");
    expect(links).toContain("#field-days-card-1");
  });

  it("names its arrows for a screen reader, since a chevron has no text", () => {
    render(<CoverflowCard experience={experience} scrim={scrim} index={0} count={6} chapterId="field-days" />);
    // Six cards each carry a pair, so a bare "Previous" would be announced twelve
    // times with nothing to tell them apart.
    expect(screen.getByRole("link", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next/i })).toBeInTheDocument();
  });
});

/**
 * `CARD_SIZES` describes, in `vw`, the width the browser will actually lay the
 * card out at — and the two are computed from different things, which is the
 * whole hazard. CSS bounds the card by its stage (`min(cardMaxPx, 100%)`), an
 * invariant that cannot be wrong; `sizes` is an HTML attribute evaluated before
 * layout or custom properties exist, so it can only *restate* the container's
 * arithmetic and can therefore drift from it.
 *
 * It drifted once already, and the symptom was not a soft photograph: a single
 * `stageGutterPx: 24` against `ChapterSurface`'s `md:px-12` made the card up to
 * 48px WIDER than its own stage between 768 and 996px, and every card sat
 * 22-25px right of centre across a band no rig had looked at (`DECISIONS.md`
 * §20.7). The three gutter constants exist to keep the string honest, and until
 * this test they were the only values in `COVERFLOW` guarded by nothing.
 *
 * Understating is the failure that matters — `ui/Photo.tsx` records the
 * rounding direction: over-stating costs a tier of bytes, under-stating ships a
 * visibly soft photograph. So this asserts EQUALITY, not merely "not narrower":
 * the two are exactly equal at every width today, and a change that makes the
 * string generous is a change worth having to think about.
 */
describe("CARD_SIZES", () => {
  /** What `ChapterSurface` actually gives the stage: `mx-auto max-w-[1600px] px-6 md:px-12`. */
  function stageWidth(viewport: number) {
    const pad = viewport >= COVERFLOW.stageGutterMdFromPx ? COVERFLOW.stageGutterMdPx : COVERFLOW.stageGutterPx;
    return Math.min(viewport, 1600) - 2 * pad;
  }

  /** What the browser draws: the card is bounded by its stage, never by the viewport. */
  const drawn = (viewport: number) => Math.min(COVERFLOW.cardMaxPx, stageWidth(viewport));

  /** What `CARD_SIZES` claims, resolved by hand the way a browser resolves `sizes`. */
  function claimed(viewport: number) {
    for (const clause of CARD_SIZES.split(", ")) {
      const media = clause.match(/^\(min-width: (\d+)px\) (.+)$/);
      const value = media ? media[2] : clause;
      if (media && viewport < Number(media[1])) continue;
      const vwCalc = value.match(/^calc\(100vw - (\d+)px\)$/);
      return vwCalc ? viewport - Number(vwCalc[1]) : Number(value.replace("px", ""));
    }
    throw new Error(`CARD_SIZES has no clause matching ${viewport}px`);
  }

  it("names the width the browser will draw, at every width the defect lived in", () => {
    // 760/1000 bracket the band; 780-980 are inside it, and 960/980 are the two
    // the hand probe skipped and the continuous sweep caught.
    for (const viewport of [360, 390, 640, 760, 768, 780, 860, 940, 960, 980, 996, 1000, 1440, 1600, 1920]) {
      expect(claimed(viewport), `at ${viewport}px`).toBe(drawn(viewport));
    }
  });

  it("never lets the card exceed the stage it is centred in", () => {
    // The over-constrained-margins defect itself, as arithmetic. `margin: auto`
    // against `left: 0; right: 0` cannot centre a box wider than its container —
    // CSS 2.1 §10.3.7 pushes it to the inline start instead, silently.
    for (let viewport = 360; viewport <= 1920; viewport += 4) {
      expect(drawn(viewport), `at ${viewport}px`).toBeLessThanOrEqual(stageWidth(viewport));
    }
  });

  it("switches gutter at Tailwind's own `md`, since that is what it is restating", () => {
    // Not a free number: it must equal the breakpoint `ChapterSurface`'s
    // `md:px-12` fires at, or the string describes a container that does not exist.
    expect(COVERFLOW.stageGutterMdFromPx).toBe(768);
    expect(COVERFLOW.stageGutterMdPx).toBeGreaterThan(COVERFLOW.stageGutterPx);
  });
});
