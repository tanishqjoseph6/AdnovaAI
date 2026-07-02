import type { AppNotification } from "@/lib/notifications/types";

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  feedback_id: string | null;
  created_at: string;
};

export function notificationFromRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.message,
    category: "feedback",
    createdAt: row.created_at,
    href: row.feedback_id
      ? `/dashboard/feedback?ticket=${encodeURIComponent(row.feedback_id)}`
      : "/dashboard/feedback",
    read: row.is_read,
  };
}

export function isMissingNotificationsSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const message = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42P01" ||
    candidate.code === "42703" ||
    candidate.code === "PGRST204" ||
    candidate.code === "PGRST205" ||
    /notifications|schema cache|does not exist|column/i.test(message)
  );
}

export function logNotificationStep(
  step: string,
  error: unknown,
  context: Record<string, string | number | boolean | null> = {}
) {
  const details =
    error && typeof error === "object"
      ? {
          code: "code" in error ? String(error.code) : null,
          message: "message" in error ? String(error.message) : null,
          details: "details" in error ? String(error.details) : null,
          hint: "hint" in error ? String(error.hint) : null,
        }
      : { message: String(error) };

  console.error("Notifications system failure:", {
    step,
    ...context,
    ...details,
  });
}
