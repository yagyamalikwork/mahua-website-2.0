# Known variance: any chapter carrying the Elfsight review widget is non-deterministic

Added 26 August 2026, fix round 1 on Task 8b (`.superpowers/sdd/2026-08-26-restructure-and-reviews/task-8b-report.md`).

**Do not quote a single `measure_density.mjs` run for `invitation` (home), `vann-press`, or `tola-press`
as a fixed fact.** The Elfsight widget's carousel autoplays and its own rendered height is not fully
deterministic between page loads (confirmed: `heightPx` was observed at 1068px in 5 of 6 home runs and
900px in the 6th; 857px in 3 of 4 Vann runs and 622px in the 4th — the same 622px Task 8's own report
independently observed — all against one unchanged build). That height shift cascades into
`documentHeightPx`, the page's last sampled screen, `page.worstEmptyPercent` and `page.overBudget`, not
just the one chapter's own figure. `tola-press` showed no such swing in four repeated runs, which is
evidence of a lower rate, not proof of immunity — it shares the identical widget and mechanism.

Repeated-run tables, the observed spread, and the mechanism for why revealing the same hidden content
moves `invitation` and `vann-press`/`tola-press` in *opposite* directions are in `task-8b-report.md`'s
"Fix round 1" section. Raw evidence: `density-{home,vann,tola}-repeat{1,2,3+}.json` in this directory.
