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
  readonly swatch: "core" | "park" | "water" | "road" | "gate";
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

  return (
    <ChapterSurface id={chapter.id} surface={surface}>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-4">
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

        <div className="lg:col-span-8">
          <Enter delay={ENTER.stagger}>
            <figure>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="block h-auto w-full"
                role="img"
                aria-label={`Map of ${copy.lodge.text} and the reserve around it`}
              >
                {REGION.map((r) => (
                  <path
                    key={r.key}
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
                    a moveto in it: the region loop above is the only thing
                    that should ever put a <path> in this SVG, because that is
                    exactly what the "one path per region" test is counting —
                    a fifth path here would pass silently and the test would
                    stop meaning what its comment says it means. */}
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
