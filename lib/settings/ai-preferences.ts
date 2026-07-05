export const AI_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
] as const;

export const AI_TONES = [
  "Professional",
  "Friendly",
  "Luxury",
  "Funny",
  "Bold",
  "Minimal",
  "Emotional",
  "Gen Z",
  "Corporate",
  "Premium",
  "Storytelling",
  "Persuasive",
] as const;

export const AI_CAPTION_LENGTHS = [
  "Very Short",
  "Short",
  "Medium",
  "Long",
  "Detailed",
] as const;

export const AI_EMOJI_USAGE = ["None", "Low", "Medium", "High"] as const;

export const AI_CTA_STYLES = [
  "Direct",
  "Soft Sell",
  "Urgency",
  "FOMO",
  "Luxury",
  "Educational",
  "Community",
] as const;

export const AI_GENERATION_QUALITIES = ["Fast", "Balanced", "Premium"] as const;

export const AI_PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "TikTok",
  "X",
  "YouTube",
  "Google Ads",
] as const;

export const AI_AUDIENCES = [
  "Gen Z",
  "Millennials",
  "Professionals",
  "Parents",
  "Students",
  "Business Owners",
] as const;

export const AI_BRAND_VOICES = [
  "Minimal",
  "Premium",
  "Luxury",
  "Friendly",
  "Corporate",
  "Funny",
  "Bold",
] as const;

export type AiLanguage = (typeof AI_LANGUAGES)[number];
export type AiTone = (typeof AI_TONES)[number];
export type AiCaptionLength = (typeof AI_CAPTION_LENGTHS)[number];
export type AiEmojiUsage = (typeof AI_EMOJI_USAGE)[number];
export type AiCtaStyle = (typeof AI_CTA_STYLES)[number];
export type AiGenerationQuality = (typeof AI_GENERATION_QUALITIES)[number];
export type AiPlatform = (typeof AI_PLATFORMS)[number];
export type AiAudience = (typeof AI_AUDIENCES)[number];
export type AiBrandVoice = (typeof AI_BRAND_VOICES)[number];

export type AiPreferences = {
  language: AiLanguage;
  tone: AiTone;
  captionLength: AiCaptionLength;
  emojiUsage: AiEmojiUsage;
  ctaStyle: AiCtaStyle;
  creativeLevel: number;
  generationQuality: AiGenerationQuality;
  platform: AiPlatform;
  audience: AiAudience;
  brandVoice: AiBrandVoice;
};

export type AiPreferencesRecord = AiPreferences & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  language: "English",
  tone: "Professional",
  captionLength: "Medium",
  emojiUsage: "Low",
  ctaStyle: "Direct",
  creativeLevel: 50,
  generationQuality: "Balanced",
  platform: "Instagram",
  audience: "Professionals",
  brandVoice: "Friendly",
};

type ValidationResult =
  | { ok: true; value: AiPreferences }
  | { ok: false; error: string };

