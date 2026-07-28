import type { PaidPlanId } from "@/lib/billing/plans";
import type { BillingInterval } from "@/lib/billing/pricing";
import {
  computeExchangeRate,
  formatPaymentCurrency,
  getPaidPlanAmountMinor,
  PLAN_CURRENCY,
} from "@/lib/billing/pricing";

export type PaymentProvider = "razorpay" | "stripe";

export type PaymentStatus = "success" | "failed" | "refunded";

export type PaymentRow = {
  id: string;
  user_id: string;
  email: string | null;
  plan: PaidPlanId;
  amount: number;
  currency: string;
  amount_usd_minor: number | null;
  exchange_rate: number | null;
  provider: PaymentProvider;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  stripe_payment_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  status: PaymentStatus;
  billing_interval: BillingInterval | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  email: string | null;
  plan: PaidPlanId;
  amount: number;
  currency: string;
  amountUsdMinor: number | null;
  exchangeRate: number | null;
  provider: PaymentProvider;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  stripePaymentId: string | null;
  stripeInvoiceId: string | null;
  stripeSubscriptionId: string | null;
  status: PaymentStatus;
  billingInterval: BillingInterval | null;
  createdAt: string;
  updatedAt: string;
};

export type RecordPaymentInput = {
  userId: string;
  email?: string | null;
  plan: PaidPlanId;
  amount: number;
  currency: string;
  amountUsdMinor?: number | null;
  exchangeRate?: number | null;
  provider: PaymentProvider;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  stripePaymentId?: string | null;
  stripeInvoiceId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: PaymentStatus;
  billingInterval?: BillingInterval;
  createdAt?: string;
};

function isPaidPlanValue(value: string): value is PaidPlanId {
  return value === "starter" || value === "pro";
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return value === "success" || value === "failed" || value === "refunded";
}

function isPaymentProvider(value: string): value is PaymentProvider {
  return value === "razorpay" || value === "stripe";
}

function isBillingInterval(value: string | null): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

export function resolveAmountUsdMinor(
  plan: PaidPlanId,
  billingInterval: BillingInterval | null | undefined,
  override?: number | null
): number {
  if (typeof override === "number" && override >= 0) {
    return override;
  }
  return getPaidPlanAmountMinor(plan, billingInterval ?? "monthly");
}

export function resolveExchangeRate(
  amountPaidMinor: number,
  amountUsdMinor: number,
  override?: number | null
): number | null {
  if (typeof override === "number" && override > 0) {
    return override;
  }
  if (amountPaidMinor === amountUsdMinor) {
    return 1;
  }
  return computeExchangeRate(amountPaidMinor, amountUsdMinor);
}

