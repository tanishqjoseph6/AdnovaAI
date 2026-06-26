import { NextResponse } from "next/server";
import { isPaidPlan, PLANS } from "@/lib/billing/plans";
import { createPlanOrder } from "@/lib/razorpay";
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
    const planId = body?.plan;

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const order = await createPlanOrder(planId, user.id, user.email);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: planId,
      planName: PLANS[planId].name,
      keyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      prefill: {
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? "",
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
