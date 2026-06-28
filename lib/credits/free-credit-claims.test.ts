import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAttemptFreeCreditClaim,
  evaluateFreeCreditClaim,
  normalizeClaimEmail,
} from "./free-credit-claims";

describe("free credit claims", () => {
  it("normalizes claim emails", () => {
    assert.equal(normalizeClaimEmail("  User@Example.COM "), "user@example.com");
  });

  it("rejects invalid emails", () => {
    assert.equal(canAttemptFreeCreditClaim(""), false);
    assert.equal(canAttemptFreeCreditClaim("not-an-email"), false);
    assert.equal(canAttemptFreeCreditClaim(null), false);
  });

  it("allows valid emails", () => {
    assert.equal(canAttemptFreeCreditClaim("user@example.com"), true);
  });

  it("evaluates claim eligibility", () => {
    assert.deepEqual(evaluateFreeCreditClaim(undefined), {
      allowed: false,
      reason: "missing_email",
    });

    assert.deepEqual(evaluateFreeCreditClaim("bad"), {
      allowed: false,
      reason: "invalid_email",
    });

    assert.deepEqual(evaluateFreeCreditClaim("user@example.com"), {
      allowed: true,
      emailLower: "user@example.com",
    });
  });
});
