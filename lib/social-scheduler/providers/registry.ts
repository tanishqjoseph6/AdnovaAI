import { linkedinProvider } from "@/lib/social-scheduler/providers/linkedin";
import { xProvider } from "@/lib/social-scheduler/providers/x";
import { comingSoonProviders } from "@/lib/social-scheduler/providers/coming-soon";
import type { SocialProvider } from "@/lib/social-scheduler/providers/types";
import {
  isAvailablePlatform,
  type AvailablePlatform,
  type SocialPlatform,
} from "@/lib/social-scheduler/types";

const providers: Record<SocialPlatform, SocialProvider> = {
  x: xProvider,
  linkedin: linkedinProvider,
  instagram: comingSoonProviders.instagram,
  facebook: comingSoonProviders.facebook,
  threads: comingSoonProviders.threads,
  tiktok: comingSoonProviders.tiktok,
  youtube: comingSoonProviders.youtube,
  pinterest: comingSoonProviders.pinterest,
};

export function getSocialProvider(platform: SocialPlatform): SocialProvider {
  return providers[platform];
}

export function getAvailableProvider(
  platform: AvailablePlatform
): SocialProvider {
  return providers[platform];
}

export function assertAvailableProvider(
  platform: SocialPlatform
): asserts platform is AvailablePlatform {
  if (!isAvailablePlatform(platform)) {
    throw new Error("This platform is not available yet.");
  }
}

export { providers as socialProviders };
