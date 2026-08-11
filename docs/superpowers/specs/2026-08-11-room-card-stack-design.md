# The rooms as a card stack — design

**Date:** 11 August 2026
**Status:** approved in outline by the client 11 Aug; this document is the detail
**Scope:** the `rooms` chapter on `/mahua-vann` and `/mahua-tola`. Nothing on the home page.

---

## 1. What this is

The rooms chapter currently lays each room out as a band down the page — photograph at one of three
scales, name, one sentence, a caption of facts. This replaces that with a **card stack**: each room is a
card that sticks below the header while the next card rises over it, leaving the ones already read as a
deck of edges at the top. A covered card recedes slightly — scaling down and dimming — so the deck reads
as depth rather than as stacked paper.

The client asked for it on 11 Aug 2026 and chose this variant ("pile up, with recede") over a plain
pile-up and a peel-away deck.

**It costs no JavaScript.** That is the reason this design is shaped the way it is, and §6 is where the
constraint bites.

---

## 2. The measured envelope

Everything below is derived from this table rather than chosen. Measured on the running site at the four
widths this project reviews at, scrolled past the hero so the header is opaque and the booking bar is up:

| viewport | header | booking bar | **slack** | rooms chapter today |
|---|---|---|---|---|
| 390 × 844 | 75px | 63px | **706px** | Vann 1,738 / Tola 2,035 |
| 768 × 1024 | 107px | 69px | **848px** | Vann 2,270 / Tola 2,756 |
| 1440 × 900 | 107px | 69px | **724px** | Vann 2,437 / Tola 3,266 |
| 1920 × 1080 | 107px | 69px | **904px** | Vann 2,647 / Tola 3,544 |

**Slack is the whole design constraint**: the vertical space a card may occupy without being clipped by
the header above or the booking bar below. The binding case is **the phone at 706px**, not the 1440 desktop
the project usually designs against — the first time on this project that the phone has been the tighter of
the two.

A card must fit inside `slack − deck depth − breathing room`, and the build must **solve for that** rather
than hard-code a height. See §9.

---

## 3. The photographs, which are not what the current design implies

| room | file | aspect | today's box | cropped away |
|---|---|---|---|---|
| Vann Deluxe | `vann-room-deluxe` | 1163×508, **2.29:1** | `offsetLeft` 3:2 | ~35% of width |
| Vann Cottage without Deck | `vann-room-cottage-plain` | 1440×588, **2.45:1** | `wide` 21:9 | <5% |
| Vann Cottage with Deck | `suite-tiger-painting` | 1440×961, **1.50:1** | `offsetRight` 4:3 | ~11% |
| Tola Deluxe | `tola-room-deluxe` | 1163×508, **2.29:1** | `offsetLeft` 3:2 | ~35% |
| Tola Suite | `tola-room-suite` | 1163×508, **2.29:1** | `wide` 21:9 | <2% |
| Tola Family Suite | `tola-room-family` | 1440×2160, **0.67:1 (portrait)** | `offsetRight` 4:3 | **~50% of height** |
| Tola Camping Hut | `tola-room-camping` | 1163×508, **2.29:1** | `wide` 21:9 | <2% |

Two things follow, and both are arguments *for* this change rather than costs of it:

**Six of the seven room photographs are 2.29:1 or wider.** The "three scales" that make the current
section a composition are, for four of those six, achieved by cropping a wide photograph into a squarer
box and throwing away a third of it. A card that shows a photograph closer to its own shape crops **less**
than what is on the page today.

**One is portrait and is being cropped in half.** `tola-room-family` is 1440×2160 and sits in a 4:3 box,
which discards about half its height. It is the one room that genuinely wants a different arrangement.

So the card's internal layout is **derived from the photograph's own aspect ratio**, read from `MEDIA` at
build time, rather than from a hand-assigned scale. That is the same rule the rest of this project's
artwork follows: derive from the asset, do not hard-code a number beside it.

| photograph aspect | card layout |
|---|---|
| **≥ 1.9:1** (six of seven) | photograph across the top of the card, words in a band beneath it |
| **< 1.9:1** (`suite-tiger-painting` 1.50, `tola-room-family` 0.67) | photograph beside the words from `lg` up; above them below `lg` |

