/**
 * The dark wash between a photograph and the cream type laid on it.
 *
 * CLAUDE.md is explicit that this is the one place a dark value is allowed, and
 * equally explicit that it has to be *measured against the rendered result*
 * rather than assumed because the photograph looks dark enough. Every instance on
 * this page was sampled pixel-by-pixel from a real browser screenshot with the
 * type hidden, and the worst (brightest) pixel under each block of text is the
 * one reported — see `docs/reviews/2026-08-04-task-7/`.
 *
 * **The layers are shaped to where the text is, not spread evenly over the
 * photograph.** The first version of this was a flat wash plus a bottom
 * gradient, and the browser measurement is what killed it: a wash heavy enough
 * to carry cream type over a blown-out patch of grass (the tiger frame reads 253
 * under the quote) flattens the entire photograph to mud. A radial centred on a
 * centred quote, or a corner wedge under a bottom-left headline, buys the same
 * ratio where the letters are and leaves the rest of the frame alone.
 *
 * - `flat` — even wash; the baseline lift.
 * - `top` — the header band, against a bright sky.
 * - `bottom` — a headline standing on the floor of the frame.
 * - `centre` — a radial under centred text; the quotes and the closing chapter.
 * - `corner` — a wedge into the bottom-left, under the hero's headline block.
 *
 * They multiply rather than add: two layers at 0.4 leave 0.6 × 0.6 = 36% of the
 * photograph showing, not 20%. The per-chapter figures are chosen by raising
 * them until the *worst single pixel* under the type clears its floor — not the
 * average, and not the 99th percentile.
 *
 * Every layer is `--overlay` at an opacity, so the page still has exactly one
 * dark colour in it.
 */
export type ScrimStrength = {
  /** Even wash across the whole photograph, 0–1. */
  flat?: number;
  /** Gradient down from the top edge, 0–1. */
  top?: number;
  /** Gradient up from the bottom edge, 0–1. */
  bottom?: number;
  /** Radial wash under a centred block of text, 0–1. */
  centre?: number;
  /** Wedge into the bottom-left corner, under a headline set there, 0–1. */
  corner?: number;
};

export function Scrim({ flat = 0, top = 0, bottom = 0, centre = 0, corner = 0 }: ScrimStrength) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {flat > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--overlay)", opacity: flat }}
        />
      )}
      {centre > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 86% 82% at 50% 50%, var(--overlay) 0%, var(--overlay) 34%, transparent 100%)",
            opacity: centre,
          }}
        />
      )}
      {corner > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top right, var(--overlay) 0%, var(--overlay) 18%, transparent 68%)",
            opacity: corner,
          }}
        />
      )}
      {top > 0 && (
        <div
          // 42%, not the 30% this started at. The header sits ~6% down the
          // frame, and with a linear fade the alpha at a fixed y rises as the
          // band gets taller — so a taller band is both darker where the
          // wordmark is and gentler everywhere else. The short, hard version
          // read as a bar and still measured 3.63:1 on the wordmark.
          className="absolute inset-x-0 top-0 h-[42%]"
          style={{
            backgroundImage: "linear-gradient(to bottom, var(--overlay), transparent)",
            opacity: top,
          }}
        />
      )}
      {bottom > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 h-[72%]"
          style={{
            backgroundImage: "linear-gradient(to top, var(--overlay), transparent)",
            opacity: bottom,
          }}
        />
      )}
    </div>
  );
}
