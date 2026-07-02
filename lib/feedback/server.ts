import type { SupabaseClient } from "@supabase/supabase-js";
import { getFeedbackCategoryLabel, type FeedbackCategory } from "./validation";

export type FeedbackStatus = "open" | "reviewed" | "closed";

export type FeedbackRow = {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  screenshot_url: string | null;
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

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return value === "open" || value === "reviewed" || value === "closed";
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  if (status === "open") return "Open";
  if (status === "reviewed") return "Reviewed";
  return "Closed";
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

  if ((status === "reviewed" || status === "closed") && adminReply.length < 2) {
    return {
      ok: false,
      error: "Add a reply before marking feedback as reviewed or closed.",
    };
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
    status: row.status,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
