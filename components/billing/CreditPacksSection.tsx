"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Zap } from "lucide-react";
import {
  CREDIT_PACK_BASELINE_PER_CREDIT_USD,
  CREDIT_PACK_OPTIONS,
  DEFAULT_CREDIT_PACK_CREDITS,
  formatPackPriceUsd,
  formatPerCreditUsd,
  type CreditPackBadge,
} from "@/lib/credits/purchase";

const BADGE_COPY: Record<CreditPackBadge, string> = {
  popular: "Popular",
  "best-value": "Best value",
};

function PackBadge({
  badge,
  savingsPercent,
}: {
  badge?: CreditPackBadge;
  savingsPercent: number | null;
}) {
  if (!badge && savingsPercent === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badge ? (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            badge === "best-value"
              ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white"
              : "border border-violet-400/30 bg-violet-500/15 text-violet-200"
          }`}
        >
          {BADGE_COPY[badge]}
        </span>
      ) : null}
      {savingsPercent !== null ? (
        <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          Save {savingsPercent}%
        </span>
      ) : null}
    </div>
  );
}

function formatCreditsCount(credits: number): string {
  return credits.toLocaleString("en-US");
}

export default function CreditPacksSection() {
  const [selectedCredits, setSelectedCredits] = useState(
    DEFAULT_CREDIT_PACK_CREDITS
  );

  const selectedPack = useMemo(
    () =>
      CREDIT_PACK_OPTIONS.find((pack) => pack.credits === selectedCredits) ??
      CREDIT_PACK_OPTIONS[0],
    [selectedCredits]
  );

  return (
    <motion.section
      id="credit-packs"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="relative scroll-mt-24"
      aria-label="Buy extra credits"
    >
      <div className="mb-6 flex items-start gap-3 sm:mb-7">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300 shadow-lg shadow-violet-500/20">
          <Zap className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Buy Extra Credits
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Top up anytime without changing your plan. Purchased credits never
            expire and are used after your monthly allowance runs out.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-[1px] shadow-2xl shadow-violet-500/10">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] border border-white/[0.08] bg-[#07031a]/90 p-6 backdrop-blur-xl sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />

          <div className="relative mx-auto max-w-2xl space-y-6">
            <div>
              <label
                htmlFor="credit-pack-select"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
              >
                Select a pack
              </label>
              <div className="relative mt-2">
                <select
                  id="credit-pack-select"
                  value={selectedCredits}
                  onChange={(event) =>
                    setSelectedCredits(Number(event.target.value))
                  }
                  className="w-full appearance-none rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3.5 pr-11 text-sm font-medium text-white shadow-inner shadow-black/20 transition focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  {CREDIT_PACK_OPTIONS.map((pack) => (
                    <option
                      key={pack.credits}
                      value={pack.credits}
                      className="bg-[#0a0618] text-white"
                    >
                      {pack.label} — {formatPackPriceUsd(pack.priceUsd)}
                      {pack.savingsPercent !== null
                        ? ` · Save ${pack.savingsPercent}%`
                        : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPack.credits}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <PackBadge
                  badge={selectedPack.badge}
                  savingsPercent={selectedPack.savingsPercent}
                />

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      {formatCreditsCount(selectedPack.credits)}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      AI credits
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-semibold tracking-tight text-white">
                      {formatPackPriceUsd(selectedPack.priceUsd)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatPerCreditUsd(selectedPack.perCreditUsd)} per credit
                    </p>
                  </div>
                </div>

                {selectedPack.savingsPercent !== null ? (
                  <p className="mt-4 text-sm text-emerald-300/90">
                    You save{" "}
                    {formatPackPriceUsd(
                      Math.round(
                        selectedPack.credits *
                          CREDIT_PACK_BASELINE_PER_CREDIT_USD -
                          selectedPack.priceUsd
                      )
                    )}{" "}
                    compared to the 100-credit pack rate.
                  </p>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <ul className="space-y-2.5 text-sm text-zinc-300">
              {[
                "Never expires — use credits whenever you need them",
                "Consumed automatically after monthly credits run out",
                "Works with any plan — Free, Starter, or Pro",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400/70 via-violet-500/70 to-fuchsia-500/70 px-4 py-3.5 text-sm font-semibold text-white/90 opacity-80"
              aria-disabled="true"
            >
              Purchase credits
            </button>

            <p className="text-center text-xs text-zinc-500">
              Checkout coming soon — select a pack to preview pricing.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
