import { ApiClientError } from "@/lib/api/credits-client";
import { normalizeThumbnailResult } from "@/lib/thumbnail/normalize";
import type {
  ThumbnailInput,
  ThumbnailResult,
  ThumbnailTemplate,
} from "@/lib/thumbnail/types";

export type GenerateThumbnailResponse = {
  result: ThumbnailResult;
  thumbnailId: string | null;
  credits: number | null;
  saved: boolean;
};

export async function generateThumbnail(
  input: ThumbnailInput
): Promise<GenerateThumbnailResponse> {
  const response = await fetch("/api/generate-thumbnail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: {
    result?: unknown;
    thumbnailId?: string | null;
    credits?: number | null;
    saved?: boolean;
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
        : "Failed to generate thumbnails";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(
      message,
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  const result = normalizeThumbnailResult(payload.result);
  if (!result) {
    throw new ApiClientError(
      "AI returned invalid thumbnail data. Please try again.",
      500
    );
  }

  return {
    result,
    thumbnailId:
      typeof payload.thumbnailId === "string" ? payload.thumbnailId : null,
    credits: typeof payload.credits === "number" ? payload.credits : null,
    saved: payload.saved === true,
  };
}

export async function listThumbnailTemplates(): Promise<ThumbnailTemplate[]> {
  const response = await fetch("/api/thumbnail-templates", {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiClientError(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to load templates",
      response.status
    );
  }

  return Array.isArray(payload.templates) ? payload.templates : [];
}

export async function saveThumbnailTemplate(input: {
  name: string;
  format: ThumbnailInput["format"];
  prompt: string;
  brandName: string;
  brandColors: ThumbnailInput["brandColors"];
  productUrl?: string;
  previewImageUrl?: string | null;
}): Promise<ThumbnailTemplate> {
  const response = await fetch("/api/thumbnail-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.template) {
    throw new ApiClientError(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to save template",
      response.status
    );
  }

  return payload.template as ThumbnailTemplate;
}
