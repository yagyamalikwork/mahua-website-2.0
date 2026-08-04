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

> **CORRECTED 5 Aug 2026, same day.** The first version of this file said the reference does not use GSAP,
> and Plan 4 was built on that claim. **It was wrong.** The probe searched `document.documentElement.outerHTML`
> for the string `gsap` — which a bundled, tree-shaken copy never appears in; only the bundle's filename
> does. `window.gsap` is also `undefined`, because the bundle is an ES module that exposes nothing globally,
> so the false negative looked confirmed twice over. The client's own analysis said GSAP, and the client was
> right. **Seventh instance of this project's recurring defect: a check that confirmed a mechanism instead of
> an outcome.** The correct test is to read the bytes that actually load.

Measured by intercepting every JS response and reading the bundle:

| | |
|---|---|
| `sujan-e.vercel.app/main.js` | **87.9 KB transferred, 251.5 KB unpacked** — a custom bundle |
| **GSAP** | **yes** — 65 `registerPlugin` hits, 48 `_gsap` internals, 182 `.to(`/`timeline(` calls |
| **ScrollTrigger** | **yes** — and **17 `scrub` hits**, so effects are scroll-linked frame by frame |
| **SplitText** | yes |
| **Lenis** | yes — 29 hits |
| Swiper 8 | yes, 39.7 KB, for the card row |
| **Total JS** | **174.1 KB across 30 files** |

So the reference spends about as much on animation as we do. The comparison that matters is not "do they use
a tween library" but "what is each library paying for". GSAP earns its place there on the **scrubbed** work —
the pinned section, the text fill, the video magnify — none of which CSS can drive from scroll position with
reliable support today. Simple entrances do not need it, which is why Plan 4 still builds those in CSS.

## Reproduce

A short Playwright script: load the page, dismiss the cookie banner, read the header's computed
`position`/`backgroundColor` at several scroll positions, then collect any element whose computed
`transform` is not `none` or whose `opacity` is below 1, together with its `perspective`.
