import {
  BRAND_VOICES,
  CAPTION_LENGTHS,
  CTA_STYLES,
  DEFAULT_BRAND_KIT,
  EMOJI_USAGE_LEVELS,
  WRITING_STYLES,
  type BrandKit,
  type BrandVoice,
  type CaptionLength,
  type CtaStyle,
  type EmojiUsage,
  type WritingStyle,
} from "@/lib/brand-kit/types";

type ValidationResult =
  | { ok: true; value: BrandKit }
  | { ok: false; error: string };

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const MAX_LOGO_DATA_URL_LENGTH = 700_000;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clampText(value: unknown, maxLength: number): string {
  return readString(value).slice(0, maxLength);
}

function readEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && allowed.includes(value)
    ? value
    : fallback;
}

function normalizeUrl(value: unknown): string {
  const raw = readString(value);
  if (!raw) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeLogoUrl(value: unknown): string {
  const raw = readString(value);
  if (!raw) {
    return "";
  }

  if (raw.startsWith("data:image/")) {
    return raw.slice(0, MAX_LOGO_DATA_URL_LENGTH);
  }

  return normalizeUrl(raw);
}

function normalizeColor(value: unknown, fallback: string): string {
  const color = readString(value);
  return HEX_COLOR_PATTERN.test(color) ? color.toLowerCase() : fallback;
}

export function validateBrandKit(input: Record<string, unknown>): ValidationResult {
  const brandKit: BrandKit = {
    brandName: clampText(input.brandName, 120),
    websiteUrl: normalizeUrl(input.websiteUrl),
    logoUrl: normalizeLogoUrl(input.logoUrl),
    brandDescription: clampText(input.brandDescription, 1200),
    industry: clampText(input.industry, 100),
    targetAudience: clampText(input.targetAudience, 600),
    usp: clampText(input.usp, 600),
    brandVoice: readEnum(
      input.brandVoice,
      BRAND_VOICES,
      DEFAULT_BRAND_KIT.brandVoice
    ) as BrandVoice,
    customBrandVoice: clampText(input.customBrandVoice, 500),
    primaryColor: normalizeColor(
      input.primaryColor,
      DEFAULT_BRAND_KIT.primaryColor
    ),
    secondaryColor: normalizeColor(
      input.secondaryColor,
      DEFAULT_BRAND_KIT.secondaryColor
    ),
    ctaColor: normalizeColor(input.ctaColor, DEFAULT_BRAND_KIT.ctaColor),
    captionLength: readEnum(
      input.captionLength,
      CAPTION_LENGTHS,
      DEFAULT_BRAND_KIT.captionLength
    ) as CaptionLength,
    emojiUsage: readEnum(
      input.emojiUsage,
      EMOJI_USAGE_LEVELS,
      DEFAULT_BRAND_KIT.emojiUsage
    ) as EmojiUsage,
    ctaStyle: readEnum(
      input.ctaStyle,
      CTA_STYLES,
      DEFAULT_BRAND_KIT.ctaStyle
    ) as CtaStyle,
    writingStyle: readEnum(
      input.writingStyle,
      WRITING_STYLES,
      DEFAULT_BRAND_KIT.writingStyle
    ) as WritingStyle,
  };

  if (readString(input.websiteUrl) && !brandKit.websiteUrl) {
    return { ok: false, error: "Enter a valid public website URL." };
  }

  if (readString(input.logoUrl) && !brandKit.logoUrl) {
    return { ok: false, error: "Enter a valid logo URL or upload an image." };
  }

  if (brandKit.brandVoice === "Custom" && !brandKit.customBrandVoice) {
    return { ok: false, error: "Describe your custom brand voice." };
  }

  return { ok: true, value: brandKit };
}
