"use client";

import { motion } from "framer-motion";
import {
  FEEDBACK_REACTIONS,
  getFeedbackReactionLabel,
  type FeedbackReaction,
} from "@/lib/feedback/validation";

type ReactionPickerProps = {
  value: FeedbackReaction | null;
  onChange: (reaction: FeedbackReaction) => void;
  disabled?: boolean;
  error?: string | null;
};

const REACTION_EMOJI: Record<FeedbackReaction, string> = {
  loved_it: "😊",
  amazing: "😍",
  okay: "😐",
  needs_improvement: "😕",
  frustrating: "😞",
};

export default function ReactionPicker({
  value,
  onChange,
  disabled = false,
  error,
}: ReactionPickerProps) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FEEDBACK_REACTIONS.map((reaction) => {
          const selected = value === reaction;
          const label = getFeedbackReactionLabel(reaction);
          const emoji = REACTION_EMOJI[reaction];

          return (
            <motion.button
              key={reaction}
              type="button"
              disabled={disabled}
              onClick={() => onChange(reaction)}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
              className={`flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-violet-400/40 bg-gradient-to-r from-violet-500/15 to-cyan-400/10 text-white shadow-lg shadow-violet-500/15"
                  : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <motion.span
                animate={selected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-xl"
              >
                {emoji}
              </motion.span>
              <span>{label.replace(/^[^\s]+\s/, "")}</span>
            </motion.button>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