1.9 is the threshold because it separates the two real populations — 2.29 and up against 1.50 and 0.67 —
with the widest margin available, so no room sits near the boundary and a re-crop of any single photograph
cannot silently flip its layout.

**The `scale` field in `RoomEntryCopy` is retired.** Its three values encoded crop decisions that the
photographs themselves already state. No copy changes: `name`, `line`, `facts` and `note` are untouched,
so `content/mahua-vann.ts` and `content/mahua-tola.ts` lose one field per room and gain nothing.

### The crop bound, which is the part that must be solved

A card is a fixed box and a photograph has its own shape, so the photo area inside the card crops. The
danger is documented per room in the current content file: `vann-room-cottage-plain` must not lose width,
because the sit-out and the cane chair its alt text names sit near the frame edges.

**The rule is therefore a bound, not a ratio: no photograph may lose more than 25% of its width, at any
of the four review widths.** Losing *height* is unbounded by this rule — every documented constraint on
this page is about width, and a room interior tolerates a trimmed ceiling far better than a trimmed wall.

The photo area's aspect is what satisfies that, and it differs by breakpoint because the card does:

| viewport | card | photo area | worst crop, of the seven |
|---|---|---|---|
| 390 | 342 × 640 | 342 × 190 (1.80:1) | 21% of width (`tola-room-family`, portrait — beside-layout, so exempt) / **0%** of the six wide ones' width |
| 768 | 672 × 760 | 672 × 300 (2.24:1) | ~2% |
| 1440 | 1,248 × 658 | 1,248 × 430 (2.90:1) | 0% — height is what goes |
| 1920 | 1,504 × 760 | 1,504 × 520 (2.89:1) | 0% |

**A wide photo area crops height, never width, and that is the point.** The six 2.29:1 photographs lose
nothing horizontally at any width above 390, and at 390 the area is deliberately squarer than they are so
they still lose none. This is strictly better than what ships today, where four of them lose 35%.

`scripts/check_image_resolution.mjs` already proves no photograph is served below its box; the new rig
adds the crop bound beside it, and **fails rather than warns**. Hand-picking a photo aspect and hoping is
how the 35% crops got there.

---

## 4. Architecture

```
ChapterSurface  (existing — already overflow-x: clip, which is what lets sticky work)
└── RoomCardStack                        server component, no "use client"
    ├── heading block                    ChapterMark + TwoToneHeading + intro — NOT sticky
    └── <ol class="room-stack">
        └── <li class="room-slot">       normal flow. Carries view-timeline-name.
            └── <article class="room-card">   position: sticky. The card.
                ├── <RoomCardMedia>      Photo at the room's own aspect
                └── words                name, line, facts, optional note
```

**The slot/card split is the mechanism, not decoration.** A sticky element cannot drive a scroll-linked
animation from its own position — once stuck it stops moving, so its own view progress stops advancing.
The slot stays in normal flow and scrolls normally; its view timeline is what the card inside reads to
know how far it has been covered. Collapsing the two into one element removes the recede entirely.

**Nothing here is a client component.** No `"use client"`, no hooks, no scroll listener. The one JavaScript
change in the whole design is in §5.

---

## 5. `--property-bar-height`

`PropertyBar` gains one line: it writes its own measured height to `--property-bar-height` on the document
element, exactly as `StickyHeader` already writes `--header-height`.

**The fallback is `0px` and it is load-bearing**, on precisely the same reasoning as `scroll-padding-top`
in `app/globals.css`: the bar is a client component that fails towards absent, so a page with no
JavaScript has no bar to avoid, and a card that reserves no space for one is correct there. The variable
is only ever written while the bar is actually on screen.

This is the only JavaScript this design adds, it is ~4 lines inside an existing client component, and it
adds no new bundle. The budget assertion in §10 is that the first-load JavaScript changes by **0 KB**.

---

## 6. The stack

```css
.room-slot { view-timeline-name: --room-slot; view-timeline-axis: block; }

.room-card {
  position: sticky;
  top: calc(var(--header-height, 0px) + var(--deck-step) * var(--i));
  height: var(--card-height);
}
```

- `--i` is the room's zero-based index, written by the component as an inline style.
- `--deck-step` is **14px**. With Tola's four rooms the deck is 42px deep at the last card; with Vann's
  three it is 28px. Both are inside the slack budget in §9.
