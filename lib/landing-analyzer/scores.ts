export type LandingPageScoreInputs = {
  hero_score: number;
  cta_score: number;
  trust_score: number;
  offer_score: number;
  copy_score: number;
  social_proof_score: number;
  visual_hierarchy_score: number;
  mobile_ux_score: number;
};

export type ScoreLabel =
  | "Needs Improvement"
  | "Average"
  | "Good"
  | "Excellent";

export const CONVERSION_SCORE_WEIGHTS: Record<
  keyof LandingPageScoreInputs,
  number
> = {
  hero_score: 0.15,
  cta_score: 0.15,
  trust_score: 0.125,
  offer_score: 0.125,
  copy_score: 0.15,
  social_proof_score: 0.125,
  visual_hierarchy_score: 0.1,
  mobile_ux_score: 0.1,
};

const SCORE_DIMENSIONS: (keyof LandingPageScoreInputs)[] = [
  "hero_score",
  "cta_score",
  "trust_score",
  "offer_score",
  "copy_score",
  "social_proof_score",
  "visual_hierarchy_score",
  "mobile_ux_score",
];

export function clampScore(value: unknown): number {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "integer") {
      return 0;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return Math.min(100, Math.max(0, Math.round(parsed)));
    }
    return 0;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Weighted average across all provided component scores.
 * Missing dimensions (0) are excluded and weights are renormalized.
 */
export function computeWeightedAverage(
  inputs: LandingPageScoreInputs
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of SCORE_DIMENSIONS) {
    const score = inputs[key];
    if (score > 0) {
      weightedSum += score * CONVERSION_SCORE_WEIGHTS[key];
      weightTotal += CONVERSION_SCORE_WEIGHTS[key];
    }
  }

  if (weightTotal === 0) {
    return 0;
  }

  return clampScore(weightedSum / weightTotal);
}

/** Overall conversion score is always the weighted average of component scores. */
export function computeConversionScore(
  inputs: LandingPageScoreInputs
): number {
  return computeWeightedAverage(inputs);
}

export function getScoreColor(score: number): string {
  if (score <= 39) return "#EF4444";
  if (score <= 69) return "#FACC15";
  return "#22C55E";
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score <= 39) return "Needs Improvement";
  if (score <= 69) return "Average";
  if (score <= 84) return "Good";
  return "Excellent";
}

export function hasValidComponentScores(
  inputs: LandingPageScoreInputs
): boolean {
  return SCORE_DIMENSIONS.some((key) => inputs[key] > 0);
}

function averageDefinedScores(scores: number[]): number {
  const defined = scores.filter((score) => score > 0);
  if (defined.length === 0) {
    return 0;
  }
  return clampScore(
    defined.reduce((sum, score) => sum + score, 0) / defined.length
  );
}

export function readScoreField(
  record: Record<string, unknown>,
  primaryKey: string,
  legacyKeys: string[] = []
): number {
  const primary = clampScore(record[primaryKey]);
  if (primary > 0) {
    return primary;
  }

  return averageDefinedScores(
    legacyKeys.map((key) => clampScore(record[key]))
  );
}

export function buildScoreInputs(
  record: Record<string, unknown>
): LandingPageScoreInputs {
  return {
    hero_score: readScoreField(record, "hero_score"),
    cta_score: readScoreField(record, "cta_score"),
    trust_score: readScoreField(record, "trust_score"),
    offer_score: readScoreField(record, "offer_score"),
    copy_score: readScoreField(record, "copy_score", [
      "value_proposition_score",
      "content_clarity_score",
    ]),
    social_proof_score: readScoreField(record, "social_proof_score"),
    visual_hierarchy_score: readScoreField(record, "visual_hierarchy_score", [
      "content_clarity_score",
    ]),
    mobile_ux_score: readScoreField(record, "mobile_ux_score", [
      "conversion_optimization_score",
    ]),
  };
}
