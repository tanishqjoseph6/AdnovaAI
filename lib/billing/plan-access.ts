import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId, SubscriptionStatus } from "./plans";
import {
  canAccessFeature,
  FEATURE_LOCKED_CODE,
  type FeatureId,
  type GatedFeatureId,
  isGatedFeature,
} from "./features";

export type UserPlanContext = {
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  effectivePlan: PlanId;
};

export async function getUserPlanContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPlanContext> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("plan, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const plan =
    profile && typeof profile.plan === "string"
      ? (profile.plan as PlanId)
      : "free";
  const subscriptionStatus =
    profile && typeof profile.subscription_status === "string"
      ? (profile.subscription_status as SubscriptionStatus)
      : "inactive";

  const effectivePlan =
    plan === "free" || subscriptionStatus !== "active" ? "free" : plan;

  return { plan, subscriptionStatus, effectivePlan };
}

type FeatureAccessSuccess = { context: UserPlanContext };
type FeatureAccessFailure = { response: NextResponse };

export async function requireFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: FeatureId
): Promise<FeatureAccessSuccess | FeatureAccessFailure> {
  const context = await getUserPlanContext(supabase, userId);

  if (canAccessFeature(context.plan, context.subscriptionStatus, feature)) {
    return { context };
  }

  const featureLabel = isGatedFeature(feature)
    ? feature.replace(/_/g, " ")
    : feature;

  return {
    response: NextResponse.json(
      {
        error: `${featureLabel} requires a paid plan.`,
        code: FEATURE_LOCKED_CODE,
        feature,
        requiredPlan: featureMinPlanLabel(feature),
      },
      { status: 403 }
    ),
  };
}

function featureMinPlanLabel(feature: FeatureId): "starter" | "pro" {
  if (
    feature === "premium_ai_quality" ||
    feature === "priority_processing" ||
    feature === "priority_support"
  ) {
    return "pro";
  }
  return "starter";
}

export function featureLockedResponse(feature: GatedFeatureId): NextResponse {
  return NextResponse.json(
    {
      error: `This feature requires a paid plan.`,
      code: FEATURE_LOCKED_CODE,
      feature,
      requiredPlan: featureMinPlanLabel(feature),
    },
    { status: 403 }
  );
}
