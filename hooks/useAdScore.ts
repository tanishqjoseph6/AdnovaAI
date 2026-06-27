"use client";

import { useCallback, useState } from "react";
import { scoreGeneratedAds } from "@/lib/api/score-generated-ads-client";
import type { AdScoreAnalysis, GeneratedAdsPayload } from "@/lib/ad-score/types";

export type AdScoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; analysis: AdScoreAnalysis }
  | { status: "error"; message: string };

export function useAdScore() {
  const [state, setState] = useState<AdScoreState>({ status: "idle" });

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const analyze = useCallback(async (payload: GeneratedAdsPayload) => {
    setState({ status: "loading" });

    try {
      const analysis = await scoreGeneratedAds(payload);
      setState({ status: "success", analysis });
      return analysis;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to analyze ad score. Please try again.";
      setState({ status: "error", message });
      throw error;
    }
  }, []);

  return {
    state,
    analyze,
    reset,
    isLoading: state.status === "loading",
    analysis: state.status === "success" ? state.analysis : null,
    error: state.status === "error" ? state.message : null,
  };
}
