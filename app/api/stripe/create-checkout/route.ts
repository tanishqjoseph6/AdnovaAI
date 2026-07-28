import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import {
  getStripePriceEnvKey,
  getStripePriceMetadata,
  isStripeConfigured,
} from "@/lib/stripe/checkout";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/create-checkout
 *
 * USD subscription checkout via Stripe. Adaptive Pricing converts to the
 * customer's local currency using Stripe's live exchange rate at payment time.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Checkout is temporarily unavailable. Please contact support@useadvora.com.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const body = await request.json();
    const planId = body?.plan;
    const interval = (body?.interval ?? "monthly") as BillingInterval;

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }

    const priceMeta = getStripePriceMetadata(planId, interval);
    const priceId = process.env[getStripePriceEnvKey(planId, interval)];

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Checkout is not fully configured. Please contact support@useadvora.com.",
          metadata: priceMeta,
        },
        { status: 503 }
      );
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const stripeResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          mode: "subscription",
          success_url: `${origin}/dashboard/billing?payment=success`,
          cancel_url: `${origin}/dashboard/billing?payment=cancelled`,
          "line_items[0][price]": priceId,
          "line_items[0][quantity]": "1",
          customer_email: user.email ?? "",
          "subscription_data[metadata][user_id]": user.id,
          "subscription_data[metadata][plan]": planId,
          "subscription_data[metadata][interval]": interval,
          "subscription_data[metadata][currency]": priceMeta.currency,
          "metadata[user_id]": user.id,
          "metadata[plan]": planId,
          "metadata[interval]": interval,
          "metadata[currency]": priceMeta.currency,
          "adaptive_pricing[enabled]": "true",
        }),
      }
    );

    const session = (await stripeResponse.json()) as {
      url?: string;
      error?: { message?: string };
    };

    if (!stripeResponse.ok || !session.url) {
      return NextResponse.json(
        {
          error:
            session.error?.message ??
            "Failed to create Stripe checkout session.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout." },
      { status: 500 }
    );
  }
}
