"use client";

import Link from "next/link";
import { useCredits } from "@/hooks/useCredits";
import {
  creditsProgressPercent,
  resolveCreditsMax,
} from "@/lib/credits/display";

export default function CreditsCard() {
  const { credits, isLoading, error, refresh } = useCredits();

  if (isLoading && !credits) {
    return (
      <section className="glass animate-pulse rounded-2xl p-6">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="mt-4 h-8 w-20 rounded bg-white/10" />
        <div className="mt-6 h-2 w-full rounded-full bg-white/10" />
      </section>
    );
  }

  if (error && !credits) {
    return (
      <section className="glass rounded-2xl border border-red-500/20 p-6">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-3 text-sm text-cyan-400 hover:underline"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!credits) {
    return null;
  }

  const max = resolveCreditsMax(credits.maxCredits, credits.credits);
  const progress = creditsProgressPercent(
    credits.credits,
    credits.maxCredits,
    credits.unlimited
  );

  const remainingLabel = credits.unlimited
    ? "Unlimited"
    : `${credits.credits} / ${max}`;

  return (
    <section className="glass relative overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Current plan</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {credits.displayPlan}
            {credits.unlimited && (
              <span className="ml-2 align-middle text-sm font-medium text-violet-300">
                Pro
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Refresh credits"
        >
          Refresh
        </button>
      </div>

      <div className="relative mt-6">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-sm text-zinc-500">Remaining credits</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">
              {remainingLabel}
            </p>
          </div>
          {!credits.unlimited && credits.credits === 0 && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
              Depleted
            </span>
          )}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={credits.unlimited ? max : credits.credits}
            aria-valuemin={0}
            aria-valuemax={credits.unlimited ? max : max}
            aria-label="Credits remaining"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {credits.unlimited
            ? "Pro members enjoy unlimited AI generations."
            : "Each successful generation uses 1 credit."}
        </p>
      </div>

      {!credits.unlimited && (
        <Link
          href="/dashboard/billing"
          className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 sm:w-auto"
        >
          Upgrade to Pro
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      )}
    </section>
  );
}
