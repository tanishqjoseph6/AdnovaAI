import type { GenerationRecord } from "@/lib/history/types";
import { getGenerationStatus } from "@/lib/history/utils";
import { formatBillingPlanLabel } from "@/lib/billing/invoices";
import type { PlanId } from "@/lib/billing/plans";
import type { UserCredits } from "@/lib/credits/types";

export type DashboardMetrics = {
  planName: string;
  planId: PlanId;
  creditsRemaining: number | null;
  creditsMax: number | null;
  creditsUsed: number;
  unlimited: boolean;
  adsThisMonth: number;
  totalAds: number;
  lastGenerationIso: string | null;
  successRate: number;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function computeDashboardMetrics(
  generations: GenerationRecord[],
  credits: UserCredits,
  planId: PlanId
): DashboardMetrics {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const adsThisMonth = generations.filter(
    (g) => new Date(g.created_at) >= monthStart
  ).length;

  const completed = generations.filter(
    (g) => getGenerationStatus(g) === "Completed"
  ).length;

  const successRate =
    generations.length > 0
      ? Math.round((completed / generations.length) * 100)
      : 0;

  const max = credits.maxCredits;
  const creditsUsed =
    credits.unlimited || max === null
      ? adsThisMonth
      : Math.max(0, max - credits.credits);

  return {
    planName: formatBillingPlanLabel(planId),
    planId,
    creditsRemaining: credits.unlimited ? null : credits.credits,
    creditsMax: credits.unlimited ? null : max,
    creditsUsed,
    unlimited: credits.unlimited,
    adsThisMonth,
    totalAds: generations.length,
    lastGenerationIso: generations[0]?.created_at ?? null,
    successRate,
  };
}

export function getUserDisplayName(
  email?: string | null,
  metadata?: Record<string, unknown> | null
): string {
  const fullName = metadata?.full_name ?? metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().split(" ")[0] ?? fullName.trim();
  }
  if (email) {
    const local = email.split("@")[0];
    if (local) {
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
  }
  return "Creator";
}
