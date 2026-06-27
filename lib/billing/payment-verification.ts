import type { PaidPlanId } from "@/lib/billing/plans";
import {
  getPaidPlanAmountMinor,
  type BillingCurrency,
  type BillingInterval,
} from "@/lib/billing/pricing";

export class PaymentVerificationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PaymentVerificationError";
    this.statusCode = statusCode;
  }
}

type RazorpayNotes = Record<string, string | undefined>;

export type RazorpayOrderEntity = {
  id: string;
  amount: number | string;
  status: string;
  notes?: RazorpayNotes;
};

export type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number | string;
  status: string;
  notes?: RazorpayNotes;
};

function noteValue(notes: RazorpayNotes | undefined, key: string): string | undefined {
  const value = notes?.[key];
  return typeof value === "string" ? value : undefined;
}

function assertAmountMatchesPlan(
  amount: number | string,
  plan: PaidPlanId,
  label: string,
  interval: BillingInterval = "monthly",
  currency: BillingCurrency = "INR"
): void {
  const expected = getPaidPlanAmountMinor(plan, interval, currency);
  if (Number(amount) !== expected) {
    throw new PaymentVerificationError(`${label} amount mismatch`, 400);
  }
}

/** Server-side validation of a Razorpay order (never trust the browser). */
export function assertOrderMatchesUserPlan(
  order: RazorpayOrderEntity,
  userId: string,
  plan: PaidPlanId,
  interval: BillingInterval = "monthly"
): void {
  const orderUserId = noteValue(order.notes, "user_id");
  const orderPlan = noteValue(order.notes, "plan");
  const orderInterval =
    (noteValue(order.notes, "interval") as BillingInterval | undefined) ??
    "monthly";

  if (orderUserId !== userId) {
    throw new PaymentVerificationError("Order does not belong to user", 403);
  }

  if (orderPlan !== plan) {
    throw new PaymentVerificationError("Plan mismatch for order", 400);
  }

  if (orderInterval !== interval) {
    throw new PaymentVerificationError("Billing interval mismatch for order", 400);
  }

  assertAmountMatchesPlan(order.amount, plan, "Order", interval, "INR");

  if (order.status !== "paid") {
    throw new PaymentVerificationError(
      "Payment has not been completed yet",
      400
    );
  }
}

/** Server-side validation of a captured Razorpay payment entity. */
export function assertPaymentMatchesOrder(
  payment: RazorpayPaymentEntity,
  orderId: string,
  plan: PaidPlanId,
  userId?: string,
  interval: BillingInterval = "monthly"
): void {
  if (payment.order_id !== orderId) {
    throw new PaymentVerificationError("Payment order mismatch", 400);
  }

  if (payment.status !== "captured") {
    throw new PaymentVerificationError("Payment not captured", 400);
  }

  assertAmountMatchesPlan(payment.amount, plan, "Payment", interval, "INR");

  if (userId) {
    const paymentUserId = noteValue(payment.notes, "user_id");
    if (paymentUserId && paymentUserId !== userId) {
      throw new PaymentVerificationError("Payment does not belong to user", 403);
    }

    const paymentPlan = noteValue(payment.notes, "plan");
    if (paymentPlan && paymentPlan !== plan) {
      throw new PaymentVerificationError("Plan mismatch for payment", 400);
    }
  }
}

/** Webhook payloads include payment notes; validate before activating. */
export function assertWebhookPaymentEntity(
  payment: RazorpayPaymentEntity,
  plan: PaidPlanId,
  interval: BillingInterval = "monthly"
): { userId: string; email: string | null } {
  const userId = noteValue(payment.notes, "user_id");
  const paymentPlan = noteValue(payment.notes, "plan");

  if (!userId) {
    throw new PaymentVerificationError("Missing user_id in payment notes", 400);
  }

  if (paymentPlan !== plan) {
    throw new PaymentVerificationError("Plan mismatch for payment", 400);
  }

  if (payment.status !== "captured") {
    throw new PaymentVerificationError("Payment not captured", 400);
  }

  assertAmountMatchesPlan(payment.amount, plan, "Payment", interval, "INR");

  return {
    userId,
    email: noteValue(payment.notes, "email") ?? null,
  };
}
