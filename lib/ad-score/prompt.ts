import type { GeneratedAdsPayload } from "@/lib/ad-score/types";

function formatList(label: string, items: string[]): string {
  if (items.length === 0) {
    return `${label}:\n(none)`;
  }

  return `${label}:\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

export function buildAdScorePrompt(payload: GeneratedAdsPayload): string {
  return `You are an expert direct-response ad copy auditor and conversion strategist.

Score the generated ad package below for marketing effectiveness.

Product context:
"""
${payload.productDescription}
"""

${formatList("Hooks", payload.hooks)}

${formatList("Captions", payload.captions)}

${formatList("CTAs", payload.ctas)}

UGC Script:
"""
${payload.ugcScript}
"""

Return ONLY valid JSON in this exact shape (replace every "integer" with your 0-100 score):

{
  "scores": {
    "hook_score": "integer",
    "cta_score": "integer",
    "emotional_score": "integer",
    "clarity_score": "integer",
    "conversion_score": "integer",
    "brand_fit_score": "integer"
  },
  "improvements": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "actionable_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "estimated_conversion_improvement": "e.g. 12-18% estimated lift if suggestions are applied"
  }
}

Scoring rules:
- Do NOT return overall_score — it is computed server-side from your component scores.
- hook_score: scroll-stopping power, curiosity, relevance of hooks.
- cta_score: clarity, urgency, and actionability of CTAs across the package.
- emotional_score: emotional resonance, desire, and audience connection.
- clarity_score: readability, specificity, and ease of understanding.
- conversion_score: likelihood this copy drives clicks, sign-ups, or purchases.
- brand_fit_score: alignment with product positioning and brand tone.
- Use the full 0-100 range. Be honest and differentiate weak vs strong copy.
- estimated_conversion_improvement: realistic percentage range as a short phrase.

Improvement rules:
- strengths: 2-4 specific things working well in this ad package.
- weaknesses: 2-4 specific gaps hurting conversion.
- actionable_suggestions: 3-5 concrete edits the marketer can apply immediately.`;
}
