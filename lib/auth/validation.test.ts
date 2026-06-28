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
  });
});
