import { createHash, randomBytes } from "node:crypto";
import type { AvailablePlatform } from "@/lib/social-scheduler/types";

export type OAuthStatePayload = {
  platform: AvailablePlatform;
  userId: string;
  codeVerifier: string;
  returnTo: string;
};

const OAUTH_COOKIE = "advora_social_oauth";
const OAUTH_TTL_MS = 10 * 60 * 1000;

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export function generateCodeChallenge(codeVerifier: string): string {
  return base64UrlEncode(
    createHash("sha256").update(codeVerifier).digest()
  );
}

export function generateOAuthState(): string {
  return base64UrlEncode(randomBytes(24));
}

export function encodeOAuthCookie(payload: OAuthStatePayload): string {
  return Buffer.from(
    JSON.stringify({ ...payload, expiresAt: Date.now() + OAUTH_TTL_MS })
  ).toString("base64url");
}

export function decodeOAuthCookie(
  value: string | undefined
): OAuthStatePayload | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as OAuthStatePayload & { expiresAt?: number };

    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }

    if (!parsed.platform || !parsed.userId || !parsed.codeVerifier) {
      return null;
    }

    return {
      platform: parsed.platform,
      userId: parsed.userId,
      codeVerifier: parsed.codeVerifier,
      returnTo: parsed.returnTo ?? "/dashboard/social-scheduler",
    };
  } catch {
    return null;
  }
}

export function getOAuthCookieName(): string {
  return OAUTH_COOKIE;
}

export function getSiteOrigin(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function buildOAuthCallbackUrl(platform: AvailablePlatform): string {
  return `${getSiteOrigin()}/api/social-connections/${platform}/callback`;
}
