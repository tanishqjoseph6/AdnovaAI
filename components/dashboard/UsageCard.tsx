"use client";

import { motion } from "framer-motion";
import { useCredits } from "@/hooks/useCredits";
import {
  creditsProgressPercent,
  resolveCreditsMax,
} from "@/lib/credits/display";

export default function UsageCard() {
  const { credits, isLoading } = useCredits();

  const max = resolveCreditsMax(credits?.maxCredits, credits?.credits);
  const remaining = credits?.credits ?? 0;
  const used = Math.max(0, max - remaining);
  const progress = creditsProgressPercent(remaining, credits?.maxCredits);

  const usageLabel =
    isLoading && !credits
      ? "Loading credits..."
      : `${used} / ${max} Credits Used`;

  return (
    <section className="glass relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-violet-600/[0.06]" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Usage
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">Monthly usage</h2>

        <div className="mt-6 flex items-end justify-between gap-3">
          <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {usageLabel}
          </p>
          <span className="text-sm text-zinc-500">{max} limit</span>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label="Monthly credit usage"
          />
        </div>

        <p className="mt-3 text-sm text-zinc-500">
          Each successful generation uses 1 credit from your monthly allowance.
        </p>
      </div>
    </section>
  );
}
