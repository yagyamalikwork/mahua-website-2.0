import { DaySurface } from "@/components/motion/DaySurface";
import { Grain } from "@/components/motion/Grain";
import { Reveal } from "@/components/motion/Reveal";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { contrastRatio } from "@/lib/contrast";
import { LIGHT_STATES } from "@/lib/palette";
import { HOME } from "@/content/home";

export const metadata = { title: "Light states — Mahua Resorts" };

export default function LightStatesPreview() {
  return (
    <SmoothScroll>
      <DaySurface />
      <Grain />
      <main>
        {LIGHT_STATES.map((state, i) => (
          <section
            key={state.id}
            className="flex min-h-screen flex-col justify-center px-[8vw] py-24"
          >
            <Reveal>
              <p
                className="font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.28em]"
                style={{ color: "var(--accent-text)" }}
              >
                {String(i + 1).padStart(2, "0")} · {state.label}
              </p>

              <h2 className="mt-6 max-w-[16ch] font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,6rem)] font-light leading-[1.05]">
                {i === 0 ? HOME.hero.headline : state.label}
              </h2>

              <p className="mt-8 max-w-[46ch] text-lg leading-relaxed opacity-90">
                {i === 0
                  ? HOME.hero.sub
                  : "Body text at this light state. Check that it reads comfortably, that the " +
                    "background feels warm rather than cold, and that the change from the state " +
                    "above arrived without you noticing a boundary."}
              </p>

              <a
                href="#"
                className="mt-8 inline-block font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.24em] underline underline-offset-8"
                style={{ color: "var(--accent-text)" }}
              >
                A link at this state
              </a>

              <dl className="mt-16 grid max-w-lg grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs opacity-70">
                <dt>background</dt><dd>{state.bg}</dd>
                <dt>text</dt><dd>{state.text}</dd>
                <dt>text contrast</dt>
                <dd>{contrastRatio(state.text, state.bg).toFixed(2)}:1</dd>
                <dt>link contrast</dt>
                <dd>{contrastRatio(state.accentText, state.bg).toFixed(2)}:1</dd>
                <dt>accent (decorative only)</dt><dd>{state.accent}</dd>
              </dl>
            </Reveal>
          </section>
        ))}
      </main>
    </SmoothScroll>
  );
}
