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
};

export const LOW_CONFIDENCE_THRESHOLD = 60;

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

function normalizeConfidenceScore(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeProductAnalysis(raw: unknown): ProductAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const product_name =
    typeof record.product_name === "string" ? record.product_name.trim() : "";
  const category =
    typeof record.category === "string" ? record.category.trim() : "";
  const product_description =
    typeof record.product_description === "string"
      ? record.product_description.trim()
      : "";
  const recommended_tone =
    typeof record.recommended_tone === "string"
      ? record.recommended_tone.trim()
      : "";

  const product_tags = toStringArray(record.product_tags);
  const usps = toStringArray(
    record.usps ?? record.unique_selling_points ?? record.key_features
  );
  const target_audience = toStringArray(record.target_audience);
  const suggested_ad_angles = toStringArray(record.suggested_ad_angles);
  const confidence_score = normalizeConfidenceScore(record.confidence_score);

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
    `- AI confidence: ${analysis.confidence_score}%`,
  ];

  return lines.join("\n");
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
  return analysis.confidence_score < LOW_CONFIDENCE_THRESHOLD;
}
