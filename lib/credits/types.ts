import type { PlanId } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/plans";
import type { FeatureId } from "@/lib/billing/features";
import type { CreditBuckets } from "./balance";

export type CreditsPlan = "free" | "pro";

/** @deprecated Use CreditBalance for the full split-bucket view. */
export type UserCredits = {
  credits: number;
  plan: CreditsPlan;
  unlimited: boolean;
  maxCredits: number | null;
  updatedAt: string;
  /** True when credits were refilled during this fetch. */
  refilledJustNow?: boolean;
};

/**
 * Full credit balance with split buckets.
 * `currentCredits` = `monthlyCredits` + `purchasedCredits`.
 */
export type CreditBalance = CreditBuckets & {
  userId: string;
  plan: CreditsPlan;
  unlimited: boolean;
  maxCredits: number | null;
  updatedAt: string;
  refilledJustNow?: boolean;
};

export type CreditsApiResponse = UserCredits & {
  billingPlan: PlanId;
  effectivePlan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  displayPlan: string;
  featureAccess: Record<FeatureId, boolean>;
};

export type DeductCreditResult = {
  deducted: boolean;
  unlimited: boolean;
  insufficient: boolean;
  credits: number;
  plan: CreditsPlan;
};

export type DeductCreditsResult = DeductCreditResult & {
  cost: number;
  creditSource?: string;
  zeroCost?: boolean;
};

export type UserCreditsRow = {
  user_id: string;
  credits: number;
  monthly_credits: number;
  purchased_credits: number;
  current_credits: number;
  total_used_credits: number;
  monthly_allowance: number | null;
  plan: string;
  signup_date: string | null;
  last_credit_refill_at: string | null;
  updated_at: string;
};
