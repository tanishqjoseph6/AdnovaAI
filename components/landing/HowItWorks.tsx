"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Describe your product",
    description:
      "Paste your product URL or write a short brief. Advora understands your offer, audience and positioning.",
    icon: "📝",
  },
  {
    step: "02",
    title: "AI generates your ad kit",
    description:
      "Get hooks, captions, CTAs and a UGC script in one run — tuned for scroll-stopping performance.",
    icon: "✨",
  },
  {
    step: "03",
    title: "Copy, refine & launch",
    description:
      "Copy what you need, regenerate variations, and ship to Meta, Google, TikTok and more.",
    icon: "🚀",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Three steps to{" "}
            <span className="gradient-text">launch-ready ads</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            From product description to full ad creative kit in under a minute.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((item, index) => (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass group relative rounded-2xl border border-white/[0.08] p-6 transition hover:border-white/[0.14] hover:shadow-lg hover:shadow-violet-500/10 sm:p-7"
            >
              {index < STEPS.length - 1 && (
                <div className="pointer-events-none absolute top-1/2 -right-3 hidden h-px w-6 bg-gradient-to-r from-violet-500/50 to-transparent md:block" />
              )}
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden>
                  {item.icon}
                </span>
                <span className="text-xs font-semibold tracking-widest text-violet-400/80">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
