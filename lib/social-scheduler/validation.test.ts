import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateScheduledPostInput } from "./validation";

describe("validateScheduledPostInput", () => {
  it("accepts valid X post", () => {
    const result = validateScheduledPostInput({
      platform: "x",
      caption: "Launch day is here.",
      scheduledFor: new Date(Date.now() + 60_000).toISOString(),
      imageUrl: null,
      imageStoragePath: null,
      notes: null,
    });

    assert.equal(result.ok, true);
  });

  it("rejects captions above platform limit", () => {
    const result = validateScheduledPostInput({
      platform: "x",
      caption: "a".repeat(281),
      scheduledFor: new Date(Date.now() + 60_000).toISOString(),
    });

    assert.equal(result.ok, false);
  });

  it("allows publish now without future schedule validation", () => {
    const result = validateScheduledPostInput({
      platform: "linkedin",
      caption: "Professional update.",
      scheduledFor: new Date(Date.now() - 60_000).toISOString(),
      publishNow: true,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.publishNow, true);
    }
  });
});
