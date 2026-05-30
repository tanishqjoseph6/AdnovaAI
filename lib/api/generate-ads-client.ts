import type { GenerateAdsResponse } from "@/lib/validations/generate-ads";

type ApiErrorPayload = {
  error: string;
  details?: unknown;
};

export async function fetchGeneratedAds(
  productDescription: string
): Promise<GenerateAdsResponse> {
  const response = await fetch("/api/generate-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productDescription }),
  });

  let payload: (GenerateAdsResponse & ApiErrorPayload) | ApiErrorPayload;

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

  return payload as GenerateAdsResponse;
}
