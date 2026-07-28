import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const THUMBNAIL_IMAGE_BUCKET = "thumbnail-images";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedThumbnailMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getThumbnailImagePath(
  userId: string,
  extension: string
): string {
  const safeExtension =
    extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "png";
  return `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExtension}`;
}

export function getThumbnailImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(THUMBNAIL_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function uploadThumbnailPng(
  userId: string,
  pngBytes: Buffer
): Promise<{ storagePath: string; publicUrl: string } | null> {
  const admin = createAdminClient();
  const storagePath = getThumbnailImagePath(userId, "png");

  const { error } = await admin.storage
    .from(THUMBNAIL_IMAGE_BUCKET)
    .upload(storagePath, pngBytes, {
      cacheControl: "31536000",
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    console.error("Thumbnail image upload failed:", error.message);
    return null;
  }

  return {
    storagePath,
    publicUrl: getThumbnailImagePublicUrl(admin, storagePath),
  };
}

export function decodeBase64Image(
  base64: string,
  mimeType: string
): { bytes: Buffer; mimeType: string } | null {
  if (!isAllowedThumbnailMimeType(mimeType)) {
    return null;
  }

  try {
    const cleaned = base64.includes(",")
      ? base64.slice(base64.indexOf(",") + 1)
      : base64;
    const bytes = Buffer.from(cleaned, "base64");
    if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024) {
      return null;
    }
    return { bytes, mimeType };
  } catch {
    return null;
  }
}
