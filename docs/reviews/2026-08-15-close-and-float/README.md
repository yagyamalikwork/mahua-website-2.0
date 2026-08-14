# The close offers the two lodges, and the plates float — 15 August 2026

Two client requests.

## 1 · The closing section chooses between the lodges

> *"Replace the 'Plan Your Stay' button on the last section with 'Mahua Vann, Pench' and 'Mahua Tola,
> Tadoba', so that if the viewer presses Plan Your Stay on the header it takes them to the last section
> with 'Two Forests Are Expecting You' and actually shows the option to select from the two properties
> rather than another Plan Your Stay button that takes them to mahuaresorts.com."*

The header's pill already pointed at `#invitation` — verified, not assumed — so only the section's own
button changed. One external link to `mahuaresorts.com` became two internal ones to `/mahua-vann` and
`/mahua-tola`, same `PillButton`, `size="large"`, plus the 3D raise the client asked for.

**No lodge name is written in this file.** `content/site.ts` already carries the label, the region and the
route for both, and the menu's tiles draw from the same three fields — so a renamed or a third lodge
arrives in both places at once and cannot disagree with itself. The comma joins two names already
supplied; it is punctuation, not new copy.

**They wrapped onto two lines at first, at every width.** The prose column is `max-w-[60ch]` — about 530px
— and the pair needs slightly more, so the row now sizes to its own content (`w-max`) inside an
`items-center` parent. `flex-wrap` with a viewport cap is what puts them back on two lines where they
genuinely do not fit.

| viewport | result |
|---|---|
| 1600 × 1000 | side by side, inside the viewport |
| 1440 × 900 | side by side, inside the viewport |
| 1024 × 768 | side by side, inside the viewport |
| 390 × 844 | 2 rows — genuinely too narrow — still inside the viewport |

Measured: header pill → `#invitation`; buttons → `/mahua-vann` and `/mahua-tola`, neither opening a new
tab; raise measured at **8px rise, scale 1.015**, the same numbers as the menu tiles because it reads the
same `--raise-*` properties.

**`.raise` could not be reused as-is.** It is written `a:hover .raise` — the raised thing is a child
*inside* a link — and a `PillButton` **is** the link, so putting it on a span within would lift the label
out of its own gold shape. `.pill-raise` is the same numbers with the pill itself as the subject.

**One honest limitation:** these two sit on `--overlay`, and the raise's shadow is also `--overlay`, so on
this section it contributes almost nothing — the rise, tilt and scale carry it. The shadow stays because
the class is not section-specific and the next pill to opt in may sit on cream, where a raise without a
shadow reads as a glitch rather than as height.

## 2 · The plates float

> *"The zoom we added a few days ago is perfectly fine, I just want them to very slightly lift and rise
> towards the viewer and no tilt, which will give the images a float like effect."*

`FLOAT` in `lib/motion.ts` — `RAISE` with the rotation removed. **6px, no tilt**, and a soft `--overlay`
shadow, which is what sells *toward the viewer* rather than merely *upward*.

6px against `RAISE`'s 8 because "very slightly" was the brief and these frames are far larger than a menu
tile, so the same distance reads as more movement. Slower out (0.7s) than the tiles' 0.4s, because a float
is a drift and a card being picked up is not; quicker back (0.5s), so a photograph settles rather than
following the visitor around the page.

**The lift is on the frame; the zoom stays on the picture inside it.** The two never touch the same
element, so they cannot compose into a transform neither was measured at, and either can be changed
without disturbing the other. It is also why the whole plate rises together — in `ui/Plate.tsx` the caption
lives inside that frame, and a photograph floating away from its own caption would read as a layout fault.

| | rise | tilt | zoom | shadow | settles back to |
|---|---|---|---|---|---|
| normal motion | **6px** | **0** | **1.06** | yes | 0px |
| reduced motion | **0px** | 0 | 1 | yes | 0px |

The shadow persisting under reduced motion is deliberate and matches `.raise`'s own precedent: a visitor
who asked for less motion still gets an answer when they point at something.

## Cost

**First-load JavaScript: 172,272 bytes brotli — delta 0.** Both effects are CSS; the buttons are two links.
467 tests, `tsc --noEmit`, `lint` and `next build` all green.

## Three instrument errors on the way, all mine

Worth recording, because the page was right every time and the measurement was not — the failure this
project has catalogued more than any other.

1. A probe hovered a frame chosen by `.find()` and then read a *different* frame, reporting rise 0 and
   zoom 1 on a working page.
2. A "fully visible frame" filter (`top > 0 && bottom < innerHeight`) matched nothing, because the plates
   are taller than the viewport at 1600×1000.
3. Coordinates were taken while the smooth scroll was still moving, so the pointer landed where the frame
   had been.

What settled it was reading `document.querySelector("[data-image-frame]:hover")` — the element the browser
itself considers hovered — rather than one selected by arithmetic.
