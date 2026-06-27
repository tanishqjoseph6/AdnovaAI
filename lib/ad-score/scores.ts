export type AdScoreInputs = {
  hook_score: number;
  cta_score: number;
  emotional_score: number;
  clarity_score: number;
  conversion_score: number;
  brand_fit_score: number;
};

export const AD_SCORE_WEIGHTS: Record<keyof AdScoreInputs, number> = {
  hook_score: 0.2,
  cta_score: 0.18,
  emotional_score: 0.15,
  clarity_score: 0.15,
  conversion_score: 0.17,
  brand_fit_score: 0.15,
};

const SCORE_DIMENSIONS: (keyof AdScoreInputs)[] = [
  "hook_score",
  "cta_score",
  "emotional_score",
  "clarity_score",
  "conversion_score",
  "brand_fit_score",
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

export function computeOverallAdScore(inputs: AdScoreInputs): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const key of SCORE_DIMENSIONS) {
    const score = inputs[key];
    if (score > 0) {
      weightedSum += score * AD_SCORE_WEIGHTS[key];
      weightTotal += AD_SCORE_WEIGHTS[key];
    }
  }

  if (weightTotal === 0) {
    return 0;
  }

  return clampScore(weightedSum / weightTotal);
}

export function getAdScoreColor(score: number): string {
  if (score <= 39) return "#EF4444";
  if (score <= 69) return "#FACC15";
  return "#22C55E";
}

export function hasValidAdScoreInputs(inputs: AdScoreInputs): boolean {
  return SCORE_DIMENSIONS.some((key) => inputs[key] > 0);
}

export function readAdScoreInputs(
  record: Record<string, unknown>
): AdScoreInputs {
  const scores =
    record.scores && typeof record.scores === "object"
      ? (record.scores as Record<string, unknown>)
      : record;

  return {
    hook_score: clampScore(scores.hook_score),
    cta_score: clampScore(scores.cta_score),
    emotional_score: clampScore(scores.emotional_score),
    clarity_score: clampScore(scores.clarity_score),
    conversion_score: clampScore(scores.conversion_score),
    brand_fit_score: clampScore(scores.brand_fit_score),
  };
}
