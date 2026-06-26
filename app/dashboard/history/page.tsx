import DashboardShell from "@/components/dashboard/DashboardShell";
import HistoryPageClient from "@/components/history/HistoryPageClient";
import { getUserCreditsForUser } from "@/lib/credits/server";
import type { GenerationRecord, PlanBadge } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false });

  const generations = (result.data ?? []) as GenerationRecord[];

  let planBadge: PlanBadge = "Free";
  if (user) {
    try {
      const credits = await getUserCreditsForUser(user.id, supabase);
      planBadge = credits.unlimited ? "Pro" : "Free";
    } catch {
      planBadge = "Free";
    }
  }

  return (
    <DashboardShell
      title="History"
      subtitle="Browse, search, and manage your AI ad generations"
    >
      <HistoryPageClient
        initialGenerations={generations}
        planBadge={planBadge}
      />
    </DashboardShell>
  );
}
