export type CompetitorScoreInputs = {
  hook_score: number;
  cta_score: number;
  visual_score: number;
  copy_score: number;
  trust_score: number;
  offer_score: number;
  psychology_score: number;
};

export const COMPETITOR_SCORE_WEIGHTS: Record<
  keyof CompetitorScoreInputs,
  number
> = {
  hook_score: 0.18,
  cta_score: 0.16,
  visual_score: 0.16,
  copy_score: 0.14,
  trust_score: 0.12,
  offer_score: 0.12,
  psychology_score: 0.12,
};

const SCORE_KEYS: (keyof CompetitorScoreInputs)[] = [
  "hook_score",
  "cta_score",
  "visual_score",
  "copy_score",
  "trust_score",
  "offer_score",
  "psychology_score",
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

export function computeOverallCompetitorScore(
  inputs: CompetitorScoreInputs
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of SCORE_KEYS) {
    const score = inputs[key];
    if (score > 0) {
      weightedSum += score * COMPETITOR_SCORE_WEIGHTS[key];
      weightTotal += COMPETITOR_SCORE_WEIGHTS[key];
    }
  }

  if (weightTotal === 0) {
    return 0;
  }

  return clampScore(weightedSum / weightTotal);
}

export function getCompetitorScoreColor(score: number): string {
  if (score <= 39) return "#EF4444";
  if (score <= 69) return "#FACC15";
  return "#22C55E";
}

export function readCompetitorScoreInputs(
  record: Record<string, unknown>
): CompetitorScoreInputs {
  const scores =
    record.scores && typeof record.scores === "object"
      ? (record.scores as Record<string, unknown>)
      : record;

  return {
    hook_score: clampScore(scores.hook_score),
    cta_score: clampScore(scores.cta_score),
    visual_score: clampScore(scores.visual_score),
    copy_score: clampScore(scores.copy_score),
    trust_score: clampScore(scores.trust_score),
    offer_score: clampScore(scores.offer_score),
    psychology_score: clampScore(scores.psychology_score),
  };
}

export function hasValidCompetitorScores(
  inputs: CompetitorScoreInputs
): boolean {
  return SCORE_KEYS.some((key) => inputs[key] > 0);
}

export type ComparisonScoreInputs = {
  hook_score: number;
  cta_score: number;
  offer_score: number;
  psychology_score: number;
  urgency_fomo_score: number;
};

const COMPARISON_WEIGHTS: Record<keyof ComparisonScoreInputs, number> = {
  hook_score: 0.25,
  cta_score: 0.2,
  offer_score: 0.2,
  psychology_score: 0.2,
  urgency_fomo_score: 0.15,
};

export function computeComparisonOverall(
  inputs: ComparisonScoreInputs
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of Object.keys(COMPARISON_WEIGHTS) as (keyof ComparisonScoreInputs)[]) {
    const score = inputs[key];
    if (score > 0) {
      weightedSum += score * COMPARISON_WEIGHTS[key];
      weightTotal += COMPARISON_WEIGHTS[key];
    }
  }

  if (weightTotal === 0) {
    return 0;
  }

  return clampScore(weightedSum / weightTotal);
}

export const ANALYSIS_CONFIDENCE_HIGH = 80;
export const ANALYSIS_CONFIDENCE_MEDIUM = 70;
