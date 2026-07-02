import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { isPaidPlan, PLANS } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import {
  createPlanOrder,
  getPublicRazorpayKeyId,
  getRazorpayConfigDiagnostics,
  RazorpayConfigError,
} from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

function getRazorpayErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const record = error as {
    statusCode?: unknown;
    status?: unknown;
    error?: { code?: unknown };
  };

  if (typeof record.statusCode === "number") {
    return record.statusCode;
  }

  if (typeof record.status === "number") {
    return record.status;
  }

  if (record.error?.code === "BAD_REQUEST_ERROR") {
    return 400;
  }

  return null;
}

function logCreateOrderError(error: unknown) {
  const diagnostics = getRazorpayConfigDiagnostics();

  if (error && typeof error === "object") {
    const record = error as {
      name?: unknown;
      message?: unknown;
      statusCode?: unknown;
      error?: unknown;
    };
    console.error("Create Razorpay order error:", {
      name: record.name,
      message: record.message,
      statusCode: record.statusCode,
      razorpayError: record.error,
      diagnostics,
    });
    return;
  }

  console.error("Create Razorpay order error:", {
    message: String(error),
    diagnostics,
  });
}

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
    logCreateOrderError(error);

    if (error instanceof RazorpayConfigError) {
      return NextResponse.json(
        {
          error:
            "Razorpay is not configured correctly. Check live key environment variables and redeploy.",
          diagnostics: getRazorpayConfigDiagnostics(),
        },
        { status: 500 }
      );
    }

    const status = getRazorpayErrorStatus(error);
    if (status === 401) {
      return NextResponse.json(
        {
          error:
            "Razorpay authentication failed. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are from the same LIVE key pair, and NEXT_PUBLIC_RAZORPAY_KEY_ID matches RAZORPAY_KEY_ID.",
          diagnostics: getRazorpayConfigDiagnostics(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
