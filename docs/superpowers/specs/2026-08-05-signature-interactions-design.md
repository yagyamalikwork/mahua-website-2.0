# The signature interactions — design

**Plan 5.** Three things the page does when you touch it, and one thing it draws for you.

Supersedes §5.1 and §5.3 of
[`2026-08-01-mahua-home-mvp-design.md`](2026-08-01-mahua-home-mvp-design.md) where they conflict. §5.2 (the
logo bloom) shipped in Plan 4 as a single half-turn and is not reopened here.

> **Read first:** [`docs/DECISIONS.md`](../../DECISIONS.md), then `CLAUDE.md`. Everything below is
> constrained by the non-negotiables, and two of them bind hard: **#4 restraint**, and **#6 budgets beat
> effects**.

---

## 1. What the client ruled, 5 Aug 2026

Settled in conversation before this spec was written. Do not reopen without being asked.

| Ruling | Reasoning as given |
|---|---|
| **The leaf follows the pointer everywhere**, as the original spec wrote it — not only over links | Chosen over the more restrained "hover-state only" option after both were put with their trade-offs |
| **The leaf cursor must be trivially removable or editable** | "I'm not too sure about the leaf cursor." It ships behind an architectural guarantee, not a promise |
| **A hairline slides in under links and menu items on hover**, left to right, as on the reference site | Client-requested addition to Plan 5 |
| **The tiger is a still ink sketch that draws itself**, not a rigged walking character | There is no tiger artwork in the project and no illustrator; a walk requires ~20 correctly-pivoting parts and a four-beat gait, and a wrong gait reads cheap instantly |
| **The tiger still lives, dozes and stirs, and the butterfly stays** | Five of the spec's seven phases. Only locomotion — *entrance* and *crossing* — is cut. Breathing, a tail drift, an ear turn and a blink are single-part, low-amplitude motions that cannot fail the way a gait can |
| **The sketch is not built to come apart** | Drawing it as separable jointed parts to leave room for a future walk would make it a worse still image, which is the image that actually ships |

---

## 2. Global constraints

Every requirement below inherits these.

- **First-load JavaScript ≤ 175 KB transferred before any scroll.** Currently **154 KB** — 21 KB of
  headroom, and `npm run verify:budget` fails on the bytes. Measured at 1440×900 by
  `scripts/measure_js_budget.mjs`.
- **Nothing here may raise the initial page transfer** past 574 KB at 390px / 698 KB at 1440px.
- **Everything decorative is `aria-hidden`** and has a defined still state under
  `prefers-reduced-motion: reduce`.
- **No component hard-codes a colour, a duration or a string of copy.** `lib/palette.ts`, `lib/motion.ts`,
  `content/home.ts`. Numbers that CSS needs reach it the way `ENTER` already does: `lib/motion.ts` →
  `app/layout.tsx` writes `--custom-property` onto `<html>` → `app/globals.css` reads it back.
- **Gold (`#BB8F2E`, `--accent`) is decorative only** and must never carry text. A 1px rule is exactly what
  it is for.
- **Fail-safe by construction.** With JavaScript disabled, or under reduced motion, every element here is
  either fully present and still, or absent — never mid-animation, never invisible.
- **No new section may add scroll.** Non-negotiable #9's lesson: the pin bought scroll without adding
  photographs and pushed the page-wide density figure the wrong way.

### The one CSS landmine, named

Tailwind v4 compiles `scale-*` and `translate-*` to the **`scale` and `translate` properties**, which
*compose* with `transform` rather than replacing it. This already cost the project one whole defect —
image masks that silently never wiped while `tsc`, the tests, the build and the linter all passed. Lightning
CSS then merges the declarations, which is why reading the source is not enough.

**Every transform written by Plan 5 uses the `transform` property only, in `app/globals.css`, and no element
carrying one may also carry a Tailwind `scale-*`/`translate-*` utility.** `app/globals.css` already
documents this above `@keyframes emblem-turn`; the same note applies here.

---

## 3. The sliding rule

A hairline that grows from the left edge to the full width of a link's label when you point at it.

### Behaviour

