export const COMPETITOR_AD_ANALYSIS_PROMPT = `You are an expert performance marketing strategist and ad creative analyst.

Analyze the uploaded advertisement screenshot (Meta, Instagram, Facebook, TikTok, Google, or similar).

Return ONLY valid JSON in this exact shape (replace every "integer" with your 0-100 score):

{
  "brand": "recognizable brand name or Unknown",
  "product": "product or service being advertised",
  "platform": "Instagram, Facebook, TikTok, Google, YouTube, or Unknown",
  "ad_objective": "awareness, traffic, leads, sales, app installs, etc.",
  "target_audience": ["audience 1", "audience 2"],
  "emotional_triggers": ["trigger 1", "trigger 2"],
  "marketing_psychology": ["psychology tactic 1", "psychology tactic 2"],
  "hook_analysis": "detailed analysis of the opening hook or headline",
  "cta_analysis": "detailed analysis of the call to action",
  "copywriting_quality": "assessment of ad copy quality",
  "visual_quality": "assessment of visual design and layout",
  "trust_signals": ["trust signal 1", "trust signal 2"],
  "offer_quality": "assessment of the offer presented",
  "urgency_fomo_score": "integer",
  "scores": {
    "hook_score": "integer",
    "cta_score": "integer",
    "visual_score": "integer",
    "copy_score": "integer",
    "trust_score": "integer",
    "offer_score": "integer",
    "psychology_score": "integer"
  },
  "score_explanations": {
    "hook_score": "1-2 sentences explaining WHY this exact hook_score was given based on visible ad content",
    "cta_score": "1-2 sentences explaining WHY this exact cta_score was given",
    "visual_score": "1-2 sentences explaining WHY this exact visual_score was given",
    "copy_score": "1-2 sentences explaining WHY this exact copy_score was given",
    "trust_score": "1-2 sentences explaining WHY this exact trust_score was given",
    "offer_score": "1-2 sentences explaining WHY this exact offer_score was given",
    "psychology_score": "1-2 sentences explaining WHY this exact psychology_score was given",
    "urgency_fomo_score": "1-2 sentences explaining WHY this exact urgency_fomo_score was given"
  },
  "analysis_confidence": {
    "level": "high, medium, or low based on screenshot clarity and ad visibility",
    "percent": "integer 0-100 representing how confidently you could analyze this screenshot"
  },
  "improved_version_prediction": {
    "hook_score": "integer — predicted score if Advora AI rewrote the hook",
    "cta_score": "integer",
    "offer_score": "integer",
    "psychology_score": "integer",
    "urgency_fomo_score": "integer",
    "why_better": "2-3 sentences explaining why the AI-improved version would outperform",
    "improved_hook": "example improved hook line",
    "improved_cta": "example improved CTA",
    "improved_offer": "example improved offer framing",
    "improved_psychology": "primary psychology angle for the improved version",
    "improved_urgency": "urgency/FOMO tactic for the improved version"
  },
  "performance_insights": {
    "conversion_potential": {
      "value": "Low, Moderate, High, or Very High with optional percentage range",
      "reasoning": "1-2 sentences of AI reasoning tied to this specific ad"
    },
    "estimated_ctr": {
      "value": "estimated click-through rate range e.g. 0.8%–1.4%",
      "reasoning": "why this CTR range is expected"
    },
    "scroll_stop_rate": {
      "value": "estimated scroll-stop rate e.g. 35%–50%",
      "reasoning": "why viewers would or would not stop scrolling"
    },
    "purchase_intent": {
      "value": "Low, Moderate, or High purchase intent estimate",
      "reasoning": "reasoning based on offer, trust, and CTA"
    },
    "engagement_probability": {
      "value": "estimated engagement likelihood e.g. 40%–55%",
      "reasoning": "reasoning based on hook, creative, and platform fit"
    }
  },
  "suggestions": {
    "what_makes_successful": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "how_to_outperform": ["tactic 1", "tactic 2", "tactic 3"],
    "better_cta_suggestions": ["cta 1", "cta 2", "cta 3"],
    "better_hook_suggestions": ["hook 1", "hook 2", "hook 3"],
    "better_offer_suggestions": ["offer 1", "offer 2"]
  }
}

Rules:
- Do NOT return overall_score — it is computed server-side.
- Base analysis ONLY on what is visible in the image. Every explanation must reference specific visible elements.
- Use the full 0-100 range for each score dimension. Scores must vary by dimension.
- score_explanations must justify the EXACT score number given — never generic filler.
- improved_version_prediction scores must be realistically higher than competitor where improvements are possible.
- analysis_confidence.percent reflects screenshot quality, cropping, blur, and how much of the ad is visible.
- performance_insights values must be unique to this ad — no repeated boilerplate across analyses.
- Be specific and actionable in all suggestions.`;

export function buildBetterCompetitorAdPrompt(
  analysis: Record<string, unknown>
): string {
  return `You are an elite direct-response copywriter and creative strategist.

Using the competitor ad analysis below, write a STRONGER ad package that specifically outperforms this competitor creative — not a generic ad.

Competitor analysis:
${JSON.stringify(analysis, null, 2)}

Generate ALL of the following, beating the competitor on clarity, urgency, specificity, and conversion intent:

- 5 scroll-stopping hooks
- 3 headline variants (short, punchy headlines for the ad)
- 3 ad captions
- 3 CTAs
- 3 offer framings (how to present the deal/value)
- 1 UGC video script
- 3 target audience segments (refined for the improved ad)
- 1 emotional angle statement (the primary emotion to lead with)
- 5 visual creative suggestions (what to show in the ad creative)

Return ONLY valid JSON:

{
  "ad_hooks": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "ad_captions": ["caption 1", "caption 2", "caption 3"],
  "ctas": ["cta 1", "cta 2", "cta 3"],
  "offers": ["offer framing 1", "offer framing 2", "offer framing 3"],
  "ugc_script": "full UGC script",
  "target_audience": ["audience 1", "audience 2", "audience 3"],
  "emotional_angle": "primary emotional angle for the improved ad",
  "visual_suggestions": ["visual 1", "visual 2", "visual 3", "visual 4", "visual 5"]
}

Rules:
- Apply weaknesses and how_to_outperform from the analysis directly.
- Do not copy the competitor verbatim — create original, stronger copy.
- Every output must be tailored to the brand, product, and platform in the analysis.`;
}
