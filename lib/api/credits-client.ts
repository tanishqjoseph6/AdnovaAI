import { CREDITS_ERROR_CODE } from "@/lib/credits/constants";
import type { CreditsApiResponse } from "@/lib/credits/types";
import type { UserCredits } from "@/lib/credits/types";

export class ApiClientError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export function isNoCreditsError(error: unknown): boolean {
  return (
    error instanceof ApiClientError && error.code === CREDITS_ERROR_CODE
  );
}

export async function fetchCredits(): Promise<CreditsApiResponse> {
  const response = await fetch("/api/credits", {
    method: "GET",
    cache: "no-store",
  });

  let payload: CreditsApiResponse | { error: string };

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      "Network error. Could not load credits.",
      0
    );
  }

  if (!response.ok) {
    const message =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : response.status === 401
          ? "Session expired. Please log in again."
          : "Failed to load credits";
    throw new ApiClientError(message, response.status);
  }

  return payload as CreditsApiResponse;
}

export async function useCredit(): Promise<UserCredits & { deducted: boolean }> {
  const response = await fetch("/api/credits/use", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  let payload: Record<string, unknown> & { error?: string; code?: string };

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError("Network error. Could not use credit.", 0);
  }

  if (!response.ok) {
    throw new ApiClientError(
      typeof payload.error === "string"
        ? payload.error
        : "Failed to use credit",
      response.status,
      typeof payload.code === "string" ? payload.code : undefined
    );
  }

  return payload as UserCredits & { deducted: boolean };
}
