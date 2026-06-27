export const PRODUCT_IMAGE_ANALYSIS_PROMPT = `You are an expert e-commerce and direct-response advertising strategist.

Analyze the uploaded product image and infer practical marketing details a copywriter can use immediately.

Return ONLY valid JSON in this exact shape:

{
  "product_name": "short product name",
  "category": "product category",
  "product_description": "2 to 4 concise sentences describing the product, its benefits, and who it is for",
  "product_tags": ["Wireless", "Premium", "Gaming"],
  "usps": ["Long Battery Life", "Waterproof", "Premium Material"],
  "target_audience": ["Students", "Professionals", "Fitness Enthusiasts"],
  "suggested_ad_angles": ["angle 1", "angle 2", "angle 3"],
  "recommended_tone": "tone for ad copy",
  "confidence_score": 94
}

Rules:
- Be specific and concise.
- product_description: 2 to 4 lines of polished marketing copy.
- product_tags: 5 to 10 short tags (1 to 3 words each).
- usps: 3 to 6 strongest unique selling points.
- target_audience: 3 to 6 likely audience segments.
- suggested_ad_angles: 3 to 5 items.
- recommended_tone: one short phrase (e.g. "Premium and aspirational").
- confidence_score: integer 0 to 100 reflecting how confident you are in the product identification.`;

export function buildGenerateAdsPrompt(
  productDescription: string,
  analysisSection?: string
): string {
  const analysisBlock = analysisSection
    ? `\n\n${analysisSection}\n\nUse every detail in the product image analysis above — tags, USPs, audience, tone, and ad angles — to make hooks, captions, CTAs, and the UGC script more specific and accurate.`
    : "";

  return `You are an expert direct response copywriter.

Generate:

- 5 ad hooks
- 3 ad captions
- 3 CTAs
- 1 UGC video script

Product:
${productDescription}${analysisBlock}

Return ONLY valid JSON in this format:

{
  "ad_hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "ad_captions": [
    "caption 1",
    "caption 2",
    "caption 3"
  ],
  "ctas": [
    "cta 1",
    "cta 2",
    "cta 3"
  ],
  "ugc_script": "full script here"
}`;
}
