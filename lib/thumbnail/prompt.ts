import {
  THUMBNAIL_FORMAT_DIMENSIONS,
  THUMBNAIL_FORMAT_LABELS,
  type ThumbnailInput,
} from "@/lib/thumbnail/types";

export function buildThumbnailCopyPrompt(input: ThumbnailInput): string {
  const dims = THUMBNAIL_FORMAT_DIMENSIONS[input.format];
  const formatLabel = THUMBNAIL_FORMAT_LABELS[input.format];

  return `You are an expert performance creative director specializing in high-converting thumbnails.

Generate thumbnail copy and image-generation briefs for ${input.variationCount} distinct variations.

FORMAT: ${formatLabel} (${dims.width}x${dims.height}, ${dims.aspect})
BRAND: ${input.brandName}
PRIMARY COLOR: ${input.brandColors.primary}
SECONDARY COLOR: ${input.brandColors.secondary}
ACCENT COLOR: ${input.brandColors.accent}
PRODUCT URL: ${input.productUrl.trim() || "not provided"}
CREATIVE BRIEF:
${input.prompt.trim()}

Rules:
- Headlines must be short, punchy, and readable at thumbnail size (max 6 words).
- CTAs must be action-oriented (max 4 words).
- Each variation must feel visually distinct (composition, mood, or layout).
- Image prompts must describe a finished thumbnail layout: subject, lighting, composition, typography placement, brand colors, and style.
- Do NOT include watermarks, stock-photo watermarks, or unreadable text.
- Prefer bold contrast suitable for mobile feeds.
- Mention the exact format aspect ratio in each image prompt.

Return ONLY valid JSON with this shape:
{
  "suggestedHeadlines": ["...", "...", "..."],
  "suggestedCtas": ["...", "...", "..."],
  "variations": [
    {
      "headline": "...",
      "cta": "...",
      "imagePrompt": "Detailed DALL-E style prompt..."
    }
  ]
}

Generate exactly ${input.variationCount} items in "variations".
Generate exactly 3 suggestedHeadlines and exactly 3 suggestedCtas.`;
}

export function buildVariationImagePrompt(args: {
  basePrompt: string;
  headline: string;
  cta: string;
  brandName: string;
  brandColors: ThumbnailInput["brandColors"];
  formatLabel: string;
  aspect: string;
  hasProductImage: boolean;
  hasLogo: boolean;
}): string {
  return [
    args.basePrompt.trim(),
    `Brand: ${args.brandName}.`,
    `On-image headline text: "${args.headline}".`,
    `On-image CTA badge text: "${args.cta}".`,
    `Brand colors: primary ${args.brandColors.primary}, secondary ${args.brandColors.secondary}, accent ${args.brandColors.accent}.`,
    `Format: ${args.formatLabel}, aspect ratio ${args.aspect}.`,
    args.hasProductImage
      ? "Feature the provided product photo prominently and realistically."
      : "Create a polished product-focused composition even without a reference photo.",
    args.hasLogo
      ? "Include space for a brand logo in a clean corner placement."
      : "Leave a clean brand mark area without inventing fake logos.",
    "High resolution, sharp, professional advertising thumbnail, no watermark, no extra captions outside the specified headline and CTA.",
  ].join(" ");
}
