"use client";

import { Fragment, useEffect } from "react";
import { DURATION } from "@/lib/motion";
import { useCurtainReveal } from "./useCurtainReveal";
import { useInView } from "./useInView";

/**
 * A headline whose lines rise from behind a mask, staggered.
 *
 * The words are separate boxes in the server-rendered markup and are **at rest,
 * fully visible, before any JavaScript runs**. Script only ever moves them *down*
 * out of view and back; if it never loads, throws, or is disabled, the headline
 * reads normally. The reverse arrangement — hidden in the markup and revealed by
 * script — is how a headline ends up permanently invisible behind a mask that
 * never lifts, and `components/motion/primitives.test.tsx` exists to keep it
 * that way.
 *
 * The stagger is per *visual line*, measured after layout, not per word. Per
 * word reads as a typewriter; per line reads as one movement, which is the
 * reference's effect. Where a headline wraps depends on the viewport, so the
 * lines are read off `offsetTop` at mount rather than assumed from a count.
 *
 * **This used to be a GSAP timeline and is now two custom properties and a
 * transition** (`app/globals.css`). Nothing about the effect changed; what
 * changed is that an entrance no longer drags a 115 KB tween library into the
 * first load. The state machine is `useInView`'s — the same one `Enter` and
 * `ImageReveal` use — so a headline already on screen at mount is left entirely
 * alone, which is the 4 Aug flicker fix and also what keeps the hero headline
 * off the LCP clock.
 *
 * **`curtained` is the one exception to that, added 20 Aug 2026, and it does not
 * weaken the rule.** It swaps the scroll observer for a timer keyed to the
 * welcome screen, which is an opaque curtain over the whole viewport while the
 * staging happens — so the premise the rule rests on, that somebody is looking
 * at this, is false for that window and false in a way the code can check. It
 * declines to run rather than run late. `useCurtainReveal` carries the argument
 * in full, including why the LCP objection does not apply to it and would have
 * applied to the obvious CSS-only version.
 *
 * **On rising twice.** Six sections wrap a `TwoToneHeading` in an `<Enter>`, so
 * the headline sits inside a block that rises 16px of its own. That is kept, and
 * it is what the reference does too: it ships SplitText for per-line reveals
 * *and* shows 14–18px block translates on the same text. What was wrong was that
 * ours were two unrelated movements — `power2.out` over 1.0s fired at
 * ScrollTrigger's `top 85%`, laid over `cubic-bezier(0.22, 1, 0.36, 1)` over
 * 0.9s fired at `rootMargin: -12%`. Both now come from the same `useInView` with
 * the same margin and share `--enter-ease`, so they compose into one settle
 * instead of racing. The alternative — exempting the headline from its
 * ancestor's transform — is only possible with a counter-transform that has to
 * cancel exactly on every frame, and this project has been burned eight times by
 * exactly that kind of mechanism.
 */
