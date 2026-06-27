export type ProductAnalysis = {
  product_name: string;
  category: string;
  key_features: string[];
  target_audience: string[];
  suggested_ad_angles: string[];
  recommended_tone: string;
};

export function createEmptyProductAnalysis(): ProductAnalysis {
  return {
    product_name: "",
    category: "",
    key_features: [],
    target_audience: [],
    suggested_ad_angles: [],
    recommended_tone: "",
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

export function normalizeProductAnalysis(raw: unknown): ProductAnalysis | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const product_name =
    typeof record.product_name === "string" ? record.product_name.trim() : "";
  const category =
    typeof record.category === "string" ? record.category.trim() : "";
  const recommended_tone =
    typeof record.recommended_tone === "string"
      ? record.recommended_tone.trim()
      : "";

  const key_features = toStringArray(record.key_features);
  const target_audience = toStringArray(record.target_audience);
  const suggested_ad_angles = toStringArray(record.suggested_ad_angles);

  if (
    !product_name &&
    !category &&
    !recommended_tone &&
    key_features.length === 0 &&
    target_audience.length === 0 &&
    suggested_ad_angles.length === 0
  ) {
    return null;
  }

  return {
    product_name,
    category,
    key_features,
    target_audience,
    suggested_ad_angles,
    recommended_tone,
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
      analysis.recommended_tone ||
      analysis.key_features.length > 0 ||
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
    `- Key features: ${
      analysis.key_features.length > 0
        ? analysis.key_features.join("; ")
        : "Not specified"
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
