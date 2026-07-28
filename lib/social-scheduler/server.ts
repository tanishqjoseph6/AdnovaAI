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
  campaign_id?: string | null;
  campaign_color?: string | null;
  team_id?: string | null;
  submitted_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
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
    campaignId: row.campaign_id ?? null,
    campaignColor: row.campaign_color ?? null,
    teamId: row.team_id ?? null,
    submittedBy: row.submitted_by ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    rejectionReason: row.rejection_reason ?? null,
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
      [post.status]: (summary[post.status] ?? 0) + 1,
    }),
    {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      upcoming: 0,
      published: 0,
      failed: 0,
      rejected: 0,
    }
  );
}

export function groupPostsByStatus(posts: ScheduledPost[]) {
  return {
    draft: posts.filter((post) => post.status === "draft"),
    pending_approval: posts.filter((post) => post.status === "pending_approval"),
    approved: posts.filter((post) => post.status === "approved"),
    upcoming: posts.filter((post) => post.status === "upcoming"),
    published: posts.filter((post) => post.status === "published"),
    failed: posts.filter((post) => post.status === "failed"),
    rejected: posts.filter((post) => post.status === "rejected"),
  };
}
