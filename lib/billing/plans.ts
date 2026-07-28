export type PlanId = "free" | "starter" | "pro" | "custom";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "past_due";

export type PaidPlanId = "starter" | "pro";

export const MERCHANT_NAME = "Advora";
export const MERCHANT_WEBSITE = "https://useadvora.com";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    emoji: "",
    priceLabel: "Free",
    priceUsd: 0,
    amountCents: 0,
    /** Monthly AI credits included with the plan (refills every 30 days). */
    monthlyCredits: 50,
    purchasable: false,
    features: [
      "50 AI credits / month",
      "Hooks, captions, CTAs & UGC scripts",
      "Basic AI settings",
      "Premium features locked",
    ],
  },
  starter: {
    id: "starter" as const,
    name: "Starter",
    emoji: "⭐",
    priceLabel: "$19/month",
    priceUsd: 19,
    amountCents: 1900,
    monthlyCredits: 500,
    purchasable: true,
    features: [
      "500 AI credits / month",
      "Brand Kit & brand memory",
      "Competitor & landing analyzers",
      "AI reel script generator",
      "AI thumbnail generator",
      "Social scheduler",
      "Advanced AI settings",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    emoji: "👑",
    priceLabel: "$59/month",
    priceUsd: 59,
    amountCents: 5900,
    monthlyCredits: 2500,
    purchasable: true,
    features: [
      "2,500 AI credits / month",
      "Everything in Starter",
      "Premium AI quality",
      "Priority processing & support",
      "Faster generation",
    ],
  },
  custom: {
    id: "custom" as const,
    name: "Custom",
    emoji: "💎",
    priceLabel: "Custom",
    priceUsd: null,
    amountCents: 0,
    monthlyCredits: 2500,
    purchasable: false,
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Team access",
      "Custom features",
    ],
  },
} as const;

/** @deprecated Use `monthlyCredits` on each plan. */
export function getPlanMonthlyCredits(planId: PlanId): number {
  return PLANS[planId].monthlyCredits;
}

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return plan === "starter" || plan === "pro";
}

export function getPlan(planId: string) {
  if (planId in PLANS) {
    return PLANS[planId as PlanId];
  }
  return PLANS.free;
}

export function formatCreditsCount(count: number): string {
  return count.toLocaleString("en-US");
}
