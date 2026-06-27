export type DetectionConfidenceLevel = "high" | "medium" | "low";

export type ProductAnalysis = {
  product_name: string;
  category: string;
  product_description: string;
  product_tags: string[];
  usps: string[];
  target_audience: string[];
  suggested_ad_angles: string[];
  recommended_tone: string;
  confidence_score: number;
  detection_confidence: DetectionConfidenceLevel;
};

export const LOW_CONFIDENCE_THRESHOLD = 60;
export const HIGH_CONFIDENCE_THRESHOLD = 80;

export function createEmptyProductAnalysis(): ProductAnalysis {
  return {
    product_name: "",
    category: "",
    product_description: "",
    product_tags: [],
    usps: [],
    target_audience: [],
    suggested_ad_angles: [],
    recommended_tone: "",
    confidence_score: 0,
    detection_confidence: "low",
  };
}

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

function normalizeConfidenceScore(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Number(value.trim());
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

export function getDetectionConfidenceLevel(
  score: number
): DetectionConfidenceLevel {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) {
    return "high";
  }
  if (score >= LOW_CONFIDENCE_THRESHOLD) {
    return "medium";
  }
  return "low";
}

function normalizeDetectionConfidence(
  value: unknown,
  confidenceScore: number
): DetectionConfidenceLevel {
  const fromScore = getDetectionConfidenceLevel(confidenceScore);
  let fromAi: DetectionConfidenceLevel | null = null;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "high" ||
      normalized === "medium" ||
      normalized === "low"
    ) {
      fromAi = normalized;
    }
  }

  if (!fromAi) {
    return fromScore;
  }

  const rank: Record<DetectionConfidenceLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  return rank[fromAi] <= rank[fromScore] ? fromAi : fromScore;
}

export function resolveProductName(
  record: Record<string, unknown>,
  detectionConfidence: DetectionConfidenceLevel
): string {
  const exactModel = readString(record, "exact_model");
  const genericName = readString(record, "generic_product_name");
  const legacyName = readString(record, "product_name");

  if (detectionConfidence === "high" && exactModel) {
    return exactModel;
  }

  if (genericName) {
    return genericName;
  }

  if (detectionConfidence === "high" && legacyName) {
    return legacyName;
  }

  return legacyName;
}

export function normalizeProductAnalysis(raw: unknown): ProductAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const category = readString(record, "category");
  const product_description = readString(record, "product_description");
  const recommended_tone = readString(record, "recommended_tone");

  const product_tags = toStringArray(record.product_tags);
  const usps = toStringArray(
    record.usps ?? record.unique_selling_points ?? record.key_features
  );
  const target_audience = toStringArray(record.target_audience);
  const suggested_ad_angles = toStringArray(record.suggested_ad_angles);
  const confidence_score = normalizeConfidenceScore(record.confidence_score);
  const detection_confidence = normalizeDetectionConfidence(
    record.identification_confidence ?? record.detection_confidence,
    confidence_score
  );
  const product_name = resolveProductName(record, detection_confidence);

  if (
    !product_name &&
    !category &&
    !product_description &&
    !recommended_tone &&
    product_tags.length === 0 &&
    usps.length === 0 &&
    target_audience.length === 0 &&
    suggested_ad_angles.length === 0 &&
    confidence_score === 0
  ) {
    return null;
  }

  return {
    product_name,
    category,
    product_description,
    product_tags,
    usps,
    target_audience,
    suggested_ad_angles,
    recommended_tone,
    confidence_score,
    detection_confidence,
  };
}

export function hasProductAnalysisContent(
  analysis: ProductAnalysis | null | undefined
): boolean {
  if (!analysis) {
    return false;
  }

  return Boolean(
    analysis.product_name ||
      analysis.category ||
      analysis.product_description ||
      analysis.recommended_tone ||
      analysis.confidence_score > 0 ||
      analysis.product_tags.length > 0 ||
      analysis.usps.length > 0 ||
      analysis.target_audience.length > 0 ||
      analysis.suggested_ad_angles.length > 0
  );
}

export function formatProductAnalysisForPrompt(
  analysis: ProductAnalysis
): string {
  const lines = [
    "Product Image Analysis:",
    `- Product name: ${analysis.product_name || "Unknown"}`,
    `- Category: ${analysis.category || "General"}`,
    `- Product tags: ${
      analysis.product_tags.length > 0
        ? analysis.product_tags.join(", ")
        : "Not specified"
    }`,
    `- Unique selling points: ${
      analysis.usps.length > 0 ? analysis.usps.join("; ") : "Not specified"
    }`,
    `- Target audience: ${
      analysis.target_audience.length > 0
        ? analysis.target_audience.join("; ")
        : "Not specified"
    }`,
    `- Suggested ad angles: ${
      analysis.suggested_ad_angles.length > 0
        ? analysis.suggested_ad_angles.join("; ")
        : "Not specified"
    }`,
    `- Recommended tone: ${analysis.recommended_tone || "Not specified"}`,
    `- Detection confidence: ${capitalizeDetectionConfidence(analysis.detection_confidence)}`,
    `- AI confidence score: ${analysis.confidence_score}%`,
  ];

  if (analysis.detection_confidence !== "high") {
    lines.push(
      "- Note: Product identification is generic (exact model not confirmed). Avoid inventing a specific model name in ad copy."
    );
  }

  return lines.join("\n");
}

export function capitalizeDetectionConfidence(
  level: DetectionConfidenceLevel
): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(values: string[]): string {
  return values.join("\n");
}

export function getAutoFillDescription(analysis: ProductAnalysis): string {
  return analysis.product_description.trim();
}

export function isLowConfidence(analysis: ProductAnalysis): boolean {
  return (
    analysis.detection_confidence === "low" ||
    analysis.confidence_score < LOW_CONFIDENCE_THRESHOLD
  );
}

export function isMediumOrLowConfidence(analysis: ProductAnalysis): boolean {
  return analysis.detection_confidence !== "high";
}
