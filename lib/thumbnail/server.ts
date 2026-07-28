import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeThumbnailResult } from "@/lib/thumbnail/normalize";
import type {
  ThumbnailBrandColors,
  ThumbnailFormat,
  ThumbnailInput,
  ThumbnailRecord,
  ThumbnailResult,
  ThumbnailTemplate,
} from "@/lib/thumbnail/types";
import { THUMBNAIL_FORMATS } from "@/lib/thumbnail/types";

type ThumbnailRow = {
  id: string;
  user_id: string;
  format: string;
  prompt: string;
  product_url: string | null;
  brand_name: string;
  brand_colors: unknown;
  result: unknown;
  template_id: string | null;
  created_at: string;
  updated_at: string;
};

type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  format: string;
  prompt: string;
  brand_name: string;
  brand_colors: unknown;
  product_url: string | null;
  preview_image_url: string | null;
  created_at: string;
  updated_at: string;
};

function isFormat(value: string): value is ThumbnailFormat {
  return (THUMBNAIL_FORMATS as readonly string[]).includes(value);
}

function normalizeBrandColors(value: unknown): ThumbnailBrandColors | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const primary = typeof data.primary === "string" ? data.primary : "";
  const secondary = typeof data.secondary === "string" ? data.secondary : "";
  const accent = typeof data.accent === "string" ? data.accent : "";
  if (!primary || !secondary || !accent) return null;
  return { primary, secondary, accent };
}

export function thumbnailFromRow(row: unknown): ThumbnailRecord | null {
  if (!row || typeof row !== "object") return null;
  const data = row as ThumbnailRow;

  if (
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.format !== "string" ||
    typeof data.prompt !== "string" ||
    typeof data.brand_name !== "string" ||
    !isFormat(data.format)
  ) {
    return null;
  }

  const brandColors = normalizeBrandColors(data.brand_colors);
  const result = normalizeThumbnailResult(data.result);
  if (!brandColors || !result) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    format: data.format,
    prompt: data.prompt,
    product_url: data.product_url,
    brand_name: data.brand_name,
    brand_colors: brandColors,
    result,
    template_id: data.template_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function thumbnailTemplateFromRow(
  row: unknown
): ThumbnailTemplate | null {
  if (!row || typeof row !== "object") return null;
  const data = row as TemplateRow;

  if (
    typeof data.id !== "string" ||
    typeof data.user_id !== "string" ||
    typeof data.name !== "string" ||
    typeof data.format !== "string" ||
    typeof data.prompt !== "string" ||
    typeof data.brand_name !== "string" ||
    !isFormat(data.format)
  ) {
    return null;
  }

  const brandColors = normalizeBrandColors(data.brand_colors);
  if (!brandColors) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    format: data.format,
    prompt: data.prompt,
    brand_name: data.brand_name,
    brand_colors: brandColors,
    product_url: data.product_url,
    preview_image_url: data.preview_image_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function saveThumbnail(
  supabase: SupabaseClient,
  userId: string,
  input: ThumbnailInput,
  result: ThumbnailResult
): Promise<ThumbnailRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("thumbnails")
    .insert({
      user_id: userId,
      format: input.format,
      prompt: input.prompt,
      product_url: input.productUrl.trim() || null,
      brand_name: input.brandName,
      brand_colors: input.brandColors,
      result,
      template_id: input.templateId,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save thumbnail:", error);
    return null;
  }

  return thumbnailFromRow(data);
}

export async function listThumbnailsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ThumbnailRecord[]> {
  const { data, error } = await supabase
    .from("thumbnails")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list thumbnails:", error);
    return [];
  }

  return (data ?? [])
    .map(thumbnailFromRow)
    .filter((row): row is ThumbnailRecord => row !== null);
}

export async function listThumbnailTemplatesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ThumbnailTemplate[]> {
  const { data, error } = await supabase
    .from("thumbnail_templates")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to list thumbnail templates:", error);
    return [];
  }

  return (data ?? [])
    .map(thumbnailTemplateFromRow)
    .filter((row): row is ThumbnailTemplate => row !== null);
}

export async function saveThumbnailTemplate(
  supabase: SupabaseClient,
  userId: string,
  input: {
    name: string;
    format: ThumbnailFormat;
    prompt: string;
    brandName: string;
    brandColors: ThumbnailBrandColors;
    productUrl?: string | null;
    previewImageUrl?: string | null;
  }
): Promise<ThumbnailTemplate | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("thumbnail_templates")
    .insert({
      user_id: userId,
      name: input.name,
      format: input.format,
      prompt: input.prompt,
      brand_name: input.brandName,
      brand_colors: input.brandColors,
      product_url: input.productUrl?.trim() || null,
      preview_image_url: input.previewImageUrl ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save thumbnail template:", error);
    return null;
  }

  return thumbnailTemplateFromRow(data);
}
