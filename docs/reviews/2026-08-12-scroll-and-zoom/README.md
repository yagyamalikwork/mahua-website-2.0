# Softer scroll, and a slow zoom on hover — 12 August 2026

Two client requests, both measured on a production build.

> 3. *"We need to make our scroll more smoother and softer."*
> 4. *"Very smooth, slow and soft zoom in effect on the images on the Homepage, where the image size — or
>    we can say the border or outline size — remains the same and the image zooms inside the same boundary
>    when cursor is hovered over it, and returns back to normal when cursor is moved away."*

---

## 3 · The scroll

Lenis was running `{ duration: 1.1 }` with its default exponential easing, **hard-coded in
`components/motion/SmoothScroll.tsx`** — which is the one thing this project's architecture rule forbids:
no component holds a duration. The numbers now live in `SCROLL` in `lib/motion.ts`.

| dial | was | now | why |
|---|---|---|---|
| `duration` | 1.1 | **1.4** | how long the page glides after the wheel stops |
| `easing` | expo-out (Lenis default) | **quartic-out** | expo leaves abruptly and has a long tail; quartic leaves gently and settles sooner, which is the shape "softer" actually describes |
| `wheelMultiplier` | 1 (default) | **0.9** | takes the edge off each wheel notch, so one hard flick travels less far |

**The trade is written down because it is real:** a longer glide reads as soft up to a point and as *lag*
past it — the page carrying on after the reader has stopped asking. 1.4s is soft and still arrives when
you expect it to.

Measured on the production build, one 600px wheel flick:

- travelled **540px** — exactly `600 × 0.9`, so the softening is doing what it says
- settled after **1,191ms**
- **20 distinct scroll positions** sampled during the glide; a jump would show ~2

## 4 · The hover zoom

The photograph grows **inside a frame that does not move**. `ImageReveal` was already
`position: relative; overflow: hidden`, so it was already the boundary the client described — the effect
is one CSS rule and **no JavaScript at all**.

| dial (`PHOTO_ZOOM`, `lib/motion.ts`) | value |
|---|---|
| `scale` | **1.06** |
| `out` (growing) | **1.8s** |
| `back` (returning) | **0.9s** |

**1.06 and not more**, because non-negotiable #4 says that if you notice the animation it is too fast — and
a zoom is noticed by its *rate*, not its distance. 6% over nearly two seconds is a photograph breathing;
the same 6% in 300ms is a twitch. The return is quicker than the growth so a photograph settles back
promptly rather than following the visitor around the page.

### Two decisions worth keeping

**It scales the frame's grandchild, not `[data-image-inner]`.** The arrival animation already owns that
element — it animates the `scale` *property* there with its own transition and delay. A `transition`
declared on the same element at higher specificity would have replaced that shorthand wholesale and
quietly broken how every photograph on the page arrives. Putting the two effects on separate elements
means neither can reach the other.

**Scoped to `[data-hover-zoom]`, which only `app/page.tsx` sets.** The client asked for the homepage and
asked for nothing else to change, so the property pages are deliberately untouched. The hero opts out via
`noZoom`: it is a backdrop carrying a headline, and a background that stirs when the pointer crosses it is
restless.

`:hover` only, never `:focus-within` — a keyboard visitor tabbing through links would otherwise set
photographs moving that they never pointed at.

## Measured

| | result |
|---|---|
| Hover, normal motion | scale **1.06**, returns to **1** on leave |
| **Frame movement while zooming** | **0.00px** — the boundary never moves, which was the request |
| Property pages | **0** zoomable frames — correctly homepage-only |
| **Reduced motion** | scale **1** — no zoom at all |
| First-load JavaScript | 172,209 → **172,272 br, +63 bytes** (the easing function; the zoom is pure CSS) |
| Headroom under the 175 KB ceiling | **6,928 bytes** |

453 tests, `tsc --noEmit` and `lint` green.

### One defect found by measuring, in my own CSS

The first reduced-motion rule **did not work**, and looked completely right. It was
`[data-hover-zoom] [data-image-frame] [data-image-inner] > *` at specificity (0,3,0), while the hover rule
is (0,5,0) thanks to `:not([data-no-zoom])` and `:hover`. The weaker rule lost *inside the media query*,
and a reduced-motion visitor still got the full zoom — measured at 1.06 on a build where the block was
present and read correctly.

That is this project's most-catalogued defect: two rules matching one element, resolved by something other
than intent. The fix repeats the hover selector exactly and wins on document order. **Nothing would have
caught this except running it with reduced motion on** — the CSS reads as though it works.


---

## The caption zoomed too — client report, 12 Aug, fixed

> *"In sections 03-The Forest, 05-The Rooms and 07-Details the images have text written under them. The
> zoom works perfectly, but in these sections the text under these images also zooms in and out with the
> image."*

Right, and the cause is structural: `ui/Plate.tsx` puts a `<figure>` inside the frame holding the
photograph **and** its caption. The first rule scaled the frame's child — which is that whole figure — so
the type went with the picture. Only the three `PlateGrid` chapters have captions inside a frame, which is
exactly the three he named.

**Fixed by naming the `<picture>`** rather than the frame's child, so the effect reaches the photograph and
nothing else whatever a component wraps it in. `img:not(picture img)` catches a bare `<img>` in a frame
with no `<picture>`, without double-scaling the one inside a picture that already scales.

Measured with the page held still and the caption read **relative to its own frame**, so page scroll
cannot contaminate it:

| chapter | caption width | caption offset in frame | picture scale |
|---|---|---|---|
| forest | 416.37 → 416.16 | 613.91 → 613.77 | **1.06** |
| rooms | 416.32 → 416.16 | 427.82 → 427.75 | **1.06** |
| details | 358.21 → 358.00 | 588.96 → 588.80 | **1.06** |

Sub-pixel differences are rounding. The caption does not move; the photograph does.

Captionless frames still zoom — `lodges` 1.06, and all three of `rooted`'s collage photographs 1.06.
Reduced motion remains 1 everywhere. 453 tests green.

**Two instrument errors on the way, both mine, both worth the warning.** The first reading said "still
wrong" on all three chapters: it measured the caption in *viewport* coordinates while the page was still
gliding from a smooth scroll, so ordinary scrolling looked like the caption moving. The second said
`rooted` did not zoom at all: it hovered a point 40px below a frame's top edge, which on a tall pinned
frame is not necessarily over the photograph. **Both times the page was right and the measurement was
wrong** — the failure this project has catalogued more than any other.
