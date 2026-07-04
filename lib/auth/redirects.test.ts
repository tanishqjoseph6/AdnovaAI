import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("auth redirects", () => {
  it("builds production callback URLs", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://useadvora.com";

    const { getAuthCallbackUrl, getPasswordResetCallbackUrl } = await import(
      "./redirects"
    );

    assert.equal(
      getAuthCallbackUrl("/dashboard"),
      "https://useadvora.com/auth/callback?next=%2Fdashboard"
    );
    assert.equal(
      getPasswordResetCallbackUrl(),
      "https://useadvora.com/auth/callback?next=%2Freset-password"
    );

    if (previousSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
