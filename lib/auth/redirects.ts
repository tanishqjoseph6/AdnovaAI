import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { resolveSiteOrigin } from "@/lib/site-url";

/**
 * Builds an absolute auth callback URL for Supabase email links.
 * Uses request origin in development when NEXT_PUBLIC_SITE_URL is unset.
 */
export function getAuthCallbackUrl(
  next = "/dashboard",
  requestOrigin?: string | null
): string {
  const origin = resolveSiteOrigin(requestOrigin);
  const safeNext = resolveSafeAuthRedirect(next);
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getPasswordResetCallbackUrl(
  requestOrigin?: string | null
): string {
  return getAuthCallbackUrl("/reset-password", requestOrigin);
}

/** Redirect URLs that must be allowlisted in Supabase Auth → URL Configuration. */
export const SUPABASE_AUTH_REDIRECT_ALLOWLIST = [
  "https://useadvora.com/auth/callback",
  "https://useadvora.com/auth/callback?next=%2Fdashboard",
  "https://useadvora.com/auth/callback?next=%2Freset-password",
  "https://useadvora.com/reset-password",
] as const;
