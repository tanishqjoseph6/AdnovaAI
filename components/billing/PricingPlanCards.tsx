"use client";

import { motion, AnimatePresence } from "framer-motion";
import BillingPlanButton from "@/components/dashboard/BillingPlanButton";
import { useBillingPricing } from "@/components/billing/BillingPricingContext";
import PricingToggles from "@/components/billing/PricingToggles";
import { getContactSalesMailtoUrl } from "@/lib/billing/contact-sales";
import {
  PRICING_TIER_ORDER,
  PRICING_TIERS,
  type PricingTierConfig,
} from "@/lib/billing/comparison";
import type { PaidPlanId, PlanId } from "@/lib/billing/plans";

type PricingPlanCardsProps = {
  currentPlanId: PlanId;
};

const TIER_LABELS: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter ⭐",
  pro: "Pro 👑",
  custom: "Business 💎",
};

const VARIANT_CARD_CLASS: Record<PricingTierConfig["variant"], string> = {
  free: "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:shadow-lg hover:shadow-white/5",
  starter:
    "border-cyan-500/25 bg-cyan-500/[0.04] shadow-lg shadow-cyan-500/10 hover:border-cyan-400/40 hover:shadow-cyan-500/25 hover:-translate-y-0.5",
  pro: "billing-pro-card gradient-border bg-[#0a0618] shadow-[0_0_48px_rgba(139,92,246,0.22)] hover:shadow-[0_0_64px_rgba(139,92,246,0.32)] xl:min-h-[32rem] xl:-translate-y-2",
  business:
    "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.16] hover:shadow-lg hover:shadow-black/25 hover:-translate-y-0.5",
};

const VARIANT_BADGE_CLASS: Record<PricingTierConfig["variant"], string> = {
  free: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  starter: "border-cyan-500/30 bg-cyan-500/15 text-cyan-200",
  pro: "bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-white border-0",
  business: "border-white/15 bg-white/[0.04] text-zinc-300",
};

