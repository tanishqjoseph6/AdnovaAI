import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthCallbackPath,
  isRecoveryCallback,
  isRecoveryHash,
  parseAuthHash,
  resolvePostAuthRedirect,
} from "./recovery";

describe("recovery auth helpers", () => {
  it("parses recovery hash tokens", () => {
    const params = parseAuthHash(
      "#access_token=abc&refresh_token=def&type=recovery"
    );
    assert.equal(params.access_token, "abc");
    assert.equal(params.refresh_token, "def");
    assert.equal(params.type, "recovery");
    assert.equal(isRecoveryHash(params), true);
  });

  it("detects recovery callback query params", () => {
    assert.equal(
      isRecoveryCallback(new URLSearchParams("type=recovery&token_hash=abc")),
      true
    );
    assert.equal(
      isRecoveryCallback(new URLSearchParams("next=%2Freset-password&code=abc")),
      true
    );
    assert.equal(
      isRecoveryCallback(new URLSearchParams("next=/dashboard&code=abc")),
      false
    );
  });

  it("resolves post-auth redirect for recovery flows", () => {
    assert.equal(resolvePostAuthRedirect(null, "recovery"), "/reset-password");
    assert.equal(
      resolvePostAuthRedirect("/reset-password", null),
      "/reset-password"
    );
    assert.equal(resolvePostAuthRedirect(null, null, "/dashboard"), "/dashboard");
    assert.equal(resolvePostAuthRedirect("/settings", null), "/settings");
  });

  it("builds auth callback paths", () => {
    assert.equal(
      buildAuthCallbackPath("abc123", "/reset-password"),
      "/auth/callback?code=abc123&next=%2Freset-password"
    );
  });
});
