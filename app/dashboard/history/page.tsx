import DashboardShell from "@/components/dashboard/DashboardShell";
import HistoryPageClient from "@/components/history/HistoryPageClient";
import { competitorRecordFromRow } from "@/lib/competitor-ad/types";
import type { GenerationRecord, HistoryEntry } from "@/lib/history/types";
import { reelScriptFromRow } from "@/lib/reel-script/server";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();

  const [generationsResult, competitorResult, reelScriptsResult] =
    await Promise.all([
      supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("competitor_analyses")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("reel_scripts")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const generations = (generationsResult.data ?? []) as GenerationRecord[];

  const competitorEntries: HistoryEntry[] = [];
  if (!competitorResult.error && competitorResult.data) {
    for (const row of competitorResult.data) {
      const record = competitorRecordFromRow(row);
      if (record) {
        competitorEntries.push({ kind: "competitor", record });
      }
    }
  } else if (competitorResult.error) {
    console.error("competitor_analyses fetch error:", competitorResult.error);
  }

  const reelEntries: HistoryEntry[] = [];
  if (!reelScriptsResult.error && reelScriptsResult.data) {
    for (const row of reelScriptsResult.data) {
      const record = reelScriptFromRow(row);
      if (record) {
        reelEntries.push({ kind: "reel_script", record });
      }
    }
  } else if (reelScriptsResult.error) {
    console.error("reel_scripts fetch error:", reelScriptsResult.error);
  }

  const generationEntries: HistoryEntry[] = generations.map((record) => ({
    kind: "generation",
    record,
  }));

  const initialEntries = [
    ...generationEntries,
    ...competitorEntries,
    ...reelEntries,
  ].sort(
    (a, b) =>
      new Date(b.record.created_at).getTime() -
      new Date(a.record.created_at).getTime()
  );

  return (
    <DashboardShell
      title="History"
      subtitle="Browse, search, and manage your AI ad generations and analyses"
    >
      <HistoryPageClient initialEntries={initialEntries} />
    </DashboardShell>
  );
}
