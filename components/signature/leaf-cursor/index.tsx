"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The leaf cursor's single entry point, and the only thing outside this directory
 * may import.
 *
 * **Removability is a requirement here, not a nicety.** The client asked for the
 * cursor to be easy to remove or change, so deleting the one line in
 * `app/layout.tsx` removes the feature — and because the component below is
 * loaded dynamically, it removes its *bytes* too rather than leaving dead code in
 * the bundle. `removability.test.ts` fails if a second importer ever appears, and
 * it fails if this file stops using a dynamic import. Neither would show up in a
 * build, a type check or a screenshot.
 *
 * **The gate runs before the import, not inside the component.** A phone must
 * never fetch this chunk: most of this site's traffic is Indian mobile, the
 * first-load JavaScript budget has 21 KB of headroom, and a pointer that cannot
 * hover has nothing to show. `scripts/check_leaf_cursor.mjs` asserts zero bytes on
 * the network at a coarse pointer rather than asserting the import looks
 * conditional — a guard that greps source for an import shape is the check that
 * let a 110 KB regression through once already (`docs/DECISIONS.md` §2, #12).
 *
 * **Nothing renders under `prefers-reduced-motion`.** The original spec asked for
 * a "still and simple" leaf, and a leaf locked rigidly to the pointer is exactly
 * the sticker that spec warns against two lines earlier. Absence is this
 * element's defined still state: a visitor who asked for less motion gets their
 * own cursor back, which is both quieter and more useful than a decoration that
 * cannot move.
 */
const LeafCursor = dynamic(() => import("./LeafCursor").then((m) => m.LeafCursor), { ssr: false });

const FINE_POINTER = "(pointer: fine)";

/**
 * `useSyncExternalStore` rather than an effect that sets state.
 *
 * Two media queries are exactly the "external system" this hook exists for, and
 * reading them in an effect and calling `setState` is a cascading render React's
 * own lint rule rejects. It is also better behaviour: subscribing means plugging
 * in a mouse, or turning the operating system's motion setting back on, brings
 * the leaf without a reload — and turning that setting off takes it away again,
 * which matters on this project, where the client once mistook exactly that
 * setting for a broken build (`docs/DECISIONS.md` §4).
 *
 * The server snapshot is `false`, so nothing is ever server-rendered and the
 * markup a visitor receives has no cursor in it at all.
 */
function subscribe(onChange: () => void) {
  const lists = [FINE_POINTER, "(prefers-reduced-motion: reduce)"].map((q) => window.matchMedia(q));
  for (const list of lists) list.addEventListener("change", onChange);
  return () => {
    for (const list of lists) list.removeEventListener("change", onChange);
  };
}

const wantsLeaf = () => window.matchMedia(FINE_POINTER).matches && !prefersReducedMotion();

export default function LeafCursorMount() {
  const wanted = useSyncExternalStore(subscribe, wantsLeaf, () => false);

  return wanted ? <LeafCursor /> : null;
}
