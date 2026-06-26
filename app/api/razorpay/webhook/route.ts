import { NextResponse } from "next/server";
import { isPaidPlan } from "@/lib/billing/plans";
import { verifyWebhookSignature } from "@/lib/razorpay";
import {
  activateSubscription,
  hasProcessedPayment,
} from "@/lib/subscription";
import { createAdminClient } from "@/lib/supabase/admin";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

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

  if (!payment?.id) {
    return NextResponse.json({ received: true });
  }

  if (event === "payment.failed") {
    return NextResponse.json({ received: true });
  }

  if (event !== "payment.captured" || payment.status !== "captured") {
    return NextResponse.json({ received: true });
  }

  const userId = payment.notes?.user_id;
  const plan = payment.notes?.plan;

  if (!userId || typeof plan !== "string" || !isPaidPlan(plan)) {
    return NextResponse.json({ received: true });
  }

  if (await hasProcessedPayment(payment.id)) {
    return NextResponse.json({ received: true });
  }

  try {
    await activateSubscription({
      userId,
      email: payment.notes?.email ?? null,
      plan,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Webhook subscription activation error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}
