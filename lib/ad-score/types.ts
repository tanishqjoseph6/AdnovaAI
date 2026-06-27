import {
  computeOverallAdScore,
  hasValidAdScoreInputs,
  readAdScoreInputs,
  type AdScoreInputs,
} from "@/lib/ad-score/scores";

export type AdScoreBreakdown = AdScoreInputs & {
  overall_score: number;
};

export type AdScoreImprovements = {
  strengths: string[];
  weaknesses: string[];
  actionable_suggestions: string[];
  estimated_conversion_improvement: string;
};

export type AdScoreAnalysis = {
  scores: AdScoreBreakdown;
  improvements: AdScoreImprovements;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeImprovements(raw: unknown): AdScoreImprovements {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    strengths: toStringArray(record.strengths),
    weaknesses: toStringArray(record.weaknesses),
    actionable_suggestions: toStringArray(
      record.actionable_suggestions ?? record.suggestions
    ),
    estimated_conversion_improvement: readString(
      record,
      "estimated_conversion_improvement"
    ),
  };
}

export function normalizeAdScoreAnalysis(raw: unknown): AdScoreAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const inputs = readAdScoreInputs(record);

  if (!hasValidAdScoreInputs(inputs)) {
    return null;
  }

  return {
    scores: {
      ...inputs,
      overall_score: computeOverallAdScore(inputs),
    },
    improvements: normalizeImprovements(record.improvements),
  };
}

export type GeneratedAdsPayload = {
  productDescription: string;
  hooks: string[];
  captions: string[];
  ctas: string[];
  ugcScript: string;
};
