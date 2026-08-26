// Does the documentation still describe the repository?
//
// Run (no build, no server — it reads files):
//   node scripts/check_docs.mjs
//
// ## Why this exists
//
// The client has asked three times for a full documentation sweep, in his own
// words: *"everything, everywhere needs to be updated so we don't lose or miss
// any crucial information, context or knowledge … and everything stays up to
// date."* A promise to remember is not a mechanism. This is the mechanism.
//
// The failure it exists to catch is not laziness — it is that **prose rots
// silently**. Nothing goes red when a component is deleted and four documents
// still describe it in the present tense, and a session that reads those
// documents first (which `CLAUDE.md` instructs every session to do) inherits the
// wrong model of the page. That has happened here repeatedly: five documents
// still said this branch was "deliberately not deployed" the day after it was
// promoted; `CLAUDE.md` carried a page-mean density figure that disagreed with
// the evidence file sitting beside it; a retired rig was still named as current.
//
// ## What it checks, and what it deliberately does not
//
// It checks **facts a machine can settle**: that every path the docs name
// exists, that every rig can be found from `CLAUDE.md`, that figures the docs
// quote match the files they are quoted from, and that deleted things are
// marked as gone rather than described as present.
//
// It does **not** check whether the prose is true — no rig can. A sentence that
// is accurate about a file that exists and wrong about what it does passes here
// and always will. This narrows the surface a human sweep has to cover; it does
// not remove it.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => existsSync(path.join(ROOT, p));

/**
 * The documents every session is told to read before doing any work.
 *
 * `CLAUDE.md` names these four itself; a fifth would have to be added here by
 * hand, which is the same class of gap this rig exists to close — so the list is
 * checked against that instruction below rather than trusted.
 */
const DOCS = [
  "CLAUDE.md",
  "docs/PROJECT-STATE.md",
  "docs/DECISIONS.md",
  "docs/DEPLOY.md",
  "docs/OWED-ORIGINALS.md",
];

const failures = [];
const notes = [];
const fail = (check, message) => failures.push({ check, message });

/* ────────────────────────────────────────────────────────────────────────────
 * 1 — Every path the documents name must exist.
 *
 * A backticked path is a promise that a reader can open it. The commonest way
 * for one to break is a file being deleted while the sentence describing it
 * stays — which is exactly the case where the sentence is most misleading.
 * ──────────────────────────────────────────────────────────────────────────── */

const PATH_RE =
  /`((?:app|components|lib|content|scripts|docs|public|reference)\/[A-Za-z0-9_.\/-]+?)`/g;

/**
 * Paths that are deliberately named and deliberately absent.
 *
 * **Each one must be a thing the surrounding prose calls history**, and the
 * check below enforces that rather than taking this list's word for it: an
 * entry here still fails if the sentence around it reads as present tense. The
 * list only says "this file is expected to be gone".
 */
const GONE = new Set([
  "lib/coverflow.ts",
  "components/motion/useCurtainReveal.ts",
  "components/sections/Coverflow.tsx",
  "components/sections/CoverflowCard.tsx",
  "components/sections/Testimonials.tsx",
  // The hand-built review carousel, retired 26 Aug 2026 when the client supplied
  // his own Elfsight widget instead — see docs/DECISIONS.md §22.
  "lib/reviews.ts",
  "scripts/check_reviews.mjs",
  "components/sections/ReviewCarousel.tsx",
  "components/ui/RatingCircles.tsx",
  "components/sections/SplitFeature.tsx",
  "scripts/check_coverflow.mjs",
  "lib/band-height.ts",
]);

/** Words that mark a mention as a record of something past. */
const HISTORICAL =
  /retired|deleted|gone|removed|history|superseded|no longer|until \d|was \w|had been|used to|replaced|obsolete|dormant|unmounted|unrouted/i;

