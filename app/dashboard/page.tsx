import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import {
  computeDashboardMetrics,
  getUserDisplayName,
} from "@/lib/dashboard/metrics";
import type { PlanId } from "@/lib/billing/plans";
import { getUserCreditsForUser } from "@/lib/credits/server";
import type { GenerationRecord } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let planId: PlanId = "free";
  let userCredits:
    | { credits: number; maxCredits: number | null; unlimited: boolean }
    | undefined;
  let generations: GenerationRecord[] = [];

  if (user) {
    const [profileResult, generationsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("generations")
        .select("*")
        .in("user_email", [user.email ?? "", user.id])
        .order("created_at", { ascending: false }),
    ]);

    const profile = profileResult.data;
    if (profile && typeof profile.plan === "string") {
      planId = profile.plan as PlanId;
    }

    const credits = await getUserCreditsForUser(user.id, supabase, {
      email: user.email,
    });
    userCredits = {
      credits: credits.credits,
      maxCredits: credits.maxCredits,
      unlimited: credits.unlimited,
    };
    generations = (generationsResult.data ?? []) as GenerationRecord[];
  }

  const recentGenerations = generations.slice(0, 5);
  const userName = getUserDisplayName(
    user?.email,
    user?.user_metadata as Record<string, unknown> | null
  );

  const metrics = computeDashboardMetrics(generations, planId, {
    remainingCredits: userCredits?.credits,
    maxCredits: userCredits?.maxCredits,
    unlimited: userCredits?.unlimited,
  });

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
