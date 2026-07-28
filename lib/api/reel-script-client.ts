import { ApiClientError } from "@/lib/api/credits-client";
import type {
  ReelScriptInput,
  ReelScriptResult,
} from "@/lib/reel-script/types";
import { normalizeReelScriptResult } from "@/lib/reel-script/normalize";

export type GenerateReelScriptResponse = {
  result: ReelScriptResult;
  scriptId: string | null;
  credits: number | null;
  saved: boolean;
};

export async function generateReelScript(
  input: ReelScriptInput
): Promise<GenerateReelScriptResponse> {
  const response = await fetch("/api/generate-reel-script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: {
    result?: unknown;
    scriptId?: string | null;
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
        : "Failed to generate reel script";

    if (response.status === 401) {
      throw new ApiClientError("Session expired. Please log in again.", 401);
    }

    throw new ApiClientError(
      message,
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  const result = normalizeReelScriptResult(payload.result);
  if (!result) {
    throw new ApiClientError(
      "AI returned an invalid reel script. Please try again.",
      500
    );
  }

  return {
    result,
    scriptId:
      typeof payload.scriptId === "string" ? payload.scriptId : null,
    credits: typeof payload.credits === "number" ? payload.credits : null,
    saved: payload.saved === true,
  };
}
