import { z } from "zod";
import { getGeminiClient, getGeminiModel } from "./client";
import {
  generateAdsResponseSchema,
  type GenerateAdsResponse,
} from "@/lib/validations/generate-ads";

const geminiOutputSchema = z.object({
  hooks: z.array(z.string()).length(5),
  captions: z.array(z.string()).length(3),
  ugcScript: z.string(),
});

const SYSTEM_PROMPT = `You are an expert performance marketer and UGC creative director for ecommerce brands.

Given a product description, generate high-converting ad copy that is:
- Specific to the product (use concrete benefits, not generic fluff)
- Optimized for paid social (Meta, TikTok) and ecommerce
- Compliant (no false claims, no medical guarantees unless stated in the input)
- Ready to paste into ad platforms

Return ONLY valid JSON in this exact shape:
{
  "hooks": ["...", "...", "...", "...", "..."],
  "captions": ["...", "...", "..."],
  "ugcScript": "..."
}

Requirements:
- hooks: exactly 5 short ecommerce ad hooks (under 120 chars each)
- captions: exactly 3 marketing captions (50-280 chars each)
- ugcScript: exactly 1 short UGC video script (30-45 seconds) with timestamped sections:
  [HOOK - 0:00], [PROBLEM - ...], [DEMO - ...], [CTA - ...]`;

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return trimmed;
}

export async function generateAdsWithGemini(
  productDescription: string
): Promise<GenerateAdsResponse> {
  const prompt = `${SYSTEM_PROMPT}\n\nProduct description:\n${productDescription}`;

const result = await getGeminiClient().models.generateContent({
  model: getGeminiModel(),
  contents: prompt,
});

    
    
  
  const text = result.text ?? ""; 


  
  
  

  if (!text) {
    throw new Error("Model returned an empty response");
  }

  const parsed = JSON.parse(extractJson(text));
  const validated = geminiOutputSchema.parse(parsed);
  return generateAdsResponseSchema.parse(validated);
}