- **Grows from the left**, 1px, sitting on the text's baseline gap, in **`currentColor`** — it always
  matches the text it underlines.

  *Amended while planning.* This said "in gold". Gold measures ~2.5:1 on cream, and the menu trigger spends
  the first screen sitting over the hero photograph, where a 1px gold hairline disappears. `currentColor` is
  legible on cream, on the menu's dark overlay and over a photograph with no per-surface special-casing —
  and on `LodgeCards`, whose links are already `--accent-text`, it still reads gold. Non-negotiable #7
  permits gold for rules; it does not require it.
- **Retracts to the left** when the pointer leaves — it does not vanish, and it does not retract to the
  right. The same edge is the origin in both directions.
- **Fires on `:focus-visible` as well as `:hover`.** An affordance only mouse users get is not an
  affordance.
- Under reduced motion it **appears and disappears instantly**. It stays, because it is a signal; only the
  travel goes.

### Where it applies

Every text link and text control on the page, which today is: the menu trigger, the menu's Close control,
the seven chapter links inside the panel, and the links in `LodgeCards` and `Invitation`.

**Excluded: `PillButton`.** It is a filled gold pill; a rule inside it would read as a rendering fault. It
keeps the hover it has.

On the chapter links the rule underlines **the label only**, not the number beside it — the two sit in one
flex row and the row is the hover target, but the number is a marker, not part of the name.

### Mechanism

A `::after` pseudo-element, `transform: scaleX(0)` → `scaleX(1)`, `transform-origin: left`. One class in
`app/globals.css`, duration and easing read from `--rule-in-duration` and `--enter-ease`.

**0.4s**, held in `lib/motion.ts` as `DURATION.ruleIn`. Shorter than an entrance (0.9s) because it answers a
deliberate act rather than arriving on its own — a hover response slower than about half a second reads as
lag, not as restraint. It takes the page's single entrance curve, `ENTER.ease`; there is no second easing on
this page and this does not introduce one.

`transform` rather than `width` because width forces layout on every frame of every hover. See §2's landmine
note for why this is written as a bare `transform` property and not a utility.

### Why this earns its place

It is the only affordance on the page that survives the leaf cursor being removed. If the cursor goes, the
rule still tells you what is a link — which is what makes the cursor genuinely optional rather than
nominally optional.

---

## 4. The leaf cursor

A mahua leaf hanging from the pointer, in place of the arrow.

### The artwork

**Sourced from the client's own logo, not drawn — as the first attempt.** `Mahua-Resorts.svg` is a 340-path
vector whose emblem is the mahua flower ringed by **eight leaves**, four filled `#465E44` and four `#2B3F2A`,
with veins over them. They are real paths and they are rotational copies of one another.

`scripts/build_leaf.mjs` selects the green-filled paths, clusters them into the eight rotational copies,
takes one, normalises it to a square viewBox and emits it as path data into `lib/leaf-art.ts`. It **asserts
it found exactly eight leaf bodies** and fails loudly otherwise, so a re-supplied logo with different
structure cannot silently produce a blob. This is the same discipline `scripts/build_brand.mjs` already uses
to find the flower by scanning the artwork's own ink bands.

**The known risk, and the exit.** Those leaves are stylised for a rosette — short, wide, symmetrical, meant
to be read eight at a time in a ring. A real mahua leaf is long and elliptical. One rosette leaf hung from a
pointer at ~24px may not read as a leaf at all. **This is judged by eye at review, not asserted** — a test
cannot tell you whether a shape reads. If it does not, `lib/leaf-art.ts` is replaced with a drawn mahua
leaf. Either way the art is **one exported constant in one file**, and swapping it changes nothing else.

Vector rather than a raster, for one reason: it must recolour to gold, and a tinted picture never looks
right.

### Behaviour

- **24px tall.** Large enough to read as a leaf rather than a speck, small enough not to obscure the line of
  text under it. Fixed in CSS pixels, not scaled with the page — it is a cursor, and a cursor has one size.
- **The stem tip sits at the pointer; the body hangs down and to the right**, so it never covers what you
  are about to click.
- **It lags, and the lag is damped to nothing at rest.** At speed the stem trails behind the true pointer
  position by no more than ~12px and the body swings wider; within ~200ms of stopping the stem is on the
  point exactly. You are never asked to click while it is wrong, because you do not click mid-flick.
- **The angle carries inertia** — it swings behind the direction of travel and settles without overshooting.
  This is what makes it read as falling through air rather than as a sticker.
