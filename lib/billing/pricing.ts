import type { PaidPlanId } from "@/lib/billing/plans";

export type BillingInterval = "monthly" | "yearly";

/** Canonical currency for plan catalog and subscription pricing. */
export const PLAN_CURRENCY = "USD" as const;
export type PlanCurrency = typeof PLAN_CURRENCY;

/** ISO currency code on a completed transaction (may differ from PLAN_CURRENCY). */
export type TransactionCurrency = string;

/** @deprecated Use TransactionCurrency — kept for legacy imports. */
export type BillingCurrency = TransactionCurrency;

export const YEARLY_DISCOUNT_PERCENT = 20;

const MONTHLY_USD: Record<PaidPlanId, number> = {
  starter: 19,
  pro: 59,
};

/** Authoritative yearly USD prices (20% off annualized monthly). */
const YEARLY_USD: Record<PaidPlanId, number> = {
  starter: 182,
  pro: 566,
};

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatPaymentCurrency(
  amountMinor: number,
  currency: string
): string {
  const code = currency.toUpperCase();
  if (code === "USD") {
    return formatUsd(amountMinor / 100);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${code}`;
  }
}

export type PlanPriceQuote = {
  plan: PaidPlanId;
  interval: BillingInterval;
  currency: PlanCurrency;
  /** Cents (USD) for payment providers. */
  amountMinor: number;
  displayAmount: string;
  /** Full annual list price before discount (yearly only). */
  originalDisplayAmount?: string;
  priceSuffix: string;
  showSaveBadge: boolean;
};

function getYearlyOriginalDisplay(plan: PaidPlanId): string {
  return formatUsd(MONTHLY_USD[plan] * 12);
}

export function getPlanPriceQuote(
  plan: PaidPlanId,
  interval: BillingInterval
): PlanPriceQuote {
  if (interval === "monthly") {
    const amount = MONTHLY_USD[plan];
    return {
      plan,
      interval,
      currency: PLAN_CURRENCY,
      amountMinor: amount * 100,
      displayAmount: formatUsd(amount),
      priceSuffix: "/month",
      showSaveBadge: false,
    };
  }

  const amount = YEARLY_USD[plan];
  return {
    plan,
    interval,
    currency: PLAN_CURRENCY,
    amountMinor: amount * 100,
    displayAmount: formatUsd(amount),
    originalDisplayAmount: getYearlyOriginalDisplay(plan),
    priceSuffix: "/year",
    showSaveBadge: true,
  };
}

export function getPaidPlanAmountMinor(
  plan: PaidPlanId,
  interval: BillingInterval = "monthly"
): number {
  return getPlanPriceQuote(plan, interval).amountMinor;
}

export function getPlanPriceLabel(
  plan: PaidPlanId,
  interval: BillingInterval = "monthly"
): string {
  const quote = getPlanPriceQuote(plan, interval);
  return `${quote.displayAmount}${quote.priceSuffix}`;
}

export function getCheckoutLabel(
  plan: PaidPlanId,
  interval: BillingInterval
): string {
  return getPlanPriceLabel(plan, interval);
}

export function computeExchangeRate(
  amountPaidMinor: number,
  amountUsdMinor: number
): number | null {
  if (amountUsdMinor <= 0 || amountPaidMinor <= 0) {
    return null;
  }
  return amountPaidMinor / amountUsdMinor;
}
