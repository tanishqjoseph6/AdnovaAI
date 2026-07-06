import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CompetitorAnalyzerPageClient from "@/components/competitor-analyzer/CompetitorAnalyzerPageClient";

export default function CompetitorAnalyzerPage() {
  return (
    <DashboardShell
      title="Competitor Ad Analyzer"
      subtitle="AI vision breakdown of any competitor ad screenshot"
    >
      <FeatureGate feature="competitor_analyzer">
        <CompetitorAnalyzerPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
