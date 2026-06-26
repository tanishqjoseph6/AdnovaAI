"use client";

import { motion } from "framer-motion";

type BillingCreditsProgressProps = {
  credits: number;
  maxCredits: number | null;
  unlimited: boolean;
  /** When true, renders without an outer card shell (for use inside the hero panel). */
  embedded?: boolean;
};

export default function BillingCreditsProgress({
  credits,
  maxCredits,
  unlimited,
  embedded = false,
}: BillingCreditsProgressProps) {
  const max = maxCredits ?? credits;
  const progress = unlimited
    ? 100
    : max > 0
      ? Math.round((credits / max) * 100)
      : 0;

  const remainingLabel = unlimited ? "Unlimited" : `${credits} / ${max}`;

  const content = (
    <>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Remaining credits
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {remainingLabel}
          </p>
        </div>
        {!unlimited && credits === 0 && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            Depleted
          </span>
        )}
        {unlimited && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
            Pro
          </span>
        )}
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          role="progressbar"
          aria-valuenow={unlimited ? max : credits}
          aria-valuemin={0}
          aria-valuemax={unlimited ? 100 : max}
          aria-label="Credits remaining"
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        {unlimited
          ? "Pro members enjoy unlimited AI generations."
          : "Each successful generation uses 1 credit."}
      </p>
    </>
  );

  if (embedded) {
    return <div className="flex h-full flex-col">{content}</div>;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      {content}
    </div>
  );
}
