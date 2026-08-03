import { STICKY_SCREENS_MAX } from "@/lib/motion";

/**
 * Pins a scene to the viewport while the page scrolls past it, giving its
 * contents room to advance.
 *
 * Deliberately plain CSS `position: sticky` rather than GSAP's ScrollTrigger
 * pin, which clones the element into a pin-spacer — a well-known source of
 * layout shift, and one more thing to get wrong in a page whose whole brief is
 * that it must not feel broken.
 *
 * **This is the one construct left on the page that can set a section's height
 * from a number instead of from its content**, which is exactly what made the
 * previous build sparse enough to be rejected. So `screens` is clamped to
 * `STICKY_SCREENS_MAX`, and under reduced motion the pin and the reserved scroll
 * both disappear rather than leaving a visitor to travel through empty screens
 * with nothing moving in them. Use it where the content genuinely advances; a
 * pinned scene that just sits there is a paid-for empty screen.
 */
export function StickyScene({
  children,
  screens = 2,
  className,
}: {
  children: React.ReactNode;
  /** Screens of scroll the scene occupies, including its own. Clamped to 1–3. */
  screens?: number;
  className?: string;
}) {
  const clamped = Math.min(Math.max(screens, 1), STICKY_SCREENS_MAX);

  return (
    <div
      className={`sticky-scene ${className ?? ""}`}
      style={{ "--sticky-screens": clamped } as React.CSSProperties}
    >
      <div className="sticky-scene-inner">{children}</div>
    </div>
  );
}
