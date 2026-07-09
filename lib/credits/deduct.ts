import type { CreditFeatureId } from "./schema";
import type { DeductCreditResult } from "./types";

export type DeductCreditsRpcResult = {
  deducted: boolean;
  unlimited: boolean;
  insufficient: boolean;
  credits: number;
  plan: string;
  cost?: number;
  zero_cost?: boolean;
  credit_source?: string;
  retry?: boolean;
};

export function parseDeductCreditsRpcResult(
  data: DeductCreditsRpcResult
): DeductCreditResult & {
  cost: number;
  creditSource?: string;
  zeroCost?: boolean;
} {
  return {
    deducted: Boolean(data.deducted),
    unlimited: Boolean(data.unlimited),
    insufficient: Boolean(data.insufficient),
    credits: typeof data.credits === "number" ? data.credits : 0,
    plan: data.plan === "pro" ? "pro" : "free",
    cost: typeof data.cost === "number" ? data.cost : 1,
    creditSource: data.credit_source,
    zeroCost: Boolean(data.zero_cost),
  };
}

export type DeductCreditsInput = {
  userId: string;
  /**
   * Feature whose configured cost is charged. Pass `null` to charge a flat
   * `amountOverride` with no feature attribution (legacy/manual deductions).
   */
  featureId: CreditFeatureId | null;
  /** Flat amount used only when `featureId` is null. */
  amountOverride?: number;
};
