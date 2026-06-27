import {
  ANALYSIS_CONFIDENCE_HIGH,
  ANALYSIS_CONFIDENCE_MEDIUM,
  computeComparisonOverall,
  computeOverallCompetitorScore,
  hasValidCompetitorScores,
  readCompetitorScoreInputs,
  clampScore,
  type CompetitorScoreInputs,
} from "@/lib/competitor-ad/scores";

export type CompetitorAdScores = CompetitorScoreInputs & {
  overall_score: number;
};

export type CompetitorScoreExplanations = {
  hook_score: string;
  cta_score: string;
  visual_score: string;
  copy_score: string;
  trust_score: string;
  offer_score: string;
  psychology_score: string;
  urgency_fomo_score: string;
};

export type AnalysisConfidenceLevel = "high" | "medium" | "low";

export type AnalysisConfidence = {
  level: AnalysisConfidenceLevel;
  percent: number;
};

export type ImprovedVersionPrediction = {
  overall_score: number;
  hook_score: number;
  cta_score: number;
  offer_score: number;
  psychology_score: number;
  urgency_fomo_score: number;
  overall_improvement: number;
  why_better: string;
  improved_hook: string;
  improved_cta: string;
  improved_offer: string;
  improved_psychology: string;
  improved_urgency: string;
};

export type PerformanceMetric = {
  value: string;
  reasoning: string;
};

export type PerformanceInsights = {
  conversion_potential: PerformanceMetric;
  estimated_ctr: PerformanceMetric;
  scroll_stop_rate: PerformanceMetric;
  purchase_intent: PerformanceMetric;
  engagement_probability: PerformanceMetric;
};

export type CompetitorAdSuggestions = {
  what_makes_successful: string[];
  weaknesses: string[];
  how_to_outperform: string[];
  better_cta_suggestions: string[];
  better_hook_suggestions: string[];
  better_offer_suggestions: string[];
};

export type CompetitorAdAnalysis = {
  id?: string;
  brand: string;
  product: string;
  platform: string;
  ad_objective: string;
  target_audience: string[];
  emotional_triggers: string[];
  marketing_psychology: string[];
  hook_analysis: string;
  cta_analysis: string;
  copywriting_quality: string;
  visual_quality: string;
  trust_signals: string[];
  offer_quality: string;
  urgency_fomo_score: number;
  scores: CompetitorAdScores;
  score_explanations: CompetitorScoreExplanations;
  analysis_confidence: AnalysisConfidence;
  improved_version: ImprovedVersionPrediction;
  performance_insights: PerformanceInsights;
  suggestions: CompetitorAdSuggestions;
};

export type BetterCompetitorAd = {
  hooks: string[];
  headlines: string[];
  captions: string[];
  ctas: string[];
  offers: string[];
  ugcScript: string;
  target_audience: string[];
  emotional_angle: string;
  visual_suggestions: string[];
};

export type CompetitorAnalysisRecord = {
  id: string;
  user_email: string | null;
  image_name: string | null;
  analysis: CompetitorAdAnalysis;
  better_ad: BetterCompetitorAd | null;
  created_at: string;
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

function readExplanation(
  record: Record<string, unknown>,
  key: string
): string {
  return readString(record, key);
}

function emptyScoreExplanations(): CompetitorScoreExplanations {
  return {
    hook_score: "",
    cta_score: "",
    visual_score: "",
    copy_score: "",
    trust_score: "",
    offer_score: "",
    psychology_score: "",
    urgency_fomo_score: "",
  };
}

function normalizeScoreExplanations(raw: unknown): CompetitorScoreExplanations {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    hook_score: readExplanation(record, "hook_score"),
    cta_score: readExplanation(record, "cta_score"),
    visual_score: readExplanation(record, "visual_score"),
    copy_score: readExplanation(record, "copy_score"),
    trust_score: readExplanation(record, "trust_score"),
    offer_score: readExplanation(record, "offer_score"),
    psychology_score: readExplanation(record, "psychology_score"),
    urgency_fomo_score: readExplanation(record, "urgency_fomo_score"),
  };
}

