import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getPlanPriceQuote,
  type BillingInterval,
} from "@/lib/billing/pricing";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripePriceMetadata(plan: PaidPlanId, interval: BillingInterval) {
  const quote = getPlanPriceQuote(plan, interval);

  return {
    plan,
    interval,
    currency: quote.currency,
    amountMinor: quote.amountMinor,
    displayAmount: quote.displayAmount,
    priceSuffix: quote.priceSuffix,
  };
}

export function getStripePriceEnvKey(
  plan: PaidPlanId,
  interval: BillingInterval
): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
}
