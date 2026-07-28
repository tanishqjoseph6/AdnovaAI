import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPaidPlanAmountMinor,
  getPlanPriceQuote,
  PLAN_CURRENCY,
  YEARLY_DISCOUNT_PERCENT,
} from "./pricing";

describe("billing pricing", () => {
  it("uses USD as the canonical plan currency", () => {
    assert.equal(PLAN_CURRENCY, "USD");
  });

  it("monthly USD prices", () => {
    assert.equal(
      getPlanPriceQuote("starter", "monthly").displayAmount,
      "$19"
    );
    assert.equal(getPaidPlanAmountMinor("starter", "monthly"), 1900);
    assert.equal(getPlanPriceQuote("pro", "monthly").displayAmount, "$59");
    assert.equal(getPaidPlanAmountMinor("pro", "monthly"), 5900);
  });

  it("yearly USD prices with 20% discount", () => {
    assert.equal(YEARLY_DISCOUNT_PERCENT, 20);
    assert.equal(
      getPlanPriceQuote("starter", "yearly").displayAmount,
      "$182"
    );
    assert.equal(getPaidPlanAmountMinor("starter", "yearly"), 18200);
    assert.equal(getPlanPriceQuote("pro", "yearly").displayAmount, "$566");
    assert.equal(getPlanPriceQuote("starter", "yearly").showSaveBadge, true);
  });
});
