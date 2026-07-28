"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Layers3,
  MousePointer2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";
import { blurReveal } from "@/lib/landing/motion";

export default function Hero() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const smoothX = useSpring(cursorX, { stiffness: 80, damping: 24 });
  const smoothY = useSpring(cursorY, { stiffness: 80, damping: 24 });
  const glowX = useTransform(smoothX, [-1, 1], ["38%", "62%"]);
  const glowY = useTransform(smoothY, [-1, 1], ["35%", "65%"]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    cursorX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    cursorY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  return (
    <section
      className="hero-shell relative overflow-hidden pt-32 pb-16 md:pt-44 md:pb-28"
      onPointerMove={handlePointerMove}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(700px circle at ${glowX} ${glowY}, rgba(34,211,238,.12), transparent 62%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="aurora aurora-cyan pointer-events-none absolute -top-48 left-1/2 h-[720px] w-[920px] -translate-x-1/2" />
      <div className="aurora aurora-violet pointer-events-none absolute top-56 -right-48 h-[520px] w-[520px]" />
      <div className="aurora aurora-pink pointer-events-none absolute bottom-0 -left-48 h-[440px] w-[440px]" />
      <div className="particle-field pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            variants={blurReveal}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-white/[0.055] px-4 py-2 text-xs font-medium text-zinc-300 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden />
            The marketing operating system for ambitious teams
          </motion.div>

          <motion.h1
            variants={blurReveal}
            initial="hidden"
            animate="visible"
            custom={0.06}
            className="text-[clamp(3rem,7.5vw,7rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-white"
            style={{ filter: "blur(0px)" }}
          >
            Marketing.
            <br />
            <span className="gradient-text">Simplified.</span>
            <br />
            <span className="text-[0.72em] font-medium tracking-[-0.04em] text-white/80">
              Powered by Advora.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl"
          >
            The AI Marketing Operating System that helps brands research
            competitors, generate content, create campaigns, publish across
            platforms, and grow faster — all from one workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.68, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="magnetic-button group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-[#070510] shadow-[0_0_40px_rgba(125,211,252,.2)] transition hover:shadow-[0_0_55px_rgba(167,139,250,.4)] sm:w-auto"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="mailto:hello@useadvora.com?subject=Advora%20demo"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.045] px-7 py-3.5 text-sm font-medium text-zinc-200 backdrop-blur-sm transition hover:border-cyan-300/30 hover:bg-white/[0.09] sm:w-auto"
            >
              Book a Demo
            </a>
          </motion.div>

          <p className="mt-5 text-xs text-zinc-500">
            {FREE_PLAN_CREDITS} free credits · No credit card required · Set up in minutes
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.9,
            delay: 0.75,
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="dashboard-window glass rounded-[1.5rem] border-white/15 p-2 shadow-[0_30px_120px_rgba(44,25,120,.45)] sm:p-3">
            <div className="rounded-[1rem] border border-white/10 bg-[#0c0a19]/95 p-3 sm:p-5">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
                  <span className="ml-3 text-[10px] uppercase tracking-[0.2em] text-white/35">
                    Campaign workspace
                  </span>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] text-cyan-200">
                  Live
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[0.8fr_1.5fr_1fr]">
                <div className="space-y-2">
                  {["Overview", "Campaigns", "Research", "Content", "Analytics"].map(
                    (label, i) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] ${
                          i === 1
                            ? "bg-violet-500/15 text-white"
                            : "text-white/40"
                        }`}
                      >
                        <Layers3 className="h-3.5 w-3.5" /> {label}
                      </div>
                    )
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/35">
                        Campaign performance
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        +38.6%
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="mt-7 flex h-24 items-end gap-2">
                    {[28, 42, 35, 58, 48, 76, 68, 91, 84].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-violet-500/30 to-cyan-300/90"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-4 text-left">
                    <Wand2 className="h-4 w-4 text-cyan-300" />
                    <p className="mt-3 text-xs font-medium text-white">
                      Creative engine
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                      12 new concepts ready for review.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left">
                    <CalendarDays className="h-4 w-4 text-violet-300" />
                    <p className="mt-3 text-xs font-medium text-white">Next publish</p>
                    <p className="mt-1 text-[11px] text-white/45">
                      Today · 4 platforms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="glass absolute -left-3 bottom-10 hidden items-center gap-2 rounded-xl border-white/15 px-3 py-2 text-xs text-white/70 shadow-xl sm:flex"
          >
            <MousePointer2 className="h-3.5 w-3.5 text-cyan-300" /> One workspace.
            Infinite momentum.
          </motion.div>
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, delay: 0.7 }}
            className="glass absolute -right-3 top-12 hidden items-center gap-2 rounded-xl border-white/15 px-3 py-2 text-xs text-white/70 shadow-xl sm:flex"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Results are
            compounding.
          </motion.div>
        </motion.div>

        <motion.a
          href="#features"
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mt-14 flex w-fit flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/35"
        >
          Scroll to explore <ChevronDown className="h-4 w-4" />
        </motion.a>
      </div>
    </section>
  );
}
