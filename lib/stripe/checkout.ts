import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getPlanPriceQuote,
  type BillingCurrency,
  type BillingInterval,
} from "@/lib/billing/pricing";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripePriceMetadata(
  plan: PaidPlanId,
  interval: BillingInterval,
  currency: BillingCurrency
) {
  if (currency !== "USD") {
    throw new Error("Stripe checkout only supports USD.");
  }

  const quote = getPlanPriceQuote(plan, interval, currency);

  return {
    plan,
    interval,
    currency,
    amountMinor: quote.amountMinor,
    displayAmount: quote.displayAmount,
    priceSuffix: quote.priceSuffix,
  };
}
