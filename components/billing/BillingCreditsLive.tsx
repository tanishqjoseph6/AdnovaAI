"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BillingCreditsProgress from "@/components/billing/BillingCreditsProgress";
import { useCredits, invalidateCreditsCache } from "@/hooks/useCredits";

type BillingCreditsLiveProps = {
  embedded?: boolean;
};

export default function BillingCreditsLive({
  embedded = false,
}: BillingCreditsLiveProps) {
  const { credits, isLoading, error, refresh } = useCredits();
  const searchParams = useSearchParams();
  const payment = searchParams.get("payment");

  useEffect(() => {
    if (payment === "success") {
      invalidateCreditsCache();
      void refresh();
    }
  }, [payment, refresh]);

  if (isLoading && !credits) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-10 w-24 rounded bg-white/10" />
        <div className="h-2.5 rounded-full bg-white/10" />
      </div>
    );
  }

  if (error && !credits) {
    return (
      <div>
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-2 text-sm text-cyan-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  return (
    <>
      <BillingCreditsProgress
        credits={credits.credits}
        maxCredits={credits.maxCredits}
        unlimited={credits.unlimited}
        embedded={embedded}
      />
      {embedded && (
        <div className="mt-auto border-t border-white/[0.06] pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Usage tip
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {credits.unlimited
              ? "Your Pro plan includes unlimited generations — create as many ads as you need."
              : "Upgrade anytime to unlock more credits and faster generation speeds."}
          </p>
        </div>
      )}
    </>
  );
}
