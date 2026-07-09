import type { GenerationRecord } from "@/lib/history/types";
import { getGenerationStatus } from "@/lib/history/utils";
import { formatBillingPlanLabel } from "@/lib/billing/invoices";
import type { PlanId } from "@/lib/billing/plans";

type CreditUsageSnapshot = {
  remainingCredits?: number | null;
  maxCredits?: number | null;
};

export type DashboardMetrics = {
  planName: string;
  planId: PlanId;
  monthlyLimit: number | null;
  adsThisMonth: number;
  totalAds: number;
  lastGenerationIso: string | null;
  successRate: number;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isProductionSuccessfulGeneration(generation: GenerationRecord): boolean {
  if (getGenerationStatus(generation) !== "Completed") {
    return false;
  }

  const description = generation.product_description.trim().toLowerCase();
  if (!description) {
    return false;
  }

  return !/\b(?:mock|dummy|sample|test|testing|dev|development)\b/.test(
    description
  );
}

function generationSignature(generation: GenerationRecord): string {
  return JSON.stringify({
    product: generation.product_description.trim().toLowerCase(),
    hooks: generation.hooks ?? [],
    captions: generation.captions ?? [],
    ctas: generation.ctas ?? [],
    ugcScript: generation.ugc_script?.trim() ?? "",
  });
}

function dedupeGenerations(generations: GenerationRecord[]): GenerationRecord[] {
  const seen = new Set<string>();
  const unique: GenerationRecord[] = [];

  for (const generation of generations) {
    const signature = generationSignature(generation);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    unique.push(generation);
  }

  return unique;
}

function newestFirst(a: GenerationRecord, b: GenerationRecord): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function resolveCurrentCycleUsage(
  successfulCurrentCycleGenerations: number,
  credits?: CreditUsageSnapshot
): number {
  if (
    typeof credits?.maxCredits === "number" &&
    typeof credits.remainingCredits === "number"
  ) {
    const usedFromCredits = Math.max(
      0,
      Math.min(credits.maxCredits, credits.maxCredits - credits.remainingCredits)
    );

    return Math.min(successfulCurrentCycleGenerations, usedFromCredits);
  }

  return successfulCurrentCycleGenerations;
}

export function computeDashboardMetrics(
  generations: GenerationRecord[],
  planId: PlanId,
  credits?: CreditUsageSnapshot
): DashboardMetrics {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const productionSuccessful = dedupeGenerations(
    generations.filter(isProductionSuccessfulGeneration).sort(newestFirst)
  );
  const currentCycleGenerations = productionSuccessful.filter(
    (g) => new Date(g.created_at) >= monthStart
  );

  const adsThisMonth = resolveCurrentCycleUsage(
    currentCycleGenerations.length,
    credits
  );
  const lastGenerationIso =
    adsThisMonth > 0 ? currentCycleGenerations[0]?.created_at ?? null : null;
  const totalAds = productionSuccessful.length;
  const successRate = generations.length > 0
    ? Math.round((productionSuccessful.length / generations.length) * 100)
    : 0;

  return {
    planName: formatBillingPlanLabel(planId),
    planId,
    monthlyLimit: credits?.maxCredits ?? null,
    adsThisMonth,
    totalAds,
    lastGenerationIso,
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
