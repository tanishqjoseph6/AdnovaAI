import type { LandingPageContent } from "@/lib/landing-analyzer/fetch-page";

export function buildLandingAnalysisPrompt(content: LandingPageContent): string {
  return `You are an expert conversion rate optimization and direct-response marketing strategist.

Analyze the landing page content below and return a comprehensive marketing audit.

URL: ${content.url}
Page title: ${content.title || "Unknown"}
Meta description: ${content.metaDescription || "Not provided"}

Page text content:
"""
${content.textContent}
"""

Return ONLY valid JSON in this exact shape:

{
  "brand_product_name": "detected brand or product name",
  "product_category": "category",
  "hero_headline": "main headline",
  "value_proposition": "core value proposition",
  "primary_cta": "primary call to action text",
  "target_audience": ["audience 1", "audience 2"],
  "key_usps": ["usp 1", "usp 2", "usp 3"],
  "pain_points": ["pain 1", "pain 2"],
  "emotional_triggers": ["trigger 1", "trigger 2"],
  "trust_signals": ["signal 1", "signal 2"],
  "offer": "main offer",
  "social_proof": "social proof summary",
  "marketing_summary": "2 to 4 sentence overall marketing summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "scores": {
    "conversion_score": 82,
    "hero_score": 78,
    "cta_score": 70,
    "trust_score": 65,
    "offer_score": 74
  },
  "suggestions": {
    "better_headline": "improved headline suggestion",
    "better_cta": "improved CTA suggestion",
    "missing_trust_elements": ["missing trust element 1", "missing trust element 2"],
    "better_offer": "improved offer suggestion",
    "ux_improvements": ["ux improvement 1", "ux improvement 2"]
  },
  "ad_strategy": {
    "ad_angles": ["angle 1", "angle 2", "angle 3", "angle 4", "angle 5"],
    "hooks": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
    "captions": ["caption 1", "caption 2", "caption 3"],
    "ctas": ["cta 1", "cta 2", "cta 3"]
  }
}

Rules:
- All scores are integers from 0 to 100.
- Be specific and actionable.
- Base conclusions only on the provided page content.
- ad_strategy must contain exactly 5 ad_angles, 5 hooks, 3 captions, and 3 ctas.`;
}
