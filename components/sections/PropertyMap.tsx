import { Enter } from "@/components/motion/Enter";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { ChapterSurface } from "@/components/ui/ChapterSurface";
import { TwoToneHeading } from "@/components/ui/TwoToneHeading";
import type { TwoTone } from "@/content/home";
import type { PropertyChapter } from "@/content/property-chapters";
import { TOLA_MAP_ART } from "@/lib/tola-map-art";
import { VANN_MAP_ART } from "@/lib/vann-map-art";
import { ENTER } from "@/lib/motion";

const ART = { vann: VANN_MAP_ART, tola: TOLA_MAP_ART } as const;

/** What a mark on the map is, which decides how it is drawn and set. */
export type MapLabelKind = "gate" | "village" | "water" | "zone" | "road";

export type MapLabelCopy = {
  readonly text: string;
  /** Fractional position in the artwork's own box, 0–1. Transcribed by eye. */
  readonly x: number;
  readonly y: number;
  readonly kind: MapLabelKind;
};

export type MapLegendEntryCopy = {
  readonly swatch: "core" | "park" | "water" | "road" | "gate" | "village";
  readonly text: string;
};

export type PropertyMapCopy = {
  readonly heading: TwoTone;
  readonly art: keyof typeof ART;
  readonly labels: readonly MapLabelCopy[];
  /** The lodge itself — drawn as the brand's flower, not as a village dot. */
  readonly lodge: { readonly text: string; readonly x: number; readonly y: number };
  readonly legend: readonly MapLegendEntryCopy[];
  readonly gettingThere: readonly { readonly label: string; readonly value: string }[];
};

/** Region fills, in the cream palette. Gold carries no text — non-negotiable #7. */
const REGION = [
  { key: "park", fill: "var(--text)", opacity: 0.1 },
  { key: "core", fill: "var(--text)", opacity: 0.2 },
  { key: "water", fill: "var(--text)", opacity: 0.34 },
  { key: "road", fill: "var(--accent)", opacity: 0.95 },
] as const;

const SWATCH: Record<MapLegendEntryCopy["swatch"], { fill: string; opacity: number }> = {
  park: { fill: "var(--text)", opacity: 0.1 },
  core: { fill: "var(--text)", opacity: 0.2 },
  water: { fill: "var(--text)", opacity: 0.34 },
  road: { fill: "var(--accent)", opacity: 0.95 },
  gate: { fill: "var(--accent)", opacity: 0.95 },
  // Matches the village marker drawn below exactly — `<circle r="3"
  // fill="var(--text)" />` with no `fillOpacity`, i.e. full opacity. Task 12
  // shipped that marker with no legend entry able to describe it: this
  // swatch union only had room for core/park/water/road/gate, so eight
  // village dots on Mahua Vann's own map rendered with nothing in the key
  // naming them. See content/mahua-vann.ts and content/mahua-tola.ts.
  village: { fill: "var(--text)", opacity: 1 },
};

/**
 * The park, drawn in the page's own ink.
 *
 * It answers "five kilometres from Turia Gate" the way the sentence cannot,
 * and it is the strongest thing distinguishing the two property pages from
 * each other — two different forests, drawn.
 *
 * **Static by construction.** No animation, so nothing to disable under
 * `prefers-reduced-motion`, and it renders identically with scripting off.
 * The region paths come from `lib/*-map-art.ts`, generated from the client's
 * artwork; every word on it comes from `content/`.
 *
 * **`tight` + a wider map column, Task 15 (9/10 Aug 2026).** At 0.79/0.89 of
 * a 900px screen, both maps are shorter than one, so `measure_density.mjs`
 * scores each on the single window centred over it — `vann-where` measured
 * 56.9% empty (`tola-where` 44.5%, inside the ceiling but close enough to
 * benefit from the same fix). `ChapterSurface`'s `tight` rhythm takes back
 * padding the same way `OpeningColumn`'s does. The map's own column widens
 * from `lg:col-span-8` to `lg:col-span-10` (the facts/legend column narrows
 * 4→2) — the drawn regions scale with it since the `<svg>` is `w-full` over
 * a fixed `viewBox`, so this is real artwork covering more of the screen, not
 * a wider box around the same drawing. A first pass at `lg:col-span-9`
 * (measured, not assumed) only brought `vann-where` to 46.9%, still just over
 * the ceiling, so the column widened again rather than declared close
 * enough.
 */
