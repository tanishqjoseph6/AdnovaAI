export const BRAND_VOICES = [
  "Professional",
  "Luxury",
  "Minimal",
  "Friendly",
  "Bold",
  "Gen Z",
  "Premium Tech",
  "Fashion",
  "Beauty",
  "Fitness",
  "Funny",
  "Custom",
] as const;

export const CAPTION_LENGTHS = ["Short", "Medium", "Long"] as const;
export const EMOJI_USAGE_LEVELS = ["None", "Low", "Medium", "High"] as const;
export const CTA_STYLES = ["Soft", "Direct", "Urgent"] as const;
export const WRITING_STYLES = [
  "Storytelling",
  "Sales",
  "Educational",
  "Emotional",
] as const;

export type BrandVoice = (typeof BRAND_VOICES)[number];
export type CaptionLength = (typeof CAPTION_LENGTHS)[number];
export type EmojiUsage = (typeof EMOJI_USAGE_LEVELS)[number];
export type CtaStyle = (typeof CTA_STYLES)[number];
export type WritingStyle = (typeof WRITING_STYLES)[number];

export type BrandKit = {
  brandName: string;
  websiteUrl: string;
  logoUrl: string;
  brandDescription: string;
  industry: string;
  targetAudience: string;
  usp: string;
  brandVoice: BrandVoice;
  customBrandVoice: string;
  primaryColor: string;
  secondaryColor: string;
  ctaColor: string;
  captionLength: CaptionLength;
  emojiUsage: EmojiUsage;
  ctaStyle: CtaStyle;
  writingStyle: WritingStyle;
};

export type BrandKitRecord = BrandKit & {
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type BrandKitAutofill = {
  brandName?: string;
  industry?: string;
  brandDescription?: string;
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  brandName: "",
  websiteUrl: "",
  logoUrl: "",
  brandDescription: "",
  industry: "",
  targetAudience: "",
  usp: "",
  brandVoice: "Professional",
  customBrandVoice: "",
  primaryColor: "#8b5cf6",
  secondaryColor: "#22d3ee",
  ctaColor: "#ec4899",
  captionLength: "Medium",
  emojiUsage: "Low",
  ctaStyle: "Direct",
  writingStyle: "Sales",
};

export function hasBrandKitContent(brandKit: BrandKit | null | undefined): boolean {
  if (!brandKit) {
    return false;
  }

  return Boolean(
    brandKit.brandName ||
      brandKit.websiteUrl ||
      brandKit.logoUrl ||
      brandKit.brandDescription ||
      brandKit.industry ||
      brandKit.targetAudience ||
      brandKit.usp ||
      brandKit.customBrandVoice
  );
}
