import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import LandingAnalyzerPageClient from "@/components/landing-analyzer/LandingAnalyzerPageClient";

export default function LandingAnalyzerPage() {
  return (
    <DashboardShell
      title="Landing Analyzer"
      subtitle="AI-powered conversion and ad strategy insights from any URL"
    >
      <FeatureGate feature="landing_analyzer">
        <LandingAnalyzerPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
