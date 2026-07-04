"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
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
            <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden />
            The complete AI creative platform for growth teams
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Ship scroll-stopping ads{" "}
            <span className="gradient-text">in seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl"
          >
            Generate hooks, captions, and UGC scripts. Analyze competitors and
            landing pages. Schedule social posts. All powered by AI — built for
            marketers who move fast.
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
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-medium text-zinc-200 backdrop-blur-sm transition hover:bg-white/[0.08] sm:w-auto"
            >
              Explore every feature
            </a>
          </motion.div>

          <p className="mt-5 text-sm text-zinc-500">
            {FREE_PLAN_CREDITS} free credits · No credit card required
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 flex max-w-md items-center justify-center gap-4"
        >
          <div className="glass flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-3">
            <Image
              src="/icon.png"
              alt="Advora AI"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Advora AI</p>
              <p className="text-xs text-zinc-500">12 tools · 1 workspace</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
