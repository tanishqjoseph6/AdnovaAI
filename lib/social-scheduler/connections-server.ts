import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableProvider } from "@/lib/social-scheduler/providers/registry";
import type { OAuthTokens } from "@/lib/social-scheduler/providers/types";
import type {
  AvailablePlatform,
  SocialConnection,
  SocialPlatform,
} from "@/lib/social-scheduler/types";

export type SocialConnectionRow = {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  profile_id: string | null;
  profile_username: string | null;
  profile_name: string | null;
  profile_image_url: string | null;
  connected_at: string;
  updated_at: string;
};

export function socialConnectionFromRow(
  row: SocialConnectionRow
): SocialConnection {
  return {
    id: row.id,
    platform: row.platform as SocialPlatform,
    profileId: row.profile_id,
    profileUsername: row.profile_username,
    profileName: row.profile_name,
    profileImageUrl: row.profile_image_url,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}

export async function listSocialConnections(
  userId: string
): Promise<SocialConnection[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("social_connections")
    .select(
      "id, platform, profile_id, profile_username, profile_name, profile_image_url, connected_at, updated_at"
    )
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    socialConnectionFromRow(row as SocialConnectionRow)
  );
}

export async function upsertSocialConnection(
  userId: string,
  platform: AvailablePlatform,
  tokens: OAuthTokens,
  profile: {
    profileId: string;
    profileUsername: string | null;
    profileName: string | null;
    profileImageUrl: string | null;
  }
): Promise<SocialConnection> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("social_connections")
    .upsert(
      {
        user_id: userId,
        platform,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt,
        scopes: tokens.scopes,
        profile_id: profile.profileId,
        profile_username: profile.profileUsername,
        profile_name: profile.profileName,
        profile_image_url: profile.profileImageUrl,
        updated_at: now,
      },
      { onConflict: "user_id,platform" }
    )
    .select(
      "id, platform, profile_id, profile_username, profile_name, profile_image_url, connected_at, updated_at"
    )
    .single();

  if (error) {
    throw error;
  }

  return socialConnectionFromRow(data as SocialConnectionRow);
}

export async function deleteSocialConnection(
  userId: string,
  platform: SocialPlatform
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("social_connections")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);

  if (error) {
    throw error;
  }
}

export async function getConnectionWithTokens(
  userId: string,
  platform: AvailablePlatform
): Promise<SocialConnectionRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("social_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SocialConnectionRow | null) ?? null;
}

export async function ensureFreshAccessToken(
  connection: SocialConnectionRow
): Promise<{ accessToken: string; connection: SocialConnectionRow }> {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : null;

  const isExpired =
    expiresAt !== null && expiresAt <= Date.now() + 60_000;

  if (!isExpired) {
    return { accessToken: connection.access_token, connection };
  }

  if (!connection.refresh_token) {
    throw new Error(
      `${connection.platform} connection expired. Please reconnect.`
    );
  }

  const provider = getAvailableProvider(connection.platform as AvailablePlatform);
  const refreshed = await provider.refreshAccessToken(connection.refresh_token);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("social_connections")
    .update({
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken ?? connection.refresh_token,
      token_expires_at: refreshed.expiresAt,
      scopes: refreshed.scopes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to refresh social connection.");
  }

  return {
    accessToken: refreshed.accessToken,
    connection: data as SocialConnectionRow,
  };
}