for (const doc of DOCS) {
  const text = read(doc);
  const seen = new Set();
  for (const m of text.matchAll(PATH_RE)) {
    const p = m[1].replace(/[.,;:]$/, "");
    if (seen.has(p)) continue;
    seen.add(p);
    if (p.includes("*")) continue;
    if (exists(p)) continue;

    // Absent. Is it *supposed* to be, and does the prose say so where a reader
    // would see it? 500 characters is about a paragraph either side.
    const at = text.indexOf(m[0]);
    const around = text.slice(Math.max(0, at - 500), at + 500);
    if (GONE.has(p) && HISTORICAL.test(around)) continue;
    fail(
      1,
      GONE.has(p)
        ? `${doc} names \`${p}\` — correctly absent, but the surrounding sentence does not say so, so it reads as present`
        : `${doc} names \`${p}\`, which does not exist`,
    );
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2 — Every rig must be findable from CLAUDE.md.
 *
 * `scripts/` is where every committed number in `docs/reviews/` comes from, and
 * `CLAUDE.md`'s command list is the only index of it. A rig missing from that
 * list is a measurement nobody will re-run, which is how a figure becomes
 * folklore. Found four this way on 21 Aug 2026, one of them
 * (`measure_first_fold.mjs`) named as a guard inside `Hero.tsx` itself.
 * ──────────────────────────────────────────────────────────────────────────── */

const claude = read("CLAUDE.md");
for (const f of readdirSync(path.join(ROOT, "scripts"))) {
  if (!/^(check|measure|build|capture)_.*\.mjs$/.test(f)) continue;
  if (!claude.includes(f)) fail(2, `scripts/${f} is not named in CLAUDE.md — nobody will find it`);
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3 — Figures the documents quote must match the files they come from.
 *
 * Only figures with a single machine-readable source. A number restated in
 * prose is a number that can drift from the thing it describes, and this
 * project has shipped exactly that: `CLAUDE.md` carried a page-mean density
 * that disagreed with `density.json` sitting beside it for three days.
 * ──────────────────────────────────────────────────────────────────────────── */

const figures = [];

// The density rig writes its own report; the docs must not disagree with it.
//
// **This pointed at `docs/reviews/2026-08-03-chapters/density.json` until 27
// Aug 2026, and that was stale twice over by the time it was found.** That
// file was last written 20 Aug 2026, on `feat/home-v2`, and describes a home
// page that no longer exists on this branch (`field-days` 42.4%/42.4% there;
// this branch's own build reads 35.6%/35.6% — a different chapter entirely,
// the sideways activity strip rather than the pinned coverflow). Every
// density run this branch's own work actually produced wrote somewhere else
// (`docs/reviews/2026-08-26-restructure/density-home-task9.json` and
// siblings), so this check was comparing a stale doc's figure to a stale
// file's figure and reporting PASS on the coincidence — while CLAUDE.md's own
// banner and non-negotiable #8 quoted 33.6%, a number no committed run on
// this branch ever produced (the seven committed home runs span 32.4–33.0%).
// Repointed at a fresh, this-branch run instead of a historical one.
const density = JSON.parse(read("docs/reviews/2026-08-26-restructure/density.json"));
const pageMean = density.page?.meanEmptyPercent ?? density.page?.mean ?? null;
if (pageMean === null) {
  notes.push("density.json has no page mean under a key this rig knows — figure check skipped");
} else {
  const stated = pageMean.toFixed(1);
  figures.push(["page mean empty", `${stated}%`]);
  /*
   * **Every occurrence of the PHRASE, not one occurrence of the NUMBER — and the
   * first version of this check made exactly that mistake.** It asked whether
   * `"33.6%"` appeared anywhere in the document, which a sentence about the
   * property pages' room chapters satisfied by coincidence; changing the real
   * page-mean to a wrong value left the check green. Watched failing to fail,
   * which is the only way that class of hole is ever found.
   *
   * So: find each place a document names this quantity, and check the figure
   * beside it. A document that never mentions it is not failed here — silence is
   * not drift.
   */
  for (const doc of ["CLAUDE.md", "docs/PROJECT-STATE.md"]) {
    const text = read(doc);
    const quoted = [...text.matchAll(/page mean ([\d.]+)%/g)].map((m) => m[1]);
    if (quoted.length === 0) {
      notes.push(`${doc} never states the page mean — nothing to drift`);
      continue;
    }
    if (!quoted.includes(stated)) {
      fail(3, `${doc} never states density.json's own page mean (${stated}%) — it quotes ${quoted.join("%, ")}%`);
    }
    /*
     * **A figure that differs must SAY it is a different build, and this rig
     * found the sentence that did not.** `CLAUDE.md` records the twelve-chapter
     * page's own history under non-negotiable #8, so several page means live
     * there legitimately — but one of them opened with the word "Current" and
     * had done since the day the seven-chapter branch was cut. Marking is the
     * whole test: a dated or branch-named figure is a record, an unmarked one is
     * a claim about today.
     */
    for (const m of text.matchAll(/page mean ([\d.]+)%/g)) {
      if (m[1] === stated) continue;
      const around = text.slice(Math.max(0, m.index - 320), m.index + 120);
      if (!/feat\/image-sizing|twelve[- ]chapter|\d{1,2} Aug 20\d\d|was |until |before |history|superseded/i.test(around)) {
        fail(3, `${doc} says "page mean ${m[1]}%" with nothing marking it as a different build or a past one`);
      }
    }
  }
}

// A rig that prints "PASS — N assertions" is claiming a number about itself.
// CLAUDE.md's command list describes these rigs, so it must carry the same N.
//
// **`check_reviews.mjs` sat in this list from the day it was written until the
// day it was deleted — Task 2 of the 26 Aug 2026 restructure, which replaced
// the review carousel with the client's own Elfsight widget — and this loop
// went on reading it anyway.** The line below called `read(\`scripts/${f}\`)`
// with no existence check, exactly like `exists()` guards every other file
// this rig opens; the very next run threw `ENOENT` and took the whole rig
// down with it, uncaught, exit code aside. **This project's own "do the
// documents still describe the repository?" gate — the gate the client has
// asked for three times — was therefore dead from that commit onward, and
// nothing said so until this fix (Task 8b, 26 Aug 2026).** The stale entry is
// removed, and the loop now checks existence first, so the NEXT rig this list
// outlives produces a finding here rather than a crash — the same lesson
// non-negotiable #8's own history already carries for `measure_density.mjs`
// twice over: a rig that cannot see something must say so, not fall silent
// (or, worse, fall over).
for (const f of ["check_experience_strip.mjs"]) {
  if (!exists(`scripts/${f}`)) {
    fail(
      3,
      `scripts/${f} is named in check_docs.mjs's own hard-coded assertion-count list but no ` +
        `longer exists — remove it here, the way check_reviews.mjs should have been`,
    );
    continue;
  }
  const n = /PASS — (\d+) assertions/.exec(read(`scripts/${f}`))?.[1];
  if (!n) {
    fail(3, `scripts/${f} prints no assertion count — this check cannot see it`);
    continue;
  }
  figures.push([`${f} assertions`, n]);
  if (!claude.includes(`${n} assertions`)) {
    fail(3, `scripts/${f} reports ${n} assertions; CLAUDE.md does not state that figure`);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * 4 — A promise in the documents must be a thing in the code.
 *
 * The narrow, checkable half of "is the prose true". Each of these is a claim
 * `CLAUDE.md` makes that a machine can falsify.
 * ──────────────────────────────────────────────────────────────────────────── */

const motion = read("lib/motion.ts");
const css = read("app/globals.css");

// **This used to check the review carousel's two modes, and it was dead from
// the day it was written to the day it was found, 27 Aug 2026.** It only ran
// when `claude.includes('REVIEWS.mode: "settle"')` — a string CLAUDE.md
// stopped containing on 26 Aug 2026, when Task 2 of that day's restructure
// retired `REVIEWS.mode` outright rather than choosing between its two values
// (`docs/DECISIONS.md` §22.3). So neither inner assertion below it could ever
// run again, including the one checking `app/globals.css`'s `.reviews*`
// block — which Task 2 deleted the same day. It read as live coverage while
// checking nothing, which is exactly the class of hole this whole file exists
// to close; found by a whole-branch fix-wave review, not by this rig itself.
//
// Repointed at something true rather than removed outright: `REVIEWS.mode`
// is retired, not merely unmentioned, so the live check now guards against
// it quietly coming back — a future session re-adding it to `lib/motion.ts`
// without also updating every place that called it "retired outright"
// (CLAUDE.md non-negotiable #5, `docs/DECISIONS.md` §22.3) would be exactly
// this project's fifty-five-instance defect pattern once more.
// A declaration, not a mention — `lib/motion.ts` itself deliberately keeps a
// historical comment naming `REVIEWS` (this project's own convention for
// marking something gone, per this file's `HISTORICAL` regex above), and that
// comment must not trip this check the way the ORIGINAL version of this
// section tripped over a stray same-string coincidence (see this file's own
// git history / the fix-wave note above).
if (/^\s*export\s+const\s+REVIEWS\b/m.test(motion)) {
  fail(
    4,
    "lib/motion.ts defines REVIEWS again, but CLAUDE.md's non-negotiable #5 and DECISIONS.md §22.3 both " +
      "say REVIEWS.mode was retired outright, not superseded — update those before reviving this export",
  );
}
if (css.includes('[data-reviews-mode')) {
  fail(
    4,
    "app/globals.css has a [data-reviews-mode=...] rule, but the review carousel it belonged to was " +
      "deleted 26 Aug 2026 (DECISIONS.md §22.3) — either this is dead CSS or REVIEWS.mode came back " +
      "silently",
  );
}

// The four documents every session is told to read must be the four it names.
for (const doc of DOCS) {
  if (doc === "CLAUDE.md") continue;
  if (!claude.includes(doc.replace("docs/", ""))) {
    notes.push(`${doc} is checked here but not named in CLAUDE.md's own reading order`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */

console.log("=== figures read off the repository ===");
for (const [k, v] of figures) console.log(`  ${k}: ${v}`);
for (const n of notes) console.log(`  note: ${n}`);

if (failures.length === 0) {
  console.log("\nPASS — the documents still describe the repository.");
} else {
  console.error(`\nFAILED: ${failures.length} finding(s)`);
  for (const f of failures) console.error(`  [${f.check}] ${f.message}`);
}
process.exitCode = failures.length === 0 ? 0 : 1;
