import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DUPLICATE_EMAIL_MESSAGE } from "./errors";

describe("account eligibility messages", () => {
  it("uses the required duplicate signup message", () => {
    assert.equal(
      DUPLICATE_EMAIL_MESSAGE,
      "An account already exists with this email. Please log in."
    );
  });
});

describe("auth errors duplicate signup", () => {
  it("maps duplicate_email pattern", async () => {
    const { mapAuthErrorMessage } = await import("./errors");
    assert.equal(
      mapAuthErrorMessage("duplicate_email"),
      DUPLICATE_EMAIL_MESSAGE
    );
  });
});
