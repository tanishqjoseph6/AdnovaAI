import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { getProductionSiteUrl } from "@/lib/site-url";

/**
 * Builds an absolute auth callback URL for Supabase email links.
 * Always uses the production site origin — never localhost in production builds.
 */
export function getAuthCallbackUrl(next = "/dashboard"): string {
  const origin = getProductionSiteUrl();
  const safeNext = resolveSafeAuthRedirect(next);
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function getPasswordResetCallbackUrl(): string {
  return getAuthCallbackUrl("/reset-password");
}

/** Redirect URLs that must be allowlisted in Supabase Auth → URL Configuration. */
export const SUPABASE_AUTH_REDIRECT_ALLOWLIST = [
  "https://useadvora.com/auth/callback",
  "https://useadvora.com/auth/callback?next=%2Fdashboard",
  "https://useadvora.com/auth/callback?next=%2Freset-password",
  "https://useadvora.com/reset-password",
] as const;
