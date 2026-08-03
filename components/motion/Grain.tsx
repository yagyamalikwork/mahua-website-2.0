/**
 * Fine paper grain across the whole page. Ties everything to the field-guide idiom and
 * stops the cream surface reading as flat digital colour rather than paper (spec
 * section 4.4). Inline SVG so it costs no network request.
 *
 * Blend mode is `hard-light`, not `soft-light`. Soft-light's perturbation is scaled by
 * backdrop*(1-backdrop), which collapses toward zero as the backdrop approaches white —
 * measured as literally zero luminance range on the cream surfaces. Hard-light instead
 * picks a darken-only or lighten-only formula per source pixel, and each of those two
 * formulas stays proportional to (not collapsed by) one of the backdrop or its inverse,
 * so it keeps working at both the cream and dark ends.
 *
 * feColorMatrix desaturates the turbulence to neutral grey (no hue, so no colour is
 * introduced — greyscale noise values are not a brand colour). feComponentTransfer then
 * does two things: it forces alpha to a flat 1 (feTurbulence's own alpha channel is noisy
 * too, and letting it vary dilutes half the pixels toward "no effect" for no visual
 * benefit), and it recentres the RGB channels — fractalNoise's raw output here measures
 * ~0.73 mean, not the 0.5 a naive reading of the spec would suggest, which biases almost
 * all pixels into hard-light's compressed-near-white lightening branch and starves the
 * darkening branch that cream backgrounds actually need. Shifting the mean back to ~0.5
 * feeds both branches evenly. Container opacity is the final amplitude dial.
 */
export function Grain() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
        <feComponentTransfer in="gray">
          <feFuncR type="linear" slope="1" intercept="-0.2323"/>
          <feFuncG type="linear" slope="1" intercept="-0.2323"/>
          <feFuncB type="linear" slope="1" intercept="-0.2323"/>
          <feFuncA type="linear" slope="0" intercept="1"/>
        </feComponentTransfer>
      </filter>
      <rect width="120" height="120" filter="url(#n)"/>
    </svg>`.replace(/\s+/g, " "),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-hard-light"
      style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }}
    />
  );
}
