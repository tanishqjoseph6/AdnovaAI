import type { ScheduledPost, ScheduledPostsSummary } from "@/lib/social-scheduler/types";

type ScheduledPostRow = {
  id: string;
  platform: string;
  caption: string;
  image_data_url: string | null;
  scheduled_for: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function scheduledPostFromRow(row: ScheduledPostRow): ScheduledPost {
  return {
    id: row.id,
    platform: row.platform as ScheduledPost["platform"],
    caption: row.caption,
    imageDataUrl: row.image_data_url,
    scheduledFor: row.scheduled_for,
    notes: row.notes,
    status: row.status as ScheduledPost["status"],
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
