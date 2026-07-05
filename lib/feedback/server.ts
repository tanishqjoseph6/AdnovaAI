import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getFeedbackCategoryLabel,
  getFeedbackReactionLabel,
  type FeedbackCategory,
  type FeedbackReaction,
  type FeedbackRating,
} from "./validation";

export const FEEDBACK_STATUSES = [
  "new",
  "in_review",
  "planned",
  "completed",
  "dismissed",
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export type FeedbackRow = {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  screenshot_url: string | null;
  rating: number;
  reaction: FeedbackReaction;
  status: FeedbackStatus;
  admin_reply: string | null;
  replied_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FeedbackProfile = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
};

export type FeedbackTicket = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  category: FeedbackCategory;
  categoryLabel: string;
  subject: string;
  message: string;
  screenshotPath: string | null;
  screenshotUrl: string | null;
  rating: FeedbackRating;
  reaction: FeedbackReaction;
  reactionLabel: string;
  status: FeedbackStatus;
  adminReply: string | null;
  repliedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFeedbackTicket = FeedbackTicket & {
  profile: {
    username: string | null;
    fullName: string | null;
  };
};

export type AdminReplyInput =
  | {
      ok: true;
      value: {
        status: FeedbackStatus;
        adminReply: string | null;
      };
    }
  | { ok: false; error: string };

export type FeedbackAnalytics = {
  averageRating: number;
  totalFeedback: number;
  mostSelectedReaction: {
    reaction: FeedbackReaction;
    label: string;
    percent: number;
  } | null;
  topCategory: {
    category: FeedbackCategory;
    label: string;
    count: number;
  } | null;
  weeklyFeedback: number;
  monthlyFeedback: number;
  statusCounts: Record<FeedbackStatus, number>;
  ratingDistribution: Array<{
    rating: FeedbackRating;
    label: string;
    count: number;
    percent: number;
  }>;
  reactionDistribution: Array<{
    reaction: FeedbackReaction;
    label: string;
    count: number;
    percent: number;
  }>;
};

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return (
    typeof value === "string" &&
    FEEDBACK_STATUSES.includes(value as FeedbackStatus)
  );
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    new: "New",
    in_review: "In Review",
    planned: "Planned",
    completed: "Completed",
    dismissed: "Dismissed",
  };
  return labels[status];
}

export function validateAdminReplyInput(
  input: Record<string, unknown>
): AdminReplyInput {
  const status = input.status;
  const adminReply =
    typeof input.adminReply === "string" ? input.adminReply.trim() : "";

  if (!isFeedbackStatus(status)) {
    return { ok: false, error: "Choose a valid feedback status." };
  }

  if (adminReply.length > 2000) {
    return { ok: false, error: "Reply must be 2000 characters or fewer." };
  }

  return {
    ok: true,
    value: {
      status,
      adminReply: adminReply || null,
    },
  };
}

export function getFeedbackUserName(
  profile: FeedbackProfile | null | undefined,
  fallbackEmail: string | null | undefined
): string {
  return (
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    fallbackEmail?.split("@")[0] ||
    "Advora user"
  );
}

export async function createFeedbackScreenshotSignedUrl(
  supabase: SupabaseClient,
  screenshotPath: string | null
): Promise<string | null> {
  if (!screenshotPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("feedback-screenshots")
    .createSignedUrl(screenshotPath, 60 * 15);

  if (error) {
    console.error("Feedback screenshot signed URL failed:", error);
    return null;
  }

  return data.signedUrl;
}

export function feedbackTicketFromRow(
  row: FeedbackRow,
  profile: FeedbackProfile | null | undefined,
  screenshotUrl: string | null
): FeedbackTicket {
  const email = profile?.email ?? "";
  const rating = Math.min(5, Math.max(1, row.rating)) as FeedbackRating;

  return {
    id: row.id,
    userId: row.user_id,
    userName: getFeedbackUserName(profile, email),
    email,
    category: row.category,
    categoryLabel: getFeedbackCategoryLabel(row.category),
    subject: row.subject,
    message: row.message,
    screenshotPath: row.screenshot_url,
    screenshotUrl,
    rating,
    reaction: row.reaction,
    reactionLabel: getFeedbackReactionLabel(row.reaction),
    status: row.status,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function computeFeedbackAnalytics(rows: FeedbackRow[]): FeedbackAnalytics {
  const totalFeedback = rows.length;
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const weeklyFeedback = rows.filter(
    (row) => new Date(row.created_at).getTime() >= weekAgo
  ).length;
  const monthlyFeedback = rows.filter(
    (row) => new Date(row.created_at).getTime() >= monthAgo
  ).length;

  const averageRating =
    totalFeedback === 0
      ? 0
      : rows.reduce((sum, row) => sum + row.rating, 0) / totalFeedback;

  const ratingCounts = new Map<number, number>();
  for (const rating of [1, 2, 3, 4, 5] as const) {
    ratingCounts.set(rating, 0);
  }
  for (const row of rows) {
    const rating = Math.min(5, Math.max(1, row.rating));
    ratingCounts.set(rating, (ratingCounts.get(rating) ?? 0) + 1);
  }

  const ratingDistribution = ([1, 2, 3, 4, 5] as const).map((rating) => ({
    rating,
    label: rating === 1 ? "Very Poor" : rating === 2 ? "Poor" : rating === 3 ? "Average" : rating === 4 ? "Good" : "Excellent",
    count: ratingCounts.get(rating) ?? 0,
    percent:
      totalFeedback === 0
        ? 0
        : Math.round(((ratingCounts.get(rating) ?? 0) / totalFeedback) * 100),
  }));

  const reactionCounts = new Map<FeedbackReaction, number>();
  for (const row of rows) {
    reactionCounts.set(
      row.reaction,
      (reactionCounts.get(row.reaction) ?? 0) + 1
    );
  }

  const reactionsWithData = [...reactionCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const reactionTotal = reactionsWithData.reduce((sum, [, count]) => sum + count, 0);

  const reactionDistribution = reactionsWithData.map(([reaction, count]) => ({
    reaction,
    label: getFeedbackReactionLabel(reaction),
    count,
    percent:
      reactionTotal === 0 ? 0 : Math.round((count / reactionTotal) * 100),
  }));

  const categoryCounts = new Map<FeedbackCategory, number>();
  const statusCounts = Object.fromEntries(
    FEEDBACK_STATUSES.map((status) => [status, 0])
  ) as Record<FeedbackStatus, number>;

  for (const row of rows) {
    categoryCounts.set(
      row.category,
      (categoryCounts.get(row.category) ?? 0) + 1
    );
    if (isFeedbackStatus(row.status)) {
      statusCounts[row.status] += 1;
    }
  }

  const topCategoryEntry = [...categoryCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];

  const mostSelectedReaction = reactionDistribution[0]
    ? {
        reaction: reactionDistribution[0].reaction,
        label: reactionDistribution[0].label,
        percent: reactionDistribution[0].percent,
      }
    : null;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalFeedback,
    mostSelectedReaction,
    topCategory: topCategoryEntry
      ? {
          category: topCategoryEntry[0],
          label: getFeedbackCategoryLabel(topCategoryEntry[0]),
          count: topCategoryEntry[1],
        }
      : null,
    weeklyFeedback,
    monthlyFeedback,
    statusCounts,
    ratingDistribution,
    reactionDistribution,
  };
}
