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
  readonly swatch: "core" | "park" | "water" | "road" | "gate" | "village" | "zone";
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

/**
 * What each legend key draws, and how — not just a fill and an opacity.
 *
 * **Until 10 Aug 2026 (the whole-branch review's fix wave) every swatch
 * rendered as the same `rounded-full` dot**, regardless of what it named: a
 * region tint (an area, not a point), a road (a line, not a point) and a
 * park gate all drew one indistinguishable circle, `gate` and `road` were
 * *the same colour at the same opacity* so "Main road" and "Park entry
 * gate" were one mark in the key twice, and `zone` had no entry at all —
 * Tola's four numbered safari zones were unkeyed. `mark` now says which
 * shape `LegendMark` below actually draws, so the key reads as what is on
 * the artwork rather than as a row of identical dots.
 */
const SWATCH: Record<
  MapLegendEntryCopy["swatch"],
  { fill: string; opacity: number; mark: "region" | "road" | "gate" | "zone" | "village" }
> = {
  park: { fill: "var(--text)", opacity: 0.1, mark: "region" },
  core: { fill: "var(--text)", opacity: 0.2, mark: "region" },
  water: { fill: "var(--text)", opacity: 0.34, mark: "region" },
  road: { fill: "var(--accent)", opacity: 0.95, mark: "road" },
  // Solid, small, filled — matches the `gate` marker on the map exactly.
  gate: { fill: "var(--accent)", opacity: 1, mark: "gate" },
  // Larger and hollow (a ring, not a block) — matches the `zone` marker on
  // the map, which used to differ from `gate` by only 4px of size and 0.1 of
  // opacity, confirmed too subtle to tell apart by eye (Task 15). A filled
  // shape vs. an outlined one reads apart at a glance; a few extra pixels
  // did not.
  zone: { fill: "none", opacity: 1, mark: "zone" },
  // Matches the village marker drawn below exactly — `<circle r="3"
  // fill="var(--text)" />` with no `fillOpacity`, i.e. full opacity. Task 12
  // shipped that marker with no legend entry able to describe it: this
  // swatch union only had room for core/park/water/road/gate, so eight
  // village dots on Mahua Vann's own map rendered with nothing in the key
  // naming them. See content/mahua-vann.ts and content/mahua-tola.ts.
  village: { fill: "var(--text)", opacity: 1, mark: "village" },
};

/**
 * Draws the legend key's own small figure of what a swatch means — a
 * square for a gate, a larger hollow square for a zone, a short line for
 * the road, a circle for a village, a filled block for a region tint. A
 * plain inline `<svg>` rather than a styled `<span>`, because a road and a
 * region tint cannot both be expressed as a background colour on a
 * rounded box: one is a line, the other an area.
 */
function LegendMark({ swatch }: { swatch: MapLegendEntryCopy["swatch"] }) {
  const s = SWATCH[swatch];
  return (
    <svg aria-hidden="true" width="16" height="12" className="block shrink-0" viewBox="0 0 16 12">
      {s.mark === "region" && (
        <rect
          x="1"
          y="2"
          width="14"
          height="8"
          fill={s.fill}
          fillOpacity={s.opacity}
          {...(swatch === "water" ? { stroke: "var(--text)", strokeOpacity: 0.5, strokeWidth: 1 } : {})}
        />
      )}
      {s.mark === "road" && <line x1="1" y1="6" x2="15" y2="6" stroke={s.fill} strokeOpacity={s.opacity} strokeWidth="2" />}
      {s.mark === "gate" && <rect x="4" y="2" width="8" height="8" fill={s.fill} fillOpacity={s.opacity} />}
      {s.mark === "zone" && <rect x="1" y="0" width="14" height="12" fill="none" stroke="var(--accent)" strokeWidth="1.6" />}
      {s.mark === "village" && <circle cx="8" cy="6" r="3" fill={s.fill} fillOpacity={s.opacity} />}
    </svg>
  );
}

