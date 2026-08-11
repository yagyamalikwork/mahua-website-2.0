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

**It costs no JavaScript** — not a byte, not a component. That is the reason this design is shaped the way
it is; §5 and §7 are where the constraint bites.

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

**Five of the seven room photographs are 2.29:1 or wider.** The "three scales" that make the current
section a composition are, for two of those five, achieved by cropping a wide photograph into a squarer
box and throwing away a third of its width — the two Deluxe rooms, both 2.29:1 in a 3:2 box. A card that shows a photograph closer to its own shape crops **less**
than what is on the page today.

**One is portrait and is being cropped in half.** `tola-room-family` is 1440×2160 and sits in a 4:3 box,
which discards about half its height. It is the one room that genuinely wants a different arrangement.

So the card's internal layout is **derived from the photograph's own aspect ratio**, read from `MEDIA` at
build time, rather than from a hand-assigned scale. That is the same rule the rest of this project's
artwork follows: derive from the asset, do not hard-code a number beside it.

| photograph aspect | card layout |
|---|---|
| **≥ 1.9:1** (five of seven) | photograph across the top of the card, words in a band beneath it |
| **< 1.9:1** (two: `suite-tiger-painting` 1.50, `tola-room-family` 0.67) | photograph beside the words from `lg` up; above them below `lg` |

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
| 390 | 342 × 640 | 342 × 190 (1.80:1) | **0%** of the five wide ones' width (`tola-room-family` is portrait and takes the beside layout, so it is not in this box) |
| 768 | 672 × 760 | 672 × 300 (2.24:1) | ~2% |
| 1440 | 1,248 × 658 | 1,248 × 430 (2.90:1) | 0% — height is what goes |
| 1920 | 1,504 × 760 | 1,504 × 520 (2.89:1) | 0% |

**A wide photo area crops height, never width, and that is the point.** The five wide photographs lose
nothing horizontally at any width above 390, and at 390 the area is deliberately squarer than they are so
they still lose none. This is strictly better than what ships today, where two of them lose 35% of their width and a third
(`tola-room-family`, portrait) loses half its height.

`scripts/check_image_resolution.mjs` already proves no photograph is served below its box; the new rig
adds the crop bound beside it, and **fails rather than warns**. Hand-picking a photo aspect and hoping is
how the 35% crops got there.

**Added 11 Aug 2026, after shipping: a bound on width crop says nothing about whether the resulting photo
box still fits inside the card.** `ROOM_CARD_BOXES.stacked` was solved to keep width-crop inside the 25%
bound above and was never checked against the card's own solved height (§9); at 1440/1920 the photo band
came out taller than the card itself, and the words fell below `overflow: hidden` on five, then six, cards
before it was caught. Fixed with a height ceiling (`ROOM_STACK.textReserve`) plus a paired padding trim,
and a rig assertion that sweeps each card's own text block, not just its outer box. Full working —
including the diagnostic tool that shared the exact same blind spot as the rig it was checking —
`docs/DECISIONS.md` §17.

---

## 4. Architecture

**Corrected 11 Aug 2026, after shipping.** This section originally described the second of three
constructions that were tried — the one below where a card drives `animation-timeline: view()` off its own
position. That one pins correctly and was believed correct on the only check that had been run at the
time ("does the card ever recede"). It is wrong, in a way that only shows up if you ask *when*: see the
table below and `docs/DECISIONS.md` §17 for the full story, including the catalogue entries it produced.

```
ChapterSurface  (existing — already overflow-x: clip, which is what lets sticky work)
└── RoomCardStack                        server component, no "use client"
    ├── heading block                    ChapterMark + TwoToneHeading + intro — NOT sticky
    └── <ol class="room-stack">          tall: its height is the sum of its cards'
        ├── <li class="room-slot">       NON-sticky, aria-hidden, contributes ZERO net height
        │                                 (equal-and-opposite margin-bottom) — the view-timeline
        │                                 SOURCE for the card that follows it, one name per card
        ├── <li class="room-card">       position: sticky. Reads its OWN slot's timeline, by name.
        │   ├── Photo                    at the room's own aspect
        │   └── words                    name, line, facts, optional note
        ├── <li class="room-slot">       (repeats per card)
        └── <li class="room-card">
```

**The cards must be direct children of the stack — that survived from the first draft.** What did not
survive is how each card's recede is *driven*, and it took three attempts, all measured in Chrome 151 over
four cards, to land on the one that works:

