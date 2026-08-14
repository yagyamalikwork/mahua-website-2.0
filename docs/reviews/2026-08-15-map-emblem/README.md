# The lodge marker is the brand's flower — 15 August 2026

Client request: *"The maps on the property pages currently mark the respective resort location with a solid
coloured circle with an outline concentric circle. Replace it with the Mahua Resorts emblem flower and keep
it the same size as the circles marking the resort locations currently."*

## What changed

`components/sections/PropertyMap.tsx`, one marker:

```diff
- <circle r="13" fill="none" stroke="var(--accent)" strokeWidth="1.2" />
- <circle r="4.5" fill="var(--accent)" />
+ <image href="/brand/emblem-120.webp" x="-13" y="-13" width="26" height="26" aria-hidden="true" />
```

The box is the exact area the outer ring occupied — `r="13"`, so 26 × 26 in the artwork's own viewBox
units. Nothing else about the marker moved: the lodge's name still sits at `x="19"` beside it, and the
transform that positions the whole group is untouched.

## The note this overrides

The old comment said the mark was drawn rather than rastered because *"at this size a 40px PNG would be
the only bitmap on an otherwise resolution-independent drawing."* That was a fair call while the marker was
two circles. It is not a reason to redraw the client's own emblem by hand — and a redraw is exactly what
this project refuses everywhere else (`ui/BrandMark.tsx`: the flower is his artwork, not an approximation).

## Why `emblem-120`, measured rather than chosen

The marker's rendered size, measured on the running page:

| viewport | marker | svg | viewBox |
|---|---|---|---|
| 1920 × 1080 | **40.5px** | 1245px | 800 × 484 |
| 1440 × 900 | 36.1px | 1112px | 800 × 484 |
| 1024 × 768 | 24.9px | 765px | 800 × 484 |
| 390 × 844 | 11.1px | 342px | 800 × 484 |

`lib/sizes.ts` caps this project at DPR 2, so the widest real demand is **~81px**. The available tiers are
80, 120 and 160:

- **80** would sit a hair under the demand at 1920.
- **160** is 2.6 KB more for pixels nothing asks for.
- **120** clears it with room, and is the tier the header itself loads on a DPR-2 desktop — so on those
  screens this is a cache hit rather than a request.

Tola's map renders the same marker at **49.1px**, because its `<svg>` is drawn wider at the same viewBox;
that is the circles' own former size on that page, which is what "the same size" means.

## The square box over a 1.0026:1 artwork

Deliberate. SVG's default `preserveAspectRatio` letterboxes rather than stretches, so the mark keeps its
own shape — and would keep it again if the emblem were ever rebuilt to a different aspect. Sizing the box
from `EMBLEM.aspectRatio` instead would couple this file to a generated module in order to move a rendered
edge by less than a tenth of a pixel.

## Measured

| | |
|---|---|
| Emblem present, old circles remaining | **Vann 40.5px, 0 circles left** · **Tola 49.1px, 0 circles left** |
| Failed requests | none, either route |
| Initial transfer @1440 | **Vann 496 KB, Tola 538 KB** — budget is 1,500 KB |
| Emblem requests | 2 at DPR 1 (header picks 80, map takes 120); one cache hit at DPR 2 |
| Legend | unchanged, and correctly so — `SWATCH` has no `lodge` entry, so no key describes this marker |
| Accessibility | `aria-hidden` on the image; the map's own `aria-label` and the drawn `<text>` already name the lodge, so a second announcement would read the brand twice |

467 tests, `tsc --noEmit`, `lint` and `next build` all green. Screenshots: `vann-map.png`, `tola-map.png`.
