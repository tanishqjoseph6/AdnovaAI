import type { FeedbackStatus, FeedbackTicket } from "@/lib/feedback/server";
import type { FeedbackCategory } from "@/lib/feedback/validation";

export type FeedbackTicketView = FeedbackTicket;

export type AdminFeedbackTicketView = FeedbackTicket & {
  profile: {
    username: string | null;
    fullName: string | null;
  };
};

export function formatFeedbackStatus(status: FeedbackStatus): string {
  if (status === "open") return "Open";
  if (status === "reviewed") return "Reviewed";
  return "Closed";
}

export function feedbackStatusClasses(status: FeedbackStatus): string {
  if (status === "open") {
    return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
  }

  if (status === "reviewed") {
    return "border-violet-400/25 bg-violet-400/10 text-violet-200";
  }

  return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
}

export function feedbackCategoryClasses(category: FeedbackCategory): string {
  if (category === "bug_report") {
    return "border-red-400/25 bg-red-400/10 text-red-200";
  }

  if (category === "feature_request") {
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }

  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
}

export function formatFeedbackTime(iso: string | null): string {
  if (!iso) {
    return "Not yet";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
