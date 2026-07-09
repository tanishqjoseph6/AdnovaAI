import { getPlan, type PlanId } from "@/lib/billing/plans";
import type { UserCredits } from "@/lib/credits/types";

/** Monthly AI credit allowance for a billing plan. */
export function getPlanCreditLimit(planId: PlanId): number {
  return getPlan(planId).monthlyCredits;
}

/** Credits granted when a new free account is created. */
export const FREE_PLAN_CREDITS = getPlanCreditLimit("free");

/** Monthly credits when Starter subscription is active. */
export const STARTER_PLAN_CREDITS = getPlanCreditLimit("starter");

/** Monthly credits when Pro subscription is active. */
export const PRO_PLAN_CREDITS = getPlanCreditLimit("pro");

/** Max monthly allowance shown in UI for a user's effective billing plan. */
export function resolveMaxCreditsForProfile(
  _creditsPlan: "free" | "pro",
  profilesPlan?: PlanId
): number {
  const planId = profilesPlan ?? "free";
  return getPlanCreditLimit(planId);
}

export function resolveMonthlyRefillAmount(
  billingPlan: PlanId,
  subscriptionStatus: string
): number {
  if (subscriptionStatus !== "active") {
    return FREE_PLAN_CREDITS;
  }

  if (billingPlan === "pro" || billingPlan === "custom") {
    return PRO_PLAN_CREDITS;
  }

  if (billingPlan === "starter") {
    return STARTER_PLAN_CREDITS;
  }

  return FREE_PLAN_CREDITS;
}

export function createDefaultUserCredits(): UserCredits {
  return {
    credits: FREE_PLAN_CREDITS,
    monthlyCredits: FREE_PLAN_CREDITS,
    purchasedCredits: 0,
    plan: "free",
    maxCredits: FREE_PLAN_CREDITS,
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

export function formatMonthlyCreditsLabel(planId: PlanId): string {
  return String(getPlanCreditLimit(planId));
}

/** @deprecated Use formatMonthlyCreditsLabel */
export const formatMonthlyGenerationsLabel = formatMonthlyCreditsLabel;
