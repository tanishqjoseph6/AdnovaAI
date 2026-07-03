import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("site url", () => {
  it("defaults to production URL when env is unset in production", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    const { resolveSiteOrigin } = await import("./site-url");
    assert.equal(resolveSiteOrigin(null), "https://useadvora.com");

    process.env.NODE_ENV = previousNodeEnv;
    if (previousSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
    if (previousAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
    }
  });

  it("prefers NEXT_PUBLIC_SITE_URL when configured", async () => {
    const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://useadvora.com";

    const { resolveSiteOrigin } = await import("./site-url");
    assert.equal(resolveSiteOrigin(null), "https://useadvora.com");

    if (previousSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    }
  });
});
