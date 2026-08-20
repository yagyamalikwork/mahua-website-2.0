# The words floating over the photograph — evidence

**21 August 2026, on `feat/home-v2`.** The client, having looked at what was built for his 20 August
request:

> *"I think you misunderstood my request. When I asked you to add a 3D effect I meant the text should look
> like it is floating/raised over the image, like we have for the last section (section with the reviews on
> it) where when we scroll the text gives a 3D effect on. And not the rise effect that you added to our
> opening section (The Journey Begins) and increased on the 02-The Jungles section, so remove the rise effect
> from The Journey Begins and also return it back to as it was before for 02-The Jungles (at 56px), and work
> on the text 3D raised/floating effect that is the same as we also already have on the text and all the
> elements on the last section."*

## 1 · What the closing chapter actually has, and nothing else on the page did

**Parallax.** `08 · The Invitation` draws its photograph through `ui/FullBleed.tsx`, which wraps it in
`components/motion/Parallax.tsx`; every other photograph on this page is still. `check_entrances.mjs` had been
reporting it for weeks in one line nobody had reason to read twice:

```
parallax  1/1 moved  |  moved 79px (0.069 of 1149px)  invitation[0] birding-cairn-dusk-1440.avif
```

The photograph drifts while every word stays where the layout puts it. **The difference in rate is the whole
effect** — it reads as the type being lifted off the frame, and it exists only while the section is passing,
which is precisely what he described. It is not a shadow, not a transform on the text, and nothing about it
can be seen in a screenshot.

**The earlier reading was `SplitLines`' line rise**, which is a different thing that also happens in that
section. The diagnosis behind it was sound and its measurements still stand
(`docs/reviews/2026-08-20-reveals-and-zoom/README.md`); the prescription answered the wrong question.

## 2 · What was removed

| | |
|---|---|
| `curtained` on the hero's headline | gone, with `components/motion/useCurtainReveal.ts`, `CURTAIN_LINES` and its four tests |
| `deep` on the Jungles heading | gone, with `LINES.deepFrom`, its CSS rule and its test |
| `check_entrances.mjs` | restored to asserting the hero's headline is **never staged**, and `stagedInView` back to having no curtain exemption |

`LINES.from` survives — that is only the literal `115%` lifted out of the stylesheet into the dial file, which
is where every other number of its kind lives. The Jungles heading travels **56px** again, exactly as before.

**491 tests** — five fewer than yesterday, which is the four curtain tests plus the `deep` one, and no
regression. **First-load JavaScript is back to 167.5 KB brotli**, the figure before any of this began: the
hook that cost 0.2 KB took it with it, and `Parallax` costs nothing on load (GSAP is fetched only when a
parallaxed element is within a screen, and this page already fetched it for the closing chapter).

## 3 · What was built — `02 · The Jungles` now drifts

`JUNGLE_BAND.driftOversize`. The photograph is drawn **27.6% taller than the band** and re-centred *before*
`Parallax` touches it, so the drift has somewhere to go: the translate is ±7.5% of the band's height and the
overhang is 13.8% at each end — **1.84× what the movement can ever ask for.** Same arithmetic as
`ui/FullBleed.tsx`, expressed as a fraction because this band's height is `max(floor, its own words)` and
there is no `vh` to key it to.

### Measured on the shipped build

Both quantities relative to the section, so page scroll cancels and what is left is the drift:

| | photograph moves | its words move | separation |
|---|---|---|---|
| `02 · The Jungles` | **70.6px** | 16.1px | **54.5px** |
| `08 · The Invitation` (his reference) | 79.5px | 18.3px | **61.2px** |

The words' 16–18px is the `Enter` block rise that was always there. The two sections are now within 11% of
each other, and the Jungles' figure is smaller only because parallax is a fraction of an element's height and
that band is 446px against 1,149px.

`check_entrances.mjs`: **parallax 2/2 moved**, 0.087 and 0.069 of their own heights against the 0.15 cap, and
**0 of 8 under reduced motion**.

### The re-crop, and what it cost

Drawing the photograph 27.6% larger means the band shows the middle ~78% of it — **on the height axis only**,
which `JUNGLE_BAND.minHeightVw` already records as the one axis this stitched composite can afford to lose.
Both edge cats are still in frame at every width where the floor binds; screenshots at three scroll positions
were opened and read.

**A re-crop is a re-solve, so the scrim was re-measured rather than assumed** — and this time across the
drift, because the pixels under the glyphs now change as the section passes. Eight scroll positions, three
viewports, type hidden and the real composited pixels read:

| | worst across the drift | floor |
|---|---|---|
| 1440×900 | **5.03:1** | 4.5 |
| 1024×768 | **5.37:1** | 4.5 |
| 390×844 | **5.03:1** | 4.5 |

`flat: 0.74` is unchanged and needed no re-solving, which is what its own note predicts: **a pure flat is the
one wash whose strength does not depend on where the type sits**, and this photograph's bright pixels are
spread through the canopy rather than gathered in one band. `check_contrast_over_photos.mjs` agrees at its own
six widths (5.03–9.27).

One reading in that sweep needs discounting and is recorded so nobody chases it: at a scroll position where
the section's top is *above* the viewport, the type sits under `SiteHeader`'s fixed cream bar and measures
1.00:1. That is true of every section on this page as it scrolls away and is not a property of the drift.

`check_image_resolution.mjs`: **0 under-served at every width**, DPR 1 and 3. `BAND_BOX` is divided by
`driftOversize` so `sizes` describes the box that is actually drawn — and it changes nothing in practice,
because at `coverAspectFloor` the band already asks for the library's widest file at every viewport.

## 4 · Still open

**The hero.** Its headline is still again, which is where it was before 20 August — so `The Journey Begins`
has none of this effect, and the client asked for it on both sections. It was not added unasked because it is
not free there: `ui/Hero.tsx` records a deliberate decision that the hero carries no parallax, and giving it
one would draw that photograph ~28% larger and show the middle 78% of it. **That is a re-crop of the page's
most important photograph, and its scrim (`top: 0.92, bottom: 0.5, corner: 0.78`) would have to be re-solved
against the new pixels.** Worth doing if he wants it; his call, not an oversight.
