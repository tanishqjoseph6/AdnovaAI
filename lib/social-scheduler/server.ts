import type {
  ScheduledPost,
  ScheduledPostsSummary,
} from "@/lib/social-scheduler/types";

export type ScheduledPostRow = {
  id: string;
  platform: string;
  caption: string;
  image_data_url: string | null;
  image_url: string | null;
  image_storage_path: string | null;
  scheduled_for: string;
  notes: string | null;
  status: string;
  connection_id: string | null;
  external_post_id: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function scheduledPostFromRow(row: ScheduledPostRow): ScheduledPost {
  return {
    id: row.id,
    platform: row.platform as ScheduledPost["platform"],
    caption: row.caption,
    imageDataUrl: row.image_data_url,
    imageUrl: row.image_url,
    imageStoragePath: row.image_storage_path,
    scheduledFor: row.scheduled_for,
    notes: row.notes,
    status: row.status as ScheduledPost["status"],
    connectionId: row.connection_id,
    externalPostId: row.external_post_id,
    publishedAt: row.published_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function summarizeScheduledPosts(
  posts: ScheduledPost[]
): ScheduledPostsSummary {
  return posts.reduce<ScheduledPostsSummary>(
    (summary, post) => ({
      ...summary,
      [post.status]: summary[post.status] + 1,
    }),
    { upcoming: 0, published: 0, failed: 0 }
  );
}

export function groupPostsByStatus(posts: ScheduledPost[]) {
  return {
    upcoming: posts.filter((post) => post.status === "upcoming"),
    published: posts.filter((post) => post.status === "published"),
    failed: posts.filter((post) => post.status === "failed"),
  };
}
