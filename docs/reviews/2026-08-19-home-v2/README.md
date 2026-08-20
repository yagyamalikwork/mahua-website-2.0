# Home page v2 — the stakeholders' restructure — evidence

**19-20 August 2026, on `feat/home-v2`. NOT DEPLOYED, and that is deliberate.**

The client, after a stakeholder discussion, asked for the home page to be restructured and chose to do it on
a branch rather than by deleting: *"rather than deleting, let us create a completely new branch for these
changes so we don't need to redo or undo or delete and remove any of the work we did… and we don't push it
to Vercel, I just present it on localhost to them."*

**`https://mahua-resorts.vercel.app` still serves the twelve-chapter page, and `feat/image-sizing` keeps
every part of it — the hanging lantern, the hornbill forest tint and the potter film all still ship there.**
Nothing on this branch deletes them; they simply have no mount on a six-chapter page. If the stakeholders
prefer what exists, walking away from this branch costs nothing.

The brief is [`specs/2026-08-19-home-v2-restructure.md`](../../superpowers/specs/2026-08-19-home-v2-restructure.md);
the narrative and the expensive findings are `DECISIONS.md` §21.

## 1 · The page

| | now | was |
|---|---|---|
| | The Journey Begins — hero | unchanged |
| **01** | The Lodges — **two joined panels** | four cards |
| **02** | The Jungles — **a cropped band, words on the photograph** | a 100svh quote |
| **03** | Rooted Like The Mahua — **text left, photographs right** | centred, with the potter |
| **04** | Mahua Philosophy — **the mirror** | did not exist |
| **05** | Experiences — **a sideways strip of six cards** | a pinned coverflow |
| | the close — two lodge pills, **now with the reviews under them** | reviews were their own chapter |

Removed from the home page: `forest`, `rooms`, `after-dark`, `lantern-hour`, `details`, `guests`.
Twelve chapters to seven.

## 2 · Gates, on the shipped build

| | |
|---|---|
| `npm test` | **477** passed |
| `npm run build` / `tsc --noEmit` / `lint` | clean (5 pre-existing booking-provider warnings) |
| `npm run verify:budget` | **167.5 KB brotli — JS delta 0** |
| `check_contrast_over_photos.mjs` | **318 probes, 0 failures, 0 not-found** across all three routes |
| `check_image_resolution.mjs` | **0 under-served** |
| `check_experience_strip.mjs` | PASS — 12 assertions over 99 widths |
| `check_pinned_collage.mjs` | PASS on **both** pinned chapters |
| `check_films.mjs` | PASS — the tiger, at six widths, white ground as pixels |
| `check_entrances.mjs` | PASS |
| `measure_page.mjs` | 669 KB @390, 965 KB @1440 initial; no horizontal scroll at any width |

