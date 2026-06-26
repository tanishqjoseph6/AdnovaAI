"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "We replaced our first-draft copywriter workflow with Advora. Campaigns that took days now ship in an afternoon.",
    name: "Priya Sharma",
    role: "Growth Lead, DTC Brand",
    initials: "PS",
  },
  {
    quote:
      "The hooks and UGC scripts are scary good. Our Meta CTR jumped 34% on the first test batch.",
    name: "Marcus Chen",
    role: "Performance Marketer",
    initials: "MC",
  },
  {
    quote:
      "Finally an AI tool that outputs ad-ready copy, not generic fluff. Our agency clients love the speed.",
    name: "Elena Rodriguez",
    role: "Founder, Creative Studio",
    initials: "ER",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Social proof
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Loved by <span className="gradient-text">modern marketers</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.blockquote
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="glass flex h-full flex-col rounded-2xl border border-white/[0.08] p-6 transition hover:border-white/[0.14] hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="flex gap-1 text-amber-400" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
                  {item.initials}
                </div>
                <div>
                  <cite className="not-italic text-sm font-medium text-white">
                    {item.name}
                  </cite>
                  <p className="text-xs text-zinc-500">{item.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
