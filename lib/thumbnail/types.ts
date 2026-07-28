export const THUMBNAIL_FORMATS = [
  "youtube",
  "instagram_cover",
  "reel_cover",
  "product",
  "advertisement",
] as const;

export type ThumbnailFormat = (typeof THUMBNAIL_FORMATS)[number];

export const THUMBNAIL_FORMAT_LABELS: Record<ThumbnailFormat, string> = {
  youtube: "YouTube Thumbnail",
  instagram_cover: "Instagram Cover",
  reel_cover: "Reel Cover",
  product: "Product Thumbnail",
  advertisement: "Advertisement Thumbnail",
};

export const THUMBNAIL_FORMAT_DIMENSIONS: Record<
  ThumbnailFormat,
  { width: number; height: number; aspect: string; dalleSize: "1024x1024" | "1792x1024" | "1024x1792" }
> = {
  youtube: {
    width: 1280,
    height: 720,
    aspect: "16:9",
    dalleSize: "1792x1024",
  },
  instagram_cover: {
    width: 1080,
    height: 1080,
    aspect: "1:1",
    dalleSize: "1024x1024",
  },
  reel_cover: {
    width: 1080,
    height: 1920,
    aspect: "9:16",
    dalleSize: "1024x1792",
  },
  product: {
    width: 1200,
    height: 1200,
    aspect: "1:1",
    dalleSize: "1024x1024",
  },
  advertisement: {
    width: 1200,
    height: 628,
    aspect: "1.91:1",
    dalleSize: "1792x1024",
  },
};

export const THUMBNAIL_VARIATION_COUNTS = [2, 3, 4] as const;
export type ThumbnailVariationCount = (typeof THUMBNAIL_VARIATION_COUNTS)[number];

export type ThumbnailBrandColors = {
  primary: string;
  secondary: string;
  accent: string;
};

export type ThumbnailInput = {
  format: ThumbnailFormat;
  prompt: string;
  productUrl: string;
  productImageBase64: string | null;
  productImageMimeType: string | null;
  logoBase64: string | null;
  logoMimeType: string | null;
  brandName: string;
  brandColors: ThumbnailBrandColors;
  variationCount: ThumbnailVariationCount;
  templateId: string | null;
};

export type ThumbnailVariation = {
  id: string;
  imageUrl: string;
  storagePath: string;
  headline: string;
  cta: string;
  imagePrompt: string;
  width: number;
  height: number;
};

export type ThumbnailResult = {
  format: ThumbnailFormat;
  variations: ThumbnailVariation[];
  suggestedHeadlines: string[];
  suggestedCtas: string[];
};

export type ThumbnailRecord = {
  id: string;
  user_id: string;
  format: ThumbnailFormat;
  prompt: string;
  product_url: string | null;
  brand_name: string;
  brand_colors: ThumbnailBrandColors;
  result: ThumbnailResult;
  template_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ThumbnailTemplate = {
  id: string;
  user_id: string;
  name: string;
  format: ThumbnailFormat;
  prompt: string;
  brand_name: string;
  brand_colors: ThumbnailBrandColors;
  product_url: string | null;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export const EMPTY_THUMBNAIL_INPUT: ThumbnailInput = {
  format: "youtube",
  prompt: "",
  productUrl: "",
  productImageBase64: null,
  productImageMimeType: null,
  logoBase64: null,
  logoMimeType: null,
  brandName: "",
  brandColors: {
    primary: "#8b5cf6",
    secondary: "#22d3ee",
    accent: "#ec4899",
  },
  variationCount: 3,
  templateId: null,
};

export function createEmptyThumbnailResult(
  format: ThumbnailFormat = "youtube"
): ThumbnailResult {
  return {
    format,
    variations: [],
    suggestedHeadlines: [],
    suggestedCtas: [],
  };
}
