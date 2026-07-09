"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap } from "lucide-react";
import {
  CREDIT_PACK_BADGE_LABELS,
  CREDIT_PACK_BASELINE_PER_CREDIT_USD,
  CREDIT_PACK_OPTIONS,
  DEFAULT_CREDIT_PACK_CREDITS,
  formatPackPriceUsd,
  formatPerCreditUsd,
  type CreditPackBadge,
  type CreditPackOption,
} from "@/lib/credits/purchase";

const BADGE_STYLES: Record<CreditPackBadge, string> = {
  popular: "border border-violet-400/35 bg-violet-500/15 text-violet-200",
  "best-value":
    "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white border-0",
  "maximum-savings":
    "border border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
};

function PackBadges({ pack }: { pack: CreditPackOption }) {
  const showSave =
    pack.savingsPercent !== null && pack.badge !== "maximum-savings";

  if (!pack.badge && pack.savingsPercent === null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pack.badge ? (
        <motion.span
          key={pack.badge}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${BADGE_STYLES[pack.badge]}`}
        >
          {CREDIT_PACK_BADGE_LABELS[pack.badge]}
        </motion.span>
      ) : null}
      {showSave ? (
        <motion.span
          key={`save-${pack.savingsPercent}`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300"
        >
          Save {pack.savingsPercent}%
        </motion.span>
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

  const absoluteSavings = useMemo(() => {
    if (selectedPack.savingsPercent === null) return null;
    return Math.round(
      selectedPack.credits * CREDIT_PACK_BASELINE_PER_CREDIT_USD -
        selectedPack.priceUsd
    );
  }, [selectedPack]);

  return (
    <motion.section
      id="credit-packs"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="relative scroll-mt-24"
      aria-label="Buy extra credits"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent p-px shadow-xl shadow-violet-500/10">
        <div className="relative overflow-hidden rounded-[calc(1rem-1px)] border border-white/[0.06] bg-[#07031a]/95 px-5 py-5 backdrop-blur-xl sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-fuchsia-500/12 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />

          <div className="relative space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.08] text-cyan-300">
                <Zap className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                  Buy Extra Credits
                </h2>
                <p className="text-xs leading-snug text-zinc-500">
                  Top up anytime · Never expires · Used after monthly credits
                </p>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="credit-pack-select" className="sr-only">
                Select a credit pack
              </label>
              <select
                id="credit-pack-select"
                value={selectedCredits}
                onChange={(event) =>
                  setSelectedCredits(Number(event.target.value))
                }
                className="w-full appearance-none rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 pr-10 text-sm font-medium text-white transition focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {CREDIT_PACK_OPTIONS.map((pack) => (
                  <option
                    key={pack.credits}
                    value={pack.credits}
                    className="bg-[#0a0618] text-white"
                  >
                    {pack.label} — {formatPackPriceUsd(pack.priceUsd)}
                    {pack.badge
                      ? ` · ${CREDIT_PACK_BADGE_LABELS[pack.badge]}`
                      : pack.savingsPercent !== null
                        ? ` · Save ${pack.savingsPercent}%`
                        : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedPack.credits}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="px-4 py-3.5 sm:px-5 sm:py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <PackBadges pack={selectedPack} />
                      <div className="flex items-baseline gap-2">
                        <motion.p
                          layout
                          className="text-3xl font-bold tracking-tight text-white sm:text-[2rem]"
                        >
                          {formatCreditsCount(selectedPack.credits)}
                        </motion.p>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          credits
                        </span>
                      </div>
                      {absoluteSavings !== null ? (
                        <p className="text-xs text-emerald-300/90">
                          Save {formatPackPriceUsd(absoluteSavings)} vs base rate
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Standard pack rate
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <motion.p
                        layout
                        className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]"
                      >
                        {formatPackPriceUsd(selectedPack.priceUsd)}
                      </motion.p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatPerCreditUsd(selectedPack.perCreditUsd)}/credit
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-3.5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400/75 via-violet-500/75 to-fuchsia-500/75 px-4 py-2.5 text-sm font-semibold text-white/90 opacity-85"
                    aria-disabled="true"
                  >
                    Purchase Credits
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="text-center text-[11px] leading-snug text-zinc-600">
              Checkout coming soon · Works with Free, Starter, and Pro
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
