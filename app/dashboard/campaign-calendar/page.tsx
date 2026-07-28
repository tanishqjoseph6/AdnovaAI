import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CampaignCalendarPageClient from "@/components/campaign-calendar/CampaignCalendarPageClient";

export default function CampaignCalendarPage() {
  return (
    <DashboardShell
      title="Campaign Calendar"
      subtitle="Month, week, and day planning with drag-and-drop scheduling"
    >
      <FeatureGate feature="social_scheduler">
        <CampaignCalendarPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
