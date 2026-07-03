import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaymentVerificationError } from "./payment-verification";
import {
  extractVerifiedPaymentDetails,
  parseRazorpayAmountMinor,
  resolveVerifiedRazorpayAmountMinor,
} from "./razorpay-ledger";

describe("razorpay ledger amounts", () => {
  it("parses Razorpay paise amounts", () => {
    assert.equal(parseRazorpayAmountMinor(99900, "payment"), 99900);
    assert.equal(parseRazorpayAmountMinor("99900", "payment"), 99900);
    assert.equal(parseRazorpayAmountMinor(299900, "order"), 299900);
  });

  it("requires payment and order amounts to match", () => {
    assert.equal(
      resolveVerifiedRazorpayAmountMinor({ amount: 99900 }, { amount: 99900 }),
      99900
    );

    assert.throws(
      () =>
        resolveVerifiedRazorpayAmountMinor({ amount: 99900 }, { amount: 959000 }),
      PaymentVerificationError
    );
  });

  it("extracts verified metadata from Razorpay entities", () => {
    const verified = extractVerifiedPaymentDetails({
      payment: {
        id: "pay_test123",
        order_id: "order_test456",
        amount: 299900,
        currency: "INR",
        notes: { user_id: "user-1", plan: "pro" },
      },
      order: {
        id: "order_test456",
        amount: 299900,
        notes: {
          user_id: "user-1",
          plan: "pro",
          interval: "monthly",
          currency: "INR",
          email: "user@example.com",
        },
      },
    });

    assert.equal(verified.amountMinor, 299900);
    assert.equal(verified.plan, "pro");
    assert.equal(verified.currency, "INR");
    assert.equal(verified.razorpayPaymentId, "pay_test123");
    assert.equal(verified.razorpayOrderId, "order_test456");
    assert.equal(verified.email, "user@example.com");
  });
});
