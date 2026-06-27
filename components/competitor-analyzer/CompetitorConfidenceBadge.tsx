"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ANALYSIS_CONFIDENCE_MEDIUM } from "@/lib/competitor-ad/scores";
import {
  capitalizeConfidenceLevel,
  type AnalysisConfidence,
} from "@/lib/competitor-ad/types";

export default function CompetitorConfidenceBadge({
  confidence,
}: {
  confidence: AnalysisConfidence;
}) {
  const { level, percent } = confidence;
  const label = capitalizeConfidenceLevel(level);

  const config = {
    high: {
      dot: "🟢",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      bar: "bg-emerald-400",
    },
    medium: {
      dot: "🟡",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
      bar: "bg-amber-400",
    },
    low: {
      dot: "🔴",
      badge: "border-red-500/30 bg-red-500/10 text-red-200",
      bar: "bg-red-400",
    },
  }[level];

  return (
    <div className="glass rounded-2xl border border-white/[0.08] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {config.dot}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${config.badge}`}
          >
            {label} Confidence
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Detection Confidence:{" "}
          <span className="font-semibold text-white">{percent}%</span>
        </p>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${config.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {percent < ANALYSIS_CONFIDENCE_MEDIUM && (
        <p className="mt-3 text-sm text-amber-200/90">
          This analysis may be less accurate because the screenshot quality or
          advertisement visibility is limited.
        </p>
      )}
    </div>
  );
}

export function CompetitorExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-4 w-4 shrink-0 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
