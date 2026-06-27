import { ApiClientError } from "@/lib/api/credits-client";
import {
  normalizeLandingPageAnalysis,
  type LandingPageAnalysis,
} from "@/lib/landing-analyzer/types";

export async function analyzeLandingPage(
  url: string
): Promise<LandingPageAnalysis> {
  const response = await fetch("/api/analyze-landing-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  let payload: { analysis?: unknown; error?: string };

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
        : "Failed to analyze landing page";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(message, response.status);
  }

  const analysis = normalizeLandingPageAnalysis(payload.analysis, url.trim());
  if (!analysis) {
    throw new ApiClientError(
      "AI returned an invalid analysis. Please try again.",
      500
    );
  }

  return analysis;
}
