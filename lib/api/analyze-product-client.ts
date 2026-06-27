import { ApiClientError } from "@/lib/api/credits-client";
import {
  normalizeProductAnalysis,
  type ProductAnalysis,
} from "@/lib/product-analysis/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function fileToBase64Payload(
  file: File
): Promise<{ image: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    image: btoa(binary),
    mimeType: file.type,
  };
}

export async function analyzeProductImage(
  file: File
): Promise<ProductAnalysis> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ApiClientError(
      "Only JPG, PNG, WebP, and GIF images are supported.",
      400
    );
  }

  const { image, mimeType } = await fileToBase64Payload(file);

  const response = await fetch("/api/analyze-product-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mimeType }),
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
        : "Failed to analyze product image";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(message, response.status);
  }

  const analysis = normalizeProductAnalysis(payload.analysis);
  if (!analysis) {
    throw new ApiClientError(
      "AI returned an invalid analysis. You can edit the fields manually.",
      500
    );
  }

  return analysis;
}
