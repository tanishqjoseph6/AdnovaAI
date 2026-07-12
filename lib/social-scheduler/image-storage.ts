import type { SupabaseClient } from "@supabase/supabase-js";

export const SCHEDULED_POST_IMAGE_BUCKET = "scheduled-post-images";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function isAllowedScheduledPostImage(file: File): boolean {
  return ALLOWED_MIME_TYPES.has(file.type) && file.size <= MAX_IMAGE_BYTES;
}

export function getScheduledPostImagePath(
  userId: string,
  extension: string
): string {
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  return `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExtension}`;
}

export function getScheduledPostImagePublicUrl(
  supabase: SupabaseClient,
  storagePath: string
): string {
  const { data } = supabase.storage
    .from(SCHEDULED_POST_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function uploadScheduledPostImage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<{ storagePath: string; publicUrl: string } | null> {
  if (!isAllowedScheduledPostImage(file)) {
    return null;
  }

  const extension = file.type.split("/")[1] ?? "jpg";
  const storagePath = getScheduledPostImagePath(userId, extension);

  const { error } = await supabase.storage
    .from(SCHEDULED_POST_IMAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Scheduled post image upload failed:", error.message);
    return null;
  }

  return {
    storagePath,
    publicUrl: getScheduledPostImagePublicUrl(supabase, storagePath),
  };
}
