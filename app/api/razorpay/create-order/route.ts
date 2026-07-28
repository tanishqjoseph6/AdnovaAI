import { NextResponse } from "next/server";

/**
 * POST /api/razorpay/create-order
 *
 * Legacy Razorpay checkout — disabled. All new subscriptions use Stripe USD checkout.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy Razorpay checkout is no longer available. Please upgrade via Stripe on the Billing page.",
    },
    { status: 410 }
  );
}
