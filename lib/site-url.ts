const PRODUCTION_SITE_URL = "https://useadvora.com";
const DEV_FALLBACK_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return PRODUCTION_SITE_URL;
  }

  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return `${url.protocol}//${url.host}`;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Resolves the public site origin for auth redirects and email links.
 * Production never falls back to localhost — uses NEXT_PUBLIC_SITE_URL or useadvora.com.
 */
export function resolveSiteOrigin(requestOrigin?: string | null): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl?.trim()) {
    return normalizeOrigin(envUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  if (requestOrigin?.trim()) {
    const normalized = normalizeOrigin(requestOrigin);
    if (isLocalhostOrigin(normalized) || normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }
  }

  return DEV_FALLBACK_ORIGIN;
}

export function getProductionSiteUrl(): string {
  return resolveSiteOrigin(null);
}