function CheckIcon({ className = "text-cyan-400" }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function UpgradePath({ currentPlanId }: { currentPlanId: PlanId }) {
  const currentIndex = PRICING_TIER_ORDER.indexOf(currentPlanId);
  const nextIndex =
    currentIndex >= 0 && currentIndex < PRICING_TIER_ORDER.length - 1
      ? currentIndex + 1
      : -1;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
      aria-label="Recommended upgrade path"
    >
      {PRICING_TIER_ORDER.map((planId, index) => {
        const isCurrent = planId === currentPlanId;
        const isNext = index === nextIndex;
        const isPast = index < currentIndex;

        return (
          <div key={planId} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isCurrent
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200 ring-2 ring-violet-500/20"
                  : isNext
                    ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200 shadow-sm shadow-cyan-500/20"
                    : isPast
                      ? "border-white/10 bg-white/[0.03] text-zinc-500"
                      : "border-white/10 bg-white/[0.02] text-zinc-400"
              }`}
            >
              {TIER_LABELS[planId]}
            </span>
            {index < PRICING_TIER_ORDER.length - 1 && (
              <svg
                className={`hidden h-4 w-4 sm:block ${
                  isPast || isCurrent ? "text-violet-400/60" : "text-zinc-600"
                }`}
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
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanCta({
  tier,
  currentPlanId,
}: {
  tier: PricingTierConfig;
  currentPlanId: PlanId;
}) {
  const { interval, currency } = useBillingPricing();
  const isCurrent = currentPlanId === tier.planId;
  const baseButtonClass =
    "block w-full rounded-xl py-3 text-center text-sm font-semibold transition disabled:cursor-not-allowed";

  if (tier.ctaType === "current") {
    return (
      <button
        type="button"
        disabled={isCurrent}
        className={`${baseButtonClass} border border-white/10 bg-white/[0.04] text-zinc-300 disabled:opacity-70`}
      >
        {isCurrent ? "Current Plan" : "Included"}
      </button>
    );
  }

  if (tier.ctaType === "starter") {
    const disabled = currentPlanId === "starter" || currentPlanId === "pro";
    return (
      <BillingPlanButton
        plan="starter"
        interval={interval}
        currency={currency}
        disabled={disabled}
        className={`${baseButtonClass} border border-cyan-500/35 bg-cyan-500/15 text-cyan-100 hover:border-cyan-400/50 hover:bg-cyan-500/25 disabled:opacity-50`}
      >
        {currentPlanId === "starter" ? "Current Plan" : tier.ctaLabel}
      </BillingPlanButton>
    );
  }

  if (tier.ctaType === "pro") {
    const disabled = currentPlanId === "pro";
    return (
      <BillingPlanButton
        plan="pro"
        interval={interval}
        currency={currency}
        disabled={disabled}
        className={`${baseButtonClass} bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/30 hover:opacity-90 disabled:opacity-50`}
      >
        {disabled ? "Current Plan" : tier.ctaLabel}
      </BillingPlanButton>
    );
  }

  return (
    <div>
      <a
        href={getContactSalesMailtoUrl()}
        className={`${baseButtonClass} border border-white/20 bg-white/[0.05] text-zinc-100 shadow-[0_0_24px_rgba(255,255,255,0.06)] ring-1 ring-white/10 transition hover:border-white/30 hover:bg-white/[0.08] hover:shadow-[0_0_32px_rgba(139,92,246,0.15)]`}
      >
        {tier.ctaLabel}
      </a>
    </div>
  );
}

export default function PricingPlanCards({
  currentPlanId,
}: PricingPlanCardsProps) {
  const { getQuote } = useBillingPricing();

  function getTierPriceDisplay(tier: PricingTierConfig): {
    priceDisplay: string;
    priceSuffix?: string;
    originalDisplayAmount?: string;
    showSaveBadge: boolean;
  } {
    if (tier.planId === "starter" || tier.planId === "pro") {
      const quote = getQuote(tier.planId as PaidPlanId);
      return {
        priceDisplay: quote.displayAmount,
        priceSuffix: quote.priceSuffix,
        originalDisplayAmount: quote.originalDisplayAmount,
        showSaveBadge: quote.showSaveBadge,
      };
    }

    return {
      priceDisplay: tier.priceDisplay,
      priceSuffix: tier.priceSuffix,
      showSaveBadge: false,
    };
  }

  return (
    <section className="space-y-8 pt-2">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
          Plans
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Choose the plan that fits your growth
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:text-base">
          Start free, then scale from Starter to Pro as your ad output grows.
          Business plans unlock team workflows and dedicated support.
        </p>
      </div>

      <UpgradePath currentPlanId={currentPlanId} />

      <PricingToggles />

      <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {PRICING_TIERS.map((tier, index) => {
          const isCurrent = currentPlanId === tier.planId;
          const isHighlighted = tier.highlighted;
          const pricing = getTierPriceDisplay(tier);

          return (
            <motion.article
              key={tier.planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              whileHover={{ y: isHighlighted ? -6 : -3 }}
              className={`glass relative flex h-full flex-col rounded-2xl border transition duration-300 ${
                tier.variant === "pro" ? "p-7 sm:p-8" : "p-6"
              } ${VARIANT_CARD_CLASS[tier.variant]} ${
                isCurrent
                  ? "ring-2 ring-violet-500/35 ring-offset-2 ring-offset-[#030014]"
                  : ""
              }`}
            >
              {tier.variant === "pro" && (
                <>
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
                </>
              )}
              {tier.variant === "starter" && (
                <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />
              )}
              {tier.variant === "business" && (
                <div className="pointer-events-none absolute right-5 top-5 text-zinc-400/20">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3l1.8 5.5h5.7l-4.6 3.4 1.8 5.5L12 14l-4.7 3.4 1.8-5.5-4.6-3.4h5.7L12 3z"
                    />
                  </svg>
                </div>
              )}

              <div className="relative flex min-h-[4.5rem] flex-col gap-2">
                {tier.badge && (
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VARIANT_BADGE_CLASS[tier.variant]}`}
                  >
                    {tier.badge}
                  </span>
                )}
                {pricing.showSaveBadge && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    <span aria-hidden>🟢</span>
                    Save 20%
                  </span>
                )}
                {isCurrent && !tier.badge && (
                  <span
                    className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VARIANT_BADGE_CLASS.free}`}
                  >
                    Current Plan
                  </span>
                )}
                {isCurrent && tier.badge && (
                  <span className="inline-flex w-fit rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                    Current Plan
                  </span>
                )}

                <h4 className="text-xl font-semibold tracking-tight text-white">
                  {tier.displayName}
                  {tier.emoji ? ` ${tier.emoji}` : ""}
                </h4>
              </div>

              <p className="relative mt-3 min-h-[2.75rem] text-sm leading-relaxed text-zinc-500">
                {tier.subtitle}
              </p>

              <div className="relative mt-5 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${pricing.priceDisplay}-${pricing.priceSuffix}-${pricing.originalDisplayAmount ?? ""}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col gap-1"
                  >
                    {pricing.originalDisplayAmount && (
                      <span className="text-base font-medium text-zinc-500 line-through sm:text-lg">
                        {pricing.originalDisplayAmount}
                      </span>
                    )}
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span
                        className={`font-bold tracking-tight text-white ${
                          pricing.priceDisplay === "Free" ||
                          pricing.priceDisplay === "Custom"
                            ? "text-3xl"
                            : tier.variant === "pro"
                              ? "text-3xl sm:text-[2.5rem]"
                              : "text-3xl sm:text-4xl"
                        }`}
                      >
                        {pricing.priceDisplay}
                      </span>
                      {pricing.priceSuffix && (
                        <span className="text-sm text-zinc-500">
                          {pricing.priceSuffix}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="relative mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300"
                  >
                    <CheckIcon
                      className={
                        tier.variant === "pro"
                          ? "text-fuchsia-400"
                          : tier.variant === "business"
                            ? "text-zinc-500"
                            : tier.variant === "starter"
                              ? "text-cyan-400"
                              : "text-cyan-400"
                      }
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="relative mt-8 pt-2">
                <PlanCta tier={tier} currentPlanId={currentPlanId} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
