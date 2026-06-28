import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSafeAuthRedirect } from "./safe-redirect";

describe("safe auth redirect", () => {
  it("allows same-origin paths", () => {
    assert.equal(resolveSafeAuthRedirect("/dashboard"), "/dashboard");
    assert.equal(resolveSafeAuthRedirect("/reset-password"), "/reset-password");
  });

  it("blocks open redirects", () => {
    assert.equal(resolveSafeAuthRedirect("//evil.com"), "/dashboard");
    assert.equal(resolveSafeAuthRedirect("/\\evil"), "/dashboard");
    assert.equal(resolveSafeAuthRedirect("https://evil.com"), "/dashboard");
  });

  it("uses fallback for empty values", () => {
    assert.equal(resolveSafeAuthRedirect(null), "/dashboard");
    assert.equal(resolveSafeAuthRedirect("", "/login"), "/login");
  });
});
