import {
  FREE_PLAN_CREDITS,
  STARTER_PLAN_CREDITS,
} from "@/lib/credits/constants";
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

function resolveMaxCredits(
  creditsPlan: CreditsPlan,
  profilesPlan?: PlanId
): number | null {
  if (isUnlimitedPlan(creditsPlan)) {
    return null;
  }
  if (profilesPlan === "starter") {
    return STARTER_PLAN_CREDITS;
  }
  return FREE_PLAN_CREDITS;
}

function normalizeCreditsRow(
  row: Record<string, unknown> | null,
  profilesPlan?: PlanId
): UserCredits {
  const plan: CreditsPlan = row?.plan === "pro" ? "pro" : "free";
  const credits =
    typeof row?.credits === "number"
      ? Math.max(0, row.credits)
      : FREE_PLAN_CREDITS;
  const unlimited = isUnlimitedPlan(plan);

  return {
    credits,
    plan,
    unlimited,
    maxCredits: resolveMaxCredits(plan, profilesPlan),
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

export async function ensureUserCredits(
  userId: string,
  supabase?: SupabaseClient
): Promise<void> {
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    credits: FREE_PLAN_CREDITS,
    plan: "free" as const,
    updated_at: now,
  };

  if (hasAdminCredentials()) {
    const admin = createAdminClient();
    const { error } = await admin.from("user_credits").upsert(row, {
      onConflict: "user_id",
      ignoreDuplicates: true,
    });
    if (error) {
      throw error;
    }
    return;
  }

  const client = supabase ?? (await createClient());
  const { error } = await client.from("user_credits").upsert(row, {
    onConflict: "user_id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw error;
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

  await ensureUserCredits(userId);

  const admin = createAdminClient();
  const existing = await readCreditsRow(userId, admin);

  if (existing?.plan === "pro") {
    return;
  }

  const { error } = await admin
    .from("user_credits")
    .update({
      plan: "pro",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function getUserCredits(
  userId: string,
  supabase?: SupabaseClient,
  profilesPlan?: PlanId
): Promise<UserCredits> {
  await ensureUserCredits(userId, supabase);
  const data = await readCreditsRow(userId, supabase);
  return normalizeCreditsRow(data, profilesPlan);
}

export async function getUserCreditsForUser(
  userId: string,
  supabase?: SupabaseClient
): Promise<UserCredits> {
  let profilesPlan: PlanId | undefined;

  if (hasAdminCredentials()) {
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile && typeof profile.plan === "string") {
      profilesPlan = profile.plan as PlanId;
      if (typeof profile.subscription_status === "string") {
        await ensureProCreditsIfSubscribed(
          userId,
          profilesPlan,
          profile.subscription_status
        );
      }
    }
  }

  return getUserCredits(userId, supabase, profilesPlan);
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
  await ensureUserCredits(userId, admin);

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
 * Resets or upgrades the parallel user_credits row.
 */
export async function syncCreditsWithProfilePlan(
  userId: string,
  profilesPlan: PlanId,
  subscriptionStatus: string
): Promise<void> {
  if (!hasAdminCredentials()) {
    return;
  }

  await ensureUserCredits(userId);

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (
    (profilesPlan === "pro" || profilesPlan === "custom") &&
    subscriptionStatus === "active"
  ) {
    const { error } = await admin
      .from("user_credits")
      .update({ plan: "pro", updated_at: now })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
    return;
  }

  if (profilesPlan === "starter" && subscriptionStatus === "active") {
    const { error } = await admin
      .from("user_credits")
      .update({
        plan: "free",
        credits: STARTER_PLAN_CREDITS,
        updated_at: now,
      })
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  }
}