function normalizeConfidenceLevel(value: unknown): AnalysisConfidenceLevel {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function confidenceLevelFromPercent(percent: number): AnalysisConfidenceLevel {
  if (percent >= ANALYSIS_CONFIDENCE_HIGH) return "high";
  if (percent >= ANALYSIS_CONFIDENCE_MEDIUM) return "medium";
  return "low";
}

function normalizeAnalysisConfidence(raw: unknown): AnalysisConfidence {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const percent = clampScore(record.percent);

  const level =
    record.level !== undefined
      ? normalizeConfidenceLevel(record.level)
      : confidenceLevelFromPercent(percent);

  return { level, percent };
}

function normalizePerformanceMetric(raw: unknown): PerformanceMetric {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    value: readString(record, "value"),
    reasoning: readString(record, "reasoning"),
  };
}

function emptyPerformanceInsights(): PerformanceInsights {
  const empty = { value: "", reasoning: "" };
  return {
    conversion_potential: { ...empty },
    estimated_ctr: { ...empty },
    scroll_stop_rate: { ...empty },
    purchase_intent: { ...empty },
    engagement_probability: { ...empty },
  };
}

function normalizePerformanceInsights(raw: unknown): PerformanceInsights {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    conversion_potential: normalizePerformanceMetric(record.conversion_potential),
    estimated_ctr: normalizePerformanceMetric(record.estimated_ctr),
    scroll_stop_rate: normalizePerformanceMetric(record.scroll_stop_rate),
    purchase_intent: normalizePerformanceMetric(record.purchase_intent),
    engagement_probability: normalizePerformanceMetric(
      record.engagement_probability
    ),
  };
}

function normalizeImprovedVersion(
  raw: unknown,
  competitorScores: CompetitorAdScores,
  urgencyFomoScore: number
): ImprovedVersionPrediction {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const hookScore = clampScore(record.hook_score);
  const ctaScore = clampScore(record.cta_score);
  const offerScore = clampScore(record.offer_score);
  const psychologyScore = clampScore(record.psychology_score);
  const urgencyScore = clampScore(record.urgency_fomo_score);

  const predictedInputs = {
    hook_score: hookScore,
    cta_score: ctaScore,
    offer_score: offerScore,
    psychology_score: psychologyScore,
    urgency_fomo_score: urgencyScore,
  };

  const overallScore = computeComparisonOverall(predictedInputs);

  const competitorComparisonOverall = computeComparisonOverall({
    hook_score: competitorScores.hook_score,
    cta_score: competitorScores.cta_score,
    offer_score: competitorScores.offer_score,
    psychology_score: competitorScores.psychology_score,
    urgency_fomo_score: urgencyFomoScore,
  });

  return {
    overall_score: overallScore,
    hook_score: hookScore,
    cta_score: ctaScore,
    offer_score: offerScore,
    psychology_score: psychologyScore,
    urgency_fomo_score: urgencyScore,
    overall_improvement: overallScore - competitorComparisonOverall,
    why_better: readString(record, "why_better"),
    improved_hook: readString(record, "improved_hook"),
    improved_cta: readString(record, "improved_cta"),
    improved_offer: readString(record, "improved_offer"),
    improved_psychology: readString(record, "improved_psychology"),
    improved_urgency: readString(record, "improved_urgency"),
  };
}

function emptyImprovedVersion(
  competitorScores: CompetitorAdScores,
  urgencyFomoScore: number
): ImprovedVersionPrediction {
  return normalizeImprovedVersion({}, competitorScores, urgencyFomoScore);
}

function normalizeSuggestions(raw: unknown): CompetitorAdSuggestions {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    what_makes_successful: toStringArray(record.what_makes_successful),
    weaknesses: toStringArray(record.weaknesses),
    how_to_outperform: toStringArray(record.how_to_outperform),
    better_cta_suggestions: toStringArray(record.better_cta_suggestions),
    better_hook_suggestions: toStringArray(record.better_hook_suggestions),
    better_offer_suggestions: toStringArray(record.better_offer_suggestions),
  };
}

