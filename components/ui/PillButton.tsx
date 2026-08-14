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
  raise = false,
}: {
  href: string;
  children: React.ReactNode;
  size?: "small" | "large";
  external?: boolean;
  /**
   * The menu tiles' 3D raise, on the pill itself — client request, 15 Aug 2026,
   * for the two lodge buttons that close the home page.
   *
   * Off by default. The header's pill sits over a photograph and is the one
   * thing on the page that must never move while a visitor is reading past it.
   */
  raise?: boolean;
}) {
  return (
    <a
      href={href}
      /*
       * The one interactive thing on the page that does not take the sliding
       * rule: this is a filled gold shape, and a hairline inside it reads as a
       * rendering fault rather than as an affordance.
       *
       * An explicit opt-out in the markup, not an exclusion list inside
       * `scripts/check_rule_in.mjs`. A list living in a script drifts from the
       * markup silently, which is exactly how the contrast rig came to measure
       * nothing for a whole task — see `components/ui/BrandMark.tsx`. Here the
       * rig demands that every link carry the rule *or* this attribute, so a new
       * link that has neither fails, and one that opts out has said so on purpose.
       */
      data-rule="none"
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
        raise ? "pill-raise" : "",
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
      {/*
       * The label has its own box so it can be measured.
       * `scripts/check_contrast_over_photos.mjs` crops to a run's rectangle and
       * reads the worst pixel behind it, and the `<a>`'s own rectangle is the
       * wrong rectangle: `rounded-full` means its corners are not gold at all,
       * they are whatever is behind the pill. Over the hero photograph that put
       * the crop's darkest pixel at [36,43,29] and reported 1.00:1 for a pill
       * that is in fact 4.92:1 everywhere a letter actually sits.
       *
       * A `<span>` around the text is inert — it inherits everything, changes no
       * layout inside an `inline-block` — and it gives all three pills on the
       * page a glyph band that can be cropped to.
       */}
      <span>{children}</span>
    </a>
  );
}
