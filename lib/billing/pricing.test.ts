import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPaidPlanAmountMinor,
  getPlanPriceQuote,
  YEARLY_DISCOUNT_PERCENT,
} from "./pricing";

describe("billing pricing", () => {
  it("monthly INR prices", () => {
    assert.equal(
      getPlanPriceQuote("starter", "monthly", "INR").displayAmount,
      "₹999"
    );
    assert.equal(getPaidPlanAmountMinor("starter", "monthly", "INR"), 99900);
    assert.equal(
      getPlanPriceQuote("pro", "monthly", "INR").displayAmount,
      "₹2,999"
    );
  });

  it("yearly INR prices with 20% discount", () => {
    assert.equal(YEARLY_DISCOUNT_PERCENT, 20);
    assert.equal(
      getPlanPriceQuote("starter", "yearly", "INR").displayAmount,
      "₹9,590"
    );
    assert.equal(getPaidPlanAmountMinor("starter", "yearly", "INR"), 959000);
    assert.equal(
      getPlanPriceQuote("pro", "yearly", "INR").displayAmount,
      "₹28,790"
    );
    assert.equal(getPlanPriceQuote("starter", "yearly", "INR").showSaveBadge, true);
  });

  it("monthly USD prices", () => {
    assert.equal(
      getPlanPriceQuote("starter", "monthly", "USD").displayAmount,
      "$19"
    );
    assert.equal(getPaidPlanAmountMinor("starter", "monthly", "USD"), 1900);
    assert.equal(getPlanPriceQuote("pro", "monthly", "USD").displayAmount, "$59");
  });

  it("yearly USD prices", () => {
    assert.equal(
      getPlanPriceQuote("starter", "yearly", "USD").displayAmount,
      "$182"
    );
    assert.equal(
      getPlanPriceQuote("pro", "yearly", "USD").displayAmount,
      "$566"
    );
  });
});