/**
 * Label type sizes, in the artwork's own viewBox user-units — **not** CSS
 * pixels. A `font-size` set on an SVG `<text>` (whether the JSX `fontSize`
 * attribute or a CSS rule from a class) is resolved inside the coordinate
 * system the ancestor `<svg viewBox>` establishes, exactly like `x`, `y` or
 * `r`: the whole subtree is scaled by (rendered width ÷ viewBox width), so
 * a fixed `fontSize={10}` looks fine wherever that ratio is near 1 and
 * shrinks in lock-step everywhere it is not.
 *
 * **That ratio was never near 1 on a phone.** `PropertyMap`'s `<svg>` is
 * `w-full` over a fixed `viewBox`, and below `lg` it fills the single
 * content column at whatever width the viewport leaves it — 342px of 800
 * viewBox units on Mahua Vann at 390px wide (a ×0.43 scale), 342px of 660
 * on Mahua Tola (×0.52). A `fontSize={10}` label rendered at ~4.3px and
 * ~5.2px respectively: legible nowhere, confirmed by opening the review's
 * own screenshots rather than assumed from the arithmetic alone.
 *
 * The fix is the same shape as the artwork's own coordinates: numbers
 * relative to what is actually rendered, not a single constant. Four tiers
 * matching Tailwind's own breakpoints hold the *rendered* size roughly
 * constant across the widths the map is actually shown at — bigger raw
 * numbers below `lg`, where the drawing itself is smaller, tapering back to
 * the original 10/11/12 from `lg` up, where the drawing was already close
 * to or above its native size and the original numbers already read well.
 * Checked against real screenshots at 390/768/1440 for both properties, not
 * decided by this arithmetic alone — see the task's final fix report.
 */
export const LABEL_TEXT_SIZE = {
  /** `gate` — the busiest mark on either map, sized a step above the rest. */
  emphasis: "text-[24px] sm:text-[17px] md:text-[13px] lg:text-[11px]",
  /** `water`, `zone`, `village`, `road` and the compass `N`. */
  normal: "text-[22px] sm:text-[16px] md:text-[12px] lg:text-[10px]",
  /** The lodge's own name — the map's single most important word. */
  lodge: "text-[26px] sm:text-[18px] md:text-[14px] lg:text-[12px]",
} as const;

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
 *
 * **Legible below `lg`, whole-branch review fix wave (10 Aug 2026).** The
 * density fix above made both maps bigger on a wide screen; it did nothing
 * for a phone, where the same `<svg>` scales *down* to fit a single narrow
 * column and both the type (`LABEL_TEXT_SIZE`) and the label count
 * (`declutterMobile`, below) had never been checked against that. See both
 * comments for the mechanism and the task's final fix report for what the
 * result looks like at 390/768/1440.
 */

/**
 * The 390px column the review's own screenshots are judged against — see
 * `LABEL_TEXT_SIZE`'s comment for where the number comes from (a 390px
 * viewport less the section's own `px-6` padding).
 */
const MOBILE_COLUMN_PX = 342;

/**
 * Base-tier mobile font sizes, in viewBox user-units — the same "24"/"22"
 * `LABEL_TEXT_SIZE` sets for `<lg` in its own Tailwind class strings.
 * Duplicated as plain numbers rather than read out of that object because
 * Tailwind's build-time scanner needs the class strings themselves to stay
 * literal; `PropertyMap.test.tsx` holds the two in step so they cannot
 * drift apart silently.
 */
export const MOBILE_FONT_PX = { gate: 24, other: 22 } as const;

/**
 * A rough average character advance for this label font, in em — enough to
 * tell "Kolara" from "Irai Dam Backwaters" for decluttering purposes, not a
 * typographically exact figure. Picked against two known constraints from
 * the actual screenshots: it must stay low enough that "Jamtara Gate" and
 * "Karmajhiri Gate" (Mahua Vann, genuinely fine next to each other) don't
 * collide, and high enough that "Irai Dam Backwaters" and "Moharli" (Mahua
 * Tola, genuinely overlapping) do.
 */
const AVG_CHAR_WIDTH_EM = 0.27;

/** `zone`'s own reach floor, already in rendered px at `MOBILE_COLUMN_PX` — see `labelReachPx`'s comment on why a length-scaled estimate underestimates it. */
const ZONE_MIN_REACH_PX = 45;

/**
 * How far a label's own text actually reaches rightward from its anchor,
 * rendered at `MOBILE_COLUMN_PX` — every label here uses the default SVG
 * text-anchor, "start". A point-radius check treats every label as the
 * same small dot; two labels sitting on the same row but 50px apart never
 * collide by that measure, however long the first one's *name* runs — and
 * "Irai Dam Backwaters" (twenty characters) does exactly that, running
 * straight through "Moharli" a couple of gate-widths to its right.
 */
function labelReachPx(l: MapLabelCopy, scale: number): number {
  const fontPx = (l.kind === "gate" ? MOBILE_FONT_PX.gate : MOBILE_FONT_PX.other) * scale;
  const markerGap = l.kind === "water" || l.kind === "road" ? 0 : 8 * scale;
  const reach = markerGap + l.text.length * AVG_CHAR_WIDTH_EM * fontPx;
  // A `zone` label is a short, fixed-format string ("Zone 1") next to the
  // biggest marker on either map (the 14-unit hollow square, twice a
  // gate's own) — a length-scaled estimate underestimates it the same way
  // it would underestimate any short label next to a large mark, and
  // "Zone 1" measurably touched "Teliya Lake" on Mahua Tola at 390px
  // before this floor existed. Not applied to any other kind: every other
  // collision this pass had to fix was a long name running into a
  // neighbour, which the length-scaled estimate already catches on its own.
  return l.kind === "zone" ? Math.max(reach, ZONE_MIN_REACH_PX) : reach;
}

