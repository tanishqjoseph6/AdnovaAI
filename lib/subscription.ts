import type { PlanId, SubscriptionStatus } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserSubscription = {
  plan: PlanId;
  payment_id: string | null;
  subscription_status: SubscriptionStatus;
  purchase_date: string | null;
  generations_used: number;
};

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: "free",
  payment_id: null,
  subscription_status: "inactive",
  purchase_date: null,
  generations_used: 0,
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
    generations_used:
      typeof row.generations_used === "number" ? row.generations_used : 0,
  };
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "plan, payment_id, subscription_status, purchase_date, generations_used"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load subscription:", error);
    return DEFAULT_SUBSCRIPTION;
  }

  return normalizeSubscription(data);
}

export function getGenerationLimit(subscription: UserSubscription): number | null {
  const plan = PLANS[subscription.plan];
  return plan.generationLimit;
}

export function isSubscriptionActive(subscription: UserSubscription): boolean {
  return (
    subscription.subscription_status === "active" &&
    subscription.plan !== "free"
  );
}

type ActivateSubscriptionInput = {
  userId: string;
  email?: string | null;
  plan: PlanId;
  paymentId: string;
};

export async function activateSubscription({
  userId,
  email,
  plan,
  paymentId,
}: ActivateSubscriptionInput) {
  const admin = createAdminClient();
  const purchaseDate = new Date().toISOString();

  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      plan,
      payment_id: paymentId,
      subscription_status: "active",
      purchase_date: purchaseDate,
      generations_used: 0,
      updated_at: purchaseDate,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return purchaseDate;
}

export async function hasProcessedPayment(paymentId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check payment idempotency:", error);
    return false;
  }

  return Boolean(data);
}
