import type { LandingPageContent } from "@/lib/landing-analyzer/fetch-page";

export function buildLandingAnalysisPrompt(content: LandingPageContent): string {
  return `You are a strict conversion rate optimization auditor. Score landing pages honestly using the FULL 0–100 range. Different pages MUST receive noticeably different scores.

Analyze the landing page content below and return a comprehensive marketing audit.

URL: ${content.url}
Page title: ${content.title || "Unknown"}
Meta description: ${content.metaDescription || "Not provided"}

Extracted landing page content (headings, hero, CTAs, pricing, testimonials, FAQ, trust signals):
"""
${content.textContent}
"""

Return ONLY valid JSON in this exact shape (replace every "integer" with your evaluated score):

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
    "hero_score": "integer",
    "cta_score": "integer",
    "trust_score": "integer",
    "offer_score": "integer",
    "copy_score": "integer",
    "social_proof_score": "integer",
    "visual_hierarchy_score": "integer",
    "mobile_ux_score": "integer"
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

Scoring calibration (CRITICAL — use the full range, do NOT cluster scores near 50):
- Score each dimension INDEPENDENTLY. It is normal for the same page to have hero_score 92 and cta_score 38.
- Do NOT return conversion_score — it is computed server-side from your eight dimension scores.
- Weak landing pages (confusing copy, no clear CTA, no trust, cluttered): most dimensions 20–45.
- Average landing pages (some clarity, partial trust/offer, mixed UX): most dimensions 46–69.
- Good landing pages (clear value, solid CTA/trust, decent structure): most dimensions 70–84.
- Exceptional landing pages (Apple, Stripe, Linear, Notion-level clarity, polish, trust): most dimensions 85–95.

Dimension definitions:
- hero_score: headline clarity, relevance, emotional impact, differentiation above the fold.
- cta_score: CTA visibility, action clarity, urgency, friction, repeated placement.
- trust_score: testimonials, logos, guarantees, security signals, credibility copy, certifications.
- offer_score: offer clarity, perceived value, pricing transparency, urgency, risk reversal.
- copy_score: value proposition clarity, benefit-driven messaging, readability, persuasion, grammar.
- social_proof_score: reviews, ratings, customer counts, case studies, press, user-generated proof.
- visual_hierarchy_score: scannability, section structure, headline/subhead hierarchy, content flow cues inferable from text order and emphasis.
- mobile_ux_score: concise mobile-friendly messaging, tap-friendly CTA language, brevity, clarity on small screens (infer from content structure when HTML layout is unavailable).

Penalties (apply aggressively — do not give mid-range scores by default):
- No visible primary CTA in content: cta_score must be 15–35.
- No social proof at all: social_proof_score must be 10–30.
- Vague or missing offer: offer_score must be 15–40.
- Generic/confusing hero: hero_score must be 20–45.
- Exceptional global brands with world-class copy and trust (Apple, Stripe, Linear, Notion): hero/copy/visual_hierarchy/trust typically 88–96 even if offer is softer.

Spread requirement:
- Do NOT assign similar scores to every dimension on a page.
- Two different URLs should rarely produce the same overall profile unless they are genuinely similar quality.
- Avoid scoring everything between 45–55 unless the page is truly mediocre across ALL dimensions.

Content rules:
- Be specific and actionable.
- Base conclusions only on the provided page content.
- ad_strategy must contain exactly 5 ad_angles, 5 hooks, 3 captions, and 3 ctas.`;
}
