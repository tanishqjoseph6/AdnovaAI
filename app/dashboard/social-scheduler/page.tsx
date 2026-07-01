import DashboardShell from "@/components/dashboard/DashboardShell";
import SocialSchedulerPageClient from "@/components/social-scheduler/SocialSchedulerPageClient";

export default function SocialSchedulerPage() {
  return (
    <DashboardShell
      title="Social Scheduler"
      subtitle="Plan upcoming social posts while platform publishing integrations are prepared"
    >
      <SocialSchedulerPageClient />
    </DashboardShell>
  );
}
