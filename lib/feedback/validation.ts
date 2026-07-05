export const FEEDBACK_CATEGORIES = [
  "bug_report",
  "feature_request",
  "improvement_suggestion",
  "general_feedback",
  "ui_ux",
  "performance",
  "ai_output_quality",
  "billing",
  "account_login",
  "mobile_experience",
] as const;

export const FEEDBACK_REACTIONS = [
  "loved_it",
  "amazing",
  "okay",
  "needs_improvement",
  "frustrating",
] as const;

export const FEEDBACK_RATINGS = [1, 2, 3, 4, 5] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackReaction = (typeof FEEDBACK_REACTIONS)[number];
export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];

export type FeedbackInput = {
  category: FeedbackCategory;
  subject: string;
  message: string;
  rating: FeedbackRating;
  reaction: FeedbackReaction;
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: "🐞 Bug Report",
  feature_request: "💡 Feature Request",
  improvement_suggestion: "✨ Improvement Suggestion",
  general_feedback: "❤️ General Feedback",
  ui_ux: "🎨 UI / UX",
  performance: "⚡ Performance",
  ai_output_quality: "🤖 AI Output Quality",
  billing: "💳 Billing",
  account_login: "🔐 Account & Login",
  mobile_experience: "📱 Mobile Experience",
};

const REACTION_LABELS: Record<FeedbackReaction, string> = {
  loved_it: "😊 Loved it",
  amazing: "😍 Amazing",
  okay: "😐 It's okay",
  needs_improvement: "😕 Needs improvement",
  frustrating: "😞 Frustrating",
};

const RATING_LABELS: Record<FeedbackRating, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
  return CATEGORY_LABELS[category];
}

export function getFeedbackReactionLabel(reaction: FeedbackReaction): string {
  return REACTION_LABELS[reaction];
}

export function getFeedbackRatingLabel(rating: FeedbackRating): string {
  return RATING_LABELS[rating];
}

export function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return (
    typeof value === "string" &&
    FEEDBACK_CATEGORIES.includes(value as FeedbackCategory)
  );
}

export function isFeedbackReaction(value: unknown): value is FeedbackReaction {
  return (
    typeof value === "string" &&
    FEEDBACK_REACTIONS.includes(value as FeedbackReaction)
  );
}

export function isFeedbackRating(value: unknown): value is FeedbackRating {
  if (typeof value === "number") {
    return FEEDBACK_RATINGS.includes(value as FeedbackRating);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && FEEDBACK_RATINGS.includes(parsed as FeedbackRating);
  }

  return false;
}

export function validateFeedbackInput(input: Record<string, unknown>):
  | { ok: true; value: FeedbackInput }
  | { ok: false; error: string } {
  const category = input.category;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const ratingValue =
    typeof input.rating === "number"
      ? input.rating
      : typeof input.rating === "string"
        ? Number(input.rating)
        : null;
  const reaction = input.reaction;

  if (!isFeedbackCategory(category)) {
    return { ok: false, error: "Choose a valid feedback category." };
  }

  if (!isFeedbackRating(ratingValue)) {
    return { ok: false, error: "Select a star rating before submitting." };
  }

  if (!isFeedbackReaction(reaction)) {
    return { ok: false, error: "Select how your experience felt." };
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
      rating: ratingValue,
      reaction,
    },
  };
}
