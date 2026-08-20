# The hero's reveal, the Jungles' depth, and the Experiences zoom — evidence

**20 August 2026, on `feat/home-v2`.** Three client requests after looking at the deployed page, and one
finding that came out of building them.

> *"The 3D effect on the section where our website opens (The Journey Begins) and 02-The Jungles section is
> not noticeable as it is on the last section where we have our reviews… Also I want the image zoom effect,
> exactly like the one we added to the property cards where the image zooms and the text stays, on the
> activity cards."*

## 1 · What was actually wrong — measured before anything was changed

The "3D effect" is `SplitLines`: each visual line of a headline rises out from behind its own mask. A word
rises `LINES.from` (115%) of its own box, so **a headline's travel is a function of its type size**. Read off
the shipped page at 1440×900:

| chapter | type | lines | travel |
|---|---|---|---|
| `arrival` — The Journey Begins | 92px | 3 | **0px** |
| `why-you-came` — 02 · The Jungles | 45px | 2 | **56px** |
| `invitation` — the close (his reference) | 70px | 2 | **84px** |

He was right about both, and understating the first. **The hero's headline was not weak, it was absent** —
`useInView` refuses to stage anything already on screen at mount, and the hero's headline always is. The
Jungles' was two-thirds of the one he was comparing it to, which is exactly the ratio of the type sizes.

## 2 · The hero — `curtained`

`components/motion/useCurtainReveal.ts`. The welcome screen is an opaque cream curtain over the whole
viewport for `WELCOME.hold`, so for that window the 4 Aug 2026 flicker finding — *staging settled text means
dropping it out of view in front of somebody who is looking at it* — has a false premise, and one the code
can check. The words stage behind the curtain and rise as it lifts.

**It declines rather than runs late.** Past `CURTAIN_LINES.stageBy` the hook returns `rest` and the page
behaves exactly as it did before. With no `[data-welcome]` in the document it declines outright — the whole
exception is licensed by something opaque being in the way.

### The clock, which was wrong once and is the finding worth keeping

`performance.now()` counts from navigation. The curtain's fade is a CSS animation that starts at **first
paint**. Measured: 380ms apart. Timed off `performance.now()` the rise began at 1,964ms while the curtain was
still fully opaque and had **13px of its 108px left** by the time the curtain cleared — the whole movement
spent behind the thing it was supposed to arrive out of. It now reads `Animation.currentTime` off the curtain
itself.

Traced with a MutationObserver on the shipped build, four consecutive loads at 1440×900:

| | staged | fade begins | rise begins | curtain gone | of the 1,400ms rise, seen |
|---|---|---|---|---|---|
| run 1 | 723ms | 1,857ms | 2,362ms | 2,507ms | **1,255ms** |
| run 2 | 372ms | 1,744ms | 2,258ms | 2,394ms | **1,264ms** |
| run 3 | 345ms | 1,716ms | 2,231ms | 2,366ms | **1,265ms** |
| run 4 | 277ms | 1,670ms | 2,178ms | 2,320ms | **1,258ms** |

Staging always happens while the curtain is fully opaque; the rise always begins ~140ms before it clears, so
the headline is already moving when the page appears; ~90% of the movement is in plain sight. Final state
`in` at 0px displacement in every run.

**A probe that reads layout every frame perturbs this by ~700ms.** The first version of the trace did, and
reported a defect that was its own. The numbers above come from a MutationObserver, which costs nothing.

### LCP, against a control

The obvious simpler build — a CSS `animation` with a backwards fill, no JavaScript — would hide the page's
largest text until 1.9s, and **on this page LCP resolves to that `<h1>` at desktop widths**. This build does
not, because the words are server-rendered at rest and painted at rest; script only moves them after
hydration, by which time the paint is recorded.

Measured rather than argued. `scripts/measure_lcp_arms.mjs`, medians of five, two builds one commit apart:

| | LCP | = FCP? | LCP element | hero `responseEnd` | first-load JS |
|---|---|---|---|---|---|
| with the reveal | **1,592ms** | yes | `<h1>` | 5,359ms | 158.4 KB |
| control (committed build) | **1,612ms** | yes | `<h1>` | 5,370ms | 158.2 KB |

LCP equal to FCP is the metric's floor — it cannot be improved on, and it is what both arms read. Both
differences are inside the run range (1,492–1,796ms). At 390×844 the point is moot: LCP resolves to an
`<img>` there, not to the headline.

