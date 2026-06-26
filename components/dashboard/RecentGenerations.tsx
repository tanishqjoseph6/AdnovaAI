"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import GenerationDate from "@/components/history/GenerationDate";
import type { GenerationRecord } from "@/lib/history/types";
import { getGenerationStatus } from "@/lib/history/utils";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";

type RecentGenerationsProps = {
  generations: GenerationRecord[];
  metrics: DashboardMetrics;
};

function StatusBadge({ status }: { status: "Completed" | "Failed" }) {
  const styles =
    status === "Completed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default function RecentGenerations({
  generations,
  metrics,
}: RecentGenerationsProps) {
  const creditsLabel = metrics.unlimited ? "0" : "1";

  return (
    <section className="glass overflow-hidden rounded-2xl border border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            Activity
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Recent generations
          </h2>
        </div>
        <Link
          href="/dashboard/history"
          className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          View all →
        </Link>
      </div>

      <ul className="divide-y divide-white/[0.04]">
        {generations.map((generation, index) => {
          const status = getGenerationStatus(generation);

          return (
            <motion.li
              key={generation.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {generation.product_description}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  <GenerationDate iso={generation.created_at} />
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-sm text-zinc-400">
                  {creditsLabel} credit{creditsLabel === "1" ? "" : "s"}
                </span>
                <StatusBadge status={status} />
                <Link
                  href="/dashboard/history"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Quick view
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </Link>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
