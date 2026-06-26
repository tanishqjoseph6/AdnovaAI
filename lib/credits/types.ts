import type { PlanId } from "@/lib/billing/plans";

export type CreditsPlan = "free" | "pro";

export type UserCredits = {
  credits: number;
  plan: CreditsPlan;
  unlimited: boolean;
  maxCredits: number | null;
  updatedAt: string;
};

export type CreditsApiResponse = UserCredits & {
  billingPlan: PlanId;
  displayPlan: string;
};

export type DeductCreditResult = {
  deducted: boolean;
  unlimited: boolean;
  insufficient: boolean;
  credits: number;
  plan: CreditsPlan;
};