| construction | cards ever simultaneously pinned | when a covered card dims |
|---|---|---|
| A — card inside a WRAPPING slot of the card's own height | **0 of 4** | while still fully visible, **0.58** — never actually pins |
| B — card driving `animation-timeline: view()` off its OWN position | **3 of 4** | **never** — opacity **1.00** for the entire time it is still the card being read |
| **C — shipped: a non-sticky SIBLING slot, sized to the remaining slack, naming the card's timeline** | **3 of 4** | **0.77 when fully covered — correctly, while pinned** |

The first draft of this spec (construction A) wrapped each card in a slot exactly as tall as the card, on
the theory that a sticky element cannot drive a scroll-linked animation off its own position. That theory
is half right: `position: sticky` **is** clamped to its containing block, so a wrapper exactly as tall as
the card leaves zero slack and the card renders exactly as if it were `static` — construction A's row
above. But the fix that theory suggested — delete the wrapper, let `animation-timeline: view()` read the
card's own flow position (construction B) — is **also** wrong, in the opposite direction: a sticky
element's own `view()` timeline effectively **freezes while it is actually stuck**, because a stuck
element's flow position, relative to the viewport, barely changes while it is pinned. Construction B pins
correctly and does eventually recede, but only after the card has already scrolled out of view — never
while a visitor is still reading it.

**What ships is construction C, a third thing, not a reversion to A.** A non-sticky sibling
`<li class="room-slot">`, `aria-hidden`, contributing zero net height to the stack's own flow (an
equal-and-opposite `margin-bottom`, so no card's un-stuck position changes), sized to exactly the remaining
slack — `(room-count − i − 1) × card-height` — and carrying its own `view-timeline-name`
(`--room-slot-0`, `--room-slot-1`, …), published to the `<ol>` via `timeline-scope` because
`view-timeline-name` resolves by tree order and every card sharing one name would all bind to the first
slot in the list. The card reads that name; it does not use `view()` at all.

**Note the failure's shape, because it recurs on this project:** construction B's recede DID run —
eventually, on all four cards — so a check asking only "does the recede ever happen" passes it. What
catches it is sampling *while a card is on screen and pinned*, asking *when* rather than *whether* — see
§10.

**Nothing here is a client component.** No `"use client"`, no hooks, no scroll listener — and, after §5,
no JavaScript anywhere in this design at all.

---

## 5. Clearing the booking bar, with no JavaScript at all

The first draft of this section had `PropertyBar` publish its measured height to a custom property, the
way `StickyHeader` already publishes `--header-height`. **That is wrong here, and the reason is worth
keeping.**

`PropertyBar` returns `null` when it is not visible — it stands down over the hero, the invitation and the
footer. A published height would therefore flip between `0px` and `69px` as the visitor scrolls, and card
height is computed from it, so every card in the chapter would resize at those moments. Resizing cards
changes the page's height, which moves the scroll position under the visitor's hand. A measurement that is
correct at every instant is the wrong input for a layout that must not move.

So the space is a **constant reservation** in `app/globals.css`:

```css
--property-bar-reserve: 72px;
```

against a bar measured at 63px (390) and 69px (768 and up). It never changes, so nothing ever resizes.

The obvious objection to a constant is drift — a second copy of a number, free to disagree with the bar
it describes, which is exactly what `StickyHeader`'s own comment warns against. **That is handled by
assertion rather than by construction:** `check_card_stack.mjs` measures the real bar at all four widths
and fails if it is taller than the reserve. Drift becomes a red test rather than a card hidden behind a
booking bar on someone's phone.

**The consequence is that this design adds no JavaScript whatsoever** — not a component, not a hook, not
four lines inside an existing one. The budget assertion in §10 is not "small": it is that the first-load
JavaScript is **byte-identical**.

---

## 6. The stack

**Corrected 11 Aug 2026** — see §4 for why `.room-slot` exists and is a sibling, not a wrapper:

