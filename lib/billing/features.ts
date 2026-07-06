import type { PlanId, SubscriptionStatus } from "./plans";

/** Product features that can be gated by plan. */
export type FeatureId =
  | "hooks"
  | "captions"
  | "cta"
  | "ugc_script"
  | "brand_kit"
  | "competitor_analyzer"
  | "landing_analyzer"
  | "social_scheduler"
  | "brand_memory"
  | "advanced_ai_preferences"
  | "premium_ai_quality"
  | "priority_processing"
  | "priority_support";

/** Features surfaced in navigation / upgrade modals. */
export type GatedFeatureId = Exclude<
  FeatureId,
  "hooks" | "captions" | "cta" | "ugc_script" | "brand_memory"
>;

export const FEATURE_LOCKED_CODE = "FEATURE_LOCKED";

const FREE_FEATURES: ReadonlySet<FeatureId> = new Set([
  "hooks",
  "captions",
  "cta",
  "ugc_script",
]);

const STARTER_FEATURES: ReadonlySet<FeatureId> = new Set([
  "brand_kit",
  "competitor_analyzer",
  "landing_analyzer",
  "social_scheduler",
  "brand_memory",
  "advanced_ai_preferences",
]);

const PRO_FEATURES: ReadonlySet<FeatureId> = new Set([
  "premium_ai_quality",
  "priority_processing",
  "priority_support",
]);

export type FeatureCatalogEntry = {
  id: GatedFeatureId;
  label: string;
  description: string;
  /** Lowest paid tier that unlocks this feature. */
  minPlan: "starter" | "pro";
  icon: string;
};

export const FEATURE_CATALOG: Record<GatedFeatureId, FeatureCatalogEntry> = {
  brand_kit: {
    id: "brand_kit",
    label: "Brand Kit",
    description:
      "Save your brand colors, tone, and messaging rules so every ad stays perfectly on-brand.",
    minPlan: "starter",
    icon: "🎨",
  },
  competitor_analyzer: {
    id: "competitor_analyzer",
    label: "Competitor Analyzer",
    description:
      "Upload competitor ads and get AI breakdowns of hooks, angles, and creative strategy.",
    minPlan: "starter",
    icon: "🔍",
  },
  landing_analyzer: {
    id: "landing_analyzer",
    label: "Landing Page Analyzer",
    description:
      "Paste any URL and get conversion-focused insights, copy suggestions, and page audits.",
    minPlan: "starter",
    icon: "🌐",
  },
  social_scheduler: {
    id: "social_scheduler",
    label: "Social Scheduler",
    description:
      "Plan and schedule your ad copy across platforms from one creative workspace.",
    minPlan: "starter",
    icon: "📅",
  },
  advanced_ai_preferences: {
    id: "advanced_ai_preferences",
    label: "Advanced AI Preferences",
    description:
      "Fine-tune platform, audience, brand voice, creative level, and CTA style for every generation.",
    minPlan: "starter",
    icon: "⚙️",
  },
  premium_ai_quality: {
    id: "premium_ai_quality",
    label: "Premium AI Output",
    description:
      "Unlock GPT-4o premium quality for sharper hooks, captions, and UGC scripts.",
    minPlan: "pro",
    icon: "✨",
  },
  priority_processing: {
    id: "priority_processing",
    label: "Priority Processing",
    description:
      "Skip the queue with faster AI generations when you need creative output at scale.",
    minPlan: "pro",
    icon: "⚡",
  },
  priority_support: {
    id: "priority_support",
    label: "Priority Support",
    description:
      "Get faster responses from the Advora team when you need help with your account.",
    minPlan: "pro",
    icon: "💬",
  },
};

/** Maps dashboard routes to gated features (premium pages only). */
export const ROUTE_FEATURE_MAP: Record<string, GatedFeatureId> = {
  "/dashboard/brand-kit": "brand_kit",
  "/dashboard/competitor-analyzer": "competitor_analyzer",
  "/dashboard/landing-analyzer": "landing_analyzer",
  "/dashboard/social-scheduler": "social_scheduler",
};

export function resolveEffectivePlan(
  plan: PlanId,
  subscriptionStatus: SubscriptionStatus | string
): PlanId {
  if (plan === "free") {
    return "free";
  }

  if (subscriptionStatus !== "active") {
    return "free";
  }

  return plan;
}

function planTierRank(plan: PlanId): number {
  switch (plan) {
    case "free":
      return 0;
    case "starter":
      return 1;
    case "pro":
      return 2;
    case "custom":
      return 3;
    default:
      return 0;
  }
}

function featureMinTier(feature: FeatureId): number {
  if (FREE_FEATURES.has(feature)) {
    return 0;
  }
  if (STARTER_FEATURES.has(feature)) {
    return 1;
  }
  if (PRO_FEATURES.has(feature)) {
    return 2;
  }
  return 0;
}

export function canAccessFeature(
  plan: PlanId,
  subscriptionStatus: SubscriptionStatus | string,
  feature: FeatureId
): boolean {
  const effectivePlan = resolveEffectivePlan(plan, subscriptionStatus);
  return planTierRank(effectivePlan) >= featureMinTier(feature);
}

export function buildFeatureAccessMap(
  plan: PlanId,
  subscriptionStatus: SubscriptionStatus | string
): Record<FeatureId, boolean> {
  const allFeatures: FeatureId[] = [
    ...FREE_FEATURES,
    ...STARTER_FEATURES,
    ...PRO_FEATURES,
  ];

  return Object.fromEntries(
    allFeatures.map((feature) => [
      feature,
      canAccessFeature(plan, subscriptionStatus, feature),
    ])
  ) as Record<FeatureId, boolean>;
}

export function isGatedFeature(feature: FeatureId): feature is GatedFeatureId {
  return feature in FEATURE_CATALOG;
}

export function getFeatureForRoute(pathname: string): GatedFeatureId | null {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  return ROUTE_FEATURE_MAP[normalized] ?? null;
}

export function isPremiumNavFeature(feature: GatedFeatureId): boolean {
  return FEATURE_CATALOG[feature].minPlan === "starter";
}
