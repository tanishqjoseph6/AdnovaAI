export type PlanId = "free" | "starter" | "pro" | "custom";

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "past_due";

export type PaidPlanId = "starter" | "pro";

export const MERCHANT_NAME = "Advora AI";
export const MERCHANT_WEBSITE = "https://useadvora.com";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    emoji: "",
    priceLabel: "Free",
    priceInr: 0,
    amountPaise: 0,
    generationLimit: 5,
    purchasable: false,
    features: ["5 generations / month"],
  },
  starter: {
    id: "starter" as const,
    name: "Starter",
    emoji: "⭐",
    priceLabel: "₹50/month",
    priceInr: 50,
    amountPaise: 5000,
    generationLimit: 100,
    purchasable: true,
    features: [
      "100 generations / month",
      "5 hooks, 3 captions & 1 UGC script per run",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    emoji: "👑",
    priceLabel: "₹2999/month",
    priceInr: 2999,
    amountPaise: 299900,
    generationLimit: null,
    purchasable: true,
    features: [
      "Unlimited generations",
      "Priority support",
    ],
  },
  custom: {
    id: "custom" as const,
    name: "Custom",
    emoji: "💎",
    priceLabel: "Custom",
    priceInr: null,
    amountPaise: 0,
    generationLimit: null,
    purchasable: false,
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Team access",
      "Custom features",
    ],
  },
} as const;

export function isPaidPlan(plan: string): plan is PaidPlanId {
  return plan === "starter" || plan === "pro";
}

export function getPlan(planId: string) {
  if (planId in PLANS) {
    return PLANS[planId as PlanId];
  }
  return PLANS.free;
}
