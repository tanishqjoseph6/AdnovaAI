import { createAdminClient } from "@/lib/supabase/admin";
import {
  ensureFreshAccessToken,
  getConnectionWithTokens,
} from "@/lib/social-scheduler/connections-server";
import {
  assertAvailableProvider,
  getAvailableProvider,
} from "@/lib/social-scheduler/providers/registry";
import {
  scheduledPostFromRow,
  type ScheduledPostRow,
} from "@/lib/social-scheduler/server";
import type { ScheduledPost } from "@/lib/social-scheduler/types";

export async function publishScheduledPost(
  postId: string,
  userId: string
): Promise<ScheduledPost> {
  const admin = createAdminClient();

  const { data: postRow, error: postError } = await admin
    .from("scheduled_posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (postError) {
    throw postError;
  }

  if (!postRow) {
    throw new Error("Scheduled post not found.");
  }

  const post = scheduledPostFromRow(postRow as ScheduledPostRow);
  assertAvailableProvider(post.platform);

  const connection = await getConnectionWithTokens(userId, post.platform);
  if (!connection) {
    throw new Error(
      `Connect your ${post.platform === "x" ? "X" : "LinkedIn"} account before publishing.`
    );
  }

  const { accessToken, connection: freshConnection } =
    await ensureFreshAccessToken(connection);
  const provider = getAvailableProvider(post.platform);

  try {
    const result = await provider.publishPost({
      caption: post.caption,
      imageUrl: post.imageUrl ?? post.imageDataUrl,
      accessToken,
      profileId: freshConnection.profile_id,
    });

    const { data: updated, error: updateError } = await admin
      .from("scheduled_posts")
      .update({
        status: "published",
        connection_id: freshConnection.id,
        external_post_id: result.externalPostId,
        published_at: result.publishedAt,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw updateError ?? new Error("Unable to update published post.");
    }

    return scheduledPostFromRow(updated as ScheduledPostRow);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Publishing failed.";

    const { data: failed, error: failUpdateError } = await admin
      .from("scheduled_posts")
      .update({
        status: "failed",
        connection_id: freshConnection.id,
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (failUpdateError) {
      throw failUpdateError;
    }

    if (failed) {
      return scheduledPostFromRow(failed as ScheduledPostRow);
    }

    throw error;
  }
}

export async function publishDueScheduledPosts(): Promise<{
  processed: number;
  published: number;
  failed: number;
}> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: duePosts, error } = await admin
    .from("scheduled_posts")
    .select("id, user_id")
    .eq("status", "upcoming")
    .in("platform", ["x", "linkedin"])
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(25);

  if (error) {
    throw error;
  }

  let published = 0;
  let failed = 0;

  for (const row of duePosts ?? []) {
    try {
      const result = await publishScheduledPost(row.id as string, row.user_id as string);
      if (result.status === "published") {
        published += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    processed: duePosts?.length ?? 0,
    published,
    failed,
  };
}
