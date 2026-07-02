export const FEEDBACK_CATEGORIES = [
  "bug_report",
  "feature_request",
  "general_feedback",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export type FeedbackInput = {
  category: FeedbackCategory;
  subject: string;
  message: string;
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: "Bug Report",
  feature_request: "Feature Request",
  general_feedback: "General Feedback",
};

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
  return CATEGORY_LABELS[category];
}

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return (
    typeof value === "string" &&
    FEEDBACK_CATEGORIES.includes(value as FeedbackCategory)
  );
}

export function validateFeedbackInput(input: Record<string, unknown>):
  | { ok: true; value: FeedbackInput }
  | { ok: false; error: string } {
  const category = input.category;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!isFeedbackCategory(category)) {
    return { ok: false, error: "Choose a valid feedback category." };
  }

  if (subject.length < 3 || subject.length > 120) {
    return {
      ok: false,
      error: "Subject must be between 3 and 120 characters.",
    };
  }

  if (message.length < 10 || message.length > 2000) {
    return {
      ok: false,
      error: "Description must be between 10 and 2000 characters.",
    };
  }

  return {
    ok: true,
    value: {
      category,
      subject,
      message,
    },
  };
}
