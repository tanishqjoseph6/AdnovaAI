"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type UpgradeCardProps = {
  show: boolean;
};

export default function UpgradeCard({ show }: UpgradeCardProps) {
  if (!show) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/25 via-[#0a0618] to-cyan-600/15 p-6 shadow-xl shadow-violet-500/15 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-0 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300/90">
            Go Pro
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Unlock unlimited AI ad generation
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Scale your creative output with unlimited generations, priority
            support, and advanced AI features.
          </p>
        </div>

        <Link
          href="/dashboard/billing"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:opacity-90"
        >
          Upgrade to Pro
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </motion.section>
  );
}
