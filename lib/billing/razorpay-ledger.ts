import { PaymentVerificationError } from "@/lib/billing/payment-verification";
import { isPaidPlan, type PaidPlanId } from "@/lib/billing/plans";
import type { BillingCurrency, BillingInterval } from "@/lib/billing/pricing";

type RazorpayAmountSource = {
  amount?: number | string | null;
};

type RazorpayOrderNotes = Record<string, string | undefined>;

export type VerifiedRazorpayPaymentDetails = {
  amountMinor: number;
  currency: BillingCurrency;
  plan: PaidPlanId;
  billingInterval: BillingInterval;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  email: string | null;
  userId: string;
};

/** Razorpay amounts are always in the smallest currency unit (paise/cents). */
export function parseRazorpayAmountMinor(
  amount: number | string | null | undefined,
  label: string
): number {
  if (amount == null || amount === "") {
    throw new PaymentVerificationError(`Missing ${label} amount`, 400);
  }

  const parsed =
    typeof amount === "string" ? Number.parseInt(amount, 10) : Math.trunc(amount);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new PaymentVerificationError(`Invalid ${label} amount`, 400);
  }

  return parsed;
}

/**
 * Prefer the captured payment amount from Razorpay and cross-check against the order.
 * Both values are in paise/cents (e.g. ₹999 → 99900, ₹2,999 → 299900).
 */
export function resolveVerifiedRazorpayAmountMinor(
  payment: RazorpayAmountSource,
  order: RazorpayAmountSource
): number {
  const paymentMinor = parseRazorpayAmountMinor(payment.amount, "payment");
  const orderMinor = parseRazorpayAmountMinor(order.amount, "order");

  if (paymentMinor !== orderMinor) {
    throw new PaymentVerificationError("Payment and order amount mismatch", 400);
  }

  return paymentMinor;
}

export function parseRazorpayCurrency(
  paymentCurrency: string | null | undefined,
  orderNotes?: RazorpayOrderNotes
): BillingCurrency {
  const fromPayment = paymentCurrency?.toUpperCase();
  if (fromPayment === "USD") return "USD";
  if (fromPayment === "INR") return "INR";

  const fromNotes = orderNotes?.currency?.toUpperCase();
  if (fromNotes === "USD") return "USD";

  return "INR";
}

export function parseRazorpayBillingInterval(
  orderNotes?: RazorpayOrderNotes
): BillingInterval {
  return orderNotes?.interval === "yearly" ? "yearly" : "monthly";
}

export function extractVerifiedPaymentDetails(input: {
  payment: RazorpayAmountSource & {
    id: string;
    order_id: string;
    currency?: string | null;
    notes?: RazorpayOrderNotes;
  };
  order: RazorpayAmountSource & {
    id: string;
    notes?: RazorpayOrderNotes;
  };
  fallbackEmail?: string | null;
}): VerifiedRazorpayPaymentDetails {
  const orderNotes = input.order.notes ?? {};
  const paymentNotes = input.payment.notes ?? {};
  const planValue = orderNotes.plan ?? paymentNotes.plan;

  if (typeof planValue !== "string" || !isPaidPlan(planValue)) {
    throw new PaymentVerificationError("Missing or invalid plan in Razorpay metadata", 400);
  }

  const userId = orderNotes.user_id ?? paymentNotes.user_id;
  if (typeof userId !== "string" || !userId) {
    throw new PaymentVerificationError("Missing user_id in Razorpay metadata", 400);
  }

  if (input.payment.order_id !== input.order.id) {
    throw new PaymentVerificationError("Payment order mismatch", 400);
  }

  const amountMinor = resolveVerifiedRazorpayAmountMinor(input.payment, input.order);

  return {
    amountMinor,
    currency: parseRazorpayCurrency(input.payment.currency, orderNotes),
    plan: planValue,
    billingInterval: parseRazorpayBillingInterval(orderNotes),
    razorpayPaymentId: input.payment.id,
    razorpayOrderId: input.order.id,
    email: orderNotes.email ?? paymentNotes.email ?? input.fallbackEmail ?? null,
    userId,
  };
}
