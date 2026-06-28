export const PRODUCT_IMAGE_ANALYSIS_PROMPT = `You are an expert e-commerce and direct-response advertising strategist.

Analyze the uploaded product image and infer practical marketing details a copywriter can use immediately.

Return ONLY valid JSON in this exact shape:

{
  "generic_product_name": "brand and product family only, e.g. Samsung Galaxy smartphone",
  "exact_model": null,
  "product_name": "same as generic_product_name unless exact_model is provided",
  "category": "product category",
  "product_description": "2 to 4 concise sentences describing the product, its benefits, and who it is for",
  "product_tags": ["Wireless", "Premium", "Gaming"],
  "usps": ["Long Battery Life", "Waterproof", "Premium Material"],
  "target_audience": ["Students", "Professionals", "Fitness Enthusiasts"],
  "suggested_ad_angles": ["angle 1", "angle 2", "angle 3"],
  "recommended_tone": "tone for ad copy",
  "identification_confidence": "high",
  "confidence_score": 0
}

Product identification rules (CRITICAL):
- NEVER guess an exact product model unless the image provides clear visual evidence.
- Clear evidence includes: readable model text on the product/packaging, unmistakable generation-specific design, or a uniquely identifiable variant.
- If the exact model cannot be determined confidently, set exact_model to null and use a generic_product_name with brand + product family only.
- Good generic examples: "Samsung Galaxy smartphone", "Apple iPhone", "Nike running shoe", "Sony wireless headphones".
- Only set exact_model (e.g. "Samsung Galaxy S25 Ultra", "iPhone 15 Pro", "Nike Air Zoom Pegasus 40") when identification_confidence is "high".
- If uncertain between similar models, use generic_product_name and exact_model null.

Confidence rules:
- identification_confidence must be "high", "medium", or "low".
- "high": strong visual evidence for brand AND either exact model or product family.
- "medium": brand/family likely correct but exact model unclear.
- "low": product type visible but brand or variant uncertain.
- confidence_score: integer 0 to 100 reflecting identification certainty.
- Use confidence_score >= 80 only when identification_confidence is "high".
- Use confidence_score 60-79 for "medium".
- Use confidence_score below 60 for "low".
- When identification_confidence is "medium" or "low", exact_model MUST be null and generic_product_name MUST stay generic (no model numbers or generation names).

Content rules:
- Be specific and concise about visible features, materials, colors, and use cases.
- product_description: 2 to 4 lines of polished marketing copy based on what is visible.
- product_tags: 5 to 10 short tags (1 to 3 words each).
- usps: 3 to 6 strongest unique selling points visible or reasonably inferred from the product type.
- target_audience: 3 to 6 likely audience segments.
- suggested_ad_angles: 3 to 5 items.
- recommended_tone: one short phrase (e.g. "Premium and aspirational").
- product_name should match the final customer-facing identification (generic_product_name when exact_model is null).`;

export function buildGenerateAdsPrompt(
  productDescription: string,
  analysisSection?: string,
  brandKitSection?: string
): string {
  const analysisBlock = analysisSection
    ? `\n\n${analysisSection}\n\nUse every detail in the product image analysis above — tags, USPs, audience, tone, and ad angles — to make hooks, captions, CTAs, and the UGC script more specific and accurate.`
    : "";
  const brandKitBlock = brandKitSection
    ? `\n\n${brandKitSection}\n\nBrand Kit rules are persistent user preferences. Apply them to all hooks, captions, CTAs, and the UGC script.`
    : "";

  return `You are an expert direct response copywriter.

Generate:

- 5 ad hooks
- 3 ad captions
- 3 CTAs
- 1 UGC video script

Product:
${productDescription}${analysisBlock}${brandKitBlock}

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
