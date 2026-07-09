"use client";

import Link from "next/link";
import {
  creditsProgressPercent,
  formatCreditsBreakdown,
  resolveCreditsMax,
} from "@/lib/credits/display";

type BillingCreditsProgressProps = {
  credits: number;
  monthlyCredits?: number;
  purchasedCredits?: number;
  maxCredits: number | null;
  embedded?: boolean;
};

export default function BillingCreditsProgress({
  credits,
  monthlyCredits = 0,
  purchasedCredits = 0,
  maxCredits,
  embedded = false,
}: BillingCreditsProgressProps) {
  const max = resolveCreditsMax(maxCredits, credits);
  const progress = creditsProgressPercent(credits, maxCredits);
  const remainingLabel = `${credits} / ${max}`;
  const depleted = credits === 0;

  return (
    <div className={embedded ? "flex flex-1 flex-col" : undefined}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Remaining credits
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {remainingLabel}
        </p>
        {depleted && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            Depleted
          </span>
        )}
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={credits}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label="Credits remaining"
        />
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        {formatCreditsBreakdown(monthlyCredits, purchasedCredits)}. Monthly
        credits refresh every 30 days; purchased credits never expire.
      </p>

      {depleted && (
        <Link
          href="/dashboard/billing#credit-packs"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 sm:w-auto"
        >
          Buy More Credits
        </Link>
      )}
    </div>
  );
}