## 3 · The Jungles — `deep`

`LINES.deepFrom` (170%). **The size is not the lever, because the size is his** — he asked for that heading
smaller on 19 Aug and has not asked for it back. `deep` starts each word further below its own mask instead:
measured **83px** of travel against the closing chapter's **84px**, at the same duration, on the same curve.
Not nudged towards the target — solved to it.

`app/globals.css` carries the rule. It wins on specificity, (0,3,0) against (0,2,0), which is stated in the
comment because this project's most-catalogued defect is two rules matching one element and being settled by
something other than intent.

## 4 · The Experiences cards — the zoom

`ImageReveal static` + `no-float` on the frame, `zoom-from-parent` on the card. Measured at 1440×900:

| pointer over | scale | reduced motion |
|---|---|---|
| the photograph | **1.06** | 1.000 |
| **the words** | **1.06** | 1.000 |
| the card's foot | **1.06** | 1.000 |
| frame `translateY` while hovered | **0px** | 0px |

`static` because he asked for a zoom and not an arrival: without it every card off the right-hand edge of the
strip would sit behind a cream mask, and the strip's one affordance at 390 — ~38px of the next card showing
past the screen's edge — would be a cream sliver.

### The finding: `zoom-from-parent` is not an enhancement here, it is the whole thing

It was added by analogy with `01 · The Lodges`, where it is a *second* selector covering the part of the
panel the words take the pointer over. **Removing it from this card drops the zoom at all three points, not
just the ones over the words** — watched failing, not reasoned about.

The cause is the card's shape: the generic rule is `[data-image-frame]:hover`, and this frame is `absolute
inset-0 -z-10`, a *descendant* painted behind everything. The element under the pointer is the card, and
`:hover` matches the hit element and its **ancestors** — so the frame is never hovered anywhere on the card.
Any composition that puts its photograph behind its content this way needs this class.

## 5 · Gates, on the shipped build

| | |
|---|---|
| `npm test` | **482** passed (477 + 5 new: four for `curtained`, one for `deep`) |
| `npm run build` / `tsc --noEmit` / `lint` | clean (5 pre-existing booking-provider warnings) |
| `npm run verify:budget` | **167.7 KB brotli** against 167.5 committed — **+0.2 KB**, the new hook |
| `check_entrances.mjs` | PASS — and **9 headlines staged/settled against 8 before**, which is the hero joining |
| `check_experience_strip.mjs` | PASS — **13 assertions** now; 13 is the hover zoom, watched failing |
| `check_contrast_over_photos.mjs` | 156 probes, **0 failures**, all three routes |
| `check_welcome.mjs` | PASS — gone by 2,677ms, no-JS and reduced-motion arms clean |
| `measure_density.mjs` | **identical to the decimal** — page mean 33.2%, worst 66.4%, imagery 57.2%, all seven chapters inside 45% |

Nothing here changes layout, so density could not move and did not; both effects are CSS transforms and the
only JavaScript added is one hook.

## 6 · Two rigs changed, and both got stronger

- **`check_entrances.mjs` asserted the hero headline was *never staged*** — true, passing, and describing a
  page on which the effect the client believed he had asked for was not happening. That is "the mechanism is
  configured" standing in for "the behaviour happened", which this rig's own header warns against. It now
  reads the hero twice and asserts the reveal both **played** (`in`) and **finished** (every word at 0px, not
  just the first).
- **`stagedInView` now discounts anything staged while the welcome is still running** — and it is a *play
  state*, not an opacity threshold. An opacity threshold was tried first: the fade runs on `--enter-ease`,
  which is heavily front-loaded, so the curtain is at 0.04 three-quarters through and spends its last 150ms
  in the noise below any number anyone would pick. The moment the welcome finishes, the rule is absolute
  again at every scroll position for the rest of the page.

## 7 · Still open

- **The hero shows for ~140ms with a gap where its headline goes**, between the curtain thinning and the rise
  beginning. It is the cost of the rise being visible at all — `ENTER.ease` has travelled 58% of its distance
  by a quarter of the way through, so a rise that starts as the fade begins is 93% finished before anyone can
  see it. If the client would rather have no gap, `CURTAIN_LINES.delay` is the one number, and the trade is
  that the movement goes back behind the curtain.
- **The Jungles heading's type size is still the biggest lever available** and it is the client's. `deep`
  matches the closing chapter's travel at his own size; setting it larger would exceed it.