Hero arrival is 3,878 ms against the 2,500 ms budget — **the standing, documented failure, unchanged by this
work** (CLAUDE.md non-negotiable #6 records why it is knowingly accepted).

## 3 · Density — every chapter inside the ceiling

| chapter | mean | worst | `passesWorst` |
|---|---|---|---|
| `arrival` | 0.4% | 0.4% | ✓ |
| `lodges` | 35.0% | 35.0% | ✓ |
| `why-you-came` | 34.2% | 34.2% | ✓ |
| `rooted` | 34.6% | 39.4% | ✓ |
| `philosophy` | 37.3% | 42.3% | ✓ |
| `field-days` | 42.4% | 42.4% | ✓ |
| `invitation` | 6.0% | 6.0% | ✓ |

**Page mean 33.2%, worst 66.4%, imagery 57.2% of the average screen.** For comparison the twelve-chapter
page was 37.9% mean with `lodges` at 48.6% and `rooms` at 46.5% both failing.

**`imagesPerScreen` is the figure to watch, and it fell before it recovered**: 2.2 on the twelve-chapter page
→ **1.65** at the low point (six chapters removed took thirteen photographs and only ~5 screens of scroll) →
**2.05** once the strip and the band landed. It is the number the client's original density complaint turns
on and it is worth quoting alongside the mean, never instead of it.

## 4 · What the client ruled, in order

| | |
|---|---|
| 19 Aug | **Branch, don't delete.** The reason this spec could be aggressive at all. |
| 19 Aug | **Property-page heroes** front the two panels; **the three photographs freed by `07 Details`** carry Philosophy; **the existing quote** stays as the Jungles heading. |
| 19 Aug | **Consent granted** for `star-talks` — two of its three people are recognisable at card size. |
| 19 Aug | **"We will later add more text to the philosophy, for now keep this."** Recorded as a *named, dated exception* to non-negotiable #10, not a relaxation of it. |
| 19 Aug | **Six activities, in his own order**, with Jungle Safari added to the design document's five. |
| 20 Aug | **The panels join** — no gutter, plus the hover zoom, the over-photograph text treatment and the pill raise, each an existing named effect. |
| 20 Aug | **The Jungles text goes back onto the photograph**, reversing the 19 Aug decision to move it into the cream. |
| 20 Aug | **Thinner still**, and then **centred vertically with the heading aligned under the panel above.** |

## 5 · Still open

1. **The extra Philosophy copy.** The chapter passes at 42.3% but still *reads* as the shorter half of its
   pair — 55 words in a composition built for 139. `content/chapters.test.ts` carries the dated exception and
   a second test that fails the day it stops being needed. **Delete the exception when the copy lands.**
2. **The safari card's photograph changed and the client has not ruled on it.** `tiger-crossing-track` could
   not be cropped to a portrait card: the guests span 0.34–0.85 of its width and a portrait window draws them
   **2.65× larger**, while its consent clearance rests on them being small and turned away. `tiger-golden-grass`
   is in its place, which has no people. §21.4.
3. **`potters-hands` moved** from `03 · Rooted` to Village Craft, because the page forbids a repeat and the
   client chose it for the card. `rooted` took `vann-potters-village` — the village its own third paragraph is
   about, and a better file. Also unruled.
4. **Uncropped portrait originals, ~900px wide, for five strip photographs.** DPR 2 asks 680; the editorial
   crops are 710/542/493/493/444. `docs/OWED-ORIGINALS.md`.
5. **The strip's header band is the sparsest thing on the page** — ~240px of bare cream beside a 300px tiger
   — untouched by client ruling (*"we keep the text and the tiger where they are"*). A wider tiger is its one
   lever, one line in `app/page.tsx`.
6. **The `philosophy / field-days` join is the page's emptiest run at 66.4%** and belongs to no chapter, so no
   chapter figure shows it. The five emptiest screens on the old page were joins too; this is the same shape.

## 6 · Method notes worth carrying

- **Four defects were found by looking at a screenshot, not by a rig**, and each would have shipped:
  the Jungles heading landing on the panther's head and its paragraph on the tiger's face; the same
  paragraph running off the photograph onto cream *as cream type on cream* at 390; the section's words
  sitting behind the fixed header at 1024; and two collage photographs **overlapping each other** for the
  first tenth of the pin, which `check_pinned_collage.mjs` passes with.
- **The hover zoom fired on less than half of each lodge panel** and only hovering the real page found it —
  the words are a later sibling of the frame and take the pointer over the bottom 55%, including the path to
  the button. The code read correctly.
- **`scroll-snap` quantised a rig's own samples for the third time on this project** — 11 requested offsets
  collapsing to 3. It is now guarded by an assertion rather than a comment.
- **An alignment target is a function of the viewport, not a constant.** The gap between the Vann panel's
  text and the band's container is 0 / 20 / 8 / 120px at different widths, because the container saturates at
  1600 while the panel keeps reaching the edge. Built with `100cqw`, never `100vw`: a Windows scrollbar makes
  `vw` 15-17px wider than the layout viewport and would have put it ~8px off **on the machine the client
  tests on**.
- **Changing a card's *size* is a scrim re-solve**, as much as re-cropping it or moving its type — growing
  the strip's card from 300 to 340 took one scrim to 7.33 and visible mud.
