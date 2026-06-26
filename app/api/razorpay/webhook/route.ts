import { NextResponse } from "next/server";
import {
  assertWebhookPaymentEntity,
  PaymentVerificationError,
} from "@/lib/billing/payment-verification";
import { isPaidPlan } from "@/lib/billing/plans";
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
 * the tab before /api/razorpay/verify runs. Razorpay retries webhooks, so
 * activation must be idempotent (handled in Postgres).
 *
 * Flow:
 * 1. Verify webhook HMAC (RAZORPAY_WEBHOOK_SECRET — set per Test/Live webhook in dashboard).
 * 2. On payment.captured, validate amount + notes from the event payload.
 * 3. Optionally cross-check the order via Razorpay API.
 * 4. Atomically upgrade profiles (same function as /verify).
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
  const payment = payload.payload?.payment?.entity;

  if (!payment?.id || !payment.order_id) {
    return NextResponse.json({ received: true });
  }

  if (event === "payment.failed") {
    return NextResponse.json({ received: true });
  }

  if (event !== "payment.captured" || payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }

  const plan = payment.notes?.plan;

  if (typeof plan !== "string" || !isPaidPlan(plan)) {
    return NextResponse.json({ received: true });
  }

  try {
    const { userId, email } = assertWebhookPaymentEntity(
      {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount ?? 0,
        status: payment.status,
        notes: payment.notes,
      },
      plan
    );

    // Cross-check order ownership and paid status via Razorpay API
    const razorpay = createRazorpayClient();
    const order = await razorpay.orders.fetch(payment.order_id);

    if (order.notes?.user_id !== userId || order.notes?.plan !== plan) {
      return NextResponse.json(
        { error: "Webhook order metadata mismatch" },
        { status: 400 }
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order is not paid" },
        { status: 400 }
      );
    }

    await activateSubscriptionFromPayment({
      userId,
      email,
      plan,
      paymentId: payment.id,
      orderId: payment.order_id,
    });
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      console.error("Webhook payment validation error:", error.message);
      return NextResponse.json({ error: error.message }, {
        status: error.statusCode,
      });
    }

    console.error("Webhook subscription activation error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}
