import { NextResponse } from "next/server";
import { isPaidPlan } from "@/lib/billing/plans";
import { createRazorpayClient, verifyPaymentSignature } from "@/lib/razorpay";
import {
  activateSubscription,
  hasProcessedPayment,
} from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!(verifyPaymentSignature(orderId, paymentId, signature))) {
      return NextResponse.json(
        { error: "Payment verification failed. Please contact support." },
        { status: 400 }
      );
    }

    if (await hasProcessedPayment(paymentId)) {
      return NextResponse.json({
        success: true,
        plan,
        message: "Payment already processed",
      });
    }

    const razorpay = createRazorpayClient();
    const order = await razorpay.orders.fetch(orderId);

    if (order.notes?.user_id !== user.id) {
      return NextResponse.json({ error: "Order does not belong to user" }, {
        status: 403,
      });
    }

    if (order.notes?.plan !== plan) {
      return NextResponse.json({ error: "Plan mismatch for order" }, {
        status: 400,
      });
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not been completed yet" },
        { status: 400 }
      );
    }

    await activateSubscription({
      userId: user.id,
      email: user.email,
      plan,
      paymentId,
    });

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment. Please try again or contact support." },
      { status: 500 }
    );
  }
}
