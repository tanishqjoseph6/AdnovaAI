"use client";

import { motion } from "framer-motion";

const COMPARISON_ROWS = [
  {
    label: "Turnaround time",
    agency: "2–4 weeks per campaign",
    advora: "Under 30 seconds",
  },
  {
    label: "Cost per campaign",
    agency: "₹50,000+ minimum",
    advora: "Start free, scale as you grow",
  },
  {
    label: "Revisions",
    agency: "Limited rounds, extra fees",
    advora: "Regenerate with your monthly credits",
  },
  {
    label: "Output formats",
    agency: "Manual copy decks",
    advora: "Hooks, captions, CTAs & UGC",
  },
  {
    label: "Scaling creative",
    agency: "Hire more people",
    advora: "Generate at AI speed",
  },
  {
    label: "Performance data",
    agency: "Post-campaign reports",
    advora: "Instant iteration loop",
  },
];

export default function WhyAdvora() {
  return (
    <section id="why-advora" className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Why Advora
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Traditional agency vs{" "}
            <span className="gradient-text">Advora AI</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Stop waiting weeks and paying retainers. Ship premium ad creative at
            the speed of your growth.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="glass mt-12 overflow-hidden rounded-2xl border border-white/[0.08]"
        >
          <div className="grid grid-cols-3 border-b border-white/[0.06] bg-white/[0.02] text-center text-sm font-semibold">
            <div className="px-4 py-4 text-zinc-500 sm:px-6">Compare</div>
            <div className="border-x border-white/[0.06] px-4 py-4 text-zinc-400 sm:px-6">
              Traditional Agency
            </div>
            <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 px-4 py-4 text-white sm:px-6">
              Advora AI
            </div>
          </div>

          {COMPARISON_ROWS.map((row, index) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 border-b border-white/[0.04] text-sm last:border-b-0 ${
                index % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              }`}
            >
              <div className="flex items-center px-4 py-4 font-medium text-zinc-400 sm:px-6">
                {row.label}
              </div>
              <div className="flex items-center border-x border-white/[0.04] px-4 py-4 text-zinc-500 sm:px-6">
                {row.agency}
              </div>
              <div className="flex items-center bg-violet-500/[0.04] px-4 py-4 font-medium text-zinc-200 sm:px-6">
                <svg
                  className="mr-2 h-4 w-4 shrink-0 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {row.advora}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
