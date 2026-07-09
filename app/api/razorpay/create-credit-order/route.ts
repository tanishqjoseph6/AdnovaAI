import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { findCreditPack } from "@/lib/credits/purchase";
import { createPendingCreditPurchase } from "@/lib/credits/server";
import {
  createCreditPackOrder,
  getPublicRazorpayKeyId,
  getRazorpayConfigDiagnostics,
  RazorpayConfigError,
} from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/razorpay/create-credit-order
 * Creates a Razorpay order for a one-time credit pack purchase.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const body = (await request.json()) as { credits?: unknown };
    const credits =
      typeof body.credits === "number" ? body.credits : Number(body.credits);
    const pack = findCreditPack(credits);

    if (!pack) {
      return NextResponse.json(
        { error: "Invalid credit pack." },
        { status: 400 }
      );
    }

    const order = await createCreditPackOrder(
      pack.credits,
      pack.priceInr,
      user.id,
      user.email
    );

    const purchase = await createPendingCreditPurchase({
      userId: user.id,
      creditsAmount: pack.credits,
      amountPaid: pack.priceInr,
      currency: "INR",
      orderId: order.id,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      credits: pack.credits,
      purchaseId: purchase.id,
      label: pack.label,
      keyId: getPublicRazorpayKeyId(),
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
    console.error("Create credit pack order error:", error);

    if (error instanceof RazorpayConfigError) {
      return NextResponse.json(
        {
          error: "Razorpay is not configured correctly.",
          diagnostics: getRazorpayConfigDiagnostics(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create credit pack order. Please try again." },
      { status: 500 }
    );
  }
}
