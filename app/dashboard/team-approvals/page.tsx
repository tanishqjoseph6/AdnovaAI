import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TeamApprovalsPageClient from "@/components/team-approval/TeamApprovalsPageClient";

export default function TeamApprovalsPage() {
  return (
    <DashboardShell
      title="Team Approvals"
      subtitle="Role-based review workflow from draft to published"
    >
      <FeatureGate feature="social_scheduler">
        <TeamApprovalsPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
