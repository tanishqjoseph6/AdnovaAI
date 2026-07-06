import type { PlanId } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/plans";
import type { FeatureId } from "@/lib/billing/features";

export type CreditsPlan = "free" | "pro";

export type UserCredits = {
  credits: number;
  plan: CreditsPlan;
  unlimited: boolean;
  maxCredits: number | null;
  updatedAt: string;
  /** True when credits were refilled during this fetch. */
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
