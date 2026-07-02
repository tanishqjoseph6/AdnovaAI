import type { PaidPlanId } from "@/lib/billing/plans";

export type BillingInterval = "monthly" | "yearly";
export type BillingCurrency = "INR" | "USD";

export const YEARLY_DISCOUNT_PERCENT = 20;

const MONTHLY_INR: Record<PaidPlanId, number> = {
  starter: 50,
  pro: 2999,
};

const MONTHLY_USD: Record<PaidPlanId, number> = {
  starter: 19,
  pro: 59,
};

/** Authoritative yearly USD prices (20% off annualized monthly). */
const YEARLY_USD: Record<PaidPlanId, number> = {
  starter: 182,
  pro: 566,
};

function roundInr(value: number): number {
  return Math.round(value);
}

function yearlyInrFromMonthly(monthly: number): number {
  const annual = monthly * 12;
  const discounted = annual * (1 - YEARLY_DISCOUNT_PERCENT / 100);
  return roundInr(discounted);
}

const YEARLY_INR: Record<PaidPlanId, number> = {
  starter: yearlyInrFromMonthly(MONTHLY_INR.starter),
  pro: yearlyInrFromMonthly(MONTHLY_INR.pro),
};

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export type PlanPriceQuote = {
  plan: PaidPlanId;
  interval: BillingInterval;
  currency: BillingCurrency;
  /** Paise (INR) or cents (USD) for payment providers. */
  amountMinor: number;
  displayAmount: string;
  /** Full annual list price before discount (yearly only). */
  originalDisplayAmount?: string;
  priceSuffix: string;
  showSaveBadge: boolean;
};

function getYearlyOriginalDisplay(
  plan: PaidPlanId,
  currency: BillingCurrency
): string {
  if (currency === "INR") {
    return formatInr(MONTHLY_INR[plan] * 12);
  }
  return formatUsd(MONTHLY_USD[plan] * 12);
}

export function getPlanPriceQuote(
  plan: PaidPlanId,
  interval: BillingInterval,
  currency: BillingCurrency
): PlanPriceQuote {
  if (currency === "INR") {
    if (interval === "monthly") {
      const amount = MONTHLY_INR[plan];
      return {
        plan,
        interval,
        currency,
        amountMinor: amount * 100,
        displayAmount: formatInr(amount),
        priceSuffix: "/month",
        showSaveBadge: false,
      };
    }

    const amount = YEARLY_INR[plan];
    return {
      plan,
      interval,
      currency,
      amountMinor: amount * 100,
      displayAmount: formatInr(amount),
      originalDisplayAmount: getYearlyOriginalDisplay(plan, currency),
      priceSuffix: "/year",
      showSaveBadge: true,
    };
  }

  if (interval === "monthly") {
    const amount = MONTHLY_USD[plan];
    return {
      plan,
      interval,
      currency,
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
    currency,
    amountMinor: amount * 100,
    displayAmount: formatUsd(amount),
    originalDisplayAmount: getYearlyOriginalDisplay(plan, currency),
    priceSuffix: "/year",
    showSaveBadge: true,
  };
}

export function getPaidPlanAmountMinor(
  plan: PaidPlanId,
  interval: BillingInterval = "monthly",
  currency: BillingCurrency = "INR"
): number {
  return getPlanPriceQuote(plan, interval, currency).amountMinor;
}

/** Default monthly INR — backward compatible with legacy PLANS.amountPaise. */
export function getLegacyMonthlyInrAmountPaise(plan: PaidPlanId): number {
  return getPlanPriceQuote(plan, "monthly", "INR").amountMinor;
}

export function getCheckoutLabel(
  plan: PaidPlanId,
  interval: BillingInterval,
  currency: BillingCurrency
): string {
  const quote = getPlanPriceQuote(plan, interval, currency);
  return `${quote.displayAmount}${quote.priceSuffix}`;
}
