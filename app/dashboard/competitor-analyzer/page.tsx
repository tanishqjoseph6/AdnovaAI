import DashboardShell from "@/components/dashboard/DashboardShell";
import CompetitorAnalyzerPageClient from "@/components/competitor-analyzer/CompetitorAnalyzerPageClient";

export default function CompetitorAnalyzerPage() {
  return (
    <DashboardShell
      title="Competitor Ad Analyzer"
      subtitle="AI vision breakdown of any competitor ad screenshot"
    >
      <CompetitorAnalyzerPageClient />
    </DashboardShell>
  );
}
