import type { PlanId, SubscriptionStatus, PaidPlanId } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";
import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/errors";
import { syncCreditsWithProfilePlan } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export type UserSubscription = {
  plan: PlanId;
  payment_id: string | null;
  subscription_status: SubscriptionStatus;
  purchase_date: string | null;
};

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: "free",
  payment_id: null,
  subscription_status: "inactive",
  purchase_date: null,
};

function normalizeSubscription(
  row: Record<string, unknown> | null
): UserSubscription {
  if (!row) {
    return DEFAULT_SUBSCRIPTION;
  }

  const plan =
    typeof row.plan === "string" && row.plan in PLANS
      ? (row.plan as PlanId)
      : "free";

  const subscription_status =
    typeof row.subscription_status === "string"
      ? (row.subscription_status as SubscriptionStatus)
      : "inactive";

  return {
    plan,
    payment_id: typeof row.payment_id === "string" ? row.payment_id : null,
    subscription_status,
    purchase_date:
      typeof row.purchase_date === "string" ? row.purchase_date : null,
  };
}

const PROFILE_COLUMNS =
  "plan, payment_id, subscription_status, purchase_date";

async function fetchUserProfileAdmin(
  userId: string
): Promise<UserSubscription | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeSubscription(data) : null;
}

export async function ensureUserProfile(
  userId: string,
  email?: string | null,
  supabase?: SupabaseClient
): Promise<UserSubscription> {
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  if (normalizedEmail && hasAdminCredentials()) {
    const admin = createAdminClient();
    const { data: existingProfile, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .neq("id", userId)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existingProfile) {
      throw new Error(DUPLICATE_EMAIL_MESSAGE);
    }
  }

  const now = new Date().toISOString();
  const profileRow = {
    id: userId,
    email: email ?? null,
    plan: "free",
    subscription_status: "inactive",
    updated_at: now,
  };

  if (hasAdminCredentials()) {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").upsert(profileRow, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

    if (error) {
      throw error;
    }

    const subscription = await fetchUserProfileAdmin(userId);
    if (!subscription) {
      throw new Error("Failed to load profile after ensure");
    }

    return subscription;
  }

  const client = supabase ?? (await createClient());
  const { error } = await client.from("profiles").upsert(profileRow, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (error) {
    throw error;
  }

  const { data, error: readError } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (!data) {
    throw new Error("Failed to load profile after ensure");
  }

  return normalizeSubscription(data);
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subscription:", error);
    throw error;
  }

  if (!data) {
    return DEFAULT_SUBSCRIPTION;
  }

  return normalizeSubscription(data);
}

export function isSubscriptionActive(subscription: UserSubscription): boolean {
  return (
    subscription.subscription_status === "active" &&
    subscription.plan !== "free"
  );
}

export type SubscriptionActivationResult = {
  activated: boolean;
  alreadyProcessed: boolean;
  plan: PlanId;
  userId: string;
  purchaseDate: string;
};

type ActivationRpcResult = {
  activated: boolean;
  already_processed: boolean;
  plan: string;
  user_id: string;
};

function parseActivationResult(
  data: ActivationRpcResult,
  purchaseDate: string
): SubscriptionActivationResult {
  return {
    activated: Boolean(data.activated),
    alreadyProcessed: Boolean(data.already_processed),
    plan:
      typeof data.plan === "string" && data.plan in PLANS
        ? (data.plan as PlanId)
        : "free",
    userId: data.user_id,
    purchaseDate,
  };
}

export type ActivateSubscriptionInput = {
  userId: string;
  email?: string | null;
  plan: PaidPlanId;
  paymentId: string;
  orderId: string;
  purchaseDate?: string;
};

/**
 * Upgrades a user profile after Razorpay payment verification.
 * Credit grants run via syncCreditsWithProfilePlan → user_credits only.
 */
export async function activateSubscriptionFromPayment({
  userId,
  email,
  plan,
  paymentId,
  orderId,
  purchaseDate = new Date().toISOString(),
}: ActivateSubscriptionInput): Promise<SubscriptionActivationResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("activate_subscription_from_payment", {
    p_user_id: userId,
    p_email: email ?? null,
    p_plan: plan,
    p_payment_id: paymentId,
    p_order_id: orderId,
    p_purchase_date: purchaseDate,
  });

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invalid activation response from database");
  }

  await syncCreditsWithProfilePlan(userId, plan, "active");

  return parseActivationResult(data as ActivationRpcResult, purchaseDate);
}

/** @deprecated Use activateSubscriptionFromPayment */
export async function activateSubscription({
  userId,
  email,
  plan,
  paymentId,
  orderId,
}: ActivateSubscriptionInput) {
  const result = await activateSubscriptionFromPayment({
    userId,
    email,
    plan,
    paymentId,
    orderId,
  });

  return result.purchaseDate;
}

export async function hasProcessedPayment(paymentId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
