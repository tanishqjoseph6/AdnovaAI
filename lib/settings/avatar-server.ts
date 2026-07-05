import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AVATAR_BUCKET,
  getAvatarPublicUrl,
  getAvatarStoragePath,
  type AllowedAvatarMimeType,
} from "@/lib/settings/avatar";

export async function removeUserAvatarFiles(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId, { limit: 100 });

  if (listError) {
    console.error("Avatar list failed:", listError.message);
    return;
  }

  if (!files?.length) {
    return;
  }

  const paths = files
    .filter((file) => file.name)
    .map((file) => `${userId}/${file.name}`);

  if (paths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove(paths);

  if (removeError) {
    console.error("Avatar remove failed:", removeError.message);
  }
}

export async function uploadUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  mime: AllowedAvatarMimeType
): Promise<{ publicUrl: string; storagePath: string } | null> {
  await removeUserAvatarFiles(supabase, userId);

  const storagePath = getAvatarStoragePath(userId, mime);
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload failed:", uploadError.message);
    return null;
  }

  return {
    storagePath,
    publicUrl: getAvatarPublicUrl(storagePath),
  };
}

export async function persistProfileAvatarUrl(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined,
  avatarUrl: string | null,
  profileFields?: {
    username?: string | null;
    fullName?: string | null;
  }
): Promise<{ avatarUrl: string | null } | null> {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", userId)
    .maybeSingle();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      username: profileFields?.username ?? existing?.username ?? null,
      full_name: profileFields?.fullName ?? existing?.full_name ?? null,
      avatar_url: avatarUrl,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Profile avatar persist failed:", profileError.message);
    return null;
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  });

  if (metadataError) {
    console.error("Avatar metadata update failed:", metadataError.message);
    return null;
  }

  return { avatarUrl };
}
