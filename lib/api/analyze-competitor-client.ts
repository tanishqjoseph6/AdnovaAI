import { ApiClientError } from "@/lib/api/credits-client";
import {
  normalizeCompetitorAdAnalysis,
  type CompetitorAdAnalysis,
} from "@/lib/competitor-ad/types";
import { fileToBase64Payload } from "@/lib/shared/image-payload";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function analyzeCompetitorAd(
  file: File
): Promise<CompetitorAdAnalysis> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ApiClientError(
      "Only JPG, PNG, and WebP images are supported.",
      400
    );
  }

  const { image, mimeType } = await fileToBase64Payload(file);

  const response = await fetch("/api/analyze-competitor-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      mimeType,
      imageName: file.name,
    }),
  });

  let payload: { analysis?: unknown; error?: string; code?: string };

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
        : "Failed to analyze competitor ad";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(
      message,
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  const analysis = normalizeCompetitorAdAnalysis(payload.analysis);
  if (!analysis) {
    throw new ApiClientError(
      "AI returned an invalid analysis. Please try another image.",
      500
    );
  }

  return analysis;
}