/**
 * Which of `gate`, `zone` and `water` labels to drop below `lg`, on top of
 * `village` and `road` (always dropped there, handled separately below).
 *
 * **Growing the type (`LABEL_TEXT_SIZE`) fixed Mahua Vann outright and made
 * Mahua Tola worse.** Vann carries three gates and three water features,
 * spread across the whole park; Tola carries sixteen gates (its artwork
 * draws every named boundary point with one glyph — see
 * `content/mahua-tola.ts`'s own comment) plus four zones and five water
 * features, and several of those sit within a few dozen rendered pixels of
 * each other. Bigger, readable type on markers that close together
 * collides *harder* than small illegible type does — confirmed by opening
 * the actual screenshots, not assumed from the labels' coordinates.
 *
 * A plain greedy pass, deterministic and free of client JS (this component
 * is a server component; the drop set is baked into the HTML): walk
 * `labels` in the order they are already declared, keep a label unless it
 * shares a rendered row (at `MOBILE_COLUMN_PX`, the narrowest width the map
 * is actually shown at) with one already kept, and sits inside that one's
 * reach (`labelReachPx`). Only the *further-left* label's own reach is
 * checked — text runs rightward from its anchor, so the right-hand one of
 * a pair can never run backward into the left-hand one. An earlier version
 * checked the average of both labels' reach instead, which is what caught
 * "Jamtara Gate"/"Karmajhiri Gate" (Mahua Vann) as a false collision: two
 * long names on the same row, neither of which actually reaches the
 * other's anchor.
 *
 * Two different kinds get a smaller vertical allowance than two of the
 * same kind — `gate` and `water` already look different (a solid square
 * next to upright text vs. no marker at all, in dim italic) in a way two
 * gates or two lakes never do, so an early version that gave every kind the
 * same gap suppressed *every* water label near a gate on Mahua Tola, which
 * is exactly the "water features…orient a visitor" category this whole
 * pass exists to keep.
 *
 * That makes **array order the priority** — whichever of two colliding
 * labels is declared first survives — so `content/mahua-vann.ts` and
 * `content/mahua-tola.ts` order the one gate each page's own map heading
 * and getting-there row actually name (Turia, Kolara) and, on Tola, its
 * other core-zone gate (Moharli) first among their gates, and Tola's own
 * namesake lake (Tadoba Lake) first among its water, so a cluster that has
 * to lose labels loses the least important ones in it — not whichever a
 * mechanical pass happened to reach first. Tuned against the actual
 * screenshots, not assumed from the arithmetic alone — see the task's
 * final fix report.
 */
