import OpenAI from "openai";
import {
  THUMBNAIL_FORMAT_DIMENSIONS,
  THUMBNAIL_FORMAT_LABELS,
  type ThumbnailFormat,
  type ThumbnailInput,
  type ThumbnailResult,
  type ThumbnailVariation,
} from "@/lib/thumbnail/types";
import {
  buildThumbnailCopyPrompt,
  buildVariationImagePrompt,
} from "@/lib/thumbnail/prompt";
import { normalizeThumbnailCopyDraft } from "@/lib/thumbnail/normalize";
import { uploadThumbnailPng } from "@/lib/thumbnail/storage";

function getOpenAiClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function generateCopyDraft(input: ThumbnailInput) {
  const openai = getOpenAiClient();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.85,
    max_tokens: 2200,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildThumbnailCopyPrompt(input) }],
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  return normalizeThumbnailCopyDraft(parsed, input.variationCount);
}

async function generateSingleImage(args: {
  prompt: string;
  size: "1024x1024" | "1792x1024" | "1024x1792";
}): Promise<Buffer | null> {
  const openai = getOpenAiClient();

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: args.prompt.slice(0, 3900),
      n: 1,
      size: args.size,
      quality: "hd",
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) return null;
    return Buffer.from(b64, "base64");
  } catch (error) {
    console.error("DALL-E thumbnail generation failed:", error);
    return null;
  }
}

export async function generateThumbnailResult(
  userId: string,
  input: ThumbnailInput
): Promise<ThumbnailResult | null> {
  const draft = await generateCopyDraft(input);
  if (!draft) return null;

  const dims = THUMBNAIL_FORMAT_DIMENSIONS[input.format];
  const formatLabel = THUMBNAIL_FORMAT_LABELS[input.format];
  const hasProductImage = Boolean(input.productImageBase64);
  const hasLogo = Boolean(input.logoBase64);

  const variationResults = await Promise.all(
    draft.variations.map(async (item, index) => {
      const imagePrompt = buildVariationImagePrompt({
        basePrompt: item.imagePrompt,
        headline: item.headline,
        cta: item.cta,
        brandName: input.brandName,
        brandColors: input.brandColors,
        formatLabel,
        aspect: dims.aspect,
        hasProductImage,
        hasLogo,
      });

      const png = await generateSingleImage({
        prompt: imagePrompt,
        size: dims.dalleSize,
      });

      if (!png) return null;

      const uploaded = await uploadThumbnailPng(userId, png);
      if (!uploaded) return null;

      const variation: ThumbnailVariation = {
        id: crypto.randomUUID(),
        imageUrl: uploaded.publicUrl,
        storagePath: uploaded.storagePath,
        headline: item.headline,
        cta: item.cta,
        imagePrompt,
        width: dims.width,
        height: dims.height,
      };

      return { index, variation };
    })
  );

  const variations = variationResults
    .filter(
      (
        item
      ): item is { index: number; variation: ThumbnailVariation } =>
        item !== null
    )
    .sort((a, b) => a.index - b.index)
    .map((item) => item.variation);

  if (variations.length === 0) {
    return null;
  }

  return {
    format: input.format,
    variations,
    suggestedHeadlines: draft.suggestedHeadlines,
    suggestedCtas: draft.suggestedCtas,
  };
}

export function getFormatMeta(format: ThumbnailFormat) {
  return {
    label: THUMBNAIL_FORMAT_LABELS[format],
    ...THUMBNAIL_FORMAT_DIMENSIONS[format],
  };
}
