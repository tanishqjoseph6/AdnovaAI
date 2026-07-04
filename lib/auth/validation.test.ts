import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DUPLICATE_EMAIL_MESSAGE, mapAuthErrorMessage } from "./errors";
import {
  isValidEmail,
  normalizeEmail,
  validateSignupInput,
} from "./validation";

describe("auth validation", () => {
  it("normalizes email", () => {
    assert.equal(normalizeEmail("  Test@Example.COM "), "test@example.com");
  });

  it("validates email format", () => {
    assert.equal(isValidEmail("user@example.com"), true);
    assert.equal(isValidEmail("not-an-email"), false);
  });

  it("requires password length", () => {
    const result = validateSignupInput("user@example.com", "short");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /8 characters/);
    }
  });
});

describe("auth errors", () => {
  it("maps duplicate registration errors", () => {
    assert.equal(
      mapAuthErrorMessage("User already registered"),
      DUPLICATE_EMAIL_MESSAGE
    );
    assert.equal(
      DUPLICATE_EMAIL_MESSAGE,
      "An account already exists with this email. Please log in."
    );
  });

  it("hides internal error details", () => {
    assert.equal(
      mapAuthErrorMessage("PGRST116: JWT expired in rpc call"),
      "Something went wrong. Please try again."
    );
  });

  it("preserves client-safe callback messages", () => {
    const message =
      "Email verification failed. Please try again or request a new link.";
    assert.equal(mapAuthErrorMessage(message), message);
  });
});

describe("password reset", () => {
  it("validates matching passwords", async () => {
    const { validateNewPassword } = await import("./password-reset");
    const invalid = validateNewPassword("password123", "password456");
    assert.equal(invalid.ok, false);

    const valid = validateNewPassword("password123", "password123");
    assert.equal(valid.ok, true);
  });

  it("uses production forgot-password messaging and redirect", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://useadvora.com";

    const {
      FORGOT_PASSWORD_SUCCESS_MESSAGE,
      getPasswordResetRedirectUrl,
    } = await import("./password-reset");

    assert.equal(
      FORGOT_PASSWORD_SUCCESS_MESSAGE,
      "✅ Password reset link sent. Please check your email."
    );
    assert.equal(
      getPasswordResetRedirectUrl(),
      "https://useadvora.com/auth/callback?next=%2Freset-password"
    );

    if (previousSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