- The deck edge is a **1px gold hairline** across the top of each card. Gold is decorative and this is
  exactly its job (non-negotiable #7); no text sits on it.
- The card's surface is the **opposite paper to its section** — `--surface` where the chapter is `--bg`,
  and the reverse — so a card is distinguishable from the page behind it without inventing a colour.
  Both surfaces are already guarded by `lib/palette.test.ts` for every text colour the card uses.

## 7. The recede

Driven by the slot's view timeline, so it is CSS end to end:

```css
.room-card {
  animation: room-recede linear both;
  animation-timeline: --room-slot;
  animation-range: exit 0% exit 100%;
}

@keyframes room-recede {
  to { transform: scale(var(--card-scale-min)); opacity: var(--card-dim); }
}
```

| dial | value | lives in |
|---|---|---|
| `--card-scale-min` | **0.94** | `lib/motion.ts` → `app/layout.tsx`, like every other number on this page |
| `--card-dim` | **0.55** | same |

Both are written from `lib/motion.ts` and not in the component, under the existing architecture rule: no
component hard-codes a colour, a duration or a string of copy.

**0.94 and 0.55 are starting values and the rig asserts the outcome, not the numbers** — that a covered
card measures smaller and dimmer than the top card by at least a stated margin. A test that reads back the
CSS it was given proves nothing; this project has thirty-eight catalogued instances of exactly that.

---

## 8. Degradation, in the order it happens

| condition | result |
|---|---|
| Everything supported | Cards stack, deck of edges, covered cards recede |
| **No `animation-timeline`** | Cards stack. No recede. A working card stack, one effect lighter |
| **`prefers-reduced-motion: reduce`** | Cards stack. No recede — the keyframes are switched off explicitly |
| **No JavaScript** | Cards stack, and recede. `--header-height` and `--property-bar-height` both fall back to `0px`, which is right: with no script there is no fixed header and no booking bar to clear |
| **`position: sticky` unsupported** | Cards render as plain blocks down the page — today's layout, minus the varied scales |

**Reduced motion keeps the stack.** That is a deliberate departure from `StickyScene`, which collapses
entirely, and the two cases are not alike: `StickyScene` reserves *empty* scroll that only becomes
meaningful once something moves through it, so with motion off it is screens of nothing. A card stack's
scroll is never empty — the visitor's own scrolling is the whole of the movement, 1:1, with nothing
animating at them. What goes is the recede, which is the only part not under their hand.

---

## 9. Card height is solved, not chosen

```
--card-height: min(
   calc(100svh - var(--header-height, 0px) - var(--property-bar-height, 0px)
        - var(--deck-depth) - var(--card-gutter)),
   var(--card-height-max)
);
```

with `--deck-depth: calc(var(--deck-step) * (var(--room-count) - 1))` and `--card-gutter: 24px`.

`--card-height-max` is **760px**: past that a card on a tall screen stops reading as a card and starts
reading as a section, and the photograph inside it gains nothing. At the measured widths, for Tola's four
rooms:

| viewport | slack | deck | gutter | computed | **card (after the 760 cap)** |
|---|---|---|---|---|---|
| 390 × 844 | 706 | 42 | 24 | 640 | **640px** |
| 768 × 1024 | 848 | 42 | 24 | 782 | **760px** — capped |
| 1440 × 900 | 724 | 42 | 24 | 658 | **658px** |
| 1920 × 1080 | 904 | 42 | 24 | 838 | **760px** — capped |

**Vann's cards are 14px taller than Tola's at every width**, because three rooms make a 28px deck against
four rooms' 42px. That is the formula working, not a discrepancy — and it is why the height is a
calculation rather than four numbers in a stylesheet.

**Card width** is the chapter's own column, capped: `min(100%, 1504px)`. At 1440 the container is 1,344px
and the card is 1,248px — inset by 48px so the section's cream frames the deck and the stack reads as
cards rather than as full-bleed bands. Below `md` the card takes the full column.

### The consequence the client should see

Section height becomes `heading block + rooms × card height`. The heading block is unchanged by this work;
these use its present height, so the figures are projections and the first task to render a stack must
confirm them:

| | card | today | as a stack | change |
|---|---|---|---|---|
| Vann @ 1440 | 672 × 3 | 2,437 | ~2,210 | **−227px** |
| Tola @ 1440 | 658 × 4 | 3,266 | ~2,830 | **−436px** |
| Vann @ 390 | 654 × 3 | 1,738 | ~2,210 | **+472px** |
| Tola @ 390 | 640 × 4 | 2,035 | ~2,810 | **+775px** |

**On desktop the section gets shorter; on a phone it gets meaningfully longer** — ~27% on Vann and ~38% on
Tola —
because today's mobile layout is a compact list and a card is close to a full screen. This was not
apparent when the change was approved and it is the one number worth a second opinion. The trade being
bought is that every phone screen in that chapter becomes mostly photograph, which is the direction
non-negotiable #8 pushes and the direction the client's original density complaint pushed. **Recommendation:
accept it.** If it is rejected, the lever is `--card-height-max` and a smaller `--deck-step` on mobile, not
dropping the effect.

---

## 10. What must be proved

A new rig, `scripts/check_card_stack.mjs`, run against a production build at 390 / 768 / 1440 / 1920 on
both routes. Every assertion is about observed behaviour, not about configuration:

1. **Cards stack.** Card *i*'s viewport position stops changing while the page scrolls and card *i+1*'s
   position is still advancing. Asserted as measured positions across a scroll sequence.
2. **No card is clipped.** At every width, each card's rendered box sits inside the slack — below the
   header, above the booking bar. This is the assertion the whole of §9 exists to satisfy, and it is the
   one most likely to fail first on a phone.
3. **The deck is visible.** At the end of the stack, *n* − 1 hairlines are on screen above the top card.
4. **The recede happened.** A covered card measures a smaller rendered width and a lower opacity than the
   top card, by a margin the rig states. Not read back from CSS.
5. **It degrades.** Re-run with `animation-timeline` unsupported (a page-level `CSS.supports` stub or a
   `prefers-reduced-motion` emulation): cards still stack, nothing receded, nothing clipped.
6. **The JavaScript budget moves by 0 KB.** `measure_js_budget.mjs` before and after must be
   byte-identical. There is 3.7 KB of headroom against the 175 KB ceiling; this design is entitled to none
   of it.

Plus the standing suite: `measure_density.mjs` on both routes against the 45% ceiling (39–40% today, and a
card floating in cream is exactly how this design goes wrong), `check_contrast_over_photos.mjs`,
`check_image_resolution.mjs`, `npm test`, `npm run lint`, `tsc --noEmit`.

**Every rig is run against a deliberately broken build before it is trusted** — a stack with the sticky
removed, a card height forced past the slack, the recede deleted. A guard nobody has watched fail is not a
guard.

Unit tests (`RoomCardStack.test.tsx`): the layout chosen per room matches the threshold rule in §3 for
every room in both content files; `--i` is written per card; the heading block is not inside the stack;
`ROOM_CARD_SIZES` round-trips through `lib/sizes.test.ts` like every other section's.

---

## 11. What this replaces, and what it does not touch

- **`components/sections/RoomShowcase.tsx` is deleted**, with its test, once the stack renders on both
  routes. It would otherwise be a live-looking section component with no caller, in a codebase where
  `lib/sizes.test.ts` imports every section that ships.
- **`RoomShowcaseCopy` survives unchanged** as the content model, minus `scale`. No words change on either
  page, and no new facts about either property are introduced by this work.
- **The chapter keeps `shape: "showcase"`.** Its neighbours are `map`/`fullBleed` on Vann and
  `pair`/`fullBleed` on Tola, so `findRepeatedShape` is unaffected.
- **The home page is not touched.** `StickyScene`, `PinnedCollage` and the `rooted` pin are all untouched
  and unrelated; this design deliberately does not reuse `StickyScene`, whose 3-screen clamp and
  reduced-motion collapse are both wrong here.
- **Out of scope:** the booking bar's own behaviour, Tola's unresolved room count, the three chapters over
  the density ceiling, and anything on `/`.

---

## 12. Open

**Tola's room count is still unconfirmed (12 vs 14)** and is unrelated to this work — the stack shows four
room *types*, not room numbers. Recorded here only so it is not mistaken for something this change
resolves.
