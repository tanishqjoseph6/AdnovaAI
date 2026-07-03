import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import {
  assertOrderMatchesUserPlan,
  assertPaymentMatchesOrder,
  PaymentVerificationError,
} from "@/lib/billing/payment-verification";
import { recordPayment } from "@/lib/billing/payments";
import { extractVerifiedPaymentDetails } from "@/lib/billing/razorpay-ledger";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import { createRazorpayClient, verifyPaymentSignature } from "@/lib/razorpay";
import { activateSubscriptionFromPayment } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/razorpay/verify
 *
 * Checkout success handler (primary path). The browser sends Razorpay's
 * order_id, payment_id and signature after Checkout closes — we never trust
 * plan or amount from the client.
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

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json(
        { error: "Payment verification failed. Please contact support." },
        { status: 400 }
      );
    }

    const razorpay = createRazorpayClient();
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

    const verified = extractVerifiedPaymentDetails({
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        notes: payment.notes as Record<string, string | undefined>,
      },
      order: {
        id: order.id,
        amount: order.amount,
        notes: orderNotes,
      },
      fallbackEmail: user.email,
    });

    console.info("[razorpay/verify] Verified Razorpay transaction", {
      razorpayPaymentId: verified.razorpayPaymentId,
      razorpayOrderId: verified.razorpayOrderId,
      amountMinor: verified.amountMinor,
      currency: verified.currency,
      plan: verified.plan,
      billingInterval: verified.billingInterval,
      userId: verified.userId,
    });

    const activation = await activateSubscriptionFromPayment({
      userId: user.id,
      email: user.email,
      plan: verified.plan,
      paymentId: verified.razorpayPaymentId,
      orderId: verified.razorpayOrderId,
    });

    if (activation.alreadyProcessed && activation.userId !== user.id) {
      return NextResponse.json(
        { error: "Payment is already linked to another account." },
        { status: 409 }
      );
    }

    const recorded = await recordPayment({
      userId: verified.userId,
      email: verified.email ?? user.email,
      plan: verified.plan,
      amount: verified.amountMinor,
      currency: verified.currency,
      razorpayPaymentId: verified.razorpayPaymentId,
      razorpayOrderId: verified.razorpayOrderId,
      status: "success",
      billingInterval: verified.billingInterval,
    });

    if (!recorded) {
      console.error("[razorpay/verify] Payment ledger write failed after verification", {
        razorpayPaymentId: verified.razorpayPaymentId,
        razorpayOrderId: verified.razorpayOrderId,
        amountMinor: verified.amountMinor,
      });
    } else if (recorded.amount !== verified.amountMinor) {
      console.error("[razorpay/verify] Stored amount does not match Razorpay transaction", {
        razorpayPaymentId: verified.razorpayPaymentId,
        razorpayAmountMinor: verified.amountMinor,
        storedAmountMinor: recorded.amount,
      });
    }

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

    console.error("[razorpay/verify] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to verify payment. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}
