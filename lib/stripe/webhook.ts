import crypto from "crypto";
import type { PaidPlanId } from "@/lib/billing/plans";
import { isPaidPlan } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import {
  computeExchangeRate,
  getPaidPlanAmountMinor,
  PLAN_CURRENCY,
} from "@/lib/billing/pricing";

export function isStripeWebhookConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
  );
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  const parts = signatureHeader.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    },
    {}
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

type StripeMetadata = Record<string, string | undefined>;

export type StripeCheckoutSession = {
  id: string;
  mode?: string;
  payment_status?: string;
  status?: string;
  currency?: string | null;
  amount_total?: number | null;
  customer_email?: string | null;
  subscription?: string | null;
  invoice?: string | null;
  payment_intent?: string | null;
  metadata?: StripeMetadata;
};

export type StripeInvoice = {
  id: string;
  billing_reason?: string | null;
  currency?: string | null;
  amount_paid?: number | null;
  status?: string | null;
  customer_email?: string | null;
  subscription?: string | null;
  payment_intent?: string | null;
  charge?: string | null;
  metadata?: StripeMetadata;
};

export type StripeCharge = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  balance_transaction?: string | null;
};

export type StripeBalanceTransaction = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  exchange_rate?: number | null;
};

export type ParsedStripePayment = {
  userId: string;
  email: string | null;
  plan: PaidPlanId;
  billingInterval: BillingInterval;
  amountPaidMinor: number;
  currency: string;
  amountUsdMinor: number;
  exchangeRate: number | null;
  stripePaymentId: string;
  stripeInvoiceId: string | null;
  stripeSubscriptionId: string | null;
  purchaseDate: string;
};

function parseBillingInterval(value: string | undefined): BillingInterval {
  return value === "yearly" ? "yearly" : "monthly";
}

function parsePlanMetadata(metadata: StripeMetadata | undefined): {
  userId: string;
  plan: PaidPlanId;
  billingInterval: BillingInterval;
} | null {
  const userId = metadata?.user_id;
  const plan = metadata?.plan;
  if (!userId || typeof plan !== "string" || !isPaidPlan(plan)) {
    return null;
  }

  return {
    userId,
    plan,
    billingInterval: parseBillingInterval(metadata?.interval),
  };
}

export function parseStripeCheckoutSession(
  session: StripeCheckoutSession
): ParsedStripePayment | null {
  const parsed = parsePlanMetadata(session.metadata);
  if (!parsed) {
    return null;
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return null;
  }

  const amountPaidMinor = session.amount_total ?? 0;
  const currency = (session.currency ?? PLAN_CURRENCY).toUpperCase();
  const amountUsdMinor = getPaidPlanAmountMinor(
    parsed.plan,
    parsed.billingInterval
  );

  const stripePaymentId =
    session.payment_intent ?? session.invoice ?? session.id;

  return {
    userId: parsed.userId,
    email: session.customer_email ?? null,
    plan: parsed.plan,
    billingInterval: parsed.billingInterval,
    amountPaidMinor,
    currency,
    amountUsdMinor,
    exchangeRate:
      currency === PLAN_CURRENCY
        ? 1
        : computeExchangeRate(amountPaidMinor, amountUsdMinor),
    stripePaymentId,
    stripeInvoiceId: session.invoice ?? null,
    stripeSubscriptionId: session.subscription ?? null,
    purchaseDate: new Date().toISOString(),
  };
}

export async function enrichStripePaymentFromInvoice(
  invoice: StripeInvoice,
  stripeSecretKey: string
): Promise<ParsedStripePayment | null> {
  const parsed = parsePlanMetadata(invoice.metadata);
  if (!parsed) {
    return null;
  }

  if (invoice.status !== "paid") {
    return null;
  }

  const amountPaidMinor = invoice.amount_paid ?? 0;
  const currency = (invoice.currency ?? PLAN_CURRENCY).toUpperCase();
  const amountUsdMinor = getPaidPlanAmountMinor(
    parsed.plan,
    parsed.billingInterval
  );

  let exchangeRate: number | null =
    currency === PLAN_CURRENCY
      ? 1
      : computeExchangeRate(amountPaidMinor, amountUsdMinor);

  if (invoice.charge && currency !== PLAN_CURRENCY) {
    try {
      const chargeResponse = await fetch(
        `https://api.stripe.com/v1/charges/${invoice.charge}?expand[]=balance_transaction`,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (chargeResponse.ok) {
        const charge = (await chargeResponse.json()) as Record<string, unknown>;
        const balanceTx = charge.balance_transaction;
        if (
          balanceTx &&
          typeof balanceTx === "object" &&
          "exchange_rate" in balanceTx &&
          typeof (balanceTx as StripeBalanceTransaction).exchange_rate ===
            "number" &&
          (balanceTx as StripeBalanceTransaction).exchange_rate! > 0
        ) {
          exchangeRate = (balanceTx as StripeBalanceTransaction).exchange_rate!;
        }
      }
    } catch (error) {
      console.warn("[stripe] Failed to fetch charge exchange rate:", error);
    }
  }

  const stripePaymentId =
    invoice.payment_intent ?? invoice.charge ?? invoice.id;

  return {
    userId: parsed.userId,
    email: invoice.customer_email ?? null,
    plan: parsed.plan,
    billingInterval: parsed.billingInterval,
    amountPaidMinor,
    currency,
    amountUsdMinor,
    exchangeRate,
    stripePaymentId,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId:
      typeof invoice.subscription === "string" ? invoice.subscription : null,
    purchaseDate: new Date().toISOString(),
  };
}

export async function fetchStripeSubscriptionMetadata(
  subscriptionId: string,
  stripeSecretKey: string
): Promise<StripeMetadata | null> {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const subscription = (await response.json()) as { metadata?: StripeMetadata };
  return subscription.metadata ?? null;
}
