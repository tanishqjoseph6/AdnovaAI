import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { findCreditPack } from "@/lib/credits/purchase";
import { completeCreditPurchase } from "@/lib/credits/server";
import {
  createRazorpayClient,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/razorpay/verify-credit-purchase
 * Verifies Razorpay payment and grants purchased credits.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const body = (await request.json()) as {
      credits?: unknown;
      purchaseId?: unknown;
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
    };

    const credits =
      typeof body.credits === "number" ? body.credits : Number(body.credits);
    const purchaseId =
      typeof body.purchaseId === "string" ? body.purchaseId : "";
    const orderId =
      typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId =
      typeof body.razorpay_payment_id === "string"
        ? body.razorpay_payment_id
        : "";
    const signature =
      typeof body.razorpay_signature === "string"
        ? body.razorpay_signature
        : "";

    const pack = findCreditPack(credits);

    if (!pack || !purchaseId || !orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Invalid credit purchase verification payload." },
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

    if (payment.order_id !== orderId || payment.status !== "captured") {
      return NextResponse.json(
        { error: "Payment was not captured successfully." },
        { status: 400 }
      );
    }

    if (payment.amount !== pack.priceInr * 100) {
      return NextResponse.json(
        { error: "Payment amount does not match the selected credit pack." },
        { status: 400 }
      );
    }

    const notes = order.notes as Record<string, string | undefined>;
    if (
      notes?.type !== "credit_pack" ||
      notes?.user_id !== user.id ||
      Number(notes?.credits_amount) !== pack.credits
    ) {
      return NextResponse.json(
        { error: "Order metadata does not match this credit pack." },
        { status: 400 }
      );
    }

    const result = await completeCreditPurchase(
      purchaseId,
      paymentId,
      user.id,
      orderId
    );

    return NextResponse.json({
      success: true,
      credits: result.currentCredits,
      purchasedCredits: result.purchasedCredits,
      packCredits: pack.credits,
    });
  } catch (error) {
    console.error("Verify credit purchase error:", error);
    return NextResponse.json(
      { error: "Failed to verify credit purchase. Please contact support." },
      { status: 500 }
    );
  }
}
