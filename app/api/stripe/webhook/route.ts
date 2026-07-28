import { NextResponse } from "next/server";
import { recordPayment } from "@/lib/billing/payments";
import { activateSubscriptionFromPayment } from "@/lib/subscription";
import {
  enrichStripePaymentFromInvoice,
  fetchStripeSubscriptionMetadata,
  isStripeWebhookConfigured,
  parseStripeCheckoutSession,
  verifyStripeWebhookSignature,
  type StripeCheckoutSession,
  type StripeInvoice,
} from "@/lib/stripe/webhook";

export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!verifyStripeWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: unknown } };
  try {
    event = JSON.parse(payload) as { type?: string; data?: { object?: unknown } };
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object as StripeCheckoutSession;
      const parsed = parseStripeCheckoutSession(session);
      if (!parsed) {
        return NextResponse.json({ received: true, skipped: true });
      }

      const activation = await activateSubscriptionFromPayment({
        userId: parsed.userId,
        email: parsed.email,
        plan: parsed.plan,
        paymentId: parsed.stripePaymentId,
        orderId: parsed.stripeSubscriptionId ?? session.id,
        purchaseDate: parsed.purchaseDate,
      });

      await recordPayment({
        userId: parsed.userId,
        email: parsed.email,
        plan: parsed.plan,
        amount: parsed.amountPaidMinor,
        currency: parsed.currency,
        amountUsdMinor: parsed.amountUsdMinor,
        exchangeRate: parsed.exchangeRate,
        provider: "stripe",
        stripePaymentId: parsed.stripePaymentId,
        stripeInvoiceId: parsed.stripeInvoiceId,
        stripeSubscriptionId: parsed.stripeSubscriptionId,
        billingInterval: parsed.billingInterval,
        status: "success",
        createdAt: parsed.purchaseDate,
      });

      return NextResponse.json({
        received: true,
        activated: activation.activated,
        alreadyProcessed: activation.alreadyProcessed,
      });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data?.object as StripeInvoice;

      if (invoice.billing_reason === "subscription_create") {
        return NextResponse.json({ received: true, skipped: true });
      }

      let metadata = invoice.metadata ?? {};
      if (
        !metadata.user_id &&
        typeof invoice.subscription === "string"
      ) {
        const subscriptionMetadata = await fetchStripeSubscriptionMetadata(
          invoice.subscription,
          stripeSecretKey
        );
        metadata = { ...metadata, ...subscriptionMetadata };
      }

      const parsed = await enrichStripePaymentFromInvoice(
        { ...invoice, metadata },
        stripeSecretKey
      );

      if (!parsed) {
        return NextResponse.json({ received: true, skipped: true });
      }

      await recordPayment({
        userId: parsed.userId,
        email: parsed.email,
        plan: parsed.plan,
        amount: parsed.amountPaidMinor,
        currency: parsed.currency,
        amountUsdMinor: parsed.amountUsdMinor,
        exchangeRate: parsed.exchangeRate,
        provider: "stripe",
        stripePaymentId: parsed.stripePaymentId,
        stripeInvoiceId: parsed.stripeInvoiceId,
        stripeSubscriptionId: parsed.stripeSubscriptionId,
        billingInterval: parsed.billingInterval,
        status: "success",
        createdAt: parsed.purchaseDate,
      });

      return NextResponse.json({ received: true, renewal: true });
    }

    return NextResponse.json({ received: true, ignored: event.type });
  } catch (error) {
    console.error("[stripe/webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}
