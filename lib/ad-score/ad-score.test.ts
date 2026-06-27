import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeOverallAdScore,
  getAdScoreColor,
} from "./scores";
import { normalizeAdScoreAnalysis } from "./types";

describe("AI Ad Score", () => {
  it("computes overall score as weighted average of component scores", () => {
    const inputs = {
      hook_score: 82,
      cta_score: 76,
      emotional_score: 80,
      clarity_score: 78,
      conversion_score: 74,
      brand_fit_score: 79,
    };

    const overall = computeOverallAdScore(inputs);
    assert.equal(overall, 78);
  });

  it("ignores AI-provided overall score and computes server-side", () => {
    const analysis = normalizeAdScoreAnalysis({
      overall_score: 29,
      scores: {
        hook_score: 88,
        cta_score: 72,
        emotional_score: 85,
        clarity_score: 80,
        conversion_score: 78,
        brand_fit_score: 82,
      },
      improvements: {
        strengths: ["Strong hooks"],
        weaknesses: ["CTA could be sharper"],
        actionable_suggestions: ["Add urgency to CTA"],
        estimated_conversion_improvement: "10-15% estimated lift",
      },
    });

    assert.ok(analysis);
    assert.equal(
      analysis!.scores.overall_score,
      computeOverallAdScore({
        hook_score: 88,
        cta_score: 72,
        emotional_score: 85,
        clarity_score: 80,
        conversion_score: 78,
        brand_fit_score: 82,
      })
    );
    assert.notEqual(analysis!.scores.overall_score, 29);
  });

  it("maps score colors by range", () => {
    assert.equal(getAdScoreColor(35), "#EF4444");
    assert.equal(getAdScoreColor(55), "#FACC15");
    assert.equal(getAdScoreColor(85), "#22C55E");
  });
});
