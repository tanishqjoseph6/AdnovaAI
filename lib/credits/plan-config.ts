import { getPlan, type PlanId } from "@/lib/billing/plans";
import type { UserCredits } from "@/lib/credits/types";

/** Monthly generation allowance from billing plan config (`null` = unlimited). */
export function getPlanCreditLimit(planId: PlanId): number | null {
  return getPlan(planId).generationLimit;
}

function requireFiniteCreditLimit(planId: PlanId): number {
  const limit = getPlanCreditLimit(planId);
  if (limit === null) {
    throw new Error(`Plan "${planId}" has no finite credit limit`);
  }
  return limit;
}

/** Credits granted when a new free account is created. */
export const FREE_PLAN_CREDITS = requireFiniteCreditLimit("free");

/** Credits granted when Starter subscription activates. */
export const STARTER_PLAN_CREDITS = requireFiniteCreditLimit("starter");

export function isUnlimitedBillingPlan(planId: PlanId): boolean {
  return getPlanCreditLimit(planId) === null;
}

/** Max credits for a metered user_credits row, based on billing plan. */
export function resolveMaxCreditsForProfile(
  creditsPlan: "free" | "pro",
  profilesPlan?: PlanId
): number | null {
  if (creditsPlan === "pro") {
    return null;
  }

  const planId = profilesPlan ?? "free";
  const limit = getPlanCreditLimit(planId);

  if (limit === null) {
    return null;
  }

  return limit;
}

export function createDefaultUserCredits(): UserCredits {
  return {
    credits: FREE_PLAN_CREDITS,
    plan: "free",
    unlimited: false,
    maxCredits: FREE_PLAN_CREDITS,
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

export function formatMonthlyGenerationsLabel(planId: PlanId): string {
  const limit = getPlanCreditLimit(planId);
  if (limit === null) {
    return "Unlimited";
  }
  return String(limit);
}
