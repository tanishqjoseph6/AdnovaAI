"use client";

import { useEffect, useState } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import BetaLaunchBanner from "@/components/dashboard/BetaLaunchBanner";
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

type GenerationSuccessDetail = {
  generatedAt?: string;
  remainingCredits?: number | null;
};

function isCurrentMonth(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function applyGenerationSuccess(
  current: DashboardMetrics,
  detail: GenerationSuccessDetail
): DashboardMetrics {
  if (!detail.generatedAt || !isCurrentMonth(detail.generatedAt)) {
    return current;
  }

  if (detail.generatedAt === current.lastGenerationIso) {
    return current;
  }

  const adsThisMonth =
    current.monthlyLimit === null
      ? current.adsThisMonth + 1
      : typeof detail.remainingCredits === "number"
        ? Math.max(
            0,
            Math.min(
              current.monthlyLimit,
              current.monthlyLimit - detail.remainingCredits
            )
          )
        : Math.min(current.monthlyLimit, current.adsThisMonth + 1);

  return {
    ...current,
    adsThisMonth,
    totalAds: current.totalAds + 1,
    lastGenerationIso: adsThisMonth > 0 ? detail.generatedAt : null,
    successRate: current.totalAds > 0 ? current.successRate : 100,
  };
}

export default function DashboardPageClient({
  userName,
  metrics,
  recentGenerations,
}: DashboardPageClientProps) {
  const [liveMetrics, setLiveMetrics] = useState(metrics);
  const { credits } = useCredits();
  const hasGenerations = liveMetrics.totalAds > 0;
  const showUpgrade = credits?.billingPlan !== "pro";

  useEffect(() => {
    setLiveMetrics(metrics);
  }, [metrics]);

  useEffect(() => {
    function applyFromDetail(detail: GenerationSuccessDetail) {
      setLiveMetrics((current) => applyGenerationSuccess(current, detail));
    }

    function handleGenerationSuccess(event: Event) {
      const detail = (event as CustomEvent<GenerationSuccessDetail>).detail;
      applyFromDetail(detail);
    }

    window.addEventListener("advora:generation-success", handleGenerationSuccess);
    return () => {
      window.removeEventListener(
        "advora:generation-success",
        handleGenerationSuccess
      );
    };
  }, []);

  return (
    <div className="space-y-10">
      <BetaLaunchBanner />

      <DashboardHero userName={userName} metrics={liveMetrics} />

      <QuickActionCards />

      <DashboardStatsGrid metrics={liveMetrics} />

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
        <UsageCard />
        {showUpgrade && <UpgradeCard show />}
      </div>
    </div>
  );
}
