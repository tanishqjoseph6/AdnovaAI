import DashboardShell from "@/components/dashboard/DashboardShell";
import HistoryPageClient from "@/components/history/HistoryPageClient";
import type { GenerationRecord } from "@/lib/history/types";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();

  const result = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false });

  const generations = (result.data ?? []) as GenerationRecord[];

  return (
    <DashboardShell
      title="History"
      subtitle="Browse, search, and manage your AI ad generations"
    >
      <HistoryPageClient initialGenerations={generations} />
    </DashboardShell>
  );
}
