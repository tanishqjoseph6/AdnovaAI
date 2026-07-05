"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import ReactionPicker from "@/components/feedback/ReactionPicker";
import StarRating from "@/components/feedback/StarRating";
import {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
  type FeedbackCategory,
  type FeedbackRating,
  type FeedbackReaction,
} from "@/lib/feedback/validation";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type FeedbackFormValues = {
  category: FeedbackCategory;
  rating: FeedbackRating | null;
  reaction: FeedbackReaction | null;
  subject: string;
  message: string;
  screenshot: File | null;
};

type FeedbackFormProps = {
  initialCategory?: FeedbackCategory;
  submitting: boolean;
  onSubmit: (formData: FormData) => Promise<boolean>;
  onSuccess?: () => void;
  compact?: boolean;
};

const DEFAULT_CATEGORY: FeedbackCategory = "general_feedback";

export function createEmptyFeedbackForm(
  category: FeedbackCategory = DEFAULT_CATEGORY
): FeedbackFormValues {
  return {
    category,
    rating: null,
    reaction: null,
    subject: "",
    message: "",
    screenshot: null,
  };
}

export default function FeedbackForm({
  initialCategory = DEFAULT_CATEGORY,
  submitting,
  onSubmit,
  onSuccess,
  compact = false,
}: FeedbackFormProps) {
  const [values, setValues] = useState<FeedbackFormValues>(() =>
    createEmptyFeedbackForm(initialCategory)
  );
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  useEffect(() => {
    setValues((current) => ({ ...current, category: initialCategory }));
  }, [initialCategory]);

  useEffect(() => {
    if (!values.screenshot) {
      setScreenshotPreview(null);
      return;
    }

    const url = URL.createObjectURL(values.screenshot);
    setScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [values.screenshot]);

  function resetForm() {
    setValues(createEmptyFeedbackForm(initialCategory));
    setRatingError(null);
    setReactionError(null);
    setScreenshotError(null);
  }

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setScreenshotError(null);

    if (!file) {
      setValues((current) => ({ ...current, screenshot: null }));
      return;
    }

    if (!ALLOWED_SCREENSHOT_TYPES.has(file.type)) {
      setScreenshotError("Screenshot must be a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotError("Screenshot must be 5MB or smaller.");
      return;
    }

    setValues((current) => ({ ...current, screenshot: file }));
  }

  function clearScreenshot() {
    setValues((current) => ({ ...current, screenshot: null }));
    setScreenshotError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRatingError(null);
    setReactionError(null);

    let hasError = false;
    if (!values.rating) {
      setRatingError("Please rate your experience before submitting.");
      hasError = true;
    }
    if (!values.reaction) {
      setReactionError("Please select how your experience felt.");
      hasError = true;
    }
    if (hasError || submitting) return;

    const formData = new FormData();
    formData.set("category", values.category);
    formData.set("subject", values.subject.trim());
    formData.set("message", values.message.trim());
    formData.set("rating", String(values.rating));
    formData.set("reaction", values.reaction!);
    if (values.screenshot) {
      formData.set("screenshot", values.screenshot);
    }

    const submitted = await onSubmit(formData);
    if (submitted) {
      resetForm();
      onSuccess?.();
    }
  }

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60";
  const labelClassName = "text-sm font-medium text-zinc-200";

  return (
    <form className={compact ? "space-y-5" : "space-y-6"} onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <p className={labelClassName}>
          Rate your experience <span className="text-red-400">*</span>
        </p>
        <div className="mt-4">
          <StarRating
            value={values.rating}
            onChange={(rating) => {
              setValues((current) => ({ ...current, rating }));
              setRatingError(null);
            }}
            disabled={submitting}
            error={ratingError}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <p className={labelClassName}>
          Quick reaction <span className="text-red-400">*</span>
        </p>
        <div className="mt-4">
          <ReactionPicker
            value={values.reaction}
            onChange={(reaction) => {
              setValues((current) => ({ ...current, reaction }));
              setReactionError(null);
            }}
            disabled={submitting}
            error={reactionError}
          />
        </div>
      </section>

      <label className="block">
        <span className={labelClassName}>Category</span>
        <select
          value={values.category}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              category: event.target.value as FeedbackCategory,
            }))
          }
          disabled={submitting}
          className={inputClassName}
        >
          {FEEDBACK_CATEGORIES.map((option) => (
            <option key={option} value={option} className="bg-[#09031f]">
              {getFeedbackCategoryLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClassName}>Subject</span>
        <input
          value={values.subject}
          onChange={(event) =>
            setValues((current) => ({ ...current, subject: event.target.value }))
          }
          disabled={submitting}
          required
          minLength={3}
          maxLength={120}
          placeholder="Short summary"
          className={inputClassName}
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Description</span>
        <textarea
          value={values.message}
          onChange={(event) =>
            setValues((current) => ({ ...current, message: event.target.value }))
          }
          disabled={submitting}
          required
          minLength={10}
          maxLength={2000}
          rows={compact ? 4 : 5}
          placeholder="Tell us what happened or what you'd like to see improved."
          className={`${inputClassName} resize-none leading-relaxed`}
        />
      </label>

      <div>
        <span className={labelClassName}>
          Screenshot upload <span className="text-zinc-500">(optional)</span>
        </span>
        <label className="mt-2 flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-zinc-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.04]">
          <Upload className="h-5 w-5 shrink-0 text-cyan-300" />
          <span className="min-w-0 flex-1">
            {values.screenshot
              ? values.screenshot.name
              : "PNG, JPG, or WebP up to 5MB"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleScreenshotChange}
            disabled={submitting}
            className="sr-only"
          />
        </label>
        {screenshotError ? (
          <p role="alert" className="mt-2 text-sm text-red-300">
            {screenshotError}
          </p>
        ) : null}
        {screenshotPreview ? (
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotPreview}
              alt="Screenshot preview"
              className="max-h-48 w-full object-contain"
            />
            <button
              type="button"
              onClick={clearScreenshot}
              disabled={submitting}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 p-2 text-zinc-300 transition hover:text-white"
              aria-label="Remove screenshot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Submitting...
          </>
        ) : (
          "Submit Feedback"
        )}
      </button>
    </form>
  );
}
