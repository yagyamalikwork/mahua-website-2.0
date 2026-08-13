# `check_plates.mjs` — watched failing, both arms

13 August 2026. Evidence for Task 2 of the image-sizing plan
(`.superpowers/sdd/2026-08-13-image-sizing/task-2-brief.md`). `plates.json` is the passing run on the
fixed build (Task 1's `PlateGrid.tsx`, committed, unmodified). This file records what the rig did
against two deliberately broken builds, so the passing run above is trusted rather than assumed.

Every run: `npm run build && npx next start -p 3100`, server warmed with one throwaway navigation per
route (`next start`'s first-hit compile can run past 6s — see `scripts/check_welcome.mjs`'s own
comment), then `node scripts/check_plates.mjs --port 3100`.

## Clean pass — the number this task ships

```
/              boards=forest,rooms,details samples=141 worstDistortion=0.29% forest:floor=0.8734 rooms:floor=0.681 details:floor=0.8742
/mahua-vann    boards=(none) samples=141 worstDistortion=0.00%
/mahua-tola    boards=(none) samples=141 worstDistortion=0.00%

PASS
```

Exit 0. 141 shapes swept per route (64 continuous steps at height 900, 64 at height 768, 13 named
shapes — no duplicates). `forest`'s worst floor ratio (0.8734, at 1280×720) and `details`'s (0.8742, at
1280×720) both independently reproduce the spec's own hand-derived figures (`2026-08-13-image-sizing-design.md`
§1: "278px at 1280 against 318px at 1440" = 87.4%; "368px … 87% of reference"). `rooms`'s worst floor
ratio, 0.681 at 1024×768, is the same 444/652 = 0.68 the spec records as already looked-at-and-accepted.
That three independently-measured numbers land on the spec's own arithmetic to within rounding is the
strongest evidence the rig is measuring the right thing, not just returning a plausible number.

## Arm (a) — the breakpoint reverted

Edit (working tree only, reverted immediately after): `PlateGrid.tsx`'s `columnClass`, the
`columns === 3` case, changed back from `"sm:grid-cols-2 xl:grid-cols-3"` to
`"sm:grid-cols-2 lg:grid-cols-3"`. Rebuilt, server restarted, confirmed the served HTML actually
carried the reverted class before measuring (`curl | grep` — the project has a catalogued defect where a
stale server on the same port serves an old build silently; a second `next start` on an occupied port
fails to bind and the *previous* process keeps answering, so this was checked directly rather than
trusted).

```
EXIT=1
  - /: assertion 2: board="forest" plate=0 at 1024x768 — floor ratio 0.671 < 0.85 (rendered 282.7px vs 1440 reference 421.3px, exempt=false)
```

93 floor-violation lines total, all naming `forest`, all in the 1024–1279px width band the brief
predicted, rendered widths 282.7–353.3px against the 358.1px floor (0.85 × 421.3 reference) — matching
the brief's own "283–368px against a ~358px floor" closely (the small difference is this run's own
measured 421.3px reference vs. the brief's rounded ~421). `rooms` and `details` were untouched by this
edit and reported no new failures. The rig did not stay green — it failed, and named exactly the board
and width band the brief said it would.

Restored (`git checkout -- components/sections/PlateGrid.tsx`), rebuilt, confirmed `git diff HEAD` empty
before re-measuring.

## Arm (b) — the plate cell forced to `height: 200px`

Edit exactly as specified: the plate cell `<div>` (the one carrying `--stagger`) in `PlateGrid.tsx` got
`width: "100%", height: "200px"` added to its inline `style`. `components/ui/Plate.tsx` and
`components/ui/Photo.tsx` were not touched. Rebuilt, server restarted, confirmed the served HTML carried
`style="--stagger:…;width:100%;height:200px"` before measuring.

```
EXIT=1
  - /: assertion 1: board="details" plate=2 at 964x900 — naturalWidth/Height is 0 — image never finished loading
```

The rig failed (exit 1) and assertion 1 is what fired — but not by the mechanism the brief names
("confirm the distortion assertion fires on every unframed plate"). All 8 failures are
`naturalWidth/Height is 0`, on the `rooms` and `details` boards, at scattered widths; `forest` — the
board the brief's own wording points at ("every unframed plate") — reported **zero** failures, and its
`worstDistortionPct` (0.207%) is identical to the clean run's. No rendered plate's aspect ever differed
measurably from its own natural aspect under this sabotage.

**Why, worked through the CSS rather than assumed:** every `<img>` `PlateGrid` renders through `Plate.tsx`
carries an unconditional `roomy:h-auto` (unframed) or is `object-fit: cover` inside a `<picture>` whose
own box is set by `aspect-ratio` (framed) — never by a percentage height. A CSS `height: auto` declared
directly on an element is computed from that element's own resolved width and intrinsic ratio; it cannot
be overridden by an ancestor's fixed size unless something in the chain resolves a *percentage* height
against a *definite* ancestor height, and nothing in `ImageReveal.tsx` → `Plate.tsx` → `Photo.tsx` does
that (`data-image-inner`'s `h-full` resolves against `ImageReveal`'s own wrapper, which has no explicit
height of its own, so it computes to `auto` regardless of what the plate cell two levels up declares).
Two levels above the `<img>`, a plate cell's own fixed height genuinely cannot distort it — by
construction, not by luck.

What the sabotage *does* do: CSS Grid sizes an `auto` row track from each item's own specified size when
one exists, so a row of 200px-tall items sizes to 200px regardless of what its content actually needs —
and with `overflow: visible` (the default; nothing here sets `overflow: hidden` at that level), each
cell's real content (400–700px, typically) paints past its own box rather than being clipped or
resized. That shrinks the page's total `scrollHeight` under what the real photographs need, and the
rig's own full-page scroll pass — built to bring every lazy `<img>` within Chrome's native
`loading="lazy"` threshold — under-scrolls for a handful of images that would, on the honestly-tall page,
have been well within it. That is a real defect this sabotage introduces (images that silently never
load), just not the one the brief named.

**Supplementary check, same file, same constraint** (plate cell `<div>` only, temporary, removed before
commit): swapped the sabotage for `transform: "scaleY(0.5)"` on the same element. A CSS transform *is*
part of the rendered box `getBoundingClientRect()` reports on a descendant, unlike a plain ancestor
height, so this reaches the `<img>` regardless of `object-fit` or `height: auto`.

```
EXIT=1
  - /: assertion 1: board="forest" plate=0 at 900x900 — distortion 99.75% (rendered 1.588:1 vs natural 0.795:1, mode roomy)
```

worstDistortion 100.41%, 1093 assertion-1 failures across the sweep, `forest` named at the very first
sample. This confirms the distortion-comparison code path itself is real and not a dead branch — arm
(b) as literally specified exercises assertion 1's *other* branch (the "never loaded" guard) instead,
for the structural reason above, and both branches are now watched failing on this build.

Restored (`git checkout -- components/sections/PlateGrid.tsx`), rebuilt, confirmed `git diff HEAD`
empty, re-ran the rig: exit 0, identical numbers to the first clean pass (`forest:floor=0.8734
rooms:floor=0.681 details:floor=0.8742`, `worstDistortion=0.29%`).
