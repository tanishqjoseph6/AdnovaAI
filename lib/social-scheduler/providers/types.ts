import type { AvailablePlatform, SocialPlatform } from "@/lib/social-scheduler/types";

export type OAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
};

export type SocialProfile = {
  profileId: string;
  profileUsername: string | null;
  profileName: string | null;
  profileImageUrl: string | null;
};

export type PublishInput = {
  caption: string;
  imageUrl: string | null;
  accessToken: string;
  profileId: string | null;
};

export type PublishResult = {
  externalPostId: string;
  publishedAt: string;
};

export type SocialProvider = {
  platform: SocialPlatform;
  isAvailable: boolean;
  characterLimit: number;
  supportsImages: boolean;
  oauthScopes: string[];
  buildAuthorizeUrl: (params: {
    state: string;
    codeChallenge: string;
    redirectUri: string;
  }) => string;
  exchangeCode: (params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) => Promise<OAuthTokens>;
  refreshAccessToken: (refreshToken: string) => Promise<OAuthTokens>;
  fetchProfile: (accessToken: string) => Promise<SocialProfile>;
  publishPost: (input: PublishInput) => Promise<PublishResult>;
};

export function isAvailableProviderPlatform(
  platform: SocialPlatform
): platform is AvailablePlatform {
  return platform === "x" || platform === "linkedin";
}
