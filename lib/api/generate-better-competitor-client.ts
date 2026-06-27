import { ApiClientError, isNoCreditsError } from "@/lib/api/credits-client";
import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import {
  normalizeBetterCompetitorAd,
  type BetterCompetitorAd,
  type CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";

export { isNoCreditsError, CREDITS_ERROR_CODE };

export async function generateBetterCompetitorAd(
  analysis: CompetitorAdAnalysis
): Promise<BetterCompetitorAd & { credits?: number | null; unlimited?: boolean }> {
  const response = await fetch("/api/generate-better-competitor-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis,
      analysisId: analysis.id,
    }),
  });

  let payload: {
    hooks?: string[];
    captions?: string[];
    ctas?: string[];
    ugcScript?: string;
    ugc_script?: string;
    credits?: number | null;
    unlimited?: boolean;
    error?: string;
    code?: string;
  };

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      "Server returned an invalid response. Please try again.",
      0
    );
  }

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "Failed to generate better ad";
    const code =
      typeof payload.code === "string" ? payload.code : undefined;

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(message, response.status, code);
  }

  const betterAd = normalizeBetterCompetitorAd(payload);
  if (!betterAd) {
    throw new ApiClientError(
      "AI returned invalid ad content. Please try again.",
      500
    );
  }

  return {
    ...betterAd,
    credits: payload.credits,
    unlimited: payload.unlimited,
  };
}
