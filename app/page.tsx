import Link from "next/link";
import { HOME } from "@/content/home";

export const metadata = { title: "Mahua Resorts — early build" };

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-[8vw] text-center">
      <h1
        className="max-w-[20ch] font-[family-name:var(--font-display)] text-[clamp(2rem,6vw,4rem)] font-light leading-[1.1]"
        style={{ color: "var(--text)" }}
      >
        {HOME.placeholder.heading}
      </h1>

      <p className="mt-6 max-w-[46ch] text-lg leading-relaxed" style={{ color: "var(--text)" }}>
        {HOME.placeholder.body}
      </p>

      <Link
        href="/preview/light-states"
        className="mt-8 inline-block font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.24em] underline underline-offset-8"
        style={{ color: "var(--accent-text)" }}
      >
        {HOME.placeholder.cta}
      </Link>
    </main>
  );
}
