import { Suspense } from "react";
import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SocialSchedulerPageClient from "@/components/social-scheduler/SocialSchedulerPageClient";
import { getSocialOAuthStatus } from "@/lib/social-scheduler/oauth-config";

export default function SocialSchedulerPage() {
  const oauthStatus = getSocialOAuthStatus();

  return (
    <DashboardShell
      title="Social Scheduler"
      subtitle="Connect accounts, schedule posts, and publish to X and LinkedIn"
    >
      <FeatureGate feature="social_scheduler">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.03]" />}>
          <SocialSchedulerPageClient oauthStatus={oauthStatus} />
        </Suspense>
      </FeatureGate>
    </DashboardShell>
  );
}
