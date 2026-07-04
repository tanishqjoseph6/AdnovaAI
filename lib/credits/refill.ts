import type { PlanId } from "@/lib/billing/plans";
import {
  FREE_PLAN_CREDITS,
  isUnlimitedBillingPlan,
  STARTER_PLAN_CREDITS,
} from "@/lib/credits/plan-config";

export const CREDIT_REFILL_PERIOD_DAYS = 30;
export const CREDIT_REFILL_PERIOD_MS =
  CREDIT_REFILL_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export const CREDIT_REFILL_TOAST_MESSAGE =
  "🎉 Your monthly credits have been refreshed!";

export type CreditRefillAnchorInput = {
  billingPlan: PlanId;
  subscriptionStatus: string;
  purchaseDate: string | null;
  signupDate: string | null;
};

export function resolveCreditRefillAnchor(
  input: CreditRefillAnchorInput
): Date | null {
  const signup = input.signupDate ? new Date(input.signupDate) : null;

  if (
    input.billingPlan === "starter" &&
    input.subscriptionStatus === "active" &&
    input.purchaseDate
  ) {
    return new Date(input.purchaseDate);
  }

  return signup;
}

export function isCreditRefillDue(
  lastRefillAt: string | null | undefined,
  anchorDate: Date,
  now: Date = new Date()
): boolean {
  const reference = lastRefillAt ? new Date(lastRefillAt) : anchorDate;
  return now.getTime() - reference.getTime() >= CREDIT_REFILL_PERIOD_MS;
}

export function resolveCreditRefillAmount(
  billingPlan: PlanId,
  subscriptionStatus: string
): number | null {
  if (
    isUnlimitedBillingPlan(billingPlan) &&
    subscriptionStatus === "active"
  ) {
    return null;
  }

  if (billingPlan === "starter" && subscriptionStatus === "active") {
    return STARTER_PLAN_CREDITS;
  }

  return FREE_PLAN_CREDITS;
}

export type CreditRefillRpcResult = {
  refilled: boolean;
  reason?: string;
  credits?: number;
  plan?: string;
  billing_plan?: string;
  refilled_at?: string;
  next_refill_at?: string;
};
