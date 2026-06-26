import { NextResponse } from "next/server";
import type { CreditsApiResponse } from "@/lib/credits/types";
import type { PlanId } from "@/lib/billing/plans";
import { getPlan } from "@/lib/billing/plans";
import { getUserCreditsForUser } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const billingPlan =
      profile && typeof profile.plan === "string"
        ? (profile.plan as PlanId)
        : "free";

    const credits = await getUserCreditsForUser(user.id, supabase);

    const response: CreditsApiResponse = {
      ...credits,
      billingPlan,
      displayPlan: getPlan(billingPlan).name,
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
