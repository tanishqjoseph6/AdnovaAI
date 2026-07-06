import { Lock } from "lucide-react";
import type { GatedFeatureId } from "@/lib/billing/features";
import { FEATURE_CATALOG } from "@/lib/billing/features";

type PremiumFeatureBadgeProps = {
  variant: "lock" | "tier";
  feature?: GatedFeatureId;
  className?: string;
};

export default function PremiumFeatureBadge({
  variant,
  feature,
  className = "",
}: PremiumFeatureBadgeProps) {
  if (variant === "lock") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 backdrop-blur-sm ${className}`}
        aria-label="Premium feature"
      >
        <Lock className="h-2.5 w-2.5" aria-hidden />
      </span>
    );
  }

  const minPlan = feature ? FEATURE_CATALOG[feature].minPlan : "starter";
  const label = minPlan === "pro" ? "Pro" : "Starter & Pro";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border border-violet-400/25 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-violet-200 ${className}`}
    >
      {label}
    </span>
  );
}
