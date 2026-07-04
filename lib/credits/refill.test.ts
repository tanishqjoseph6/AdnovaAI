import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CREDIT_REFILL_PERIOD_MS,
  isCreditRefillDue,
  resolveCreditRefillAmount,
  resolveCreditRefillAnchor,
} from "./refill";

describe("credit refill", () => {
  it("uses signup date for free users", () => {
    const anchor = resolveCreditRefillAnchor({
      billingPlan: "free",
      subscriptionStatus: "inactive",
      purchaseDate: null,
      signupDate: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(anchor?.toISOString(), "2026-01-01T00:00:00.000Z");
  });

  it("uses purchase date for active starter subscriptions", () => {
    const anchor = resolveCreditRefillAnchor({
      billingPlan: "starter",
      subscriptionStatus: "active",
      purchaseDate: "2026-02-15T00:00:00.000Z",
      signupDate: "2026-01-01T00:00:00.000Z",
    });

    assert.equal(anchor?.toISOString(), "2026-02-15T00:00:00.000Z");
  });

  it("detects when 30 days have elapsed", () => {
    const anchor = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date(anchor.getTime() + CREDIT_REFILL_PERIOD_MS);

    assert.equal(isCreditRefillDue(null, anchor, now), true);
    assert.equal(
      isCreditRefillDue("2026-01-15T00:00:00.000Z", anchor, now),
      false
    );
  });

  it("resolves refill amounts by plan", () => {
    assert.equal(resolveCreditRefillAmount("free", "inactive"), 5);
    assert.equal(resolveCreditRefillAmount("starter", "active"), 100);
    assert.equal(resolveCreditRefillAmount("pro", "active"), null);
    assert.equal(resolveCreditRefillAmount("custom", "active"), null);
  });
});