- **It replaces the system cursor.** A leaf *and* an arrow is two things chasing the pointer, which is the
  reading that makes this a gimmick.
- **Over links, buttons and photographs it lifts slightly and warms to gold** — the same gold as the sliding
  rule, arriving at the same moment, so they read as one response. Never the only signal.
- **Over a focused text input it is hidden and the I-beam returns.**

### Gating, and what it costs whom

| Condition | Result |
|---|---|
| Coarse pointer (phone, tablet) | **Zero bytes transferred.** Not merely not rendered — the chunk is never fetched |
| `prefers-reduced-motion: reduce` | Not rendered at all. The system cursor is untouched |
| Fine pointer, normal motion | Rendered, lazily, after first paint |

Not rendering under reduced motion rather than rendering a still leaf is deliberate: a leaf locked rigidly to
the pointer is precisely the "sticker" the original spec warns against, and someone who asked for less motion
should simply get their cursor back. It is consistent with the rest of the page, which switches entrances and
the pin off entirely under the same query.

**Absence is this element's defined still state**, which is what the CLAUDE.md convention asks for — the
convention requires every decorative element to have one, not that the state be visible. The tiger and the
butterfly, which are *content* on the page rather than a pointer attachment, both stay present and still.

### Why this does not violate non-negotiable #5

#5 forbids **permanent peripheral motion** — something moving in your periphery on its own. The leaf moves
only when you move, and it is at the centre of your attention, not the edge of it. It is your own motion
mirrored back. It stops completely when you do, and §7 asserts that it stops.

### Safety

`cursor: none` is applied to `<html>` **by the script, after the leaf has mounted and painted** — never in
server-rendered CSS. If the chunk fails to load, or throws, the visitor keeps their normal cursor. This is
the same discipline that keeps the pinned collage server-rendered off.

### Removability contract

The client is unsure about this feature, so its removability is a requirement with teeth, not an intention.

- All of it lives in **`components/signature/leaf-cursor/`**.
- Exactly **one** line elsewhere references it: its mount in `app/layout.tsx`.
- **A test fails if any other file imports from that directory.** That is what keeps it removable in three
  months rather than only today.
- Because it is dynamically imported, deleting the mount removes its bytes too — no dead weight left behind.

---

## 5. The ink tiger

A field-guide tiger that inks itself onto the page, lives for a while, and dozes.

### Placement

**Inside `04 · Days in the Field`.** Chosen by measurement, not feel:

- Its worst screen is **52.4% empty** — the emptiest screen on the page that belongs to an actual chapter.
  (The five emptiest screens overall belong to no chapter; they are the joins between sections, and a join is
  160px of padding, far too small for this.)
- It is the chapter about going out to look for animals. A naturalist's sketch in the margin of a field-day
  account *is* the field-guide idiom this whole page is written in.
- It **adds no scroll.** It fills cream that already exists.

**~20vh tall on desktop**, as the original spec set it, floored at 120px so it does not shrink to a smudge
on a short window, and reduced on narrow screens where 20vh of a phone is most of the column. The exact slot
is settled by measurement during the plan, against these requirements:

1. It must not overlap readable text at any width from 320 to 1920px.
2. It must **reduce** `field-days`' worst-screen empty figure, and must not push its mean above 45%.
3. It must not displace a photograph.
4. It must sit on a ground line — the bottom edge of a block — rather than float in the middle of cream. A
   tiger with nothing under its feet reads as a sticker.

### The drawing

A **stroke-only contour sketch** — back line, haunch, head, legs, tail, and stripe strokes. No fills. Drawn
in `--text` (`#31402C`), so it needs no new palette entry and inherits the page's ink.

Stroke-only is not an aesthetic preference, it is risk control: because the lines ink themselves in sequence,
the thing you watch is *a drawing being made*, and that reads as a sketch. A sketch forgives a wobble that a
filled silhouette does not.

**The drawing is the risk on this feature and it is not assertable.** No test can tell you whether it is
good. It is reviewed by eye, at size, on the real page, before it ships — and if it is rejected only
`lib/tiger-art.ts` changes. The mechanism, the placement and the fail-safes all survive. That is the
original spec's rig/skin insurance policy, kept, in a far cheaper form.

