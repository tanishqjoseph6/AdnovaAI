"use client";

import { motion } from "framer-motion";
import BillingPlanButton from "@/components/dashboard/BillingPlanButton";
import { useBillingPricing } from "@/components/billing/BillingPricingContext";
import type { PlanId } from "@/lib/billing/plans";

type UpgradeProCtaProps = {
  currentPlanId: PlanId;
};

export default function UpgradeProCta({ currentPlanId }: UpgradeProCtaProps) {
  const { interval, currency, getButtonLabel } = useBillingPricing();

  if (currentPlanId === "pro") {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-[#0a0618] to-cyan-600/10 p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-widest text-fuchsia-400">
            Go unlimited
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Upgrade to Pro and never worry about credits again
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Unlock unlimited AI generations, priority support, and the full
            Advora creative workflow — built for teams shipping ads at scale.
          </p>
        </div>

        <BillingPlanButton
          plan="pro"
          interval={interval}
          currency={currency}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {getButtonLabel("pro", "Upgrade to Pro")}
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
        </BillingPlanButton>
      </div>
    </motion.section>
  );
}
