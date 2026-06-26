"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";

function FloatingChip({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
      }}
      className={`absolute hidden rounded-xl border border-white/10 bg-[#0a0618]/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg shadow-violet-500/10 backdrop-blur-md lg:block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const demoCreditsRemaining = Math.max(1, FREE_PLAN_CREDITS - 2);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-24 -right-20 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 -left-16 h-[320px] w-[320px] rounded-full bg-fuchsia-600/15 blur-[90px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            AI creative platform for modern growth teams
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Create high-converting ads{" "}
            <span className="gradient-text">in seconds</span>, not weeks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl"
          >
            Advora AI turns your product into scroll-stopping hooks, captions,
            UGC scripts and CTAs — optimized for every major ad platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:opacity-90 sm:w-auto"
            >
              Start generating free
              <svg
                className="h-4 w-4 transition group-hover:translate-x-0.5"
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
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-medium text-zinc-200 backdrop-blur-sm transition hover:bg-white/[0.08] sm:w-auto"
            >
              See how it works
            </a>
          </motion.div>

          <p className="mt-5 text-sm text-zinc-500">
            {FREE_PLAN_CREDITS} free credits · No credit card required
          </p>
        </div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto mt-14 max-w-5xl sm:mt-20"
        >
          <FloatingChip className="-left-2 top-8" delay={0}>
            ✨ 5 hooks generated
          </FloatingChip>
          <FloatingChip className="-right-2 top-16" delay={0.5}>
            📈 4.8% avg CTR
          </FloatingChip>
          <FloatingChip className="bottom-12 -left-4" delay={1}>
            💳 {demoCreditsRemaining} credits left
          </FloatingChip>
          <FloatingChip className="right-0 bottom-20" delay={1.5}>
            ⚡ Generated in 28s
          </FloatingChip>

          <div className="gradient-border animate-float overflow-hidden rounded-2xl shadow-2xl shadow-violet-500/15">
            <div className="glass p-1">
              <div className="overflow-hidden rounded-xl bg-[#0a0618]">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-4 text-xs text-zinc-500">
                    app.advora.ai/dashboard
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 lg:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      Welcome back
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Your creative command center
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: "Plan", value: "Free" },
                        { label: "Credits", value: String(FREE_PLAN_CREDITS) },
                        { label: "This month", value: "12" },
                        { label: "Success", value: "100%" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
                        >
                          <p className="text-[10px] text-zinc-500">{stat.label}</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                      Latest output
                    </p>
                    <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-4">
                      <p className="text-sm font-medium text-white">
                        &ldquo;Hear every beat. Miss nothing.&rdquo;
                      </p>
                      <p className="mt-2 text-xs text-zinc-400">
                        5 hooks · 3 captions · UGC script
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                          Meta ready
                        </span>
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50 sm:mt-16">
          {["DTC Brands", "Agencies", "SaaS", "Creators", "E-commerce"].map(
            (brand) => (
              <span
                key={brand}
                className="text-xs font-medium tracking-widest text-zinc-500 uppercase sm:text-sm"
              >
                {brand}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
