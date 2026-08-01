/**
 * Fine paper grain across the whole page. Ties everything to the field-guide idiom and
 * stops the dark movements reading as flat rectangles (spec section 4.4).
 * Inline SVG so it costs no network request.
 */
export function Grain() {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/></filter>
      <rect width="120" height="120" filter="url(#n)" opacity="0.55"/>
    </svg>`.replace(/\s+/g, " "),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.07] mix-blend-soft-light"
      style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }}
    />
  );
}
