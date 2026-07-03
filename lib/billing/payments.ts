import type { PaidPlanId } from "@/lib/billing/plans";
import type { BillingCurrency, BillingInterval } from "@/lib/billing/pricing";
import { formatInr, formatUsd } from "@/lib/billing/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentStatus = "success" | "failed" | "refunded";

export type PaymentRow = {
  id: string;
  user_id: string;
  email: string | null;
  plan: PaidPlanId;
  amount: number;
  currency: BillingCurrency;
  razorpay_payment_id: string;
  razorpay_order_id: string;
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
  currency: BillingCurrency;
  razorpayPaymentId: string;
  razorpayOrderId: string;
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
  currency: BillingCurrency;
  razorpayPaymentId: string;
  razorpayOrderId: string;
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

function isBillingCurrency(value: string): value is BillingCurrency {
  return value === "INR" || value === "USD";
}

function isBillingInterval(value: string | null): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

export function paymentFromRow(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    razorpayPaymentId: row.razorpay_payment_id,
    razorpayOrderId: row.razorpay_order_id,
    status: row.status,
    billingInterval: row.billing_interval,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatPaymentAmount(
  amountMinor: number,
  currency: BillingCurrency
): string {
  const major = amountMinor / 100;
  return currency === "USD" ? formatUsd(major) : formatInr(major);
}

export function paymentInvoiceLabel(payment: Pick<PaymentRecord, "razorpayPaymentId">): string {
  return `INV-${payment.razorpayPaymentId.slice(-8).toUpperCase()}`;
}

export function normalizePaymentRow(row: Record<string, unknown>): PaymentRow | null {
  const plan = typeof row.plan === "string" ? row.plan : "";
  const status = typeof row.status === "string" ? row.status : "";
  const currency = typeof row.currency === "string" ? row.currency : "";

  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.amount !== "number" ||
    typeof row.razorpay_payment_id !== "string" ||
    typeof row.razorpay_order_id !== "string" ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string" ||
    !isPaidPlanValue(plan) ||
    !isPaymentStatus(status) ||
    !isBillingCurrency(currency)
  ) {
    return null;
  }

  const billingInterval =
    typeof row.billing_interval === "string" && isBillingInterval(row.billing_interval)
      ? row.billing_interval
      : null;

  return {
    id: row.id,
    user_id: row.user_id,
    email: typeof row.email === "string" ? row.email : null,
    plan,
    amount: row.amount,
    currency,
    razorpay_payment_id: row.razorpay_payment_id,
    razorpay_order_id: row.razorpay_order_id,
    status,
    billing_interval: billingInterval,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Idempotent payment ledger write. Safe for verify + webhook duplicate delivery.
 */
export async function recordPayment(input: RecordPaymentInput): Promise<PaymentRecord | null> {
  const admin = createAdminClient();
  const now = input.createdAt ?? new Date().toISOString();

  const { data, error } = await admin
    .from("payments")
    .upsert(
      {
        user_id: input.userId,
        email: input.email ?? null,
        plan: input.plan,
        amount: input.amount,
        currency: input.currency,
        razorpay_payment_id: input.razorpayPaymentId,
        razorpay_order_id: input.razorpayOrderId,
        status: input.status ?? "success",
        billing_interval: input.billingInterval ?? null,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "razorpay_payment_id", ignoreDuplicates: false }
    )
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await admin
        .from("payments")
        .select("*")
        .eq("razorpay_payment_id", input.razorpayPaymentId)
        .maybeSingle();

      if (existing) {
        const normalized = normalizePaymentRow(existing as Record<string, unknown>);
        return normalized ? paymentFromRow(normalized) : null;
      }
    }

    console.error("[payments] Failed to record payment:", error.message);
    return null;
  }

  const normalized = normalizePaymentRow(data as Record<string, unknown>);
  return normalized ? paymentFromRow(normalized) : null;
}

export async function listUserPayments(
  userId: string,
  options: { successOnly?: boolean } = {}
): Promise<PaymentRecord[]> {
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

export async function getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
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
