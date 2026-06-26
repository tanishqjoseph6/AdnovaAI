import { FREE_PLAN_CREDITS } from "@/lib/credits/plan-config";

export function resolveCreditsMax(
  maxCredits: number | null | undefined,
  currentCredits?: number
): number {
  if (typeof maxCredits === "number" && maxCredits > 0) {
    return maxCredits;
  }
  if (typeof currentCredits === "number" && currentCredits > 0) {
    return currentCredits;
  }
  return FREE_PLAN_CREDITS;
}

export function creditsProgressPercent(
  credits: number,
  maxCredits: number | null | undefined,
  unlimited: boolean
): number {
  if (unlimited) {
    return 100;
  }

  const max = resolveCreditsMax(maxCredits, credits);
  if (max <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((credits / max) * 100));
}
