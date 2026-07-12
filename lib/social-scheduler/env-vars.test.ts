import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SOCIAL_OAUTH_ENV } from "./env-vars";

describe("SOCIAL_OAUTH_ENV", () => {
  it("uses canonical X OAuth variable names", () => {
    assert.equal(SOCIAL_OAUTH_ENV.X_CLIENT_ID, "X_CLIENT_ID");
    assert.equal(SOCIAL_OAUTH_ENV.X_CLIENT_SECRET, "X_CLIENT_SECRET");
  });

  it("uses canonical LinkedIn OAuth variable names", () => {
    assert.equal(SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_ID, "LINKEDIN_CLIENT_ID");
    assert.equal(
      SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_SECRET,
      "LINKEDIN_CLIENT_SECRET"
    );
  });
});
