export type LandingPageScores = {
  conversion_score: number;
  hero_score: number;
  cta_score: number;
  trust_score: number;
  offer_score: number;
};

export type LandingPageSuggestions = {
  better_headline: string;
  better_cta: string;
  missing_trust_elements: string[];
  better_offer: string;
  ux_improvements: string[];
};

export type LandingPageAdStrategy = {
  ad_angles: string[];
  hooks: string[];
  captions: string[];
  ctas: string[];
};

export type LandingPageAnalysis = {
  url: string;
  brand_product_name: string;
  product_category: string;
  hero_headline: string;
  value_proposition: string;
  primary_cta: string;
  target_audience: string[];
  key_usps: string[];
  pain_points: string[];
  emotional_triggers: string[];
  trust_signals: string[];
  offer: string;
  social_proof: string;
  marketing_summary: string;
  strengths: string[];
  weaknesses: string[];
  scores: LandingPageScores;
  suggestions: LandingPageSuggestions;
  ad_strategy: LandingPageAdStrategy;
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

function clampScore(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScores(raw: unknown): LandingPageScores {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    conversion_score: clampScore(record.conversion_score),
    hero_score: clampScore(record.hero_score),
    cta_score: clampScore(record.cta_score),
    trust_score: clampScore(record.trust_score),
    offer_score: clampScore(record.offer_score),
  };
}

function normalizeSuggestions(raw: unknown): LandingPageSuggestions {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    better_headline: readString(record, "better_headline"),
    better_cta: readString(record, "better_cta"),
    missing_trust_elements: toStringArray(record.missing_trust_elements),
    better_offer: readString(record, "better_offer"),
    ux_improvements: toStringArray(record.ux_improvements),
  };
}

function normalizeAdStrategy(raw: unknown): LandingPageAdStrategy {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    ad_angles: toStringArray(record.ad_angles),
    hooks: toStringArray(record.hooks),
    captions: toStringArray(record.captions),
    ctas: toStringArray(record.ctas),
  };
}

export function normalizeLandingPageAnalysis(
  raw: unknown,
  url: string
): LandingPageAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const analysis: LandingPageAnalysis = {
    url,
    brand_product_name: readString(record, "brand_product_name"),
    product_category: readString(record, "product_category"),
    hero_headline: readString(record, "hero_headline"),
    value_proposition: readString(record, "value_proposition"),
    primary_cta: readString(record, "primary_cta"),
    target_audience: toStringArray(record.target_audience),
    key_usps: toStringArray(record.key_usps),
    pain_points: toStringArray(record.pain_points),
    emotional_triggers: toStringArray(record.emotional_triggers),
    trust_signals: toStringArray(record.trust_signals),
    offer: readString(record, "offer"),
    social_proof: readString(record, "social_proof"),
    marketing_summary: readString(record, "marketing_summary"),
    strengths: toStringArray(record.strengths),
    weaknesses: toStringArray(record.weaknesses),
    scores: normalizeScores(record.scores),
    suggestions: normalizeSuggestions(record.suggestions),
    ad_strategy: normalizeAdStrategy(record.ad_strategy),
  };

  if (
    !analysis.brand_product_name &&
    !analysis.marketing_summary &&
    analysis.scores.conversion_score === 0
  ) {
    return null;
  }

  return analysis;
}
