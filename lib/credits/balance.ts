import type { CreditSource } from "./schema";

/**
 * Pure balance computation helpers.
 * The database trigger keeps `current_credits` and legacy `credits` in sync.
 */

export type CreditBuckets = {
  monthlyCredits: number;
  purchasedCredits: number;
  currentCredits: number;
  totalUsedCredits: number;
  monthlyAllowance: number | null;
};

export function computeCurrentCredits(
  monthlyCredits: number,
  purchasedCredits: number
): number {
  return Math.max(0, monthlyCredits) + Math.max(0, purchasedCredits);
}

export function canAfford(
  buckets: Pick<CreditBuckets, "currentCredits">,
  cost: number
): boolean {
  if (cost <= 0) return true;
  return buckets.currentCredits >= cost;
}

export type DeductionSplit = {
  fromMonthly: number;
  fromPurchased: number;
  total: number;
  source: CreditSource;
};

/**
 * Determines how a deduction is split across monthly vs purchased buckets.
 * Monthly credits are consumed first; purchased credits are used only after
 * monthly credits are exhausted.
 */
export function computeDeductionSplit(
  monthlyCredits: number,
  purchasedCredits: number,
  cost: number
): DeductionSplit | null {
  if (cost <= 0) {
    return { fromMonthly: 0, fromPurchased: 0, total: 0, source: "monthly" };
  }

  const current = computeCurrentCredits(monthlyCredits, purchasedCredits);
  if (current < cost) {
    return null;
  }

  const fromMonthly = Math.min(monthlyCredits, cost);
  const remaining = cost - fromMonthly;
  const fromPurchased = remaining;

  const source: CreditSource =
    fromMonthly > 0 && fromPurchased > 0
      ? "mixed"
      : fromPurchased > 0
        ? "purchased"
        : "monthly";

  return { fromMonthly, fromPurchased, total: cost, source };
}

export function applyDeduction(
  buckets: CreditBuckets,
  split: DeductionSplit
): CreditBuckets {
  const monthlyCredits = buckets.monthlyCredits - split.fromMonthly;
  const purchasedCredits = buckets.purchasedCredits - split.fromPurchased;

  return {
    monthlyCredits,
    purchasedCredits,
    currentCredits: computeCurrentCredits(monthlyCredits, purchasedCredits),
    totalUsedCredits: buckets.totalUsedCredits + split.total,
    monthlyAllowance: buckets.monthlyAllowance,
  };
}

export function applyMonthlyRefill(
  buckets: CreditBuckets,
  refillAmount: number
): CreditBuckets {
  return {
    monthlyCredits: refillAmount,
    purchasedCredits: buckets.purchasedCredits,
    currentCredits: computeCurrentCredits(
      refillAmount,
      buckets.purchasedCredits
    ),
    totalUsedCredits: buckets.totalUsedCredits,
    monthlyAllowance: refillAmount,
  };
}

export function applyPurchase(
  buckets: CreditBuckets,
  amount: number
): CreditBuckets {
  const purchasedCredits = buckets.purchasedCredits + amount;
  return {
    ...buckets,
    purchasedCredits,
    currentCredits: computeCurrentCredits(
      buckets.monthlyCredits,
      purchasedCredits
    ),
  };
}
