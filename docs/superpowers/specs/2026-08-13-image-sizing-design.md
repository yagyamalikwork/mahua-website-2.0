# Image sizing — boards that reflow, rooms side by side, and a zero-JS gallery

**Date:** 13 August 2026 · **Branch:** `feat/image-sizing` (cut from `feat/chapters-rebuild`; that
branch is owned by another session working on scroll feel and hover-zoom, which touches
`components/ui/Plate.tsx` and `components/ui/Photo.tsx` — **this work must not modify either file and
must not commit to that branch**).

## 0. The client's two requests, and the three rulings that shaped this design

Request 1, his words: *"the images just get smaller on different zoom value and stay intact. But I
want the images to adapt to different screen sizes and zoom values so that we don't lose the size or
the images get squeezed."* The squeeze itself is already fixed and measured at 0% distortion across
13 viewports (`docs/reviews/2026-08-12-plate-squeeze/README.md`); what remains is the shrink.

Request 2, his words: *"place the image and room detail text side-by-side ALTERNATELY — room 1 image
left / info right, room 2 image right / info left, and so on. If needed we can crop images for
perfect placement. We can also add a feature where the viewer can click an image to expand it,
gallery-style."*

Three decisions were put to him on 13 Aug 2026, and all three are now his rulings:

1. **Boards reflow.** He first asked whether any image would be removed (no — every photograph
   stays; the board rearranges) and whether his own view would change (no — nothing changes at 1440+
   at normal zoom). With both answered: *"Yes — go ahead."*
2. **Crop the room photographs from the files we have.** *"You can crop and zoom into them to fit
   their half and if they still look blurry on large screen I'll let you [know] and we can fix it
   then but for now I feel that it'll not be an issue."* — He was told plainly that three of the
   sources (both Deluxes and the Tola Suite) are 1163px web exports that may serve soft on large
   screens once cropped, and that his original files are the fix. The softness is a **known,
   client-accepted risk**, not an oversight. If he reports blur, the recorded fix path is: he
   supplies originals ≳2000px wide, uncropped; the pipeline re-crops.
3. **Gallery: expand + next/previous arrows.** Zero JavaScript (the mechanism is §3), so the budget
   question dissolved. He was told the page can still scroll behind the open image and chose this
   option knowing it.

## 1. The plate boards — a floor under a photograph's rendered size

### The defect being fixed

`PlateGrid`'s three-column tier begins at `lg` (1024px). A Forest plate that is ~421px wide at 1440
falls to **283px at 1024** — 67% of its reference size — and at 125% browser zoom (1152px CSS
viewport) to 325px. Meanwhile type is fixed-size in CSS px, so at zoom the words grow physically and
the photographs do not: *"the images just get smaller."* The other two home boards do not have the
defect in a form worth acting on: *Details*' four-column tier already starts at `xl` and never
renders a plate below 87% of its 1440 width (278px at 1280 against 318px at 1440), and *Rooms* is
already at the minimum column count a landscape board can have.

### The rule

**A board may not hold a column count that renders its plates below 85% of their 1440-reference
width, unless it is already at its minimum column count.** Minimum count for a landscape-majority
board is 2 — a single-column run of full-width landscapes is a different composition (and its
1163–1440px sources could not serve those boxes), not a size rescue.

### The change

One tier moves: in `PlateGrid.tsx`'s `columnClass`, the three-column case becomes
`sm:grid-cols-2 xl:grid-cols-3` (was `lg:grid-cols-3`). Consequences, all derived and to be
re-measured live:

| width | Forest today | Forest after |
|---|---|---|
| 1024 | 3-col, 283px | 2-col, **444px** |
| 1152 (125% zoom on 1440) | 3-col, 325px | 2-col, **508px** |
| 1279 | 3-col, 368px | 2-col, **571px** |
| 1280 | 3-col, 368px | 3-col, 368px (87% of reference — inside the floor) |
| 1440+ | 3-col, 421–480px | unchanged |

`PLATE_SIZES[3]`'s `(min-width: 1024px) 34vw` tier moves to `(min-width: 1280px)`; the
`(min-width: 640px) 50vw` tier beneath it already describes the widened 1024–1279 band correctly.
No other board changes. At 1024–1279 the two-column Forest board staggers exactly as the
client-accepted *Details* band does — same look he ruled *"it's fine"* on.

