import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Your AI creative command center"
    >
      <DashboardSkeleton />
    </DashboardShell>
  );
}
