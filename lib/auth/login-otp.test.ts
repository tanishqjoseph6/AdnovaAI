import assert from "node:assert/strict";
import {
  LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  LOGIN_OTP_UNVERIFIED_MESSAGE,
} from "./errors";
import { describe, it } from "node:test";

describe("login OTP messages", () => {
  it("uses a distinct no-account message", () => {
    assert.match(LOGIN_OTP_NO_ACCOUNT_MESSAGE, /sign up/i);
  });

  it("uses a distinct unverified message", () => {
    assert.match(LOGIN_OTP_UNVERIFIED_MESSAGE, /verify your email/i);
  });
});

describe("login OTP error mapping", () => {
  it("maps otp disabled to no-account message", async () => {
    const { mapAuthErrorMessage } = await import("./errors");
    assert.equal(
      mapAuthErrorMessage("Signups not allowed for otp"),
      LOGIN_OTP_NO_ACCOUNT_MESSAGE
    );
  });
});
