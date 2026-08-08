# Plan 5 — the signature interactions: evidence

Everything here is re-derivable. Each command below assumes a production build is
being served:

```bash
npm run build && npx next start -p 3100
```

Plan 5's evidence outgrew one folder, because three of the things that shipped
were not in the plan. **Start with the table**, not with the file list.

| What | Where | Regenerate with |
|---|---|---|
| The sliding rule under links | `rule-in*.json` here | `node scripts/check_rule_in.mjs` |
| The leaf cursor | `leaf-cursor*.json`, `leaf-*.png`, `cursor-*.png` here | `node scripts/check_leaf_cursor.mjs` |
| The header, both states, 320–1920 | `header-*.png`, `header-regression.json` here | `node scripts/check_header.mjs` |
| **The whole page's signature scenes** | `w{390,768,1440,1920}-*.webp`, `reduced-motion-*`, `no-js-*` here | `node scripts/capture_signature.mjs` |
| **The two films** | [`../2026-08-08-films/`](../2026-08-08-films/) | `node scripts/check_films.mjs` |
| **The hanging lantern** | [`../2026-08-07-lantern/`](../2026-08-07-lantern/) | `node scripts/check_lantern.mjs` |
| **The welcome screen** | [`../2026-08-08-welcome/`](../2026-08-08-welcome/) | `node scripts/check_welcome.mjs` |
| Density, per chapter | [`../2026-08-03-chapters/density.json`](../2026-08-03-chapters/density.json) | `node scripts/measure_density.mjs` |
| Transfer, hero arrival, overflow | [`../2026-08-04-task-7/verification.json`](../2026-08-04-task-7/verification.json) | `node scripts/measure_page.mjs` |
| Hero and LCP, medians of five | — | `node scripts/measure_lcp_arms.mjs --port 3100 --runs 5` |

**Every rig exits non-zero on failure**, and each was run against a deliberately
broken build before its passing result was trusted. What each break proved is in
[`../../DECISIONS.md`](../../DECISIONS.md) §12 (the films), §11 (the lantern) and
§14 (the welcome).

## The frames

`capture_signature.mjs` writes 20: the welcome while it is up, then `rooted`,
`field-days` and `lantern-hour` — the three chapters a signature interaction lives
in — at 390, 768, 1440 and 1920, plus two reduced-motion frames and two with
JavaScript disabled entirely.

The last four are the ones worth looking at first. **Reduced motion must show no
welcome at all** (not a fast one), and **no-JavaScript must show the welcome gone,
the films' stills in place and every chapter legible** — those are the states that
would strand a visitor, and they are the reason the welcome carries no script.

## Density, before and after Plan 5

Measured at 1440×900 against non-negotiable #8's 45% ceiling. **Plan 5 left the
page slightly emptier on the mean than it found it, and that is the honest
result** — a figure standing in a chapter adds height as well as imagery, and the
two films add more height than they fill.

| | End of Plan 4 (5 Aug) | Now |
|---|---|---|
| `field-days` mean | 41.6% | **43.9%** ↑ |
| `lantern-hour` mean | 36.6% | **36.4%** |
| `rooted` mean / worst | 40% / — | **39.7% / 44.5%** |
| Page mean | ~39.5% | **40.1%** ↑ |
| Photographs per screen | 1.98 | **2.03** |

All twelve chapters are still inside the ceiling, and `rooted`'s worst screen came
back from **55.9%** — over it — when the potter was moved up against the copy on
7 Aug. `field-days` is the one that moved the wrong way: the tiger costs it 2.3
points of mean, and its worst screen is 57.9%.

The page's emptiest screens belong to **no chapter** — they are the joins between
sections, and the worst is `field-days / rooms` at 73.4%, which has not had the
treatment `rooted`'s join got (`DECISIONS.md` §10). **That is the first place to
look** if this figure is ever asked to come back down.

## The numbers that are not green

Two, both known and both the client's to settle:

- **The hero photograph lands at 4,308 ms against a 2,500 ms budget.** Every
  engineering lever has been measured; each remaining one is worth ~200 ms.
  `DECISIONS.md` §3.
- **Desktop whole-scroll is 3.8 MB.** Accepted under the client's 4 Aug reading
  that the 1.5 MB budget is the *initial* load — which is 599 KB on a phone and
  731 KB at 1440, both inside it.
