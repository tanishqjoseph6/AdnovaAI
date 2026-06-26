import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import {
  computeDashboardMetrics,
  getUserDisplayName,
} from "@/lib/dashboard/metrics";
import type { PlanId } from "@/lib/billing/plans";
import { FREE_PLAN_CREDITS } from "@/lib/credits/constants";
import { getUserCreditsForUser } from "@/lib/credits/server";
import type { UserCredits } from "@/lib/credits/types";
import type { GenerationRecord } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_CREDITS: UserCredits = {
  credits: FREE_PLAN_CREDITS,
  plan: "free",
  unlimited: false,
  maxCredits: FREE_PLAN_CREDITS,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const generationsResult = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false });

  const generations = (generationsResult.data ?? []) as GenerationRecord[];
  const recentGenerations = generations.slice(0, 5);

  let credits: UserCredits = DEFAULT_CREDITS;
  let planId: PlanId = "free";

  if (user) {
    try {
      credits = await getUserCreditsForUser(user.id, supabase);
    } catch {
      credits = DEFAULT_CREDITS;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && typeof profile.plan === "string") {
      planId = profile.plan as PlanId;
    }
  }

  const userName = getUserDisplayName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | null
  );

  const metrics = computeDashboardMetrics(generations, credits, planId);

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Your AI creative command center"
    >
      <DashboardPageClient
        userName={userName}
        metrics={metrics}
        recentGenerations={recentGenerations}
      />
    </DashboardShell>
  );
}
