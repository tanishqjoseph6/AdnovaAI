"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import {
  FREE_PLAN_CREDITS,
  PRO_PLAN_CREDITS,
  STARTER_PLAN_CREDITS,
} from "@/lib/credits/constants";
import { CREDIT_PACK_OPTIONS } from "@/lib/credits/purchase";
import { formatCreditsCount, PLANS } from "@/lib/billing/plans";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
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
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#030014]/75 backdrop-blur-md"
            aria-label="Close buy credits modal"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl shadow-violet-500/20 backdrop-blur-2xl sm:max-h-[90dvh] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl shadow-lg shadow-violet-500/30 backdrop-blur-sm">
                ⚡
              </div>

              <h2
                id="upgrade-modal-title"
                className="mt-5 text-center text-2xl font-bold text-white"
              >
                Buy More Credits
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-zinc-300">
                You&apos;ve used your monthly AI credits. Purchase extra credits
                to keep generating, or upgrade for a larger monthly allowance.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Credit packs
                </p>
                <ul className="mt-3 space-y-2">
                  {CREDIT_PACK_OPTIONS.map((pack) => (
                    <li
                      key={pack.credits}
                      className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-200"
                    >
                      <span>{pack.label}</span>
                      <span className="font-semibold text-white">
                        ₹{pack.priceInr}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  Purchased credits are used automatically after your monthly
                  credits run out.
                </p>
              </div>

              <ul className="mt-6 space-y-2 text-sm text-zinc-200">
                {[
                  `Free: ${formatCreditsCount(FREE_PLAN_CREDITS)} credits/month`,
                  `Starter: ${formatCreditsCount(STARTER_PLAN_CREDITS)} credits/month + premium features`,
                  `Pro: ${formatCreditsCount(PRO_PLAN_CREDITS)} credits/month + priority support`,
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/dashboard/billing#credit-packs"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-95"
                >
                  Buy More Credits
                </Link>
                <Link
                  href="/dashboard/billing"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 backdrop-blur-sm transition hover:bg-white/[0.08]"
                >
                  Upgrade to Starter – {PLANS.starter.priceLabel}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
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
