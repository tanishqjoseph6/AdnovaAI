"use client";

import { motion } from "framer-motion";
import type { FeedbackRating } from "@/lib/feedback/validation";
import { getFeedbackRatingLabel } from "@/lib/feedback/validation";

type StarRatingProps = {
  value: FeedbackRating | null;
  onChange: (rating: FeedbackRating) => void;
  disabled?: boolean;
  error?: string | null;
};

export default function StarRating({
  value,
  onChange,
  disabled = false,
  error,
}: StarRatingProps) {
  const activeLabel = value ? getFeedbackRatingLabel(value) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {([1, 2, 3, 4, 5] as const).map((rating) => {
          const active = value !== null && rating <= value;
          return (
            <motion.button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => onChange(rating)}
              whileHover={disabled ? undefined : { scale: 1.08 }}
              whileTap={disabled ? undefined : { scale: 0.95 }}
              aria-label={`Rate ${rating} out of 5 — ${getFeedbackRatingLabel(rating)}`}
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl transition disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:w-14 ${
                active
                  ? "border-amber-400/40 bg-gradient-to-br from-amber-400/20 via-violet-500/15 to-cyan-400/10 text-amber-300 shadow-lg shadow-amber-500/20"
                  : "border-white/10 bg-white/[0.03] text-zinc-600 hover:border-violet-400/30 hover:text-zinc-300"
              }`}
            >
              <span className={active ? "drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]" : ""}>
                ★
              </span>
              {active && value === rating && (
                <motion.span
                  layoutId="star-glow"
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-amber-400/30"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-3 min-h-[1.25rem] text-sm font-medium text-violet-200">
        {activeLabel ? `${"★".repeat(value!)} ${activeLabel}` : "Select a rating"}
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