### Phase 1–2 · Stillness, then inking

Every path carries **`pathLength="1"`**, which lets `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` draw it
with **no JavaScript measuring anything**. The whole draw is a CSS transition.

Paths ink in a plausible order — the back line first, then the head, then the legs, then the stripes — via a
per-path `transition-delay` computed from its index and written server-side as an inline style. No script.

Staging follows the engine Plan 4 already built (`components/motion/useInView.ts`): script sets
`data-ink="pending"` **only** if the tiger is below the fold at mount, then `data-ink="in"` when it arrives.
With no attribute — no JavaScript — the default state is **fully drawn**. There is no state in which the
tiger is invisible and waiting for a script that never came.

### Phase 3 · Alive

CSS keyframe animations on the parts that move:

| Part | Motion |
|---|---|
| chest | breath — a slow, shallow scale |
| tail tip | a slow drift |
| ears | an occasional turn |
| eyes | an occasional blink |

**No two periods may be simple multiples of one another**, so the four never sync into a pulse. Four things
moving on the same beat reads as a machine; four things on unrelated beats reads as an animal. This is a
checkable rule, not a feel: the plan states the four durations and a test asserts no pair divides evenly.

### Phase 4 · Dozing

**Expressed as the tail of a single long keyframe timeline, not as a JavaScript timer.** One animation with
`animation-iteration-count: 1` and `animation-fill-mode: forwards` runs the living phase and ends with the
eyes closing and the movement stopping. The tiger becomes a still ink drawing and stays one. No timer, no
interval, nothing left running.

This is the direct expression of non-negotiable #5: it arrives, performs, then dozes.

### Phase 5 · Stirring

Scrolling away and returning re-runs the living timeline. **It does not re-ink** — once drawn, the tiger
stays drawn.

That needs two independent states, because they have different lifetimes:

- `data-ink` — one-way, permanent.
- `data-awake` — re-armed each time the tiger re-enters the viewport.

`useInView` today never un-stages anything. Plan 5 adds a **separate opt-in re-arming mode** rather than
changing that behaviour, so no existing entrance on the page is affected.

### The butterfly

A small ink butterfly on a loose closed path near the tiger, using CSS `offset-path` / `offset-distance`,
with wing-flap keyframes. It **lands** — the path holds at fixed points for a few seconds while the wings
slow — then moves on. Pure CSS.

If `offset-path` is unsupported, it renders still. It is `aria-hidden` and decorative, so a static butterfly
is an acceptable degradation, not a defect.

### Reduced motion, and no JavaScript

Both produce the same thing: **the tiger fully drawn, the butterfly present and still, nothing animating.**
"Present, still", as the original spec required.

---

## 6. Architecture

```
components/signature/
  leaf-cursor/            everything the cursor is; one importer, enforced by test
    LeafCursor.tsx        the client component, dynamically imported
    index.ts             the mount — the single line app/layout.tsx references
  InkTiger.tsx            server component; renders the SVG and its stagger
lib/
  leaf-art.ts             ONE constant: the leaf's path data + viewBox   ← swap point
  tiger-art.ts            the tiger's paths, ids, and ink order          ← swap point
  motion.ts               + rule-in, cursor and tiger tokens             ← THE DIAL
scripts/
  build_leaf.mjs          extracts one leaf from the client's logo
  check_rule_in.mjs       the sliding rule's rig
  check_leaf_cursor.mjs   the cursor's rig
  check_ink_tiger.mjs     the tiger's rig
app/globals.css           + the rule, the ink transition, the living keyframes
```

**Both artworks are single constants in single files.** That is the whole insurance policy: neither drawing
has to be right first time, and rejecting one changes nothing but that file.

`InkTiger` is a **server** component. Its SVG is markup and its animation is CSS, so none of it needs to
reach the browser as JavaScript — the same reasoning that keeps `PinnedCollage` on the server.

---

## 7. Verification

The project's one recurring defect — **fourteen instances** — is a check that confirmed a *mechanism was
configured* rather than that *behaviour changed*. Every assertion below is written against an outcome, and
every rig is to be **run against the broken state before it is trusted to pass.**

### The sliding rule — `scripts/check_rule_in.mjs`

