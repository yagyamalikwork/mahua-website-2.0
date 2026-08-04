# The targeted shot list

**What this is.** Four photographs — plus two optional — that would do more for the home page than any
further layout work. Written 4 August 2026 from measurement, not taste: every entry below names the chapter
it fills, what is wrong with what is there now, and the number that says so.

**Why it is short.** A shoot is a cost. This is not a wish list; it is the smallest set that closes the
measured gaps. Everything else in the library is adequate.

---

## What the library actually is

34 photographs. **17 clear 1400px** and may run full-bleed; the other 17 may not (CLAUDE.md
non-negotiable #10). Three were harvested from the client's own property video and are the only 1920px
sources we hold.

| Category | Images | ≥1400px | Portraits | The problem |
|---|---|---|---|---|
| *the lantern hour* | 9 | 6 | 1 | Healthy. The strongest category we have. |
| *the forest* | 7 | 2 | 3 | Wildlife is all borrowed frames at 900px or less |
| *life at the lodge* | 13 | 8 | 0 | **No portraits at all**, and almost nobody in shot |
| *details* | 5 | 1 | 2 | Thinnest category; carries the emptiest chapter on the page |

**Eight sources cannot fill the space they are drawn into.** *Corrected 5 August 2026 — the figures in the
first version of this document were roughly a third of the truth, in the client's disfavour.* They were
derived from each photograph's **box**, and every photograph on this page is cropped to fill its box
(`object-fit: cover`): a wide frame in a tall slot is scaled until its *height* covers, so it is drawn far
wider than the box and the sides are cut off. The browser has to supply all of that width. Full-screen
photographs on a portrait phone are the extreme case — a 3:2 frame in a 390 × 844 window is drawn about
1,600 px wide, not 390.

Re-derived with the corrected rig (`scripts/check_image_resolution.mjs`, every figure in
`docs/reviews/2026-08-03-chapters/image-resolution.json` under `all`):

| Photograph | Widest we hold | Drawn | Needs | Have / need | Worst at |
|---|---|---|---|---|---|
| `tiger-golden-grass` | 1440 | 1,617 | **3,234** | **0.45** | 390 @3x |
| `birding-cairn-dusk` | 1440 | 1,616 | **3,231** | **0.45** | 390 @3x |
| `lodge-facade-night` | 1440 | 1,613 | **3,226** | **0.45** | 390 @3x |
| `potters-hands` | **700** | 1,250 | 1,250 | 0.56 | 1920 |
| `reception-path-dusk` (the hero) | 1440 | 1,266 | **2,532** | 0.57 | 390 @3x |
| `forest-shrine-incense` | **700** | 366 | 732 | 0.96 | 390 @3x |
| `bonfire-circle-night` | 1440 | 1,480 | 1,480 | 0.97 | 1920 |
| `guide-sunrise` | 1000 | 1,027 | 1,027 | 0.97 | 1920 |

"Needs" is what the site asks for, which is twice the drawn width on a dense screen and no more — the site
deliberately caps itself at 2× rather than a handset's full 3× (`lib/sizes.ts`). **What the handset could
actually use is half as much again:** 4,851 px for the three full-screen frames and 3,798 px for the hero.

`tiger-crossing-track` at 541px, named in the first version as the worst on the page, is not on this list —
it sits in a small square inlay and is adequate there. It still deserves reshooting for the reason given
under shot 2: a 541px source is one layout change away from being embarrassing.

Nothing is being served smaller than the files we hold — `sizes` is correct at every width, re-verified
against the corrected rig. These are simply the largest files that exist.

---

## The four

### 1. Guests at the table, at the lantern hour — the one the page most needs

| | |
|---|---|
| **Fills** | `guests` (the testimonials chapter) and, as a second frame, `lantern-hour` |
| **Why** | The chapter that quotes guests carries **no photograph of a guest**. It runs on `lawn-picnic-golden-hour` and `garden-path-lodge` — an empty lawn and an empty path. It measures 39.6% empty, and it is the only chapter on the page whose subject is people and whose pictures contain none. |
| **Where** | Mahua Vann: the veranda dining tables, or the bonfire ring at Tola |
| **When** | The 20 minutes after the lamps are lit and before the sky goes black — the brand's own "lantern hour". Shoot it two evenings running; there is one usable window a day. |
| **Orientation** | **Landscape, ≥2400px.** One frame wide enough to run full-bleed. |
| **The picture** | Four or five people mid-conversation at a laid table, lamps in frame, faces lit by them. Not looking at the camera. Not a posed group. The nearest thing we have is `petal-table-night`, which is beautiful and empty. |
| **Consent** | Guests must sign a release. Budget a second evening in case the first table declines. |

### 2. A safari vehicle on the track at first light, with the guests in it

| | |
|---|---|
| **Fills** | `field-days` — the emptiest chapter on the page |
| **Why** | `field-days` averages **51.1% empty and reaches 60%**, the worst of the twelve. It carries the six-item experiences index, and the photograph meant to sell the dawn drive is `tiger-crossing-track` at **541px** — the smallest source in the whole library, on a chapter that occupies 2.35 screens. |
| **Where** | Turia Gate, Pench, on the track inside; Kolara Gate at Tadoba as the alternate |
| **When** | First light, the first 40 minutes after the gate opens. The dust and the low sun are the point. |
| **Orientation** | **Landscape, ≥2400px**, plus one portrait crop of the same moment for the small inlay slot. |
| **The picture** | The vehicle three-quarters from the front or side, guests visibly looking *out* rather than at the lens, the naturalist at the wheel. Sal forest either side. A tiger is not required and should not be waited for — the subject is the morning, not the cat. |

### 3. A room interior with someone in it, doors open to the forest

| | |
|---|---|
| **Fills** | `rooms`, and gives `lodges` a second register |
| **Why** | *Life at the lodge* is 13 photographs and **not one of them has a person in it**. Every room shot is a made bed in an empty room, which is the exact idiom of the template site this rebuild replaces. `rooms` measures 37.8% empty and reads as an estate-agent gallery rather than a place anyone has been. |
| **Where** | Mahua Vann, one of the cottages with the forest-facing deck; the doors open onto bamboo |
| **When** | Mid-morning, when the light comes through the open doors rather than off the ceiling fitting. Not at night — we have night. |
| **Orientation** | **Landscape, ≥2400px.** |
| **The picture** | One person reading in the hanging chair or on the bed with the doors thrown open, the forest doing the work behind them. Shot from inside the room so the interior frames the trees. Handmade mud wall, timber dado and terracotta beams all in shot — those are the things the copy names. |

### 4. The mahua tree in flower, from beneath

| | |
|---|---|
| **Fills** | `rooted` — the chapter about the tree the brand is named after |
| **Why** | Chapter 02 is *Rooted like the mahua*. It describes *Madhuca longifolia* dropping cream flowers until the forest floor is carpeted, and the Gond calling it *kalpavriksha*. **We have no photograph of a mahua tree.** The chapter runs on a potter, a shrine and a bridge. This is the single largest gap between what the page says and what it shows. |
| **Where** | Anywhere on either estate with a mature mahua. Ask the naturalists which one drops first. |
| **When** | **Late March to early April, before first light** — the flowers fall overnight and are gone to the chital by mid-morning. This is the one shot on this list with a hard seasonal window, and missing it costs a year. |
| **Orientation** | **Portrait, ≥2000px**, and a second landscape of the carpeted forest floor. |
| **The picture** | Two frames: the canopy from directly beneath, and the ground beneath it covered in fallen cream blossom. If an animal is feeding on the fall, that frame beats both. |

---

## Two more, if the budget stretches

### 5. Hands and detail, close, at 2400px

*Fills* `details` — the **emptiest chapter on the page at 58% empty**, and the thinnest category in the
library (5 images, only 1 of them full-bleed-eligible). Its three best frames (`potters-hands`,
`petal-bowl-map`, `forest-shrine-incense`) are all **700px**. `potters-hands` is the second-worst shortfall
in the library — it is drawn 1,250 px wide at 1920 and we hold 700 (0.56); the other two are marginal on a
dense phone.

Reshoot those three subjects properly, plus two new ones: the hand-inked leaf the welcome is written on, and
a naturalist's field notebook open on a page. Close, shallow depth of field, natural light. **Portrait,
≥2400px.** Half a day.

### 6. One landscape at 3500px+ for the hero — no longer optional in the same way

*Fills* the top of the page. `reception-path-dusk` is 1440px, and **the hero is drawn 1,266 px wide on a
390 px phone and 1,920 px wide on a 1920 monitor**, so the widest file we hold is 0.57 of what a handset
asks for and 0.75 of what a desktop asks for. It is the one photograph every visitor waits for, and it is
the softest thing on the first screen.

The constraint that makes this hard is not the source, it is the budget: `reception-path-dusk-1440.avif` is
already **195.8 KB against the 200 KB per-image cap** (CLAUDE.md non-negotiable #6), which is why the
pipeline stops at 1440 for this frame. A wider *source* therefore only helps if it is a **simpler frame that
compresses well** — open sky, water, mist, a clean horizon, an uncluttered veranda. Dense foliage at dusk,
which is what we have, will not make the budget at any width.

So: shoot the hero as a **compressible** frame at ≥3500px, not merely a large one. If a frame like that
comes out of the shoot, it goes to the hero and the first screen gets both sharper and lighter. If it does
not, `reception-path-dusk` stays and nothing is lost.

---

## Practical notes for the photographer

- **Deliver RAW plus full-resolution JPEG.** Everything the site serves is generated from the source by
  `scripts/build_images.mjs`; we downscale, never upscale.
- **Minimum 3500px on the long edge for anything meant to run full-screen**, 2400px for anything meant to
  run wide inside the page, 2000px for anything meant to run in a column. *Raised from 2400px on 5 August
  2026:* a full-screen photograph on a portrait phone is drawn about 1,600 CSS px wide and a dense handset
  can use three device pixels for each of them, so the honest requirement there is ~4,800px and 3500 is the
  point past which the 200 KB encode budget binds first anyway. Below 1400px an image can never go
  full-bleed on this site at all.
- **Shoot both orientations of every set-up.** The layout uses portrait plates and landscape bands in
  alternation, and the library's shortage of portraits (0 of 13 in *life at the lodge*) is why one chapter
  reads as a row of thumbnails.
- **People, wherever they can be got.** Three of the four shots above exist because the library is
  photographs of an empty resort.
- **No Beyond Stay branding anywhere in frame** — soap wrappers, folders, signage, vehicle livery. The
  client's own property video is unusable on the new site for exactly this reason
  (`docs/reviews/2026-08-04-image-audit/README.md`).
- **Ordinary weather is fine.** The page is cream and unhurried; it does not need spectacle.
