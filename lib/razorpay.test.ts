import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPaidPlan } from "@/lib/billing/plans";
import { createRazorpayReceipt } from "@/lib/razorpay";

describe("razorpay order receipts", () => {
  it("creates short unique Razorpay receipt values", () => {
    const receipts = new Set<string>();

    for (let index = 0; index < 1000; index += 1) {
      const receipt = createRazorpayReceipt();

      assert.match(receipt, /^adv_\d{8}_[a-f0-9]{12}$/);
      assert.ok(receipt.length <= 40);
      assert.equal(receipts.has(receipt), false);
      receipts.add(receipt);
    }
  });

  it("keeps Starter and Pro eligible for Razorpay orders", () => {
    assert.equal(isPaidPlan("starter"), true);
    assert.equal(isPaidPlan("pro"), true);
  });
});
