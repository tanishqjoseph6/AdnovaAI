import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { buildFeatureAccessMap, resolveEffectivePlan } from "@/lib/billing/features";
import type { CreditsApiResponse } from "@/lib/credits/types";
import type { PlanId, SubscriptionStatus } from "@/lib/billing/plans";
import { getPlan } from "@/lib/billing/plans";
import { getUserCreditsForUser } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }
    const user = authResult.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const billingPlan =
      profile && typeof profile.plan === "string"
        ? (profile.plan as PlanId)
        : "free";
    const subscriptionStatus =
      profile && typeof profile.subscription_status === "string"
        ? (profile.subscription_status as SubscriptionStatus)
        : "inactive";
    const effectivePlan = resolveEffectivePlan(billingPlan, subscriptionStatus);

    const credits = await getUserCreditsForUser(user.id, supabase, {
      email: user.email,
    });

    const response: CreditsApiResponse = {
      ...credits,
      billingPlan,
      effectivePlan,
      subscriptionStatus,
      displayPlan: getPlan(billingPlan).name,
      featureAccess: buildFeatureAccessMap(billingPlan, subscriptionStatus),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/credits error:", error);
    return NextResponse.json(
      { error: "Failed to load credits" },
      { status: 500 }
    );
  }
}
