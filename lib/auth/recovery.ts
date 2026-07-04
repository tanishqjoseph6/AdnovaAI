export type RecoveryHashParams = {
  access_token?: string;
  refresh_token?: string;
  type?: string;
};

export function parseAuthHash(hash: string): RecoveryHashParams {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed) {
    return {};
  }

  const params = new URLSearchParams(trimmed);
  return {
    access_token: params.get("access_token") ?? undefined,
    refresh_token: params.get("refresh_token") ?? undefined,
    type: params.get("type") ?? undefined,
  };
}

export function isRecoveryHash(hashParams: RecoveryHashParams): boolean {
  return hashParams.type === "recovery" && Boolean(hashParams.access_token);
}

export function isRecoveryCallback(
  searchParams: Pick<URLSearchParams, "get">
): boolean {
  const type = searchParams.get("type");
  if (type === "recovery") {
    return true;
  }

  const next = searchParams.get("next");
  return next === "/reset-password" || next === "%2Freset-password";
}

export function resolvePostAuthRedirect(
  next: string | null,
  type: string | null,
  fallback = "/dashboard"
): string {
  if (type === "recovery") {
    return "/reset-password";
  }

  if (next === "/reset-password" || next === "%2Freset-password") {
    return "/reset-password";
  }

  if (!next?.trim()) {
    return fallback;
  }

  const trimmed = next.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("://")
  ) {
    return trimmed;
  }

  return fallback;
}

export function buildAuthCallbackPath(code: string, next: string): string {
  return `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
}
