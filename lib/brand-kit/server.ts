import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_BRAND_KIT,
  hasBrandKitContent,
  type BrandKit,
  type BrandKitRecord,
} from "@/lib/brand-kit/types";

type BrandKitRow = {
  user_id: string;
  brand_name: string | null;
  website_url: string | null;
  logo_url: string | null;
  brand_description: string | null;
  industry: string | null;
  target_audience: string | null;
  usp: string | null;
  brand_voice: string | null;
  custom_brand_voice: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  cta_color: string | null;
  caption_length: string | null;
  emoji_usage: string | null;
  cta_style: string | null;
  writing_style: string | null;
  created_at: string;
  updated_at: string;
};

export function brandKitFromRow(row: BrandKitRow): BrandKitRecord {
  return {
    userId: row.user_id,
    brandName: row.brand_name ?? "",
    websiteUrl: row.website_url ?? "",
    logoUrl: row.logo_url ?? "",
    brandDescription: row.brand_description ?? "",
    industry: row.industry ?? "",
    targetAudience: row.target_audience ?? "",
    usp: row.usp ?? "",
    brandVoice: (row.brand_voice ?? DEFAULT_BRAND_KIT.brandVoice) as BrandKitRecord["brandVoice"],
    customBrandVoice: row.custom_brand_voice ?? "",
    primaryColor: row.primary_color ?? DEFAULT_BRAND_KIT.primaryColor,
    secondaryColor: row.secondary_color ?? DEFAULT_BRAND_KIT.secondaryColor,
    ctaColor: row.cta_color ?? DEFAULT_BRAND_KIT.ctaColor,
    captionLength: (row.caption_length ?? DEFAULT_BRAND_KIT.captionLength) as BrandKitRecord["captionLength"],
    emojiUsage: (row.emoji_usage ?? DEFAULT_BRAND_KIT.emojiUsage) as BrandKitRecord["emojiUsage"],
    ctaStyle: (row.cta_style ?? DEFAULT_BRAND_KIT.ctaStyle) as BrandKitRecord["ctaStyle"],
    writingStyle: (row.writing_style ?? DEFAULT_BRAND_KIT.writingStyle) as BrandKitRecord["writingStyle"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function brandKitToRow(
  userId: string,
  brandKit: BrandKit,
  updatedAt: string
): Omit<BrandKitRow, "created_at"> {
  return {
    user_id: userId,
    brand_name: brandKit.brandName || null,
    website_url: brandKit.websiteUrl || null,
    logo_url: brandKit.logoUrl || null,
    brand_description: brandKit.brandDescription || null,
    industry: brandKit.industry || null,
    target_audience: brandKit.targetAudience || null,
    usp: brandKit.usp || null,
    brand_voice: brandKit.brandVoice,
    custom_brand_voice: brandKit.customBrandVoice || null,
    primary_color: brandKit.primaryColor,
    secondary_color: brandKit.secondaryColor,
    cta_color: brandKit.ctaColor,
    caption_length: brandKit.captionLength,
    emoji_usage: brandKit.emojiUsage,
    cta_style: brandKit.ctaStyle,
    writing_style: brandKit.writingStyle,
    updated_at: updatedAt,
  };
}

export async function getBrandKitForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<BrandKitRecord | null> {
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Brand Kit fetch failed:", error.message);
    return null;
  }

  return data ? brandKitFromRow(data as BrandKitRow) : null;
}

export function buildBrandKitPromptSection(
  brandKit: BrandKit | null | undefined
): string | undefined {
  if (!brandKit || !hasBrandKitContent(brandKit)) {
    return undefined;
  }

  const voice =
    brandKit.brandVoice === "Custom"
      ? brandKit.customBrandVoice
      : brandKit.brandVoice;
  const lines = [
    "Brand Kit:",
    brandKit.brandName ? `- Brand name: ${brandKit.brandName}` : "",
    brandKit.websiteUrl ? `- Website: ${brandKit.websiteUrl}` : "",
    brandKit.brandDescription
      ? `- Brand description: ${brandKit.brandDescription}`
      : "",
    brandKit.industry ? `- Industry: ${brandKit.industry}` : "",
    brandKit.targetAudience
      ? `- Target audience: ${brandKit.targetAudience}`
      : "",
    brandKit.usp ? `- Unique selling proposition: ${brandKit.usp}` : "",
    voice ? `- Brand voice: ${voice}` : "",
    `- Caption length: ${brandKit.captionLength}`,
    `- Emoji usage: ${brandKit.emojiUsage}`,
    `- CTA style: ${brandKit.ctaStyle}`,
    `- Writing style: ${brandKit.writingStyle}`,
    `- Visual identity: primary ${brandKit.primaryColor}, secondary ${brandKit.secondaryColor}, CTA ${brandKit.ctaColor}`,
    "",
    "Use this Brand Kit automatically. Match the voice, audience, positioning, USP, emoji preference, caption length, CTA style, and visual identity cues unless they conflict with the user's product brief.",
  ];

  return lines.filter(Boolean).join("\n");
}
