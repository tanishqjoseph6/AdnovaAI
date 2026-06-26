"use client";

import { motion } from "framer-motion";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";

type UsageCardProps = {
  metrics: DashboardMetrics;
};

export default function UsageCard({ metrics }: UsageCardProps) {
  const max = metrics.creditsMax ?? (metrics.adsThisMonth || 1);
  const used = metrics.unlimited
    ? metrics.adsThisMonth
    : metrics.creditsUsed;
  const displayMax = metrics.unlimited ? "∞" : String(max);
  const progress = metrics.unlimited
    ? Math.min((metrics.adsThisMonth / 100) * 100, 100)
    : max > 0
      ? Math.round((used / max) * 100)
      : 0;

  const usageLabel = metrics.unlimited
    ? `${metrics.adsThisMonth} generations this month`
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
          {!metrics.unlimited && (
            <span className="text-sm text-zinc-500">{displayMax} limit</span>
          )}
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
            aria-valuemax={metrics.unlimited ? 100 : max}
            aria-label="Monthly credit usage"
          />
        </div>

        <p className="mt-3 text-sm text-zinc-500">
          {metrics.unlimited
            ? "Pro plan includes unlimited AI generations."
            : "Each successful generation uses 1 credit from your monthly allowance."}
        </p>
      </div>
    </section>
  );
}
