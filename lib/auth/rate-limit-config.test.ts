import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_RATE_LIMITS,
  buildRateLimitBucketKey,
  formatRateLimitMessage,
} from "./rate-limit-config";

describe("auth rate limit config", () => {
  it("defines expected limits", () => {
    assert.equal(AUTH_RATE_LIMITS.signup.maxAttempts, 5);
    assert.equal(AUTH_RATE_LIMITS.signup.windowSeconds, 3600);
    assert.equal(AUTH_RATE_LIMITS.login.maxAttempts, 10);
    assert.equal(AUTH_RATE_LIMITS.otp_send.maxAttempts, 3);
    assert.equal(AUTH_RATE_LIMITS.otp_send.windowSeconds, 600);
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
    assert.match(formatRateLimitMessage(45, "login"), /45 seconds/);
    assert.match(formatRateLimitMessage(120, "signup"), /2 minutes/);
    assert.match(formatRateLimitMessage(7200, "otp_send"), /2 hours/);
  });
});
