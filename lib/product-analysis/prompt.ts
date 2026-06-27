export const PRODUCT_IMAGE_ANALYSIS_PROMPT = `You are an expert e-commerce and direct-response advertising strategist.

Analyze the uploaded product image and infer practical marketing details a copywriter can use immediately.

Return ONLY valid JSON in this exact shape:

{
  "product_name": "short product name",
  "category": "product category",
  "key_features": ["feature 1", "feature 2", "feature 3"],
  "target_audience": ["audience segment 1", "audience segment 2"],
  "suggested_ad_angles": ["angle 1", "angle 2", "angle 3"],
  "recommended_tone": "tone for ad copy"
}

Rules:
- Be specific and concise.
- key_features: 3 to 5 items.
- target_audience: 2 to 4 items.
- suggested_ad_angles: 3 to 5 items.
- recommended_tone: one short phrase (e.g. "Premium and aspirational").`;

export function buildGenerateAdsPrompt(
  productDescription: string,
  analysisSection?: string
): string {
  const analysisBlock = analysisSection
    ? `\n\n${analysisSection}\n\nUse the product image analysis above to make hooks, captions, CTAs, and the UGC script more specific and accurate.`
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