**Recorded as looked-at-and-accepted, not unexamined:** the *Rooms* board (2-col, minimum count)
renders 444px plates at 1024 — 68% of its 652px reference. It cannot reflow further under the
minimum-count rule, its plates remain the largest of any board at every width, and the client's
approval of "fewer, bigger photos" does not reach a board that has no fewer to give. Re-raising this
needs a new reason.

### What deliberately does not change

- `components/ui/Plate.tsx` and `components/ui/Photo.tsx` — untouched (other session's files). The
  entire change is `PlateGrid.tsx`.
- The `pocket:`/`roomy:` pair, the 24vh landscape-phone cap, and the three-disjoint-states width
  discipline (§2 #44–45) — untouched.
- The *Details* 2-wide band at 1024–1279 — client-accepted 12 Aug, stays.

### The instrument

New rig `scripts/check_plates.mjs` (committing the sweep that until now lived only as an ad-hoc
node script in the plate-squeeze review). Against a production build, it must:

1. Sweep viewport width **continuously** — 900→1920 in 16px steps at heights 900 and 768 — plus the
   13 named viewports from the plate-squeeze evidence table (including 960×600, 1152×720 zoom
   shapes, and the two `pocket:` phones).
2. At every sample, for every plate in every `PlateGrid` chapter on all three routes:
   **distortion = 0** — rendered aspect equals the photograph's own natural aspect, or the
   grid's imposed `plateFrame` box where one is in force (the "framed" case in the plate-squeeze
   README).
3. At every sample ≥1024 wide **where the viewport computes to `roomy:`** (a sweep at height 768
   legitimately crosses into `pocket:` past 1536px wide — there the cap, not the floor, is the
   assertion): **plate rendered width ≥ 0.85 × that same plate's width at 1440**, with exactly one
   encoded exemption, carrying a comment naming this spec — a board already at its minimum column
   count uses floor 0.65 (the *Rooms* board's measured worst is 444/652 = 0.68, at 1024).
4. Assert the `pocket:` cap still holds on the two phone shapes (max-height ≤ 24vh, `w-auto`).

**Watched failing first**, per §2's rule: run it against a build with the breakpoint reverted to
`lg:` and confirm it names the Forest plates at the widths in the table above; run it against a
build with a deliberately reintroduced `w-full`/`pocket:w-auto` collision and confirm the
distortion check fires.

## 2. Room cards — all side by side, alternating

### Composition

Every room card on both property pages uses the `beside` composition. `roomCardLayout`,
`ROOM_CARD_ASPECT_THRESHOLD` and the aspect-derived choice are **retired** — the client has now
chosen the composition himself, which supersedes deriving it from the photograph (the derivation's
own §17/§2 #46 history is preserved in `docs/DECISIONS.md`; a new section records the retirement).
The `stacked` path dies with it: `ROOM_STACK.textReserve`, the
`.room-card[data-card-layout="stacked"]` height ceiling in `app/globals.css`, the `lg:gap-2 lg:py-4`
padding trim that was paired with it (the words block returns to its one natural padding), and
`lib/room-card.test.ts`'s threshold-clearance test. `data-card-layout="beside"` remains on every
card — `check_card_stack.mjs` reads the attribute.

**Alternation:** even indices (room 1, room 3…) photo left; odd indices photo right — the client's
exact spec — via `lg:flex-row-reverse` on odd cards. Below `lg` every card is a column
(photo above words), as `beside` cards already are; unchanged, and the phone remains deferred but
measured.

### The photographs

| id | source | today | becomes |
|---|---|---|---|
| `vann-room-deluxe` | 1163×508 (2.29) | stacked | cropped to 3:2 → 762×508 |
| `vann-room-cottage-plain` | 1931×789 (2.45) | stacked | cropped to 3:2 → 1184×789 |
| `tola-room-deluxe` | 1163×508 (2.29) | stacked | cropped to 3:2 → 762×508 |
| `tola-room-suite` | 1163×508 (2.29) | stacked | cropped to 3:2 → 762×508 |
| `tola-room-super-deluxe` | `Super-Delux-Cottage.jpg` 1500×1000 (**1.50, already on disk**) | stacked, from the 2.29 crop | **source swap, no crop** — the uncropped original kept beside the 2.29 file for exactly this day |
| `suite-tiger-painting` | 2560×1709 (1.50) | beside | unchanged |
| `tola-room-family` | 1707×2560 (0.67) | beside | unchanged |

Crop windows are art-directed per photograph (default centre, adjusted by eye — beds and windows
stay in frame), every result **looked at** before curation (faces rule; assets-by-eye), the
perceptual-hash distinctness guard re-run, and a before/after strip produced for the client. The
super-deluxe's copy line in `content/mahua-tola.ts` carries a comment saying it describes the 2.29
crop — re-read that line against the fuller frame and adjust if it no longer matches what is shown.

**Resolution honesty:** the three 762×508 results will be upscaled ~1.11× at 1440 / ~1.28× at 1920
(DPR 1) in their rendered boxes. `check_image_resolution.mjs` is run; if it fails on exactly these
three, the fix is **a scoped, per-image exemption list carrying the client's ruling verbatim and
dated** — never a lowered global threshold — so any *other* image regressing still fails the rig.

### Geometry

- Photo share of the card: `lg:w-[60%]`, `xl:w-[65%]` (named breakpoints in ascending order — not
  arbitrary `min-[…]` variants, per §2 #23). `ROOM_CARD_SIZES` becomes one `beside` string with
  matching `60vw`/`65vw` tiers; the `cqw` cap in `app/globals.css` gets matching values per range.
  The three (class, sizes, cqw) still move together — the existing comment's rule, now with two
  tiers.
- **The 25% width-crop bound becomes solved per card, not hand-picked per layout.**
  `--room-photo-aspect` is set inline per card to `0.75 × the photograph's own natural aspect`
  (from `lib/media`), so the `max-height: calc(<share>cqw / var(--room-photo-aspect))` cap holds the
  bound at **every** viewport shape by construction — the 1024×1366 iPad-portrait class of failure
  (§2 #42) becomes unrepresentable rather than re-tested. For the 3:2 photographs the cap resolves
  above the box's natural height at ordinary shapes and never binds (photo fills the card
  top-to-bottom); for the portrait it never binds at all (height crop is unbounded by design).
- Below `lg`, the photo wrapper's `aspect-ratio` becomes `max(natural, 1.25)` per card: a 3:2
  photograph shows whole (zero crop); the portrait keeps today's 1.25 box. `min-h-0` stays — the
  §2 #41 flex quirk does not care about compositions.
- `ROOM_CARD_BOXES` as a two-layout constant dies; what replaces it is the per-card computation and
  a named `1.25` floor constant with its reasoning.

### Density — the hard line

Current recorded figures: `vann-rooms` 31.5% mean / 42.1% worst, `tola-rooms` 33.8% / 44.3%.
**Neither chapter may exceed its current mean or worst, and every chapter on all three routes stays
inside 45%**, measured with `measure_density.mjs` against a production build. The known risk: a
side-by-side card's text column carries more bare paper than a stacked card's text band. The levers,
in order: the 65% photo share at `xl` (more imagery per card), the words block's padding, and
`ROOM_STACK.heightMax`. If every lever is spent and the line still cannot be held, **the numbers go
to the client with the choice** — his composition against his density ceiling is his trade to make,
not one to make for him quietly (§5's existing pattern).

### The rig

`check_card_stack.mjs`: all **eight existing assertions pass on both routes at every shape, plus the
`--no-recede` arm — none weakened**. Where the rig's internals assume a `stacked` layout exists, the
reading is updated, never the bound. New **assertion 9 — alternation**: at `lg` and up, each card's
photo-wrapper centre sits left of the card's centre for even indices and right for odd, strictly
alternating down the stack. Watched failing against a build with `flex-row-reverse` removed.

## 3. The gallery — click to expand, zero JavaScript

### Mechanism

The browser's **native popover machinery** (HTML `popover` attribute + `popovertarget` invokers —
React 19's `popoverTarget`/`popoverTargetAction` props; this repo ships React 19.2.4). No
`"use client"`, no listener, no library: open, close, Esc, and click-outside light-dismiss are all
user-agent behaviour, and popovers render in the top layer so no `overflow: hidden`,
`position: sticky` or transform on the cards can clip them.

- **Trigger:** inside each card's photo wrapper (which stays the card's `:first-child` — the rig and
  the CSS cap both depend on that), the `Photo` is wrapped in a full-size
  `<button popovertarget="…">` with `aria-label` naming the room. Fails toward absent: if the UA
  has no popover support (or scripting is disabled and the UA gates invokers on it), the click does
  nothing and the page is simply what it was.
- **Panels:** `RoomCardStack` renders, after the `</ol>`, one
  `<div popover="auto" id="room-gallery-<chapterId>-<i>" role="dialog" aria-label="<room name>">`
  per room: the photograph large (`object-contain`, capped ~90vw/~85vh), the room's name and facts
  line beneath it **in ink on solid paper** (the §16 lesson: no `goldText`, no text on a
  translucent wash), and three buttons — previous, next, close.
- **Arrows:** previous/next are plain `popovertarget` invokers pointing at the neighbouring room's
  panel, wrapping at the ends. `popover="auto"` guarantees at most one open panel — opening the
  neighbour closes the current one, which *is* the navigation.
- **Backdrop:** `::backdrop` in a cream wash (`PALETTE.paper` at high alpha, via the existing CSS
  custom properties). Decorative only; no text ever sits on it.
- **Bytes:** the large image is the manifest's own responsive set with its own `sizes`; it carries
  `loading="lazy"` inside a closed (`display: none`) popover, so **nothing is fetched until a
  visitor opens it** — verified by network probe, not assumed. First-load transfer and the hero's
  arrival are untouched.
- **Motion:** none in v1 — the panel appears and disappears. Nothing to disable under
  `prefers-reduced-motion`; opening is hand-caused and instant.
- **Known limitation, client-informed:** the page can still scroll behind an open panel (Lenis
  bypasses CSS overflow locks, §2 #9, and a JS lock is exactly what this design refuses to spend).
  Recorded; not a defect.

### Budget

Target **delta 0** on `npm run verify:budget` (first-load currently 172,209 bytes brotli against
the 175 KB ceiling). The gallery adds server-rendered markup only. If the measured delta is not 0,
that is a finding to explain, not to wave through.

### The instrument

New rig `scripts/check_room_gallery.mjs`, against a production build, both routes, at 1440 and 390:

1. All panels closed on load; **zero gallery-image requests before the first click** (network log).
2. Clicking a card's photo opens its panel (`:popover-open`), image rendered at a real size.
3. *Next* moves to the adjacent room's panel and the previous one is closed; wraps at the end.
4. Esc closes; clicking the backdrop region closes (light dismiss).
5. With JavaScript disabled, the page renders and scrolls normally and nothing is broken
   (popovers may or may not open — the assertion is only that failure is *absence*).

Each assertion watched failing first (remove `popovertarget`, drop `loading="lazy"`, break an id).
`check_image_resolution.mjs` **learns to open one gallery panel** before measuring, exactly as it
learned to open the menu (§2 #39) — otherwise the largest new images on the page are the ones it
never sees.

## 4. Constraints inherited whole

Non-negotiables 3, 4, 6, 7, 8 and 11; the dials rule (no hard-coded colour, duration or copy —
`lib/palette.ts`, `lib/motion.ts`, `content/`); British spelling in any new copy;
`npm test -- --run`, `npx tsc --noEmit`, `npm run lint` green before any commit claiming
completion; every rig run against a production build; desktop is the client's lens but **every
measurement still includes 390 and the shapes between the named widths** — the last three defects
lived in the gaps.

## 5. Out of scope

The home page's *Rooms* board (that is §1's territory, and it keeps its columns); any change to
`Plate.tsx`/`Photo.tsx`; a JS scroll lock for the gallery; extending the gallery beyond the room
cards (the client asked for it on rooms — anything wider is a new request); mobile optimisation
(deferred by the 12 Aug ruling, measured anyway); the checkout, Tripadvisor, SEO and CMS items.

## 6. Evidence

`docs/reviews/2026-08-13-image-sizing/` — the two new rigs' output on both arms (broken and fixed),
the card-stack rig's full pass, density before/after for both rooms chapters and the three home
boards, `verify:budget` delta, the crop before/after strips, and screenshots at 390 / 768 / 1024 /
1280 / 1440 / 1920 plus the zoom shapes. `docs/DECISIONS.md` gains the 13 Aug rulings (§18);
`docs/PROJECT-STATE.md` is updated.
