import type { SocialPlatform } from "@/lib/social-scheduler/types";
import { PLATFORM_META } from "@/lib/social-scheduler/types";
import type { SocialProvider } from "@/lib/social-scheduler/providers/types";

function createComingSoonProvider(platform: SocialPlatform): SocialProvider {
  const meta = PLATFORM_META[platform];

  return {
    platform,
    isAvailable: false,
    characterLimit: meta.characterLimit,
    supportsImages: meta.supportsImages,
    oauthScopes: [],
    buildAuthorizeUrl() {
      throw new Error(`${meta.label} integration is coming soon.`);
    },
    async exchangeCode() {
      throw new Error(`${meta.label} integration is coming soon.`);
    },
    async refreshAccessToken() {
      throw new Error(`${meta.label} integration is coming soon.`);
    },
    async fetchProfile() {
      throw new Error(`${meta.label} integration is coming soon.`);
    },
    async publishPost() {
      throw new Error(`${meta.label} integration is coming soon.`);
    },
  };
}

export const comingSoonProviders = {
  instagram: createComingSoonProvider("instagram"),
  facebook: createComingSoonProvider("facebook"),
  threads: createComingSoonProvider("threads"),
  tiktok: createComingSoonProvider("tiktok"),
  youtube: createComingSoonProvider("youtube"),
  pinterest: createComingSoonProvider("pinterest"),
} as const;
