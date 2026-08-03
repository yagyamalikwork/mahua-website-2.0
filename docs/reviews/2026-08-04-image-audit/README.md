# The image library audit — 4 August 2026

Triggered by an unrelated check. The client supplied the Mahua Tola property video; at ~44 seconds it holds
a sharp close-up of a soap wrapper reading **"BeyondStay HOTELS & RESORTS"**. Since cleaning residual Beyond
Stay presence is an open item in the brand record, the obvious next question was whether the same branding
appears in the room photographs already on the page. It does not — but building the sheet to check
surfaced something else, and the audit widened to all 35 entries.

## What was wrong

### Four pairs were the same photograph under two ids

Verified by 16×16 average hash, not by eye. Distances are out of 256; every genuinely distinct pair in the
library scores 40 or more.

| Pair | Distance | Where they landed |
|---|---|---|
| `lantern-bridge-dusk` = `lantern-boardwalk-map` | **0 — identical** | Chapters 02 and 06: the same photograph twice on one page |
| `tiger-yawning` = `tiger-pair-profile` | **0 — identical** | **Both inside the Forest plate grid** — one tiger shown twice, side by side, under two different captions |
| `veranda-dusk` ≈ `veranda-through-leaves` | 8 | **Both inside the Details plate grid** — same failure |
| `tiger-golden-grass` ≈ `tiger-approaching-grass` | 2 | One on the page, one in reserve |

Cause: the prior HTML mockup pack exported several images twice — once under a descriptive filename and
once as `mahua-brand-guidelines-v1-forest-NN`. Task 3's curation pass treated them as separate photographs
because their filenames differed.

### Three captions described a different picture

| Entry | Said | Actually was |
|---|---|---|
| `room-open-to-bamboo` | a stone-ceilinged room open to bamboo | **a lawn with picnic umbrellas** |
| `lawn-picnic-golden-hour` | picnic tables on a golden lawn | **a bedroom** |
| `tiger-yawning` | a tiger yawning in undergrowth | a tiger in profile, mouth shut |

The first two had each other's source file — a clean swap, since the bedroom *does* open onto bamboo and
the other frame *is* the lawn with umbrellas. The third inherited its description from a misleading source
filename (`tiger-yawning-in-the-undergrowth.jpg`).

## Why nothing caught it

`content/chapters.test.ts` has a rule that no photograph may appear twice on the page. It compared **ids**.
Four different ids pointed at the same picture, so it passed while two plate grids each showed one image
twice. And no test can read a caption and look at a photograph, so three descriptions pointed at the wrong
file with the whole suite green.

This is the same shape as every defect this project has produced: a correct-looking rule with a hole
straight through it, invisible until something measures the actual outcome rather than the intended one.

## The fix

- Four duplicate pairs collapsed, each surviving entry keeping the **larger** of the two sources: 900px for
  the tiger, 960px for the veranda. Library 35 → 31.
- Three captions rewritten from the actual photographs; the two swapped sources put back on their own ids.
- Three frames harvested from the client's property video — the candlelit petal table, the bonfire, and the
  hammocks. All 1920px, so all three clear the 1400px full-bleed bar. Library 31 → **34**.
- **`lib/media.test.ts` now compares pixels.** A 16×16 average hash of every entry against every other,
  failing under a Hamming distance of 16 — chosen to sit clear of both the observed duplicates (0, 2, 8)
  and the closest genuine pair (40+). It uses the hash rather than a byte comparison so it survives
  re-encoding and differing widths, which is what defeated every check that existed before.

Confirmed to bite: copying one derivative over another makes the suite fail and name both ids.

## Effect on the page

The page carried **29** distinct photographs while claiming 32. It now carries **32 genuinely distinct**,
from a library of 34, with two held in reserve. Full-bleed-eligible images rose from 14 to 17, because the
three video frames are 1920px — wider than anything harvested from the live site.

The Forest plate grid drops from four plates to three, since two of its four were one photograph. Three
matched portraits is the better grid anyway.

## Still worth the client's attention

- **The video cannot supply a background loop.** 44 shots in 54 seconds; average 1.2s, longest 2.3s, and
  the bonfire sequence is 1.4s. Ambient video needs 8–12 seconds of continuous footage.
- **That video should not be used on the new site as it stands**, because of the BeyondStay soap.
- The library tops out at 1920px and only 17 of 34 images clear 1400px. A fresh shoot is in the pipeline
  but not soon; the targeted shot list owed to the client matters more than it did.
