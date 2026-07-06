import type { PlanId } from "./plans";
import {
  formatMonthlyGenerationsLabel,
  FREE_PLAN_CREDITS,
  STARTER_PLAN_CREDITS,
} from "@/lib/credits/plan-config";
import { getPlanPriceQuote } from "./pricing";

const STARTER_INR_MONTHLY = getPlanPriceQuote("starter", "monthly", "INR");
const PRO_INR_MONTHLY = getPlanPriceQuote("pro", "monthly", "INR");

export type ComparisonValue = boolean | string;

export type ComparisonFeature = {
  label: string;
  values: Record<PlanId, ComparisonValue>;
};

export const BILLING_COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    label: "Monthly AI generations",
    values: {
      free: formatMonthlyGenerationsLabel("free"),
      starter: formatMonthlyGenerationsLabel("starter"),
      pro: formatMonthlyGenerationsLabel("pro"),
      custom: formatMonthlyGenerationsLabel("custom"),
    },
  },
  {
    label: "Hooks per generation",
    values: {
      free: "5",
      starter: "5",
      pro: "5",
      custom: "5",
    },
  },
  {
    label: "Captions per generation",
    values: {
      free: "3",
      starter: "3",
      pro: "3",
      custom: "3",
    },
  },
  {
    label: "CTAs per generation",
    values: {
      free: "3",
      starter: "3",
      pro: "3",
      custom: "3",
    },
  },
  {
    label: "UGC scripts",
    values: {
      free: true,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Brand Kit & brand memory",
    values: {
      free: false,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Competitor Analyzer",
    values: {
      free: false,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Landing Page Analyzer",
    values: {
      free: false,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Social Scheduler",
    values: {
      free: false,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Advanced AI preferences",
    values: {
      free: false,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Premium AI output (GPT-4o)",
    values: {
      free: false,
      starter: false,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Priority processing",
    values: {
      free: false,
      starter: false,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Generation history",
    values: {
      free: true,
      starter: true,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Priority support",
    values: {
      free: false,
      starter: false,
      pro: true,
      custom: true,
    },
  },
  {
    label: "Team access",
    values: {
      free: false,
      starter: false,
      pro: false,
      custom: true,
    },
  },
  {
    label: "Dedicated support",
    values: {
      free: false,
      starter: false,
      pro: false,
      custom: true,
    },
  },
];

export type PricingTierConfig = {
  planId: PlanId;
  displayName: string;
  emoji?: string;
  badge?: string;
  subtitle: string;
  priceDisplay: string;
  priceSuffix?: string;
  features: string[];
  ctaLabel: string;
  ctaType: "current" | "starter" | "pro" | "contact";
  variant: "free" | "starter" | "pro" | "business";
  highlighted?: boolean;
};

export const PRICING_TIERS: PricingTierConfig[] = [
  {
    planId: "free",
    displayName: "Free",
    subtitle: "Perfect for trying Advora AI",
    priceDisplay: "Free",
    features: [
      `${FREE_PLAN_CREDITS} generations/month`,
      "Hooks, captions, CTAs & UGC scripts",
      "Basic AI settings",
    ],
    ctaLabel: "Current Plan",
    ctaType: "current",
    variant: "free",
  },
  {
    planId: "starter",
    displayName: "Starter",
    emoji: "⭐",
    badge: "Best Value",
    subtitle: "Perfect for creators, freelancers and small businesses.",
    priceDisplay: STARTER_INR_MONTHLY.displayAmount,
    priceSuffix: STARTER_INR_MONTHLY.priceSuffix,
    features: [
      `${STARTER_PLAN_CREDITS} AI generations/month`,
      "Brand Kit, analyzers & scheduler",
      "Advanced AI preferences",
      "Saved brand memory",
    ],
    ctaLabel: "Get Started",
    ctaType: "starter",
    variant: "starter",
  },
  {
    planId: "pro",
    displayName: "Pro",
    emoji: "👑",
    badge: "🔥 MOST POPULAR",
    subtitle: "Unlimited AI ad generation for serious brands.",
    priceDisplay: PRO_INR_MONTHLY.displayAmount,
    priceSuffix: PRO_INR_MONTHLY.priceSuffix,
    features: [
      "Unlimited AI generations",
      "Everything in Starter",
      "Premium AI quality (GPT-4o)",
      "Priority processing & support",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaType: "pro",
    variant: "pro",
    highlighted: true,
  },
  {
    planId: "custom",
    displayName: "Business",
    emoji: "💎",
    subtitle: "Enterprise-grade creative for teams at scale.",
    priceDisplay: "Custom",
    priceSuffix: "Pricing",
    features: [
      "Unlimited team members",
      "API Access",
      "Dedicated Success Manager",
      "Custom AI Models",
      "Priority Support",
    ],
    ctaLabel: "Contact Sales",
    ctaType: "contact",
    variant: "business",
  },
];

/** @deprecated Use PRICING_TIERS */
export const PRICING_CARD_PLANS = PRICING_TIERS.map((tier) => ({
  planId: tier.planId,
  displayName: tier.displayName,
  tagline: tier.subtitle,
  highlighted: tier.highlighted,
  badge: tier.badge,
}));

export const PRICING_TIER_ORDER: PlanId[] = [
  "free",
  "starter",
  "pro",
  "custom",
];

/** Hero subtitle copy shown under the current plan name on the Billing page. */
export const PLAN_HERO_DESCRIPTIONS: Record<PlanId, string> = {
  free: "Perfect for trying Advora AI and creating your first AI ads.",
  starter: "Best for growing creators and small businesses.",
  pro: "Unlimited AI ad generation for serious brands.",
  custom: "Tailored solutions for agencies and teams at scale.",
};

export function getPlanHeroDescription(planId: PlanId): string {
  return PLAN_HERO_DESCRIPTIONS[planId];
}
