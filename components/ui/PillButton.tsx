/**
 * The reference's solid pill, letter-spaced small caps, generous padding.
 *
 * **The label is `--overlay` on gold, not white and not ink.** Measured with
 * `lib/contrast.ts` against `PALETTE.gold`:
 *
 * | label            | ratio  |
 * |------------------|--------|
 * | white `#FFFFFF`  | 2.97:1 |
 * | `ink`  `#31402C` | 3.73:1 |
 * | `overlay` `#232B21` | 5.00:1 |
 *
 * Both of the two the brief suggested fail 4.5:1, so the pill takes the darkest
 * warm value in the palette. That also keeps CLAUDE.md non-negotiable #7 intact —
 * gold is the *fill*, and never the colour of the letters.
 *
 * Renders an `<a>`: every use on this page goes somewhere real, either to the
 * closing chapter or out to the property's own site. Nothing here is a button
 * that does nothing.
 */
export function PillButton({
  href,
  children,
  size = "small",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  size?: "small" | "large";
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={[
        "inline-block rounded-full font-[family-name:var(--font-label)] uppercase",
        // `whitespace-nowrap` is not cosmetic: at 390px the header's three
        // columns leave the pill about 140px, and without it "Plan your stay"
        // wraps to three lines and the pill becomes a lozenge.
        //
        // Tracking is set per size below and deliberately NOT here. It used to
        // be in both places, and since two unprefixed `tracking-` utilities are
        // the same property, which one won came down to the order Tailwind
        // happened to emit them — the small variant's 0.12em never applied at
        // all, and a later attempt to tighten it made the pill *wider*.
        "whitespace-nowrap hover:opacity-90",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent-text)]",
        size === "large"
          ? "px-7 py-3.5 text-xs tracking-[0.18em] sm:px-9 sm:py-4 sm:text-sm short:px-7 short:py-3 short:text-xs"
          : // Tracking eases in below 360px. "Plan your stay" is fourteen
            // characters, so 0.18em of letter-spacing is ~24px of pure air —
            // and on a 320px phone that air was the difference between the
            // header's three items fitting and the brand lockup touching the
            // pill. Nothing else about the pill changes.
            "px-4 py-2.5 text-[0.6rem] tracking-[0.06em] min-[360px]:tracking-[0.12em] sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.18em]",
      ].join(" ")}
      style={{ backgroundColor: "var(--accent)", color: "var(--overlay)" }}
    >
      {children}
    </a>
  );
}
