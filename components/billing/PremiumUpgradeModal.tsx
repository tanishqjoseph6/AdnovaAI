"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useEffect } from "react";
import type { GatedFeatureId } from "@/lib/billing/features";
import { FEATURE_CATALOG } from "@/lib/billing/features";
import { PLANS } from "@/lib/billing/plans";

type PremiumUpgradeModalProps = {
  open: boolean;
  feature: GatedFeatureId | null;
  onClose: () => void;
};

export default function PremiumUpgradeModal({
  open,
  feature,
  onClose,
}: PremiumUpgradeModalProps) {
  const catalog = feature ? FEATURE_CATALOG[feature] : null;
  const isProFeature = catalog?.minPlan === "pro";
  const availabilityLabel = isProFeature
    ? "Available in Pro"
    : "Available in Starter & Pro";
  const upgradeLabel = isProFeature
    ? `Upgrade to Pro – ${PLANS.pro.priceLabel}`
    : `Upgrade to Starter – ${PLANS.starter.priceLabel}`;
  const benefitItems = isProFeature
    ? [
        "Premium GPT-4o output quality",
        "Unlimited AI generations",
        "Priority processing & support",
        "Everything in Starter included",
      ]
    : [
        "Brand Kit & saved brand memory",
        "Competitor & landing page analyzers",
        "Social scheduler & advanced AI settings",
        "100 generations/month on Starter",
      ];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && catalog && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-upgrade-title"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#030014]/75 backdrop-blur-md"
            aria-label="Close upgrade modal"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl sm:max-h-[90dvh] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02]" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl shadow-lg shadow-violet-500/20 backdrop-blur-sm">
                <span aria-hidden>{catalog.icon}</span>
              </div>

              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200 backdrop-blur-sm">
                  <Lock className="h-3 w-3" aria-hidden />
                  {catalog.minPlan === "pro" ? "Pro feature" : "Starter & Pro"}
                </span>
              </div>

              <h2
                id="premium-upgrade-title"
                className="mt-4 text-center text-2xl font-bold tracking-tight text-white"
              >
                {catalog.label}
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-zinc-300">
                {catalog.description}
              </p>

              <p className="mt-4 text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
                {availabilityLabel}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-zinc-200">
                {benefitItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/dashboard/billing"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-95"
                >
                  {upgradeLabel}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-300 backdrop-blur-sm transition hover:bg-white/[0.08]"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
