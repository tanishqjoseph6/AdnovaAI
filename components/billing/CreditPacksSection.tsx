"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import CreditPackButton from "@/components/billing/CreditPackButton";
import { CREDIT_PACK_OPTIONS } from "@/lib/credits/purchase";

export default function CreditPacksSection() {
  return (
    <motion.section
      id="credit-packs"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-lg shadow-black/20 sm:p-8"
      aria-label="Buy more credits"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-300 shadow-lg shadow-violet-500/20">
            <Zap className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Buy more credits
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Top up anytime without changing your plan.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACK_OPTIONS.map((pack, index) => {
            const highlighted = index === 1;
            const perCredit = (pack.priceInr / pack.credits).toFixed(1);

            return (
              <div
                key={pack.credits}
                className={`relative flex flex-col rounded-2xl border p-5 transition ${
                  highlighted
                    ? "border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/5"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                }`}
              >
                {highlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Popular
                  </span>
                )}

                <p className="text-3xl font-bold tracking-tight text-white">
                  {pack.credits.toLocaleString("en-IN")}
                </p>
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                  credits
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-white">
                    ₹{pack.priceInr}
                  </span>
                  <span className="text-xs text-zinc-500">
                    · ₹{perCredit}/credit
                  </span>
                </div>

                <CreditPackButton
                  pack={pack}
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    highlighted
                      ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white hover:opacity-90"
                      : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                />
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-zinc-500">
          Purchased credits never expire and are consumed automatically once
          your monthly credits run out. Monthly credits refresh every 30 days.
        </p>
      </div>
    </motion.section>
  );
}
