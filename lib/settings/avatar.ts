export const AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedAvatarMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];

const MIME_TO_EXT: Record<AllowedAvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedAvatarMimeType(
  value: string
): value is AllowedAvatarMimeType {
  return (ALLOWED_AVATAR_MIME_TYPES as readonly string[]).includes(value);
}

export function avatarExtensionForMime(mime: AllowedAvatarMimeType): string {
  return MIME_TO_EXT[mime];
}

export function getAvatarStoragePath(
  userId: string,
  mime: AllowedAvatarMimeType
): string {
  return `${userId}/avatar.${avatarExtensionForMime(mime)}`;
}

export function getAvatarPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${storagePath}`;
}

export function isAllowedAvatarUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return true;
  }

  try {
    const parsed = new URL(url.trim());
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (!base) {
      return false;
    }

    const expectedPrefix = `${base}/storage/v1/object/public/${AVATAR_BUCKET}/`;
    return parsed.href.startsWith(expectedPrefix);
  } catch {
    return false;
  }
}

export function validateAvatarFile(file: File):
  | { ok: true; mime: AllowedAvatarMimeType }
  | { ok: false; error: string } {
  if (!isAllowedAvatarMimeType(file.type)) {
    return {
      ok: false,
      error: "Profile photo must be a JPG, PNG, or WebP image.",
    };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: "Profile photo must be 5MB or smaller.",
    };
  }

  return { ok: true, mime: file.type };
}
