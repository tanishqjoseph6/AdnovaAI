import type { PaidPlanId } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";

/**
 * Legacy Razorpay INR amounts (paise) — used only to verify historical
 * Razorpay transactions. New checkout uses Stripe USD pricing.
 */
const LEGACY_RAZORPAY_INR: Record<
  PaidPlanId,
  Record<BillingInterval, number>
> = {
  starter: { monthly: 99900, yearly: 959000 },
  pro: { monthly: 299900, yearly: 2879000 },
};

export function getLegacyRazorpayAmountMinor(
  plan: PaidPlanId,
  interval: BillingInterval = "monthly"
): number {
  return LEGACY_RAZORPAY_INR[plan][interval];
}
