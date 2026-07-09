/**
 * Canonical feature IDs for credit-consuming AI operations.
 * Costs are stored in `credit_feature_costs` (DB) and mirrored here as defaults.
 */
export const CREDIT_FEATURES = {
  /** Full ad generation (hooks + caption + CTA + UGC script). */
  GENERATE_ADS: "generate_ads",
  /** Individual content types — used for single-item rewrites and cost math. */
  HOOKS: "hooks",
  CAPTION: "caption",
  CTA: "cta",
  UGC_SCRIPT: "ugc_script",
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

/**
 * Default costs used when the DB row is unavailable (mirrors seed data).
 * A full ad generation costs the sum of its content pieces:
 * hooks(2) + caption(1) + CTA(1) + UGC script(3) = 7.
 */
export const DEFAULT_FEATURE_COSTS: Record<CreditFeatureId, number> = {
  [CREDIT_FEATURES.GENERATE_ADS]: 7,
  [CREDIT_FEATURES.HOOKS]: 2,
  [CREDIT_FEATURES.CAPTION]: 1,
  [CREDIT_FEATURES.CTA]: 1,
  [CREDIT_FEATURES.UGC_SCRIPT]: 3,
  [CREDIT_FEATURES.GENERATE_BETTER_COMPETITOR_AD]: 7,
  [CREDIT_FEATURES.ANALYZE_COMPETITOR_AD]: 10,
  [CREDIT_FEATURES.ANALYZE_LANDING_PAGE]: 15,
  [CREDIT_FEATURES.REWRITE_CONTENT]: 1,
  [CREDIT_FEATURES.SCORE_GENERATED_ADS]: 0,
  [CREDIT_FEATURES.ANALYZE_PRODUCT_IMAGE]: 0,
  [CREDIT_FEATURES.BRAND_KIT_AUTOFILL]: 0,
};

/**
 * Maps an editable content kind to the credit feature that governs its cost.
 * Used when rewriting a single content item.
 */
export function featureForContentKind(
  kind: "hook" | "caption" | "cta" | "ugcScript"
): CreditFeatureId {
  switch (kind) {
    case "hook":
      return CREDIT_FEATURES.HOOKS;
    case "caption":
      return CREDIT_FEATURES.CAPTION;
    case "cta":
      return CREDIT_FEATURES.CTA;
    case "ugcScript":
      return CREDIT_FEATURES.UGC_SCRIPT;
  }
}

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
