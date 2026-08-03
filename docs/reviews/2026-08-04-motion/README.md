# Task 5 — the scroll primitives, measured

Plan 3 Task 5 built `ImageReveal`, `SplitLines` and `StickyScene`. Its verification step was
`tsc && test && build && lint`, none of which can see whether anything actually moves. These were captured
in Chromium at 1440×900 against a throwaway `/preview/motion` route, since the real page does not exist
until Task 7. The route was deleted afterwards; regenerate it from this file if the primitives change.

## What the frames show

| File | What it proves |
|---|---|
| `headline-mid-stagger.png` | The per-line stagger caught mid-flight: line 1 nearly risen, line 2 halfway, line 3 barely emerging |
| `image-mid-reveal.png` | The mask genuinely covering a photograph mid-wipe — not a still frame that could pass for no animation |
| `image-settled.png` | The same photograph fully revealed |
| `hero-headline-no-flicker.png` | The hero headline at rest, never displaced |
| `no-javascript.png` | JavaScript disabled: headline fully readable, descenders intact |
| `reduced-motion-top.png` | `prefers-reduced-motion`: identical to the no-JS frame, nothing pinned |

## Measurements

```
hero headline non-identity transforms over 1.2s : []            (never moves)
below-fold headline staged at                   : y = 63.5px    (hidden behind its mask)
below-fold headline y mid-reveal                : [9,9,9,9,15,15]  (two lines, different offsets)
below-fold headline y at rest                   : [0,0,0,0,0,0]
words clipped by their mask at rest             : []            (no cropped descenders)
image mask mid-reveal / at rest                 : scaleY 0.42 / scaleY 0
sticky scene                                    : 2.00 screens reserved, position sticky
reduced motion                                  : 0 of 22 words transformed, 0.71 screens, position static
```

## One defect this found

The first capture showed the on-screen headline's words at `transform: none` on the first sample and
translated 28px 300ms later — settled text painting, then dropping out of view and lifting back. A visible
flicker, and invisible to every unit test in the suite.

Fixed by skipping the tween entirely for a headline that is already on screen when the page loads: there is
nothing to reveal, because the markup already painted it. Headlines the visitor *scrolls* to are unaffected
— their staged state is applied while they are still below the fold — and that is every headline on the
page bar the hero. Skipping the hero also keeps it off the LCP clock.

`components/motion/primitives.test.tsx` now guards both halves: nothing moves on screen, and something
*does* move below the fold. Without the second, the first would be satisfiable by a component that never
animates at all.

## Two things that looked like defects and were not

Recorded because both cost time and both would mislead a future reader of the raw numbers.

- **"55.8px of descender overflow on every word."** That was the staged from-state of a below-fold
  headline — the words correctly hidden behind their mask — not clipping. Measured again at rest: zero.
- **"The mask is still covering under reduced motion."** The probe read `getComputedStyle(el).transform`
  as `"none"` and fed it to `DOMMatrixReadOnly`, which returns the identity matrix, whose `d` is 1. An
  identity matrix read as "fully covering". `no-javascript.png` and `reduced-motion-top.png` show the
  photographs and text perfectly visible.
