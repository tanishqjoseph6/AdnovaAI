export type GrantPurchasedCreditsRpcResult = {
  granted: boolean;
  credits_added: number;
  purchased_credits: number;
  current_credits: number;
};

export type CreateCreditPurchaseInput = {
  userId: string;
  creditsAmount: number;
  amountPaid: number;
  currency?: string;
  paymentId?: string;
  orderId?: string;
};

export type CompleteCreditPurchaseInput = {
  purchaseId: string;
  paymentId: string;
};

export type CreditPackBadge = "popular" | "best-value" | "maximum-savings";

export type CreditPackDefinition = {
  credits: number;
  priceUsd: number;
  label: string;
  badge?: CreditPackBadge;
};

/** Baseline per-credit rate (100 credits @ $15) used for savings badges. */
export const CREDIT_PACK_BASELINE_PER_CREDIT_USD = 15 / 100;

export const CREDIT_PACK_BADGE_LABELS: Record<CreditPackBadge, string> = {
  popular: "Most Popular",
  "best-value": "Best Value",
  "maximum-savings": "Maximum Savings",
};

export const CREDIT_PACK_DEFINITIONS = [
  { credits: 100, priceUsd: 15, label: "100 Credits" },
  { credits: 250, priceUsd: 50, label: "250 Credits" },
  { credits: 500, priceUsd: 90, label: "500 Credits" },
  { credits: 1000, priceUsd: 120, label: "1,000 Credits", badge: "popular" },
  { credits: 2500, priceUsd: 250, label: "2,500 Credits", badge: "best-value" },
  {
    credits: 5000,
    priceUsd: 600,
    label: "5,000 Credits",
    badge: "maximum-savings",
  },
] as const satisfies readonly CreditPackDefinition[];

export type CreditPackOption = CreditPackDefinition & {
  perCreditUsd: number;
  savingsPercent: number | null;
};

export const DEFAULT_CREDIT_PACK_CREDITS = 1000;

export function computePackSavingsPercent(
  credits: number,
  priceUsd: number
): number | null {
  const perCredit = priceUsd / credits;
  if (perCredit >= CREDIT_PACK_BASELINE_PER_CREDIT_USD) {
    return null;
  }

  return Math.round(
    (1 - perCredit / CREDIT_PACK_BASELINE_PER_CREDIT_USD) * 100
  );
}

export function enrichCreditPack(
  pack: CreditPackDefinition
): CreditPackOption {
  return {
    ...pack,
    perCreditUsd: pack.priceUsd / pack.credits,
    savingsPercent: computePackSavingsPercent(pack.credits, pack.priceUsd),
  };
}

export const CREDIT_PACK_OPTIONS: CreditPackOption[] =
  CREDIT_PACK_DEFINITIONS.map(enrichCreditPack);

export function findCreditPack(credits: number): CreditPackOption | null {
  return CREDIT_PACK_OPTIONS.find((pack) => pack.credits === credits) ?? null;
}

export function formatPackPriceUsd(priceUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceUsd);
}

export function formatPerCreditUsd(perCreditUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(perCreditUsd);
}
