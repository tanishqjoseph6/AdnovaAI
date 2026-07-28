import type { ReelScriptInput } from "@/lib/reel-script/types";
import {
  REEL_GOAL_LABELS,
  REEL_PLATFORM_LABELS,
} from "@/lib/reel-script/types";

export function buildReelScriptPrompt(input: ReelScriptInput): string {
  const platformLabel = REEL_PLATFORM_LABELS[input.platform];
  const goalLabel = REEL_GOAL_LABELS[input.goal];
  const productUrl = input.productUrl.trim() || "Not provided";

  return `You are Advora's elite short-form video creative director.

Create a complete production-ready reel script for ${platformLabel}.

INPUT
- Brand name: ${input.brandName}
- Brand voice: ${input.brandVoice}
- Target audience: ${input.targetAudience}
- Product URL: ${productUrl}
- Product description: ${input.productDescription}
- Platform: ${platformLabel}
- Duration: ${input.duration} seconds
- Goal: ${goalLabel}

OUTPUT RULES
- Return ONLY valid JSON matching this exact schema (no markdown, no commentary).
- Generate exactly 5 distinct hook variations.
- Write a scroll-stopping opening that works in the first 1-2 seconds.
- Create a scene-by-scene script sized for a ${input.duration}s reel.
- Include camera directions, B-roll suggestions, and on-screen text for every scene.
- Include a full continuous voice-over script.
- Include one strong CTA, one ready-to-post caption, 8-15 hashtags (without # symbols or with # — either is fine), and a thumbnail title.
- Match the brand voice and goal.
- Keep language native to ${platformLabel} creators.
- Make it specific to the product, not generic.

JSON SCHEMA
{
  "hooks": ["string", "string", "string", "string", "string"],
  "scrollStoppingOpening": "string",
  "scenes": [
    {
      "sceneNumber": 1,
      "timestamp": "0-3s",
      "visual": "string",
      "cameraDirection": "string",
      "onScreenText": "string",
      "voiceOver": "string",
      "bRoll": "string"
    }
  ],
  "voiceOverScript": "string",
  "cta": "string",
  "caption": "string",
  "hashtags": ["string"],
  "thumbnailTitle": "string"
}`;
}
