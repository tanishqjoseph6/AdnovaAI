import type OpenAI from "openai";
import type { LandingPageContent } from "@/lib/landing-analyzer/fetch-page";
import { MAX_TEXT_LENGTH, TARGET_TEXT_LENGTH } from "@/lib/landing-analyzer/extract-content";

export function buildSummarizeContentPrompt(content: LandingPageContent): string {
  return `You are preparing landing page content for a marketing conversion audit.

Summarize the extracted page content below into a concise brief for analysis.
Preserve all marketing-critical details:
- brand/product name cues
- hero headline and subheadline
- value proposition
- primary and secondary CTAs
- pricing/plans/offers
- testimonials and social proof
- trust signals and guarantees
- FAQ highlights
- footer credibility cues

Do NOT invent facts. Only use information present in the source.
Target length: ${TARGET_TEXT_LENGTH} characters or less.
Return plain text only (no JSON, no markdown headings).

URL: ${content.url}
Title: ${content.title || "Unknown"}
Meta description: ${content.metaDescription || "Not provided"}

Extracted page content:
"""
${content.textContent}
"""`;
}

export async function summarizeLandingPageContent(
  openai: OpenAI,
  content: LandingPageContent
): Promise<LandingPageContent> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildSummarizeContentPrompt(content),
      },
    ],
  });

  const summary = response.choices[0]?.message?.content?.trim() ?? "";

  if (summary.length < 80) {
    return {
      ...content,
      textContent: content.textContent.slice(0, MAX_TEXT_LENGTH),
    };
  }

  return {
    ...content,
    textContent: summary.slice(0, MAX_TEXT_LENGTH),
  };
}
