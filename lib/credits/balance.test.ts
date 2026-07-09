import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyDeduction,
  applyMonthlyRefill,
  applyPurchase,
  canAfford,
  computeCurrentCredits,
  computeDeductionSplit,
} from "./balance";
import {
  resolveFeatureCost,
  isZeroCostFeature,
  featureForContentKind,
  CREDIT_FEATURES,
} from "./schema";
import { parseDeductCreditsRpcResult } from "./deduct";

describe("computeCurrentCredits", () => {
  it("sums monthly and purchased buckets", () => {
    assert.equal(computeCurrentCredits(5, 10), 15);
    assert.equal(computeCurrentCredits(0, 0), 0);
  });
});

describe("computeDeductionSplit", () => {
  it("deducts from monthly first", () => {
    const split = computeDeductionSplit(5, 10, 3);
    assert.deepEqual(split, {
      fromMonthly: 3,
      fromPurchased: 0,
      total: 3,
      source: "monthly",
    });
  });

  it("spills into purchased when monthly is insufficient", () => {
    const split = computeDeductionSplit(2, 10, 5);
    assert.deepEqual(split, {
      fromMonthly: 2,
      fromPurchased: 3,
      total: 5,
      source: "mixed",
    });
  });

  it("returns null when balance is insufficient", () => {
    assert.equal(computeDeductionSplit(1, 1, 5), null);
  });

  it("handles zero-cost operations", () => {
    const split = computeDeductionSplit(5, 5, 0);
    assert.deepEqual(split?.total, 0);
  });
});

describe("applyDeduction", () => {
  it("updates all bucket fields", () => {
    const result = applyDeduction(
      {
        monthlyCredits: 5,
        purchasedCredits: 10,
        currentCredits: 15,
        totalUsedCredits: 0,
        monthlyAllowance: 5,
      },
      { fromMonthly: 3, fromPurchased: 2, total: 5, source: "mixed" }
    );

    assert.equal(result.monthlyCredits, 2);
    assert.equal(result.purchasedCredits, 8);
    assert.equal(result.currentCredits, 10);
    assert.equal(result.totalUsedCredits, 5);
  });
});

describe("applyMonthlyRefill", () => {
  it("resets monthly but preserves purchased", () => {
    const result = applyMonthlyRefill(
      {
        monthlyCredits: 0,
        purchasedCredits: 25,
        currentCredits: 25,
        totalUsedCredits: 75,
        monthlyAllowance: 5,
      },
      100
    );

    assert.equal(result.monthlyCredits, 100);
    assert.equal(result.purchasedCredits, 25);
    assert.equal(result.currentCredits, 125);
    assert.equal(result.totalUsedCredits, 75);
  });
});

describe("applyPurchase", () => {
  it("adds to purchased bucket only", () => {
    const result = applyPurchase(
      {
        monthlyCredits: 5,
        purchasedCredits: 0,
        currentCredits: 5,
        totalUsedCredits: 10,
        monthlyAllowance: 5,
      },
      50
    );

    assert.equal(result.purchasedCredits, 50);
    assert.equal(result.currentCredits, 55);
    assert.equal(result.monthlyCredits, 5);
  });
});

describe("canAfford", () => {
  it("allows unlimited users regardless of balance", () => {
    assert.equal(canAfford({ currentCredits: 0 }, 100, true), true);
  });

  it("checks balance for metered users", () => {
    assert.equal(canAfford({ currentCredits: 5 }, 3, false), true);
    assert.equal(canAfford({ currentCredits: 2 }, 3, false), false);
  });
});

describe("feature costs", () => {
  it("resolves default costs", () => {
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.GENERATE_ADS), 7);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.HOOKS), 2);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.CAPTION), 1);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.CTA), 1);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.UGC_SCRIPT), 3);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.ANALYZE_COMPETITOR_AD), 10);
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.ANALYZE_LANDING_PAGE), 15);
  });

  it("prefers DB cost when provided", () => {
    assert.equal(resolveFeatureCost(CREDIT_FEATURES.GENERATE_ADS, 3), 3);
  });

  it("identifies zero-cost features", () => {
    assert.equal(isZeroCostFeature(CREDIT_FEATURES.SCORE_GENERATED_ADS), true);
    assert.equal(isZeroCostFeature(CREDIT_FEATURES.GENERATE_ADS), false);
  });

  it("maps content kinds to per-item features", () => {
    assert.equal(featureForContentKind("hook"), CREDIT_FEATURES.HOOKS);
    assert.equal(featureForContentKind("caption"), CREDIT_FEATURES.CAPTION);
    assert.equal(featureForContentKind("cta"), CREDIT_FEATURES.CTA);
    assert.equal(
      featureForContentKind("ugcScript"),
      CREDIT_FEATURES.UGC_SCRIPT
    );
  });
});

describe("parseDeductCreditsRpcResult", () => {
  it("parses a successful deduction", () => {
    const result = parseDeductCreditsRpcResult({
      deducted: true,
      unlimited: false,
      insufficient: false,
      credits: 4,
      plan: "free",
      cost: 1,
      credit_source: "monthly",
    });

    assert.equal(result.deducted, true);
    assert.equal(result.credits, 4);
    assert.equal(result.cost, 1);
    assert.equal(result.creditSource, "monthly");
  });

  it("parses unlimited plan response", () => {
    const result = parseDeductCreditsRpcResult({
      deducted: false,
      unlimited: true,
      insufficient: false,
      credits: 5,
      plan: "pro",
      cost: 1,
    });

    assert.equal(result.unlimited, true);
    assert.equal(result.plan, "pro");
  });
});