export function PropertyMap({
  chapter,
  copy,
  surface = true,
}: {
  chapter: PropertyChapter;
  copy: PropertyMapCopy;
  surface?: boolean;
}) {
  const art = ART[copy.art];
  const { width, height } = art.viewBox;

  // The accessible name for a map role="img" collapses everything inside the
  // SVG to one string — every <text> label (gates, lakes) is otherwise
  // invisible to a screen reader, which is exactly backwards for the element
  // that exists to prove local knowledge. Built from copy.labels grouped by
  // kind and copy.lodge, so it can never say a name the artwork doesn't also
  // draw, and introduces no new user-facing string: it is a minimal, punctuation-only
  // joining of names already supplied as props, not a written sentence.
  //
  // **Villages and safari zones joined 9/10 Aug 2026 (Task 15).** Until then
  // this label named only gates and water, which was backwards for Tola in
  // particular: its map's one `village` marker (Agarzari) and its four
  // numbered safari zones are exactly the kind of local detail a sighted
  // visitor reads off the artwork and a screen reader visitor could not get
  // at all. Same construction as the two groups above — read off
  // `copy.labels`, so it can never announce a name the artwork does not draw.
  const gateNames = copy.labels.filter((l) => l.kind === "gate").map((l) => l.text);
  const waterNames = copy.labels.filter((l) => l.kind === "water").map((l) => l.text);
  const villageNames = copy.labels.filter((l) => l.kind === "village").map((l) => l.text);
  const zoneNames = copy.labels.filter((l) => l.kind === "zone").map((l) => l.text);
  const mapAriaLabel = `Map of ${copy.lodge.text} and the reserve around it — ${[
    ...gateNames,
    ...waterNames,
    ...villageNames,
    ...zoneNames,
    copy.lodge.text,
  ].join(", ")}.`;

  return (
    <ChapterSurface id={chapter.id} surface={surface} tight>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-2">
          <Enter>
            <div>
              {chapter.number && chapter.label && (
                <ChapterMark number={chapter.number} label={chapter.label} />
              )}
              <TwoToneHeading heading={copy.heading} className="mt-6 max-w-[14ch]" />
              <dl className="mt-8 space-y-4">
                {copy.gettingThere.map((fact) => (
                  <div key={fact.label} className="border-t pt-3" style={{ borderColor: "var(--accent)" }}>
                    <dt
                      className="font-[family-name:var(--font-label)] text-[0.65rem] uppercase tracking-[0.2em]"
                      style={{ color: "var(--accent-text)" }}
                    >
                      {fact.label}
                    </dt>
                    <dd
                      className="mt-1 font-[family-name:var(--font-body)] text-[1.02rem]"
                      style={{ color: "var(--text)" }}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-8 space-y-2">
                {copy.legend.map((entry) => (
                  <li key={entry.text} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SWATCH[entry.swatch].fill, opacity: SWATCH[entry.swatch].opacity }}
                    />
                    <span
                      className="font-[family-name:var(--font-label)] text-[0.62rem] uppercase tracking-[0.18em]"
                      style={{ color: "var(--dim)" }}
                    >
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Enter>
        </div>

        <div className="lg:col-span-10">
          <Enter delay={ENTER.stagger}>
            <figure>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="block h-auto w-full"
                role="img"
                aria-label={mapAriaLabel}
              >
                {REGION.map((r) => (
                  <path
                    key={r.key}
                    data-region={r.key}
                    d={art.regions[r.key]}
                    fill={r.fill}
                    fillOpacity={r.opacity}
                    {...(r.key === "water"
                      ? { stroke: "var(--text)", strokeOpacity: 0.5, strokeWidth: 1.2 }
                      : {})}
                  />
                ))}

                {copy.labels.map((l) => (
                  <g key={`${l.text}-${l.x}`} transform={`translate(${l.x * width} ${l.y * height})`}>
                    {l.kind === "village" && <circle r="3" fill="var(--text)" />}
                    {l.kind === "gate" && <rect x="-4" y="-4" width="8" height="8" fill="var(--accent)" />}
                    {l.kind === "zone" && (
                      <rect x="-6" y="-6" width="12" height="12" fill="var(--accent)" fillOpacity="0.9" />
                    )}
                    <text
                      x={l.kind === "water" || l.kind === "road" ? 0 : 8}
                      y={l.kind === "water" || l.kind === "road" ? 0 : 4}
                      className="font-[family-name:var(--font-label)]"
                      fontSize={l.kind === "gate" ? 11 : 10}
                      letterSpacing="0.08em"
                      fill={l.kind === "water" ? "var(--dim)" : "var(--text)"}
                      fontStyle={l.kind === "water" ? "italic" : undefined}
                    >
                      {l.text}
                    </text>
                  </g>
                ))}

                {/* The lodge: a hairline ring where the client's artwork had an
                    orange callout. The mark is drawn, not the emblem raster —
                    at this size a 40px PNG would be the only bitmap on an
                    otherwise resolution-independent drawing. */}
                <g transform={`translate(${copy.lodge.x * width} ${copy.lodge.y * height})`}>
                  <circle r="13" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
                  <circle r="4.5" fill="var(--accent)" />
                  <text
                    x="19"
                    y="4"
                    className="font-[family-name:var(--font-label)]"
                    fontSize="12"
                    letterSpacing="0.14em"
                    fill="var(--text)"
                  >
                    {copy.lodge.text}
                  </text>
                </g>

                {/* North. A single hairline arrow, not a compass rose.
                    Drawn as a line and a polyline rather than one <path> with
                    a moveto in it. No longer load-bearing for the region
                    count — that test now selects path[data-region], so an
                    unmarked <path> here would sit outside it — but kept this
                    way anyway: it reads the same either way, and it keeps
                    <path> meaning "a traced region" everywhere it appears in
                    this file, with nothing to double-check by counting. */}
                <g transform={`translate(${width - 34} 30)`} stroke="var(--accent)" strokeWidth="1.2" fill="none">
                  <line x1="0" y1="20" x2="0" y2="-8" />
                  <polyline points="-5,-2 0,-8 5,-2" />
                  <text
                    x="0"
                    y="34"
                    textAnchor="middle"
                    className="font-[family-name:var(--font-label)]"
                    fontSize="10"
                    letterSpacing="0.16em"
                    fill="var(--accent-text)"
                    stroke="none"
                  >
                    N
                  </text>
                </g>
              </svg>
            </figure>
          </Enter>
        </div>
      </div>
    </ChapterSurface>
  );
}
