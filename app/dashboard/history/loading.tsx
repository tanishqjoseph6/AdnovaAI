import DashboardShell from "@/components/dashboard/DashboardShell";
import HistorySkeleton from "@/components/history/HistorySkeleton";

export default function HistoryLoading() {
  return (
    <DashboardShell
      title="History"
      subtitle="Browse, search, and manage your AI ad generations"
    >
      <HistorySkeleton />
    </DashboardShell>
  );
}