```css
.room-slot {
  /* NON-sticky, aria-hidden, sized to the SLACK ALONE — the timeline source §7 reads. */
  height: calc((var(--room-count) - var(--i) - 1) * var(--card-height));
  margin-bottom: calc(-1 * (var(--room-count) - var(--i) - 1) * var(--card-height));
  view-timeline-axis: block;
}

.room-card {
  position: sticky;
  top: calc(var(--header-height, 0px) + var(--deck-step) * var(--i));
  height: var(--card-height);
  /* Names THIS card's own slot — set per-instance, inline; a class cannot express a
     value that must differ by index. See §7. */
  animation-timeline: --room-slot-N;
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
- **`.room-slot` is a SIBLING immediately before its card, not a wrapping ancestor** — both are direct
  children of the `<ol>`. It carries real height for exactly one purpose: to be the timeline source the
  card beside it reads, sized to the remaining slack `(room-count − i − 1) × card-height` and contributing
  zero net height to the stack's own layout (the `margin-bottom` above cancels the `height`). §4 explains
  why the card cannot supply this timeline off its own position.

## 7. The recede

Sourced from the sibling slot's timeline (§6), not the card's own — a construction that took two more
attempts than the one this section originally described (§4). CSS end to end, no JavaScript:

```css
.room-card {
  animation: room-recede linear both;
  /* animation-timeline names THIS card's own slot (--room-slot-0, --room-slot-1, …),
     published through timeline-scope on the <ol> — not view(). A sticky element's
     OWN view() timeline effectively freezes while it is actually stuck, which would
     dim a covered card only after it has already scrolled out of view. See §4. */
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

**The last card never recedes, and this is not a special case — it is the rule stated properly.** A card
dims *because something is covering it*. Nothing covers the last one. It carries `data-room-card-last`,
written from an `isLast` prop, and `.room-card[data-room-card-last] { animation: none; }`.

Without it the tail of every chapter breaks, and the break is ugly rather than subtle: the last card
drops to 0.55 opacity while it is still the card being read, and the whole already-dimmed deck behind it
bleeds through — measured over the final ~250-350px of the chapter's scroll, on both routes, at both
1440x900 and 390x844, as overlapping illegible text.

The cause is that `view()` tracks a sticky element's **flow** position, not its stuck one. For a card in
the middle of the stack that behaves well — its exit phase begins about when the next card starts
overlapping it, and full coverage lands at ~86% of the range, so it is hidden behind an opaque neighbour
while it dims. The last card has no neighbour, so the same timeline dims it in full view.

**The flag is a prop and an attribute, deliberately, not `:last-child`.** The stack's children are exactly
the cards today, and that is a structural coincidence rather than a guarantee; a selector that depends on
it stops matching the day anything else is added, silently and in the tail of the page where nobody looks.

Measured after the fix: a covered card `opacity: 0.55` / `scale 0.94`, the last card `opacity: 1` /
`transform: none`, swept end to end at 20px steps on both routes with zero deviations.

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
| **No JavaScript** | Cards stack, and recede. `--header-height` falls back to `0px`, which is right: with no script the header does not follow and there is nothing to clear. `--property-bar-reserve` is a constant, so the cards keep 72px they do not strictly need — 72px of cream on a page that has no bar, which is invisible and costs nothing |
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
   calc(100svh - var(--header-height, 0px) - var(--property-bar-reserve)
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

**Corrected 11 Aug 2026: this was a projection when the section below was first written; it is now
measured on the shipped build, and the measured mobile figure is larger than what was projected and than
what the client accepted.** Section height is `heading block + rooms × card height`. Measured directly
(`#vann-rooms` / `#tola-rooms`'s own `getBoundingClientRect().height` at 390×844 and 1440×900 on the
production build):

| | before | as a stack | change |
|---|---|---|---|
| Vann @ 1440 | 2,437 | 2,371 | **−66px, −2.7%** |
| Tola @ 1440 | 3,266 | 2,984 | **−282px, −8.6%** |
| Vann @ 390 | 1,738 | 2,362 | **+624px, +35.9%** |
| Tola @ 390 | 2,035 | 2,922 | **+887px, +43.6%** |

**On desktop the section got shorter, as projected. On a phone it got meaningfully longer than what was
projected and accepted** — **+35.9% on Vann and +43.6% on Tola, against the ~27% and ~38% this section
originally projected and the client agreed to on 11 Aug** — because a phone's original layout was a
compact list and a card is close to a full screen. The direction was right; the size of it undersold what
shipped, by about 9 points on Vann and 5.6 on Tola. The trade is the same one reasoned through when this
was still a projection: every phone screen in that chapter becomes mostly photograph, which is the
direction non-negotiable #8 pushes and the direction the client's original density complaint pushed.
**The client has not yet been told the measured figure** — see `docs/DECISIONS.md` §5 and §17. If it is
rejected, the lever is `--card-height-max` and a smaller `--deck-step` on mobile, not dropping the effect.

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
