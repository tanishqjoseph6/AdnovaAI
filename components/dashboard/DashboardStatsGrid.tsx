"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import { useCredits } from "@/hooks/useCredits";
import { resolveCreditsMax } from "@/lib/credits/display";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";

type DashboardStatsGridProps = {
  metrics: DashboardMetrics;
};

type StatItem = {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent: "cyan" | "violet" | "fuchsia" | "emerald" | "amber";
  icon: React.ReactNode;
};

const accentMap = {
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
  fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
};

export default function DashboardStatsGrid({
  metrics,
}: DashboardStatsGridProps) {
  const { credits, isLoading } = useCredits();
  const maxCredits = resolveCreditsMax(credits?.maxCredits, credits?.credits);

  const stats: StatItem[] = [
    {
      label: "Credits remaining",
      value:
        isLoading && !credits ? (
          "—"
        ) : credits?.unlimited ? (
          "∞"
        ) : (
          <AnimatedCounter value={credits?.credits ?? 0} />
        ),
      sub: credits?.unlimited ? "Pro unlimited" : `of ${maxCredits} max`,
      accent: "emerald",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Current plan",
      value: credits?.displayPlan ?? metrics.planName,
      accent: "violet",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
    },
    {
      label: "Total ads generated",
      value: <AnimatedCounter value={metrics.totalAds} />,
      sub: `${metrics.adsThisMonth} this month`,
      accent: "cyan",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: "Success rate",
      value: (
        <AnimatedCounter
          value={metrics.totalAds > 0 ? metrics.successRate : 0}
          suffix="%"
        />
      ),
      sub: metrics.totalAds > 0 ? "Completed generations" : "No data yet",
      accent: "fuchsia",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Avg. generation time",
      value: metrics.totalAds > 0 ? "~30s" : "—",
      sub: "Typical response time",
      accent: "amber",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
  ];

  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/90">
        Overview
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        Your creative stats
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <motion.article
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="glass group rounded-2xl border border-white/[0.08] p-5 transition hover:border-white/[0.12] hover:shadow-lg hover:shadow-violet-500/5"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[stat.accent]}`}
            >
              {stat.icon}
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            {stat.sub && (
              <p className="mt-0.5 text-xs text-zinc-600">{stat.sub}</p>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
