import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPaidPlan } from "@/lib/billing/plans";
import {
  assertRazorpayConfig,
  createRazorpayReceipt,
  getPublicRazorpayKeyId,
  getRazorpayConfigDiagnostics,
  getRazorpayKeyMode,
  RazorpayConfigError,
} from "@/lib/razorpay";

function withEnv(values: Record<string, string | undefined>, fn: () => void) {
  const previous = new Map<string, string | undefined>();
  for (const key of Object.keys(values)) {
    previous.set(key, process.env[key]);
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  try {
    fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

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

  it("requires the public Razorpay key instead of falling back to backend key id", () => {
    withEnv(
      {
        RAZORPAY_KEY_ID: "rzp_live_backend",
        RAZORPAY_KEY_SECRET: "secret",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: undefined,
      },
      () => {
        assert.throws(
          () => getPublicRazorpayKeyId(),
          /NEXT_PUBLIC_RAZORPAY_KEY_ID/
        );
      }
    );
  });

  it("rejects mismatched public and backend Razorpay key ids", () => {
    withEnv(
      {
        RAZORPAY_KEY_ID: "rzp_live_backend",
        RAZORPAY_KEY_SECRET: "secret",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_public",
      },
      () => {
        assert.throws(
          () => assertRazorpayConfig(),
          RazorpayConfigError
        );
        const diagnostics = getRazorpayConfigDiagnostics();
        assert.equal(diagnostics.keyIdsMatch, false);
        assert.equal(diagnostics.serverKeyMode, "live");
        assert.equal(diagnostics.publicKeyMode, "test");
      }
    );
  });

  it("accepts matching live Razorpay keys for checkout", () => {
    withEnv(
      {
        RAZORPAY_KEY_ID: "rzp_live_matching",
        RAZORPAY_KEY_SECRET: "secret",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_live_matching",
        VERCEL_ENV: "production",
      },
      () => {
        const config = assertRazorpayConfig();
        assert.equal(config.publicKeyId, "rzp_live_matching");
        assert.equal(config.serverKeyId, "rzp_live_matching");
        assert.equal(config.mode, "live");
      }
    );
  });

  it("detects Razorpay key mode from key id prefixes", () => {
    assert.equal(getRazorpayKeyMode("rzp_live_abc"), "live");
    assert.equal(getRazorpayKeyMode("rzp_test_abc"), "test");
    assert.equal(getRazorpayKeyMode("invalid"), "unknown");
  });
});
