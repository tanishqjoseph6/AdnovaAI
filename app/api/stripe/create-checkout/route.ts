import { NextResponse } from "next/server";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingCurrency, BillingInterval } from "@/lib/billing/pricing";
import {
  getStripePriceMetadata,
  isStripeConfigured,
} from "@/lib/stripe/checkout";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/create-checkout
 *
 * Stripe-ready USD checkout. Requires STRIPE_SECRET_KEY and price IDs when
 * enabling live USD billing. Returns 503 until configured.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "USD checkout is not enabled yet. Please use INR billing or contact support.",
        },
        { status: 503 }
      );
    }

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
    const interval = (body?.interval ?? "monthly") as BillingInterval;
    const currency = (body?.currency ?? "USD") as BillingCurrency;

    if (!isPaidPlan(planId)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (currency !== "USD") {
      return NextResponse.json(
        { error: "Stripe checkout only supports USD." },
        { status: 400 }
      );
    }

    if (interval !== "monthly" && interval !== "yearly") {
      return NextResponse.json({ error: "Invalid billing interval" }, { status: 400 });
    }

    const priceMeta = getStripePriceMetadata(planId, interval, currency);

    // Price IDs map here when Stripe products are configured in the dashboard.
    const priceId = process.env[`STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`];

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "USD checkout is not fully configured. Please use INR billing for now.",
          metadata: priceMeta,
        },
        { status: 503 }
      );
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
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
          "metadata[user_id]": user.id,
          "metadata[plan]": planId,
          "metadata[interval]": interval,
          "metadata[currency]": currency,
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
      { error: "Failed to start USD checkout." },
      { status: 500 }
    );
  }
}