export type AiPreferencesInput = {
  [K in keyof AiPreferences]?: unknown;
};

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T
): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function clampCreativeLevel(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function validateAiPreferences(input: AiPreferencesInput): ValidationResult {
  const language = isOneOf(input.language, AI_LANGUAGES)
    ? input.language
    : DEFAULT_AI_PREFERENCES.language;
  const tone = isOneOf(input.tone, AI_TONES)
    ? input.tone
    : DEFAULT_AI_PREFERENCES.tone;
  const captionLength = isOneOf(input.captionLength, AI_CAPTION_LENGTHS)
    ? input.captionLength
    : DEFAULT_AI_PREFERENCES.captionLength;
  const emojiUsage = isOneOf(input.emojiUsage, AI_EMOJI_USAGE)
    ? input.emojiUsage
    : DEFAULT_AI_PREFERENCES.emojiUsage;
  const ctaStyle = isOneOf(input.ctaStyle, AI_CTA_STYLES)
    ? input.ctaStyle
    : DEFAULT_AI_PREFERENCES.ctaStyle;
  const generationQuality = isOneOf(input.generationQuality, AI_GENERATION_QUALITIES)
    ? input.generationQuality
    : DEFAULT_AI_PREFERENCES.generationQuality;
  const platform = isOneOf(input.platform, AI_PLATFORMS)
    ? input.platform
    : DEFAULT_AI_PREFERENCES.platform;
  const audience = isOneOf(input.audience, AI_AUDIENCES)
    ? input.audience
    : DEFAULT_AI_PREFERENCES.audience;
  const brandVoice = isOneOf(input.brandVoice, AI_BRAND_VOICES)
    ? input.brandVoice
    : DEFAULT_AI_PREFERENCES.brandVoice;

  const creativeLevel =
    typeof input.creativeLevel === "number" && Number.isFinite(input.creativeLevel)
      ? clampCreativeLevel(input.creativeLevel)
      : DEFAULT_AI_PREFERENCES.creativeLevel;

  if (
    input.language !== undefined &&
    !isOneOf(input.language, AI_LANGUAGES)
  ) {
    return { ok: false, error: "Invalid language selection." };
  }
  if (input.tone !== undefined && !isOneOf(input.tone, AI_TONES)) {
    return { ok: false, error: "Invalid tone selection." };
  }
  if (
    input.captionLength !== undefined &&
    !isOneOf(input.captionLength, AI_CAPTION_LENGTHS)
  ) {
    return { ok: false, error: "Invalid caption length selection." };
  }
  if (
    input.emojiUsage !== undefined &&
    !isOneOf(input.emojiUsage, AI_EMOJI_USAGE)
  ) {
    return { ok: false, error: "Invalid emoji usage selection." };
  }
  if (input.ctaStyle !== undefined && !isOneOf(input.ctaStyle, AI_CTA_STYLES)) {
    return { ok: false, error: "Invalid CTA style selection." };
  }
  if (
    input.generationQuality !== undefined &&
    !isOneOf(input.generationQuality, AI_GENERATION_QUALITIES)
  ) {
    return { ok: false, error: "Invalid generation quality selection." };
  }
  if (input.platform !== undefined && !isOneOf(input.platform, AI_PLATFORMS)) {
    return { ok: false, error: "Invalid platform selection." };
  }
  if (input.audience !== undefined && !isOneOf(input.audience, AI_AUDIENCES)) {
    return { ok: false, error: "Invalid audience selection." };
  }
  if (
    input.brandVoice !== undefined &&
    !isOneOf(input.brandVoice, AI_BRAND_VOICES)
  ) {
    return { ok: false, error: "Invalid brand voice selection." };
  }
  if (
    input.creativeLevel !== undefined &&
    (typeof input.creativeLevel !== "number" ||
      !Number.isFinite(input.creativeLevel) ||
      input.creativeLevel < 0 ||
      input.creativeLevel > 100)
  ) {
    return { ok: false, error: "Creative level must be between 0 and 100." };
  }

  return {
    ok: true,
    value: {
      language,
      tone,
      captionLength,
      emojiUsage,
      ctaStyle,
      creativeLevel,
      generationQuality,
      platform,
      audience,
      brandVoice,
    },
  };
}

const CAPTION_LENGTH_GUIDANCE: Record<AiCaptionLength, string> = {
  "Very Short": "Ultra-concise — one punchy line per caption (under ~50 characters).",
  Short: "Brief — 1–2 short lines per caption (under ~100 characters).",
  Medium: "Standard — 2–4 lines per caption with clear structure.",
  Long: "Extended — 4–6 lines per caption with richer detail.",
  Detailed:
    "Comprehensive — multi-sentence captions with full storytelling and specifics.",
};

const EMOJI_GUIDANCE: Record<AiEmojiUsage, string> = {
  None: "Do not use emojis anywhere.",
  Low: "Use at most 0–1 emoji per caption, sparingly.",
  Medium: "Use 2–3 emojis per caption where natural.",
  High: "Use emojis liberally to add energy and visual rhythm.",
};

const CTA_STYLE_GUIDANCE: Record<AiCtaStyle, string> = {
  Direct: "Clear, action-first CTAs (e.g. Shop now, Get started).",
  "Soft Sell": "Gentle, low-pressure CTAs that invite curiosity.",
  Urgency: "Time-sensitive CTAs with deadlines or limited availability.",
  FOMO: "Scarcity and social-proof driven CTAs.",
  Luxury: "Refined, exclusive CTAs that signal premium positioning.",
  Educational: "CTAs that lead with learning or discovery.",
  Community: "CTAs that emphasize belonging, sharing, or joining a group.",
};

const PLATFORM_GUIDANCE: Record<AiPlatform, string> = {
  Instagram: "Optimize for Instagram feed/Reels — visual-first, scroll-stopping hooks.",
  Facebook: "Optimize for Facebook — conversational, shareable, community-aware copy.",
  LinkedIn: "Optimize for LinkedIn — professional credibility and B2B clarity.",
  TikTok: "Optimize for TikTok — native, fast-paced, trend-aware UGC energy.",
  X: "Optimize for X (Twitter) — concise, punchy, high-impact lines.",
  YouTube: "Optimize for YouTube — hook-heavy intros and retention-focused scripts.",
  "Google Ads":
    "Optimize for Google Ads — keyword-aware, benefit-led, conversion-focused copy.",
};

function describeCreativeLevel(level: number): string {
  if (level <= 20) {
    return "Play it safe — proven formulas, conservative angles, minimal risk.";
  }
  if (level <= 40) {
    return "Mostly safe with light creative variation.";
  }
  if (level <= 60) {
    return "Balanced creativity — fresh ideas grounded in conversion principles.";
  }
  if (level <= 80) {
    return "Bold and distinctive — unexpected hooks and memorable angles.";
  }
  return "Highly experimental — unconventional ideas, edgy hooks, push boundaries.";
}

export function buildAiPreferencesPromptSection(
  preferences: AiPreferences | null | undefined
): string | undefined {
  if (!preferences) {
    return undefined;
  }

  const lines = [
    "User AI Preferences (apply to ALL generated copy — hooks, captions, CTAs, scripts):",
    `- Output language: ${preferences.language} (write ALL output in this language)`,
    `- Tone: ${preferences.tone}`,
    `- Brand voice: ${preferences.brandVoice}`,
    `- Target platform: ${preferences.platform} — ${PLATFORM_GUIDANCE[preferences.platform]}`,
    `- Target audience: ${preferences.audience}`,
    `- Caption length: ${preferences.captionLength} — ${CAPTION_LENGTH_GUIDANCE[preferences.captionLength]}`,
    `- Emoji usage: ${preferences.emojiUsage} — ${EMOJI_GUIDANCE[preferences.emojiUsage]}`,
    `- CTA style: ${preferences.ctaStyle} — ${CTA_STYLE_GUIDANCE[preferences.ctaStyle]}`,
    `- Creative level: ${preferences.creativeLevel}/100 — ${describeCreativeLevel(preferences.creativeLevel)}`,
    "",
    "These preferences override generic defaults. Brand Kit rules still apply where they do not conflict.",
  ];

  return lines.join("\n");
}

export type OpenAiGenerationConfig = {
  model: string;
  temperature: number;
  maxTokens?: number;
};

export function resolveOpenAiGenerationConfig(
  preferences: AiPreferences | null | undefined
): OpenAiGenerationConfig {
  const creativeLevel = preferences?.creativeLevel ?? DEFAULT_AI_PREFERENCES.creativeLevel;
  const quality =
    preferences?.generationQuality ?? DEFAULT_AI_PREFERENCES.generationQuality;

  const temperature = 0.3 + (creativeLevel / 100) * 0.7;

  if (quality === "Premium") {
    return { model: "gpt-4o", temperature, maxTokens: 4096 };
  }

  if (quality === "Fast") {
    return { model: "gpt-4o-mini", temperature: Math.min(temperature, 0.75), maxTokens: 2048 };
  }

  return { model: "gpt-4o-mini", temperature, maxTokens: 3072 };
}

export function aiPreferencesToApiResponse(record: AiPreferencesRecord) {
  return {
    language: record.language,
    tone: record.tone,
    captionLength: record.captionLength,
    emojiUsage: record.emojiUsage,
    ctaStyle: record.ctaStyle,
    creativeLevel: record.creativeLevel,
    generationQuality: record.generationQuality,
    platform: record.platform,
    audience: record.audience,
    brandVoice: record.brandVoice,
    updatedAt: record.updatedAt,
  };
}
