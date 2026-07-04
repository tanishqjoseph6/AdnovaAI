import { FREE_PLAN_CREDITS, STARTER_PLAN_CREDITS } from "@/lib/credits/constants";
import { evaluateFreeCreditClaim } from "@/lib/credits/free-credit-claims";
import { creditsLog, creditsWarn } from "@/lib/credits/logger";
import {
  resolveMaxCreditsForProfile,
} from "@/lib/credits/plan-config";
import type { CreditRefillRpcResult } from "@/lib/credits/refill";
import type {
  CreditsPlan,
  DeductCreditResult,
  UserCredits,
} from "@/lib/credits/types";
import type { PlanId } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const CREDIT_DEDUCT_MAX_RETRIES = 5;

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function isUnlimitedPlan(plan: CreditsPlan): boolean {
  return plan === "pro";
}

function normalizeCreditsRow(
  row: Record<string, unknown> | null,
  profilesPlan?: PlanId
): UserCredits {
  const plan: CreditsPlan = row?.plan === "pro" ? "pro" : "free";
  const credits =
    typeof row?.credits === "number"
      ? Math.max(0, row.credits)
      : 0;
  const unlimited = isUnlimitedPlan(plan);

  return {
    credits,
    plan,
    unlimited,
    maxCredits: resolveMaxCreditsForProfile(plan, profilesPlan),
    updatedAt:
      typeof row?.updated_at === "string"
        ? row.updated_at
        : new Date().toISOString(),
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
    .select("credits, plan, updated_at")
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
      credits: FREE_PLAN_CREDITS,
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
      plan: "free",
      unlimited: false,
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
  return credits.unlimited || credits.credits > 0;
}

export async function deductUserCredit(
  userId: string
): Promise<DeductCreditResult> {
  if (!hasAdminCredentials()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createAdminClient();

  for (let attempt = 0; attempt < CREDIT_DEDUCT_MAX_RETRIES; attempt++) {
    const { data: row, error } = await admin
      .from("user_credits")
      .select("credits, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!row) {
      return {
        deducted: false,
        unlimited: false,
        insufficient: true,
        credits: 0,
        plan: "free",
      };
    }

    const plan: CreditsPlan = row.plan === "pro" ? "pro" : "free";

    if (plan === "pro") {
      return {
        deducted: false,
        unlimited: true,
        insufficient: false,
        credits:
          typeof row.credits === "number" ? row.credits : FREE_PLAN_CREDITS,
        plan,
      };
    }

    const currentCredits =
      typeof row.credits === "number" ? row.credits : FREE_PLAN_CREDITS;

    if (currentCredits <= 0) {
      return {
        deducted: false,
        unlimited: false,
        insufficient: true,
        credits: 0,
        plan,
      };
    }

    const nextCredits = currentCredits - 1;
    const { data: updated, error: updateError } = await admin
      .from("user_credits")
      .update({
        credits: nextCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("credits", currentCredits)
      .eq("plan", "free")
      .select("credits, plan")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (updated) {
      return {
        deducted: true,
        unlimited: false,
        insufficient: false,
        credits: nextCredits,
        plan: "free",
      };
    }
  }

  return {
    deducted: false,
    unlimited: false,
    insufficient: true,
    credits: 0,
    plan: "free",
  };
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
        credits: FREE_PLAN_CREDITS,
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
