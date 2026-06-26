import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import {
  computeDashboardMetrics,
  getUserDisplayName,
} from "@/lib/dashboard/metrics";
import type { PlanId } from "@/lib/billing/plans";
import type { GenerationRecord } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

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

  let planId: PlanId = "free";

  if (user) {
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

  const metrics = computeDashboardMetrics(generations, planId);

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
