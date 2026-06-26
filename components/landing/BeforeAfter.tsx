"use client";

import { motion } from "framer-motion";

export default function BeforeAfter() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">
            Before & After
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            See the <span className="gradient-text">Advora difference</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Same product. Completely different creative quality.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl border border-white/[0.08] p-6 sm:p-7"
          >
            <span className="inline-flex rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-0.5 text-xs font-medium text-zinc-400">
              Before
            </span>
            <h3 className="mt-4 text-lg font-semibold text-zinc-300">
              Generic manual copy
            </h3>
            <div className="mt-4 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-sm text-zinc-500">
                Buy our wireless earbuds today. Great sound quality and good
                battery life. Order now.
              </p>
              <p className="text-sm text-zinc-500">
                Premium audio device for music lovers. Limited time offer.
              </p>
              <p className="text-xs text-zinc-600">
                No hooks · No UGC script · No platform variants
              </p>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="gradient-border rounded-2xl bg-[#0a0618] p-6 shadow-xl shadow-violet-500/15 sm:p-7"
          >
            <span className="inline-flex rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-3 py-0.5 text-xs font-semibold text-white">
              After — Advora AI
            </span>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Scroll-stopping ad kit
            </h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                  Hook
                </p>
                <p className="mt-1 text-sm text-white">
                  &ldquo;Your gym playlist deserves better than tinny gym
                  speakers.&rdquo;
                </p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  Caption
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  40hr battery. Studio clarity. Zero compromise — try free for
                  14 days.
                </p>
              </div>
              <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                  UGC Script
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  &ldquo;Okay so I&apos;ve been using these for two weeks and I
                  literally forgot my old earbuds existed…&rdquo;
                </p>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
