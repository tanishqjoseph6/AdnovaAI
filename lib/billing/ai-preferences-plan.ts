import type { PlanId, SubscriptionStatus } from "./plans";
import {
  canAccessFeature,
  resolveEffectivePlan,
} from "./features";
import {
  DEFAULT_AI_PREFERENCES,
  type AiPreferences,
} from "@/lib/settings/ai-preferences";

/** Basic AI settings available on the Free plan. */
export const FREE_AI_PREFERENCE_KEYS = [
  "language",
  "tone",
  "captionLength",
] as const satisfies ReadonlyArray<keyof AiPreferences>;

/** Advanced AI settings unlocked on Starter and above. */
export const ADVANCED_AI_PREFERENCE_KEYS = [
  "platform",
  "audience",
  "brandVoice",
  "emojiUsage",
  "ctaStyle",
  "creativeLevel",
] as const satisfies ReadonlyArray<keyof AiPreferences>;

export function clampAiPreferencesForPlan(
  preferences: AiPreferences,
  plan: PlanId,
  subscriptionStatus: SubscriptionStatus | string
): AiPreferences {
  const hasAdvanced = canAccessFeature(
    plan,
    subscriptionStatus,
    "advanced_ai_preferences"
  );
  const hasPremiumQuality = canAccessFeature(
    plan,
    subscriptionStatus,
    "premium_ai_quality"
  );

  let result = { ...preferences };

  if (!hasAdvanced) {
    result = {
      ...result,
      platform: DEFAULT_AI_PREFERENCES.platform,
      audience: DEFAULT_AI_PREFERENCES.audience,
      brandVoice: DEFAULT_AI_PREFERENCES.brandVoice,
      emojiUsage: DEFAULT_AI_PREFERENCES.emojiUsage,
      ctaStyle: DEFAULT_AI_PREFERENCES.ctaStyle,
      creativeLevel: DEFAULT_AI_PREFERENCES.creativeLevel,
    };
  }

  if (!hasPremiumQuality && result.generationQuality === "Premium") {
    result = {
      ...result,
      generationQuality: DEFAULT_AI_PREFERENCES.generationQuality,
    };
  }

  return result;
}

export function validateAiPreferencesForPlan(
  preferences: AiPreferences,
  plan: PlanId,
  subscriptionStatus: SubscriptionStatus | string
): { ok: true } | { ok: false; error: string; feature: "advanced_ai_preferences" | "premium_ai_quality" } {
  const effectivePlan = resolveEffectivePlan(plan, subscriptionStatus);

  if (
    !canAccessFeature(effectivePlan, "active", "advanced_ai_preferences")
  ) {
    for (const key of ADVANCED_AI_PREFERENCE_KEYS) {
      if (preferences[key] !== DEFAULT_AI_PREFERENCES[key]) {
        return {
          ok: false,
          error: "Advanced AI preferences require Starter or Pro.",
          feature: "advanced_ai_preferences",
        };
      }
    }
  }

  if (
    !canAccessFeature(effectivePlan, "active", "premium_ai_quality") &&
    preferences.generationQuality === "Premium"
  ) {
    return {
      ok: false,
      error: "Premium AI output requires a Pro plan.",
      feature: "premium_ai_quality",
    };
  }

  return { ok: true };
}
