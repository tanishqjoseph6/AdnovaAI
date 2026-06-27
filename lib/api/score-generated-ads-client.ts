import { ApiClientError } from "@/lib/api/credits-client";
import {
  normalizeAdScoreAnalysis,
  type AdScoreAnalysis,
  type GeneratedAdsPayload,
} from "@/lib/ad-score/types";

export async function scoreGeneratedAds(
  payload: GeneratedAdsPayload
): Promise<AdScoreAnalysis> {
  const response = await fetch("/api/score-generated-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: { analysis?: unknown; error?: string };

  try {
    body = await response.json();
  } catch {
    throw new ApiClientError(
      "Server returned an invalid response. Please try again.",
      0
    );
  }

  if (!response.ok) {
    const message =
      typeof body.error === "string"
        ? body.error
        : "Failed to score generated ads";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(message, response.status);
  }

  const analysis = normalizeAdScoreAnalysis(body.analysis);
  if (!analysis) {
    throw new ApiClientError(
      "AI returned an invalid ad score. Please try again.",
      500
    );
  }

  return analysis;
}