function declutterMobile(
  labels: readonly MapLabelCopy[],
  width: number,
  height: number,
): ReadonlySet<MapLabelCopy> {
  const scale = MOBILE_COLUMN_PX / width;
  const rowPx = MOBILE_FONT_PX.gate * scale * 1.3; // a generous single line-height
  const kept: MapLabelCopy[] = [];
  const dropped = new Set<MapLabelCopy>();
  for (const l of labels) {
    if (l.kind !== "gate" && l.kind !== "zone" && l.kind !== "water") continue;
    const px = l.x * width * scale;
    const py = l.y * height * scale;
    const collides = kept.some((k) => {
      const dy = Math.abs(k.y * height * scale - py);
      const rowGap = k.kind === l.kind ? rowPx : rowPx * 0.6;
      if (dy >= rowGap) return false; // different rows — text can't run into it
      // Text runs rightward from its own anchor (every kind's <text> here
      // uses the default text-anchor, "start"), so only whichever of the
      // two sits further LEFT can run its own text into the other — the
      // one on the right extends further away, not back toward it.
      const kpx = k.x * width * scale;
      const leftReach = kpx < px ? labelReachPx(k, scale) : labelReachPx(l, scale);
      return Math.abs(kpx - px) < leftReach;
    });
    if (collides) dropped.add(l);
    else kept.push(l);
  }
  return dropped;
}

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

  // See declutterMobile's own comment above. Computed once per render, off
  // the same copy.labels the aria-label above reads — a screen reader still
  // hears every name at every width; only the drawn <text> disappears.
  const mobileDropped = declutterMobile(copy.labels, width, height);

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
                    <LegendMark swatch={entry.swatch} />
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

                {copy.labels.map((l) => {
                  // Villages and named road destinations are the two kinds
                  // that do not orient a first-time visitor the way a gate,
                  // the lodge or a water feature does — dropped below `lg`
                  // unconditionally. `mobileDropped` adds any gate, zone or
                  // water label too close to another to read once both are
                  // big enough to matter (declutterMobile, above). Together
                  // these are what the labels that remain have room to be
                  // read rather than overprinting each other. `hidden`
                  // removes them from paint entirely; it does not touch
                  // `mapAriaLabel` above, which is built from the same
                  // `copy.labels` regardless of viewport, so a screen reader
                  // still hears every name at every width.
                  const declutter = l.kind === "village" || l.kind === "road" || mobileDropped.has(l);
                  return (
                    <g
                      key={`${l.text}-${l.x}`}
                      transform={`translate(${l.x * width} ${l.y * height})`}
                      className={declutter ? "hidden lg:inline" : undefined}
                    >
                      {l.kind === "village" && <circle r="3" fill="var(--text)" />}
                      {l.kind === "gate" && <rect x="-4" y="-4" width="8" height="8" fill="var(--accent)" />}
                      {/* A hollow, larger square — not a smaller, slightly
                          fainter copy of the gate's solid one. Task 15 shipped
                          `gate` and `zone` 4px and 0.1 opacity apart and
                          confirmed by eye that a screenshot cannot tell them
                          apart; fill-vs-outline reads apart at a glance. */}
                      {l.kind === "zone" && (
                        <rect x="-7" y="-7" width="14" height="14" fill="none" stroke="var(--accent)" strokeWidth="2" />
                      )}
                      <text
                        x={l.kind === "water" || l.kind === "road" ? 0 : 8}
                        y={l.kind === "water" || l.kind === "road" ? 0 : 4}
                        className={`font-[family-name:var(--font-label)] ${l.kind === "gate" ? LABEL_TEXT_SIZE.emphasis : LABEL_TEXT_SIZE.normal}`}
                        letterSpacing="0.08em"
                        fill={l.kind === "water" ? "var(--dim)" : "var(--text)"}
                        fontStyle={l.kind === "water" ? "italic" : undefined}
                      >
                        {l.text}
                      </text>
                    </g>
                  );
                })}

                {/* The lodge: the brand's own flower, at exactly the size the two
                    concentric circles it replaces occupied — client request,
                    15 Aug 2026.

                    **This overrides the note that used to sit here**, which said
                    the mark was drawn rather than rastered because "at this size a
                    40px PNG would be the only bitmap on an otherwise
                    resolution-independent drawing". That was a fair call while the
                    marker was two circles; it is not a reason to redraw the
                    client's own emblem by hand, and a redraw is what this project
                    refuses everywhere else (see `ui/BrandMark.tsx`: the flower is
                    his artwork, not an approximation of it).

                    **`emblem-120` is chosen from a measurement, not by eye.** The
                    marker renders 40.5px at 1920 and 36.1px at 1440 — measured on
                    the running page, both routes — and `lib/sizes.ts` caps this
                    project at DPR 2, so the widest real demand is ~81px. 120
                    clears it with room; 160 would be 2.6 KB more for pixels
                    nothing asks for, and 80 would sit a hair under. It is also the
                    tier the header itself loads on a DPR-2 desktop, so this is
                    often a cache hit rather than a request.

                    The box is square while the artwork is 1.0026:1. That is
                    deliberate: SVG's default `preserveAspectRatio` letterboxes
                    rather than stretches, so the mark keeps its own shape here and
                    would keep it again if the emblem were ever rebuilt to a
                    different aspect. Sizing the box off `EMBLEM.aspectRatio`
                    instead would couple this file to a generated module to move a
                    rendered edge by less than a tenth of a pixel. */}
                <g transform={`translate(${copy.lodge.x * width} ${copy.lodge.y * height})`}>
                  <image
                    href="/brand/emblem-120.webp"
                    x="-13"
                    y="-13"
                    width="26"
                    height="26"
                    /* The map's own `aria-label` already names the lodge, and the
                       lodge's name is drawn as real <text> beside this. A second
                       announcement here would read the brand twice. */
                    aria-hidden="true"
                  />
                  <text
                    x="19"
                    y="4"
                    className={`font-[family-name:var(--font-label)] ${LABEL_TEXT_SIZE.lodge}`}
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
                    className={`font-[family-name:var(--font-label)] ${LABEL_TEXT_SIZE.normal}`}
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
