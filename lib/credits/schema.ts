/**
 * Canonical feature IDs for credit-consuming AI operations.
 * Costs are stored in `credit_feature_costs` (DB) and mirrored here as defaults.
 */
export const CREDIT_FEATURES = {
  GENERATE_ADS: "generate_ads",
  GENERATE_BETTER_COMPETITOR_AD: "generate_better_competitor_ad",
  ANALYZE_COMPETITOR_AD: "analyze_competitor_ad",
  ANALYZE_LANDING_PAGE: "analyze_landing_page",
  REWRITE_CONTENT: "rewrite_content",
  SCORE_GENERATED_ADS: "score_generated_ads",
  ANALYZE_PRODUCT_IMAGE: "analyze_product_image",
  BRAND_KIT_AUTOFILL: "brand_kit_autofill",
} as const;

export type CreditFeatureId =
  (typeof CREDIT_FEATURES)[keyof typeof CREDIT_FEATURES];

/** Default costs used when DB row is unavailable (mirrors seed data). */
export const DEFAULT_FEATURE_COSTS: Record<CreditFeatureId, number> = {
  [CREDIT_FEATURES.GENERATE_ADS]: 1,
  [CREDIT_FEATURES.GENERATE_BETTER_COMPETITOR_AD]: 1,
  [CREDIT_FEATURES.ANALYZE_COMPETITOR_AD]: 0,
  [CREDIT_FEATURES.ANALYZE_LANDING_PAGE]: 1,
  [CREDIT_FEATURES.REWRITE_CONTENT]: 1,
  [CREDIT_FEATURES.SCORE_GENERATED_ADS]: 0,
  [CREDIT_FEATURES.ANALYZE_PRODUCT_IMAGE]: 0,
  [CREDIT_FEATURES.BRAND_KIT_AUTOFILL]: 0,
};

export type CreditTransactionType =
  | "debit"
  | "monthly_refill"
  | "purchase"
  | "grant"
  | "admin_adjust"
  | "referral_reward"
  | "subscription_sync";

export type CreditSource = "monthly" | "purchased" | "mixed" | "grant";

export type CreditPurchaseStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export function resolveFeatureCost(
  featureId: CreditFeatureId,
  dbCost?: number | null
): number {
  if (typeof dbCost === "number" && dbCost >= 0) {
    return dbCost;
  }
  return DEFAULT_FEATURE_COSTS[featureId] ?? 1;
}

export function isZeroCostFeature(featureId: CreditFeatureId): boolean {
  return resolveFeatureCost(featureId) === 0;
}
