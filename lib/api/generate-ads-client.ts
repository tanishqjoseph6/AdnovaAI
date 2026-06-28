import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import type { ProductAnalysis } from "@/lib/product-analysis/types";
import type { GenerateAdsResponse } from "@/lib/validations/generate-ads";
import { ApiClientError } from "@/lib/api/credits-client";

type ApiErrorPayload = {
  error: string;
  code?: string;
  details?: unknown;
};

type RawGenerateAdsPayload = {
  hooks?: string[];
  ad_hooks?: string[];
  captions?: string[];
  ad_captions?: string[];
  ctas?: string[];
  ugcScript?: string;
  ugc_script?: string;
  credits?: number | null;
  unlimited?: boolean;
  generationId?: string;
  generatedAt?: string;
};

function normalizeGenerateAdsResponse(
  payload: RawGenerateAdsPayload
): GenerateAdsResponse {
  return {
    hooks: payload.hooks ?? payload.ad_hooks ?? [],
    captions: payload.captions ?? payload.ad_captions ?? [],
    ctas: payload.ctas ?? [],
    ugcScript: payload.ugcScript ?? payload.ugc_script ?? "",
    credits: payload.credits,
    unlimited: payload.unlimited,
    generationId: payload.generationId,
    generatedAt: payload.generatedAt,
  };
}

export { isNoCreditsError } from "@/lib/api/credits-client";
export { CREDITS_ERROR_CODE } from "@/lib/credits/constants";

export async function fetchGeneratedAds(
  productDescription: string,
  productAnalysis?: ProductAnalysis | null
): Promise<GenerateAdsResponse> {
  const response = await fetch("/api/generate-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productDescription,
      productAnalysis: productAnalysis ?? undefined,
    }),
  });

  let payload: (RawGenerateAdsPayload & ApiErrorPayload) | ApiErrorPayload;

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
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to generate ads";
    const code =
      "code" in payload && typeof payload.code === "string"
        ? payload.code
        : undefined;

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(message, response.status, code);
  }

  return normalizeGenerateAdsResponse(payload as RawGenerateAdsPayload);
}
