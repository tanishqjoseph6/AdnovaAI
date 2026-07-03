import { NextResponse } from "next/server";
import {
  assertWebhookPaymentEntity,
  PaymentVerificationError,
} from "@/lib/billing/payment-verification";
import { recordPayment } from "@/lib/billing/payments";
import { extractVerifiedPaymentDetails } from "@/lib/billing/razorpay-ledger";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import { createRazorpayClient, verifyWebhookSignature } from "@/lib/razorpay";
import { activateSubscriptionFromPayment } from "@/lib/subscription";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number | string;
        currency?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

/**
 * POST /api/razorpay/webhook
 *
 * Backup activation path when the browser callback fails or the user closes
 * the tab before /api/razorpay/verify runs.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, {
      status: 400,
    });
  }

  let payload: RazorpayWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook body" }, { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (!paymentEntity?.id || !paymentEntity.order_id) {
    return NextResponse.json({ received: true });
  }

  const razorpay = createRazorpayClient();

  let payment;
  let order;

  try {
    [payment, order] = await Promise.all([
      razorpay.payments.fetch(paymentEntity.id),
      razorpay.orders.fetch(paymentEntity.order_id),
    ]);
  } catch (error) {
    console.error("[razorpay/webhook] Failed to fetch payment/order from Razorpay API:", error);
    return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 });
  }

  if (event === "payment.failed") {
    const plan = order.notes?.plan ?? payment.notes?.plan;
    const userId = order.notes?.user_id ?? payment.notes?.user_id;
    const email = order.notes?.email ?? payment.notes?.email;

    if (
      typeof plan === "string" &&
      isPaidPlan(plan) &&
      typeof userId === "string" &&
      payment.id &&
      payment.order_id
    ) {
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
          notes: order.notes as Record<string, string | undefined>,
        },
        fallbackEmail: typeof email === "string" ? email : null,
      });

      await recordPayment({
        userId: verified.userId,
        email: verified.email,
        plan: verified.plan,
        amount: verified.amountMinor,
        currency: verified.currency,
        razorpayPaymentId: verified.razorpayPaymentId,
        razorpayOrderId: verified.razorpayOrderId,
        status: "failed",
        billingInterval: verified.billingInterval,
      });
    }

    return NextResponse.json({ received: true });
  }

  if (event !== "payment.captured" || payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }

  const plan = order.notes?.plan ?? payment.notes?.plan;

  if (typeof plan !== "string" || !isPaidPlan(plan)) {
    return NextResponse.json({ received: true });
  }

  try {
    const interval: BillingInterval =
      order.notes?.interval === "yearly" ? "yearly" : "monthly";

    const { userId } = assertWebhookPaymentEntity(
      {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        notes: payment.notes as Record<string, string | undefined>,
      },
      plan,
      interval
    );

    if (order.notes?.user_id !== userId || order.notes?.plan !== plan) {
      return NextResponse.json(
        { error: "Webhook order metadata mismatch" },
        { status: 400 }
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json({ error: "Order is not paid" }, { status: 400 });
    }

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
        notes: order.notes as Record<string, string | undefined>,
      },
    });

    console.info("[razorpay/webhook] Verified Razorpay transaction", {
      razorpayPaymentId: verified.razorpayPaymentId,
      razorpayOrderId: verified.razorpayOrderId,
      amountMinor: verified.amountMinor,
      currency: verified.currency,
      plan: verified.plan,
      billingInterval: verified.billingInterval,
      userId: verified.userId,
    });

    await activateSubscriptionFromPayment({
      userId: verified.userId,
      email: verified.email,
      plan: verified.plan,
      paymentId: verified.razorpayPaymentId,
      orderId: verified.razorpayOrderId,
    });

    const recorded = await recordPayment({
      userId: verified.userId,
      email: verified.email,
      plan: verified.plan,
      amount: verified.amountMinor,
      currency: verified.currency,
      razorpayPaymentId: verified.razorpayPaymentId,
      razorpayOrderId: verified.razorpayOrderId,
      status: "success",
      billingInterval: verified.billingInterval,
    });

    if (!recorded) {
      console.error("[razorpay/webhook] Payment ledger write failed after verification", {
        razorpayPaymentId: verified.razorpayPaymentId,
        amountMinor: verified.amountMinor,
      });
    } else if (recorded.amount !== verified.amountMinor) {
      console.error("[razorpay/webhook] Stored amount does not match Razorpay transaction", {
        razorpayPaymentId: verified.razorpayPaymentId,
        razorpayAmountMinor: verified.amountMinor,
        storedAmountMinor: recorded.amount,
      });
    }
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      console.error("[razorpay/webhook] Payment validation error:", error.message);
      return NextResponse.json({ error: error.message }, {
        status: error.statusCode,
      });
    }

    console.error("[razorpay/webhook] Subscription activation error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}
