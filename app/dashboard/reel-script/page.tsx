import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ReelScriptPageClient from "@/components/reel-script/ReelScriptPageClient";

export default function ReelScriptPage() {
  return (
    <DashboardShell
      title="AI Reel Scripts"
      subtitle="Generate production-ready short-form scripts for Instagram, TikTok, and YouTube Shorts"
    >
      <FeatureGate feature="reel_script_generator">
        <ReelScriptPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
