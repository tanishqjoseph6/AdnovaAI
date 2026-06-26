import type { GenerateAdsResponse } from "@/lib/validations/generate-ads";

type ApiErrorPayload = {
  error: string;
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
};

function normalizeGenerateAdsResponse(
  payload: RawGenerateAdsPayload
): GenerateAdsResponse & { ctas: string[] } {
  return {
    hooks: payload.hooks ?? payload.ad_hooks ?? [],
    captions: payload.captions ?? payload.ad_captions ?? [],
    ctas: payload.ctas ?? [],
    ugcScript: payload.ugcScript ?? payload.ugc_script ?? "",
  };
}

export async function fetchGeneratedAds(
  productDescription: string
): Promise<GenerateAdsResponse & { ctas: string[] }> {
  const response = await fetch("/api/generate-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productDescription }),
  });

  let payload: (RawGenerateAdsPayload & ApiErrorPayload) | ApiErrorPayload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("Server returned an invalid response. Please try again.");
  }

  if (!response.ok) {
    const message =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to generate ads";
    throw new Error(message);
  }

  return normalizeGenerateAdsResponse(payload as RawGenerateAdsPayload);
}
