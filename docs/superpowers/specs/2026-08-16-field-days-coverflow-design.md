# `04 · Days in the Field` as a coverflow carousel — design

**Date:** 16 August 2026
**Status:** **APPROVED by the client, NOT YET BUILT.** Agreed in conversation; no code written.
**Scope:** the `field-days` chapter on the home page only. Nothing else.

---

## 1. Why

Client: *"Section 04 looks flat even though it has beautiful images."*

**The measurements agree, which is worth recording because it makes this a fix and not only a preference.**
`field-days` is **2,637px (2.93 screens), 43.9% mean empty, 57.9% on its worst screen** — one of only three
chapters on the site that fail non-negotiable #8's 45% ceiling on their worst screen. Six photographs spread
thin over three screens is exactly what "flat" describes.

The material is already right: the chapter has **six photographs and six activities**, one-to-one.

| | |
|---|---|
| photographs (`content/chapters.ts`) | `guide-sunrise`, `forest-boardwalk-daylight`, `tiger-crossing-track`, `forest-trail-canopy`, `hammocks-shade`, `pool-daylight-forest` |
| activities (`content/home.ts` → `experiences`) | Jungle safari · Bird watching · Kohka Lake · The river walk · Pachdhar, the potters' village · Walks and cycling |

Today it renders through `components/sections/SplitFeature.tsx` as three bands.

## 2. What it becomes

A **pinned coverflow**. The section holds still while the six cards advance through it: the centre card in
focus, the previous one behind and to the left, the next behind and to the right, both smaller and dimmed.
One card per activity, carrying that activity's own photograph.

## 3. The client's ruling on what drives it — and why it is not autoplay

He was offered three: page-scroll-driven, arrows-only, or autoplay-on-a-timer. **He chose scroll-driven
with arrows.**

The autoplay option was presented with its conflict stated rather than hidden: **an auto-rotating carousel
is permanent peripheral motion**, which non-negotiable #5 exists to forbid — it is why the tiger dozes and
why both films play once and hold. Scroll-driven keeps the rule intact: nothing moves unless the visitor
moves.

## 4. Mechanism — no JavaScript

- A **tall wrapper** carries the pin's scroll. Each card runs a **CSS scroll-driven animation** offset by
  its index, travelling off-right → behind-right → centre → behind-left → off-left. Same family of
  machinery as the rooms card stack, which shipped at zero bytes (`DECISIONS.md` §17).
- **The arrows are anchor links.** Invisible targets sit at the scroll offsets where each card is centred,
  so `‹` and `›` are ordinary `<a href="#…">` links to those points: the browser scrolls, and the same
  animation plays.
- **Looping is free because of that choice.** The arrow on card 6 points at card 1's target and vice versa.
  No script, and arrows and scrolling drive one mechanism rather than competing for control of a position.

## 5. Decisions already taken

- **Card shape is photo-above-text, not the property pages' photo-beside-text.** The client asked for
  "cards like the Room Types"; in a coverflow a card is seen at an angle and partly overlapped, where a
  side-by-side split reads poorly. Materials and type stay the same. Raised with him and accepted.
- **Reduced motion** drops to a plain vertical list of the six cards — no pin, no transforms, no reserved
  scroll. `StickyScene`'s own rule: a pin that cannot animate is paid-for empty screens.

## 6. Constraints this must satisfy

- **Zero added JavaScript is the target.** Headroom is **6,928 bytes** brotli (172,272 against a 179,200
  ceiling). If any part genuinely needs script, measure it and say so rather than spending quietly.
- **Non-negotiable #9 — a pin must earn its scroll.** `rooted` is currently the only pinned chapter. Six
  activities advancing through the pin is the "content genuinely advances" case the rule allows, but the
  cost must be *measured*: `imagesPerScreen` and the page mean, before and after.
- **Expectation, to be proved and not assumed:** this should make the section **denser and shorter** —
  three cards visible at once against today's thin bands, and a pin of about two screens against today's
  2.93. That is the opposite of what a pin normally costs, which is exactly why it needs measuring.
- Non-negotiable #8: no chapter over 45% empty on its worst screen. This one is at 57.9% today, so the bar
  is *improvement*, not merely "no worse".
- No copy changes. The six activities' words are the client's and already exist.

## 7. Open, for the implementer

- Whether the pin is two screens or three: pick from measurement, not by feel. `rooted`'s own history
  (`DECISIONS.md` §8, non-negotiable #9) is that three screens was indefensible and two was break-even.
- Whether `SplitFeature` is retired or kept for other uses — check callers before deleting.

## 8. Method this project requires

- Measure in a real browser, sweeping widths **continuously**, not at 390/768/1440/1920. The last four
  defects all lived between those fixed samples.
- Watch every new assertion fail against a deliberately broken build before trusting it.
- Ask what a broken build would score on a measurement before believing it.
