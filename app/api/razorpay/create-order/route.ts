import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { isPaidPlan, PLANS } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import { createPlanOrder } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/razorpay/create-order
 *
 * Step 1 of checkout: create a Razorpay order server-side with plan amount
 * and user metadata in notes. Test Mode and Live Mode use the same code path;
 * only RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET differ per environment.
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
    const planId = body?.plan;
    const interval = (body?.interval ?? "monthly") as BillingInterval;
    const currency = body?.currency ?? "INR";

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }

    if (currency !== "INR") {
      return NextResponse.json(
        { error: "Razorpay only supports INR. Use Stripe for USD checkout." },
        { status: 400 }
      );
    }

    const order = await createPlanOrder(
      planId,
      user.id,
      user.email,
      interval
    );

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      interval,
      planName: PLANS[planId].name,
      keyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      prefill: {
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? "",
        contact:
          user.phone ??
          (typeof user.user_metadata?.phone === "string"
            ? user.user_metadata.phone
            : ""),
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create payment order. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