1. At rest the `::after` transform matrix reads scaleX ≈ 0; on hover it reaches ≈ 1.
2. **It travelled**: `document.getAnimations()` reports a running transition on the pseudo-element's
   `transform` after hover, and a sample taken mid-transition sits strictly between 0 and 1. Both, because
   either alone can pass while the rule snaps.
3. **Keyboard focus produces the same final state as hover.**
4. Under reduced motion the final state is reached with no running transition.
5. **Coverage**: every `<a>` and text `<button>` on the page carries the rule, except those on an explicit
   exclusion list. A newly added link cannot silently miss it.
6. The rule is perceptible against **both** surfaces it appears on — cream, and the menu panel's dark
   overlay.

### The leaf cursor — `scripts/check_leaf_cursor.mjs`

1. Fine pointer, normal motion → the leaf exists and `<html>` has `cursor: none`.
2. **Coarse pointer → zero bytes of the cursor chunk are transferred.** Asserted on the network, not by
   grepping source for an import. (Defect #12 was exactly that grep.)
3. Reduced motion → no leaf in the DOM, and `cursor` is not `none`.
4. **Follow accuracy**: driven along a synthetic pointer path, the stem's error at rest is < 2px, and its
   error at speed never exceeds the specified lag.
5. **It swings**: rotation differs by a meaningful angle across a fast move, and returns to rest after.
6. **The loop stops.** `requestAnimationFrame` is counted from before load; one second after the pointer
   stops, the count over the following 500ms is **zero**. This is the battery check, and it is the one most
   likely to regress silently.
7. Over a link the leaf's fill is gold; over body text it is not.
8. With a text input focused, the leaf is hidden and the cursor is restored.
9. **Removability**: a unit test asserts nothing outside `components/signature/leaf-cursor/` imports from it
   except the single mount.

### The ink tiger — `scripts/check_ink_tiger.mjs`

1. **Every path has `pathLength="1"`** — path count equals the count carrying it. One missing path draws
   instantly and breaks the sequence invisibly.
2. **It drew**: total dashoffset before entering view ≈ path count; after ≈ 0; a mid-scroll sample strictly
   between.
3. **No JavaScript → fully drawn at load.**
4. **Reduced motion → fully drawn, and `getAnimations()` reports nothing running on the tiger.**
5. **It lives**: the tail's transform sampled at three moments across the living phase gives three different
   values.
6. **It dozes**: after the timeline ends, no animation is running and the eyes are closed.
7. **It stirs**: scrolling away and back restarts the living timeline — and does **not** re-run the ink.
8. **The butterfly travels**: `offset-distance` advances between two samples, and holds constant across a
   landing.
9. **Density**: `scripts/measure_density.mjs` shows `field-days`' worst screen improved and its mean still
   under 45%.
10. **Budget**: `npm run verify:budget` shows the untouched-JS figure has not risen.

---

## 8. Out of scope

Named so they are not rediscovered as gaps.

- **The walking tiger** — the jointed rig, the four-beat gait, `entering`/`walking`/`stopping`/`sitting`
  states. Cut at the client's decision. If wanted later, it needs artwork commissioned for it.
- **Tripadvisor wiring** — live reviews, ratings and counts. Client-confirmed as the successor to the
  hard-coded quotes, but a separate piece of work.
- **The hero's 2,500ms budget** — measured as unreachable with available levers and deferred by the client.
  See [`DECISIONS.md`](../../DECISIONS.md) §3.
- Sanity CMS, the SEO redirect map, any page but the home page.

## 9. Risks

| Risk | Mitigation |
|---|---|
| **The extracted leaf does not read as a leaf at 24px** | Judged by eye at review. Replaced by a drawn mahua leaf; one constant, one file |
| **The tiger drawing is not good enough** | Same — reviewed at size on the real page before it ships; only `lib/tiger-art.ts` changes. Stroke-only and self-inking is itself the mitigation: a sketch forgives what a silhouette does not |
| **The client removes the leaf cursor later** | Removability is a tested contract, and the sliding rule carries the link affordance without it |
| **`transform` composition silently kills an animation** | §2's landmine note; every rig samples mid-transition rather than reading a class |
| **The cursor's loop never stops** | Counted, asserted at zero |
| **Three features, one plan** | They are independent: the rule touches CSS and links, the cursor is one isolated directory, the tiger is one server component. Any one can be cut without touching the others |
