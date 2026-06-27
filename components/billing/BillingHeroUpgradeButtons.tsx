"use client";

import BillingPlanButton from "@/components/dashboard/BillingPlanButton";
import { useBillingPricing } from "@/components/billing/BillingPricingContext";
import type { UserSubscription } from "@/lib/subscription";

type BillingHeroUpgradeButtonsProps = {
  subscription: UserSubscription;
};

export default function BillingHeroUpgradeButtons({
  subscription,
}: BillingHeroUpgradeButtonsProps) {
  const { interval, currency, getButtonLabel } = useBillingPricing();

  const showStarterUpgrade =
    subscription.plan !== "starter" && subscription.plan !== "pro";
  const showProUpgrade = subscription.plan !== "pro";

  if (!showStarterUpgrade && !showProUpgrade) {
    return null;
  }

  return (
    <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
      {showStarterUpgrade && (
        <BillingPlanButton
          plan="starter"
          interval={interval}
          currency={currency}
          disabled={false}
          className="inline-flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {getButtonLabel("starter", "Upgrade to Starter")}
        </BillingPlanButton>
      )}
      {showProUpgrade && (
        <BillingPlanButton
          plan="pro"
          interval={interval}
          currency={currency}
          disabled={false}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {getButtonLabel("pro", "Upgrade to Pro")}
        </BillingPlanButton>
      )}
    </div>
  );
}
