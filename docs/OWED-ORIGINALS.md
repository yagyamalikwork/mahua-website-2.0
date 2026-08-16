# Photographs we need at a higher resolution

**For Yagya. One list, replacing the three partial asks scattered through `DECISIONS.md` §5, §19 and the
coverflow reviews.** Last compiled 17 August 2026.

Nothing here is broken today on an ordinary laptop at 100% zoom, which is what you test on. Each row is a
photograph the page has grown large enough to outrun — either on a high-resolution screen (a Mac, an iPad,
a Windows laptop scaled to 125% or 150%), or, in the last group, on any screen at all if we want the section
to pass your own 45% rule.

## What "re-export at 2,900px" means

We already generate every size the site needs, automatically, from one file per photograph. The only thing
that matters is **the width of the file you send** — everything narrower is derived from it. So the ask is
always the same shape: **go back to the original camera file and export it again, wider, uncropped.**

If a photograph simply does not exist at that width — it was shot small, or the original is lost — say so
and we work with what there is. Knowing is what matters; a row we can close as "this is all there is" is as
useful as a new file.

---

## Group 1 — the four carousel photographs (this one has a decision attached)

`04 · Days in the Field` is now a carousel of six photograph cards. **These four are the reason it does not
yet pass your 45% rule**, and they are the only lever left.

| Photograph | Have | Need (minimum) | Need (ideal) |
|---|---|---|---|
| `vann-safari` — the open vehicle, morning drive | 1163 × 508 | **1,450px wide** | **2,900px wide** |
| `vann-bird-watching` | 1163 × 508 | 1,450px | 2,900px |
| `vann-kohka-lake` | 1163 × 508 | 1,450px | 2,900px |
| `vann-potters-village` | 1163 × 508 | 1,450px | 2,900px |
| `forest-trail-canopy` — the trail under canopy | 960 × 640 | 1,150px | 2,200px |

**Why this decides the 45% question.** The cards are currently 900px wide, and at that size the browser is
already using *every pixel these files have* — measured at exactly 1.00, no margin. To get the section under
45% empty the cards need to be about 1,090px wide, and that needs the "minimum" column above.

The "ideal" column is double, which is what a Retina or 150%-scaled screen actually asks for. Without it the
photographs are sharp on your laptop and slightly soft on a Mac.

**These four are also crops.** They are 2.29:1 — very wide, very short — because they were cut for the
Mahua Vann page's own layout. **Uncropped originals would be worth more than wider crops**: a taller frame
would let the card be a better shape, and right now the card has to be 16:9 to avoid cutting more than a
quarter off these.

---

## Group 2 — the three forest cats

`03 · The Forest`. When the photograph boards were rebuilt on 14 August they gained a one-column state that
can draw a plate roughly twice its old size, and these three cannot fill it on a high-resolution screen.

| Photograph | Have | Need |
|---|---|---|
| `tiger-pair-profile` | 900 × 1133 | **~1,800px wide**, uncropped |
| `leopard-on-rock` | 900 × 1352 | ~1,800px |
| `melanistic-leopard` | 900 × 1352 | ~1,800px |

Between 22% and 46% short at the moment, on a Retina screen only.

---

## Group 3 — the four room photographs

`05 · The Rooms`, same cause as group 2.

| Photograph | Have | Need |
|---|---|---|
| `room-open-to-bamboo` | 1440 × 811 | **~2,600px wide**, uncropped |
| `room-hanging-chair-view` | 1440 × 810 | ~2,600px |
| `hanging-chair-forest-deck` | 1440 × 810 | ~2,600px |
| `bungalow-exterior-palms` | 1440 × 1080 | ~2,600px |

---

## What happens when they arrive

Drop the files over the sources and one script re-encodes everything: `node scripts/build_images.mjs`.
Nothing else needs touching, and the guards catch a file that arrived smaller than promised or turned out to
be a duplicate of one we already have — both of which have happened before.

## Priority, if you can only do some

1. **Group 1's four Vann frames** — they are the open decision, not just a sharpness improvement.
2. Group 3, the rooms — the largest photographs on two property pages.
3. Group 2, the cats — the shortfall is real but only shows on a high-resolution screen.
