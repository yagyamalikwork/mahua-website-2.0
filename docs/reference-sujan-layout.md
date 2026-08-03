# The Sujan layout DNA

Derived 3 Aug 2026 by screenshotting [thesujanlife.com](https://thesujanlife.com/) at 1440×900 across eight
scroll positions with Playwright, then reading the frames. **This is the reference the client asked us to
take heavy inspiration from.** Recorded here because it was derived once and would otherwise be lost.

To regenerate: a short Playwright script that loads the page, dismisses the cookie banner, and screenshots
at even scroll intervals. Run it from the repo root so `playwright` resolves.

## Overall shape

**8.2 screens** at 1440×900. Our rejected build was 13.4 and felt emptier — length was never the problem,
density was.

The page alternates strictly: **full-bleed photographic screen → compact cream content screen → full-bleed →
…**. Never two quiet screens consecutively. That alternation is the single most transferable thing about it,
and is why an 8-screen page feels full where a 13-screen one felt hollow.

## The moves, in order of how much they matter

1. **Hero.** Photograph fills the entire viewport. Huge display serif headline sits **bottom-left in white** —
   *"Exceptional experiences connecting you to the soul of India."* No card grid, no chrome, nothing competing.
   Header is three items: `MENU` left, wordmark centred, a **gold pill CTA** right.

2. **Two-tone headline.** Their signature. A centred display-serif heading with **one word dropped to a
   lighter grey** while the rest stays dark:
   > *"A legacy of conservation **woven** through generations"*
   > *"Discover the **wilderness** of Rajasthan whilst making a positive impact."*

   Cheap to implement, instantly recognisable, and it carries most of the "expensive" feeling.

3. **Floating asymmetric images.** Photographs sit at the margins **cropped by the viewport edge** — a
   black-and-white portrait hanging off the far left, another peeking in at bottom-right, at different
   heights. **Not grids.** This is what fills the screen around centred text without the layout looking
   like a template.

4. **Text over photograph.** Pull-quotes sit *on* the image in white serif, not beside it.

5. **Line-drawn icons.** Small hand-drawn marks (binoculars) and an **illustrated map** of the region with
   camps marked. Directly compatible with Mahua's field-guide idiom and the hand-drawn Pench map the audit
   praised.

6. **Buttons.** Solid pills — gold, or dark brown. Generous padding, letter-spaced small caps.

## Palette and type — near-identical to Mahua's own guidelines

| | Sujan | Mahua v3 fieldguide |
|---|---|---|
| Base | warm cream ≈ `#F5F0E8` | `#F1E9D7` |
| Accent | gold | `#BB8F2E` |
| Display | high-contrast serif | Gilda Display |
| Labels | letter-spaced caps | Cinzel |

This is why the client's instruction to follow both the guidelines *and* Sujan is not a contradiction —
they already agree. The guidelines add numbered chapters (`01 · The Idea` … `09 · The Lodges`), captioned
plates, and a four-way photography taxonomy (*the lantern hour · the forest · life at the lodge · details*).

## What we deliberately do differently

- **No video.** Sujan's hero is video; we have stills only. Compensated with density and scroll motion.
- **Our own content.** Structure and layout language are the reference; the words, photographs and chapter
  scheme are Mahua's.
