import type { FeedbackStatus, FeedbackTicket } from "@/lib/feedback/server";
import type { FeedbackCategory, FeedbackRating } from "@/lib/feedback/validation";
import { getFeedbackRatingLabel } from "@/lib/feedback/validation";

export type FeedbackTicketView = FeedbackTicket;

export type AdminFeedbackTicketView = FeedbackTicket & {
  profile: {
    username: string | null;
    fullName: string | null;
  };
};

export function formatFeedbackStatus(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    new: "New",
    in_review: "In Review",
    planned: "Planned",
    completed: "Completed",
    dismissed: "Dismissed",
  };
  return labels[status];
}

export function feedbackStatusClasses(status: FeedbackStatus): string {
  switch (status) {
    case "new":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
    case "in_review":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";
    case "planned":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "completed":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "dismissed":
      return "border-zinc-400/25 bg-zinc-400/10 text-zinc-300";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

export function feedbackCategoryClasses(category: FeedbackCategory): string {
  switch (category) {
    case "bug_report":
      return "border-red-400/25 bg-red-400/10 text-red-200";
    case "feature_request":
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
    case "improvement_suggestion":
      return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
    case "general_feedback":
      return "border-pink-400/25 bg-pink-400/10 text-pink-200";
    case "ui_ux":
      return "border-violet-400/25 bg-violet-400/10 text-violet-200";
    case "performance":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";
    case "ai_output_quality":
      return "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200";
    case "billing":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "account_login":
      return "border-blue-400/25 bg-blue-400/10 text-blue-200";
    case "mobile_experience":
      return "border-indigo-400/25 bg-indigo-400/10 text-indigo-200";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
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

export function formatRatingStars(rating: FeedbackRating): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function getRatingLabel(rating: FeedbackRating): string {
  return getFeedbackRatingLabel(rating);
}
