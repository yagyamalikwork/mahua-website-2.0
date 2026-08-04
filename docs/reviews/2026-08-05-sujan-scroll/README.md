# The reference site's scroll behaviour, measured — 5 August 2026

Probed with Playwright at 1440×900 against the live [thesujanlife.com](https://thesujanlife.com/). Recorded
because Plan 4 is built from these numbers rather than from a description of them, and because two of the
findings contradict what the effect looks like.

## The header

| Scroll | `position` | Height | Background | Nav text |
|---|---|---|---|---|
| 0 | `fixed` | 77px | `rgba(0,0,0,0)` — transparent | `rgb(51,51,51)` |
| 1200 | `fixed` | 77px | `rgb(246,243,239)` — cream | `rgb(51,51,51)` |
| 3000 | `fixed` | 77px | `rgb(246,243,239)` | `rgb(51,51,51)` |

The class goes `g_nav_w` → `g_nav_w has-bg`. **The text colour never changes.** The bar earns legibility by
gaining a background, not by inverting its type — which is the answer to the objection recorded in our own
`SiteHeader`, that a header following the visitor onto cream would have to invert mid-scroll.

## The entrance — and it is not 3D

Live elements below the fold, sampled with their computed styles:

```
DIV .y_b_text ab     transform: matrix(1, 0, 0, 1, 0, 17.9062)   → translateY 17.9px
DIV .d_b_text ab     transform: matrix(1, 0, 0, 1, 0, 14.0625)   → translateY 14.1px
DIV .main_video      transform: matrix(1.0013, 0, 0, 1.0013, 0, 0) → scale 1.0013
```

**`perspective: none` on every element sampled, and no `perspective(` anywhere in the document.** What reads
as a dimensional lift is a 14–18px rise, a scale change of about one part in a thousand, and a slow ease.
Building literal 3D would not match it.

`translate3d` does appear in the CSS, but as a compositing hint — a Z of zero.

## Libraries

| | |
|---|---|
| Lenis | **yes** — we already use it |
| Swiper | yes, for one camp carousel |
| **GSAP** | **no** |
| ScrollTrigger | no |
| AOS / Locomotive / `data-scroll` | no |

The reference achieves all of the above with CSS transitions and Lenis. We carry **GSAP 71.2 KB +
ScrollTrigger 43.5 KB** to do the same work. That is the single largest weight lever on the page and the
reason Plan 4 is expected to make the site faster rather than slower.

## Reproduce

A short Playwright script: load the page, dismiss the cookie banner, read the header's computed
`position`/`backgroundColor` at several scroll positions, then collect any element whose computed
`transform` is not `none` or whose `opacity` is below 1, together with its `perspective`.
