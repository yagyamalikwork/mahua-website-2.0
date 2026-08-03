"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * A headline whose lines rise from behind a mask, staggered.
 *
 * The words are separate boxes in the server-rendered markup and are **at rest,
 * fully visible, before any JavaScript runs**. GSAP only ever moves them *down*
 * out of view and back; if the script never loads, throws, or is disabled, the
 * headline reads normally. The reverse arrangement — hidden in the markup and
 * revealed by script — is how a headline ends up permanently invisible behind a
 * mask that never lifts, and `components/motion/primitives.test.tsx` exists to
 * keep it that way.
 *
 * The stagger is per *visual line*, measured after layout, not per word. Per
 * word reads as a typewriter; per line reads as one movement, which is the
 * reference's effect.
 */
export function SplitLines({
  children,
  as: Tag = "h2",
  className,
  delay = 0,
  slow = false,
}: {
  children: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  slow?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inners = Array.from(el.querySelectorAll<HTMLElement>("[data-line-inner]"));
    if (inners.length === 0) return;

    if (prefersReducedMotion()) {
      // The markup is already at rest, so there is nothing to reveal — only
      // anything a previous run might have left on the elements to clear.
      gsap.set(inners, { clearProps: "transform" });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Words sharing a top edge are one line. Measured here rather than assumed,
    // because where a headline wraps depends on the viewport.
    let line = -1;
    let lastTop = Number.NEGATIVE_INFINITY;
    const lineOf = Array.from(el.querySelectorAll<HTMLElement>("[data-word]")).map((w) => {
      if (w.offsetTop > lastTop + 1) {
        line += 1;
        lastTop = w.offsetTop;
      }
      return line;
    });

    // A headline already on screen at hydration has nothing left to reveal — the
    // markup painted it at rest. Animating it anyway means dropping settled text
    // out of view and lifting it back, which a Playwright capture of this very
    // component measured as a real flicker: transform "none" at first sample,
    // translated 28px 300ms later. So leave it alone.
    //
    // Headlines the visitor scrolls to have no such problem: their "from" state
    // is applied while they are still below the fold, where nobody can see it.
    // That is every headline on the page bar the hero — and skipping the hero
    // keeps it off the LCP clock for free (CLAUDE.md non-negotiable #6).
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    const tween = gsap.fromTo(
      inners,
      { yPercent: 115 },
      {
        yPercent: 0,
        delay,
        duration: slow ? DURATION.revealSlow : DURATION.reveal,
        ease: EASE.settle,
        stagger: (i: number) => (lineOf[i] ?? 0) * DURATION.lineStagger,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      // Whatever the tween was mid-way through, leave the words readable.
      gsap.set(inners, { clearProps: "transform" });
    };
  }, [children, delay, slow]);

  const words = children.trim().split(/\s+/);

  return (
    <Tag
      ref={(node) => {
        ref.current = node;
      }}
      className={className}
    >
      {words.map((word, i) => (
        <Fragment key={`${i}-${word}`}>
          {/*
           * `overflow-hidden` is the mask. The padding/negative-margin pair gives
           * descenders (g, y, p) room to exist inside it — without them the mask
           * crops the tails off the type at rest, which is a permanent bug rather
           * than an animation one.
           */}
          <span data-word className="inline-block overflow-hidden align-top pb-[0.16em] -mb-[0.16em]">
            <span data-line-inner className="inline-block">
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
