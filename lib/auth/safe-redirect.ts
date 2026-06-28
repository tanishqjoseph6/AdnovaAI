const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function resolveSafeAuthRedirect(
  next: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT
): string {
  if (!next) {
    return fallback;
  }

  const trimmed = next.trim();

  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://")
  ) {
    return fallback;
  }

  return trimmed;
}
