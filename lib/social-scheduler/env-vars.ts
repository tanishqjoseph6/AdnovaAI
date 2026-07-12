/**
 * Canonical Social Scheduler OAuth environment variable names.
 * Keep in sync with `.env.example`.
 */
export const SOCIAL_OAUTH_ENV = {
  X_CLIENT_ID: "X_CLIENT_ID",
  X_CLIENT_SECRET: "X_CLIENT_SECRET",
  LINKEDIN_CLIENT_ID: "LINKEDIN_CLIENT_ID",
  LINKEDIN_CLIENT_SECRET: "LINKEDIN_CLIENT_SECRET",
} as const;

export type SocialOAuthEnvKey =
  (typeof SOCIAL_OAUTH_ENV)[keyof typeof SOCIAL_OAUTH_ENV];

export function readSocialOAuthEnv(name: SocialOAuthEnvKey): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isSocialOAuthEnvConfigured(
  clientIdKey: SocialOAuthEnvKey,
  clientSecretKey: SocialOAuthEnvKey
): boolean {
  return Boolean(
    readSocialOAuthEnv(clientIdKey) && readSocialOAuthEnv(clientSecretKey)
  );
}
