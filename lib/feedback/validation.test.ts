import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { computeFeedbackAnalytics } from "./server";
import { validateFeedbackInput } from "./validation";

describe("feedback validation", () => {
  it("requires rating and reaction", () => {
    const missing = validateFeedbackInput({
      category: "bug_report",
      subject: "Broken export",
      message: "The export button fails on mobile Safari.",
    });
    assert.equal(missing.ok, false);

    const valid = validateFeedbackInput({
      category: "bug_report",
      subject: "Broken export",
      message: "The export button fails on mobile Safari.",
      rating: 5,
      reaction: "loved_it",
    });
    assert.equal(valid.ok, true);
  });

  it("accepts expanded categories", () => {
    const result = validateFeedbackInput({
      category: "ai_output_quality",
      subject: "Tone mismatch",
      message: "Generated captions feel too formal for TikTok ads.",
      rating: 3,
      reaction: "needs_improvement",
    });
    assert.equal(result.ok, true);
  });
});

describe("feedback analytics", () => {
  it("computes rating and reaction distributions", () => {
    const analytics = computeFeedbackAnalytics([
      {
        id: "1",
        user_id: "u1",
        category: "bug_report",
        subject: "A",
        message: "Message long enough",
        screenshot_url: null,
        rating: 5,
        reaction: "loved_it",
        status: "new",
        admin_reply: null,
        replied_at: null,
        reviewed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        user_id: "u2",
        category: "feature_request",
        subject: "B",
        message: "Message long enough",
        screenshot_url: null,
        rating: 2,
        reaction: "frustrating",
        status: "new",
        admin_reply: null,
        replied_at: null,
        reviewed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    assert.equal(analytics.totalFeedback, 2);
    assert.equal(analytics.averageRating, 3.5);
    assert.equal(analytics.ratingDistribution.length, 5);
    assert.ok(analytics.reactionDistribution.length >= 2);
  });
});

describe("feedback premium migration", () => {
  const migration = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20250725_feedback_premium.sql"),
    "utf8"
  );

  it("adds rating, reaction, and workflow statuses", () => {
    assert.match(migration, /add column if not exists rating smallint/);
    assert.match(migration, /add column if not exists reaction text/);
    assert.match(migration, /user_feedback_status_check/);
    assert.match(migration, /ai_output_quality/);
  });
});
