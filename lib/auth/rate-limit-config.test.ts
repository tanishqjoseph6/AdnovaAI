import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_RATE_LIMITS,
  buildRateLimitBucketKey,
  formatRateLimitMessage,
} from "./rate-limit-config";

describe("auth rate limit config", () => {
  it("defines targeted security limits", () => {
    assert.equal("signup" in AUTH_RATE_LIMITS, false);
    assert.equal("login" in AUTH_RATE_LIMITS, false);
    assert.equal(AUTH_RATE_LIMITS.failed_login.maxAttempts, 10);
    assert.equal(AUTH_RATE_LIMITS.failed_login.windowSeconds, 15 * 60);
    assert.equal(AUTH_RATE_LIMITS.forgot_password.maxAttempts, 3);
    assert.equal(AUTH_RATE_LIMITS.resend_verification.maxAttempts, 3);
  });

  it("builds normalized bucket keys", () => {
    assert.equal(
      buildRateLimitBucketKey("email", " User@Example.com "),
      "email:user@example.com"
    );
    assert.equal(buildRateLimitBucketKey("ip", "127.0.0.1"), "ip:127.0.0.1");
  });

  it("formats friendly retry messages", () => {
    assert.match(formatRateLimitMessage(45, "failed_login"), /45 seconds/);
    assert.match(formatRateLimitMessage(120, "forgot_password"), /2 minutes/);
    assert.match(
      formatRateLimitMessage(7200, "resend_verification"),
      /2 hours/
    );
  });
});