export function SplitLines({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  slow = false,
  deep = false,
  curtained = false,
  dim,
  dimColour = "var(--dim)",
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  slow?: boolean;
  /**
   * Start each word further below its own mask, so the headline travels further
   * without being set larger.
   *
   * **A headline's travel is its type size times `LINES.from`**, which means the
   * effect is quieter on a smaller heading whether or not that is what anyone
   * intended. `02 · The Jungles` is the case: 45px type against the closing
   * chapter's 70px, so 56px of travel against 84px, measured on the shipped page
   * — and the client reported exactly that as the effect being *"not
   * noticeable"* there on 20 Aug 2026. His own ruling of 19 Aug set that heading
   * smaller, so the size is not available as a lever; this is.
   *
   * `LINES.deepFrom` carries the number and the arithmetic. Use it where a
   * heading has to hold its own beside a much larger one, not as a way of making
   * an entrance louder — non-negotiable #4 has not moved.
   */
  deep?: boolean;
  /**
   * Reveal on a timer as the welcome screen lifts, rather than on scroll.
   *
   * **For the hero's headline and nothing else today.** `useInView` will not
   * stage anything already on screen at mount — a rule worth keeping, see the
   * note there — so without this the page's largest headline is the one place
   * this effect does not happen at all. `useCurtainReveal` carries the whole
   * argument, including why it declines to run rather than run late.
   */
  curtained?: boolean;
  /**
   * The reference site's signature move: one run of words inside the headline
   * dropped to a lighter tone while the rest stays ink. Passed as the words
   * themselves rather than as markup, so `content/home.ts` stays free of HTML —
   * `content/home.test.ts` guarantees the run occurs in the headline exactly
   * once, which is what makes splitting on it unambiguous.
   *
   * It lives here rather than in a separate two-tone heading component because
   * the alternative is two headline implementations, only one of which reveals.
   */
  dim?: string;
  /**
   * Ink-on-cream headings dim to `--dim`. A heading laid over a photograph has
   * to dim to something that still clears 3:1 against the scrim, so those pass
   * a pale cream instead — `--dim` over a photograph is unreadable.
   */
  dimColour?: string;
}) {
  const { ref, state: onScroll } = useInView<HTMLElement>();
  const onCurtain = useCurtainReveal(curtained);
  /*
   * One state, from one of two sources, never both. `useInView` returns `rest`
   * forever for anything on screen at mount — which every `curtained` headline
   * is, by definition — so the two could safely be OR'd; choosing between them
   * explicitly is what stops that being an accident of the other hook's
   * behaviour rather than a decision made here. The ref stays attached either
   * way: its own effect bails on the first line for an on-screen element, so it
   * costs an observer that is never created.
   */
  const state = curtained ? onCurtain : onScroll;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inners = Array.from(el.querySelectorAll<HTMLElement>("[data-line-inner]"));
    if (inners.length === 0) return;

    // Words sharing a top edge are one line. Measured here rather than assumed,
    // because where a headline wraps depends on the viewport: the same words are
    // one line at 1440 and three on a phone, and a stagger built from an assumed
    // line count is wrong at every width but the one it was written for.
    //
    // Written unconditionally, including for a headline that will never be
    // staged. A delay is inert until something transitions, and branching on
    // `state` here would mean the delays landed in the same commit as the
    // staging rather than before it.
    let line = -1;
    let lastTop = Number.NEGATIVE_INFINITY;
    Array.from(el.querySelectorAll<HTMLElement>("[data-word]")).forEach((word, i) => {
      if (word.offsetTop > lastTop + 1) {
        line += 1;
        lastTop = word.offsetTop;
      }
      // Rounded because 2 × 0.09 is 0.18000000000000002 in binary floating
      // point, and there is no reason to ship that into a stylesheet. The unit
      // is not optional: `transition-delay: 0.18` is invalid, CSS drops it, and
      // the whole headline would arrive at once with nothing to show for it.
      const seconds = Math.round((delay + line * DURATION.lineStagger) * 1000) / 1000;
      inners[i]?.style.setProperty("--enter-delay", `${seconds}s`);
    });
  }, [children, delay, ref]);

  const words = splitWords(children, dim);

  return (
    <Tag
      ref={(node) => {
        ref.current = node;
      }}
      className={className}
      // Omitted rather than written as "rest", so the attribute's presence
      // always means script is driving this headline. Its own attribute rather
      // than `data-enter`, because that one would add the block rise and fade on
      // top of the per-line reveal — a third movement on one headline.
      {...(state === "rest" ? {} : { "data-lines-enter": state })}
      /* Written whether or not this headline is ever staged, and empty rather
         than "true": the rule it selects only exists under
         `[data-lines-enter="pending"]`, so on its own it is inert, and an
         attribute whose presence depends on two conditions is one nobody can
         check in a screenshot of the markup. */
      {...(deep ? { "data-lines-deep": "" } : {})}
      style={
        slow
          ? ({ "--lines-duration": "var(--lines-slow-duration)" } as React.CSSProperties)
          : undefined
      }
    >
      {words.map(({ word, dimmed }, i) => (
        <Fragment key={`${i}-${word}`}>
          {/*
           * `overflow-hidden` is the mask. The padding/negative-margin pair gives
           * descenders (g, y, p) room to exist inside it — without them the mask
           * crops the tails off the type at rest, which is a permanent bug rather
           * than an animation one.
           */}
          <span data-word className="inline-block overflow-hidden align-top pb-[0.16em] -mb-[0.16em]">
            <span
              data-line-inner
              className="inline-block"
              style={dimmed ? { color: dimColour } : undefined}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

type SplitWord = { word: string; dimmed: boolean };

/**
 * The headline as words, each flagged for whether it belongs to the dimmed run.
 *
 * Tokenised on whitespace first and only then intersected with the run's
 * character range, rather than slicing the string at the run's boundaries. The
 * slicing version splits "the cats, and" into "cats" and a homeless comma, and
 * renders it as `cats , and`. Overlap also means a `dim` of two words dims both,
 * and a `dim` that lands inside a longer word dims that whole word instead of
 * cutting it in half.
 *
 * If the run is absent — which `content/home.test.ts` forbids for anything in
 * `HOME`, but a caller elsewhere could still manage — every word comes back
 * undimmed and the headline simply reads in one tone.
 */
function splitWords(text: string, dim?: string): SplitWord[] {
  const at = dim ? text.indexOf(dim) : -1;
  const end = at === -1 ? -1 : at + (dim as string).length;

  return [...text.matchAll(/\S+/g)].map((match) => {
    const start = match.index;
    const stop = start + match[0].length;
    return { word: match[0], dimmed: at !== -1 && start < end && stop > at };
  });
}
