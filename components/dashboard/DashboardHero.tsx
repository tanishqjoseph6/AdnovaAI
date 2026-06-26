"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  formatGenerationDate,
  formatGenerationDateLocal,
} from "@/lib/history/utils";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";

type DashboardHeroProps = {
  userName: string;
  metrics: DashboardMetrics;
};

function HeroMetric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: "cyan" | "violet" | "fuchsia" | "emerald";
}) {
  const accents = {
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
    fuchsia: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>
        <p className="mt-1 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function LastGenerationTime({ iso }: { iso: string | null }) {
  const [display, setDisplay] = useState(() =>
    iso ? formatGenerationDate(iso) : "—"
  );

  useEffect(() => {
    if (iso) {
      setDisplay(formatGenerationDateLocal(iso));
    }
  }, [iso]);

  if (!iso) {
    return <span className="text-zinc-500">No generations yet</span>;
  }

  return <time dateTime={iso}>{display}</time>;
}

export default function DashboardHero({
  userName,
  metrics,
}: DashboardHeroProps) {
  const creditsDisplay = metrics.unlimited
    ? "Unlimited"
    : String(metrics.creditsRemaining ?? 0);

  return (
    <section className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Welcome back, {userName} 👋
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Create high-converting AI ads, track your credits and manage your
          creative workflow.
        </p>
      </motion.div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="glass relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/[0.08] via-transparent to-cyan-500/[0.06]" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HeroMetric
            accent="violet"
            label="Current plan"
            value={metrics.planName}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
          />
          <HeroMetric
            accent="cyan"
            label="Remaining credits"
            value={creditsDisplay}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <HeroMetric
            accent="fuchsia"
            label="Ads generated this month"
            value={metrics.adsThisMonth}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            }
          />
          <HeroMetric
            accent="emerald"
            label="Last generation time"
            value={<LastGenerationTime iso={metrics.lastGenerationIso} />}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
        </div>
      </motion.article>
    </section>
  );
}
