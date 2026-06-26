"use client";

import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import QuickActionCards from "@/components/dashboard/QuickActionCards";
import RecentGenerations from "@/components/dashboard/RecentGenerations";
import UpgradeCard from "@/components/dashboard/UpgradeCard";
import UsageCard from "@/components/dashboard/UsageCard";
import { useCredits } from "@/hooks/useCredits";
import type { DashboardMetrics } from "@/lib/dashboard/metrics";
import type { GenerationRecord } from "@/lib/history/types";

type DashboardPageClientProps = {
  userName: string;
  metrics: DashboardMetrics;
  recentGenerations: GenerationRecord[];
};

export default function DashboardPageClient({
  userName,
  metrics,
  recentGenerations,
}: DashboardPageClientProps) {
  const { credits } = useCredits();
  const hasGenerations = metrics.totalAds > 0;
  const showUpgrade = !credits?.unlimited && credits?.billingPlan !== "pro";

  return (
    <div className="space-y-10">
      <DashboardHero userName={userName} metrics={metrics} />

      <QuickActionCards />

      <DashboardStatsGrid metrics={metrics} />

      {hasGenerations ? (
        <RecentGenerations generations={recentGenerations} />
      ) : (
        <DashboardEmptyState />
      )}

      <div
        className={
          showUpgrade ? "grid gap-6 lg:grid-cols-2" : "max-w-2xl"
        }
      >
        <UsageCard metrics={metrics} />
        {showUpgrade && <UpgradeCard show />}
      </div>
    </div>
  );
}
