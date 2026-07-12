import type { AvailablePlatform } from "@/lib/social-scheduler/types";
import {
  isSocialOAuthEnvConfigured,
  SOCIAL_OAUTH_ENV,
} from "@/lib/social-scheduler/env-vars";

export type SocialOAuthStatus = Record<AvailablePlatform, boolean>;

export function getSocialOAuthStatus(): SocialOAuthStatus {
  return {
    x: isSocialOAuthEnvConfigured(
      SOCIAL_OAUTH_ENV.X_CLIENT_ID,
      SOCIAL_OAUTH_ENV.X_CLIENT_SECRET
    ),
    linkedin: isSocialOAuthEnvConfigured(
      SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_ID,
      SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_SECRET
    ),
  };
}

export function isPlatformOAuthConfigured(
  platform: AvailablePlatform,
  status: SocialOAuthStatus
): boolean {
  return status[platform];
}

export function isOAuthFullyConfigured(status: SocialOAuthStatus): boolean {
  return status.x && status.linkedin;
}

export function isAnyPlatformOAuthConfigured(status: SocialOAuthStatus): boolean {
  return status.x || status.linkedin;
}
