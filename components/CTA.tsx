import Link from "next/link";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";

export default function CTA() {
  return (
    <section id="cta" className="relative py-20 md:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-violet-600/40 to-fuchsia-600/30" />
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/25 blur-3xl" />

          <div className="relative px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
              Start generating AI ads{" "}
              <span className="gradient-text">for free</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
              Join thousands of marketers shipping scroll-stopping creative with
              Advora AI. {FREE_PLAN_CREDITS} free credits to get started — no card required.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#030014] shadow-xl transition hover:bg-zinc-100 sm:w-auto"
              >
                Get started free
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:w-auto"
              >
                Log in
              </Link>
            </div>

            <p className="mt-5 text-sm text-zinc-400">
              Setup in under 2 minutes · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