export function normalizeCompetitorAdAnalysis(
  raw: unknown
): CompetitorAdAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const scoreInputs = readCompetitorScoreInputs(record);

  if (!hasValidCompetitorScores(scoreInputs)) {
    return null;
  }

  const brand = readString(record, "brand");
  const product = readString(record, "product");
  const platform = readString(record, "platform");

  if (!brand && !product && !platform) {
    return null;
  }

  const scores: CompetitorAdScores = {
    ...scoreInputs,
    overall_score: computeOverallCompetitorScore(scoreInputs),
  };

  const urgencyFomoScore = clampScore(record.urgency_fomo_score);

  return {
    brand,
    product,
    platform,
    ad_objective: readString(record, "ad_objective"),
    target_audience: toStringArray(record.target_audience),
    emotional_triggers: toStringArray(record.emotional_triggers),
    marketing_psychology: toStringArray(record.marketing_psychology),
    hook_analysis: readString(record, "hook_analysis"),
    cta_analysis: readString(record, "cta_analysis"),
    copywriting_quality: readString(record, "copywriting_quality"),
    visual_quality: readString(record, "visual_quality"),
    trust_signals: toStringArray(record.trust_signals),
    offer_quality: readString(record, "offer_quality"),
    urgency_fomo_score: urgencyFomoScore,
    scores,
    score_explanations: record.score_explanations
      ? normalizeScoreExplanations(record.score_explanations)
      : emptyScoreExplanations(),
    analysis_confidence: record.analysis_confidence
      ? normalizeAnalysisConfidence(record.analysis_confidence)
      : { level: "medium", percent: 0 },
    improved_version: record.improved_version_prediction
      ? normalizeImprovedVersion(
          record.improved_version_prediction,
          scores,
          urgencyFomoScore
        )
      : emptyImprovedVersion(scores, urgencyFomoScore),
    performance_insights: record.performance_insights
      ? normalizePerformanceInsights(record.performance_insights)
      : emptyPerformanceInsights(),
    suggestions: normalizeSuggestions(record.suggestions),
  };
}

export function normalizeBetterCompetitorAd(
  raw: unknown
): BetterCompetitorAd | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const hooks = toStringArray(record.hooks ?? record.ad_hooks);
  const headlines = toStringArray(record.headlines);
  const captions = toStringArray(record.captions ?? record.ad_captions);
  const ctas = toStringArray(record.ctas);
  const offers = toStringArray(record.offers);
  const ugcScript =
    readString(record, "ugcScript") || readString(record, "ugc_script");
  const targetAudience = toStringArray(record.target_audience);
  const emotionalAngle = readString(record, "emotional_angle");
  const visualSuggestions = toStringArray(record.visual_suggestions);

  if (
    hooks.length === 0 &&
    headlines.length === 0 &&
    captions.length === 0 &&
    !ugcScript
  ) {
    return null;
  }

  return {
    hooks,
    headlines,
    captions,
    ctas,
    offers,
    ugcScript,
    target_audience: targetAudience,
    emotional_angle: emotionalAngle,
    visual_suggestions: visualSuggestions,
  };
}

export function competitorRecordFromRow(row: {
  id: string;
  user_email?: string | null;
  image_name?: string | null;
  analysis: unknown;
  better_ad?: unknown;
  created_at: string;
}): CompetitorAnalysisRecord | null {
  const analysis = normalizeCompetitorAdAnalysis(row.analysis);
  if (!analysis) {
    return null;
  }

  return {
    id: row.id,
    user_email: row.user_email ?? null,
    image_name: row.image_name ?? null,
    analysis,
    better_ad: row.better_ad
      ? normalizeBetterCompetitorAd(row.better_ad)
      : null,
    created_at: row.created_at,
  };
}

export function getComparisonOverallForCompetitor(
  analysis: CompetitorAdAnalysis
): number {
  return computeComparisonOverall({
    hook_score: analysis.scores.hook_score,
    cta_score: analysis.scores.cta_score,
    offer_score: analysis.scores.offer_score,
    psychology_score: analysis.scores.psychology_score,
    urgency_fomo_score: analysis.urgency_fomo_score,
  });
}

export function capitalizeConfidenceLevel(level: AnalysisConfidenceLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
