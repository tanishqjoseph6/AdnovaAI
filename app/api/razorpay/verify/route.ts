import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  assertOrderMatchesUserPlan,
  assertPaymentMatchesOrder,
  PaymentVerificationError,
} from "@/lib/billing/payment-verification";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingCurrency, BillingInterval } from "@/lib/billing/pricing";
import { createRazorpayClient, verifyPaymentSignature } from "@/lib/razorpay";
import { recordPayment } from "@/lib/billing/payments";
import { activateSubscriptionFromPayment } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/razorpay/verify
 *
 * Checkout success handler (primary path). The browser sends Razorpay's
 * order_id, payment_id and signature after Checkout closes — we never trust
 * plan or amount from the client.
 *
 * Flow:
 * 1. Authenticate the Supabase user.
 * 2. Verify Razorpay HMAC signature (order_id|payment_id) — works in Test & Live mode.
 * 3. Fetch payment + order from Razorpay API and validate amount, status, notes.
 * 4. Atomically upgrade profiles via Postgres (idempotent for duplicate callbacks).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const body = await request.json();
    const {
      plan,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = body ?? {};

    if (
      !isPaidPlan(plan) ||
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payment verification payload" },
        { status: 400 }
      );
    }

    // Step 1: cryptographic proof the callback came from Razorpay
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json(
        { error: "Payment verification failed. Please contact support." },
        { status: 400 }
      );
    }

    const razorpay = createRazorpayClient();

    // Step 2: fetch authoritative payment + order from Razorpay (never trust frontend)
    const [payment, order] = await Promise.all([
      razorpay.payments.fetch(paymentId),
      razorpay.orders.fetch(orderId),
    ]);

    const orderNotes = order.notes as Record<string, string | undefined>;
    const interval: BillingInterval =
      orderNotes?.interval === "yearly" ? "yearly" : "monthly";

    assertPaymentMatchesOrder(
      {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        notes: payment.notes as Record<string, string | undefined>,
      },
      orderId,
      plan,
      user.id,
      interval
    );

    assertOrderMatchesUserPlan(
      {
        id: order.id,
        amount: order.amount,
        status: order.status,
        notes: orderNotes,
      },
      user.id,
      plan,
      interval
    );

    // Step 3: atomic profile upgrade (safe if webhook already processed this payment)
    const activation = await activateSubscriptionFromPayment({
      userId: user.id,
      email: user.email,
      plan,
      paymentId,
      orderId,
    });

    if (
      activation.alreadyProcessed &&
      activation.userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Payment is already linked to another account." },
        { status: 409 }
      );
    }

    await recordPayment({
      userId: user.id,
      email: user.email,
      plan,
      amount: Number(payment.amount),
      currency: (payment.currency?.toUpperCase() === "USD" ? "USD" : "INR") as BillingCurrency,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      status: "success",
      billingInterval: interval,
    });

    return NextResponse.json({
      success: true,
      plan: activation.plan,
      alreadyProcessed: activation.alreadyProcessed,
    });
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Verify Razorpay payment error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to verify payment. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
