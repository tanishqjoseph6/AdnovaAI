import {
  computeOverallCompetitorScore,
  hasValidCompetitorScores,
  readCompetitorScoreInputs,
  clampScore,
  type CompetitorScoreInputs,
} from "@/lib/competitor-ad/scores";

export type CompetitorAdScores = CompetitorScoreInputs & {
  overall_score: number;
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
  suggestions: CompetitorAdSuggestions;
};

export type BetterCompetitorAd = {
  hooks: string[];
  captions: string[];
  ctas: string[];
  ugcScript: string;
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
    urgency_fomo_score: clampScore(record.urgency_fomo_score),
    scores: {
      ...scoreInputs,
      overall_score: computeOverallCompetitorScore(scoreInputs),
    },
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
  const captions = toStringArray(record.captions ?? record.ad_captions);
  const ctas = toStringArray(record.ctas);
  const ugcScript = readString(record, "ugcScript") || readString(record, "ugc_script");

  if (hooks.length === 0 && captions.length === 0 && !ugcScript) {
    return null;
  }

  return { hooks, captions, ctas, ugcScript };
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
