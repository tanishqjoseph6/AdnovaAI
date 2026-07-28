import {
  THUMBNAIL_FORMAT_DIMENSIONS,
  THUMBNAIL_FORMATS,
  type ThumbnailFormat,
  type ThumbnailResult,
  type ThumbnailVariation,
} from "@/lib/thumbnail/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
}

function isFormat(value: string): value is ThumbnailFormat {
  return (THUMBNAIL_FORMATS as readonly string[]).includes(value);
}

export type ThumbnailCopyDraft = {
  suggestedHeadlines: string[];
  suggestedCtas: string[];
  variations: Array<{
    headline: string;
    cta: string;
    imagePrompt: string;
  }>;
};

export function normalizeThumbnailCopyDraft(
  raw: unknown,
  expectedCount: number
): ThumbnailCopyDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const variationsRaw = Array.isArray(data.variations) ? data.variations : [];
  const variations = variationsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const headline = asString(row.headline ?? row.title);
      const cta = asString(row.cta ?? row.callToAction ?? row.call_to_action);
      const imagePrompt = asString(
        row.imagePrompt ?? row.image_prompt ?? row.prompt
      );
      if (!headline || !cta || !imagePrompt) return null;
      return { headline, cta, imagePrompt };
    })
    .filter(
      (item): item is { headline: string; cta: string; imagePrompt: string } =>
        item !== null
    );

  if (variations.length < expectedCount) {
    return null;
  }

  const suggestedHeadlines = asStringArray(
    data.suggestedHeadlines ?? data.suggested_headlines
  );
  const suggestedCtas = asStringArray(
    data.suggestedCtas ?? data.suggested_ctas
  );

  return {
    suggestedHeadlines:
      suggestedHeadlines.length >= 3
        ? suggestedHeadlines.slice(0, 3)
        : variations.slice(0, 3).map((item) => item.headline),
    suggestedCtas:
      suggestedCtas.length >= 3
        ? suggestedCtas.slice(0, 3)
        : variations.slice(0, 3).map((item) => item.cta),
    variations: variations.slice(0, expectedCount),
  };
}

export function normalizeThumbnailResult(raw: unknown): ThumbnailResult | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const formatValue = asString(data.format);
  if (!isFormat(formatValue)) return null;

  const dims = THUMBNAIL_FORMAT_DIMENSIONS[formatValue];
  const variationsRaw = Array.isArray(data.variations) ? data.variations : [];
  const variations: ThumbnailVariation[] = [];

  for (const item of variationsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = asString(row.id);
    const imageUrl = asString(row.imageUrl ?? row.image_url);
    const storagePath = asString(row.storagePath ?? row.storage_path);
    const headline = asString(row.headline);
    const cta = asString(row.cta);
    const imagePrompt = asString(row.imagePrompt ?? row.image_prompt);
    if (!id || !imageUrl || !headline || !cta) continue;

    variations.push({
      id,
      imageUrl,
      storagePath,
      headline,
      cta,
      imagePrompt,
      width:
        typeof row.width === "number" && row.width > 0 ? row.width : dims.width,
      height:
        typeof row.height === "number" && row.height > 0
          ? row.height
          : dims.height,
    });
  }

  if (variations.length === 0) return null;

  return {
    format: formatValue,
    variations,
    suggestedHeadlines: asStringArray(
      data.suggestedHeadlines ?? data.suggested_headlines
    ),
    suggestedCtas: asStringArray(data.suggestedCtas ?? data.suggested_ctas),
  };
}
