import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  LOGIN_OTP_UNVERIFIED_MESSAGE,
} from "./errors";
import {
  evaluateLoginOtpEligibility,
  getLoginOtpSendOptions,
} from "./login-otp";

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

describe("login OTP eligibility", () => {
  it("allows verified existing users", () => {
    assert.deepEqual(
      evaluateLoginOtpEligibility({ registered: true, confirmed: true }),
      { allowed: true }
    );
  });

  it("blocks unverified users before OTP send or verify", () => {
    assert.deepEqual(
      evaluateLoginOtpEligibility({ registered: true, confirmed: false }),
      {
        allowed: false,
        message: LOGIN_OTP_UNVERIFIED_MESSAGE,
        status: 403,
      }
    );
  });

  it("blocks new users before OTP send or verify", () => {
    assert.deepEqual(
      evaluateLoginOtpEligibility({ registered: false, confirmed: false }),
      {
        allowed: false,
        message: LOGIN_OTP_NO_ACCOUNT_MESSAGE,
        status: 404,
      }
    );
  });
});

describe("login OTP send options", () => {
  it("never asks Supabase to create a user", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://useadvora.com";

    const options = getLoginOtpSendOptions();
    assert.equal(options.shouldCreateUser, false);
    assert.match(options.emailRedirectTo, /^https:\/\/useadvora\.com\/auth\/callback/);

    if (previousSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
