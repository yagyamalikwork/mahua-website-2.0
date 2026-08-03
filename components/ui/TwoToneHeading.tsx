import { SplitLines } from "@/components/motion/SplitLines";
import type { TwoTone } from "@/content/home";

/**
 * The reference site's signature headline, in the one size and weight the page
 * uses for chapter titles: display serif, light, tight leading, one word dropped
 * to a lighter tone.
 *
 * It exists so seven sections do not each carry their own copy of the same four
 * class strings — the version of this page where they do is the version where one
 * chapter heading is 2px off and nobody can say why.
 *
 * `onPhoto` swaps both tones for cream: over a photograph `--dim` is unreadable
 * (it is a dark warm grey chosen against cream paper, not against a scrim), so
 * the dimmed run drops to `--surface` instead, which stays comfortably above 3:1
 * on the scrims this page uses. Measured, not assumed — see the Task 7 report.
 */
export function TwoToneHeading({
  heading,
  as = "h2",
  align = "left",
  size = "chapter",
  onPhoto = false,
  className,
}: {
  heading: TwoTone;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "centre";
  /** `chapter` titles a section; `close` is the larger one over the final photograph. */
  size?: "chapter" | "close";
  onPhoto?: boolean;
  className?: string;
}) {
  const scale =
    size === "close"
      ? "text-[clamp(2.4rem,5vw,4.4rem)] short:text-[clamp(1.9rem,4vw,3rem)]"
      : "text-[clamp(2rem,4.2vw,3.5rem)]";

  return (
    <SplitLines
      as={as}
      dim={heading.dim}
      dimColour={onPhoto ? "var(--surface)" : "var(--dim)"}
      className={[
        "font-[family-name:var(--font-display)] font-light leading-[1.04] tracking-[-0.01em]",
        scale,
        align === "centre" ? "text-center" : "text-left",
        onPhoto ? "text-[color:var(--bg)]" : "text-[color:var(--text)]",
        className ?? "",
      ].join(" ")}
    >
      {heading.text}
    </SplitLines>
  );
}