export function paymentFromRow(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    amountUsdMinor: row.amount_usd_minor,
    exchangeRate: row.exchange_rate,
    provider: row.provider,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpayOrderId: row.razorpay_order_id,
    stripePaymentId: row.stripe_payment_id,
    stripeInvoiceId: row.stripe_invoice_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    billingInterval: row.billing_interval,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatPaymentAmount(
  amountMinor: number,
  currency: string
): string {
  return formatPaymentCurrency(amountMinor, currency);
}

export function paymentInvoiceLabel(
  payment: {
    provider?: PaymentProvider;
    razorpayPaymentId?: string | null;
    stripePaymentId?: string | null;
    stripeInvoiceId?: string | null;
  }
): string {
  const reference =
    payment.stripeInvoiceId ??
    payment.stripePaymentId ??
    payment.razorpayPaymentId ??
    "UNKNOWN";
  return `INV-${reference.slice(-8).toUpperCase()}`;
}

export function normalizePaymentRow(
  row: Record<string, unknown>
): PaymentRow | null {
  const plan = typeof row.plan === "string" ? row.plan : "";
  const status = typeof row.status === "string" ? row.status : "";
  const currency = typeof row.currency === "string" ? row.currency : "";
  const provider = typeof row.provider === "string" ? row.provider : "razorpay";

  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.amount !== "number" ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string" ||
    !isPaidPlanValue(plan) ||
    !isPaymentStatus(status) ||
    !currency ||
    !isPaymentProvider(provider)
  ) {
    return null;
  }

  const billingInterval =
    typeof row.billing_interval === "string" &&
    isBillingInterval(row.billing_interval)
      ? row.billing_interval
      : null;

  return {
    id: row.id,
    user_id: row.user_id,
    email: typeof row.email === "string" ? row.email : null,
    plan,
    amount: row.amount,
    currency,
    amount_usd_minor:
      typeof row.amount_usd_minor === "number" ? row.amount_usd_minor : null,
    exchange_rate:
      typeof row.exchange_rate === "number" ? row.exchange_rate : null,
    provider,
    razorpay_payment_id:
      typeof row.razorpay_payment_id === "string"
        ? row.razorpay_payment_id
        : null,
    razorpay_order_id:
      typeof row.razorpay_order_id === "string" ? row.razorpay_order_id : null,
    stripe_payment_id:
      typeof row.stripe_payment_id === "string" ? row.stripe_payment_id : null,
    stripe_invoice_id:
      typeof row.stripe_invoice_id === "string" ? row.stripe_invoice_id : null,
    stripe_subscription_id:
      typeof row.stripe_subscription_id === "string"
        ? row.stripe_subscription_id
        : null,
    status,
    billing_interval: billingInterval,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function providerIdempotencyFilter(input: RecordPaymentInput) {
  if (input.provider === "stripe") {
    if (input.stripeInvoiceId) {
      return { column: "stripe_invoice_id", value: input.stripeInvoiceId };
    }
    if (input.stripePaymentId) {
      return { column: "stripe_payment_id", value: input.stripePaymentId };
    }
  }

  if (input.razorpayPaymentId) {
    return { column: "razorpay_payment_id", value: input.razorpayPaymentId };
  }

  return null;
}

/**
 * Idempotent payment ledger write. Safe for verify + webhook duplicate delivery.
 */
export async function recordPayment(
  input: RecordPaymentInput
): Promise<PaymentRecord | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const now = input.createdAt ?? new Date().toISOString();
  const status = input.status ?? "success";
  const amountUsdMinor = resolveAmountUsdMinor(
    input.plan,
    input.billingInterval,
    input.amountUsdMinor
  );
  const exchangeRate = resolveExchangeRate(
    input.amount,
    amountUsdMinor,
    input.exchangeRate
  );

  const writePayload = {
    user_id: input.userId,
    email: input.email ?? null,
    plan: input.plan,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    amount_usd_minor: amountUsdMinor,
    exchange_rate: exchangeRate,
    provider: input.provider,
    razorpay_payment_id: input.razorpayPaymentId ?? null,
    razorpay_order_id: input.razorpayOrderId ?? null,
    stripe_payment_id: input.stripePaymentId ?? null,
    stripe_invoice_id: input.stripeInvoiceId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    status,
    billing_interval: input.billingInterval ?? null,
    updated_at: now,
  };

  const idempotency = providerIdempotencyFilter(input);

  let existing: { id: string; amount: number } | null = null;
  if (idempotency) {
    const { data, error } = await admin
      .from("payments")
      .select("id, amount")
      .eq(idempotency.column, idempotency.value)
      .maybeSingle();

    if (error) {
      console.error("[payments] Failed to look up existing payment:", error.message);
      return null;
    }
    existing = data;
  }

  let data: Record<string, unknown> | null = null;
  let writeError: { message: string } | null = null;

  if (existing && idempotency) {
    const result = await admin
      .from("payments")
      .update(writePayload)
      .eq(idempotency.column, idempotency.value)
      .select("*")
      .single();

    data = result.data as Record<string, unknown> | null;
    writeError = result.error;
  } else {
    const result = await admin
      .from("payments")
      .insert({
        ...writePayload,
        created_at: now,
      })
      .select("*")
      .single();

    data = result.data as Record<string, unknown> | null;
    writeError = result.error;
  }

  if (writeError || !data) {
    console.error(
      "[payments] Failed to record payment:",
      writeError?.message ?? "No data returned"
    );
    return null;
  }

  const normalized = normalizePaymentRow(data);
  return normalized ? paymentFromRow(normalized) : null;
}

export async function listUserPayments(
  userId: string,
  options: { successOnly?: boolean } = {}
): Promise<PaymentRecord[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  let query = admin
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.successOnly) {
    query = query.eq("status", "success");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[payments] Failed to list user payments:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizePaymentRow(row as Record<string, unknown>))
    .filter((row): row is PaymentRow => row !== null)
    .map(paymentFromRow);
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentRecord | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const normalized = normalizePaymentRow(data as Record<string, unknown>);
  return normalized ? paymentFromRow(normalized) : null;
}

export { PLAN_CURRENCY };
