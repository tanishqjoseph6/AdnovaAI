"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import type { GatedFeatureId } from "@/lib/billing/features";

type FeatureGateProps = {
  feature: GatedFeatureId;
  children: ReactNode;
};

export default function FeatureGate({ feature, children }: FeatureGateProps) {
  const { canAccess, openUpgradeModal } = usePlanFeatures();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[320px]">
      <div className="pointer-events-none select-none blur-[2px] opacity-40">
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div className="max-w-md rounded-2xl border border-white/15 bg-white/[0.06] p-6 text-center shadow-xl backdrop-blur-xl">
          <p className="text-lg font-semibold text-white">Premium feature</p>
          <p className="mt-2 text-sm text-zinc-400">
            Upgrade to Starter to unlock this tool and more.
          </p>
          <button
            type="button"
            onClick={() => openUpgradeModal(feature)}
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            View upgrade options
          </button>
        </div>
      </motion.div>
    </div>
  );
}
