import { FREE_PLAN_CREDITS, PRO_PLAN_CREDITS, STARTER_PLAN_CREDITS } from "@/lib/credits/constants";
import { evaluateFreeCreditClaim } from "@/lib/credits/free-credit-claims";
import { creditsLog, creditsWarn } from "@/lib/credits/logger";
import {
  resolveMaxCreditsForProfile,
} from "@/lib/credits/plan-config";
import type { CreditRefillRpcResult } from "@/lib/credits/refill";
import {
  parseDeductCreditsRpcResult,
  type DeductCreditsInput,
} from "@/lib/credits/deduct";
import type { CreateCreditPurchaseInput } from "@/lib/credits/purchase";
import {
  resolveFeatureCost,
  type CreditFeatureId,
} from "@/lib/credits/schema";
import {
  featureCostFromRow,
  creditTransactionFromRow,
  creditPurchaseFromRow,
  type FeatureCostRow,
  type CreditTransactionRow,
  type CreditPurchaseRow,
} from "@/lib/credits/ledger";
import type {
  CreditBalance,
  CreditsPlan,
  DeductCreditResult,
  DeductCreditsResult,
  UserCredits,
} from "@/lib/credits/types";
import type { PlanId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const CREDIT_COLUMNS =
  "credits, monthly_credits, purchased_credits, current_credits, total_used_credits, monthly_allowance, plan, signup_date, last_credit_refill_at, updated_at";

function normalizeCreditsRow(
  row: Record<string, unknown> | null,
  profilesPlan?: PlanId
): UserCredits {
  const plan: CreditsPlan = row?.plan === "pro" ? "pro" : "free";
  const monthlyCredits =
    typeof row?.monthly_credits === "number"
      ? Math.max(0, row.monthly_credits)
      : typeof row?.credits === "number"
        ? Math.max(0, row.credits)
        : 0;
  const purchasedCredits =
    typeof row?.purchased_credits === "number"
      ? Math.max(0, row.purchased_credits)
      : 0;
  const credits =
    typeof row?.current_credits === "number"
      ? Math.max(0, row.current_credits)
      : monthlyCredits + purchasedCredits;

  return {
    credits,
    monthlyCredits,
    purchasedCredits,
    plan,
    maxCredits: resolveMaxCreditsForProfile(plan, profilesPlan),
    updatedAt:
      typeof row?.updated_at === "string"
        ? row.updated_at
        : new Date().toISOString(),
  };
}

function normalizeCreditBalanceRow(
  userId: string,
  row: Record<string, unknown> | null,
  profilesPlan?: PlanId
): CreditBalance {
  const base = normalizeCreditsRow(row, profilesPlan);
  const monthlyCredits =
    typeof row?.monthly_credits === "number" ? Math.max(0, row.monthly_credits) : base.credits;
  const purchasedCredits =
    typeof row?.purchased_credits === "number" ? Math.max(0, row.purchased_credits) : 0;
  const currentCredits =
    typeof row?.current_credits === "number"
      ? Math.max(0, row.current_credits)
      : monthlyCredits + purchasedCredits;

  return {
    userId,
    monthlyCredits,
    purchasedCredits,
    currentCredits,
    totalUsedCredits:
      typeof row?.total_used_credits === "number" ? row.total_used_credits : 0,
    monthlyAllowance:
      typeof row?.monthly_allowance === "number" ? row.monthly_allowance : null,
    plan: base.plan,
    maxCredits: base.maxCredits,
    updatedAt: base.updatedAt,
  };
}

function creditsClient(supabase?: SupabaseClient) {
  if (hasAdminCredentials()) {
    return createAdminClient();
  }
  return supabase;
}

async function readCreditsRow(
  userId: string,
  supabase?: SupabaseClient
): Promise<Record<string, unknown> | null> {
  const client = creditsClient(supabase) ?? (await createClient());
  const { data, error } = await client
    .from("user_credits")
    .select(CREDIT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function grantFreeCreditsIfEligible(
  userId: string,
  email: string | null | undefined,
  supabase?: SupabaseClient
): Promise<boolean> {
  const decision = evaluateFreeCreditClaim(email);
  if (!decision.allowed) {
    return false;
  }

  if (hasAdminCredentials()) {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("try_claim_free_credits", {
      p_user_id: userId,
      p_email: decision.emailLower,
    });

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  const client = supabase ?? (await createClient());
  const { data, error } = await client.rpc("try_claim_free_credits", {
    p_user_id: userId,
    p_email: decision.emailLower,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function maybeRefillUserCredits(
  userId: string
): Promise<CreditRefillRpcResult> {
  if (!hasAdminCredentials()) {
    return { refilled: false, reason: "missing_service_role" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("try_refill_user_credits", {
    p_user_id: userId,
  });

  if (error) {
    creditsWarn("credit_refill", "Refill RPC failed", {
      userId,
      error: error.message,
    });
    throw error;
  }

  const result = (data ?? { refilled: false }) as CreditRefillRpcResult;

  if (result.refilled) {
    creditsLog("credit_refill", "Monthly credits refilled", {
      userId,
      credits: result.credits,
      billingPlan: result.billing_plan,
      refilledAt: result.refilled_at,
    });
  }

  return result;
}

export async function ensureUserCredits(
  userId: string,
  supabase?: SupabaseClient,
  options?: { emailVerified?: boolean; email?: string | null }
): Promise<void> {
  if (options?.emailVerified === false) {
    return;
  }

  const existing = await readCreditsRow(userId, supabase);
  if (existing) {
    return;
  }

  if (options?.emailVerified && options.email) {
    await grantFreeCreditsIfEligible(userId, options.email, supabase);
  }
}

async function ensureProCreditsIfSubscribed(
  userId: string,
  profilesPlan: PlanId,
  subscriptionStatus: string
): Promise<void> {
  if (!hasAdminCredentials()) {
    return;
  }

  const isProSubscription =
    (profilesPlan === "pro" || profilesPlan === "custom") &&
    subscriptionStatus === "active";

  if (!isProSubscription) {
    return;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: upsertError } = await admin.from("user_credits").upsert(
    {
      user_id: userId,
      credits: PRO_PLAN_CREDITS,
      monthly_credits: PRO_PLAN_CREDITS,
      current_credits: PRO_PLAN_CREDITS,
      monthly_allowance: PRO_PLAN_CREDITS,
      plan: "pro",
      last_credit_refill_at: now,
      updated_at: now,
    },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  if (upsertError) {
    throw upsertError;
  }

  const existing = await readCreditsRow(userId, admin);

  if (existing?.plan === "pro") {
    return;
  }

  const { error: updateError } = await admin
    .from("user_credits")
    .update({
      plan: "pro",
      updated_at: now,
    })
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }
}

export async function getCreditBalance(
  userId: string,
  supabase?: SupabaseClient,
  profilesPlan?: PlanId,
  options?: { email?: string | null; emailVerified?: boolean }
): Promise<CreditBalance> {
  await ensureUserCredits(userId, supabase, {
    emailVerified: options?.emailVerified,
    email: options?.email,
  });
  const data = await readCreditsRow(userId, supabase);
  return normalizeCreditBalanceRow(userId, data, profilesPlan);
}

export async function getUserCredits(
  userId: string,
  supabase?: SupabaseClient,
  profilesPlan?: PlanId,
  options?: { email?: string | null; emailVerified?: boolean }
): Promise<UserCredits> {
  await ensureUserCredits(userId, supabase, {
    emailVerified: options?.emailVerified,
    email: options?.email,
  });
  const data = await readCreditsRow(userId, supabase);
  return normalizeCreditsRow(data, profilesPlan);
}

async function readBillingProfile(
  userId: string,
  supabase?: SupabaseClient
): Promise<{ plan: PlanId; subscriptionStatus: string } | null> {
  if (supabase) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (profile && typeof profile.plan === "string") {
      return {
        plan: profile.plan as PlanId,
        subscriptionStatus:
          typeof profile.subscription_status === "string"
            ? profile.subscription_status
            : "inactive",
      };
    }
  }

  if (!hasAdminCredentials()) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile || typeof profile.plan !== "string") {
    return null;
  }

  return {
    plan: profile.plan as PlanId,
    subscriptionStatus:
      typeof profile.subscription_status === "string"
        ? profile.subscription_status
        : "inactive",
  };
}

export async function getUserCreditsForUser(
  userId: string,
  supabase?: SupabaseClient,
  options?: { emailVerified?: boolean; email?: string | null }
): Promise<UserCredits> {
  const emailVerified = options?.emailVerified !== false;

  if (!emailVerified) {
    const billingProfile = await readBillingProfile(userId, supabase);
    return {
      credits: 0,
      monthlyCredits: 0,
      purchasedCredits: 0,
      plan: "free",
      maxCredits: resolveMaxCreditsForProfile("free", billingProfile?.plan),
      updatedAt: new Date().toISOString(),
    };
  }

  const billingProfile = await readBillingProfile(userId, supabase);

  if (billingProfile && hasAdminCredentials()) {
    await ensureProCreditsIfSubscribed(
      userId,
      billingProfile.plan,
      billingProfile.subscriptionStatus
    );
  }

  await ensureUserCredits(userId, supabase, {
    emailVerified: true,
    email: options?.email,
  });

  const refillResult = await maybeRefillUserCredits(userId);

  const credits = await getUserCredits(userId, supabase, billingProfile?.plan, {
    emailVerified: true,
    email: options?.email,
  });

  return {
    ...credits,
    refilledJustNow: refillResult.refilled === true,
  };
}

export function canUseCredits(credits: UserCredits): boolean {
  return credits.credits > 0;
}

export function canAffordCredits(
  balance: CreditBalance,
  cost: number
): boolean {
  if (cost <= 0) return true;
  return balance.currentCredits >= cost;
}

/**
 * Deduct a variable number of credits for a specific AI feature.
 * Uses the `deduct_user_credits` RPC with split-bucket logic.
 */
export async function deductUserCredits(
  input: DeductCreditsInput
): Promise<DeductCreditsResult> {
  if (!hasAdminCredentials()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createAdminClient();
  const amount = input.amountOverride ?? 1;

  const { data, error } = await admin.rpc("deduct_user_credits", {
    p_user_id: input.userId,
    p_amount: amount,
    p_feature_id: input.featureId ?? null,
  });

  if (error) {
    throw error;
  }

  return parseDeductCreditsRpcResult(
    (data ?? {}) as Parameters<typeof parseDeductCreditsRpcResult>[0]
  );
}

export async function deductUserCredit(
  userId: string,
  featureId: CreditFeatureId = "generate_ads"
): Promise<DeductCreditResult> {
  const result = await deductUserCredits({ userId, featureId });
  return {
    deducted: result.deducted,
    insufficient: result.insufficient,
    credits: result.credits,
    plan: result.plan,
  };
}

export async function grantPurchasedCredits(
  userId: string,
  creditsAmount: number,
  purchaseId?: string
): Promise<{ granted: boolean; currentCredits: number; purchasedCredits: number }> {
  if (!hasAdminCredentials()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("grant_purchased_credits", {
    p_user_id: userId,
    p_credits_amount: creditsAmount,
    p_purchase_id: purchaseId ?? null,
  });

  if (error) {
    throw error;
  }

  const result = data as {
    granted?: boolean;
    current_credits?: number;
    purchased_credits?: number;
  };

  return {
    granted: Boolean(result?.granted),
    currentCredits: result?.current_credits ?? 0,
    purchasedCredits: result?.purchased_credits ?? 0,
  };
}

/**
 * Resolves the credit cost for a single feature from the DB, falling back to
 * the compiled default when the row is missing/disabled or the query fails.
 * This is the authoritative pre-check value; the deduction RPC re-resolves the
 * cost server-side so the two always agree.
 */
export async function getFeatureCost(
  featureId: CreditFeatureId
): Promise<number> {
  try {
    const client = hasAdminCredentials()
      ? createAdminClient()
      : await createClient();
    const { data, error } = await client
      .from("credit_feature_costs")
      .select("cost, enabled")
      .eq("feature_id", featureId)
      .maybeSingle();

    if (error || !data || data.enabled === false) {
      return resolveFeatureCost(featureId);
    }

    return typeof data.cost === "number"
      ? data.cost
      : resolveFeatureCost(featureId);
  } catch {
    return resolveFeatureCost(featureId);
  }
}

export async function getFeatureCreditCosts(): Promise<
  ReturnType<typeof featureCostFromRow>[]
> {
  const admin = hasAdminCredentials() ? createAdminClient() : await createClient();
  const { data, error } = await admin
    .from("credit_feature_costs")
    .select("feature_id, cost, label, description, enabled")
    .eq("enabled", true)
    .order("feature_id");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    featureCostFromRow(row as FeatureCostRow)
  );
}

export async function getCreditTransactions(
  userId: string,
  limit = 50
): Promise<ReturnType<typeof creditTransactionFromRow>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    creditTransactionFromRow(row as CreditTransactionRow)
  );
}

export async function getCreditPurchases(
  userId: string,
  limit = 20
): Promise<ReturnType<typeof creditPurchaseFromRow>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    creditPurchaseFromRow(row as CreditPurchaseRow)
  );
}

export async function createPendingCreditPurchase(
  input: CreateCreditPurchaseInput
): Promise<{ id: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_purchases")
    .insert({
      user_id: input.userId,
      credits_amount: input.creditsAmount,
      amount_paid: input.amountPaid,
      currency: input.currency ?? "INR",
      order_id: input.orderId ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id as string };
}

export async function completeCreditPurchase(
  purchaseId: string,
  paymentId: string,
  expectedUserId: string,
  expectedOrderId?: string
): Promise<{ granted: boolean; currentCredits: number; purchasedCredits: number }> {
  const admin = createAdminClient();

  const { data: purchase, error: purchaseError } = await admin
    .from("credit_purchases")
    .select("id, user_id, credits_amount, status, order_id")
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError) {
    throw purchaseError;
  }

  if (!purchase) {
    throw new Error("Credit purchase not found");
  }

  if (purchase.user_id !== expectedUserId) {
    throw new Error("Credit purchase does not belong to this user");
  }

  if (
    expectedOrderId &&
    purchase.order_id &&
    purchase.order_id !== expectedOrderId
  ) {
    throw new Error("Credit purchase order does not match payment");
  }

  if (purchase.status === "completed") {
    const balance = await getCreditBalance(purchase.user_id as string);
    return {
      granted: true,
      currentCredits: balance.currentCredits,
      purchasedCredits: balance.purchasedCredits,
    };
  }

  const grant = await grantPurchasedCredits(
    purchase.user_id as string,
    purchase.credits_amount as number,
    purchaseId
  );

  const { error: updateError } = await admin
    .from("credit_purchases")
    .update({
      status: "completed",
      payment_id: paymentId,
      completed_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);

  if (updateError) {
    throw updateError;
  }

  return grant;
}

/**
 * Called after Razorpay activates a paid plan on profiles.
 * Syncs user_credits when a paid billing plan activates.
 */
export async function syncCreditsWithProfilePlan(
  userId: string,
  profilesPlan: PlanId,
  subscriptionStatus: string
): Promise<void> {
  if (!hasAdminCredentials()) {
    return;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (
    (profilesPlan === "pro" || profilesPlan === "custom") &&
    subscriptionStatus === "active"
  ) {
    const { error } = await admin.from("user_credits").upsert(
      {
        user_id: userId,
        credits: PRO_PLAN_CREDITS,
        monthly_credits: PRO_PLAN_CREDITS,
        purchased_credits: 0,
        current_credits: PRO_PLAN_CREDITS,
        monthly_allowance: PRO_PLAN_CREDITS,
        plan: "pro",
        last_credit_refill_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw error;
    }
    return;
  }

  if (profilesPlan === "starter" && subscriptionStatus === "active") {
    const { error } = await admin.from("user_credits").upsert(
      {
        user_id: userId,
        plan: "free",
        credits: STARTER_PLAN_CREDITS,
        monthly_credits: STARTER_PLAN_CREDITS,
        current_credits: STARTER_PLAN_CREDITS,
        monthly_allowance: STARTER_PLAN_CREDITS,
        last_credit_refill_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw error;
    }
  }
}
